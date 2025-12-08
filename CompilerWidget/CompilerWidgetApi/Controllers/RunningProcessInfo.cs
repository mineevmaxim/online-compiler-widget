namespace CompilerWidgetApi.Controllers;

public class RunningProcessInfo
{
	public Guid ProjectId { get; set; }
	public string ProcessId { get; set; }
	public DateTime StartedAt { get; set; }
	public string TempDirectory { get; set; }
}