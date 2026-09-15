using System.ComponentModel.DataAnnotations.Schema;
namespace Purse.Backend.Models;

public class DetailsDemande
{
    public int Id { get; set; }
    public int DemandeId { get; set; }
    public Demande? Demande { get; set; }

    public required string Article { get; set; }
    public required int Quantite { get; set; }

    [NotMapped]
    public int? FournisseurId { get; set; }   // non persisté

    [NotMapped]
    public Fournisseur? Fournisseur { get; set; }  // non persisté

    public double? Prix { get; set; }
    public string? Devis { get; set; } // devise (MAD, EUR...)
}