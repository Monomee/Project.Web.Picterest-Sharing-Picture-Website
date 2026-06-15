using System;
using System.Collections.Generic;

namespace SharingPicture.Data.Entities;

public partial class Follow
{
    public int FollowerId { get; set; }

    public int FollowedId { get; set; }

    public DateTime? CreatedAt { get; set; }

    public virtual User Followed { get; set; } = null!;

    public virtual User Follower { get; set; } = null!;
}
