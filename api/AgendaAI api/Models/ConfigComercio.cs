using System.ComponentModel.DataAnnotations;

namespace AgendaAi.Models
{
    public class ConfigComercio
    {
        [Key]
        public int Id { get; set; }
        public int ComercioId { get; set; }
        public int AntecedenciaMin { get; set; } = 1;//horas
        public int LimiteAgendar { get; set; }
        public bool ConfirmaAuto { get; set; } = false;
        public int TempoDuracaoPadrao { get; set; }
        public int TempoCancelamento { get; set; } = 24;//horas
        public bool Reagendar { get; set; } = true;
        public int TempoIntervalo { get; set; }=0;
        public int AgendaSimultanea { get; set; }= 1;
        public bool HorarioPorProfissional { get; set; }
        public bool FechaFeriadosNacionais { get; set; } = false;
        public bool FechaFeriadosMunicipais { get; set; } = false;
        public List<DiaFechado> DiasFechados { get; set; } = new();
    }
}
