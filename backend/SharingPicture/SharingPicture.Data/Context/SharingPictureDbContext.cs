using Microsoft.EntityFrameworkCore;
using SharingPicture.Data.Entities;
using System;
using System.Collections.Generic;

namespace SharingPicture.Data.Context;

public partial class SharingPictureDbContext : DbContext
{
    public SharingPictureDbContext()
    {
    }

    public SharingPictureDbContext(DbContextOptions<SharingPictureDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<AuditLog> AuditLogs { get; set; }

    public virtual DbSet<Comment> Comments { get; set; }

    public virtual DbSet<Follow> Follows { get; set; }

    public virtual DbSet<Like> Likes { get; set; }

    public virtual DbSet<Post> Posts { get; set; }

    public virtual DbSet<Report> Reports { get; set; }

    public virtual DbSet<Role> Roles { get; set; }

    public virtual DbSet<Tag> Tags { get; set; }

    public virtual DbSet<User> Users { get; set; }

    public virtual DbSet<UserRole> UserRoles { get; set; }

    public virtual DbSet<Warning> Warnings { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
    }
    //#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
    //        => optionsBuilder.UseSqlServer("Server=MONOME\\SQLEXPRESS;Database=SharingPictureDB;Trusted_Connection=True;TrustServerCertificate=True;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__audit_lo__3213E83F1FB4AB75");

            entity.ToTable("audit_logs");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.ActionType)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("action_type");
            entity.Property(e => e.ActorId).HasColumnName("actor_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.Details).HasColumnName("details");
            entity.Property(e => e.TargetId).HasColumnName("target_id");

            entity.HasOne(d => d.Actor).WithMany(p => p.AuditLogs)
                .HasForeignKey(d => d.ActorId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_audit_logs_users");
        });

        modelBuilder.Entity<Comment>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__comments__3213E83FF6E0E27A");

            entity.ToTable("comments");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Content).HasColumnName("content");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.PostId).HasColumnName("post_id");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.Post).WithMany(p => p.Comments)
                .HasForeignKey(d => d.PostId)
                .HasConstraintName("FK_comments_posts");

            entity.HasOne(d => d.User).WithMany(p => p.Comments)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_comments_users");
        });

        modelBuilder.Entity<Follow>(entity =>
        {
            entity.HasKey(e => new { e.FollowerId, e.FollowedId }).HasName("PK__follows__838707A3990CAB55");

            entity.ToTable("follows");

            entity.Property(e => e.FollowerId).HasColumnName("follower_id");
            entity.Property(e => e.FollowedId).HasColumnName("followed_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");

            entity.HasOne(d => d.Followed).WithMany(p => p.FollowFolloweds)
                .HasForeignKey(d => d.FollowedId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_follows_followed");

            entity.HasOne(d => d.Follower).WithMany(p => p.FollowFollowers)
                .HasForeignKey(d => d.FollowerId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_follows_follower");
        });

        modelBuilder.Entity<Like>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.PostId }).HasName("PK__likes__CA534F798A0F1FF9");

            entity.ToTable("likes");

            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.PostId).HasColumnName("post_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");

            entity.HasOne(d => d.Post).WithMany(p => p.Likes)
                .HasForeignKey(d => d.PostId)
                .HasConstraintName("FK_likes_posts");

            entity.HasOne(d => d.User).WithMany(p => p.Likes)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_likes_users");
        });

        modelBuilder.Entity<Post>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__posts__3213E83FA6F6E525");

            entity.ToTable("posts");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Caption).HasColumnName("caption");
            entity.Property(e => e.CloudinaryPublicId)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("cloudinary_public_id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.DeliveryStatus)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("pending")
                .HasColumnName("delivery_status");
            entity.Property(e => e.ImageUrl)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("image_url");
            entity.Property(e => e.IsPrivate)
                .HasDefaultValue(false)
                .HasColumnName("is_private");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.Posts)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_posts_users");

            entity.HasMany(d => d.Tags).WithMany(p => p.Posts)
                .UsingEntity<Dictionary<string, object>>(
                    "PostTag",
                    r => r.HasOne<Tag>().WithMany()
                        .HasForeignKey("TagId")
                        .HasConstraintName("FK_post_tags_tags"),
                    l => l.HasOne<Post>().WithMany()
                        .HasForeignKey("PostId")
                        .HasConstraintName("FK_post_tags_posts"),
                    j =>
                    {
                        j.HasKey("PostId", "TagId").HasName("PK__post_tag__4AFEED4D6A489DF2");
                        j.ToTable("post_tags");
                        j.IndexerProperty<int>("PostId").HasColumnName("post_id");
                        j.IndexerProperty<int>("TagId").HasColumnName("tag_id");
                    });
        });

        modelBuilder.Entity<Report>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__reports__3213E83F11255112");

            entity.ToTable("reports");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.ModeratorId).HasColumnName("moderator_id");
            entity.Property(e => e.PostId).HasColumnName("post_id");
            entity.Property(e => e.Reason).HasColumnName("reason");
            entity.Property(e => e.ReporterId).HasColumnName("reporter_id");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("pending")
                .HasColumnName("status");

            entity.HasOne(d => d.Moderator).WithMany(p => p.ReportModerators)
                .HasForeignKey(d => d.ModeratorId)
                .HasConstraintName("FK_reports_moderator");

            entity.HasOne(d => d.Post).WithMany(p => p.Reports)
                .HasForeignKey(d => d.PostId)
                .HasConstraintName("FK_reports_posts");

            entity.HasOne(d => d.Reporter).WithMany(p => p.ReportReporters)
                .HasForeignKey(d => d.ReporterId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_reports_reporter");
        });

        modelBuilder.Entity<Role>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__roles__3213E83F409B2CF2");

            entity.ToTable("roles");

            entity.HasIndex(e => e.RoleName, "UQ__roles__783254B1189AC4EB").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.RoleName)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("role_name");
        });

        modelBuilder.Entity<Tag>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__tags__3213E83FC69318A6");

            entity.ToTable("tags");

            entity.HasIndex(e => e.TagName, "UQ__tags__E298655CCBE3CD1C").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.TagName)
                .HasMaxLength(50)
                .HasColumnName("tag_name");
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__users__3213E83F28FB599A");

            entity.ToTable("users");

            entity.HasIndex(e => e.Email, "UQ__users__AB6E6164F26B1D20").IsUnique();

            entity.HasIndex(e => e.Username, "UQ__users__F3DBC572A9F65377").IsUnique();

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.AvatarUrl)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("avatar_url");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.Email)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("email");
            entity.Property(e => e.PasswordHash)
                .HasMaxLength(255)
                .IsUnicode(false)
                .HasColumnName("password_hash");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("active")
                .HasColumnName("status");
            entity.Property(e => e.Username)
                .HasMaxLength(50)
                .IsUnicode(false)
                .HasColumnName("username");
        });

        modelBuilder.Entity<Warning>(entity =>
        {
            entity.HasKey(e => e.Id).HasName("PK__warnings__3213E83F2D47EECB");

            entity.ToTable("warnings");

            entity.Property(e => e.Id).HasColumnName("id");
            entity.Property(e => e.Content).HasColumnName("content");
            entity.Property(e => e.CreatedAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnName("created_at");
            entity.Property(e => e.UserId).HasColumnName("user_id");

            entity.HasOne(d => d.User).WithMany(p => p.Warnings)
                .HasForeignKey(d => d.UserId)
                .HasConstraintName("FK_warnings_users");
        });

        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.HasKey(e => new { e.UserId, e.RoleId }).HasName("PK__user_rol__6EDEA1535E733FC6");

            entity.ToTable("user_roles");

            entity.Property(e => e.UserId).HasColumnName("user_id");
            entity.Property(e => e.RoleId).HasColumnName("role_id");

            entity.HasOne(d => d.User).WithMany(p => p.UserRoles)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_user_roles_users");

            entity.HasOne(d => d.Role).WithMany(p => p.UserRoles)
                .HasForeignKey(d => d.RoleId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_user_roles_roles");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
