using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FileStorage;

public class FileStorageDbContext : DbContext
{
	public FileStorageDbContext(DbContextOptions<FileStorageDbContext> options)
		: base(options)
	{
	}

	public FileStorageDbContext()
	{
	}

	public DbSet<ProjectFile> ProjectFiles { get; set; }
	public DbSet<Project> Projects { get; set; }
	public DbSet<WidgetInfo> WidgetInfos { get; set; }

	protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
	{
		if (!optionsBuilder.IsConfigured)
		{
			optionsBuilder.UseNpgsql("Host=localhost;Database=compiler;Username=postgres;Password=postgres");
			optionsBuilder.EnableSensitiveDataLogging();
			optionsBuilder.LogTo(Console.WriteLine, LogLevel.Information);
		}
	}

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
}