using Microsoft.Extensions.Logging;
using System.Text;

namespace FileStorage;

public class FileService : IFileService
{
	private readonly FileStorageDbContext context;
	private readonly ILogger<FileService> logger;
	private readonly string storagePath;

	public FileService(
		FileStorageDbContext context,
		ILogger<FileService> logger,
		string storagePath = "projects")
	{
		this.context = context;
		this.logger = logger;
		this.storagePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, storagePath);

		if (Directory.Exists(this.storagePath)) return;
		Directory.CreateDirectory(this.storagePath);
		this.logger.LogInformation("Создана корневая папка хранилища: {Path}", this.storagePath);
	}

	public Guid Create(string fileName, Guid projectId, string path)
	{
		try
		{
			var project = context.Projects.Find(projectId);
			if (project == null)
			{
				project = new Project
				{
					ProjectId = projectId,
					ProjectName = $"Project_{projectId}"
				};
				context.Projects.Add(project);
				context.SaveChanges();
			}

			var fileId = Guid.NewGuid();
			var extension = Path.GetExtension(fileName);
			var fileNameWithoutExt = Path.GetFileNameWithoutExtension(fileName);

			var directoryPath = Path.GetDirectoryName(path) ?? "";

			var dbFile = new ProjectFile
			{
				FileId = fileId,
				ProjectId = projectId,
				FileName = fileNameWithoutExt,
				Extension = string.IsNullOrEmpty(extension) ? ProjectFileExtension.Unknown : FromExtension(extension),
				Path = directoryPath.Trim('/'),
			};

			context.ProjectFiles.Add(dbFile);
			context.SaveChanges();

			var filePath = GetPhysicalFilePath(fileId, extension);
			var directory = Path.GetDirectoryName(filePath);
			if (directory != null && !Directory.Exists(directory))
				Directory.CreateDirectory(directory);

			File.WriteAllText(filePath, string.Empty);

			logger.LogInformation("Создан файл {FileName} с ID {FileId} в проекте {ProjectId}",
				fileName, fileId, projectId);

			return fileId;
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Ошибка при создании файла {FileName} в проекте {ProjectId}",
				fileName, projectId);
			throw;
		}
	}

	public string Read(Guid fileId)
	{
		try
		{
			var file = context.ProjectFiles.Find(fileId);
			if (file == null)
				throw new FileNotFoundException($"Файл с ID {fileId} не найден");

			var filePath = GetPhysicalFilePath(fileId, ToExtension(file.Extension));
			if (!File.Exists(filePath))
				throw new FileNotFoundException($"Физический файл {filePath} не найден");

			return File.ReadAllText(filePath, Encoding.UTF8);
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Ошибка при чтении файла {FileId}", fileId);
			throw;
		}
	}

	public string Read(string path)
	{
		try
		{
			var file = context.ProjectFiles
				.FirstOrDefault(f => f.Path == path.Trim('/'));

			if (file == null)
				throw new FileNotFoundException($"Файл по пути {path} не найден");

			return Read(file.FileId);
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Ошибка при чтении файла по пути {Path}", path);
			throw;
		}
	}

	public void Update(Guid fileId, string content)
	{
		try
		{
			var file = context.ProjectFiles.Find(fileId);
			if (file == null)
				throw new FileNotFoundException($"Файл с ID {fileId} не найден");

			var filePath = GetPhysicalFilePath(fileId, ToExtension(file.Extension));
			if (!File.Exists(filePath))
				throw new FileNotFoundException($"Физический файл {filePath} не найден");

			File.WriteAllText(filePath, content, Encoding.UTF8);

			context.SaveChanges();

			logger.LogInformation("Обновлен файл {FileId}, новый размер: {Size} байт",
				fileId, content.Length);
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Ошибка при обновлении файла {FileId}", fileId);
			throw;
		}
	}

	public void Remove(Guid fileId)
	{
		try
		{
			var file = context.ProjectFiles.Find(fileId);
			if (file == null)
			{
				throw new FileNotFoundException($"Файл с ID {fileId} не найден");
			}

			var filePath = GetPhysicalFilePath(fileId, ToExtension(file.Extension));
			if (File.Exists(filePath))
			{
				File.Delete(filePath);

				DeleteEmptyDirectories(Path.GetDirectoryName(filePath));
			}

			context.ProjectFiles.Remove(file);
			context.SaveChanges();

			logger.LogInformation("Удален файл {FileId}", fileId);
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Ошибка при удалении файла {FileId}", fileId);
			throw;
		}
	}

	private string GetPhysicalFilePath(Guid fileId, string extension)
	{
		var file = context.ProjectFiles.Find(fileId);
		if (file == null)
			throw new FileNotFoundException($"Файл с ID {fileId} не найден в БД");

		var directoryPath = !string.IsNullOrEmpty(file.Path)
			? file.Path.Replace('/', Path.DirectorySeparatorChar)
			: string.Empty;

		var projectDir = Path.Combine(storagePath, file.ProjectId.ToString());
		var fullDir = string.IsNullOrEmpty(directoryPath)
			? projectDir
			: Path.Combine(projectDir, directoryPath);

		if (!Directory.Exists(fullDir))
			Directory.CreateDirectory(fullDir);

		var fileName = $"{file.FileName}{extension}";
		return Path.Combine(fullDir, fileName);
	}

	public void Move(Guid fileId, string newPath)
	{
		try
		{
			var file = context.ProjectFiles.Find(fileId);
			if (file == null)
				throw new FileNotFoundException($"Файл с ID {fileId} не найден");

			var newDirectoryPath = Path.GetDirectoryName(newPath) ?? "";
			newDirectoryPath = newDirectoryPath.Trim('/');

			var existingFile = context.ProjectFiles
				.FirstOrDefault(f => f.Path == newDirectoryPath &&
				                     f.FileName == file.FileName &&
				                     f.ProjectId == file.ProjectId);

			if (existingFile != null && existingFile.FileId != fileId)
				throw new InvalidOperationException($"Файл {file.FileName} уже существует в пути {newPath}");

			var oldPhysicalPath = GetPhysicalFilePath(fileId, ToExtension(file.Extension));

			file.Path = newDirectoryPath;

			context.SaveChanges();

			var newPhysicalPath = GetPhysicalFilePath(fileId, ToExtension(file.Extension));

			if (File.Exists(oldPhysicalPath) && oldPhysicalPath != newPhysicalPath)
			{
				File.Move(oldPhysicalPath, newPhysicalPath);
				DeleteEmptyDirectories(Path.GetDirectoryName(oldPhysicalPath));
			}

			logger.LogInformation("Файл {FileId} перемещен в {NewPath}",
				fileId, newPath);
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Ошибка при перемещении файла {FileId} на путь {NewPath}", fileId, newPath);
			throw;
		}
	}

	private void DeleteEmptyDirectories(string? directory)
	{
		try
		{
			while (!string.IsNullOrEmpty(directory) &&
			       Directory.Exists(directory) &&
			       IsDirectoryEmpty(directory) &&
			       directory.StartsWith(storagePath))
			{
				Directory.Delete(directory);
				logger.LogDebug("Удалена пустая директория: {Directory}", directory);

				directory = Path.GetDirectoryName(directory);
			}
		}
		catch (Exception ex)
		{
			logger.LogDebug(ex, "Не удалось удалить пустую директорию {Directory}", directory);
		}
	}

	private static bool IsDirectoryEmpty(string path) => !Directory.EnumerateFileSystemEntries(path).Any();

	public FileMetadata? GetFileInfo(Guid fileId)
	{
		var file = context.ProjectFiles.Find(fileId);
		if (file == null)
			return null;

		var physicalPath = GetPhysicalFilePath(fileId, ToExtension(file.Extension));
		return new FileMetadata
		{
			FileId = file.FileId,
			FileName = file.FileName + file.Extension,
			ProjectId = file.ProjectId,
			Path = file.Path,
			PhysicalPath = physicalPath,
			ExistsOnDisk = File.Exists(physicalPath)
		};
	}

	public IEnumerable<FileMetadata> GetProjectFiles(Guid projectId)
	{
		return context.ProjectFiles
			.Where(f => f.ProjectId == projectId)
			.Select(f => new FileMetadata
			{
				FileId = f.FileId,
				FileName = f.FileName + ToExtension(f.Extension),
				ProjectId = f.ProjectId,
				Path = f.Path,
			})
			.ToList();
	}

	public void Rename(Guid fileId, string newFileName)
	{
		try
		{
			var newExtension = Path.GetExtension(newFileName);
			newFileName = Path.GetFileNameWithoutExtension(newFileName);

			var file = context.ProjectFiles.Find(fileId);
			if (file == null)
				throw new FileNotFoundException($"Файл с ID {fileId} не найден");

			var extension = file.Extension;
			var oldPhysicalPath = GetPhysicalFilePath(fileId, ToExtension(extension));


			context.SaveChanges();


			var newPhysicalPath = GetPhysicalFilePath(fileId, newExtension);

			if (File.Exists(oldPhysicalPath) && oldPhysicalPath != newPhysicalPath)
			{
				var newDir = Path.GetDirectoryName(newPhysicalPath);
				if (newDir != null && !Directory.Exists(newDir))
					Directory.CreateDirectory(newDir);

				File.Move(oldPhysicalPath, newPhysicalPath);

				DeleteEmptyDirectories(Path.GetDirectoryName(oldPhysicalPath));
			}

			logger.LogInformation("Файл {FileId} переименован в {NewFileName}{Extension}",
				fileId, newFileName, extension);
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Ошибка при переименовании файла {FileId} в {NewFileName}", fileId, newFileName);
			throw;
		}
	}

	private static string ToExtension(ProjectFileExtension extension)
	{
		var dict = new Dictionary<ProjectFileExtension, string>()
		{
			{ ProjectFileExtension.Unknown, "" },
			{ ProjectFileExtension.CSharp, ".cs" },
			{ ProjectFileExtension.Js, ".js" },
			{ ProjectFileExtension.Json, ".json" },
			{ ProjectFileExtension.Txt, ".txt" },
			{ ProjectFileExtension.CsProj, ".csproj" },
		};
		return dict[extension];
	}

	private static ProjectFileExtension FromExtension(string extension)
	{
		var dict = new Dictionary<string, ProjectFileExtension>()
		{
			{ "", ProjectFileExtension.Unknown },
			{ ".cs", ProjectFileExtension.CSharp },
			{ ".js", ProjectFileExtension.Js },
			{ ".json", ProjectFileExtension.Json },
			{ ".txt", ProjectFileExtension.Txt },
			{ ".csproj", ProjectFileExtension.CsProj },
		};
		return dict[extension];
	}
}