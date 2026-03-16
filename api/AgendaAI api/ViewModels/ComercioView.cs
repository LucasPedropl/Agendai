using AgendaAi.Models;

namespace AgendaAi.ViewModels
{
    public class ComercioView
    {
        public int Id { get; set; }
        public string? Nome { get; set; }
        public string? Endereco { get; set; }
        public int TotalAvalicoes { get; set; }
        public double MediaAvalicoes { get; set; }
        public string? Atendimento { get; set; }
    }
    public class ComercioConfg
    {
        public int id { get; set; }
        public string? nome { get; set; }
        public string? endereco { get; set; }
        public string? telefone { get; set; }
        public TimeSpan HoraEntradaUtil { get; set; }
        public TimeSpan HoraSaidaUtil { get; set; }
        public TimeSpan HoraEntradaFimDeSem { get; set; }
        public TimeSpan HoraSaidaFimDeSem { get; set; }
        public bool NotificarAgendamento { get; set; }
        public bool LembrarAgendamento { get; set; }
        public bool ResumoDiario { get; set; }
    }
    public class ComercioClientes
    {
        public string? Nome { get; set; }
        public string? Telefone { get; set; }
        public DateTime? UltimaVisita { get; set; }
    }
    public class ComercioConfiguracao
    {
        public HorarioAtendimento? HorarioAtendimento { get; set; }
        public ConfigComercio? Configuracao { get; set; }
        public List<UsuarioEmpresa>? Funcionarios { get; set; }
    }
}
