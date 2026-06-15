using System;
using System.Collections.Generic;

namespace SharingPicture.Data.Entities;

public partial class Warning
{
    public int Id { get; set; }

    public int UserId { get; set; }

    public string Content { get; set; } = null!;

    public DateTime? CreatedAt { get; set; }

    public virtual User User { get; set; } = null!;
}
