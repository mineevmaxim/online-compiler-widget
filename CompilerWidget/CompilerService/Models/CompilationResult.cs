namespace CompilerService.Models;

public class CompilationResult
{
    public bool Success { get; set; }
    public string[] Output { get; set; } = Array.Empty<string>();
    public IEnumerable<CompilationError> Errors { get; set; } = Enumerable.Empty<CompilationError>();
}

