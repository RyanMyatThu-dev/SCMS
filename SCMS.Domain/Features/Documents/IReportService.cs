using System.Threading.Tasks;
using SCMS.Shared;
using SCMS.Shared.Contracts.Reports;

namespace SCMS.Domain.Features.Documents
{
    public interface IReportService
    {
        Task<Result<MonthlyReportDto>> GetMonthlyReportAsync(int year, int month);
        Task<Result<WeeklyReportDto>> GetWeeklyReportAsync(int year, int week);
    }
}
