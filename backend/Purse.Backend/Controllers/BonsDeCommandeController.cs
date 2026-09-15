using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Purse.Backend.Data;
using Microsoft.AspNetCore.Authorization;

namespace Purse.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class BonsCommandeController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public BonsCommandeController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        [Authorize(Roles = "achat1,achat2,admin")]
        public IActionResult GetAll()
        {
            var now = DateTime.Now;
            var bons = _context.BonCommandes
            .Where(b => b.DateCreation.Month == now.Month && b.DateCreation.Year == now.Year)
                .Include(b => b.Demande)
                    .ThenInclude(d => d.Utilisateur)
                        .ThenInclude(u => u.Departement)
                .Include(b => b.Demande)
                    .ThenInclude(d => d.Details)
                .Include(b => b.Demande)
                    .ThenInclude(d => d.Capex)
                .Include(b => b.Fournisseur)
                .OrderByDescending(b => b.DateCreation)
                .AsEnumerable()
                .Select(b => new
                {
                    Id = b.Id,
                    Po = b.Po,
                    DelaiPaiement = b.DelaiPaiement,
                    DateCreation = b.DateCreation,

                    Fournisseur = b.Fournisseur == null ? null : new
                    {
                        Id = b.Fournisseur.Id,
                        Nom = b.Fournisseur.Nom,
                        Adresse = b.Fournisseur.Adresse,
                        Tel = b.Fournisseur.Tel,
                        Contact = b.Fournisseur.Contact
                    },

                    Demande = new
                    {
                        Id = b.Demande.Id,
                        Statut = b.Demande.Statut,
                        RFX = b.Demande.RFX,
                        CapexId = b.Demande.CapexId,
                        CreatedAt = b.Demande.CreatedAt,

                        Capex = b.Demande.Capex == null ? null : new
                        {
                            Id = b.Demande.Capex.Id,
                            NomCapex = b.Demande.Capex.NomCapex
                        },

                        Utilisateur = b.Demande.Utilisateur == null ? null : new
                        {
                            Nom = b.Demande.Utilisateur.Nom,
                            Role = b.Demande.Utilisateur.Role,
                            Departement = b.Demande.Utilisateur.Departement != null
                                            ? b.Demande.Utilisateur.Departement.Nom
                                            : null
                        },

                        // tous les articles de la demande (plus de filtre par fournisseur)
                        Details = b.Demande.Details
                            .Select(x => new
                            {
                                Article = x.Article,
                                Quantite = x.Quantite,
                                Prix = x.Prix,
                                Devis = x.Devis
                            }),

                        // total sur tous les articles de la demande
                        TotalPrix = b.Demande.Details
                            .Sum(x => (x.Prix ?? 0) * x.Quantite)
                    }

                })
                .ToList();

            return Ok(bons);
        }
        [HttpPut("{id}/delai")]
        [Authorize(Roles = "achat1,achat2,admin")]
        public async Task<IActionResult> UpdateDelai(int id, [FromBody] int delai)
        {
            var bon = await _context.BonCommandes.FindAsync(id);
            if (bon == null) return NotFound();

            bon.DelaiPaiement = delai;
            await _context.SaveChangesAsync();

            return Ok(
                new
                {
                    Id = bon.Id,
                    Po = bon.Po,
                    DelaiPaiement = bon.DelaiPaiement,
                    DateCreation = bon.DateCreation
                }
            );
        }
    }

}

