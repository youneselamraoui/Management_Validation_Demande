using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Purse.Backend.Migrations
{
    public partial class AddEMEAWorkflow : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF COL_LENGTH('Demandes', 'CheminSAP') IS NULL
                    ALTER TABLE Demandes ADD CheminSAP nvarchar(max) NULL;
                IF COL_LENGTH('Demandes', 'CommentaireSAP') IS NULL
                    ALTER TABLE Demandes ADD CommentaireSAP nvarchar(max) NULL;
                IF COL_LENGTH('Demandes', 'DateInsertionSAP') IS NULL
                    ALTER TABLE Demandes ADD DateInsertionSAP datetime2 NULL;
                IF COL_LENGTH('Demandes', 'DateValidationEMEA') IS NULL
                    ALTER TABLE Demandes ADD DateValidationEMEA datetime2 NULL;
                IF COL_LENGTH('Demandes', 'Justification') IS NULL
                    ALTER TABLE Demandes ADD Justification nvarchar(max) NULL;
                IF COL_LENGTH('Demandes', 'FichierPath') IS NULL
                    ALTER TABLE Demandes ADD FichierPath nvarchar(max) NULL;
                IF COL_LENGTH('Demandes', 'Commentaire') IS NULL
                    ALTER TABLE Demandes ADD Commentaire nvarchar(max) NULL;
                IF COL_LENGTH('Demandes', 'RFX') IS NULL
                    ALTER TABLE Demandes ADD RFX nvarchar(max) NULL;
                IF COL_LENGTH('Demandes', 'MontantReserve') IS NULL
                    ALTER TABLE Demandes ADD MontantReserve float NULL;
                IF COL_LENGTH('Demandes', 'DateValidationAchat1') IS NULL
                    ALTER TABLE Demandes ADD DateValidationAchat1 datetime2 NULL;
                IF COL_LENGTH('Demandes', 'DateValidationAchat2') IS NULL
                    ALTER TABLE Demandes ADD DateValidationAchat2 datetime2 NULL;
                IF COL_LENGTH('Demandes', 'DateValidateChef') IS NULL
                    ALTER TABLE Demandes ADD DateValidateChef datetime2 NULL;
                IF COL_LENGTH('Demandes', 'DateValidateFinance') IS NULL
                    ALTER TABLE Demandes ADD DateValidateFinance datetime2 NULL;
                IF COL_LENGTH('Demandes', 'DateValidateDirecteur') IS NULL
                    ALTER TABLE Demandes ADD DateValidateDirecteur datetime2 NULL;
            ");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                IF COL_LENGTH('Demandes', 'CheminSAP') IS NOT NULL
                    ALTER TABLE Demandes DROP COLUMN CheminSAP;
                IF COL_LENGTH('Demandes', 'CommentaireSAP') IS NOT NULL
                    ALTER TABLE Demandes DROP COLUMN CommentaireSAP;
                IF COL_LENGTH('Demandes', 'DateInsertionSAP') IS NOT NULL
                    ALTER TABLE Demandes DROP COLUMN DateInsertionSAP;
                IF COL_LENGTH('Demandes', 'DateValidationEMEA') IS NOT NULL
                    ALTER TABLE Demandes DROP COLUMN DateValidationEMEA;
            ");
        }
    }
}
