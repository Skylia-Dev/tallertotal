using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TallerTotal.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddServiceOrderTypeAndLubricentro : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "ChangedAirFilter",
                table: "ServiceOrders",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ChangedCabinFilter",
                table: "ServiceOrders",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ChangedFuelFilter",
                table: "ServiceOrders",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<bool>(
                name: "ChangedOilFilter",
                table: "ServiceOrders",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<DateOnly>(
                name: "NextServiceDate",
                table: "ServiceOrders",
                type: "date",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "NextServiceKm",
                table: "ServiceOrders",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "NextServiceReminderSentAt",
                table: "ServiceOrders",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OilBrand",
                table: "ServiceOrders",
                type: "character varying(60)",
                maxLength: 60,
                nullable: true);

            migrationBuilder.AddColumn<decimal>(
                name: "OilLiters",
                table: "ServiceOrders",
                type: "numeric(5,2)",
                precision: 5,
                scale: 2,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "OilType",
                table: "ServiceOrders",
                type: "character varying(40)",
                maxLength: 40,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Type",
                table: "ServiceOrders",
                type: "text",
                nullable: false,
                defaultValue: "General");

            migrationBuilder.CreateTable(
                name: "ServiceOrderChecklistItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    ServiceOrderId = table.Column<Guid>(type: "uuid", nullable: false),
                    Description = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Checked = table.Column<bool>(type: "boolean", nullable: true),
                    Position = table.Column<int>(type: "integer", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ServiceOrderChecklistItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ServiceOrderChecklistItems_ServiceOrders_ServiceOrderId",
                        column: x => x.ServiceOrderId,
                        principalTable: "ServiceOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ServiceOrderChecklistItems_ServiceOrderId",
                table: "ServiceOrderChecklistItems",
                column: "ServiceOrderId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ServiceOrderChecklistItems");

            migrationBuilder.DropColumn(
                name: "ChangedAirFilter",
                table: "ServiceOrders");

            migrationBuilder.DropColumn(
                name: "ChangedCabinFilter",
                table: "ServiceOrders");

            migrationBuilder.DropColumn(
                name: "ChangedFuelFilter",
                table: "ServiceOrders");

            migrationBuilder.DropColumn(
                name: "ChangedOilFilter",
                table: "ServiceOrders");

            migrationBuilder.DropColumn(
                name: "NextServiceDate",
                table: "ServiceOrders");

            migrationBuilder.DropColumn(
                name: "NextServiceKm",
                table: "ServiceOrders");

            migrationBuilder.DropColumn(
                name: "NextServiceReminderSentAt",
                table: "ServiceOrders");

            migrationBuilder.DropColumn(
                name: "OilBrand",
                table: "ServiceOrders");

            migrationBuilder.DropColumn(
                name: "OilLiters",
                table: "ServiceOrders");

            migrationBuilder.DropColumn(
                name: "OilType",
                table: "ServiceOrders");

            migrationBuilder.DropColumn(
                name: "Type",
                table: "ServiceOrders");
        }
    }
}
