using System.Diagnostics;
using System.Text;
using Compilation.Models;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.Extensions.Logging;

namespace Compilation;

public class CompilerService(ILogger<CompilerService> logger) : IDisposable
{
    private readonly List<string> tempDirectories = new();
    private const int TimeoutSeconds = 30;

    // Процессы, которые можно остановить
    private static readonly Dictionary<string, Process> ActiveRunProcesses = new();

    /// <summary>
    /// Запуск проекта (с компиляцией и запуском)
    /// </summary>
    public async Task<CompilationResult> RunCompilerContainer(
        string sourcePath,
        string mainFile,
        string processId,
        CancellationToken cancellationToken = default)
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
                TimeSpan.FromSeconds(TimeoutSeconds),
                processId,
                cancellationToken);

            if (!compileResult.Success)
            {
                return new CompilationResult
                {
                    Success = false,
                    Output = "",
                    Errors = new List<CompilationError>
                    {
                        new CompilationError { ErrorCode = "BUILD_ERROR", Message = compileResult.Output }
                    }
                };
            }

            logger.LogInformation("Запуск проекта...");
            var runResult = await ExecuteDotnetCommand(
                "run",
                $"\"{projectPath}\" --no-build --verbosity quiet --configuration Release",
                tempDir,
                TimeSpan.FromSeconds(TimeoutSeconds),
                processId,
                cancellationToken);

            return new CompilationResult
            {
                Success = runResult.ExitCode == 0,
                Output = runResult.Output,
                Errors = runResult.ExitCode != 0
                    ? new List<CompilationError> { new CompilationError { ErrorCode = "RUNTIME_ERROR", Message = runResult.Output } }
                    : new List<CompilationError>()
            };
        }
        catch (OperationCanceledException)
        {
            logger.LogInformation("Процесс {ProcessId} был отменен", processId);
            StopProcess(processId);
            return new CompilationResult
            {
                Success = false,
                Output = "Процесс был отменен",
                Errors = new List<CompilationError>()
            };
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Ошибка при запуске проекта {MainFile}", mainFile);
            return new CompilationResult
            {
                Success = false,
                Output = "",
                Errors = new List<CompilationError>
                {
                    new CompilationError { ErrorCode = "EXECUTION_ERROR", Message = ex.Message }
                }
            };
        }
    }

    /// <summary>
    /// Метод остановки процесса
    /// </summary>
    public static void StopProcess(string processId)
    {
        if (string.IsNullOrWhiteSpace(processId)) return;
        if (!ActiveRunProcesses.TryGetValue(processId, out var process)) return;

        try
        {
            if (!process.HasExited)
                process.Kill(true);
        }
        catch { /* игнорируем ошибки */ }
        finally
        {
            ActiveRunProcesses.Remove(processId);
        }
    }

    /// <summary>
    /// Выполнение dotnet команд с поддержкой CancellationToken
    /// </summary>
    private async Task<(bool Success, string Output, int ExitCode)> ExecuteDotnetCommand(
        string command,
        string arguments,
        string workingDirectory,
        TimeSpan timeout,
        string? processId = null,
        CancellationToken cancellationToken = default)
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

            var process = new Process { StartInfo = startInfo, EnableRaisingEvents = true };

            var outputBuilder = new StringBuilder();
            var errorBuilder = new StringBuilder();

            process.OutputDataReceived += (_, e) => { if (e.Data != null) outputBuilder.AppendLine(e.Data); };
            process.ErrorDataReceived += (_, e) => { if (e.Data != null) errorBuilder.AppendLine(e.Data); };

            if (!process.Start())
                return (false, "Не удалось запустить процесс dotnet", 1);

            process.BeginOutputReadLine();
            process.BeginErrorReadLine();

            if (!string.IsNullOrWhiteSpace(processId))
                ActiveRunProcesses[processId] = process;

            var tcs = new TaskCompletionSource<int>();
            process.Exited += (_, _) => tcs.TrySetResult(process.ExitCode);

            using (cancellationToken.Register(() =>
            {
                if (!process.HasExited)
                {
                    try { process.Kill(true); } catch { }
                }
            }))
            {
                var completedTask = await Task.WhenAny(tcs.Task, Task.Delay(timeout, cancellationToken));
                if (completedTask != tcs.Task)
                {
                    try { process.Kill(true); } catch { }
                    return (false, $"Процесс превысил таймаут ({timeout.TotalSeconds} сек)", 1);
                }
            }

            var output = outputBuilder.ToString();
            var error = errorBuilder.ToString();
            var fullOutput = string.IsNullOrEmpty(error) ? output : $"{output}\n{error}";

            ActiveRunProcesses.Remove(processId);

            return (process.ExitCode == 0, fullOutput.Trim(), process.ExitCode);
        }
        catch (OperationCanceledException)
        {
            return (false, "Процесс был отменен", 1);
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
            file.CopyTo(Path.Combine(destinationDir, file.Name), true);

        if (!recursive) return;

        foreach (var subDir in dir.GetDirectories())
        {
            CopyDirectory(subDir.FullName, Path.Combine(destinationDir, subDir.Name), true);
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
