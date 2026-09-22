using Microsoft.AspNetCore.Mvc;
using Purse.Backend.Data;
using Purse.Backend.Models;
using System.Linq;
using Microsoft.EntityFrameworkCore;


namespace Purse.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UtilisateursController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public UtilisateursController(ApplicationDbContext context)
        {
            _context = context;
        }

        // GET: api/utilisateurs
        [HttpGet]
        public IActionResult GetAll()
        {
            var utilisateurs = _context.Utilisateurs
                .Include(u => u.Chef)
                .Include(u => u.Departement)
                .Select(u => new UtilisateurDto
                {
                    Id = u.Id,
                    Nom = u.Nom,
                    Email = u.Email,
                    Role = u.Role,
                    DepartementNom = u.Departement.Nom,
                    DepartementId = u.DepartementId,
                    ChefId = u.ChefId,
                    ChefNom = u.Chef != null ? u.Chef.Nom : null,
                    Active = u.Active
                })
                .ToList();

            return Ok(utilisateurs);
        }


        // GET: api/utilisateurs/5
        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var user = _context.Utilisateurs
        .Include(u => u.Chef)
        .Include(u => u.Departement)
        .FirstOrDefault(u => u.Id == id);
            if (user == null) return NotFound();
            var result = new UtilisateurDto
            {
                Id = user.Id,
                Nom = user.Nom,
                Email = user.Email,
                Role = user.Role,
                DepartementNom = user.Departement?.Nom ?? "",
                DepartementId = user.DepartementId,
                ChefId = user.ChefId,
                ChefNom = user.Chef?.Nom,
                Active = user.Active
            };

            return Ok(result);
        }

        // POST: api/utilisateurs
        [HttpPost]
        public IActionResult Create([FromBody] CreateUtilisateurDto dto)
        {
            var user = new Utilisateur
            {
                Nom = dto.Nom,
                Email = dto.Email,
                MotDePasse = dto.MotDePasse,
                Role = dto.Role?.ToLower().Trim() ?? "",
                DepartementId = dto.DepartementId,
                ChefId = dto.ChefId,
                Active = dto.Active
            };

            _context.Utilisateurs.Add(user);
            _context.SaveChanges();

            var result = new UtilisateurDto
            {
                Id = user.Id,
                Nom = user.Nom,
                Email = user.Email,
                Role = user.Role,
                DepartementNom = _context.Departements.Find(user.DepartementId)?.Nom ?? "",
                DepartementId = user.DepartementId,
                ChefId = user.ChefId,
                ChefNom = user.ChefId != null ? _context.Utilisateurs.Find(user.ChefId)?.Nom : null,
                Active = user.Active
            };

            return Ok(new { success = true, user = result });
        }

        // PUT: api/utilisateurs/5
        [HttpPut("{id}")]
        public IActionResult Update(int id, [FromBody] UpdateUtilisateurDto dto)
        {
            var existing = _context.Utilisateurs.Find(id);
            if (existing == null) return NotFound();

            existing.Nom = dto.Nom;
            existing.Email = dto.Email;
            existing.MotDePasse = dto.MotDePasse;
            existing.Role = dto.Role?.ToLower().Trim() ?? existing.Role;
            existing.DepartementId = dto.DepartementId;
            existing.ChefId = dto.ChefId;
            existing.Active = dto.Active;

            _context.SaveChanges();

            // Retourner un DTO de sortie (UtilisateurDto)
            var result = new UtilisateurDto
            {
                Id = existing.Id,
                Nom = existing.Nom,
                Email = existing.Email,
                Role = existing.Role,
                DepartementNom = existing.Departement?.Nom ?? _context.Departements.Find(existing.DepartementId)?.Nom ?? "",
                DepartementId = existing.DepartementId,
                ChefId = existing.ChefId,
                ChefNom = existing.Chef?.Nom ?? (existing.ChefId != null ? _context.Utilisateurs.Find(existing.ChefId)?.Nom : null),
                Active = existing.Active
            };

            return Ok(new { success = true, user = result });
        }

        // DELETE: api/utilisateurs/5
        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var user = _context.Utilisateurs.Find(id);
            if (user == null) return NotFound();

            _context.Utilisateurs.Remove(user);
            _context.SaveChanges();
            return Ok(new { success = true });
        }
        [HttpGet("chefs")]
        public IActionResult GetChefs()
        {
            // Par spec : achat2, finance et directeur sont aussi des chefs
            var rolesChef = new[] { "chef", "achat2", "finance", "directeur" };
            var chefs = _context.Utilisateurs
                .Where(u => rolesChef.Contains(u.Role.ToLower()))
                .Select(u => new { u.Id, u.Nom, u.Role })
                .ToList();

            return Ok(chefs);
        }
        [HttpPut("{id}/change-password")]
        public IActionResult ChangePassword(int id, [FromBody] ChangePasswordDto dto)
        {
            var user = _context.Utilisateurs.Find(id);
            if (user == null) return NotFound();

            if (user.MotDePasse != dto.AncienMotDePasse)
                return BadRequest(new { success = false, message = "Mot de passe actuel incorrect." });

            user.MotDePasse = dto.NouveauMotDePasse;
            _context.SaveChanges();
            return Ok(new { success = true });
        }

    }

}
