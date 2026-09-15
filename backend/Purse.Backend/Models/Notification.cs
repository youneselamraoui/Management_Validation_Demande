namespace Purse.Backend.Models;

public class Notification
{
    public int Id { get; set; }

    public int DemandeId { get; set; }
    public required Demande Demande { get; set; }
    public int UtilisateurId { get; set; }

    public string? User2 {get;set;}
    public required Utilisateur Utilisateur { get; set; }

    public string? Message { get; set; }  // varchar
    public DateTime DateEnvoi { get; set; }

}
