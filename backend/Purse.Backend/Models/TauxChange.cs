namespace Purse.Backend.Models;

public class TauxChange
{
    public int Id { get; set; }
    public required string DevisSource { get; set; }  // ex: "EUR"
    public required string DevisCible { get; set; }  // ex: "MAD"
    public double Taux { get; set; }                   // ex: 10.85
}