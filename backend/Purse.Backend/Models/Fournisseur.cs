namespace Purse.Backend.Models;

public class Fournisseur
{
    public int Id { get; set; }

    public required string Nom { get; set; }       // varchar
    public required string Contact { get; set; }    // varchar
    public required string Adresse { get; set; }   // varchar
    public string? Tel { get; set; }
    public bool Active { get; set; } = true;        // bit
}
