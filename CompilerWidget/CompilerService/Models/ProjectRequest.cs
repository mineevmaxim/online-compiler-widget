namespace CompilerService.Models;

public class ProjectRequest
{
    public Dictionary<string, string> Files { get; set; } = new();
}