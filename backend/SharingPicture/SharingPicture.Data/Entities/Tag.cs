using System;
using System.Collections.Generic;

namespace SharingPicture.Data.Entities;

public partial class Tag
{
    public int Id { get; set; }

    public string TagName { get; set; } = null!;

    public virtual ICollection<Post> Posts { get; set; } = new List<Post>();
}
