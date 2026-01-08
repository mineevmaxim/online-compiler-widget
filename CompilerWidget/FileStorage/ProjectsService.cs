using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FileStorage;

public class ProjectService(
	FileStorageDbContext context,
	IFileService fileService,
	ILogger<ProjectService> logger)
	: IProjectService
{
	public async Task<Guid> CreateProjectAsync(string? name = null)
	{
		try
		{
			var projectId = Guid.NewGuid();
			var project = new Project
			{
				ProjectId = projectId,
				ProjectName = name ?? $"Project_{DateTime.Now:yyyyMMdd_HHmmss}",
			};

			context.Projects.Add(project);
			await context.SaveChangesAsync();

			logger.LogInformation("Создан проект {ProjectId} с именем {Name}", projectId, project.ProjectName);

			return projectId;
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Ошибка при создании проекта");
			throw;
		}
	}

	public async Task<bool> GetOrCreateProjectAsync(Guid id)
	{
		var project = await context.Projects.AsNoTracking().FirstOrDefaultAsync(proj =>  proj.ProjectId == id);
		if (project != null) return false;
		var newProject = new Project()
		{
			ProjectId = id,
			ProjectName = $"Project_{DateTime.Now:yyyyMMdd_HHmmss}"
		};
		await context.Projects.AddAsync(newProject);
		await context.SaveChangesAsync();
		return true;
	}

	public async Task<bool> DeleteProjectAsync(Guid projectId)
	{
		await using var transaction = await context.Database.BeginTransactionAsync();

		try
		{
			var files = await context.ProjectFiles
				.Where(f => f.ProjectId == projectId)
				.ToListAsync();

			foreach (var file in files)
			{
				try
				{
					fileService.Remove(file.FileId);
				}
				catch (Exception ex)
				{
					logger.LogWarning(ex, "Не удалось удалить файл {FileId}", file.FileId);
				}
			}

			var project = await context.Projects.FindAsync(projectId);
			if (project != null)
				context.Projects.Remove(project);

			await context.SaveChangesAsync();
			await transaction.CommitAsync();

			logger.LogInformation("Удален проект {ProjectId} с {FileCount} файлами", projectId, files.Count);

			return true;
		}
		catch (Exception ex)
		{
			await transaction.RollbackAsync();
			logger.LogError(ex, "Ошибка при удалении проекта {ProjectId}", projectId);
			return false;
		}
	}

	public async Task<ProjectInfo?> GetProjectInfoAsync(Guid projectId)
	{
		try
		{
			var project = await context.Projects.FindAsync(projectId);
			if (project == null) return null;

			var fileCount = await context.ProjectFiles
				.CountAsync(f => f.ProjectId == projectId);

			return new ProjectInfo
			{
				ProjectId = project.ProjectId,
				Name = project.ProjectName,
				FileCount = fileCount,
			};
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Ошибка при получении информации о проекте {ProjectId}", projectId);
			throw;
		}
	}

	public async Task<List<ProjectInfo>> GetAllProjectsAsync()
	{
		try
		{
			var projects = await context.Projects
				.Include(p => p.Files)
				.ToListAsync();

			return projects.Select(p => new ProjectInfo
			{
				ProjectId = p.ProjectId,
				Name = p.ProjectName,
				FileCount = p.Files.Count,
			}).ToList();
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Ошибка при получении списка проектов");
			throw;
		}
	}

	public async Task<bool> RenameProjectAsync(Guid projectId, string newName)
	{
		try
		{
			var project = await context.Projects.FindAsync(projectId);
			if (project == null) return false;

			project.ProjectName = newName;

			await context.SaveChangesAsync();

			logger.LogInformation("Проект {ProjectId} переименован в {NewName}",
				projectId, newName);

			return true;
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Ошибка при переименовании проекта {ProjectId}", projectId);
			return false;
		}
	}

	public async Task<ProjectStats> GetProjectStatsAsync(Guid projectId)
	{
		try
		{
			var files = await context.ProjectFiles
				.Where(f => f.ProjectId == projectId)
				.ToListAsync();

			var stats = new ProjectStats
			{
				ProjectId = projectId,
				FileCount = files.Count,
				CSharpFiles = files.Count(f => f.Extension is ProjectFileExtension.CSharp),
				JsFiles = files.Count(f => f.Extension is  ProjectFileExtension.Js),
				OtherFiles = files.Count(f => f.Extension != ProjectFileExtension.CSharp && f.Extension !=  ProjectFileExtension.Js),
			};

			return stats;
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Ошибка при получении статистики проекта {ProjectId}", projectId);
			throw;
		}
	}
}