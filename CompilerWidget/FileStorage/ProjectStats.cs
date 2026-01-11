namespace FileStorage;

public class ProjectStats
{
	public long ProjectId { get; set; }
	public int FileCount { get; set; }
	public int CSharpFiles { get; set; }
	public int JsFiles { get; set; }
	public int OtherFiles { get; set; }
}