using Microsoft.EntityFrameworkCore;

namespace FileStorage;

public class FileStorageDbContext(DbContextOptions<FileStorageDbContext> options) : DbContext(options)
{
	private const string CreatePropertyName = "CreatedTimestamp";
	private const string UpdatePropertyName = "UpdatedTimestamp";

	DbSet<ProjectFile> ProjectFiles { get; set; }
	DbSet<Project> Projects { get; set; }

	protected override void OnModelCreating(ModelBuilder builder)
	{
		builder.Entity<Project>()
			.HasMany(p => p.Files);

		builder.Entity<ProjectFile>()
			.HasKey(m => m.FileId);

		builder.Entity<Project>().Property<DateTime>(CreatePropertyName);
		builder.Entity<ProjectFile>().Property<DateTime>(CreatePropertyName);

		builder.Entity<Project>().Property<DateTime>(UpdatePropertyName);
		builder.Entity<ProjectFile>().Property<DateTime>(UpdatePropertyName);

		base.OnModelCreating(builder);
	}

	public override int SaveChanges()
	{
		ChangeTracker.DetectChanges();

		UpdateUpdatedProperty<Project>();
		UpdateUpdatedProperty<ProjectFile>();

		return base.SaveChanges();
	}

	private void UpdateUpdatedProperty<T>() where T : class
	{
		var modifiedSourceInfo = ChangeTracker.Entries<T>()
			.Where(e => e.State is EntityState.Added or EntityState.Modified);

		foreach (var entry in modifiedSourceInfo)
			entry.Property(UpdatePropertyName).CurrentValue = DateTime.UtcNow;
	}
}