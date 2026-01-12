using System.Text.Json;

namespace CompilerWidgetApi.Dto;

public class WidgetInfoRequest
{
    public long WidgetId { get; set; }
    public long UserId { get; set; }
    public string Role { get; set; } = string.Empty;
    public JsonElement Config { get; set; }
    public BoardDto Board { get; set; } = new();
}