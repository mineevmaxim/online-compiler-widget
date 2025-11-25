using Microsoft.CodeAnalysis;

namespace CompilerService.Models;

public class CompilationError
{
    public string ErrorCode { get; set; }
    public string Message { get; set; }
    public int StartLine { get; set; }
    public int EndLine { get; set; }

    public CompilationError() { }

    public CompilationError(Diagnostic diagnostic)
    {
        ErrorCode = diagnostic.Id;
        Message = diagnostic.GetMessage();
        var lineSpan = diagnostic.Location.GetLineSpan();
        StartLine = lineSpan.StartLinePosition.Line + 1;
        EndLine = lineSpan.EndLinePosition.Line + 1;
    }
}