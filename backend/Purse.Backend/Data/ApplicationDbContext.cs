using Microsoft.EntityFrameworkCore;
using Purse.Backend.Models;

namespace Purse.Backend.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options) { }

        public DbSet<Utilisateur> Utilisateurs { get; set; }
        public DbSet<Departement> Departements { get; set; }
        public DbSet<Demande> Demandes { get; set; }
        public DbSet<Capex> Capexes { get; set; }
        public DbSet<Notification> Notifications { get; set; }
        public DbSet<BonCommande> BonCommandes { get; set; }
        public DbSet<DetailsDemande> DetailsDemandes { get; set; }
        public DbSet<Fournisseur> Fournisseurs { get; set; }
        public DbSet<TransactionCapex> TransactionCapex { get; set; }
        public DbSet<TauxChange> TauxChanges { get; set; }

        public DbSet<ActiveUser> ActiveUsers { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // ------------------------
            // Relations sécurisées
            // ------------------------


            modelBuilder.Entity<ActiveUser>()
           .ToView("vw_ActiveUsers")
           .HasKey(u => u.Id);

    
            modelBuilder.Entity<Notification>(eb =>
            {
                eb.HasOne(n => n.Demande)
                  .WithMany() // pas de WithMany vers Demande.Notifications (NotMapped)
                  .HasForeignKey(n => n.DemandeId)
                  .OnDelete(DeleteBehavior.NoAction);
                eb.Ignore(n => n.Utilisateur);
                eb.Ignore(n => n.UtilisateurId);
                eb.Ignore(n => n.User2);
            });

            modelBuilder.Entity<TransactionCapex>(eb =>
            {
                eb.Ignore(t => t.Demande);
                eb.Ignore(t => t.Capex);
            });

            // BonCommande → Demande : pas de cascade
            modelBuilder.Entity<BonCommande>()
                .HasOne(b => b.Demande)
                .WithMany(d => d.BonsCommande)
                .HasForeignKey(b => b.DemandeId)
                .OnDelete(DeleteBehavior.NoAction);

            // DetailsDemande → Demande : pas de cascade
            modelBuilder.Entity<DetailsDemande>()
                .HasOne(d => d.Demande)
                .WithMany(dem => dem.Details)
                .HasForeignKey(d => d.DemandeId)
                .OnDelete(DeleteBehavior.NoAction);


            // Utilisateur → Chef (auto référence) : pas de cascade
            modelBuilder.Entity<Utilisateur>()
                .HasOne(u => u.Chef)
                .WithMany()
                .HasForeignKey(u => u.ChefId)
                .OnDelete(DeleteBehavior.NoAction);

            // Utilisateur → Departement : cascade ok
            modelBuilder.Entity<Utilisateur>()
                .HasOne(u => u.Departement)
                .WithMany(d => d.Utilisateurs)
                .HasForeignKey(u => u.DepartementId)
                .OnDelete(DeleteBehavior.Cascade);

            // Demande → Capex : cascade ok
            modelBuilder.Entity<Demande>()
                .HasOne(d => d.Capex)
                .WithMany(c => c.Demandes)
                .HasForeignKey(d => d.CapexId)
                .OnDelete(DeleteBehavior.Cascade);

            // Demande → Utilisateur : cascade ok
            modelBuilder.Entity<Demande>()
                .HasOne(d => d.Utilisateur)
                .WithMany()
                .HasForeignKey(d => d.UtilisateurId)
                .OnDelete(DeleteBehavior.Cascade);

            // Ignorer explicitement les propriétés [NotMapped] pour éviter que EF ne tente de mapper des colonnes absentes
            modelBuilder.Entity<Demande>().Ignore(d => d.Transactions);
            modelBuilder.Entity<Demande>().Ignore(d => d.Notifications);
            modelBuilder.Entity<Demande>().Ignore(d => d.CheminSAP);
            modelBuilder.Entity<Demande>().Ignore(d => d.CheminFinance);
            modelBuilder.Entity<Demande>().Ignore(d => d.sta1);
            modelBuilder.Entity<Demande>().Ignore(d => d.sta2);
            modelBuilder.Entity<Demande>().Ignore(d => d.stc);
            modelBuilder.Entity<Demande>().Ignore(d => d.stf);
            modelBuilder.Entity<Demande>().Ignore(d => d.std);
            modelBuilder.Entity<Demande>().Ignore(d => d.stu);
            modelBuilder.Entity<Demande>().Ignore(d => d.stp);

            modelBuilder.Entity<Utilisateur>().Ignore(u => u.DoitChangerMotDePasse);
            modelBuilder.Entity<Utilisateur>().Ignore(u => u.EmailChef);
            modelBuilder.Entity<Utilisateur>().Ignore(u => u.NomChef);

            modelBuilder.Entity<Capex>().Ignore(c => c.Transactions);
            modelBuilder.Entity<Capex>().Ignore(c => c.Devis);

            modelBuilder.Entity<Fournisseur>().Ignore(f => f.Contact);
            modelBuilder.Entity<Fournisseur>().Ignore(f => f.Adresse);
            modelBuilder.Entity<Fournisseur>().Ignore(f => f.Tel);
            modelBuilder.Entity<Fournisseur>().Ignore(f => f.Active);

            // FournisseurId maintenant mappé (nvarchar) -> ne plus Ignorer, Fournisseur navigation reste NotMapped
            // Conversion int? <-> string pour dbo.DetailsDemandes.FournisseurId nvarchar(max)
            modelBuilder.Entity<DetailsDemande>().Ignore(d => d.Fournisseur);
            modelBuilder.Entity<DetailsDemande>().Property(d => d.FournisseurId)
                .HasColumnType("nvarchar(max)")
                .HasConversion(
                    v => v == null ? null : v.ToString(),
                    v => string.IsNullOrEmpty(v) ? null : int.Parse(v));

            modelBuilder.Entity<BonCommande>().Ignore(b => b.DelaiPaiement);

            // Détails supplémentaires : éviter erreurs si tables TauxChanges/TransactionCapex absentes
            // Elles restent mappées mais ne bloquent pas le démarrage si absentes (requêtes échoueront -> catch côté controller)
        }
    }
}