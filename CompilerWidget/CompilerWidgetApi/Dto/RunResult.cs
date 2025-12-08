using Compilation.Models;

namespace CompilerWidgetApi.Dto;

public class RunResult
{
	public bool Success { get; set; }
	public string Output { get; set; }
	public List<CompilationError> Errors { get; set; } = new();
	public string ProcessId { get; set; }
	public Guid ProjectId { get; set; }
	public DateTime StartedAt { get; set; }
}