namespace Purse.Backend.Models;

public class Demande
{
    public int Id { get; set; }

    public int UtilisateurId { get; set; }
    public Utilisateur? Utilisateur { get; set; } // optionnel

    public string Statut { get; set; } = "En attente validation chef"; // valeur par défaut

    public int? CapexId { get; set; }
    public Capex? Capex { get; set; }

    public string? RFX { get; set; }
    public double? MontantReserve { get; set; }

    public string? Commentaire { get; set; }
    public string? Justification { get; set; }
    public string? FichierPath { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DateValidationAchat1 { get; set; }
    public DateTime? DateValidationAchat2 { get; set; }
    public DateTime? DateValidateChef { get; set; }
    public DateTime? DateValidateFinance { get; set; }
    public DateTime? DateValidateDirecteur { get; set; }
    public string? CheminDevis { get; set; }

    public ICollection<TransactionCapex> Transactions { get; set; } = new List<TransactionCapex>();
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<DetailsDemande> Details { get; set; } = new List<DetailsDemande>();
    public ICollection<BonCommande> BonsCommande { get; set; } = new List<BonCommande>();
}
