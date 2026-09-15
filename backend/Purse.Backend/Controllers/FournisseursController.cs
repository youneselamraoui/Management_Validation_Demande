using Microsoft.AspNetCore.Mvc;
using Purse.Backend.Data;
using Purse.Backend.Models;
using System.Linq;

namespace Purse.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FournisseursController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public FournisseursController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 🔹 GET: api/fournisseurs
        [HttpGet]
        public IActionResult GetAll()
        {
            var fournisseurs = _context.Fournisseurs.ToList();
            return Ok(fournisseurs);
        }

        [HttpGet("actifs")]
        public IActionResult GetActifs()
        {
            var fournisseurs = _context.Fournisseurs
                                       .Where(f => f.Active == true)
                                       .ToList();
            return Ok(fournisseurs);
        }
        // 🔹 GET: api/fournisseurs/5
        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var f = _context.Fournisseurs.Find(id);
            if (f == null) return NotFound();
            return Ok(f);
        }

        // 🔹 POST: api/fournisseurs
        [HttpPost]
        public IActionResult Create([FromBody] Fournisseur f)
        {
            _context.Fournisseurs.Add(f);
            _context.SaveChanges();
            return Ok(new { success = true, fournisseur = f });
        }

        // 🔹 PUT: api/fournisseurs/5
        [HttpPut("{id}")]
        public IActionResult Update(int id, [FromBody] Fournisseur f)
        {
            var existing = _context.Fournisseurs.Find(id);
            if (existing == null) return NotFound();

            existing.Nom = f.Nom;
            existing.Contact = f.Contact;
            existing.Adresse = f.Adresse;
            existing.Tel = f.Tel;
            existing.Active = f.Active;

            _context.SaveChanges();
            return Ok(new { success = true, fournisseur = existing });
        }

        // 🔹 DELETE: api/fournisseurs/5
        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var f = _context.Fournisseurs.Find(id);
            if (f == null) return NotFound();

            _context.Fournisseurs.Remove(f);
            _context.SaveChanges();
            return Ok(new { success = true });
        }
    }
}
