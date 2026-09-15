using System.ComponentModel.DataAnnotations.Schema;

namespace Purse.Backend.Models;

public class Capex
{
    public int Id { get; set; }
    public required string NomCapex { get; set; }
    public double BudgetTotal { get; set; }
    public double BudgetRestant { get; set; }

    [NotMapped]
    public string? Devis { get; set; }

    public ICollection<Demande> Demandes { get; set; } = new List<Demande>();
    public ICollection<TransactionCapex> Transactions { get; set; } = new List<TransactionCapex>();
}