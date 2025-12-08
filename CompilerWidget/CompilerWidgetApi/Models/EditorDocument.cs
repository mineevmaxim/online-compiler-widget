namespace CompilerWidgetApi.Models;

public class EditorDocument
{
	public Guid Id {get; set;}
	public string Path {get; set;}
	public string Name {get; set;}
	public Language Language {get; set;}
	public string Content;
}