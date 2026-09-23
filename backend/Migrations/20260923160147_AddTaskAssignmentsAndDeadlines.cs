using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TeamFit.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddTaskAssignmentsAndDeadlines : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_ProjectTasks_Students_AssignedStudentId",
                table: "ProjectTasks");

            migrationBuilder.DropIndex(
                name: "IX_ProjectTasks_AssignedStudentId",
                table: "ProjectTasks");

            migrationBuilder.AddColumn<int>(
                name: "DeadlineDays",
                table: "ProjectTasks",
                type: "int",
                nullable: false,
                defaultValue: 7);

            migrationBuilder.CreateTable(
                name: "ProjectTaskAssignments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    ProjectTaskId = table.Column<int>(type: "int", nullable: false),
                    StudentId = table.Column<int>(type: "int", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false),
                    IsCompleted = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    RespondedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ProjectTaskAssignments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ProjectTaskAssignments_ProjectTasks_ProjectTaskId",
                        column: x => x.ProjectTaskId,
                        principalTable: "ProjectTasks",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ProjectTaskAssignments_Students_StudentId",
                        column: x => x.StudentId,
                        principalTable: "Students",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ProjectTaskAssignments_ProjectTaskId_StudentId",
                table: "ProjectTaskAssignments",
                columns: new[] { "ProjectTaskId", "StudentId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_ProjectTaskAssignments_StudentId",
                table: "ProjectTaskAssignments",
                column: "StudentId");

            // Preserve each existing single assignee as an accepted assignment.
            migrationBuilder.Sql("""
                INSERT INTO ProjectTaskAssignments
                    (ProjectTaskId, StudentId, Status, IsCompleted, CreatedAt, RespondedAt, CompletedAt)
                SELECT Id, AssignedStudentId, N'Accepted',
                    CASE WHEN Status = N'Done' THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END,
                    CreatedAt, CreatedAt,
                    CASE WHEN Status = N'Done' THEN UpdatedAt ELSE NULL END
                FROM ProjectTasks
                WHERE AssignedStudentId IS NOT NULL;
                """);

            migrationBuilder.DropColumn(
                name: "AssignedStudentId",
                table: "ProjectTasks");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "ProjectTasks");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DeadlineDays",
                table: "ProjectTasks");

            migrationBuilder.AddColumn<int>(
                name: "AssignedStudentId",
                table: "ProjectTasks",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Status",
                table: "ProjectTasks",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                defaultValue: "Todo");

            migrationBuilder.Sql("""
                UPDATE task
                SET AssignedStudentId = assignment.StudentId,
                    Status = CASE WHEN assignment.IsCompleted = 1 THEN N'Done' ELSE N'Todo' END
                FROM ProjectTasks task
                OUTER APPLY (
                    SELECT TOP 1 StudentId, IsCompleted
                    FROM ProjectTaskAssignments
                    WHERE ProjectTaskId = task.Id AND Status = N'Accepted'
                    ORDER BY Id
                ) assignment;
                """);

            migrationBuilder.DropTable(
                name: "ProjectTaskAssignments");

            migrationBuilder.CreateIndex(
                name: "IX_ProjectTasks_AssignedStudentId",
                table: "ProjectTasks",
                column: "AssignedStudentId");

            migrationBuilder.AddForeignKey(
                name: "FK_ProjectTasks_Students_AssignedStudentId",
                table: "ProjectTasks",
                column: "AssignedStudentId",
                principalTable: "Students",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }
    }
}
