using AgendaAi.Models;
using AgendaAi.ViewModels;
using System.Text;
using System.Text.Json;

namespace AgendaAi.Services
{
    public class AuthService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly TokenStorage _tokenStorage;

        public AuthService(HttpClient httpClient, IConfiguration configuration, TokenStorage tokenStorage)
        {
            _httpClient = httpClient;
            _configuration = configuration;
            _tokenStorage = tokenStorage;
        }

        public async Task RefreshTokenAsync()
        {
            var loginData = new
            {
                email = _configuration["BixApi:Email"],
                password = _configuration["BixApi:Password"],
                mac = "docs",
                source = "api_externa"
            };

            try
            {
                var content = new StringContent(JsonSerializer.Serialize(loginData), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync("https://dev.bixs.com.br/v1/auth/login", content);

                if (response.IsSuccessStatusCode)
                {
                    var json = await response.Content.ReadAsStringAsync();
                    using var doc = JsonDocument.Parse(json);

                    // Ajuste o caminho "token" conforme o retorno real da sua API
                    if (doc.RootElement.TryGetProperty("token", out var tokenProp))
                    {
                        _tokenStorage.Token = tokenProp.GetString();
                        _tokenStorage.LastUpdated = DateTime.Now;
                    }
                }
            }
            catch (Exception ex)
            {
                ErroRegistro.LogError($"Erro ao chamar RefreshTokenAsync: {ex}");
            }
        }
    }
}
