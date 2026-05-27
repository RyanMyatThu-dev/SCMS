using Microsoft.Data.Sqlite;
using Microsoft.EntityFrameworkCore;
using SCMS.Database.Models;

namespace SCMS.Domain.Tests.TestSupport;

public sealed class TestDatabase : IDisposable
{
    private readonly SqliteConnection _connection;

    public TestDatabase()
    {
        _connection = new SqliteConnection("Data Source=:memory:");
        _connection.Open();

        var options = new DbContextOptionsBuilder<ScmsDbContext>()
            .UseSqlite(_connection)
            .Options;

        Context = new ScmsDbContext(options);
        Context.Database.EnsureCreated();
    }

    public ScmsDbContext Context { get; }

    public void Dispose()
    {
        Context.Dispose();
        _connection.Dispose();
    }
}
