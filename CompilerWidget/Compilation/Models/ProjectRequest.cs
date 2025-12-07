namespace Compilation.Models;

public class ProjectRequest
{
	public Dictionary<string, string> Files { get; init; } = new();
}