using System.ComponentModel.DataAnnotations.Schema;

namespace Purse.Backend.Models;

public class Notification
{
    public int Id { get; set; }

    public int DemandeId { get; set; }
    public Demande? Demande { get; set; }
    [NotMapped]
    public int? UtilisateurId { get; set; }
    [NotMapped]
    public string? User2 {get;set;}
    [NotMapped]
    public Utilisateur? Utilisateur { get; set; }

    public string? Message { get; set; }
    public DateTime DateEnvoi { get; set; }

}
