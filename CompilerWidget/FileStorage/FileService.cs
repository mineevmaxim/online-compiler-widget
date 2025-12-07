namespace FileStorage;

public class FileService : IFileService
{
	public void Update(Guid fileId, string content)
	{
		throw new NotImplementedException();
	}

	public void Move(Guid fileId, string newPath)
	{
		throw new NotImplementedException();
	}

	public void Remove(Guid fileId)
	{
		throw new NotImplementedException();
	}

	public Guid Create(string fileName, string path)
	{
		throw new NotImplementedException();
	}

	public string Read(Guid fileId)
	{
		throw new NotImplementedException();
	}

	public string Read(string path)
	{
		throw new NotImplementedException();
	}
}