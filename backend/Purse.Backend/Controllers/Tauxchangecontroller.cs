using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Purse.Backend.Data;
using Purse.Backend.Models;

namespace Purse.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TauxChangeController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public TauxChangeController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/tauxchange
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        try
        {
            var taux = await _context.TauxChanges
                .OrderBy(t => t.DevisSource)
                .ToListAsync();
            return Ok(taux);
        }
        catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number == 208)
        {
            // dbo.TauxChanges n'existe pas dans ta DB (screenshot) -> retour vide au lieu de 500
            Console.WriteLine($"[WARN] TauxChanges table manquante: {ex.Message}");
            return Ok(new List<TauxChange>());
        }
        catch (Exception ex)
        {
            Console.WriteLine($"[WARN] TauxChanges GetAll échoué: {ex.Message}");
            return Ok(new List<TauxChange>());
        }
    }

    // GET: api/tauxchange/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        try
        {
            var taux = await _context.TauxChanges.FindAsync(id);
            if (taux == null)
                return NotFound(new { success = false, message = "Taux introuvable" });
            return Ok(taux);
        }
        catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number == 208)
        {
            return NotFound(new { success = false, message = "Table TauxChanges inexistante en DB" });
        }
    }

    // POST: api/tauxchange
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TauxChange body)
    {
        if (string.IsNullOrWhiteSpace(body.DevisSource) || string.IsNullOrWhiteSpace(body.DevisCible))
            return BadRequest(new { success = false, message = "Devise source et cible sont requises" });

        try
        {
            var exists = await _context.TauxChanges.AnyAsync(t =>
                t.DevisSource == body.DevisSource && t.DevisCible == body.DevisCible);

            if (exists)
                return BadRequest(new { success = false, message = $"Taux {body.DevisSource} → {body.DevisCible} existe déjà" });

            var taux = new TauxChange
            {
                DevisSource = body.DevisSource.ToUpper().Trim(),
                DevisCible = body.DevisCible.ToUpper().Trim(),
                Taux = body.Taux,
            };

            _context.TauxChanges.Add(taux);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Taux ajouté avec succès", id = taux.Id });
        }
        catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number == 208)
        {
            return StatusCode(500, new { success = false, message = "Table TauxChanges inexistante en DB - exécute la migration ou crée la table", detail = ex.Message });
        }
    }

    // PUT: api/tauxchange/5
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] TauxChange body)
    {
        try
        {
            var taux = await _context.TauxChanges.FindAsync(id);
            if (taux == null)
                return NotFound(new { success = false, message = "Taux introuvable" });

            taux.DevisSource = body.DevisSource.ToUpper().Trim();
            taux.DevisCible = body.DevisCible.ToUpper().Trim();
            taux.Taux = body.Taux;

            await _context.SaveChangesAsync();
            return Ok(new { success = true, message = "Taux modifié avec succès" });
        }
        catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number == 208)
        {
            return StatusCode(500, new { success = false, message = "Table TauxChanges inexistante en DB", detail = ex.Message });
        }
    }

    // DELETE: api/tauxchange/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var taux = await _context.TauxChanges.FindAsync(id);
            if (taux == null)
                return NotFound(new { success = false, message = "Taux introuvable" });

            _context.TauxChanges.Remove(taux);
            await _context.SaveChangesAsync();

            return Ok(new { success = true, message = "Taux supprimé avec succès" });
        }
        catch (Microsoft.Data.SqlClient.SqlException ex) when (ex.Number == 208)
        {
            return StatusCode(500, new { success = false, message = "Table TauxChanges inexistante en DB", detail = ex.Message });
        }
    }
}