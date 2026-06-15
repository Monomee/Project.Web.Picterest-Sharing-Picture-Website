using System;
using System.Collections.Generic;

namespace SharingPicture.Data.Entities;

public partial class UserRole
{
    public int UserId { get; set; }

    public virtual User User { get; set; } = null!;

    public int RoleId { get; set; }

    public virtual Role Role { get; set; } = null!;
}
