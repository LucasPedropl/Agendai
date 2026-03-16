namespace AgendaAi.ViewModels
{
    public class WhatsMessage
    {
        public string? audio_url { get; set; }
        public string? document_url { get; set; }
        public string? image_url { get; set; }
        public int instance_id { get; set; }
        public string? message { get; set; }
        public string? to { get; set; }
        public string? to_name { get; set; }
        public string? video_url { get; set; }
    }
    public class MensagemWhatsResponse
    {
        public bool success { get; set; }
        public string? message { get; set; }
    }
    public class WhatsAppView
    {
        public int id { get; set; }
        public string? name { get; set; }
        public string? status { get; set; }
        public string? phone_number { get; set; }
        public DateTime created_at { get; set; }
        public DateTime updated_at { get; set; }
    }
}
