using Microsoft.AspNetCore.Identity;

namespace AgendaAi.Models
{
    public class Usuario : IdentityUser
    {
        public string? LastName { get; set; }
        public required string CPF { get; set; }
        public DateTime DateBirth { get; set; }
        public bool Status { get; set; }
        public DateTime DateCreate { get; set; }
        public List<UsuarioEmpresa>? UsuariosEmpresas { get; set; } = null;
        public List<Agendamento>? AgendamentosCliente { get; set; } = null;
        public List<Agendamento>? AgendamentosProfissional { get; set; } = null;
        public ConfigUsuario? ConfigUsuario { get; set; }

    }
    public enum TipoPermissao
    {
        Cliente = 0,
        Profissional = 1,
        Admin = 2
    }
    public class UsuarioEmpresa     {
        public required string UsuarioId { get; set; }
        public Usuario? Usuario { get; set; }
        public int ComercioId { get; set; }
        public Comercio? Comercio { get; set; }
        public int? HorarioId { get; set; }
        public HorarioAtendimento? HorarioAtendimento { get; set; }
        public bool Status { get; set; }
        public bool Favorito { get; set; }= false;
        public TipoPermissao TipoPermissao { get; set; } = TipoPermissao.Cliente;
    }
    public class ConfigUsuario
    {
        public int Id { get; set; }
        public required string UsuarioId { get; set; }
        public Usuario? Usuario { get; set; }
        public bool NotificaAgendamento { get; set; } = false;
        public bool NotificaPromo { get; set; } = false;
        public bool NotificaDiaAgendado { get; set; } = true;
    }
}
