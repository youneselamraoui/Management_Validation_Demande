using Microsoft.AspNetCore.Http;

namespace Purse.Backend.DTOs;

public class InsertSapRequest
{
    public IFormFile File { get; set; } = default!;
    public string Rfx { get; set; } = string.Empty;
    public string Commentaire { get; set; } = string.Empty;
}