using FileStorage;
using Microsoft.AspNetCore.Mvc;

namespace CompilerWidgetApi.Controllers;

[ApiController]
[Route("/api/projects")]
public class ProjectController : ControllerBase
{
	private readonly IProjectService projectService;
	private readonly ILogger<ProjectController> logger;

	public ProjectController(
		IProjectService projectService,
		ILogger<ProjectController> logger)
	{
		this.projectService = projectService;
		this.logger = logger;
	}

	[HttpPost("create")]
	public async Task<ActionResult<Guid>> CreateProject([FromBody] CreateProjectRequest? request)
	{
		try
		{
			var projectId = await projectService.CreateProjectAsync(request?.Name);
			return Ok(new { ProjectId = projectId });
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Ошибка при создании проекта");
			return StatusCode(500, new { Error = ex.Message });
		}
	}

	[HttpDelete("{projectId:guid}")]
	public async Task<ActionResult> DeleteProject(Guid projectId)
	{
		try
		{
			var success = await projectService.DeleteProjectAsync(projectId);

			if (!success)
			{
				return NotFound(new { Error = "Проект не найден" });
			}

			return Ok(new { Message = "Проект удален" });
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Ошибка при удалении проекта {ProjectId}", projectId);
			return StatusCode(500, new { Error = ex.Message });
		}
	}

	[HttpGet("{projectId:guid}")]
	public async Task<ActionResult<ProjectInfo>> GetProject(Guid projectId)
	{
		try
		{
			var projectInfo = await projectService.GetProjectInfoAsync(projectId);

			if (projectInfo == null)
				return NotFound(new { Error = "Проект не найден" });

			return Ok(projectInfo);
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Ошибка при получении проекта {ProjectId}", projectId);
			return StatusCode(500, new { Error = ex.Message });
		}
	}

	[HttpGet("")]
	public async Task<ActionResult<List<ProjectInfo>>> GetAllProjects()
	{
		try
		{
			var projects = await projectService.GetAllProjectsAsync();
			return Ok(projects);
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Ошибка при получении списка проектов");
			return StatusCode(500, new { Error = ex.Message });
		}
	}

	[HttpPut("{projectId:guid}/rename")]
	public async Task<ActionResult> RenameProject(
		Guid projectId,
		[FromBody] RenameProjectRequest request)
	{
		try
		{
			var success = await projectService.RenameProjectAsync(
				projectId, request.NewName);

			if (!success)
				return NotFound(new { Error = "Проект не найден" });

			return Ok(new { Message = "Проект переименован" });
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Ошибка при переименовании проекта {ProjectId}", projectId);
			return StatusCode(500, new { Error = ex.Message });
		}
	}

	[HttpGet("{projectId:guid}/stats")]
	public async Task<ActionResult<ProjectStats>> GetProjectStats(Guid projectId)
	{
		try
		{
			var stats = await projectService.GetProjectStatsAsync(projectId);
			return Ok(stats);
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Ошибка при получении статистики проекта {ProjectId}", projectId);
			return StatusCode(500, new { Error = ex.Message });
		}
	}

	[HttpPost("{projectId:guid}/duplicate")]
	public async Task<ActionResult<Guid>> DuplicateProject(Guid projectId)
	{
		try
		{
			var originalProject = await projectService.GetProjectInfoAsync(projectId);
			if (originalProject == null)
				return NotFound(new { Error = "Проект не найден" });

			var newProjectId = await projectService.CreateProjectAsync($"{originalProject.Name} (копия)");

			return Ok(new { ProjectId = newProjectId });
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Ошибка при дублировании проекта {ProjectId}", projectId);
			return StatusCode(500, new { Error = ex.Message });
		}
	}
}