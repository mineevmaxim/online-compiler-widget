namespace FileStorage;

public class FileMetadata
{
	public Guid FileId { get; set; }
	public string FileName { get; set; }
	public long ProjectId { get; set; }
	public string Path { get; set; }
	public string PhysicalPath { get; set; }
	public bool ExistsOnDisk { get; set; }
}