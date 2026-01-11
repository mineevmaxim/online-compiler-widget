using Microsoft.AspNetCore.Mvc;
using Compilation;
using FileStorage;
using System.Text.Json;
using CompilerWidgetApi.Dto;

namespace CompilerWidgetApi.Controllers;

[ApiController]
[Route("/api/compile")]
public class CompilerController(
	IFileService fileService,
	CompilerService compilerService,
	ILogger<CompilerController> logger)
	: ControllerBase
{
	private static readonly Dictionary<long, RunningProcessInfo> RunningProcesses = new();

	[HttpPost("project/{projectId:long}/run")]
	public async Task<ActionResult<RunResult>> Run(long projectId, [FromBody] RunRequest request)
	{
		try
		{
			logger.LogInformation("Запуск проекта {ProjectId}", projectId);

			if (RunningProcesses.ContainsKey(projectId))
				return Conflict(new { Error = "Проект уже запущен" });

			var projectFiles = fileService.GetProjectFiles(projectId).ToList();
			if (!projectFiles.Any())
				return NotFound(new { Error = "Проект не найден или не содержит файлов" });

			var mainFile = FindMainFile(projectFiles, request.MainFile);
			if (string.IsNullOrEmpty(mainFile))
				return BadRequest(new { Error = "Не найден основной файл проекта (.csproj или .cs)" });

			var tempPath = CreateTempProjectDirectory(projectId, projectFiles);

			var result = await compilerService.RunCompilerContainer(tempPath, mainFile);

			var processInfo = new RunningProcessInfo
			{
				ProjectId = projectId,
				StartedAt = DateTime.UtcNow,
				TempDirectory = tempPath,
				ProcessId = Guid.NewGuid().ToString()
			};

			RunningProcesses[projectId] = processInfo;

			logger.LogInformation("Проект {ProjectId} запущен успешно", projectId);

			return Ok(new RunResult
			{
				Success = result.Success,
				Output = result.Output,
				Errors = result.Errors.ToList(),
				ProcessId = processInfo.ProcessId,
				ProjectId = projectId,
				StartedAt = processInfo.StartedAt
			});
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Ошибка при запуске проекта {ProjectId}", projectId);
			return StatusCode(500, new { Error = ex.Message });
		}
	}

	[HttpPost("project/{projectId:long}/stop")]
	public Task<ActionResult> Stop(long projectId)
	{
		try
		{
			logger.LogInformation("Остановка проекта {ProjectId}", projectId);

			if (!RunningProcesses.TryGetValue(projectId, out var processInfo))
				return Task.FromResult<ActionResult>(NotFound(new { Error = "Проект не запущен" }));

			CompilerService.StopProcess(processInfo.ProcessId);
			logger.LogInformation("Процесс {ProcessId} остановлен", processInfo.ProcessId);

			try
			{
				if (Directory.Exists(processInfo.TempDirectory))
					Directory.Delete(processInfo.TempDirectory, true);
			}
			catch (Exception ex)
			{
				logger.LogWarning(ex, "Не удалось удалить временную директорию {Directory}",
					processInfo.TempDirectory);
			}

			RunningProcesses.Remove(projectId);

			logger.LogInformation("Проект {ProjectId} остановлен полностью", projectId);

			return Task.FromResult<ActionResult>(Ok(new
			{
				Message = "Проект остановлен",
				ProjectId = projectId,
				ProcessId = processInfo.ProcessId,
				StoppedAt = DateTime.UtcNow
			}));
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Ошибка при остановке проекта {ProjectId}", projectId);
			return Task.FromResult<ActionResult>(StatusCode(500, new { Error = ex.Message }));
		}
	}


	[HttpGet("project/{projectId:long}/status")]
	public ActionResult<ProcessStatus> GetStatus(long projectId)
	{
		var isRunning = RunningProcesses.ContainsKey(projectId);
		var processInfo = isRunning ? RunningProcesses[projectId] : null;

		return Ok(new ProcessStatus
		{
			ProjectId = projectId,
			IsRunning = isRunning,
			ProcessId = processInfo?.ProcessId,
			StartedAt = processInfo?.StartedAt,
			Uptime = processInfo != null ? DateTime.UtcNow - processInfo.StartedAt : TimeSpan.Zero
		});
	}

	[HttpGet("running-projects")]
	public ActionResult<IEnumerable<RunningProjectInfo>> GetRunningProjects()
	{
		var runningProjects = RunningProcesses.Values
			.Select(p => new RunningProjectInfo
			{
				ProjectId = p.ProjectId,
				ProcessId = p.ProcessId,
				StartedAt = p.StartedAt,
				Uptime = DateTime.UtcNow - p.StartedAt
			})
			.ToList();

		return Ok(runningProjects);
	}

	[HttpPost("project/{projectId:long}/compile")]
	public async Task<ActionResult<CompileResult>> Compile(long projectId, [FromBody] CompileRequest request)
	{
		try
		{
			logger.LogInformation("Компиляция проекта {ProjectId}", projectId);

			var projectFiles = fileService.GetProjectFiles(projectId).ToList();
			if (!projectFiles.Any())
				return NotFound(new { Error = "Проект не найден" });

			var tempPath = CreateTempProjectDirectory(projectId, projectFiles);

			var mainFile = FindMainFile(projectFiles, request.MainFile);
			if (string.IsNullOrEmpty(mainFile))
				return BadRequest(new { Error = "Не найден .csproj файл" });

			var result = await compilerService.RunCompilerContainer(tempPath, mainFile);

			try
			{
				if (Directory.Exists(tempPath))
					Directory.Delete(tempPath, true);
			}
			catch (Exception ex)
			{
				logger.LogWarning(ex, "Не удалось удалить временную директорию {Directory}", tempPath);
			}

			return Ok(new CompileResult
			{
				Success = result.Success,
				Output = result.Output,
				Errors = result.Errors.ToList(),
				ProjectId = projectId,
				CompiledAt = DateTime.UtcNow
			});
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Ошибка при компиляции проекта {ProjectId}", projectId);
			return StatusCode(500, new { Error = ex.Message });
		}
	}

	private string CreateTempProjectDirectory(long projectId, IEnumerable<FileMetadata> projectFiles)
	{
		var tempDir = Path.Combine(Path.GetTempPath(), $"compile_{projectId}_{Guid.NewGuid()}");
		Directory.CreateDirectory(tempDir);

		foreach (var file in projectFiles)
		{
			try
			{
				var filePath = Path.Combine(tempDir, file.Path ?? "", $"{file.FileName}");
				var dirPath = Path.GetDirectoryName(filePath);

				if (!Directory.Exists(dirPath))
					Directory.CreateDirectory(dirPath);

				var content = fileService.Read(file.FileId);
				System.IO.File.WriteAllText(filePath, content);
			}
			catch (Exception ex)
			{
				logger.LogWarning(ex, "Не удалось скопировать файл {FileName} во временную директорию", file.FileName);
			}
		}

		var appSettingsPath = Path.Combine(tempDir, "appsettings.json");
		if (System.IO.File.Exists(appSettingsPath)) return tempDir;
		var defaultSettings = new
		{
			Logging = new
			{
				LogLevel = new
				{
					Default = "Information",
					Microsoft = "Warning",
				}
			},
			AllowedHosts = "*"
		};

		System.IO.File.WriteAllText(appSettingsPath, JsonSerializer.Serialize(defaultSettings, new JsonSerializerOptions { WriteIndented = true }));

		return tempDir;
	}

	private static string FindMainFile(List<FileMetadata> projectFiles, string requestedMainFile = null)
	{
		if (!string.IsNullOrEmpty(requestedMainFile))
		{
			var file = projectFiles.FirstOrDefault(f => f.FileName.Equals(requestedMainFile, StringComparison.OrdinalIgnoreCase) ||
			                                            $"{f.FileName}".Equals(requestedMainFile, StringComparison.OrdinalIgnoreCase));

			if (file != null)
				return $"{file.FileName}";
		}

		var csprojFile = projectFiles.FirstOrDefault(f =>
			Path.GetExtension(f.FileName).Equals(".csproj", StringComparison.OrdinalIgnoreCase));

		if (csprojFile != null)
			return $"{csprojFile.FileName}";

		var programFile = projectFiles.FirstOrDefault(f =>
			$"{f.FileName}".Equals("Program", StringComparison.OrdinalIgnoreCase));

		if (programFile != null)
			return $"{programFile.FileName}";

		var csFile = projectFiles.FirstOrDefault(f =>
			Path.GetExtension(f.FileName).Equals(".cs", StringComparison.OrdinalIgnoreCase));

		return csFile != null ? $"{csFile.FileName}" : null;
	}
}