using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Purse.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddFournisseurToBonCommande : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "FournisseurId",
                table: "BonCommandes",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_BonCommandes_FournisseurId",
                table: "BonCommandes",
                column: "FournisseurId");

            migrationBuilder.AddForeignKey(
                name: "FK_BonCommandes_Fournisseurs_FournisseurId",
                table: "BonCommandes",
                column: "FournisseurId",
                principalTable: "Fournisseurs",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_BonCommandes_Fournisseurs_FournisseurId",
                table: "BonCommandes");

            migrationBuilder.DropIndex(
                name: "IX_BonCommandes_FournisseurId",
                table: "BonCommandes");

            migrationBuilder.DropColumn(
                name: "FournisseurId",
                table: "BonCommandes");
        }
    }
}
