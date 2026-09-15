using Microsoft.AspNetCore.Mvc;
using Purse.Backend.Data;
using Purse.Backend.Models;
using System.Linq;

namespace Purse.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DepartementsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DepartementsController(ApplicationDbContext context)
        {
            _context = context;
        }

        // 🔹 GET: api/departements
        [HttpGet]
        public IActionResult GetAll()
        {
            var departements = _context.Departements.ToList();
            return Ok(departements);
        }

        // 🔹 GET: api/departements/5
        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var dep = _context.Departements.Find(id);
            if (dep == null) return NotFound();
            return Ok(dep);
        }

        // 🔹 POST: api/departements
        [HttpPost]
        public IActionResult Create([FromBody] Departement dep)
        {
            _context.Departements.Add(dep);
            _context.SaveChanges();
            return Ok(new { success = true, dep });
        }

        // 🔹 PUT: api/departements/5
        [HttpPut("{id}")]
        public IActionResult Update(int id, [FromBody] Departement dep)
        {
            var existing = _context.Departements.Find(id);
            if (existing == null) return NotFound();

            existing.Nom = dep.Nom;
            _context.SaveChanges();
            return Ok(new { success = true, dep = existing });
        }

        // 🔹 DELETE: api/departements/5
        [HttpDelete("{id}")]
        public IActionResult Delete(int id)
        {
            var dep = _context.Departements.Find(id);
            if (dep == null) return NotFound();

            _context.Departements.Remove(dep);
            _context.SaveChanges();
            return Ok(new { success = true });
        }
    }
}
