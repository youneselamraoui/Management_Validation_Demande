using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Purse.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddDateValidationAchat : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "DateValidationAchat1",
                table: "Demandes",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "DateValidationAchat2",
                table: "Demandes",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DateValidationAchat1",
                table: "Demandes");

            migrationBuilder.DropColumn(
                name: "DateValidationAchat2",
                table: "Demandes");
        }
    }
}
