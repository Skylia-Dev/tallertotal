using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TallerTotal.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddVehiclePortalTokenAndTenantPhone : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // defaultValueSql (not a fixed defaultValue) so Postgres computes a distinct
            // random UUID per existing row — a fixed default would collide with the
            // unique index below as soon as there's more than one vehicle.
            migrationBuilder.AddColumn<Guid>(
                name: "PortalToken",
                table: "Vehicles",
                type: "uuid",
                nullable: false,
                defaultValueSql: "gen_random_uuid()");

            migrationBuilder.AddColumn<string>(
                name: "Phone",
                table: "Tenants",
                type: "character varying(30)",
                maxLength: 30,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_Vehicles_PortalToken",
                table: "Vehicles",
                column: "PortalToken",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_Vehicles_PortalToken",
                table: "Vehicles");

            migrationBuilder.DropColumn(
                name: "PortalToken",
                table: "Vehicles");

            migrationBuilder.DropColumn(
                name: "Phone",
                table: "Tenants");
        }
    }
}
