namespace CompilerWidgetApi.Dto;

public class RunningProcessInfo
{
	public long ProjectId { get; set; }
	public string ProcessId { get; set; }
	public DateTime StartedAt { get; set; }
	public string TempDirectory { get; set; }
	public CancellationTokenSource CancellationTokenSource { get; set; }
}