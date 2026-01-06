using System.Diagnostics;
using System.Text;
using Compilation.Models;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.Extensions.Logging;

namespace Compilation;

public class CompilerService(ILogger<CompilerService> logger) : IDisposable
{
	private readonly List<string> tempDirectories = [];
	private const int TimeoutSeconds = 30;

	public async Task<CompilationResult> RunCompilerContainer(string sourcePath, string mainFile)
	{
		logger.LogInformation("Запуск проекта {MainFile} из {SourcePath}", mainFile, sourcePath);

		var tempDir = CreateTempDirectory();
		tempDirectories.Add(tempDir);

		try
		{
			CopyDirectory(sourcePath, tempDir, true);
			var projectPath = Path.Combine(tempDir, mainFile);

			logger.LogInformation("Компиляция проекта...");
			var compileResult = await ExecuteDotnetCommand(
				"build",
				$"\"{projectPath}\" --verbosity quiet --nologo --configuration Release",
				tempDir,
				TimeSpan.FromSeconds(TimeoutSeconds));

			if (!compileResult.Success)
			{
				return new CompilationResult
				{
					Success = false,
					Output = "",
					Errors =
					[
						new CompilationError
						{
							ErrorCode = "BUILD_ERROR",
							Message = compileResult.Output
						}
					]
				};
			}

			logger.LogInformation("Запуск проекта...");
			var runResult = await ExecuteDotnetCommand(
				"run",
				$"\"{projectPath}\" --no-build --verbosity quiet --configuration Release",
				tempDir,
				TimeSpan.FromSeconds(TimeoutSeconds));

			return new CompilationResult
			{
				Success = runResult.ExitCode == 0,
				Output = runResult.Output,
				Errors = runResult.ExitCode != 0
					?
					[
						new CompilationError
						{
							ErrorCode = "RUNTIME_ERROR",
							Message = runResult.Output
						}
					]
					: []
			};
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Ошибка при запуске проекта {MainFile}", mainFile);
			return new CompilationResult
			{
				Success = false,
				Output = "",
				Errors =
				[
					new CompilationError
					{
						ErrorCode = "EXECUTION_ERROR",
						Message = ex.Message
					}
				]
			};
		}
	}

	public async Task<CompilationResult> CompileOnly(string sourcePath, string mainFile)
	{
		logger.LogInformation("Компиляция проекта {MainFile} из {SourcePath}", mainFile, sourcePath);

		var tempDir = CreateTempDirectory();
		tempDirectories.Add(tempDir);

		try
		{
			CopyDirectory(sourcePath, tempDir, true);
			var projectPath = Path.Combine(tempDir, mainFile);

			var extension = Path.GetExtension(mainFile).ToLowerInvariant();

			switch (extension)
			{
				case ".csproj":
				{
					var result = await ExecuteDotnetCommand(
						"build",
						$"\"{projectPath}\" --verbosity quiet --nologo",
						tempDir,
						TimeSpan.FromSeconds(TimeoutSeconds));

					return new CompilationResult
					{
						Success = result.ExitCode == 0,
						Output = result.Output,
						Errors = result.ExitCode != 0
							?
							[
								new CompilationError
								{
									ErrorCode = "COMPILATION_ERROR",
									Message = result.Output
								}
							]
							: []
					};
				}
				case ".cs":
					return await CompileSingleFileWithRoslyn(tempDir, mainFile);
				default:
					return new CompilationResult
					{
						Success = false,
						Output = "",
						Errors =
						[
							new CompilationError
							{
								ErrorCode = "UNSUPPORTED_FORMAT",
								Message = $"Неподдерживаемый формат файла: {extension}"
							}
						]
					};
			}
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Ошибка при компиляции проекта {MainFile}", mainFile);
			return new CompilationResult
			{
				Success = false,
				Output = "",
				Errors =
				[
					new CompilationError
					{
						ErrorCode = "COMPILATION_ERROR",
						Message = ex.Message
					}
				]
			};
		}
	}

	private async Task<CompilationResult> CompileSingleFileWithRoslyn(string sourcePath, string mainFile)
	{
		try
		{
			var mainFilePath = Path.Combine(sourcePath, mainFile);
			var mainSourceCode = await File.ReadAllTextAsync(mainFilePath);

			var syntaxTree = CSharpSyntaxTree.ParseText(
				mainSourceCode,
				path: mainFilePath,
				encoding: Encoding.UTF8);

			var csFiles = Directory.GetFiles(sourcePath, "*.cs", SearchOption.AllDirectories);
			var syntaxTrees = new List<SyntaxTree> { syntaxTree };

			foreach (var csFile in csFiles)
			{
				if (csFile == mainFilePath) continue;

				var additionalCode = await File.ReadAllTextAsync(csFile);
				var additionalTree = CSharpSyntaxTree.ParseText(
					additionalCode,
					path: csFile,
					encoding: Encoding.UTF8);
				syntaxTrees.Add(additionalTree);
			}

			var references = new[]
			{
				MetadataReference.CreateFromFile(typeof(object).Assembly.Location),
				MetadataReference.CreateFromFile(typeof(Console).Assembly.Location),
				MetadataReference.CreateFromFile(typeof(System.Runtime.AssemblyTargetedPatchBandAttribute).Assembly.Location),
				MetadataReference.CreateFromFile(typeof(Microsoft.CSharp.RuntimeBinder.CSharpArgumentInfo).Assembly.Location),
				MetadataReference.CreateFromFile(typeof(Enumerable).Assembly.Location)
			};

			var compilation = CSharpCompilation.Create(
				assemblyName: Path.GetFileNameWithoutExtension(mainFile),
				syntaxTrees: syntaxTrees,
				references: references,
				options: new CSharpCompilationOptions(OutputKind.ConsoleApplication));

			var outputPath = Path.Combine(sourcePath, Path.GetFileNameWithoutExtension(mainFile) + ".dll");
			var emitResult = compilation.Emit(outputPath);

			if (emitResult.Success)
			{
				return new CompilationResult
				{
					Success = true,
					Output = $"Компиляция успешно завершена. Сборка: {outputPath}",
					Errors = []
				};
			}
			else
			{
				var errors = emitResult.Diagnostics
					.Where(d => d.Severity == DiagnosticSeverity.Error)
					.Select(d => new CompilationError(d))
					.ToList();

				return new CompilationResult
				{
					Success = false,
					Output = "Ошибки компиляции:",
					Errors = errors
				};
			}
		}
		catch (Exception ex)
		{
			return new CompilationResult
			{
				Success = false,
				Output = "",
				Errors =
				[
					new CompilationError
					{
						ErrorCode = "ROSLYN_COMPILATION_ERROR",
						Message = ex.Message
					}
				]
			};
		}
	}

	private async Task<(bool Success, string Output, int ExitCode)> ExecuteDotnetCommand(
		string command,
		string arguments,
		string workingDirectory,
		TimeSpan timeout)
	{
		try
		{
			logger.LogDebug("Выполнение: dotnet {Command} {Arguments}", command, arguments);

			var startInfo = new ProcessStartInfo
			{
				FileName = "dotnet",
				Arguments = $"{command} {arguments}",
				WorkingDirectory = workingDirectory,
				RedirectStandardOutput = true,
				RedirectStandardError = true,
				UseShellExecute = false,
				CreateNoWindow = true,
				StandardOutputEncoding = Encoding.UTF8,
				StandardErrorEncoding = Encoding.UTF8
			};

			using var process = new Process();
			process.StartInfo = startInfo;

			var outputBuilder = new StringBuilder();
			var errorBuilder = new StringBuilder();

			process.OutputDataReceived += (_, e) =>
			{
				if (!string.IsNullOrEmpty(e.Data))
					outputBuilder.AppendLine(e.Data);
			};

			process.ErrorDataReceived += (_, e) =>
			{
				if (!string.IsNullOrEmpty(e.Data))
					errorBuilder.AppendLine(e.Data);
			};

			if (!process.Start())
				return (false, "Не удалось запустить процесс dotnet", 1);

			process.BeginOutputReadLine();
			process.BeginErrorReadLine();

			var completed = await Task.Run(() => process.WaitForExit((int)timeout.TotalMilliseconds));

			if (!completed)
			{
				process.Kill(true);
				return (false, $"Процесс превысил таймаут ({timeout.TotalSeconds} сек)", 1);
			}

			await Task.Delay(100);

			var output = outputBuilder.ToString();
			var error = errorBuilder.ToString();
			var fullOutput = string.IsNullOrEmpty(error) ? output : $"{output}\n{error}";

			return (process.ExitCode == 0, fullOutput.Trim(), process.ExitCode);
		}
		catch (Exception ex)
		{
			return (false, $"Ошибка выполнения команды: {ex.Message}", 1);
		}
	}

	private static string CreateTempDirectory()
	{
		var tempPath = Path.GetTempPath();
		var randomDir = Path.Combine(tempPath, "compilation_" + Guid.NewGuid().ToString()[..8]);
		Directory.CreateDirectory(randomDir);
		return randomDir;
	}

	private static void CopyDirectory(string sourceDir, string destinationDir, bool recursive)
	{
		var dir = new DirectoryInfo(sourceDir);

		if (!dir.Exists)
			throw new DirectoryNotFoundException($"Source directory not found: {dir.FullName}");

		Directory.CreateDirectory(destinationDir);

		foreach (var file in dir.GetFiles())
		{
			var targetPath = Path.Combine(destinationDir, file.Name);
			file.CopyTo(targetPath, true);
		}

		if (!recursive) return;
		foreach (var subDir in dir.GetDirectories())
		{
			var newDestinationDir = Path.Combine(destinationDir, subDir.Name);
			CopyDirectory(subDir.FullName, newDestinationDir, true);
		}
	}

	public void Dispose()
	{
		foreach (var tempDir in tempDirectories.ToList())
		{
			try
			{
				if (Directory.Exists(tempDir))
				{
					for (int i = 0; i < 3; i++)
					{
						try
						{
							Directory.Delete(tempDir, true);
							tempDirectories.Remove(tempDir);
							logger.LogDebug("Удалена временная директория: {TempDir}", tempDir);
							break;
						}
						catch (IOException) when (i < 2)
						{
							Thread.Sleep(100);
						}
					}
				}
			}
			catch (Exception ex)
			{
				logger.LogWarning(ex, "Не удалось удалить временную директорию: {TempDir}", tempDir);
			}
		}

		GC.SuppressFinalize(this);
	}
}