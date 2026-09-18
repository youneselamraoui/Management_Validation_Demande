using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Purse.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddCheminDevis2And3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Idempotent : n'ajoute que si la colonne n'existe pas déjà (DB déjà mise à jour manuellement côté capture)
            migrationBuilder.Sql(@"
                IF COL_LENGTH('Demandes', 'CheminDevis2') IS NULL
                    ALTER TABLE Demandes ADD CheminDevis2 nvarchar(max) NULL;
                IF COL_LENGTH('Demandes', 'CheminDevis3') IS NULL
                    ALTER TABLE Demandes ADD CheminDevis3 nvarchar(max) NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF COL_LENGTH('Demandes', 'CheminDevis2') IS NOT NULL
                    ALTER TABLE Demandes DROP COLUMN CheminDevis2;
                IF COL_LENGTH('Demandes', 'CheminDevis3') IS NOT NULL
                    ALTER TABLE Demandes DROP COLUMN CheminDevis3;
            ");
        }
    }
}
