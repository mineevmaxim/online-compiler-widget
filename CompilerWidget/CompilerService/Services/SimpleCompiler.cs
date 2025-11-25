using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;

namespace CompilerService.Services;

public class SimpleCompiler
{
	public static string CompileCode(string code)
	{
		try
		{
			var syntaxTree = CSharpSyntaxTree.ParseText(code);

			var references = new[]
			{
				MetadataReference.CreateFromFile(typeof(object).Assembly.Location),
				MetadataReference.CreateFromFile(typeof(System.Runtime.GCSettings).Assembly.Location),
			};

			var compilation = CSharpCompilation.Create(
				"TestAssembly",
				[syntaxTree],
				references,
				new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary)
			);

			using var ms = new MemoryStream();
			var result = compilation.Emit(ms);

			return result.Success
				? "SUCCESS"
				: $"FAILED: {string.Join(", ", result.Diagnostics.Where(d => d.Severity == DiagnosticSeverity.Error).Select(d => d.GetMessage()))}";
		}
		catch (Exception ex)
		{
			return $"ERROR: {ex.Message}";
		}
	}
}