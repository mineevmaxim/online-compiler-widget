namespace CompilerWidgetApi.Models;

public class CompilationRequest
{
	public string ConnectionId { get; set; }
	public Language Language { get; set; }
	public List<CodeFile> Files { get; set; }
	public string EntryPoint { get; set; }
}