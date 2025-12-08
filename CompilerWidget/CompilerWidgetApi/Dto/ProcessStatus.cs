namespace CompilerWidgetApi.Dto;

public class ProcessStatus
{
	public Guid ProjectId { get; set; }
	public bool IsRunning { get; set; }
	public string ProcessId { get; set; }
	public DateTime? StartedAt { get; set; }
	public TimeSpan Uptime { get; set; }
}