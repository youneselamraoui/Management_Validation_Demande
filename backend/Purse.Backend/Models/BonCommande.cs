namespace Purse.Backend.Models;
using System.ComponentModel.DataAnnotations.Schema;


public class BonCommande
{
    public int Id { get; set; }
    public int DemandeId { get; set; }
    public required Demande Demande { get; set; }

    public required string Po { get; set; }  // dbo.BonCommandes.Po (NULL dans DB mais required côté code)
    public DateTime DateCreation { get; set; }
    public int? FournisseurId { get; set; }         // colonne existante dbo.BonCommandes.FournisseurId (FK non NULL)
    public Fournisseur? Fournisseur { get; set; }

    [NotMapped]
    public int? DelaiPaiement { get; set; }          // non persisté
}