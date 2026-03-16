using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace AgendaAi.Models
{
    public class HorarioAtendimento
    {
        [Key]
        public int Id { get; set; }
        public int ComercioId { get; set; }
        // Dias da semana ativos (ex: [0, 1, 2, 3, 4, 5, 6] onde 0 = Domingo)
        [Range(0, 6)]
        public List<DayOfWeek> Dias { get; set; } = new();
        [Column(TypeName = "time")]
        public TimeSpan HoraInicio { get; set; }
        [Column(TypeName = "time")]
        public TimeSpan HoraFim { get; set; }
        public bool Intervalo { get; set; }
        [Column(TypeName = "time")]
        public TimeSpan? InicioIntervalo { get; set; }
        [Column(TypeName = "time")]
        public TimeSpan? FimIntervalo { get; set; }
        public ICollection<UsuarioEmpresa>? UsuariosEmpresas { get; set; }
    }

    public class DiaFechado
    {
        [Key]
        public int Id { get; set; }
        public int ConfigComercioId { get; set; }
        [Column(TypeName = "date")]
        public DateTime Data { get; set; }
        public string? Descricao { get; set; }
    }
}
