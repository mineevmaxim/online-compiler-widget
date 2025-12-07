namespace Compilation.Models;

public class CompilationResult
{
	public bool Success { get; init; }
	public string Output { get; init; }
	public IEnumerable<CompilationError> Errors { get; init; } = [];
}