using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeamFit.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddStudentPhotos : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "PhotoVersion",
                table: "Students",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "StudentPhotos",
                columns: table => new
                {
                    StudentId = table.Column<int>(type: "int", nullable: false),
                    ContentType = table.Column<string>(type: "nvarchar(32)", maxLength: 32, nullable: false),
                    Data = table.Column<byte[]>(type: "varbinary(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_StudentPhotos", x => x.StudentId);
                    table.ForeignKey(
                        name: "FK_StudentPhotos_Students_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Students",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "StudentPhotos");

            migrationBuilder.DropColumn(
                name: "PhotoVersion",
                table: "Students");
        }
    }
}
