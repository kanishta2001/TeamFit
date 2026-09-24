using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeamFit.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTeamChatsAndNotifications : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "NotificationReadStates",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "int", nullable: false),
                    LastReadAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_NotificationReadStates", x => x.UserId);
                    table.ForeignKey(
                        name: "FK_NotificationReadStates_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ProjectChatReadStates",
                columns: table => new
                {
                    ProjectRequestId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    LastReadAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectChatReadStates", x => new { x.ProjectRequestId, x.UserId });
                    table.ForeignKey(
                        name: "FK_ProjectChatReadStates_Projects_ProjectRequestId",
                        column: x => x.ProjectRequestId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProjectChatReadStates_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "ProjectMessages",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProjectRequestId = table.Column<int>(type: "int", nullable: false),
                    SenderUserId = table.Column<int>(type: "int", nullable: false),
                    Body = table.Column<string>(type: "nvarchar(1000)", maxLength: 1000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectMessages", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectMessages_Projects_ProjectRequestId",
                        column: x => x.ProjectRequestId,
                        principalTable: "Projects",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProjectMessages_Users_SenderUserId",
                        column: x => x.SenderUserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectChatReadStates_UserId",
                table: "ProjectChatReadStates",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectMessages_ProjectRequestId",
                table: "ProjectMessages",
                column: "ProjectRequestId");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectMessages_SenderUserId",
                table: "ProjectMessages",
                column: "SenderUserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "NotificationReadStates");

            migrationBuilder.DropTable(
                name: "ProjectChatReadStates");

            migrationBuilder.DropTable(
                name: "ProjectMessages");
        }
    }
}
