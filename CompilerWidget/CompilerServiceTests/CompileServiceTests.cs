using CompilerService.Models;
using CompilerService.Services;

namespace CompilerServiceTests;

[TestFixture]
[Category("RequiresBackendIsRunning")]
public class CompileServiceTests
{
	private CSharpCompilerService compilerService = null!;

	[SetUp]
	public void Setup()
	{
		compilerService = new CSharpCompilerService();
	}

	[Test]
	public void WithErrors()
	{
		var project = new ProjectRequest
		{
			Files = new Dictionary<string, string>
			{
				["Program.cs"] = """
				                 public class Program
				                 {
				                     public static void Main()
				                     {
				                         System.Console.WriteLine("Hello, Online Compiler!");
				                         System.Console.WriteLine("Test successful!");
				                     }
				                 }
				                 """
			}
		};

		Console.WriteLine("Testing CSharpCompilerService...");
		var result = compilerService.CompileAndRun(project);

		Console.WriteLine("=== COMPILATION RESULT ===");
		Console.WriteLine($"Success: {result.Success}");

		if (result.Output.Length != 0)
		{
			Console.WriteLine("Output:");
			foreach (var line in result.Output)
				Console.WriteLine($"  {line}");
		}

		if (!result.Success && result.Errors.Any())
		{
			Console.WriteLine("Errors:");
			foreach (var error in result.Errors)
				Console.WriteLine($"  [{error.ErrorCode}] Line {error.StartLine}: {error.Message}");
		}
	}

	[Test]
	public void SimpleCase()
	{
		const string test1 = """

		                     public class A { 
		                         public static void Main() { } 
		                     }
		                     """;
		Console.WriteLine("Test 1: " + SimpleCompiler.CompileCode(test1));
	}

	[Test]
	public void WithMethods()
	{
		const string test2 = """

		                     public class B { 
		                         private object obj = new object();
		                         public void Test() { }
		                     }
		                     """;
		Console.WriteLine("Test 2: " + SimpleCompiler.CompileCode(test2));
	}

	[Test]
	public void WithEntryPoint()
	{
		const string test3 = """

		                     using System;
		                     public class C { 
		                         public static void Main() { 
		                             // Пустой Main
		                         } 
		                     }
		                     """;
		Console.WriteLine("Test 3: " + SimpleCompiler.CompileCode(test3));
	}
}