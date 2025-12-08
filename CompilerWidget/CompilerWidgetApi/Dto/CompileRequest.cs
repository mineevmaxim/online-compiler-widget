namespace CompilerWidgetApi.Dto;

public class CompileRequest
{
	public string MainFile { get; set; }
	public bool Optimize { get; set; } = true;
}