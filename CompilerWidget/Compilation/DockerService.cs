using Compilation.Models;
using Docker.DotNet;
using Docker.DotNet.Models;

namespace Compilation;

public class DockerService : IDisposable
{
	private readonly DockerClient docker = new DockerClientConfiguration()
		.CreateClient();

	public async Task<CompilationResult> RunCompilerContainer(string sourcePath, string mainFile)
	{
		var containerName = $"compile_{Guid.NewGuid()}";

		var container = await docker.Containers.CreateContainerAsync(new CreateContainerParameters
		{
			Image = "mcr.microsoft.com/dotnet/sdk:8.0",
			Name = containerName,
			HostConfig = new HostConfig
			{
				Binds = [$"{sourcePath}:/app:ro"],
				AutoRemove = true,
				Memory = 512 * 1024 * 1024,
				MemorySwap = 0,
				CPUPeriod = 100000,
				CPUQuota = 50000,
				ReadonlyRootfs = true,
				NetworkMode = "none"
			},
			Cmd = ["dotnet", "run", "--project", $"/app/{mainFile}"],
			AttachStdout = true,
			AttachStderr = true
		});

		await docker.Containers.StartContainerAsync(container.ID, null);

		var (exitCode, output) = await WaitForContainerExit(container.ID);

		return new CompilationResult
		{
			Success = exitCode == 0,
			Output = output.stdout,
			Errors = [new CompilationError {ErrorCode = "error", Message = output.stderr}]
		};
	}

	private async Task<(long, (string stdout, string stderr))> WaitForContainerExit(string containerId)
	{
		var stream = await docker.Containers.GetContainerLogsAsync(containerId,
			new ContainerLogsParameters { ShowStderr = true, ShowStdout = true, Follow = true });

		using var reader = new StreamReader(stream);
		var output = await reader.ReadToEndAsync();

		var inspect = await docker.Containers.InspectContainerAsync(containerId);
		return (inspect.State.ExitCode, (output, ""));
	}

	public void Dispose() => docker?.Dispose();
}