namespace Purse.Backend.Models;

public class ActiveUser
{
    public int Id { get; set; }
    public required string Nom { get; set; }
    public required string NomCapex { get; set; }
    public required string Dep { get; set; }
    public required double RolBudgetTotale { get; set; } // employe, chef, achat, directeur
    public required double MontantReserve { get; set; }

    // 🔹 Navigation optionnelle (chargée par EF Core avec Include)
    //public Departement Departement { get; set; } = null!;
    //public int? ChefId { get; set; }
    //public Utilisateur? Chef { get; set; }
    //public bool Active { get; set; } = true;
}
