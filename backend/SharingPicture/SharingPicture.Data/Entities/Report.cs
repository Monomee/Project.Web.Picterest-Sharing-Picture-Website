using System;
using System.Collections.Generic;

namespace SharingPicture.Data.Entities;

public partial class Report
{
    public int Id { get; set; }

    public int ReporterId { get; set; }

    public int PostId { get; set; }

    public string Reason { get; set; } = null!;

    public string? Status { get; set; }

    public int? ModeratorId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User? Moderator { get; set; }

    public virtual Post Post { get; set; } = null!;

    public virtual User Reporter { get; set; } = null!;
}
