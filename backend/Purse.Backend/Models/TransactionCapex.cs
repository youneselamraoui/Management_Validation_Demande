namespace Purse.Backend.Models;

public class TransactionCapex
{
    public int Id { get; set; }
    public int DemandeId { get; set; }
    public required Demande Demande { get; set; }
    public int Po { get; set; } // numéro PO

    public int CapexId { get; set; }
    public required Capex Capex { get; set; }

}
