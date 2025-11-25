using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using System.Reflection;
using System.Runtime.Loader;
using CompilerService.Models;

namespace CompilerService.Services;

public class CSharpCompilerService
{
    private readonly MetadataReference[] _references;

    public CSharpCompilerService()
    {
        _references = LoadReferences();
    }

    private MetadataReference[] LoadReferences()
    {
        var references = new List<MetadataReference>();
        
        // Базовые системные сборки
        var assemblies = new[]
        {
            typeof(object).Assembly,
            typeof(Console).Assembly,
            typeof(System.Collections.Generic.List<>).Assembly,
            typeof(System.Runtime.GCSettings).Assembly,
        };

        foreach (var assembly in assemblies)
        {
            try
            {
                references.Add(MetadataReference.CreateFromFile(assembly.Location));
            }
            catch
            {
                // Игнорируем ошибки
            }
        }

        return references.ToArray();
    }

    public CompilationResult CompileAndRun(ProjectRequest project, int timeoutMs = 10000)
    {
        try
        {
            var syntaxTrees = project.Files.Select(file => 
                CSharpSyntaxTree.ParseText(file.Value, path: file.Key)
            ).ToArray();

            var compilation = CSharpCompilation.Create(
                "OnlineProgram",
                syntaxTrees,
                _references,
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
            
            // Запускаем код
            ms.Position = 0;
            return ExecuteCompiledCode(ms);
        }
        catch (Exception ex)
        {
            return new CompilationResult
            {
                Success = false,
                Errors = new[] { new CompilationError { 
                    ErrorCode = "COMPILATION_ERROR", 
                    Message = ex.Message 
                }}
            };
        }
    }
    
    private CompilationResult ExecuteCompiledCode(MemoryStream assemblyStream)
    {
        var originalOut = Console.Out;
        var originalErr = Console.Error;
        
        try
        {
            using var outputWriter = new StringWriter();
            using var errorWriter = new StringWriter();
            
            Console.SetOut(outputWriter);
            Console.SetError(errorWriter);
            
            // Загружаем сборку в изолированном контексте
            var alc = new AssemblyLoadContext("ExecutionContext", true);
            var assembly = alc.LoadFromStream(assemblyStream);
            var entryPoint = assembly.EntryPoint;
            
            if (entryPoint == null)
            {
                return new CompilationResult
                {
                    Success = false,
                    Errors = new[] { new CompilationError { 
                        ErrorCode = "NO_ENTRY_POINT", 
                        Message = "No Main method found" 
                    }}
                };
            }
            
            // Вызываем точку входа
            try
            {
                object[] parameters = entryPoint.GetParameters().Length > 0 
                    ? new object[] { Array.Empty<string>() } 
                    : Array.Empty<object>();
                    
                entryPoint.Invoke(null, parameters);
                
                return new CompilationResult
                {
                    Success = true,
                    Output = outputWriter.ToString()
                        .Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries)
                };
            }
            catch (Exception ex)
            {
                return new CompilationResult
                {
                    Success = false,
                    Output = outputWriter.ToString()
                        .Split(new[] { '\r', '\n' }, StringSplitOptions.RemoveEmptyEntries),
                    Errors = new[] { new CompilationError { 
                        ErrorCode = "RUNTIME_ERROR", 
                        Message = ex.InnerException?.Message ?? ex.Message 
                    }}
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