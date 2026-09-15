using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Purse.Backend.Migrations
{
    /// <inheritdoc />
    public partial class CreateTauxChange : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "TauxChanges",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    DevisSource = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    DevisCible = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Taux = table.Column<double>(type: "float", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TauxChanges", x => x.Id);
                });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "TauxChanges");
        }
    }
}
