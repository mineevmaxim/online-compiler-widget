using CompilerWidgetApi.Models;
using FileStorage;
using Microsoft.AspNetCore.Mvc;

namespace CompilerWidgetApi.Controllers;

[ApiController]
[Route("/api/files")]
public class FileController(IFileService fileService): Controller
{
	[HttpPost]
	[Route("{fileId:guid}/save")]
	public ActionResult<Guid> SaveFile(Guid fileId, [FromBody] UpdateFileDto updateFileDto)
	{
		fileService.Update(fileId, updateFileDto.Content ?? "");
		return Ok(fileId);
	}

	[HttpPost]
	[Route("{fileId:guid}/rename")]
	public ActionResult<Guid> RenameFile(Guid fileId, RenameFileDto renameFileDto)
	{
		fileService.Rename(fileId, renameFileDto.Name ?? "emptyName");
		return Ok(fileId);
	}

	[HttpPost]
	[Route("{fileId:guid}/delete")]
	public ActionResult DeleteFile(Guid fileId)
	{
		fileService.Remove(fileId);
		return Ok();
	}

	[HttpPost]
	[Route("project/{projectId:guid}")]
	public ActionResult<Guid> CreateFile(Guid projectId, [FromBody] CreateFileDto createFileDto)
	{
		var result = fileService.Create(createFileDto.Name, projectId, createFileDto.Path);
		return Ok(result);
	}

	[HttpPost]
	[Route("{fileId:guid}")]
	public ActionResult<string> GetFile(Guid fileId)
	{
		var file = fileService.Read(fileId);
		return Ok(file);
	}
}