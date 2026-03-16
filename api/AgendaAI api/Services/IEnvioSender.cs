using AgendaAi.Models;
using AgendaAi.ViewModels;

namespace AgendaAi.Services
{
    public interface IEnvioSender
    {
        public Task SendEmailAsync(string email, string subject, string message);
        public Task <bool> SendWhatsAsync(WhatsMessage whatsEnvio);
    }
}
