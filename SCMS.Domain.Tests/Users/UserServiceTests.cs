using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using SCMS.Database.Models;
using SCMS.Domain.Common;
using SCMS.Domain.Features.Users;
using SCMS.Domain.Features.Users.Models;
using SCMS.Domain.Security;
using SCMS.Domain.Tests.TestSupport;
using SCMS.Shared;
using Xunit;

namespace SCMS.Domain.Tests.Users
{
    public class UserServiceTests
    {
        private static IPermissionService CreatePermissionService(AppDbContext context)
        {
            var memoryCache = new MemoryCache(new MemoryCacheOptions());
            return new PermissionService(context, memoryCache);
        }

        [Fact]
        public async Task GetUsersAsync_ReturnsPaginatedUsersOrderedAscending()
        {
            using var db = new TestDatabase();
            var user1 = TestData.AddUser(db, name: "Alice", role: "staff");
            var user2 = TestData.AddUser(db, name: "Bob", role: "doctor");
            var permissionService = CreatePermissionService(db.Context);
            var service = new UserService(db.Context, new PasswordHashingService(), permissionService);

            var result = await service.GetUsersAsync(new GetUsersRequest { PageNumber = 1, PageSize = 10 });

            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Data);
            Assert.True(result.Data.Count >= 2);
            // Verify ascending order by UserId
            Assert.True(result.Data[0].UserId < result.Data[1].UserId);
        }

        [Fact]
        public async Task SearchUsersAsync_FiltersByKeyword()
        {
            using var db = new TestDatabase();
            var user1 = TestData.AddUser(db, name: "Charlie", role: "staff");
            var user2 = TestData.AddUser(db, name: "David", role: "doctor");
            var permissionService = CreatePermissionService(db.Context);
            var service = new UserService(db.Context, new PasswordHashingService(), permissionService);

            var result = await service.SearchUsersAsync(new SearchUsersRequest { Query = "Char" });

            Assert.True(result.IsSuccess);
            var user = Assert.Single(result.Data);
            Assert.Equal("Charlie", user.Name);
        }

        [Fact]
        public async Task CreateStaffUserAsync_CreatesUserWithRoles()
        {
            using var db = new TestDatabase();
            var permissionService = CreatePermissionService(db.Context);
            var service = new UserService(db.Context, new PasswordHashingService(), permissionService);

            var request = new CreateStaffUserRequest
            {
                Name = "Dr. Smith",
                Email = "dr.smith@example.com",
                MobileNo = "09123456789",
                Password = "Password123!",
                Roles = new List<string> { "Doctor" }
            };

            var result = await service.CreateStaffUserAsync(request);

            Assert.True(result.IsSuccess);
            Assert.NotNull(result.Data);
            Assert.Equal("Dr. Smith", result.Data.Name);
            Assert.Contains("Doctor", result.Data.Roles);
        }

        [Fact]
        public async Task UpdateUserRolesAsync_UpdatesAssignedRoles()
        {
            using var db = new TestDatabase();
            var user = TestData.AddUser(db, name: "Eve", role: "staff");
            var permissionService = CreatePermissionService(db.Context);
            var service = new UserService(db.Context, new PasswordHashingService(), permissionService);

            var result = await service.UpdateUserRolesAsync(user.UserId, new UpdateUserRolesRequest
            {
                Roles = new List<string> { "Admin", "Doctor" }
            });

            Assert.True(result.IsSuccess);
            Assert.Equal(2, result.Data!.Roles.Count);
            Assert.Contains("Admin", result.Data.Roles);
            Assert.Contains("Doctor", result.Data.Roles);
        }

        [Fact]
        public async Task DeleteUserAsync_BlocksOwnerDeletion()
        {
            using var db = new TestDatabase();
            var owner = TestData.AddUser(db, name: "Super Owner", role: "owner");
            var permissionService = CreatePermissionService(db.Context);
            var service = new UserService(db.Context, new PasswordHashingService(), permissionService);

            var result = await service.DeleteUserAsync(owner.UserId);

            Assert.True(result.IsFailure);
            Assert.Contains("Owner account cannot be deleted", result.Message);
        }
    }
}
