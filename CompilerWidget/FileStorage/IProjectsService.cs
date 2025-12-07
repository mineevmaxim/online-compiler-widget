namespace FileStorage;

public interface IProjectsService
{
	public void Remove(Guid fileId);

	public Guid Create(string projectName, string path);

	public Guid AddFile(string fileName, string path);

	public Project Get(Guid projectId);

	public List<ProjectFile> GetFiles(Guid projectId);
}