namespace Purse.Backend.Models;
using System.ComponentModel.DataAnnotations.Schema;

public class Fournisseur
{
    public int Id { get; set; }

    public required string Nom { get; set; }       // varchar — colonne existante (dbo.Fournisseurs.Nom)

    [NotMapped]
    public string? Contact { get; set; }    // non persisté

    [NotMapped]
    public string? Adresse { get; set; }    // non persisté

    [NotMapped]
    public string? Tel { get; set; }                // non persisté

    [NotMapped]
    public bool Active { get; set; } = true;        // non persisté
}