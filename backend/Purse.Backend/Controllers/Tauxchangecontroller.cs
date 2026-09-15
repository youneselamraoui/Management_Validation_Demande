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
        var taux = await _context.TauxChanges
            .OrderBy(t => t.DevisSource)
            .ToListAsync();
        return Ok(taux);
    }

    // GET: api/tauxchange/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var taux = await _context.TauxChanges.FindAsync(id);
        if (taux == null)
            return NotFound(new { success = false, message = "Taux introuvable" });
        return Ok(taux);
    }

    // POST: api/tauxchange
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] TauxChange body)
    {
        if (string.IsNullOrWhiteSpace(body.DevisSource) || string.IsNullOrWhiteSpace(body.DevisCible))
            return BadRequest(new { success = false, message = "Devise source et cible sont requises" });

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

    // PUT: api/tauxchange/5
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] TauxChange body)
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

    // DELETE: api/tauxchange/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var taux = await _context.TauxChanges.FindAsync(id);
        if (taux == null)
            return NotFound(new { success = false, message = "Taux introuvable" });

        _context.TauxChanges.Remove(taux);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Taux supprimé avec succès" });
    }
}