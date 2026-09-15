namespace Purse.Backend.Models;

public class BonCommande
{
    public int Id { get; set; }
    public int DemandeId { get; set; }
    public required Demande Demande { get; set; }

    public required string Po { get; set; }  
    public DateTime DateCreation { get; set; }
    public int? FournisseurId { get; set; }
    public Fournisseur? Fournisseur { get; set; }
    public int? DelaiPaiement { get; set; }
}
