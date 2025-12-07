using Compilation.Models;

namespace Compilation;

public class CompilerService
{
	private readonly DockerService dockerService;

	public CompilerService(DockerService dockerService)
	{
		this.dockerService = dockerService;
	}
	
	public async Task<CompilationResult> CompileProject(CompilationProject project)
	{
		var tempPath = CreateTempDirectory();
        
		try 
		{
			await CreateFileStructure(tempPath, project.Files);

			return await dockerService.RunCompilerContainer(tempPath, project.EntryPoint);
		}
		finally
		{
			Directory.Delete(tempPath, recursive: true);
		}
	}
    
	private static async Task CreateFileStructure(string basePath, List<ProjectFile> files)
	{
		foreach (var file in files)
		{
			var fullPath = Path.Combine(basePath, file.Name);
			var directory = Path.GetDirectoryName(fullPath);
            
			Directory.CreateDirectory(directory);
			await File.WriteAllTextAsync(fullPath, file.Content);
		}
	}
	
	private static string CreateTempDirectory()
	{
		var tempPath = Path.Combine(Path.GetTempPath(), "compiler", Guid.NewGuid().ToString());
		Directory.CreateDirectory(tempPath);
		return tempPath;
	}
}