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
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(ApplicationDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public IActionResult Login([FromBody] LoginDto dto)
        {
            var user = _context.Utilisateurs
                .FirstOrDefault(u => u.Email == dto.Email && u.MotDePasse == dto.MotDePasse && u.Active);

            if (user == null)
                return Unauthorized(new { message = "Email ou mot de passe incorrect" });

            // Claims - normalize role to lowercase for case-insensitive [Authorize(Roles=...)] (fixes 403 for EMEA stored as "EMEA")
            var normalizedRole = user.Role?.ToLower().Trim() ?? "";
            var claims = new[]
            {
                new Claim("id", user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.Nom),
                new Claim(ClaimTypes.Role, normalizedRole)
            };

            // Clé secrète depuis appsettings.json
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                _configuration["Jwt:Key"] ?? throw new InvalidOperationException("Jwt:Key manquant")
            ));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.Now.AddHours(2),
                signingCredentials: creds);

            return Ok(new
            {
                message = "Connexion réussie",
                token = new JwtSecurityTokenHandler().WriteToken(token),
                user
            });
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            // Avec JWT, la déconnexion se fait côté client (suppression du token)
            return Ok(new { message = "Déconnexion réussie" });
        }
    }

    public class LoginDto
    {
        public required string Email { get; set; }
        public required string MotDePasse { get; set; }
    }
}
