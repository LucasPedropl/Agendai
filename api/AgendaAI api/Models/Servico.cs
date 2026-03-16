namespace AgendaAi.Models
{
    public class Servico
    {
        public int Id { get; set; }
        public int ComercioId { get; set; }
        public Comercio? Comercio { get; set; }
        public string Categoria { get; set; } = string.Empty;
        public string Icone { get; set; } = string.Empty;
        public string? Nome { get; set; }
        public string? Descricao { get; set; }
        public decimal Preco { get; set; }
        public TimeSpan Duracao { get; set; }
        public bool Ativo { get; set; }
        public ICollection<Agendamento>? Agendamentos { get; set; }
    }
}
