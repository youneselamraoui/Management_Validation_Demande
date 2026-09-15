namespace Purse.Backend.Models;

public class Capex
{
    public int Id { get; set; }
    public required string NomCapex { get; set; }  // nvarchar
    public double BudgetTotal { get; set; }
    public double BudgetRestant { get; set; }
    public string? Devis { get; set; } // nvarchar(100)

    public ICollection<Demande> Demandes { get; set; } = new List<Demande>();
    public ICollection<TransactionCapex> Transactions { get; set; } = new List<TransactionCapex>();
}
