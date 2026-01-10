using Microsoft.Extensions.Logging;
using System.Text;
using Microsoft.EntityFrameworkCore;

namespace FileStorage;

public class FileService : IFileService
{
	private readonly FileStorageDbContext context;
	private readonly ILogger<FileService> logger;
	private readonly string storagePath;

	private static readonly Dictionary<ProjectFileExtension, string> ToExtensionDict = new()
	{
		{ ProjectFileExtension.Unknown, "" },
		{ ProjectFileExtension.CSharp, ".cs" },
		{ ProjectFileExtension.Js, ".js" },
		{ ProjectFileExtension.Json, ".json" },
		{ ProjectFileExtension.Txt, ".txt" },
		{ ProjectFileExtension.CsProj, ".csproj" },
	};

	private static readonly Dictionary<string, ProjectFileExtension> FromExtensionDict = new()
	{
		{ "", ProjectFileExtension.Unknown },
		{ ".cs", ProjectFileExtension.CSharp },
		{ ".js", ProjectFileExtension.Js },
		{ ".json", ProjectFileExtension.Json },
		{ ".txt", ProjectFileExtension.Txt },
		{ ".csproj", ProjectFileExtension.CsProj },
	};

	public FileService(FileStorageDbContext context, ILogger<FileService> logger)
	{
		this.context = context;
		this.logger = logger;
		storagePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "projects");

		if (Directory.Exists(storagePath)) return;
		Directory.CreateDirectory(storagePath);
		this.logger.LogInformation("Создана корневая папка хранилища: {Path}", storagePath);
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

			logger.LogInformation("Создан файл {FileName} с ID {FileId} в проекте {ProjectId}", fileName, fileId, projectId);

			return fileId;
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Ошибка при создании файла {FileName} в проекте {ProjectId}", fileName, projectId);
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
			return !File.Exists(filePath)
				? throw new FileNotFoundException($"Физический файл {filePath} не найден")
				: File.ReadAllText(filePath, Encoding.UTF8);
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

			return file == null
				? throw new FileNotFoundException($"Файл по пути {path} не найден")
				: Read(file.FileId);
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

			logger.LogInformation("Обновлен файл {FileId}, новый размер: {Size} байт", fileId, content.Length);
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
				throw new FileNotFoundException($"Файл с ID {fileId} не найден");

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

	private string GetPhysicalFilePath(Guid fileId, string? fileName, string? extension, string? directoryPath = null)
	{
		var file = context.ProjectFiles.Find(fileId);
		if (file == null)
			throw new FileNotFoundException($"Файл с ID {fileId} не найден в БД");

		var actualFileName = fileName ?? file.FileName;
		var actualDirectoryPath = directoryPath ?? file.Path;
		var actualExtension = extension ?? ToExtension(file.Extension);

		var normalizedDirectoryPath = !string.IsNullOrEmpty(actualDirectoryPath)
			? actualDirectoryPath.Replace('/', Path.DirectorySeparatorChar)
			: string.Empty;

		var projectDir = Path.Combine(storagePath, file.ProjectId.ToString());
		var fullDir = string.IsNullOrEmpty(normalizedDirectoryPath)
			? projectDir
			: Path.Combine(projectDir, normalizedDirectoryPath);

		if (!Directory.Exists(fullDir))
			Directory.CreateDirectory(fullDir);

		var fullFileName = $"{actualFileName}{actualExtension}";
		return Path.Combine(fullDir, fullFileName);
	}

	private string GetPhysicalFilePath(Guid fileId, string? extension)
	{
		var file = context.ProjectFiles.Find(fileId);
		return file == null
			? throw new FileNotFoundException($"Файл с ID {fileId} не найден в БД")
			: GetPhysicalFilePath(fileId, file.FileName, extension ?? ToExtension(file.Extension), file.Path);
	}
	
	private string NormalizePath(string path)
	{
		if (string.IsNullOrEmpty(path))
			return path;
    
		// Заменяем все обратные слэши на прямые
		path = path.Replace("\\", "/");
    
		// Убираем двойные слэши
		while (path.Contains("//"))
		{
			path = path.Replace("//", "/");
		}
    
		// Убираем последний слэш, если это не корневой путь
		if (path.Length > 1 && path.EndsWith("/"))
		{
			path = path.TrimEnd('/');
		}
    
		return path;
	}

	public void MoveOneFile(Guid fileId, string newPath)
	{
		try
		{
			var fullPath = newPath+context.ProjectFiles.Find(fileId).FileName;
			fullPath = NormalizePath(fullPath);
			Move(fileId, fullPath);
		}
		catch(Exception ex)
		{
			logger.LogError(ex, "Ошибка при перемещении файла {FileId} на путь {NewPath}", fileId, newPath);
			throw;
		}
	}
	
	public void MoveAllFilesByPaath(Guid projectId, string oldPath, string newPath)
{
	
	oldPath =  NormalizePath(oldPath);
	newPath =  NormalizePath(newPath);
	
    try
    {
        // Получаем все файлы, начинающиеся с oldPath
        var files = context.ProjectFiles
            .Where(f => f.ProjectId == projectId && f.Path.StartsWith(oldPath))
            .ToList();
        
        // Обрабатываем каждый файл
        foreach (var file in files)
        {
            try
            {
                // Получаем относительную часть пути (после oldPath)
                string relativePath = file.Path.Substring(oldPath.Length);
                
                // Убираем начальный слэш, если есть
                if (relativePath.StartsWith("/"))
                    relativePath = relativePath.Substring(1);
                
                // Создаем новый путь: newPath + относительная часть
                string finalNewPath;
                if (string.IsNullOrEmpty(relativePath))
                {
                    // Если файл был непосредственно в oldPath
                    finalNewPath = newPath;
                }
                else
                {
                    // Соединяем новый путь и относительную часть
                    finalNewPath = $"{newPath.TrimEnd('/')}/{relativePath}";
                }
                
                // Получаем полный путь для файла (путь + имя файла)
                string fullNewPath = $"{finalNewPath.TrimEnd('/')}/{file.FileName}";
                
                // Вызываем метод Move для перемещения файла
                Move(file.FileId, fullNewPath);
                
                logger.LogInformation("Файл {FileName} перемещен из {OldPath} в {NewPath}", 
                    file.FileName, file.Path, finalNewPath);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Ошибка при обработке файла {FileId}", file.FileId);
                // Продолжаем обработку остальных файлов даже если один не удался
            }
        }
        
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Ошибка в GetFilesByPath для проекта {ProjectId}", projectId);
        throw;
    }
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
				.FirstOrDefault(f => f.Path == newDirectoryPath && f.FileName == file.FileName && f.ProjectId == file.ProjectId);

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
			while (!string.IsNullOrEmpty(directory) && Directory.Exists(directory) && IsDirectoryEmpty(directory) &&
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
		using var transaction = context.Database.BeginTransaction();

		try
		{
			var file = context.ProjectFiles.Find(fileId);
			if (file == null)
				throw new FileNotFoundException($"Файл с ID {fileId} не найден");

			if (string.IsNullOrWhiteSpace(newFileName))
				throw new ArgumentException("Имя файла не может быть пустым", nameof(newFileName));

			var newExtension = Path.GetExtension(newFileName);
			var newNameWithoutExtension = Path.GetFileNameWithoutExtension(newFileName);

			if (string.IsNullOrEmpty(newExtension))
				throw new ArgumentException("Расширение файла обязательно", nameof(newFileName));

			var oldFileName = file.FileName;
			var oldExtension = file.Extension;
			var oldDirectoryPath = file.Path;

			var oldPhysicalPath = GetPhysicalFilePath(
				fileId,
				oldFileName,
				ToExtension(oldExtension),
				oldDirectoryPath);

			var newPhysicalPath = GetPhysicalFilePath(
				fileId,
				newNameWithoutExtension,
				newExtension,
				oldDirectoryPath);

			var isFileNameExists = context.ProjectFiles
				.Any(projectFile => projectFile.ProjectId == file.ProjectId &&
				                    projectFile.FileId != fileId &&
				                    projectFile.FileName == newNameWithoutExtension &&
				                    projectFile.Extension == FromExtension(newExtension));

			if (isFileNameExists)
				throw new InvalidOperationException($"Файл '{newFileName}' уже существует");

			file.FileName = newNameWithoutExtension;
			file.Extension = FromExtension(newExtension);

			context.SaveChanges();

			if (File.Exists(oldPhysicalPath) && oldPhysicalPath != newPhysicalPath)
			{
				var newDirectory = Path.GetDirectoryName(newPhysicalPath);
				if (!string.IsNullOrEmpty(newDirectory) && !Directory.Exists(newDirectory))
					Directory.CreateDirectory(newDirectory);

				File.Move(oldPhysicalPath, newPhysicalPath);
				DeleteEmptyDirectories(Path.GetDirectoryName(oldPhysicalPath));
			}
			else if (!File.Exists(oldPhysicalPath))
			{
				logger.LogWarning("Физический файл не найден по пути: {OldPath}", oldPhysicalPath);

				if (File.Exists(newPhysicalPath))
					logger.LogInformation("Файл уже существует по новому пути: {NewPath}", newPhysicalPath);
			}

			transaction.Commit();

			logger.LogInformation("Файл {FileId} переименован с '{OldFileName}{OldExtension}' на '{NewFileName}{NewExtension}'",
				fileId, oldFileName, oldExtension, newNameWithoutExtension, newExtension);
		}
		catch (Exception ex)
		{
			transaction.Rollback();
			logger.LogError(ex, "Ошибка при переименовании файла {FileId}", fileId);
			throw;
		}
	}

	private static string ToExtension(ProjectFileExtension extension) => ToExtensionDict[extension];

	private static ProjectFileExtension FromExtension(string extension) => FromExtensionDict[extension];
}