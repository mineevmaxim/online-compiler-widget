namespace FileStorage;

public class WidgetInfo
{
    public long WidgetId { get; set; }
    public long UserId { get; set; }
    public string Role { get; set; } = string.Empty;
    public string Config { get; set; } = string.Empty;
    public long BoardId { get; set; }
    public string BoardName { get; set; } = string.Empty;
    public long BoardParentId { get; set; }
}
