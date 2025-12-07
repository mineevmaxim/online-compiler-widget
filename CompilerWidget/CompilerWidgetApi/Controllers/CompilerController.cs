using Microsoft.AspNetCore.Mvc;

namespace CompilerWidgetApi.Controllers;

[ApiController]
[Route("/api/compile")]
public class CompilerController: Controller
{
	[HttpPost]
	[Route("/project/{projectId:guid}/compile")]
	public async Task<ActionResult> CompileAndRun(Guid projectId)
	{
		await Task.Delay(1);
		return Ok(projectId);
	}
}