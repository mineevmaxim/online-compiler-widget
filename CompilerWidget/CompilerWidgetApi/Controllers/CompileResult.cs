
using Compilation.Models;

namespace CompilerWidgetApi.Controllers;

public class CompileResult
{
	public bool Success { get; set; }
	public string Output { get; set; }
	public List<CompilationError> Errors { get; set; } = new();
	public Guid ProjectId { get; set; }
	public DateTime CompiledAt { get; set; }
}