using System.ComponentModel.DataAnnotations.Schema;

namespace FileStorage;

public class ProjectFile
{
	public Guid FileId { get; set; }
	public string FileName { get; set; }
	public string Path { get; set; }
	public ProjectFileExtension Extension { get; set; }

	[ForeignKey("ProjectId")] public Project Project { get; set; }
}