namespace FileStorage;

public class ProjectInfo
{
	public Guid ProjectId { get; set; }
	public string Name { get; set; } = string.Empty;
	public int FileCount { get; set; }
}