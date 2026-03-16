namespace AgendaAi.ViewModels
{
    public class AvaliacaoView
    {
        public int Id { get; set; }
        public int Nota { get; set; }
        public string Comentario { get; set; } = string.Empty;
        public DateTime DataServico { get; set; }
        public string Servico { get; set; } = string.Empty;
        public string Profissional { get; set; } = string.Empty;
    }
}
