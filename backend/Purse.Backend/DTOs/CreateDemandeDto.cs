namespace Purse.Backend.Models;

public class CreateDemandeDto
{

    public int? CapexId { get; set; }
    public string? Justification { get; set; }
    public IFormFile? Fichier { get; set; }
    public List<DetailsDemandeDto> Details { get; set; } = new();
    //public int? CapexId { get; set; }
    //public List<DetailsDemandeDto> Details { get; set; } = new();
}

public class DetailsDemandeDto
{
    public string Article { get; set; } = "";
    public int Quantite { get; set; }
    public int? FournisseurId { get; set; }

    //public string? Commentaire { get; set; }
    //public string? Justification { get; set; }
    //public string? FichierPath { get; set; }
}
public class UpdateDetailDto
{
    public int Id { get; set; }
    public int? FournisseurId { get; set; }
    public double? Prix { get; set; }
    public string? Devis { get; set; }
}
public class UpdateStatutDto
{
    public string Action { get; set; } = "";
    public string? Commentaire { get; set; }
}
public class UpdateRfxDto
{
    public string Rfx { get; set; } = "";
}
public class UpdateBudgetDto
{
    public decimal MontantReserve { get; set; }
    public decimal BudgetRestant { get; set; }
}
