using System.ComponentModel.DataAnnotations.Schema;

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
    public string? CheminDevis2 { get; set; }
    public string? CheminDevis3 { get; set; }

    // ─── SAP / EMEA ───────────────────────────────────────────────────
    public string? CheminSAP { get; set; }
    public string? CommentaireSAP { get; set; }
    public DateTime? DateInsertionSAP { get; set; }
    public DateTime? DateValidationEMEA { get; set; }

    // ─── Demande d'informations complémentaires ────────────────────────
    public string? InfoMessage { get; set; }
    public string? InfoReponse { get; set; }
    public string? InfoDemandeParRole { get; set; }
    public int? InfoDemandeParUserId { get; set; }
    public DateTime? InfoDemandeDate { get; set; }
    public DateTime? InfoReponseDate { get; set; }
    public string? StatutAvantInfo { get; set; }

    [NotMapped]
    public ICollection<TransactionCapex> Transactions { get; set; } = new List<TransactionCapex>();
    [NotMapped]
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>();
    public ICollection<DetailsDemande> Details { get; set; } = new List<DetailsDemande>();
    public ICollection<BonCommande> BonsCommande { get; set; } = new List<BonCommande>();

    [NotMapped]
    public string? CheminFinance { get; set; }
    [NotMapped]
    public int? sta1 { get; set; }
    [NotMapped]
    public int? sta2 { get; set; }
    [NotMapped]
    public int? stc { get; set; }
    [NotMapped]
    public int? stf { get; set; }
    [NotMapped]
    public int? std { get; set; }
    [NotMapped]
    public int? stu { get; set; }
    [NotMapped]
    public int? stp { get; set; }
}
