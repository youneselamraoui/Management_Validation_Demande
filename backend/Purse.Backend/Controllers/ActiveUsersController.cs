using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Purse.Backend.Data;
using Purse.Backend.Models;
using System.Linq;


namespace Purse.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class ActiveUsersController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ActiveUsersController(ApplicationDbContext context)
        {
            _context = context;
        }

        [HttpGet]

        public IActionResult GetAll()
        {
            var activeusers = _context.ActiveUsers.ToList();
            return Ok(activeusers);
        }
    }

}
