namespace CompilerWidgetApi.Models;

public class CodeFile
{
	public string Name { get; set; }
	public string Content { get; set; }
}

public class CompilationResult
{
	public bool IsSuccess { get; set; }
	public string Output { get; set; }
	public string Error { get; set; }
	public TimeSpan ExecutionTime { get; set; }
}