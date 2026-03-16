using System.ComponentModel.DataAnnotations;

namespace AgendaAi.Models
{
    public class Agendamento
    {
        public int Id { get; set; }
        public int ServicoId { get; set; }
        public Servico? Servico { get; set; }
        public required string UsuarioId { get; set; }
        public Usuario? Usuario { get; set; }
        public required string ProfissionalId { get; set; }
        public Usuario? Profissional { get; set; }
        [Required]
        public AppointmentStatus Status { get; set; } 
        public DateTime DataAgendamento { get; set; }
        public TimeSpan HoraAgendamento { get; set; }
        public DateTime DataCriacao { get; set; }
        public virtual Avaliacao? Avaliacao { get; set; }

    }
    public enum AppointmentStatus
    {
        Pendente = 0,     // Pendente de aprovação (se configurado)
        Confirmado = 1,   // Confirmado/Agendado
        Finalizado = 2,   // Serviço realizado
        Cancelado = 3,    // Cancelado pelo cliente ou loja
        NaoCompareceu = 4       // Cliente não compareceu
    }
}
