namespace FileStorage;

public interface IProjectService
{
	/// <summary>
	/// Создает новый проект
	/// </summary>
	Task<Guid> CreateProjectAsync(string? name = null);
	
	/// <summary>
	/// created -> true, get -> false
	/// </summary>
	/// <param name="id"></param>
	/// <returns></returns>
	Task<bool> GetOrCreateProjectAsync(Guid id);
    
	/// <summary>
	/// Удаляет проект со всеми файлами
	/// </summary>
	Task<bool> DeleteProjectAsync(Guid projectId);
    
	/// <summary>
	/// Получает информацию о проекте
	/// </summary>
	Task<ProjectInfo?> GetProjectInfoAsync(Guid projectId);
    
	/// <summary>
	/// Получает все проекты
	/// </summary>
	Task<List<ProjectInfo>> GetAllProjectsAsync();
    
	/// <summary>
	/// Переименовывает проект
	/// </summary>
	Task<bool> RenameProjectAsync(Guid projectId, string newName);
    
	/// <summary>
	/// Получает статистику по проекту
	/// </summary>
	Task<ProjectStats> GetProjectStatsAsync(Guid projectId);
}