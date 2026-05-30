using Microsoft.EntityFrameworkCore;
using SCMS.Database.Models;

namespace SCMS.Domain.Tests.TestSupport;

public sealed class TestDatabase : IDisposable
{
    public TestDatabase()
    {
        AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true);
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Port=5432;Database=SCMS_db;Username=postgres;Password=admin;")
            .Options;

        Context = new AppDbContext(options);
        
        // Use a transaction for tests to avoid polluting the actual local database
        Context.Database.BeginTransaction();
    }

    public AppDbContext Context { get; }

    public void Dispose()
    {
        Context.Database.RollbackTransaction();
        Context.Dispose();
    }
}
