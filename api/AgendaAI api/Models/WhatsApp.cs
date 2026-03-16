using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace AgendaAi.Models
{
    public class WhatsApp
    {
        [Key]
        [JsonPropertyName("id")]
        public int Id { get; set; }
        public string? sessao { get; set; }
        public required string status { get; set; }
        public required string ntelefone { get; set; }
        public string? qrCode { get; set; }
        public DateTime criado { get; set; }
        public DateTime atualizado { get; set; }
        [ForeignKey("Comercio")]
        public int comercioId { get; set; }
        public virtual Comercio? Comercio { get; set; }
    }
}
