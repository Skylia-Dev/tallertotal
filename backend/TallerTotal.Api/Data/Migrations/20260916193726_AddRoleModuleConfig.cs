using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TallerTotal.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddRoleModuleConfig : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "HiddenModulesJson",
                table: "Tenants");

            migrationBuilder.CreateTable(
                name: "RoleModuleConfigs",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    Role = table.Column<string>(type: "text", nullable: false),
                    HiddenModulesJson = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_RoleModuleConfigs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_RoleModuleConfigs_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_RoleModuleConfigs_TenantId_Role",
                table: "RoleModuleConfigs",
                columns: new[] { "TenantId", "Role" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "RoleModuleConfigs");

            migrationBuilder.AddColumn<string>(
                name: "HiddenModulesJson",
                table: "Tenants",
                type: "character varying(2000)",
                maxLength: 2000,
                nullable: true);
        }
    }
}
