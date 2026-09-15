namespace Purse.Backend.Models;

public class Utilisateur
{
    public int Id { get; set; }
    public required string Nom { get; set; }
    public required string Email { get; set; }
    public required string MotDePasse { get; set; }
    public required string Role { get; set; } // employe, chef, achat, directeur
    public required int DepartementId { get; set; }

    // 🔹 Navigation optionnelle (chargée par EF Core avec Include)
    public Departement Departement { get; set; } = null!;
    public int? ChefId { get; set; }
    public Utilisateur? Chef { get; set; }
    public bool Active { get; set; } = true;
}
