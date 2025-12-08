using Compilation.Models;
using Docker.DotNet;
using Docker.DotNet.Models;
using Microsoft.Extensions.Logging;

namespace Compilation;

public class DockerService : IDisposable
{
	private readonly DockerClient docker;
	private readonly ILogger<DockerService> logger;

	public DockerService(ILogger<DockerService> logger)
	{
		docker = new DockerClientConfiguration()
			.CreateClient();
		this.logger = logger;
	}

	public async Task<CompilationResult> RunCompilerContainer(string sourcePath, string mainFile)
	{
		return await ExecuteInContainer(sourcePath, mainFile, ["dotnet", "run", "--project"]);
	}

	public async Task<CompilationResult> CompileOnly(string sourcePath, string mainFile)
	{
		return await ExecuteInContainer(sourcePath, mainFile, ["dotnet", "build", "--verbosity", "quiet"]);
	}

	private async Task<CompilationResult> ExecuteInContainer(string sourcePath, string mainFile, string[] command)
	{
		var containerName = $"compile_{Guid.NewGuid()}";

		var fullCommand = command.ToList();
		fullCommand.Add($"/app/{mainFile}");

		try
		{
			logger.LogInformation("Создание контейнера {ContainerName} для компиляции", containerName);

			var container = await docker.Containers.CreateContainerAsync(new CreateContainerParameters
			{
				Image = "mcr.microsoft.com/dotnet/sdk:8.0",
				Name = containerName,
				HostConfig = new HostConfig
				{
					Binds = [$"{Path.GetFullPath(sourcePath)}:/app"],
					AutoRemove = true,
					Memory = 512 * 1024 * 1024,
					MemorySwap = 0,
					CPUPeriod = 100000,
					CPUQuota = 50000,
					ReadonlyRootfs = false,
					NetworkMode = "none"
				},
				Cmd = fullCommand,
				AttachStdout = true,
				AttachStderr = true
			});

			logger.LogInformation("Запуск контейнера {ContainerName}", containerName);
			await docker.Containers.StartContainerAsync(container.ID, null);

			var (exitCode, output) = await WaitForContainerExit(container.ID);

			return new CompilationResult
			{
				Success = exitCode == 0,
				Output = output.stdout,
				Errors = exitCode != 0
					? [new CompilationError { ErrorCode = "COMPILE_ERROR", Message = output.stderr }]
					: []
			};
		}
		catch (Exception ex)
		{
			logger.LogError(ex, "Ошибка при выполнении в контейнере");
			return new CompilationResult
			{
				Success = false,
				Output = "",
				Errors = [new CompilationError { ErrorCode = "DOCKER_ERROR", Message = ex.Message }]
			};
		}
	}

	private async Task<(long, (string stdout, string stderr))> WaitForContainerExit(string containerId)
	{
		using var stream = await docker.Containers.GetContainerLogsAsync(containerId,
			new ContainerLogsParameters { ShowStderr = true, ShowStdout = true, Follow = true });

		using var reader = new StreamReader(stream);
		var stdout = await reader.ReadToEndAsync();

		// Разделяем stdout и stderr (они могут быть смешаны)
		var lines = stdout.Split('\n');
		var stdOutLines = new List<string>();
		var stdErrLines = new List<string>();

		foreach (var line in lines)
		{
			if (line.StartsWith("STDERR:", StringComparison.OrdinalIgnoreCase))
			{
				stdErrLines.Add(line.Substring(7));
			}
			else if (!string.IsNullOrWhiteSpace(line))
			{
				stdOutLines.Add(line);
			}
		}

		var stdoutResult = string.Join("\n", stdOutLines);
		var stderrResult = string.Join("\n", stdErrLines);

		try
		{
			var inspect = await docker.Containers.InspectContainerAsync(containerId);
			return (inspect.State.ExitCode, (stdoutResult, stderrResult));
		}
		catch
		{
			return (1, (stdoutResult, stderrResult));
		}
	}

	public void Dispose()
	{
		docker?.Dispose();
	}
}