using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Purse.Backend.Data;
using Purse.Backend.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Purse.Backend.Controllers
{
    [ApiController]
    [Route("api/files")]
    public class FilesController : ControllerBase
    {
        [HttpGet("{*filePath}")]
        public IActionResult DownloadFile(string filePath)
        {
            // Nettoie pour ne garder que le nom du fichier
            var safeFileName = Path.GetFileName(filePath);

            // Reconstruit le chemin complet (uploads/demandes/...)
            var path = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "uploads", "demandes", safeFileName);
            //var path = Path.Combine(Directory.GetCurrentDirectory(), "uploads", "demandes", safeFileName);

            if (!System.IO.File.Exists(path))
                return NotFound();

            return PhysicalFile(path, "application/pdf", safeFileName);
        }
    }
}
