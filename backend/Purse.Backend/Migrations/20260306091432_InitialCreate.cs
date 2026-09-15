using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Purse.Backend.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Capexes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    NomCapex = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    BudgetTotal = table.Column<double>(type: "float", nullable: false),
                    BudgetRestant = table.Column<double>(type: "float", nullable: false),
                    Devis = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Capexes", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Departements",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nom = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Departements", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Fournisseurs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nom = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Contact = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Adresse = table.Column<string>(type: "nvarchar(max)", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Fournisseurs", x => x.Id);
                });

            migrationBuilder.CreateTable(
                name: "Utilisateurs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    Nom = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Email = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    MotDePasse = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Role = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DepartementId = table.Column<int>(type: "int", nullable: false),
                    ChefId = table.Column<int>(type: "int", nullable: true),
                    Active = table.Column<bool>(type: "bit", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Utilisateurs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Utilisateurs_Departements_DepartementId",
                        column: x => x.DepartementId,
                        principalTable: "Departements",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Utilisateurs_Utilisateurs_ChefId",
                        column: x => x.ChefId,
                        principalTable: "Utilisateurs",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Demandes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    UtilisateurId = table.Column<int>(type: "int", nullable: false),
                    Statut = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CapexId = table.Column<int>(type: "int", nullable: false),
                    RFX = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    Commentaire = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Demandes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Demandes_Capexes_CapexId",
                        column: x => x.CapexId,
                        principalTable: "Capexes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Demandes_Utilisateurs_UtilisateurId",
                        column: x => x.UtilisateurId,
                        principalTable: "Utilisateurs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "BonCommandes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DemandeId = table.Column<int>(type: "int", nullable: false),
                    Po = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DateCreation = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_BonCommandes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_BonCommandes_Demandes_DemandeId",
                        column: x => x.DemandeId,
                        principalTable: "Demandes",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "DetailsDemandes",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DemandeId = table.Column<int>(type: "int", nullable: false),
                    Article = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Quantite = table.Column<int>(type: "int", nullable: false),
                    FournisseurId = table.Column<int>(type: "int", nullable: true),
                    Prix = table.Column<double>(type: "float", nullable: true),
                    Devis = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_DetailsDemandes", x => x.Id);
                    table.ForeignKey(
                        name: "FK_DetailsDemandes_Demandes_DemandeId",
                        column: x => x.DemandeId,
                        principalTable: "Demandes",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_DetailsDemandes_Fournisseurs_FournisseurId",
                        column: x => x.FournisseurId,
                        principalTable: "Fournisseurs",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "Notifications",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DemandeId = table.Column<int>(type: "int", nullable: false),
                    Message = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    DateEnvoi = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Notifications", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Notifications_Demandes_DemandeId",
                        column: x => x.DemandeId,
                        principalTable: "Demandes",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateTable(
                name: "TransactionCapex",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DemandeId = table.Column<int>(type: "int", nullable: false),
                    Po = table.Column<int>(type: "int", nullable: false),
                    CapexId = table.Column<int>(type: "int", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TransactionCapex", x => x.Id);
                    table.ForeignKey(
                        name: "FK_TransactionCapex_Capexes_CapexId",
                        column: x => x.CapexId,
                        principalTable: "Capexes",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_TransactionCapex_Demandes_DemandeId",
                        column: x => x.DemandeId,
                        principalTable: "Demandes",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_BonCommandes_DemandeId",
                table: "BonCommandes",
                column: "DemandeId");

            migrationBuilder.CreateIndex(
                name: "IX_Demandes_CapexId",
                table: "Demandes",
                column: "CapexId");

            migrationBuilder.CreateIndex(
                name: "IX_Demandes_UtilisateurId",
                table: "Demandes",
                column: "UtilisateurId");

            migrationBuilder.CreateIndex(
                name: "IX_DetailsDemandes_DemandeId",
                table: "DetailsDemandes",
                column: "DemandeId");

            migrationBuilder.CreateIndex(
                name: "IX_DetailsDemandes_FournisseurId",
                table: "DetailsDemandes",
                column: "FournisseurId");

            migrationBuilder.CreateIndex(
                name: "IX_Notifications_DemandeId",
                table: "Notifications",
                column: "DemandeId");

            migrationBuilder.CreateIndex(
                name: "IX_TransactionCapex_CapexId",
                table: "TransactionCapex",
                column: "CapexId");

            migrationBuilder.CreateIndex(
                name: "IX_TransactionCapex_DemandeId",
                table: "TransactionCapex",
                column: "DemandeId");

            migrationBuilder.CreateIndex(
                name: "IX_Utilisateurs_ChefId",
                table: "Utilisateurs",
                column: "ChefId");

            migrationBuilder.CreateIndex(
                name: "IX_Utilisateurs_DepartementId",
                table: "Utilisateurs",
                column: "DepartementId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "BonCommandes");

            migrationBuilder.DropTable(
                name: "DetailsDemandes");

            migrationBuilder.DropTable(
                name: "Notifications");

            migrationBuilder.DropTable(
                name: "TransactionCapex");

            migrationBuilder.DropTable(
                name: "Fournisseurs");

            migrationBuilder.DropTable(
                name: "Demandes");

            migrationBuilder.DropTable(
                name: "Capexes");

            migrationBuilder.DropTable(
                name: "Utilisateurs");

            migrationBuilder.DropTable(
                name: "Departements");
        }
    }
}
