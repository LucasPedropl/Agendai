namespace AgendaAi.ViewModels
{
    public class AgendaView
    {
        public int Id { get; set; }
        public DateTime DataAgendamento { get; set; }
        public string? ServicoNome { get; set; }
        public string? ProfissionalNome { get; set; }
        public string? Status { get; set; }
    }
    public class AgendaHistoricoView
    {
        public DateTime DataAgendamento { get; set; }
        public string? ServicoNome { get; set; }
        public string? Status { get; set; }
        public decimal Valor { get; set; }
    }
    public class AgendamentoView
    {
        public required string IdProssional { get; set; }
        public required string IdUsuario { get; set; }
        public DateTime Data { get; set; }
        public TimeSpan Horario { get; set; }
        public int IdServico { get; set; }
    }
    public class AgendamentoData 
    {
        public int comercioId { get; set; }
        public required string profissionalId { get; set; }
        public int servicoId { get; set; }
        public int mes { get; set; }
        public int ano { get; set; }
    }
    public class AgendamentoHorario
    {
        public int comercioId { get; set; }
        public required string profissionalId { get; set; }
        public int servicoId { get; set; }
        public DateTime dataEscolhida { get; set; }
    }
}
