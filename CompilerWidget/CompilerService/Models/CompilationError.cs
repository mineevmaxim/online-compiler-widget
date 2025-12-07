using Microsoft.CodeAnalysis;

namespace CompilerService.Models;

public class CompilationError()
{
	public string? ErrorCode { get; init; }
	public string? Message { get; init; }
	public int StartLine { get; }
	public int EndLine { get; set; }

	public CompilationError(Diagnostic diagnostic) : this()
	{
		ErrorCode = diagnostic.Id;
		Message = diagnostic.GetMessage();
		var lineSpan = diagnostic.Location.GetLineSpan();
		StartLine = lineSpan.StartLinePosition.Line + 1;
		EndLine = lineSpan.EndLinePosition.Line + 1;
	}
}