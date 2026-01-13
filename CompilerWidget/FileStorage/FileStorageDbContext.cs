using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FileStorage;

public class FileStorageDbContext : DbContext
{
	private readonly ILogger<FileStorageDbContext> _logger;

	public FileStorageDbContext(DbContextOptions<FileStorageDbContext> options)
		: base(options)
	{
	}

	// УДАЛИТЬ пустой конструктор!

	public DbSet<ProjectFile> ProjectFiles { get; set; }
	public DbSet<Project> Projects { get; set; }
	public DbSet<WidgetInfo> WidgetInfos { get; set; }

	protected override void OnModelCreating(ModelBuilder builder)
	{
		builder.Entity<Project>()
			.HasMany(p => p.Files)
			.WithOne(p => p.Project)
			.HasForeignKey(f => f.ProjectId)
			.OnDelete(DeleteBehavior.Cascade);

		builder.Entity<ProjectFile>()
			.HasKey(m => m.FileId);
        
		builder.Entity<WidgetInfo>(entity =>
		{
			entity.HasKey(e => e.WidgetId); // Primary key
			entity.Property(e => e.Config)
				.HasColumnType("jsonb"); // Для PostgreSQL
		});

		base.OnModelCreating(builder);
	}

	// Добавьте для отладки
	protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
	{
		if (!optionsBuilder.IsConfigured)
		{
			// Это только для отладки - в продакшене не должно срабатывать
			Console.WriteLine("WARNING: DbContext configured without DI!");
		}
        
		// Включаем подробное логирование для отладки
		optionsBuilder.LogTo(msg => Console.WriteLine($"EF: {msg}"), LogLevel.Information);
	}
}