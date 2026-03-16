using AgendaAi.Models;
using AgendaAi.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace AgendaAi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AvaliacoesController : ControllerBase
    {
        private readonly DbAgendaAi _context;
        public AvaliacoesController(DbAgendaAi context)
        {
            _context = context;
        }
        // GET: api/<AvaliacoesController>
        [HttpGet("Empresa/{id}")]
        public async Task<IActionResult>Get(int id)
        {
            var avaliacoes = await _context.Avaliacoes
                .Include(a => a.Agendamento)
                .ThenInclude(ag => ag.Servico)
                .Include(a => a.Agendamento)
                .ThenInclude(ag => ag.Profissional)
                .Where(a => a.Agendamento.Servico.ComercioId == id)
                .ToListAsync();
            if (avaliacoes == null || avaliacoes.Count == 0)
                return NotFound("Nenhuma avaliação encontrada para a empresa especificada.");
            var avaliacaoViews = avaliacoes.Select(a => new ViewModels.AvaliacaoView
            {
                Id = a.Id,
                Nota = a.Nota,
                Comentario = a.Comentario,
                DataServico = a.Agendamento.DataAgendamento,
                Servico = a.Agendamento.Servico.Nome,
                Profissional = a.Agendamento.Profissional.UserName
            }).ToList();
            return Ok(avaliacaoViews);
        }

        // GET api/<AvaliacoesController>/5
        [HttpGet("Usuario/{id}")]
        public async Task<IActionResult> Get(string id)
        {
            if (id == null)
            {
                return BadRequest("ID inválido.");
            }
            var avaliacoes = await _context.Avaliacoes
                .Include(a => a.Agendamento)
                .ThenInclude(ag => ag.Servico)
                .Include(a => a.Agendamento)
                .ThenInclude(ag => ag.Profissional)
                .Where(a => a.Agendamento.UsuarioId == id)
                .ToListAsync();

            if (avaliacoes == null || avaliacoes.Count == 0)
            {
                return NotFound("Avaliações não encontradas para o usuário especificado.");
            }

            var avaliacaoViews = avaliacoes.Select(a => new ViewModels.AvaliacaoView
            {
                Id = a.Id,
                Nota = a.Nota,
                Comentario = a.Comentario,
                DataServico = a.Agendamento.DataAgendamento,
                Servico = a.Agendamento.Servico.Nome,
                Profissional = a.Agendamento.Profissional.UserName
            }).ToList();

            return Ok(avaliacaoViews);
        }

        // PUT api/<AvaliacoesController>/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] AvaliacaoView avaliacaoView)
        {
            if (id != avaliacaoView.Id)
            {
                return BadRequest("ID da avaliação não corresponde.");
            }
            var avaliacao = await _context.Avaliacoes.FindAsync(id);
            if (avaliacao == null)
            {
                return NotFound("Avaliação não encontrada.");
            }
            avaliacao.Nota = avaliacaoView.Nota;
            avaliacao.Comentario = avaliacaoView.Comentario;
            await _context.SaveChangesAsync();
            return Ok("Avaliação realizada!");
        }

    }
}
