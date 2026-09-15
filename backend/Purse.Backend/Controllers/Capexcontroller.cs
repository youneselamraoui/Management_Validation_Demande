using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Purse.Backend.Data;
using Purse.Backend.Models;

namespace Purse.Backend.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class CapexController : ControllerBase
{
    private readonly ApplicationDbContext _context;

    public CapexController(ApplicationDbContext context)
    {
        _context = context;
    }

    // GET: api/capex
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var capexList = await _context.Capexes
            .Select(c => new
            {
                c.Id,
                c.NomCapex,
                c.BudgetTotal,
                c.BudgetRestant,
                c.Devis
            })
            .ToListAsync();

        return Ok(capexList);
    }

    // GET: api/capex/5
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var capex = await _context.Capexes.FindAsync(id);

        if (capex == null)
            return NotFound(new { success = false, message = "Capex introuvable" });

        return Ok(new
        {
            capex.Id,
            capex.NomCapex,
            capex.BudgetTotal,
            capex.BudgetRestant,
            capex.Devis
        });
    }

    // POST: api/capex
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Capex body)
    {
        if (string.IsNullOrWhiteSpace(body.NomCapex))
            return BadRequest(new { success = false, message = "Le nom du Capex est requis" });

        var capex = new Capex
        {
            NomCapex = body.NomCapex.Trim(),
            BudgetTotal = body.BudgetTotal,
            BudgetRestant = body.BudgetRestant,
            Devis = body.Devis?.Trim()
        };

        _context.Capexes.Add(capex);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Capex ajouté avec succès", id = capex.Id });
    }

    // PUT: api/capex/5
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Capex body)
    {
        var capex = await _context.Capexes.FindAsync(id);

        if (capex == null)
            return NotFound(new { success = false, message = "Capex introuvable" });

        if (string.IsNullOrWhiteSpace(body.NomCapex))
            return BadRequest(new { success = false, message = "Le nom du Capex est requis" });

        capex.NomCapex = body.NomCapex.Trim();
        capex.BudgetTotal = body.BudgetTotal;
        capex.BudgetRestant = body.BudgetRestant;
        capex.Devis = body.Devis?.Trim();

        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Capex modifié avec succès" });
    }

    // DELETE: api/capex/5
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var capex = await _context.Capexes
            .Include(c => c.Demandes)
            .Include(c => c.Transactions)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (capex == null)
            return NotFound(new { success = false, message = "Capex introuvable" });

        if (capex.Demandes.Any() || capex.Transactions.Any())
            return BadRequest(new
            {
                success = false,
                message = "Impossible de supprimer : ce Capex est lié à des demandes ou des transactions"
            });

        _context.Capexes.Remove(capex);
        await _context.SaveChangesAsync();

        return Ok(new { success = true, message = "Capex supprimé avec succès" });
    }
}