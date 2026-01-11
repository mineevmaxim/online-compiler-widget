using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FileStorage;

public class Project
{
	[Key]
	[DatabaseGenerated(DatabaseGeneratedOption.None)]
	public long ProjectId { get; set; }
	public Guid EntryPoint { get; set; }
	public string ProjectName { get; set; }

	public List<ProjectFile> Files { get; set; }
}