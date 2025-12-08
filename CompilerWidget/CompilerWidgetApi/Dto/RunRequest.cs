namespace CompilerWidgetApi.Dto;

public class RunRequest
{
	public string MainFile { get; set; }
	public Dictionary<string, string> EnvironmentVariables { get; set; } = new();
	public int? TimeoutSeconds { get; set; } = 30;
}