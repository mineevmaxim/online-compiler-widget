// CompilerService.Tests/CSharpCompilerServiceTests.cs
using CompilerService.Models;
using CompilerService.Services;
using Xunit;

namespace CompilerService.Tests;

public class CSharpCompilerServiceTests
{
    private readonly CSharpCompilerService _compiler = new();

    [Fact]
    public void ValidHelloWorld_ReturnsOutput()
    {
        // Arrange
        var request = new ProjectRequest
        {
            Files = new Dictionary<string, string>
            {
                ["Program.cs"] = @"
using System;
class Program 
{
    public static void Main() 
    {
        Console.WriteLine(""Hello from sandbox!"");
    }
}"
            }
        };

        // Act
        var result = _compiler.CompileAndRun(request, timeoutMs: 5000);

        // Assert
        Assert.True(result.Success);
        Assert.Contains("Hello from sandbox!", result.Output);
        Assert.Empty(result.Errors);
    }

    [Fact]
    public void SyntaxError_ReturnsCompilationError()
    {
        // Arrange
        var request = new ProjectRequest
        {
            Files = new Dictionary<string, string>
            {
                ["Program.cs"] = @"
class Program 
{
    static void Main() 
    {
        Console.WriteLine(""Missing semicolon""
    }
}"
            }
        };

        // Act
        var result = _compiler.CompileAndRun(request);

        // Assert
        Assert.False(result.Success);
        Assert.NotEmpty(result.Errors);
        Assert.Contains("CS1002", result.Errors.First().ErrorCode); // ожидаемая ошибка: пропущена точка с запятой
    }

    [Fact]
    public void InfiniteLoop_TimesOut()
    {
        // Arrange
        var request = new ProjectRequest
        {
            Files = new Dictionary<string, string>
            {
                ["Program.cs"] = @"
using System;
class Program 
{
    static void Main() 
    {
        while (true) { }
    }
}"
            }
        };

        // Act
        var result = _compiler.CompileAndRun(request, timeoutMs: 1000); // 1 секунда

        // Assert
        Assert.False(result.Success);
        Assert.NotEmpty(result.Errors);
        Assert.Contains("таймаут", result.Errors.First().Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public void RuntimeException_ReturnsRuntimeError()
    {
        // Arrange
        var request = new ProjectRequest
        {
            Files = new Dictionary<string, string>
            {
                ["Program.cs"] = @"
using System;
class Program 
{
    static void Main() 
    {
        throw new Exception(""Test exception"");
    }
}"
            }
        };

        // Act
        var result = _compiler.CompileAndRun(request);

        // Assert
        Assert.False(result.Success);
        Assert.NotEmpty(result.Errors);
        Assert.Equal("RuntimeError", result.Errors.First().ErrorCode);
        Assert.Contains("Test exception", result.Errors.First().Message);
    }
}