using Compilation;
using Compilation.Services;
using FileStorage;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

var builder = WebApplication.CreateBuilder(args);
var configuration = builder.Configuration;

builder.Services.AddOpenApi();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
        policy.AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader());
});

builder.Services.AddSingleton<CSharpCompilerService>();
builder.Services.AddScoped<IFileService, FileService>();
builder.Services.AddScoped<IProjectService, ProjectService>();
builder.Services.AddScoped<CompilerService>();

var sqlConnectionString = 
    configuration.GetConnectionString("DataAccessPostgreSqlProvider") 
    + ";Pooling=true;MinPoolSize=1;MaxPoolSize=20;Connection Lifetime=300";

Console.WriteLine($"Connection string: {sqlConnectionString.Replace("Password=", "Password=***")}");

builder.Services.AddDbContext<FileStorageDbContext>(options =>
    options.UseNpgsql(
        sqlConnectionString,
        x => 
        {
            x.MigrationsAssembly("FileStorage");
            x.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorCodesToAdd: null);
        }
    ),
    ServiceLifetime.Scoped
);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();

app.UseCors("AllowAll");

if (app.Environment.IsDevelopment())
    app.MapOpenApi();

app.UseHttpsRedirection();
app.MapControllers();

// Применение миграций с обработкой ошибок
using (var scope = app.Services.CreateScope())
{
    try
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        var context = scope.ServiceProvider.GetRequiredService<FileStorageDbContext>();

        logger.LogInformation("Проверка подключения к БД...");
        
        // Даем PostgreSQL время на запуск
        await Task.Delay(5000);
        
        var canConnect = await context.Database.CanConnectAsync();
        
        if (canConnect)
        {
            logger.LogInformation("Подключение к БД успешно, применяем миграции...");
            
            // Получаем ожидающие миграции
            var pendingMigrations = await context.Database.GetPendingMigrationsAsync();
            if (pendingMigrations.Any())
            {
                await context.Database.MigrateAsync();
                logger.LogInformation($"Применены миграции: {string.Join(", ", pendingMigrations)}");
            }
            else
            {
                logger.LogInformation("Нет ожидающих миграций");
            }
        }
        else
        {
            logger.LogWarning("Не удалось подключиться к БД");
        }
    }
    catch (Exception ex)
    {
        var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();
        logger.LogError(ex, "Ошибка при применении миграций");
        // Не прерываем работу приложения
    }
}

app.Run();