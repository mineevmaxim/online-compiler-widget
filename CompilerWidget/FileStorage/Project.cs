using System.ComponentModel.DataAnnotations;

namespace FileStorage;

public class Project
{
	[Key]
	public Guid ProjectId { get; set; }
	public Guid EntryPoint { get; set; }
	public string ProjectName { get; set; }

	public List<ProjectFile> Files { get; set; }
}