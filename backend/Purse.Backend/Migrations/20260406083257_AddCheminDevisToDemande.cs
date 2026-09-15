using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Purse.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddCheminDevisToDemande : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "CheminDevis",
                table: "Demandes",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CheminDevis",
                table: "Demandes");
        }
    }
}
