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

    
        private const bool NotificationsPersistanceActive = false;

        public DemandesController(ApplicationDbContext context, EmailNotificationService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        // ─── Créer une demande ───────────────────────────────────────────────
        // Workflow complet EMEA (spec 22/09/2026) :
        // 1) employe -> Chef (chef|achat2|finance|directeur|emea) -> achat1 (prix) -> achat2 -> Chef (2e) -> finance -> directeur -> En attente insertion SAP (achat1 insert fichier SAP+commentaire+RFX) -> En attente validation EMEA -> Bon de commande (PO auto)
        // 2) achat1   -> Chef (achat2) -> achat1 -> achat2 -> finance -> directeur -> SAP -> EMEA -> BC
        // 3) chef      -> achat1 -> achat2 -> finance -> directeur -> SAP -> EMEA -> BC
        // 4) achat2    -> achat1 -> achat2 -> finance -> directeur -> SAP -> EMEA -> BC
        // 5) finance   -> achat1 -> achat2 -> finance -> directeur -> SAP -> EMEA -> BC
        // 6) directeur -> achat1 -> achat2 -> finance -> directeur -> SAP -> EMEA -> BC
        // 7) emea      -> achat1 -> achat2 -> finance -> directeur -> SAP -> EMEA -> BC
        // Note : employe = seul rôle avec double passage Chef (avant et après achat2). Tous les autres : 1 seul Chef ou 0 Chef.
        // Le Chef peut être de rôle chef, achat2, finance, directeur, emea (EstExempteChef + GetDemandesChef autorise ces rôles comme valideur Chef si ChefId pointe vers eux).
        private static readonly HashSet<string> RolesSansChef = new(StringComparer.OrdinalIgnoreCase)
        {
            "chef", "achat2", "finance", "directeur", "emea", "admin"
        };

        private static bool EstExempteChef(string? role) => !string.IsNullOrEmpty(role) && RolesSansChef.Contains(role.Trim());

        [HttpPost]
        [Authorize]
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

            // ─── Validation : justification obligatoire si un fournisseur est suggéré ───
            bool fournisseurChoisi = dto.Details != null && dto.Details.Any(d => d.FournisseurId != null);
            if (fournisseurChoisi && string.IsNullOrWhiteSpace(dto.Justification))
            {
                return BadRequest(new { message = "La justification est obligatoire lorsque vous sélectionnez un fournisseur." });
            }

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

            var roleCreateur = user.Role?.ToLower().Trim();
            var statutInitial = EstExempteChef(roleCreateur)
                ? "En attente validation achat1"
                : "En attente validation chef";

            var demande = new Demande
            {
                UtilisateurId = userId,
                CapexId = dto.CapexId,
                Justification = dto.Justification,
                FichierPath = fichierPath,
                CreatedAt = DateTime.Now,
                UpdatedAt = DateTime.Now,
                Statut = statutInitial,

                Details = dto.Details.Select(d => new DetailsDemande
                {
                    Article = d.Article,
                    Quantite = d.Quantite,
                    FournisseurId = d.FournisseurId
                }).ToList()
            };

            _context.Demandes.Add(demande);
            await _context.SaveChangesAsync();
            bool emailCreateurEnvoye = false;
            bool emailChefEnvoye = false;
            bool emailAchat1Envoye = false;

            if (!string.IsNullOrEmpty(user.Email) && user.Active == true)
            {
                emailCreateurEnvoye = _emailService.SendNotification(user.Email,
                    $"✅ Demande #{demande.Id} soumise avec succès",
                    $"Votre demande <b>#{demande.Id}</b> a été soumise avec succès.<br>" +
                    $"Statut actuel : <b>{demande.Statut}</b>");
                if (NotificationsPersistanceActive) _context.Notifications.Add(new Notification
                {
                    DemandeId = demande.Id,
                    Message = $"✅ Demande #{demande.Id} soumise avec succès - Statut : {demande.Statut}",
                    DateEnvoi = DateTime.Now,
                    Demande = demande
                });
            }

            if (statutInitial == "En attente validation chef")
            {
                var chefUser = user.ChefId.HasValue ? await _context.Utilisateurs.FirstOrDefaultAsync(u => u.Id == user.ChefId.Value && u.Active == true) : null;
                if (chefUser != null && !string.IsNullOrEmpty(chefUser.Email))
                {
                    emailChefEnvoye = _emailService.SendNotification(chefUser.Email,
                        $"Nouvelle demande #{demande.Id} à valider",
                        $"<b>{user.Nom}</b> ({roleCreateur}) a soumis une nouvelle demande <b>#{demande.Id}</b> qui attend votre validation.");
                    if (NotificationsPersistanceActive) _context.Notifications.Add(new Notification
                    {
                        DemandeId = demande.Id,
                        Message = $"Nouvelle demande #{demande.Id} à valider (Chef)",
                        DateEnvoi = DateTime.Now,
                        Demande = demande
                    });
                }
            }
            else
            {
                // Pas de chef : notifier directement achat1 pour insertion des prix
                var achat1User = _context.Utilisateurs.FirstOrDefault(u => u.Role.ToLower() == "achat1" && u.Active == true);
                if (!string.IsNullOrEmpty(achat1User?.Email))
                {
                    emailAchat1Envoye = _emailService.SendNotification(achat1User.Email,
                        $"Nouvelle demande #{demande.Id} - insertion prix requise",
                        $"<b>{user.Nom}</b> ({roleCreateur}) a soumis la demande <b>#{demande.Id}</b> ({statutInitial}). Veuillez insérer les prix.");
                    if (NotificationsPersistanceActive) _context.Notifications.Add(new Notification
                    {
                        DemandeId = demande.Id,
                        UtilisateurId = achat1User.Id,
                        Message = $"Demande #{demande.Id} en attente insertion prix (Achat1) - création par {roleCreateur}",
                        DateEnvoi = DateTime.Now,
                        Demande = demande,
                        Utilisateur = achat1User
                    });
                }
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
                    EmailChef = emailChefEnvoye,
                    EmailAchat1 = emailAchat1Envoye
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

        private Dictionary<string, string> GetFournisseurNomMap()
        {
            try { return _context.Fournisseurs.AsNoTracking().ToDictionary(f => f.Id.ToString(), f => f.Nom); }
            catch { return new Dictionary<string, string>(); }
        }

        private int GetNextProvisionalBase()
        {
            try
            {
                var lastPoStr = _context.BonCommandes.AsNoTracking().OrderByDescending(b => b.Id).Select(b => b.Po).FirstOrDefault();
                int num = 1;
                if (!string.IsNullOrEmpty(lastPoStr))
                {
                    var parts = lastPoStr.Split('-');
                    bool parsed = false;
                    foreach (var p in parts)
                    {
                        if (int.TryParse(p, out var n)) { num = n + 1; parsed = true; break; }
                        var digits = new string(p.Where(char.IsDigit).ToArray());
                        if (!string.IsNullOrEmpty(digits) && int.TryParse(digits, out var nd)) { num = nd + 1; parsed = true; break; }
                    }
                    if (!parsed)
                    {
                        var allDigits = new string(lastPoStr.Where(char.IsDigit).ToArray());
                        if (int.TryParse(allDigits, out var allN)) num = allN + 1;
                    }
                }
                return num;
            }
            catch { return 1; }
        }
        private string GetNextProvisionalPo() => $"{GetNextProvisionalBase()}-1";

        // ─── Select anonyme réutilisable ────────────────────────────────────
        private object MapDemandeEnrichi(Demande d, Dictionary<string, string>? fMap = null, string? provisionalPoOverride = null)
        {
            fMap ??= GetFournisseurNomMap();
            // Po provisoire pour EMEA (non persisté) - passed by caller to avoid concurrent DbContext query during enumeration
            string? provisionalPo = provisionalPoOverride;
            if (provisionalPo == null && (d.Statut == "En attente validation EMEA" || d.Statut == "En attente insertion SAP"))
            {
                // fallback: if caller didn't provide, try isolated query (may be null if concurrent, but caller should provide)
                try { provisionalPo = GetNextProvisionalPo(); } catch { provisionalPo = null; }
            }
            return new
            {
                d.Id,
                d.Statut,
                d.CreatedAt,
                d.Commentaire,
                d.CommentaireSAP,
                d.Justification,
                d.CapexId,
                d.DateValidationAchat1,
                d.DateValidationAchat2,
                d.DateValidateChef,
                d.DateValidateFinance,
                d.DateValidateDirecteur,
                d.DateInsertionSAP,
                d.DateValidationEMEA,
                d.RFX,
                d.CheminDevis,
                d.CheminDevis2,
                d.CheminDevis3,
                d.CheminSAP,
                d.FichierPath,
                d.InfoMessage,
                d.InfoReponse,
                d.InfoDemandeParRole,
                d.InfoDemandeParUserId,
                d.InfoDemandeDate,
                d.InfoReponseDate,
                d.StatutAvantInfo,
                ProvisionalPo = provisionalPo,
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
                Details = d.Details.Select(x =>
                {
                    string? fNom = null;
                    if (x.Fournisseur != null) fNom = x.Fournisseur.Nom;
                    else if (x.FournisseurId != null && fMap.TryGetValue(x.FournisseurId.ToString()!, out var nom)) fNom = nom;
                    return new
                    {
                        x.Id,
                        x.Article,
                        x.Quantite,
                        x.Prix,
                        x.Devis,
                        x.FournisseurId,
                        Fournisseur = fNom == null ? null : new
                        {
                            Id = x.FournisseurId,
                            Nom = fNom
                        }
                    };
                }),
                bonsCommandes = d.BonsCommande.Select(b => new
                {
                    b.Id,
                    b.Po,
                    b.DateCreation
                }),
            };
        }

        private static object MapDemande(Demande d) => new
        {
            d.Id,
            d.Statut,
            d.CreatedAt,
            d.Commentaire,
            d.CommentaireSAP,
            d.Justification,
            d.CapexId,
            d.DateValidationAchat1,
            d.DateValidationAchat2,
            d.DateValidateChef,
            d.DateValidateFinance,
            d.DateValidateDirecteur,
            d.DateInsertionSAP,
            d.DateValidationEMEA,
            d.RFX,
            d.CheminDevis,
            d.CheminDevis2,
            d.CheminDevis3,
            d.CheminSAP,
            d.FichierPath,
            d.InfoMessage,
            d.InfoReponse,
            d.InfoDemandeParRole,
            d.InfoDemandeParUserId,
            d.InfoDemandeDate,
            d.InfoReponseDate,
            d.StatutAvantInfo,
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
        // Chef au sens large : employé dont le ChefId pointe vers l'utilisateur connecté.
        // Par spec : chef, achat2, finance, directeur, emea sont tous des chefs potentiels.
        [HttpGet("chef")]
        [Authorize(Roles = "chef,achat2,finance,directeur,emea,admin")]
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

            var fMap0 = GetFournisseurNomMap();
            var baseNum0 = GetNextProvisionalBase();
            var list0 = query
                .OrderBy(d => d.CreatedAt)
                .ToList();
            int idx0 = 0;
            var demandes = list0.Select(d =>
            {
                string? po = null;
                if (d.Statut == "En attente validation EMEA" || d.Statut == "En attente insertion SAP")
                {
                    po = $"{baseNum0 + idx0}-1";
                    idx0++;
                }
                return MapDemandeEnrichi(d, fMap0, po);
            }).ToList();

            return Ok(demandes);
        }

        // ─── GET /achat1 ─────────────────────────────────────────────────────
        [HttpGet("achat1")]
        [Authorize(Roles = "achat1,admin")]
        public IActionResult GetDemandesAchat1()
        {
            var fMap = GetFournisseurNomMap();
            // no provisional needed for achat1, but pass null
            var demandes = IncludeAll(_context.Demandes)
                .Where(d => d.Statut == "En attente validation achat1")
                .OrderBy(d => d.CreatedAt)
                .ToList()
                .Select(d => MapDemandeEnrichi(d, fMap, null))
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

        // ─── GET /sap-insertion (achat1) ────────────────────────────────────
        [HttpGet("sap-insertion")]
        [Authorize(Roles = "achat1,admin")]
        public IActionResult GetDemandesSapInsertion()
        {
            var fMap = GetFournisseurNomMap();
            var baseNumSap = GetNextProvisionalBase();
            var listSap = IncludeAll(_context.Demandes)
                .Where(d => d.Statut == "En attente insertion SAP")
                .OrderBy(d => d.CreatedAt)
                .ToList();
            var demandes = listSap.Select((d, idx) => MapDemandeEnrichi(d, fMap, $"{baseNumSap + idx}-1")).ToList();
            return Ok(demandes);
        }

        // ─── GET /emea ───────────────────────────────────────────────────────
        [HttpGet("emea")]
        [Authorize(Roles = "emea,admin")]
        public IActionResult GetDemandesEmea()
        {
            var fMap = GetFournisseurNomMap();
            var baseNumEmea = GetNextProvisionalBase();
            var listEmea = IncludeAll(_context.Demandes)
                .Where(d => d.Statut == "En attente validation EMEA")
                .OrderBy(d => d.CreatedAt)
                .ToList();
            var demandes = listEmea.Select((d, idx) => MapDemandeEnrichi(d, fMap, $"{baseNumEmea + idx}-1")).ToList();
            return Ok(demandes);
        }

        // ─── PUT /{id}/statut ────────────────────────────────────────────────
        [HttpPut("{id}/statut")]
        [Authorize(Roles = "chef,achat1,achat2,finance,directeur,emea,admin")]
        public IActionResult UpdateStatut(int id, [FromBody] UpdateStatutDto dto)
        {
            var demande = _context.Demandes
               .Include(d => d.Capex)
               .Include(d => d.Details)
               .Include(d => d.Utilisateur!)
                .ThenInclude(u => u.Chef)
            .FirstOrDefault(d => d.Id == id);
            if (demande == null) return NotFound("Demande introuvable");

            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value?.ToLower().Trim();
            if (string.IsNullOrEmpty(roleClaim)) return Unauthorized();

            var action = dto.Action?.ToLower().Trim();
            if (action != "valider" && action != "refuser")
                return BadRequest(new { message = $"Action invalide : '{dto.Action}'. Valeurs attendues : 'valider' ou 'refuser'." });

            //  achat1 doit avoir saisi un prix pour chaque article avant de pouvoir valider
            if (roleClaim == "achat1" && action == "valider" && demande.Details.Any(x => x.Prix == null))
            {
                return BadRequest(new { message = "Merci de saisir un prix pour chaque article (PUT /details) avant de valider." });
            }

            var statutAvant = demande.Statut;
            var userIdClaim = User.FindFirst("id")?.Value;
            int currentUserId = 0;
            if (!string.IsNullOrEmpty(userIdClaim)) int.TryParse(userIdClaim, out currentUserId);

            // Workflow cible complet (6 cas) :
            // - employe : chef(1) -> achat1 -> achat2 -> chef(2) -> finance -> directeur
            // - achat1 : chef(achat2) -> achat1 -> achat2 -> finance -> directeur (pas de 2e chef, isEmployeCreator=false)
            // - chef|achat2|finance|directeur : achat1 -> achat2 -> finance -> directeur (pas de chef, EstExempteChef=true)
            // Les rôles achat2/finance/directeur peuvent valider en tant que chef s'ils sont ChefId du demandeur (estChefDuDemandeur).
            // isSecondChefPassage = true uniquement après que achat1 ET achat2 aient posé leurs dates -> déclenche le 2e passage chef vers finance.
            bool estChefLike = roleClaim is "chef" or "achat2" or "finance" or "directeur" or "emea";
            string? nouveauStatut = null;
            bool estChefDuDemandeur = demande.Utilisateur?.ChefId == currentUserId;
            var roleCreateur = demande.Utilisateur?.Role?.ToLower().Trim();
            bool isEmployeCreator = roleCreateur == "employe";
            // 2e passage chef uniquement pour les demandes créées par un employe (qui a un ChefId)
            bool isSecondChefPassage = demande.DateValidationAchat1 != null && demande.DateValidationAchat2 != null;

            nouveauStatut = (statutAvant, roleClaim, action) switch
            {
                // 1er ou 2e passage chef -> distinction pour la destination
                ("En attente validation chef", var r, "valider") when (r == "chef" || r == "achat2" || r == "finance" || r == "directeur" || r == "emea") && (estChefDuDemandeur || r == "admin" || roleClaim == "admin") && !isSecondChefPassage => "En attente validation achat1",
                ("En attente validation chef", var r, "valider") when (r == "chef" || r == "achat2" || r == "finance" || r == "directeur" || r == "emea") && (estChefDuDemandeur || r == "admin" || roleClaim == "admin") && isSecondChefPassage => "En attente confirmation finance",
                ("En attente validation chef", "admin", "valider") when !isSecondChefPassage => "En attente validation achat1",
                ("En attente validation chef", "admin", "valider") when isSecondChefPassage => "En attente confirmation finance",
                ("En attente validation chef", var r, "refuser") when (r == "chef" || r == "achat2" || r == "finance" || r == "directeur" || r == "emea" || r == "admin") && (estChefDuDemandeur || r == "admin") => "Refusé chef",

                ("En attente validation achat1", "achat1", "valider") => "En attente validation achat2",
                ("En attente validation achat1", "admin", "valider") => "En attente validation achat2",
                ("En attente validation achat1", "achat1", "refuser") => "Refusé achat1",
                ("En attente validation achat1", "admin", "refuser") => "Refusé achat1",

                // achat2 : pour employe -> retour chef (2e validation), sinon -> finance direct
                ("En attente validation achat2", "achat2", "valider") when isEmployeCreator => "En attente validation chef",
                ("En attente validation achat2", "achat2", "valider") when !isEmployeCreator => "En attente confirmation finance",
                ("En attente validation achat2", "admin", "valider") when isEmployeCreator => "En attente validation chef",
                ("En attente validation achat2", "admin", "valider") when !isEmployeCreator => "En attente confirmation finance",
                ("En attente validation achat2", "achat2", "refuser") => "Refusé achat2",
                ("En attente validation achat2", "admin", "refuser") => "Refusé achat2",

                ("En attente confirmation finance", "finance", "valider") => "En attente validation directeur",
                ("En attente confirmation finance", "admin", "valider") => "En attente validation directeur",
                ("En attente confirmation finance", "finance", "refuser") => "Refusé finance",
                ("En attente confirmation finance", "admin", "refuser") => "Refusé finance",

                ("En attente validation directeur", "directeur", "valider") => "En attente insertion SAP",
                ("En attente validation directeur", "admin", "valider") => "En attente insertion SAP",
                ("En attente validation directeur", "directeur", "refuser") => "Refusé directeur",
                ("En attente validation directeur", "admin", "refuser") => "Refusé directeur",

                ("En attente validation EMEA", "emea", "valider") => "Bon de commande",
                ("En attente validation EMEA", "admin", "valider") => "Bon de commande",
                ("En attente validation EMEA", "emea", "refuser") => "Refusé EMEA",
                ("En attente validation EMEA", "admin", "refuser") => "Refusé EMEA",
                _ => null
            };

            if (nouveauStatut == null)
            {
                // Si rôle chef-like tente hors statut chef, message explicite
                if (estChefLike && statutAvant != "En attente validation chef")
                {
                    return BadRequest(new
                    {
                        message = $"Transition impossible : rôle='{roleClaim}', action='{action}', statutActuel='{statutAvant}'. Étape chef uniquement sur 'En attente validation chef'.",
                        statutActuel = statutAvant
                    });
                }
                return BadRequest(new
                {
                    message = $"Transition impossible : rôle='{roleClaim}', action='{action}', statutActuel='{statutAvant}'.",
                    statutActuel = statutAvant
                });
            }

            // Ownership check final pour chef (sécurité)
            if (statutAvant == "En attente validation chef" && estChefLike && roleClaim != "admin" && !estChefDuDemandeur)
            {
                return BadRequest(new { message = "Vous n'êtes pas le chef de ce demandeur.", statutActuel = statutAvant });
            }

            demande.Statut = nouveauStatut;

            if (roleClaim == "achat1" && action == "valider")
                demande.DateValidationAchat1 = DateTime.Now;

            if (roleClaim == "achat2" && action == "valider")
                demande.DateValidationAchat2 = DateTime.Now;

            if (estChefLike && action == "valider" && statutAvant == "En attente validation chef")
                demande.DateValidateChef = DateTime.Now;

            if (roleClaim == "finance" && action == "valider")
                demande.DateValidateFinance = DateTime.Now;

            if (roleClaim == "directeur" && action == "valider")
                demande.DateValidateDirecteur = DateTime.Now;

            if (roleClaim == "emea" && action == "valider")
                demande.DateValidationEMEA = DateTime.Now;

            // Admin pose aussi les dates selon le statut traversé
            if (roleClaim == "admin" && action == "valider")
            {
                switch (statutAvant)
                {
                    case "En attente validation chef": demande.DateValidateChef = DateTime.Now; break;
                    case "En attente validation achat1": demande.DateValidationAchat1 = DateTime.Now; break;
                    case "En attente validation achat2": demande.DateValidationAchat2 = DateTime.Now; break;
                    case "En attente confirmation finance": demande.DateValidateFinance = DateTime.Now; break;
                    case "En attente validation directeur": demande.DateValidateDirecteur = DateTime.Now; break;
                    case "En attente validation EMEA": demande.DateValidationEMEA = DateTime.Now; break;
                }
            }
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

                            if (NotificationsPersistanceActive) _context.Notifications.Add(new Notification
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

                            if (NotificationsPersistanceActive) _context.Notifications.Add(new Notification
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

                        if (NotificationsPersistanceActive) _context.Notifications.Add(new Notification
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

                        if (NotificationsPersistanceActive) _context.Notifications.Add(new Notification
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

                        if (NotificationsPersistanceActive) _context.Notifications.Add(new Notification
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

                case "En attente insertion SAP":
                    {
                        var achat1User = _context.Utilisateurs.FirstOrDefault(u => u.Role == "achat1" && u.Active == true);
                        if (achat1User != null && !string.IsNullOrEmpty(achat1User.Email))
                        {
                            _emailService.SendNotification(achat1User.Email,
                                $"Insertion SAP requise – demande #{id}",
                                $"La demande <b>#{id}</b> a été validée par le directeur et attend l'insertion SAP (fichier + RFX + commentaire).");
                            if (NotificationsPersistanceActive) _context.Notifications.Add(new Notification
                            {
                                DemandeId = id,
                                UtilisateurId = achat1User.Id,
                                Message = $"Demande #{id} en attente insertion SAP",
                                DateEnvoi = DateTime.Now,
                                Demande = demande,
                                Utilisateur = achat1User
                            });
                        }
                    }
                    break;

                case "En attente validation EMEA":
                    {
                        var emeaUser = _context.Utilisateurs.FirstOrDefault(u => u.Role.ToLower() == "emea" && u.Active == true);
                        if (emeaUser != null && !string.IsNullOrEmpty(emeaUser.Email))
                        {
                            _emailService.SendNotification(emeaUser.Email,
                                $"Validation EMEA requise – demande #{id}",
                                $"La demande <b>#{id}</b> a été insérée SAP et attend votre validation. RFX: {demande.RFX}");
                            if (NotificationsPersistanceActive) _context.Notifications.Add(new Notification
                            {
                                DemandeId = id,
                                UtilisateurId = emeaUser.Id,
                                Message = $"Demande #{id} en attente validation EMEA",
                                DateEnvoi = DateTime.Now,
                                Demande = demande,
                                Utilisateur = emeaUser
                            });
                        }
                    }
                    break;

                case "Bon de commande":
                    // Génération automatique des PO lors du passage en Bon de commande via EMEA
                    try { GenererBonsCommande(demande); } catch (Exception ex) { Console.WriteLine($"[ERROR] GenererBonsCommande echoue: {ex.Message}"); }
                    if (demande.Utilisateur != null && !string.IsNullOrEmpty(demande.Utilisateur.Email) && demande.Utilisateur.Active == true)
                    {
                        _emailService.SendNotification(demande.Utilisateur.Email,
                            $"✅ Demande #{id} approuvée",
                            $"Votre demande <b>#{id}</b> a été approuvée par EMEA et est passée en <b>Bon de commande</b>. PO généré(s).");

                        if (NotificationsPersistanceActive) _context.Notifications.Add(new Notification
                        {
                            DemandeId = id,
                            UtilisateurId = demande.UtilisateurId,
                            Message = $"Demande #{id} approuvée - Bon de commande (EMEA)",
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
                case "Refusé EMEA":
                    if (demande.Utilisateur != null && !string.IsNullOrEmpty(demande.Utilisateur.Email) && demande.Utilisateur.Active == true)
                    {
                        _emailService.SendNotification(demande.Utilisateur.Email,
                            $"❌ Demande #{id} refusée",
                            $"Votre demande <b>#{id}</b> a été refusée.<br>Commentaire : {commentaire}");

                        if (NotificationsPersistanceActive) _context.Notifications.Add(new Notification
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

            //  Correctif principal : on ne renvoie plus 200 OK si SaveChanges échoue.
            //  Les notifications ne sont plus ajoutées au ChangeTracker tant que
            //  NotificationsPersistanceActive = false, donc ce SaveChanges ne porte
            //  plus que sur la demande elle-même (statut, dates, commentaire, budget).
            try
            {
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                Console.WriteLine("[ERROR] SaveChanges Statut echoue: " + ex.Message);
                return StatusCode(500, new
                {
                    message = "Erreur lors de la mise à jour du statut, aucune modification n'a été enregistrée.",
                    erreur = ex.InnerException?.Message ?? ex.Message
                });
            }

            return Ok(new
            {
                message = "Statut mis à jour",
                statut = demande.Statut,
                budgetRestant = demande.Capex?.BudgetRestant
            });
        }

        //  Helpers legacy conservés pour compat (avec double chef uniquement pour employe)
        private static string AdminForcerValidation(string statutActuel, bool isFirstChefValidation) => statutActuel switch
        {
            "En attente validation chef" => isFirstChefValidation ? "En attente validation achat1" : "En attente confirmation finance",
            "En attente validation achat1" => "En attente validation achat2",
            "En attente validation achat2" => "En attente validation chef",
            "En attente confirmation finance" => "En attente validation directeur",
            "En attente validation directeur" => "En attente insertion SAP",
            "En attente insertion SAP" => "En attente validation EMEA",
            "En attente validation EMEA" => "Bon de commande",
            _ => statutActuel
        };

        private static string AdminForcerRefus(string statutActuel) => statutActuel switch
        {
            "En attente validation chef" => "Refusé chef",
            "En attente validation achat1" => "Refusé achat1",
            "En attente validation achat2" => "Refusé achat2",
            "En attente confirmation finance" => "Refusé finance",
            "En attente validation directeur" => "Refusé directeur",
            "En attente validation EMEA" => "Refusé EMEA",
            _ => statutActuel
        };

        private void GenererBonsCommande(Demande demande)
        {
            if (demande.BonsCommande.Any()) return; // déjà généré
            var fournisseurs = demande.Details
                .Where(d => d.FournisseurId != null)
                .GroupBy(d => d.FournisseurId)
                .ToList();
            var lastPo = _context.BonCommandes.OrderByDescending(b => b.Id).FirstOrDefault();
            int numeroDemande = 1;
            if (lastPo != null && !string.IsNullOrEmpty(lastPo.Po))
            {
                var lastNumero = int.Parse(lastPo.Po.Split('-')[0]);
                numeroDemande = lastNumero + 1;
            }
            int compteur = 1;
            if (fournisseurs.Count == 0)
            {
                var fallbackFournisseurId = _context.Fournisseurs.Select(f => (int?)f.Id).FirstOrDefault();
                if (fallbackFournisseurId != null)
                {
                    _context.BonCommandes.Add(new BonCommande
                    {
                        DemandeId = demande.Id,
                        Demande = demande,
                        Po = $"{numeroDemande}-{compteur}",
                        DateCreation = DateTime.Now,
                        FournisseurId = fallbackFournisseurId,
                    });
                }
            }
            else
            {
                foreach (var group in fournisseurs)
                {
                    _context.BonCommandes.Add(new BonCommande
                    {
                        DemandeId = demande.Id,
                        Demande = demande,
                        Po = $"{numeroDemande}-{compteur}",
                        DateCreation = DateTime.Now,
                        FournisseurId = group.Key,
                    });
                    compteur++;
                }
            }
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

            var nextPoForDemande = (demande.Statut == "En attente validation EMEA" || demande.Statut == "En attente insertion SAP") ? GetNextProvisionalPo() : null;
            return Ok(MapDemandeEnrichi(demande, null, nextPoForDemande));
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

            try
            {
                _context.SaveChanges();
            }
            catch (Exception ex)
            {
                Console.WriteLine("[ERROR] SaveChanges UpdateDetails echoue: " + ex.Message);
                return StatusCode(500, new
                {
                    message = "Erreur lors de la mise à jour des prix, aucune modification n'a été enregistrée.",
                    erreur = ex.InnerException?.Message ?? ex.Message
                });
            }

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
            try
            {
                if (page < 1) page = 1;
                if (pageSize < 1) pageSize = 10;
                if (pageSize > 100) pageSize = 100;

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

                var fMapH = GetFournisseurNomMap();
                var baseNumH = GetNextProvisionalBase();
                var pageList = query
                    .OrderByDescending(d => d.CreatedAt)
                    .Skip((page - 1) * pageSize)
                    .Take(pageSize)
                    .ToList();
                int idxH = 0;
                var demandes = pageList.Select(d =>
                {
                    string? po = null;
                    if (d.Statut == "En attente validation EMEA" || d.Statut == "En attente insertion SAP")
                    {
                        po = $"{baseNumH + idxH}-1";
                        idxH++;
                    }
                    return MapDemandeEnrichi(d, fMapH, po);
                }).ToList();

                return Ok(new { data = demandes, total, page, pageSize });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ERROR] GetHistorique failed: {ex.Message} | Inner: {ex.InnerException?.Message}");
                return StatusCode(500, new { message = "Erreur lors du chargement de l'historique", erreur = ex.InnerException?.Message ?? ex.Message });
            }
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

            var fMapB = GetFournisseurNomMap();
            var demandes = IncludeAll(_context.Demandes)
                .Include(d => d.Details)
                // ThenInclude Fournisseur désactivé : [NotMapped]
                .Where(d =>
                    d.UtilisateurId == userId &&
                    d.Statut == "Bon de commande")
                .OrderBy(d => d.CreatedAt)
                .ToList()
                .Select(d => MapDemandeEnrichi(d, fMapB, null))
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
        // ─── POST /{id}/insert-sap — Achat1 insère fichier SAP + RFX + commentaire ──
        [HttpPost("{id}/insert-sap")]
        [Authorize(Roles = "achat1,admin")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> InsertSap(int id, [FromForm] IFormFile file, [FromForm] string rfx, [FromForm] string commentaire)
        {
            if (file == null || file.Length == 0) return BadRequest(new { message = "Fichier SAP manquant." });
            if (string.IsNullOrWhiteSpace(rfx)) return BadRequest(new { message = "RFX obligatoire." });
            if (string.IsNullOrWhiteSpace(commentaire)) return BadRequest(new { message = "Commentaire obligatoire." });

            var demande = _context.Demandes
                .Include(d => d.Details)
                .FirstOrDefault(d => d.Id == id);
            if (demande == null) return NotFound("Demande introuvable");
            if (demande.Statut != "En attente insertion SAP")
                return BadRequest(new { message = $"Statut invalide: {demande.Statut}. Attendu: En attente insertion SAP" });

            var folder = Path.Combine("wwwroot", "uploads", "sap");
            Directory.CreateDirectory(folder);
            // Nom fichier basé sur RFX ou Po provisoire
            var ext = Path.GetExtension(file.FileName);
            var fileName = $"sap_{id}_{Guid.NewGuid()}{ext}";
            var path = Path.Combine(folder, fileName);
            using var stream = new FileStream(path, FileMode.Create);
            await file.CopyToAsync(stream);

            var chemin = $"/uploads/sap/{fileName}";
            demande.CheminSAP = chemin;
            demande.RFX = rfx.Trim();
            demande.CommentaireSAP = commentaire.Trim();
            demande.Commentaire = commentaire.Trim(); // compat
            demande.DateInsertionSAP = DateTime.Now;
            demande.Statut = "En attente validation EMEA";
            demande.UpdatedAt = DateTime.Now;

            // Email EMEA
            var emeaUser = _context.Utilisateurs.FirstOrDefault(u => u.Role.ToLower() == "emea" && u.Active == true);
            if (emeaUser != null && !string.IsNullOrEmpty(emeaUser.Email))
            {
                _emailService.SendNotification(emeaUser.Email,
                    $"Nouvelle demande #{id} - validation EMEA requise",
                    $"La demande <b>#{id}</b> a été insérée SAP (RFX: {rfx}) et attend votre validation.<br>Commentaire achat1: {System.Net.WebUtility.HtmlEncode(commentaire)}");
            }

            _context.SaveChanges();
            return Ok(new { message = "Insertion SAP réussie", statut = demande.Statut, cheminSAP = chemin, rfx = demande.RFX });
        }

        [HttpPost("{id}/upload-devis")]
        [Authorize(Roles = "achat1,achat2,admin")]
        public async Task<IActionResult> UploadDevis(int id, IFormFile file, [FromQuery] int slot = 1)
        {
            if (slot < 1 || slot > 3) return BadRequest(new { message = "Slot invalide. Valeurs attendues : 1, 2 ou 3." });
            if (file == null || file.Length == 0) return BadRequest(new { message = "Fichier manquant." });

            var demande = await _context.Demandes.FindAsync(id);
            if (demande == null) return NotFound();

            var folder = Path.Combine("wwwroot", "uploads", "devis");
            Directory.CreateDirectory(folder);

            var fileName = $"demande_{id}_devis{slot}_{Guid.NewGuid()}_{file.FileName}";
            var path = Path.Combine(folder, fileName);

            using var stream = new FileStream(path, FileMode.Create);
            await file.CopyToAsync(stream);

            var chemin = $"/uploads/devis/{fileName}";
            if (slot == 1) demande.CheminDevis = chemin;
            else if (slot == 2) demande.CheminDevis2 = chemin;
            else demande.CheminDevis3 = chemin;

            await _context.SaveChangesAsync();

            return Ok(new { chemin, slot });
        }

        // ─── POST /{id}/request-info — Demander des infos complémentaires ───────
        [HttpPost("{id}/request-info")]
        [Authorize(Roles = "chef,achat1,achat2,finance,directeur,emea,admin")]
        public IActionResult RequestInfo(int id, [FromBody] RequestInfoDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Message))
                return BadRequest(new { message = "Le message est requis." });

            var demande = _context.Demandes
                .Include(d => d.Utilisateur)
                .FirstOrDefault(d => d.Id == id);
            if (demande == null) return NotFound("Demande introuvable");

            if (demande.Statut == "En attente informations complémentaires")
                return BadRequest(new { message = "Une demande d'informations est déjà en cours." });

            var roleClaim = User.FindFirst(ClaimTypes.Role)?.Value?.ToLower().Trim() ?? "";
            var userIdClaim = User.FindFirst("id")?.Value;
            int currentUserId = 0;
            if (!string.IsNullOrEmpty(userIdClaim)) int.TryParse(userIdClaim, out currentUserId);

            // Autorisation par statut
            bool allowed = (demande.Statut, roleClaim) switch
            {
                ("En attente validation chef", var r) when r is "chef" or "achat2" or "finance" or "directeur" or "emea" or "admin" => true,
                ("En attente validation achat1", "achat1") => true,
                ("En attente validation achat1", "admin") => true,
                ("En attente validation achat2", "achat2") => true,
                ("En attente validation achat2", "admin") => true,
                ("En attente confirmation finance", "finance") => true,
                ("En attente confirmation finance", "admin") => true,
                ("En attente validation directeur", "directeur") => true,
                ("En attente validation directeur", "admin") => true,
                ("En attente validation EMEA", "emea") => true,
                ("En attente validation EMEA", "admin") => true,
                ("En attente insertion SAP", "achat1") => true,
                ("En attente insertion SAP", "admin") => true,
                _ => false
            };
            if (!allowed)
                return BadRequest(new { message = $"Vous n'êtes pas autorisé à demander des infos sur le statut '{demande.Statut}' avec le rôle '{roleClaim}'." });

            // Si chef-like, vérifier ownership pour statut chef
            if (demande.Statut == "En attente validation chef" && roleClaim != "admin" && demande.Utilisateur?.ChefId != currentUserId)
                return BadRequest(new { message = "Vous n'êtes pas le chef de ce demandeur." });

            demande.StatutAvantInfo = demande.Statut;
            demande.InfoMessage = dto.Message.Trim();
            demande.InfoDemandeParRole = roleClaim;
            demande.InfoDemandeParUserId = currentUserId == 0 ? null : currentUserId;
            demande.InfoDemandeDate = DateTime.Now;
            demande.InfoReponse = null;
            demande.InfoReponseDate = null;
            demande.Statut = "En attente informations complémentaires";
            demande.UpdatedAt = DateTime.Now;

            // Email au demandeur
            if (demande.Utilisateur != null && !string.IsNullOrEmpty(demande.Utilisateur.Email) && demande.Utilisateur.Active == true)
            {
                _emailService.SendNotification(demande.Utilisateur.Email,
                    $"ℹ️ Informations complémentaires requises — Demande #{id}",
                    $"Le valideur <b>{roleClaim}</b> demande des informations complémentaires pour votre demande <b>#{id}</b> :<br><blockquote>{System.Net.WebUtility.HtmlEncode(dto.Message)}</blockquote>Veuillez répondre depuis l'historique de vos demandes.");
            }

            _context.SaveChanges();
            return Ok(new { message = "Demande d'informations envoyée", statut = demande.Statut, infoMessage = demande.InfoMessage });
        }

        // ─── POST /{id}/respond-info — Répondre à la demande d'infos ──────────
        [HttpPost("{id}/respond-info")]
        [Authorize]
        public IActionResult RespondInfo(int id, [FromBody] RespondInfoDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Reponse))
                return BadRequest(new { message = "La réponse est requise." });

            var demande = _context.Demandes
                .Include(d => d.Utilisateur)
                .FirstOrDefault(d => d.Id == id);
            if (demande == null) return NotFound("Demande introuvable");

            if (demande.Statut != "En attente informations complémentaires")
                return BadRequest(new { message = "La demande n'est pas en attente d'informations." });

            var userIdClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();
            int currentUserId = int.Parse(userIdClaim);
            if (demande.UtilisateurId != currentUserId)
                return Forbid();

            demande.InfoReponse = dto.Reponse.Trim();
            demande.InfoReponseDate = DateTime.Now;
            demande.UpdatedAt = DateTime.Now;

            // Restaurer le statut précédent
            var statutRestaure = string.IsNullOrEmpty(demande.StatutAvantInfo) ? "En attente validation chef" : demande.StatutAvantInfo!;
            demande.Statut = statutRestaure;
            demande.StatutAvantInfo = null;

            // Notifier le valideur qui a demandé l'info
            if (demande.InfoDemandeParUserId.HasValue)
            {
                var valideur = _context.Utilisateurs.FirstOrDefault(u => u.Id == demande.InfoDemandeParUserId.Value);
                if (valideur != null && !string.IsNullOrEmpty(valideur.Email) && valideur.Active == true)
                {
                    _emailService.SendNotification(valideur.Email,
                        $"✅ Réponse reçue — Demande #{id}",
                        $"Le demandeur <b>{demande.Utilisateur?.Nom}</b> a répondu à votre demande d'informations pour la demande <b>#{id}</b> :<br><blockquote>{System.Net.WebUtility.HtmlEncode(dto.Reponse)}</blockquote>La demande est repassée en <b>{statutRestaure}</b>.");
                }
            }

            _context.SaveChanges();
            return Ok(new { message = "Réponse envoyée", statut = demande.Statut });
        }

        // ─── GET /mes-demandes — demandes du user connecté (pour affichage info) ─
        [HttpGet("mes-demandes")]
        [Authorize]
        public IActionResult GetMesDemandes()
        {
            var userIdClaim = User.FindFirst("id")?.Value;
            if (string.IsNullOrEmpty(userIdClaim)) return Unauthorized();
            int userId = int.Parse(userIdClaim);
            var fMapM = GetFournisseurNomMap();
            var baseNumM = GetNextProvisionalBase();
            var listM = IncludeAll(_context.Demandes)
                .Where(d => d.UtilisateurId == userId)
                .OrderByDescending(d => d.CreatedAt)
                .ToList();
            int idxM = 0;
            var demandes = listM.Select(d =>
            {
                string? po = null;
                if (d.Statut == "En attente validation EMEA" || d.Statut == "En attente insertion SAP")
                {
                    po = $"{baseNumM + idxM}-1";
                    idxM++;
                }
                return MapDemandeEnrichi(d, fMapM, po);
            }).ToList();
            return Ok(demandes);
        }

    }


}
