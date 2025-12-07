public class CompilationProject
{
	public string ProjectId { get; set; }
	public List<ProjectFile> Files { get; set; } = new();
	public string EntryPoint { get; set; } // Main.cs или Program.cs
}