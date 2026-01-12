using System.Text.Json;

namespace CompilerWidgetApi.Dto;

public class WidgetInfoResponse
{
    public long WidgetId { get; set; }
    public long UserId { get; set; }
    public string Role { get; set; } = string.Empty;
    public JsonElement Config { get; set; }

    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}