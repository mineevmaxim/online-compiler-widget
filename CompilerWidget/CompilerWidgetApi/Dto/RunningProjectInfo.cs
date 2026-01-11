namespace CompilerWidgetApi.Dto;

public class RunningProjectInfo
{
	public long ProjectId { get; set; }
	public string ProcessId { get; set; }
	public DateTime StartedAt { get; set; }
	public TimeSpan Uptime { get; set; }
}