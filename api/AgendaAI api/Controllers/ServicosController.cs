using AgendaAi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace AgendaAi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ServicosController : ControllerBase
    {
        private readonly DbAgendaAi _context;
        public ServicosController(DbAgendaAi context)
        {
            _context = context;
        }
        // GET api/<ServicosController>/5
        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var servicos = await _context.Servicos.Where(s=>s.ComercioId==id && s.Ativo).ToListAsync();
            return Ok(servicos);
        }
        // POST api/<ServicosController>
        [HttpPost]
        public async Task<IActionResult> Post([FromBody] Servico servico)
        {
            if (servico == null)
            {
                return BadRequest("Serviço inválido.");
            }
            try
            {
                if (servico.ComercioId==0)
                {
                    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                    if (userId == null)
                    {
                        return Unauthorized("Usuário não autenticado.");
                    }
                    var idComercio =await _context.UsuariosEmpresas.Where(s => s.UsuarioId == userId && s.TipoPermissao == TipoPermissao.Admin).Select(s=>s.ComercioId).FirstAsync();
                    if (idComercio != 0) { servico.ComercioId =idComercio; }
                }
                if (ModelState.IsValid)
                {
                    servico.Ativo = true;
                    _context.Servicos.Add(servico);
                    await _context.SaveChangesAsync();
                }
                return Ok(servico);
            }
            catch (Exception ex)
            {
                return BadRequest("Erro ao tentar cadastrar serviço!");
            }
        }
        // PUT api/<ServicosController>/5
        [HttpPut("{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] Servico servico)
        {
            if(servico == null) { 
                return BadRequest("Dados do serviço não preenchido.");
            }
            var servicoExistente =await _context.Servicos.FirstOrDefaultAsync(s => s.Id == id);
            if(servicoExistente == null)
            {
                return NotFound("Serviço não encontrado.");
            }
            try
            {
                if (ModelState.IsValid)
                {
                    servicoExistente.Nome = servico.Nome;
                    servicoExistente.Descricao = servico.Descricao;
                    servicoExistente.Preco = servico.Preco;
                    servicoExistente.Duracao = servico.Duracao;
                    servicoExistente.Categoria = servico.Categoria;
                    servicoExistente.Icone = servico.Icone;
                    _context.Servicos.Update(servicoExistente);
                    await _context.SaveChangesAsync();
                }
                return Ok(servicoExistente);
            }
            catch (Exception ex)
            {
                return BadRequest("Erro ao tentar atualizar serviço!");
            }
        }

        // DELETE api/<ServicosController>/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            try
            {
                var servico = _context.Servicos.FirstOrDefault(s => s.Id == id);
                if (servico != null)
                {
                    servico.Ativo = false;
                    _context.Servicos.Update(servico);
                    await _context.SaveChangesAsync();
                    return Ok(servico);
                }
                return NotFound("Serviço não encontrado.");
            }
            catch (Exception)
            {
                return BadRequest("Erro ao tentar excluir serviço!");
            }
        }
    }
}
