using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Purse.Backend.Data;
using Purse.Backend.Models;
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Purse.Backend.Services;

namespace Purse.Backend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DemandesController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly EmailNotificationService _emailService;

        public DemandesController(ApplicationDbContext context, EmailNotificationService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        // ─── Créer une demande ───────────────────────────────────────────────               
        [HttpPost]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> Create([FromForm] CreateDemandeDto dto)
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();

            int userId = int.Parse(userIdClaim);

            var user = _context.Utilisateurs
                .Include(u => u.Chef)
                .FirstOrDefault(u => u.Id == userId);

            if (user == null) return NotFound("Utilisateur introuvable");
            string? fichierPath = null;
            if (dto.Fichier != null)
            {
                var uploadsFolder = Path.Combine("wwwroot", "uploads", "demandes");
                Directory.CreateDirectory(uploadsFolder); // crée le dossier si pas existant

                var fileName = $"demande_{Guid.NewGuid()}_{dto.Fichier.FileName}";
                var fullPath = Path.Combine(uploadsFolder, fileName);

                using var stream = new FileStream(fullPath, FileMode.Create);
                await dto.Fichier.CopyToAsync(stream);

                fichierPath = $"/uploads/demandes/{fileName}"; // chemin relatif à sauvegarder en BDD
            }

            var demande = new Demande
            {
                UtilisateurId = userId,
                CapexId = dto.CapexId,
                Justification = dto.Justification,
                FichierPath = fichierPath,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                Statut = "En attente validation achat1",

                Details = dto.Details.Select(d => new DetailsDemande
                {
                    Article = d.Article,
                    Quantite = d.Quantite,
                    FournisseurId = d.FournisseurId
                }).ToList()
            };

            _context.Demandes.Add(demande);
            await _context.SaveChangesAsync();
            // ===================== NOTIFICATIONS =====================
            bool emailCreateurEnvoye = false;
            bool emailAchat1Envoye = false;

            if (!string.IsNullOrEmpty(user.Email) && user.Active == true)
            {
                emailCreateurEnvoye = _emailService.SendNotification(user.Email,
                    $"✅ Demande #{demande.Id} soumise avec succès",
                    $"Votre demande <b>#{demande.Id}</b> a été soumise avec succès.<br>" +
                    $"Statut actuel : <b>{demande.Statut}</b>");
                _context.Notifications.Add(new Notification
                {
                    DemandeId = demande.Id,
                    Message = $"✅ Demande #{demande.Id} soumise avec succès - Statut : {demande.Statut}",
                    DateEnvoi = DateTime.Now,
                    Demande = demande
                });
            }

            var achat1User = await _context.Utilisateurs
                .FirstOrDefaultAsync(u => u.Role == "achat1" && u.Active == true);

            // Si on a trouvé un utilisateur Achat1 actif avec un email
            if (achat1User != null && !string.IsNullOrEmpty(achat1User.Email))
            {

                emailAchat1Envoye = _emailService.SendNotification(achat1User.Email,
                    $"Nouvelle demande #{demande.Id} à valider",
                    $"<b>{user.Nom}</b> a soumis une nouvelle demande <b>#{demande.Id}</b> qui attend votre validation.");

                // 2. On enregistre la notification dans la table (Utilisateur* [NotMapped])
                _context.Notifications.Add(new Notification
                {
                    DemandeId = demande.Id,
                    Message = $"Nouvelle demande #{demande.Id} à valider (Achat1)",
                    DateEnvoi = DateTime.Now,
                    Demande = demande
                });
            }

            try { await _context.SaveChangesAsync(); } catch (Exception ex) { Console.WriteLine($"[WARN] Notifications SaveChanges échoué: {ex.Message}"); }

            // ===================== RESULT =====================
            var result = new
            {
                demande.Id,
                demande.UtilisateurId,
                demande.CapexId,
                demande.Statut,
                demande.CreatedAt,
                Details = demande.Details.Select(d => new
                {
                    d.Article,
                    d.Quantite,
                    d.FournisseurId
                }),
                Utilisateur = new
                {
                    user.Id,
                    user.Nom,
                    user.Email,
                    ChefNom = user.Chef?.Nom,
                    ChefEmail = user.Chef?.Email
                },
                Notifications = new
                {
                    EmailCreateur = emailCreateurEnvoye,
                    emailAchat1Envoye = user.ChefId == null ? emailAchat1Envoye : (bool?)null
                }
            };

            return Ok(result);


        }

        // ─── Helper : Select utilisateur complet ────────────────────────────
        // (département + chef)
        private static IQueryable<Demande> IncludeAll(IQueryable<Demande> query)
        {
            return query
                .Include(d => d.Utilisateur!)
                    .ThenInclude(u => u.Departement)   //  département
                .Include(d => d.Utilisateur!)
                    .ThenInclude(u => u.Chef)           //  chef
                .Include(d => d.Details)
                 
                 .Include(d => d.BonsCommande)
                .Include(d => d.Capex);

        }

        // ─── Select anonyme réutilisable ────────────────────────────────────
        private static object MapDemande(Demande d) => new
        {
            d.Id,
            d.Statut,
            d.CreatedAt,
            d.Commentaire,
            d.CapexId,
            d.DateValidationAchat1,
            d.DateValidationAchat2,
            d.RFX,
            d.CheminDevis,
            d.FichierPath,
            Capex = d.Capex == null ? null : new
            {
                d.Capex.Id,
                d.Capex.NomCapex
            },
            Utilisateur = d.Utilisateur == null ? null : new
            {
                d.Utilisateur.Id,
                d.Utilisateur.Nom,
                d.Utilisateur.Email,
                d.Utilisateur.ChefId,
                d.Utilisateur.Role,
                ChefNom = d.Utilisateur.Chef?.Nom,
                Departement = d.Utilisateur.Departement?.Nom,
            },
            Details = d.Details.Select(x => new
            {
                x.Id,
                x.Article,
                x.Quantite,
                x.Prix,
                x.Devis,
                x.FournisseurId,
                Fournisseur = x.Fournisseur == null ? null : new
                {
                    x.Fournisseur.Id,
                    x.Fournisseur.Nom
                }
            }),
            bonsCommandes = d.BonsCommande.Select(b => new
            {
                b.Id,
                b.Po,
                b.DateCreation
            }),

        };

        // ─── GET /chef ───────────────────────────────────────────────────────
        [HttpGet("chef")]
        [Authorize(Roles = "chef,admin")]
        public IActionResult GetDemandesChef()
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value?.ToLower().Trim();

            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();
            int userId = int.Parse(userIdClaim);

            var query = IncludeAll(_context.Demandes);

            if (roleClaim == "admin")
                query = query.Where(d => d.Statut == "En attente validation chef");
            else
                query = query.Where(d =>
                    d.Utilisateur != null &&
                    d.Utilisateur.ChefId == userId &&
                    d.Statut == "En attente validation chef");

            var demandes = query
                .OrderBy(d => d.CreatedAt)
                .AsEnumerable()
                .Select(MapDemande)
                .ToList();

            return Ok(demandes);
        }

        // ─── GET /achat1 ─────────────────────────────────────────────────────
        [HttpGet("achat1")]
        [Authorize(Roles = "achat1,admin")]
        public IActionResult GetDemandesAchat1()
        {
            var demandes = IncludeAll(_context.Demandes)
                .Where(d => d.Statut == "En attente validation achat1")
                .OrderBy(d => d.CreatedAt)
                .AsEnumerable()
                .Select(MapDemande)
                .ToList();

            return Ok(demandes);
        }

        // ─── GET /achat2 ─────────────────────────────────────────────────────
        [HttpGet("achat2")]
        [Authorize(Roles = "achat2,admin")]
        public IActionResult GetDemandesAchat2()
        {
            var demandes = IncludeAll(_context.Demandes)
                .Where(d => d.Statut == "En attente validation achat2")
                .OrderBy(d => d.CreatedAt)
                .AsEnumerable()
                .Select(MapDemande)
                .ToList();

            return Ok(demandes);
        }
        // ─── GET /finance ─────────────────────────────────────────────────────
        [HttpGet("finance")]
        [Authorize(Roles = "finance,admin")]
        public IActionResult GetDemandesFinance()
        {
            var demandes = IncludeAll(_context.Demandes)
                .Where(d => d.Statut == "En attente confirmation finance")
                .OrderBy(d => d.CreatedAt)
                .AsEnumerable()
                .Select(MapDemande)
                .ToList();

            return Ok(demandes);
        }


        // ─── GET /directeur ──────────────────────────────────────────────────
        [HttpGet("directeur")]
        [Authorize(Roles = "directeur,admin")]
        public IActionResult GetDemandesDirecteur()
        {
            var demandes = IncludeAll(_context.Demandes)
                .Where(d => d.Statut == "En attente validation directeur")
                .OrderBy(d => d.CreatedAt)
                .AsEnumerable()
                .Select(MapDemande)
                .ToList();

            return Ok(demandes);
        }

        // ─── PUT /{id}/statut ────────────────────────────────────────────────
        [HttpPut("{id}/statut")]
        [Authorize(Roles = "chef,achat1,achat2,finance,directeur,admin")]
        public IActionResult UpdateStatut(int id, [FromBody] UpdateStatutDto dto)
        {
            var demande = _context.Demandes
               .Include(d => d.Capex)
               .Include(d => d.Utilisateur!)
                .ThenInclude(u => u.Chef)
            .FirstOrDefault(d => d.Id == id);
            if (demande == null) return NotFound("Demande introuvable");

            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value?.ToLower().Trim();
            if (string.IsNullOrEmpty(roleClaim)) return Unauthorized();
            demande.Statut = (roleClaim, dto.Action.ToLower()) switch
            {
                ("chef", "valider") => "En attente validation achat2",
                ("chef", "refuser") => "Refusé chef",
                ("achat1", "valider") => demande.Utilisateur?.ChefId == null
                    ? "En attente validation achat2"
                    : "En attente validation chef",
                ("achat1", "refuser") => "Refusé achat1",
                ("achat2", "valider") => "En attente confirmation finance",
                ("achat2", "refuser") => "Refusé achat2",
                ("finance", "valider") => "En attente validation directeur",
                ("finance", "refuser") => "Refusé finance",
                ("directeur", "valider") => "Bon de commande",
                ("directeur", "refuser") => "Refusé directeur",
                _ => demande.Statut
               /* ("chef", "valider") => demande.DateValidationAchat1==null 
                ? "En attente validation achat1"
                : "En attente confirmation finance",
                ("chef", "refuser") => "Refusé chef",
                ("achat1", "valider") => "En attente validation achat2",                   
                ("achat1", "refuser") => "Refusé achat1",
                ("achat2", "valider") => demande.Utilisateur?.ChefId == null
                    ? "En attente confirmation finance"
                    : "En attente validation chef",
                ("achat2", "refuser") => "Refusé achat2",
                ("finance", "valider") => "En attente validation directeur",
                ("finance", "refuser") => "Refusé finance",
                ("directeur", "valider") => "Bon de commande",
                ("directeur", "refuser") => "Refusé directeur",
                _ => demande.Statut*/
            };
            if (roleClaim == "achat1" && dto.Action.ToLower() == "valider")
                demande.DateValidationAchat1 = DateTime.Now;

            if (roleClaim == "achat2" && dto.Action.ToLower() == "valider")
                demande.DateValidationAchat2 = DateTime.Now;

            if (roleClaim == "chef" && dto.Action.ToLower() == "valider")
                demande.DateValidateChef = DateTime.Now;

            if (roleClaim == "finance" && dto.Action.ToLower() == "valider")
                demande.DateValidateFinance = DateTime.Now;    

            if (roleClaim == "directeur" && dto.Action.ToLower() == "valider")
                demande.DateValidateDirecteur = DateTime.Now;    
            //  Si refus → réintégrer le montant réservé dans le budget du Capex
            if (demande.Statut.StartsWith("Refusé")
                && demande.Capex != null
                && demande.MontantReserve.HasValue)
            {
                demande.Capex.BudgetRestant += demande.MontantReserve.Value;
                demande.MontantReserve = null;
            }


            demande.UpdatedAt = DateTime.Now;
            if (!string.IsNullOrEmpty(dto.Commentaire))
                demande.Commentaire = dto.Commentaire;

            // ===================== NOTIFICATIONS =====================
            string commentaire = string.IsNullOrEmpty(dto.Commentaire) ? "Aucun commentaire" : dto.Commentaire;

            switch (demande.Statut)
            {
                case "En attente validation achat1":
                    {
                        var achat1User = _context.Utilisateurs.FirstOrDefault(u => u.Role == "achat1" && u.Active == true);
                        if (!string.IsNullOrEmpty(achat1User?.Email))
                        {
                            _emailService.SendNotification(achat1User.Email,
                                $"Nouvelle demande #{id} à valider",
                                $"La demande <b>#{id}</b> a été validée par le chef et attend votre validation.");

                            _context.Notifications.Add(new Notification
                            {
                                DemandeId = id,
                                UtilisateurId = achat1User.Id,
                                Message = $"Nouvelle demande #{id} à valider (Achat1)",
                                DateEnvoi = DateTime.Now,
                                Demande = demande,
                                Utilisateur = achat1User
                            });
                        }
                    }
                    break;
                case "En attente validation chef":
                    {
                        var chefId = demande.Utilisateur?.ChefId;
                        var chefUser = chefId.HasValue
                            ? _context.Utilisateurs.FirstOrDefault(u => u.Id == chefId.Value && u.Active == true)
                            : null;

                        if (chefUser != null && !string.IsNullOrEmpty(chefUser.Email))
                        {
                            _emailService.SendNotification(chefUser.Email,
                                $"Nouvelle demande #{id} à valider",
                                $"La demande <b>#{id}</b> a été pré-validée par Achat1 et attend votre validation.");

                            _context.Notifications.Add(new Notification
                            {
                                DemandeId = id,
                                UtilisateurId = chefUser.Id,
                                Message = $"Nouvelle demande #{id} à valider (Chef de département)",
                                DateEnvoi = DateTime.Now,
                                Demande = demande,
                                Utilisateur = chefUser
                            });
                        }
                        break;
                    }

                case "En attente validation achat2":
                    var achat2User = _context.Utilisateurs.FirstOrDefault(u => u.Role == "achat2" && u.Active == true);
                    if (achat2User != null && !string.IsNullOrEmpty(achat2User.Email))
                    {
                        _emailService.SendNotification(achat2User.Email,
                            $"Nouvelle demande #{id} à valider",
                            $"La demande <b>#{id}</b> a été validée par Achat1 et attend votre validation.");

                        _context.Notifications.Add(new Notification
                        {
                            DemandeId = id,
                            UtilisateurId = achat2User.Id,
                            Message = $"Nouvelle demande #{id} à valider (Achat2)",
                            DateEnvoi = DateTime.Now,
                            Demande = demande,
                            Utilisateur = achat2User
                        });
                    }
                    break;

                case "En attente confirmation finance":
                    var financeUser = _context.Utilisateurs.FirstOrDefault(u => u.Role == "finance" && u.Active == true);
                    if (financeUser != null && !string.IsNullOrEmpty(financeUser.Email))
                    {
                        _emailService.SendNotification(financeUser.Email,
                            $"Confirmation finance requise – demande #{id}",
                            $"La demande <b>#{id}</b> a été validée par Achat2 et attend votre confirmation.");

                        _context.Notifications.Add(new Notification
                        {
                            DemandeId = id,
                            UtilisateurId = financeUser.Id,
                            Message = $"Demande #{id} en attente confirmation finance",
                            DateEnvoi = DateTime.Now,
                            Demande = demande,
                            Utilisateur = financeUser
                        });
                    }
                    break;

                case "En attente validation directeur":
                    var directeurUser = _context.Utilisateurs.FirstOrDefault(u => u.Role == "directeur" && u.Active == true);
                    if (directeurUser != null && !string.IsNullOrEmpty(directeurUser.Email))
                    {
                        _emailService.SendNotification(directeurUser.Email,
                            $"Validation directeur requise – demande #{id}",
                            $"La demande <b>#{id}</b> a été confirmée par Finance et attend votre validation.");

                        _context.Notifications.Add(new Notification
                        {
                            DemandeId = id,
                            UtilisateurId = directeurUser.Id,
                            Message = $"Demande #{id} en attente validation directeur",
                            DateEnvoi = DateTime.Now,
                            Demande = demande,
                            Utilisateur = directeurUser
                        });
                    }
                    break;

                case "Bon de commande":
                    if (demande.Utilisateur != null && !string.IsNullOrEmpty(demande.Utilisateur.Email) && demande.Utilisateur.Active == true)
                    {
                        _emailService.SendNotification(demande.Utilisateur.Email,
                            $"✅ Demande #{id} approuvée",
                            $"Votre demande <b>#{id}</b> a été approuvée par le directeur et est passée en <b>Bon de commande</b>.");

                        _context.Notifications.Add(new Notification
                        {
                            DemandeId = id,
                            UtilisateurId = demande.UtilisateurId,
                            Message = $"Demande #{id} approuvée - Bon de commande",
                            DateEnvoi = DateTime.Now,
                            Demande = demande,
                            Utilisateur = demande.Utilisateur
                        });
                    }
                    break;

                // Tous les cas de refus
                case "Refusé chef":
                case "Refusé achat1":
                case "Refusé achat2":
                case "Refusé finance":
                case "Refusé directeur":
                    if (demande.Utilisateur != null && !string.IsNullOrEmpty(demande.Utilisateur.Email) && demande.Utilisateur.Active == true)
                    {
                        _emailService.SendNotification(demande.Utilisateur.Email,
                            $"❌ Demande #{id} refusée",
                            $"Votre demande <b>#{id}</b> a été refusée.<br>Commentaire : {commentaire}");

                        _context.Notifications.Add(new Notification
                        {
                            DemandeId = id,
                            UtilisateurId = demande.UtilisateurId,
                            Message = $"Demande #{id} refusée par {roleClaim} - {commentaire}",
                            DateEnvoi = DateTime.Now,
                            Demande = demande,
                            Utilisateur = demande.Utilisateur
                        });
                    }
                    break;
            }

            try { _context.SaveChanges(); } catch (Exception ex) { Console.WriteLine("[WARN] SaveChanges Statut echoue: " + ex.Message); }

            return Ok(new
            {
                message = "Statut mis à jour",
                statut = demande.Statut,
                budgetRestant = demande.Capex?.BudgetRestant
            });
        }
        [HttpGet("{id}")]
        [Authorize]
        public IActionResult GetDemande(int id)
        {
            var demande = IncludeAll(_context.Demandes)
                .Include(d => d.Details)
                // .ThenInclude(x => x.Fournisseur) désactivé : FournisseurId/Fournisseur [NotMapped] (dbo.DetailsDemandes sans cette colonne)
                .FirstOrDefault(d => d.Id == id);

            if (demande == null) return NotFound();

            return Ok(MapDemande(demande));
        }
        [HttpPut("{id}/details")]
        [Authorize(Roles = "achat1,admin")]
        public IActionResult UpdateDetails(int id, [FromBody] List<UpdateDetailDto> dtos)
        {
            var demande = _context.Demandes
                .Include(d => d.Details)
                .FirstOrDefault(d => d.Id == id);

            if (demande == null) return NotFound("Demande introuvable");

            foreach (var dto in dtos)
            {
                var detail = demande.Details.FirstOrDefault(d => d.Id == dto.Id);
                if (detail == null) continue;

                detail.FournisseurId = dto.FournisseurId;
                detail.Prix = dto.Prix;
                detail.Devis = dto.Devis;
            }

            demande.UpdatedAt = DateTime.Now;
            _context.SaveChanges();

            return Ok(new { message = "Devis mis à jour" });
        }
        [HttpGet("historique")]
        [Authorize]
        public IActionResult GetHistorique(
        [FromQuery] string? statut,
        [FromQuery] int? capexId,
        [FromQuery] bool? sansCapex,
        [FromQuery] int? departementId,
        [FromQuery] int? utilisateurId,
        [FromQuery] DateTime? date,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
        {
            var query = IncludeAll(_context.Demandes);
            var userIdStr = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdStr)) return Unauthorized();
            int userIdClaim = int.Parse(userIdStr);

            var role = User.FindFirst(ClaimTypes.Role)?.Value?.ToLower().Trim();

            if (role == "employe")
            {
                query = query.Where(d => d.UtilisateurId == userIdClaim);
                utilisateurId = null;
            }
            else if (role == "chef")
            {
                var userDeptId = _context.Utilisateurs
                    .Where(u => u.Id == userIdClaim)
                    .Select(u => u.DepartementId)
                    .FirstOrDefault();

                query = query.Where(d => d.Utilisateur != null && d.Utilisateur.DepartementId == userDeptId);
                departementId = null;
            }

            if (!string.IsNullOrEmpty(statut))
                query = query.Where(d => d.Statut == statut);
            if (sansCapex == true)
                query = query.Where(d => d.CapexId == null);
            else if (capexId.HasValue)
                query = query.Where(d => d.CapexId == capexId);
            if (departementId.HasValue)
                query = query.Where(d => d.Utilisateur != null && d.Utilisateur.DepartementId == departementId);
            if (utilisateurId.HasValue)
                query = query.Where(d => d.UtilisateurId == utilisateurId);
            if (date.HasValue)
                query = query.Where(d => d.CreatedAt.Date == date.Value.Date);

            var total = query.Count();

            var demandes = query
                .OrderByDescending(d => d.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .AsEnumerable()
                .Select(MapDemande)
                .ToList();

            return Ok(new { data = demandes, total, page, pageSize });
        }
        // ─── GET /mes-bons ───────────────────────────────────────────────────────
        // Retourne uniquement les "Bon de commande" de l'utilisateur connecté
        [HttpGet("mes-bons")]
        [Authorize]
        public IActionResult GetMesBons()
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();
            int userId = int.Parse(userIdClaim);

            var demandes = IncludeAll(_context.Demandes)
                .Include(d => d.Details)
                // ThenInclude Fournisseur désactivé : [NotMapped]
                .Where(d =>
                    d.UtilisateurId == userId &&
                    d.Statut == "Bon de commande" &&
                    string.IsNullOrEmpty(d.RFX)) //  seulement celles sans RFX
                .OrderBy(d => d.CreatedAt)
                .AsEnumerable()
                .Select(MapDemande)
                .ToList();

            return Ok(demandes);
        }


        // ─── PUT /{id}/rfx ───────────────────────────────────────────────────────
        // Sauvegarde le RFX — uniquement le propriétaire de la demande
        [HttpPut("{id}/rfx")]
        [Authorize]
        public IActionResult UpdateRfx(int id, [FromBody] UpdateRfxDto dto)
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();
            int userId = int.Parse(userIdClaim);

            var demande = _context.Demandes
                .Include(d => d.Details)
                // ThenInclude Fournisseur désactivé : [NotMapped]
                .FirstOrDefault(d => d.Id == id);

            if (demande == null) return NotFound("Demande introuvable");
            if (demande.UtilisateurId != userId) return Forbid();
            if (demande.Statut != "Bon de commande")
                return BadRequest("Impossible de saisir le RFX : statut invalide.");

            // Enregistrer le RFX
            demande.RFX = dto.Rfx;
            demande.UpdatedAt = DateTime.Now;
            _context.SaveChanges();

            // Générer les PO par fournisseur (FournisseurId [NotMapped] -> peut être null, on gère le cas vide)
            var fournisseurs = demande.Details
            .Where(d => d.FournisseurId != null) // sécurité, mais NotMapped => toujours null en DB
            .GroupBy(d => d.FournisseurId)
            .ToList();
            var lastPo = _context.BonCommandes
                .OrderByDescending(b => b.Id)
                .FirstOrDefault();

            int numeroDemande = 1;
            if (lastPo != null)
            {
                // Extraire la partie avant le tiret (ex: "5-2" → "5")
                var lastNumero = int.Parse(lastPo.Po.Split('-')[0]);
                numeroDemande = lastNumero + 1;
            }
            int compteur = 1;
            if (fournisseurs.Count == 0)
            {
                // Fallback : DetailsDemandes sans FournisseurId (colonne absente) -> créer un seul PO sans fournisseur (ou avec 1er fournisseur disponible)
                // On récupère un fournisseur existant si possible pour respecter FK non NULL (dbo.BonCommandes.FournisseurId non NULL)
                var fallbackFournisseurId = _context.Fournisseurs.Select(f => (int?)f.Id).FirstOrDefault();
                var poFallback = new BonCommande
                {
                    DemandeId = demande.Id,
                    Demande = demande,
                    Po = $"{numeroDemande}-{compteur}",
                    DateCreation = DateTime.Now,
                    FournisseurId = fallbackFournisseurId, // peut être null si aucun fournisseur, mais DB exige non NULL -> informer
                };
                // Si FournisseurId null et DB exige non NULL, on ne crée pas et on informe
                if (fallbackFournisseurId != null)
                {
                    _context.BonCommandes.Add(poFallback);
                    compteur++;
                }
            }
            else
            {
                foreach (var group in fournisseurs)
                {
                    var po = new BonCommande
                    {
                        DemandeId = demande.Id,
                        Demande = demande,
                        Po = $"{numeroDemande}-{compteur}",
                        DateCreation = DateTime.Now,
                        FournisseurId = group.Key,
                    };

                    _context.BonCommandes.Add(po);
                    compteur++;
                }
            }

            _context.SaveChanges();

            var demandeAvecPo = _context.Demandes
      .Include(d => d.BonsCommande)
      .FirstOrDefault(d => d.Id == demande.Id);

            return Ok(new
            {
                message = "RFX enregistré et PO(s) généré(s) avec succès",
                rfx = demandeAvecPo?.RFX,
                bonsCommandes = demandeAvecPo?.BonsCommande.Select(b => new
                {
                    b.Id,
                    b.Po,
                    b.DateCreation
                })
            });
        }

        [HttpPut("{id}/budget")]
        [Authorize(Roles = "achat1,admin")]
        public IActionResult UpdateBudget(int id, [FromBody] UpdateBudgetDto dto)
        {
            var demande = _context.Demandes
                .Include(d => d.Capex)
                .FirstOrDefault(d => d.Id == id);

            if (demande == null) return NotFound("Demande introuvable");
            if (demande.Capex == null) return BadRequest("Pas de Capex associé");

            // Sauvegarde directe des valeurs envoyées par le frontend
            demande.MontantReserve = (double)dto.MontantReserve;
            demande.Capex.BudgetRestant = (double)dto.BudgetRestant;

            demande.UpdatedAt = DateTime.Now;
            _context.SaveChanges();

            return Ok(new
            {
                message = "Budget mis à jour",
                budgetRestant = demande.Capex.BudgetRestant,
                montantReserve = demande.MontantReserve
            });
        }
        [HttpPost("{id}/upload-devis")]
        [Authorize(Roles = "achat1,achat2,admin")]
        public async Task<IActionResult> UploadDevis(int id, IFormFile file)
        {
            var demande = await _context.Demandes.FindAsync(id);
            if (demande == null) return NotFound();

            var folder = Path.Combine("wwwroot", "uploads", "devis");
            Directory.CreateDirectory(folder);

            var fileName = $"demande_{id}_{file.FileName}";
            var path = Path.Combine(folder, fileName);

            using var stream = new FileStream(path, FileMode.Create);
            await file.CopyToAsync(stream);

            demande.CheminDevis = $"/uploads/devis/{fileName}";
            await _context.SaveChangesAsync();

            return Ok(new { chemin = demande.CheminDevis });
        }

    }


}