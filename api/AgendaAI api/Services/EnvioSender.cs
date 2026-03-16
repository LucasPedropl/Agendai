using AgendaAi.Models;
using AgendaAi.ViewModels;
using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Http.Headers;
using System.Net.Mail;
using System.Text;
using System.Text.Json;

namespace AgendaAi.Services
{
    public class EnvioSender : IEnvioSender
    {
        private readonly EmailSettings _emailSettings;
        private readonly TokenStorage _tokenStorage;
        private readonly HttpClient _httpClient;

        public EnvioSender(IOptions<EmailSettings> emailSettings, TokenStorage tokenStorage, HttpClient httpClient)
        {
            _emailSettings = emailSettings.Value;
            _tokenStorage = tokenStorage;
            _httpClient = httpClient;
        }
        public Task SendEmailAsync(string email, string subject, string message)
        {
            // Cria o cliente SMTP com as configurações definidas
            var client = new SmtpClient(_emailSettings.SmtpServer, _emailSettings.Port)
            {
                Credentials = new NetworkCredential(_emailSettings.Username, _emailSettings.Password),
                EnableSsl = false // Essencial para a maioria dos servidores SMTP hoje em dia
            };

            // Cria a mensagem de e-mail
            var mailMessage = new MailMessage
            {
                From = new MailAddress(_emailSettings.SenderEmail, _emailSettings.SenderName),
                Subject = subject,
                Body = message,
                IsBodyHtml = true // Permite que você envie HTML no corpo do e-mail
            };
            mailMessage.To.Add(email);

            // Envia o e-mail de forma assíncrona
            return client.SendMailAsync(mailMessage);
        }
        public async Task<bool> SendWhatsAsync(WhatsMessage whatsMessage)
        {
            try
            {
                var jsonContent = JsonSerializer.Serialize(whatsMessage);
                var content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
                _httpClient.BaseAddress = new Uri("https://dev.bixs.com.br/v1/api/message/");
                _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _tokenStorage.Token);
                _httpClient.DefaultRequestHeaders.Accept.Clear();
                _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                HttpResponseMessage response = await _httpClient.PostAsync($"messages/send", content);

                if (response.IsSuccessStatusCode)
                {
                    var responseContent = await response.Content.ReadAsStringAsync();
                    var result = JsonSerializer.Deserialize<MensagemWhatsResponse>(responseContent);
                    if (result.success)
                    {
                        jsonContent = JsonSerializer.Serialize(whatsMessage);
                        content = new StringContent(jsonContent, Encoding.UTF8, "application/json");
                        response = await _httpClient.PostAsync($"messages/send", content);
                        if (response.IsSuccessStatusCode)
                        {
                            responseContent = await response.Content.ReadAsStringAsync();
                            result = JsonSerializer.Deserialize<MensagemWhatsResponse>(responseContent);
                            if (result.success)
                            {
                                return true;
                            }
                            else
                            {
                                ErroRegistro.LogError($"Erro ao chamar EnviarConviteWhats{DateTime.Now}: {result.message}");
                                return false;
                            }
                        }
                        else
                        {
                            var errorContent = await response.Content.ReadAsStringAsync();
                            ErroRegistro.LogError($"Erro ao chamar EnviarConviteWhats: {errorContent}");
                            return false;
                        }
                    }
                    else
                    {
                        ErroRegistro.LogError($"Erro ao chamar EnviarConviteWhats{DateTime.Now}: {response.StatusCode}");
                        return false;
                    }
                }
                else
                {
                    var errorContent = await response.Content.ReadAsStringAsync();
                    ErroRegistro.LogError($"Erro ao chamar EnviarConviteWhats: {errorContent}");
                    return false;
                }
            }
            catch (Exception ex)
            {
                ErroRegistro.LogError($"Erro ao chamar EnviarConvitesWhats: {ex}");
                return false;
            }
        }
    }
}
