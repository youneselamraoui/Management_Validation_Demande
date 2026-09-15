using System.ComponentModel.DataAnnotations.Schema;

namespace Purse.Backend.Models;

public class Capex
{
    public int Id { get; set; }
    public required string NomCapex { get; set; } // dbo.Capexes.NomCapex
    public double BudgetTotal { get; set; }       // dbo.Capexes.BudgetTotal float non NULL
    public double BudgetRestant { get; set; }     // dbo.Capexes.BudgetRestant float non NULL

    [NotMapped]
    public string? Devis { get; set; }

    public ICollection<Demande> Demandes { get; set; } = new List<Demande>();

    [NotMapped]
    public ICollection<TransactionCapex> Transactions { get; set; } = new List<TransactionCapex>();
}