using AgendaAi.Models;
using Microsoft.EntityFrameworkCore;
using System.Globalization;

namespace AgendaAi.Services
{
    public class ComerService
    {
        private readonly DbAgendaAi _context;
        private readonly Services.IEnvioSender _envioSender;
        public ComerService(DbAgendaAi context, IEnvioSender envioSender)
        {
            _context = context;
            _envioSender = envioSender;
        }
        public async Task<bool> lembraAgenda(DateTime data) 
        {
            var agendamentos = await _context.Agendamentos
                .Where(a => a.DataAgendamento == data.Date && a.Usuario.ConfigUsuario.NotificaDiaAgendado==true)
                .Include(s=>s.Servico).ThenInclude(s=>s.Comercio)
                .Include(s=>s.Usuario).ToListAsync();
    
            foreach (var agendamento in agendamentos)
            {
                string subject = "Lembrete de Agendamento";
                string body = $"Olá {agendamento.Usuario.LastName},\n\nEste é um lembrete de que você tem um agendamento marcado em {agendamento.Servico.Comercio.Nome} para o serviço {agendamento.Servico.Nome} amanhã {agendamento.DataAgendamento.ToString("dd/MM/yyyy", CultureInfo.InvariantCulture)} às {agendamento.HoraAgendamento}.\n\nAtenciosamente,\nEquipe AgendaAi";
                if (agendamento.Usuario.Email != null)
                {
                    await _envioSender.SendEmailAsync(agendamento.Usuario.Email, subject, body);
                }
            }
            return true;
        }
    }
}
