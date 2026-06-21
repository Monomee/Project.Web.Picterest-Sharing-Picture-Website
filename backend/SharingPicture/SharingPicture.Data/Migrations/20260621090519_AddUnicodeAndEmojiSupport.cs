using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace SharingPicture.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddUnicodeAndEmojiSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE posts ALTER COLUMN caption nvarchar(1000) NULL;");
            migrationBuilder.Sql("ALTER TABLE comments ALTER COLUMN content nvarchar(1000) NOT NULL;");
            migrationBuilder.Sql("ALTER TABLE reports ALTER COLUMN reason nvarchar(1000) NOT NULL;");

            migrationBuilder.Sql("ALTER TABLE tags DROP CONSTRAINT UQ__tags__E298655CCBE3CD1C;");
            migrationBuilder.Sql("ALTER TABLE tags ALTER COLUMN tag_name nvarchar(50) NOT NULL;");
            migrationBuilder.Sql("ALTER TABLE tags ADD CONSTRAINT UQ__tags__E298655CCBE3CD1C UNIQUE (tag_name);");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("ALTER TABLE posts ALTER COLUMN caption varchar(1000) NULL;");
            migrationBuilder.Sql("ALTER TABLE comments ALTER COLUMN content varchar(1000) NOT NULL;");
            migrationBuilder.Sql("ALTER TABLE reports ALTER COLUMN reason varchar(500) NOT NULL;");

            migrationBuilder.Sql("ALTER TABLE tags DROP CONSTRAINT UQ__tags__E298655CCBE3CD1C;");
            migrationBuilder.Sql("ALTER TABLE tags ALTER COLUMN tag_name varchar(50) NOT NULL;");
            migrationBuilder.Sql("ALTER TABLE tags ADD CONSTRAINT UQ__tags__E298655CCBE3CD1C UNIQUE (tag_name);");
        }
    }
}
