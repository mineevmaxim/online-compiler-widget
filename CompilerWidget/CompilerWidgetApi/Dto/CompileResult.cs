
using Compilation.Models;

namespace CompilerWidgetApi.Dto;

public class CompileResult
{
	public bool Success { get; set; }
	public string Output { get; set; }
	public List<CompilationError> Errors { get; set; } = new();
	public Guid ProjectId { get; set; }
	public DateTime CompiledAt { get; set; }
}