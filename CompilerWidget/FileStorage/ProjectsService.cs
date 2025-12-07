namespace FileStorage;

public class ProjectsService : IProjectsService
{
	public void Remove(Guid fileId)
	{
		throw new NotImplementedException();
	}

	public Guid Create(string projectName, string path)
	{
		throw new NotImplementedException();
	}

	public Guid AddFile(string fileName, string path)
	{
		throw new NotImplementedException();
	}

	public Project Get(Guid projectId)
	{
		throw new NotImplementedException();
	}

	public List<ProjectFile> GetFiles(Guid projectId)
	{
		throw new NotImplementedException();
	}
}