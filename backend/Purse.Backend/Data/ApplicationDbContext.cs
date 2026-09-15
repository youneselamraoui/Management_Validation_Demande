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


            // Stcapx

            modelBuilder.Entity<ActiveUser>()
           .ToView("vw_ActiveUsers")
           .HasKey(u => u.Id);
            // Notification → Demande : pas de cascade
            modelBuilder.Entity<Notification>()
                .HasOne(n => n.Demande)
                .WithMany(d => d.Notifications)
                .HasForeignKey(n => n.DemandeId)
                .OnDelete(DeleteBehavior.NoAction);

            // TransactionCapex → Demande : pas de cascade
            modelBuilder.Entity<TransactionCapex>()
                .HasOne(t => t.Demande)
                .WithMany(d => d.Transactions)
                .HasForeignKey(t => t.DemandeId)
                .OnDelete(DeleteBehavior.NoAction);

            // TransactionCapex → Capex : cascade ok
            modelBuilder.Entity<TransactionCapex>()
                .HasOne(t => t.Capex)
                .WithMany(c => c.Transactions)
                .HasForeignKey(t => t.CapexId)
                .OnDelete(DeleteBehavior.Cascade);

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
        }
    }
}