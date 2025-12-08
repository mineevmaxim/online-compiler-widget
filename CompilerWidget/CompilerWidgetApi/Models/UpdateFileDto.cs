namespace CompilerWidgetApi.Models;

public record UpdateFileDto(string? Content);

public record RenameFileDto(string? Name);

public record CreateFileDto(string Name, string Path);