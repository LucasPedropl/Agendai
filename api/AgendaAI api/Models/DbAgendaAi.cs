using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;

namespace AgendaAi.Models
{
    public class DbAgendaAi : IdentityDbContext<Usuario>
    {
        public DbAgendaAi(DbContextOptions<DbAgendaAi> options)
           : base(options)
        {
        }
        public DbSet<Endereco> Enderecos { get; set; }
        public DbSet<Comercio> Comercios { get; set; }
        public DbSet<Servico> Servicos { get; set; }
        public DbSet<HorarioAtendimento> HorariosAtendimento { get; set; }
        public DbSet<ConfigComercio> ConfiguracoesComercio { get; set; }
        public DbSet<DiaFechado> DiasFechados { get; set; }
        public DbSet<UsuarioEmpresa> UsuariosEmpresas { get; set; }
        public DbSet<Agendamento> Agendamentos { get; set; }
        public DbSet<Avaliacao> Avaliacoes { get; set; }
        public DbSet<ConfigUsuario> ConfigUsuarios { get; set; }
        public DbSet<WhatsApp> WhatsApps { get; set; }
        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Garante que não duplique horário para o mesmo dia/estabelecimento/profissional
            modelBuilder.Entity<HorarioAtendimento>()
                .HasIndex(oh => new { oh.ComercioId, oh.Dias })
                .IsUnique();
            modelBuilder.Entity<HorarioAtendimento>()
                .Property(e => e.Dias)
                .HasConversion(
                    v => string.Join(',', v), // Converte List para String ao salvar: "1,2,3"
                    v => v.Split(',', StringSplitOptions.RemoveEmptyEntries)
                          .Select(d => (DayOfWeek)Enum.Parse(typeof(DayOfWeek), d))
                          .ToList() // Converte String para List ao ler
                );
            // Relacionamento Config -> BlockedDates
            modelBuilder.Entity<ConfigComercio>()
                .HasMany(c => c.DiasFechados)
                .WithOne()
                .HasForeignKey(b => b.ConfigComercioId)
                .OnDelete(DeleteBehavior.Cascade);

            base.OnModelCreating(modelBuilder);

            
            modelBuilder.Entity<UsuarioEmpresa>(entity =>
            {
                entity.HasKey(ee => new { ee.UsuarioId, ee.ComercioId });

                entity.HasOne(ee => ee.HorarioAtendimento)
                  .WithMany(e => e.UsuariosEmpresas)
                  .HasForeignKey(ee => ee.HorarioId)
                  .IsRequired(false) // Permite que seja NULL no banco
                  .OnDelete(DeleteBehavior.ClientSetNull);
                
                entity.HasOne(ee => ee.Usuario)
                      .WithMany(e => e.UsuariosEmpresas)
                      .HasForeignKey(ee => ee.UsuarioId)
                      .OnDelete(DeleteBehavior.NoAction);

                entity.HasOne(ee => ee.Comercio)
                      .WithMany(e => e.UsuariosEmpresas)
                      .HasForeignKey(ee => ee.ComercioId)
                      .OnDelete(DeleteBehavior.NoAction);
            });
            modelBuilder.Entity<Agendamento>(entity =>
            {
                entity.HasOne(ee => ee.Usuario)
                      .WithMany(e => e.AgendamentosCliente)
                      .HasForeignKey(ee => ee.UsuarioId)
                      .OnDelete(DeleteBehavior.NoAction);
                
                entity.HasOne(ee => ee.Profissional)
                      .WithMany(e => e.AgendamentosProfissional)
                      .HasForeignKey(ee => ee.ProfissionalId)
                      .OnDelete(DeleteBehavior.NoAction);
            });

        }
    }
}
