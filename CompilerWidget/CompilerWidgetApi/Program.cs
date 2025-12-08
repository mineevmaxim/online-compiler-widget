using Compilation;
using Compilation.Services;
using FileStorage;
using Microsoft.EntityFrameworkCore;

var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration;
var assemblyName = typeof(Program).Assembly.GetName().Name;

builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
	options.AddPolicy("AllowAll", policy =>
	{
		policy.AllowAnyOrigin()
			.AllowAnyMethod()
			.AllowAnyHeader();
	});
});

builder.Services.AddSingleton<CSharpCompilerService>();
builder.Services.AddScoped<IFileService, FileService>();
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<DockerService>();

var sqlConnectionString = configuration.GetConnectionString("DataAccessPostgreSqlProvider");

builder.Services.AddDbContext<FileStorageDbContext>(options =>
	options.UseNpgsql(
		sqlConnectionString,
		b => b.MigrationsAssembly(assemblyName)
	)
);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<FileStorageDbContext>(options => options.UseNpgsql(sqlConnectionString));

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowAll");

if (app.Environment.IsDevelopment())
	app.MapOpenApi();

app.UseHttpsRedirection();

app.MapControllers();

app.Run();