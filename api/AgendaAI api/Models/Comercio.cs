using System.ComponentModel.DataAnnotations;

namespace AgendaAi.Models
{
    public class Comercio
    {
        [Key]
        public int Id { get; set; }
        public string? Nome { get; set; }
        public string? Endereco { get; set; }
        public string? Telefone { get; set; }
        public string? CNPJ { get; set; }
        public string? Email { get; set; }
        public bool NotificarAgendamento { get; set; }
        public bool LembrarAgendamento { get; set; }
        public bool ResumoDiario { get; set; }
        public virtual ICollection<Servico>? Servicos { get; set; }
        public ICollection<HorarioAtendimento>? HorarioAtendimento { get; set; }
        public ConfigComercio? Configuracao { get; set; }
        public virtual ICollection<UsuarioEmpresa>? UsuariosEmpresas { get; set; }
        public virtual WhatsApp? WhatsApp { get; set; }
    }
}
