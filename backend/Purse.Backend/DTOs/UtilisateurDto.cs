namespace Purse.Backend.Models
{
    public class UtilisateurDto
    {
        public int Id { get; set; }
        public required string Nom { get; set; }
        public required string Email { get; set; }
        public required string Role { get; set; }
        public required string DepartementNom { get; set; }
        public int DepartementId { get; set; }
        public int? ChefId { get; set; }
        public string? ChefNom { get; set; }
        public bool Active { get; set; }

    }
    public class CreateUtilisateurDto
    {
        public string Nom { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string MotDePasse { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public int DepartementId { get; set; }
        public int? ChefId { get; set; }
        public bool Active { get; set; } = true;
    }
    public class UpdateUtilisateurDto
    {
        public string Nom { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string MotDePasse { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public int DepartementId { get; set; }
        public int? ChefId { get; set; }
        public bool Active { get; set; } = true;
    }
    public class ChangePasswordDto
    {
        public string? AncienMotDePasse { get; set; }
        public string? NouveauMotDePasse { get; set; }
    }
}
