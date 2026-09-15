namespace Purse.Backend.Models;
using System.ComponentModel.DataAnnotations.Schema;

public class Fournisseur
{
    public int Id { get; set; }

    public required string Nom { get; set; }       // varchar — colonne existante

    [NotMapped]
    public required string Contact { get; set; }    // non persisté

    [NotMapped]
    public required string Adresse { get; set; }    // non persisté

    [NotMapped]
    public string? Tel { get; set; }                // non persisté

    [NotMapped]
    public bool Active { get; set; } = true;        // non persisté
}