using System.Threading.Tasks;
using SCMS.Shared;
using SCMS.Shared.Contracts.Dashboards;

namespace SCMS.Domain.Features.Dashboards
{
    public interface IDashboardService
    {
        Task<Result<DashboardStatsResponse>> GetStatsAsync(int userId, bool isStaff);
        Task<Result<StaffDashboardResponse>> GetStaffDashboardAsync(int userId);
        Task<Result<PatientDashboardResponse>> GetPatientDashboardAsync(int userId);
    }
}
