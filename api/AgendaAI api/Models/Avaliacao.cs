using System.ComponentModel.DataAnnotations;

namespace AgendaAi.Models
{
    public class Avaliacao
    {
        [Key]
        public int Id { get; set; }
        public int AgendamentoId { get; set; }
        public Agendamento? Agendamento { get; set; }
        public int Nota { get; set; }
        public DateTime DataAvaliacao { get; set; }
        public string? Comentario { get; set; }
    }
}
