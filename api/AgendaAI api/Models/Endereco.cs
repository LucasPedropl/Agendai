using System.ComponentModel.DataAnnotations;

namespace AgendaAi.Models
{
    public class Endereco
    {
        [Key]
        public int Id { get; set; }
        public string? Rua { get; set; }
        public string? Cidade { get; set; }
        public string? Estado { get; set; }
        public string? Cep { get; set; }
        public string? Referencia { get; set; }
    }
    public class EnderecoComercio
    {
        public int ComercioId { get; set; }
        public Comercio? Comercio { get; set; }
        public int EnderecoId { get; set; }
        public Endereco? Endereco { get; set; }
    }
}
