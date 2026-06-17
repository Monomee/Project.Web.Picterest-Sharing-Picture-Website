using SharingPicture.Data.Entities;
using System.Threading.Tasks;

namespace SharingPicture.Services;

public interface IReportService
{
    Task<Report> ReportPostAsync(int reporterId, int postId, string reason);
}
