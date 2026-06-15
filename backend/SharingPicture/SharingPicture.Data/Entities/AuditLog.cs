using System;
using System.Collections.Generic;

namespace SharingPicture.Data.Entities;

public partial class AuditLog
{
    public int Id { get; set; }

    public int ActorId { get; set; }

    public string ActionType { get; set; } = null!;

    public int? TargetId { get; set; }

    public string? Details { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User Actor { get; set; } = null!;
}
