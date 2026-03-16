namespace AgendaAi.ViewModels
{
    public class TokenStorage
    {
        public string Token { get; set; } = string.Empty;
        public DateTime LastUpdated { get; set; }
        public bool IsValid => !string.IsNullOrEmpty(Token);
    }
}
