namespace FileStorage;

public interface IFileService
{
	/// <summary>
	/// Обновляет содержимое файла
	/// </summary>
	/// <param name="fileId"></param>
	/// <param name="content"></param>
	public void Update(Guid fileId, string content);

	/// <summary>
	/// Перемещает файл
	/// </summary>
	/// <param name="fileId"></param>
	/// <param name="newPath"></param>
	public void Move(Guid fileId, string newPath);

	public void MoveAllFilesByPaath(Guid projectId, string oldPath, string newPath);
	
	public void MoveOneFile(Guid fileId, string newPath);

	/// <summary>
	/// Удаляет файл
	/// </summary>
	/// <param name="fileId"></param>
	public void Remove(Guid fileId);

	/// <summary>
	/// Создает файл
	/// </summary>
	/// <param name="fileName"></param>
	/// <param name="projectId"></param>
	/// <param name="path"></param>
	/// <returns></returns>
	Guid Create(string fileName, Guid projectId, string path);

	/// <summary>
	/// Читает все содержимое файла
	/// </summary>
	/// <param name="fileId"></param>
	/// <returns></returns>
	public string Read(Guid fileId);

	/// <summary>
	/// Читает все содержимое файла
	/// </summary>
	/// <param name="path"></param>
	/// <returns></returns>
	public string Read(string path);
	
	
	
	FileMetadata? GetFileInfo(Guid fileId);
	IEnumerable<FileMetadata> GetProjectFiles(Guid projectId);
	
	/// <summary>
	/// Переименовывает файл (меняет только имя, без расширения)
	/// </summary>
	/// <param name="fileId"></param>
	/// <param name="newFileName">Новое имя файла (без расширения)</param>
	public void Rename(Guid fileId, string newFileName);
}