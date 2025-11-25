using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using System.Runtime.Loader;
using CompilerService.Models;

namespace CompilerService.Services;

public class CSharpCompilerService
{
	private readonly MetadataReference[] references = LoadReferences();

	private static MetadataReference[] LoadReferences()
	{
		var metadataReferences = new List<MetadataReference>();

		var assemblies = new[]
		{
			typeof(object).Assembly,
			typeof(Console).Assembly,
			typeof(List<>).Assembly,
			typeof(System.Runtime.GCSettings).Assembly,
		};

		foreach (var assembly in assemblies)
		{
			try
			{
				metadataReferences.Add(MetadataReference.CreateFromFile(assembly.Location));
			}
			catch
			{
				// ignored
			}
		}

		return metadataReferences.ToArray();
	}

	public CompilationResult CompileAndRun(ProjectRequest project, int timeoutMs = 10000)
	{
		try
		{
			var syntaxTrees = project.Files
				.Select(file => CSharpSyntaxTree.ParseText(file.Value, path: file.Key))
				.ToArray();

			var compilation = CSharpCompilation.Create(
				"OnlineProgram",
				syntaxTrees,
				references,
				new CSharpCompilationOptions(OutputKind.ConsoleApplication)
			);

			using var ms = new MemoryStream();
			var emitResult = compilation.Emit(ms);

			if (!emitResult.Success)
			{
				var errors = emitResult.Diagnostics
					.Where(d => d.Severity >= DiagnosticSeverity.Error)
					.Select(d => new CompilationError(d))
					.ToArray();

				return new CompilationResult
				{
					Success = false,
					Errors = errors
				};
			}

			ms.Position = 0;
			return ExecuteCompiledCode(ms);
		}
		catch (Exception ex)
		{
			return new CompilationResult
			{
				Success = false,
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

	private static CompilationResult ExecuteCompiledCode(MemoryStream assemblyStream)
	{
		var originalOut = Console.Out;
		var originalErr = Console.Error;

		try
		{
			using var outputWriter = new StringWriter();
			using var errorWriter = new StringWriter();

			Console.SetOut(outputWriter);
			Console.SetError(errorWriter);

			var alc = new AssemblyLoadContext("ExecutionContext", true);
			var assembly = alc.LoadFromStream(assemblyStream);
			var entryPoint = assembly.EntryPoint;

			if (entryPoint == null)
			{
				return new CompilationResult
				{
					Success = false,
					Errors =
					[
						new CompilationError
						{
							ErrorCode = "NO_ENTRY_POINT",
							Message = "No Main method found"
						}
					]
				};
			}

			try
			{
				object[] parameters = entryPoint.GetParameters().Length > 0
					? [Array.Empty<string>()]
					: [];

				entryPoint.Invoke(null, parameters);

				return new CompilationResult
				{
					Success = true,
					Output = outputWriter.ToString()
						.Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries)
				};
			}
			catch (Exception ex)
			{
				return new CompilationResult
				{
					Success = false,
					Output = outputWriter.ToString().Split(['\r', '\n'], StringSplitOptions.RemoveEmptyEntries),
					Errors =
					[
						new CompilationError
						{
							ErrorCode = "RUNTIME_ERROR",
							Message = ex.InnerException?.Message ?? ex.Message
						}
					]
				};
			}
			finally
			{
				alc.Unload();
			}
		}
		finally
		{
			Console.SetOut(originalOut);
			Console.SetError(originalErr);
		}
	}
}