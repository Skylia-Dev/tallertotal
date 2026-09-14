using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TallerTotal.Api.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddVentasYDeudas : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Ventas",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uuid", nullable: true),
                    CreatedByUsername = table.Column<string>(type: "character varying(60)", maxLength: 60, nullable: false),
                    Fecha = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Total = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    Descuento = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    FormaPago = table.Column<string>(type: "text", nullable: false),
                    MontoPagado = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    SaldoPendiente = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Ventas", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Ventas_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_Ventas_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "DeudasClientes",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    TenantId = table.Column<Guid>(type: "uuid", nullable: false),
                    CustomerId = table.Column<Guid>(type: "uuid", nullable: false),
                    VentaId = table.Column<Guid>(type: "uuid", nullable: false),
                    MontoOriginal = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    MontoPagado = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    SaldoPendiente = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DeudasClientes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DeudasClientes_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_DeudasClientes_Tenants_TenantId",
                        column: x => x.TenantId,
                        principalTable: "Tenants",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_DeudasClientes_Ventas_VentaId",
                        column: x => x.VentaId,
                        principalTable: "Ventas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "VentaItems",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    VentaId = table.Column<Guid>(type: "uuid", nullable: false),
                    ArticuloId = table.Column<Guid>(type: "uuid", nullable: false),
                    Cantidad = table.Column<int>(type: "integer", nullable: false),
                    PrecioUnitario = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false),
                    Subtotal = table.Column<decimal>(type: "numeric(10,2)", precision: 10, scale: 2, nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_VentaItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_VentaItems_Articulos_ArticuloId",
                        column: x => x.ArticuloId,
                        principalTable: "Articulos",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_VentaItems_Ventas_VentaId",
                        column: x => x.VentaId,
                        principalTable: "Ventas",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_DeudasClientes_CustomerId",
                table: "DeudasClientes",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_DeudasClientes_TenantId",
                table: "DeudasClientes",
                column: "TenantId");

            migrationBuilder.CreateIndex(
                name: "IX_DeudasClientes_VentaId",
                table: "DeudasClientes",
                column: "VentaId");

            migrationBuilder.CreateIndex(
                name: "IX_VentaItems_ArticuloId",
                table: "VentaItems",
                column: "ArticuloId");

            migrationBuilder.CreateIndex(
                name: "IX_VentaItems_VentaId",
                table: "VentaItems",
                column: "VentaId");

            migrationBuilder.CreateIndex(
                name: "IX_Ventas_CustomerId",
                table: "Ventas",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_Ventas_TenantId",
                table: "Ventas",
                column: "TenantId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "DeudasClientes");

            migrationBuilder.DropTable(
                name: "VentaItems");

            migrationBuilder.DropTable(
                name: "Ventas");
        }
    }
}
