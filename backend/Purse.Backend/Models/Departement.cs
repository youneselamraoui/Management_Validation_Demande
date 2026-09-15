namespace Purse.Backend.Models;

public class Departement
{
    public int Id { get; set; }
    public required string Nom { get; set; }
    // Un département peut avoir plusieurs utilisateurs
    public ICollection<Utilisateur> Utilisateurs { get; set; } = new List<Utilisateur>();
}
