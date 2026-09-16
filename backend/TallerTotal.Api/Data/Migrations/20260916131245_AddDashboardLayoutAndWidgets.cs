using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TallerTotal.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDashboardLayoutAndWidgets : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "DashboardLayout",
                table: "Users",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DashboardLayout",
                table: "Users");
        }
    }
}
