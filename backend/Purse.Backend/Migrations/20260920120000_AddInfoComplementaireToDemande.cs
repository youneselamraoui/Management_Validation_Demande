using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Purse.Backend.Migrations
{
    /// <inheritdoc />
    public partial class AddInfoComplementaireToDemande : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF COL_LENGTH('Demandes', 'InfoMessage') IS NULL
                    ALTER TABLE Demandes ADD InfoMessage nvarchar(max) NULL;
                IF COL_LENGTH('Demandes', 'InfoReponse') IS NULL
                    ALTER TABLE Demandes ADD InfoReponse nvarchar(max) NULL;
                IF COL_LENGTH('Demandes', 'InfoDemandeParRole') IS NULL
                    ALTER TABLE Demandes ADD InfoDemandeParRole nvarchar(max) NULL;
                IF COL_LENGTH('Demandes', 'InfoDemandeParUserId') IS NULL
                    ALTER TABLE Demandes ADD InfoDemandeParUserId int NULL;
                IF COL_LENGTH('Demandes', 'InfoDemandeDate') IS NULL
                    ALTER TABLE Demandes ADD InfoDemandeDate datetime2 NULL;
                IF COL_LENGTH('Demandes', 'InfoReponseDate') IS NULL
                    ALTER TABLE Demandes ADD InfoReponseDate datetime2 NULL;
                IF COL_LENGTH('Demandes', 'StatutAvantInfo') IS NULL
                    ALTER TABLE Demandes ADD StatutAvantInfo nvarchar(max) NULL;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF COL_LENGTH('Demandes', 'InfoMessage') IS NOT NULL
                    ALTER TABLE Demandes DROP COLUMN InfoMessage;
                IF COL_LENGTH('Demandes', 'InfoReponse') IS NOT NULL
                    ALTER TABLE Demandes DROP COLUMN InfoReponse;
                IF COL_LENGTH('Demandes', 'InfoDemandeParRole') IS NOT NULL
                    ALTER TABLE Demandes DROP COLUMN InfoDemandeParRole;
                IF COL_LENGTH('Demandes', 'InfoDemandeParUserId') IS NOT NULL
                    ALTER TABLE Demandes DROP COLUMN InfoDemandeParUserId;
                IF COL_LENGTH('Demandes', 'InfoDemandeDate') IS NOT NULL
                    ALTER TABLE Demandes DROP COLUMN InfoDemandeDate;
                IF COL_LENGTH('Demandes', 'InfoReponseDate') IS NOT NULL
                    ALTER TABLE Demandes DROP COLUMN InfoReponseDate;
                IF COL_LENGTH('Demandes', 'StatutAvantInfo') IS NOT NULL
                    ALTER TABLE Demandes DROP COLUMN StatutAvantInfo;
            ");
        }
    }
}
