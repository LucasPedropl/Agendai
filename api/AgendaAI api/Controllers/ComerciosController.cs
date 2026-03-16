using AgendaAi.Models;
using AgendaAi.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Metadata.Internal;
using System.Security.Claims;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace AgendaAi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ComerciosController : ControllerBase
    {
        private readonly DbAgendaAi _context;
        public ComerciosController(DbAgendaAi context)
        {
            _context = context;
        }
        // GET: api/<EmpresasController>
        [HttpGet]
        public async Task<IActionResult> Get()
        {
            var empresas = await _context.Comercios.Include(s=>s.Servicos).ThenInclude(s=>s.Agendamentos).ThenInclude(s=>s.Avaliacao).ToListAsync();
            if (empresas == null || empresas.Count == 0)
            {
                return NotFound("Nenhum comércio encontrado.");
            }
            var empresasView = empresas.Select(e => new ViewModels.ComercioView
            {
                Id = e.Id,
                Nome = e.Nome,
                Endereco = e.Endereco,
                TotalAvalicoes= e.Servicos.SelectMany(s => s.Agendamentos).Count(a => a.Avaliacao != null),
                MediaAvalicoes= e.Servicos.SelectMany(s => s.Agendamentos).Where(a => a.Avaliacao != null).Select(a => a.Avaliacao!.Nota).DefaultIfEmpty(0).Average(),
            }).ToList();
            return Ok(empresasView);
        }
        // GET api/<EmpresasController>/5
        [HttpGet("{id}")]
        public async Task<IActionResult> Get(int id)
        {
            var empresa = await _context.Comercios.Include(s=>s.Configuracao).Include(s=>s.HorarioAtendimento).ThenInclude(s=>s.UsuariosEmpresas).FirstOrDefaultAsync(e => e.Id == id);
            if (empresa == null)
            {
                return NotFound("Comércio não encontrado.");
            }
            var DadosEmpresa = new ViewModels.ComercioConfg
            {
                id = empresa.Id,
                nome = empresa.Nome,
                endereco = empresa.Endereco,
                telefone = empresa.Telefone,
                NotificarAgendamento = empresa.NotificarAgendamento,
                LembrarAgendamento = empresa.LembrarAgendamento,
                ResumoDiario = empresa.ResumoDiario
            };
            empresa.HorarioAtendimento=empresa.HorarioAtendimento.Where(s=>s.UsuariosEmpresas==null).ToList();
            foreach (var horario in empresa.HorarioAtendimento)
            {
                if (horario.Dias.Count()>2)
                {
                    DadosEmpresa.HoraEntradaFimDeSem = horario.HoraFim;
                    DadosEmpresa.HoraSaidaFimDeSem = horario.HoraInicio;
                }
                else
                {
                    DadosEmpresa.HoraEntradaUtil = horario.HoraInicio;
                    DadosEmpresa.HoraSaidaUtil = horario.HoraFim;
                }
            }
            return Ok(empresa);
        }
        [HttpGet("/Clientes/{id}")]
        public async Task<IActionResult> GetClientes(int id)
        {
            var clientes = await _context.UsuariosEmpresas.Where(ue => ue.ComercioId == id && ue.TipoPermissao==TipoPermissao.Cliente && ue.Status).Include(ue => ue.Usuario).ToListAsync();
            var clientesView = new List<ComercioClientes>(); 
            if (clientes!=null && clientes.Count()>0)
            {
                foreach (var cliente in clientes)
                {
                    var ultimaVisita = await _context.Agendamentos.Where(a => a.UsuarioId == cliente.UsuarioId && a.Servico.ComercioId == id).OrderByDescending(a => a.DataAgendamento).FirstOrDefaultAsync();
                    clientesView.Add(new ComercioClientes
                    {
                        Nome = cliente.Usuario.UserName,
                        Telefone = cliente.Usuario.PhoneNumber,
                        UltimaVisita = ultimaVisita != null ? ultimaVisita.DataAgendamento : DateTime.MinValue
                    });
                }
                return Ok(clientesView);
            }
            else
            {
                return NotFound("Nenhum cliente encontrado para este comércio.");
            }
        }
        [HttpGet("/Profissionais/{id}")]
        public async Task<IActionResult> GetProfissionais(int id)
        {
            var profissionais = await _context.UsuariosEmpresas.Where(ue => ue.ComercioId == id && ue.TipoPermissao == TipoPermissao.Profissional).Include(ue => ue.Usuario).Select(s=>s.Usuario).ToListAsync();
            if (profissionais != null && profissionais.Count() > 0)
            {
                var profissionaisView = profissionais.Select(p => new
                {
                    Id = p.Id,
                    Nome = p.UserName,
                    Telefone = p.PhoneNumber
                }).ToList();
                return Ok(profissionaisView);
            }
            else
            {
                return NotFound("Nenhum profissional encontrado para este comércio.");
            }
        }
        [HttpGet("/Config-Estabelecimento/{id}")]
        public async Task<IActionResult> GetConfiguracao(int id)
        {
            var comercio = await _context.Comercios.Include(s => s.Configuracao).Include(s => s.HorarioAtendimento).FirstOrDefaultAsync(e => e.Id == id);
            if (comercio == null)
            {
                return NotFound("Comércio não encontrado.");
            }
            var configuracaoView = new ComercioConfiguracao
            {
                Configuracao= comercio.Configuracao,
                HorarioAtendimento = comercio.HorarioAtendimento.Where(s => s.UsuariosEmpresas == null).FirstOrDefault(),
            };
            var usuariosEmpresas = await _context.UsuariosEmpresas.Where(ue => ue.ComercioId == id && ue.TipoPermissao==TipoPermissao.Profissional && ue.Status).Include(ue => ue.Usuario).Include(ue => ue.HorarioAtendimento).ToListAsync();
            configuracaoView.Funcionarios = usuariosEmpresas;
            return Ok(configuracaoView);
        }
        // POST api/<EmpresasController>
        [HttpPost]
        public async Task<IActionResult> Post([FromBody] Comercio comercio)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId==null) { return NotFound("Erro, usuário não encontrado!"); }
            if (comercio == null) { return BadRequest("Você deve preencher todos os campos!"); }
            if (ModelState.IsValid) 
            {
                _context.Comercios.Add(comercio);
                await _context.SaveChangesAsync();
                UsuarioEmpresa usuarioEmpresa = new UsuarioEmpresa
                {
                    UsuarioId = userId,
                    TipoPermissao = TipoPermissao.Admin,
                    ComercioId = comercio.Id,
                };
                _context.UsuariosEmpresas.Add(usuarioEmpresa);
                await _context.SaveChangesAsync();
                comercio.UsuariosEmpresas = new List<UsuarioEmpresa>();
                comercio.UsuariosEmpresas.Add(usuarioEmpresa);
                return Ok(comercio);
            }
            else
            {
                return BadRequest("Você deve preencher todos os campos!");
            }

        }
        [HttpPost("/Config-Agenda/")]
        public async Task<IActionResult> PostConfigComercio([FromBody] ComercioConfiguracao comercioConfiguracao)
        {
            if (comercioConfiguracao.Configuracao == null) { return BadRequest("Configuração de comércio inválida."); }
            if (comercioConfiguracao.HorarioAtendimento == null) { return BadRequest("Configuração de horário de atendimento inválida."); }
            Comercio comercio = null;
            if (comercioConfiguracao.Configuracao.ComercioId == null)
            {
                comercio = await _context.Comercios.Include(s => s.Configuracao).FirstOrDefaultAsync(c => c.Id == comercioConfiguracao.Configuracao.ComercioId);
            }
            else 
            {
                var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                if (userId == null) { return NotFound("Erro, usuário não encontrado!"); }
                comercio = await _context.UsuariosEmpresas.Where(ue => ue.UsuarioId == userId && ue.TipoPermissao == TipoPermissao.Admin).Select(s => s.Comercio).FirstOrDefaultAsync();
            }
            if (comercio == null) { return NotFound("Comércio não encontrado!"); }
            try
            {
                comercio.Configuracao = comercioConfiguracao.Configuracao;
                comercio.HorarioAtendimento= new List<HorarioAtendimento>();
                comercio.HorarioAtendimento.Add(comercioConfiguracao.HorarioAtendimento);
                if (comercioConfiguracao.Funcionarios!=null && comercioConfiguracao.Funcionarios.Count()>0)
                {
                    foreach (var funcionario in comercioConfiguracao.Funcionarios)
                    {
                        var horaatendimento= new HorarioAtendimento() {
                            ComercioId = comercio.Id,
                            Dias = funcionario.HorarioAtendimento.Dias,
                            HoraInicio = funcionario.HorarioAtendimento.HoraInicio,
                            HoraFim = funcionario.HorarioAtendimento.HoraFim,
                            InicioIntervalo = funcionario.HorarioAtendimento.InicioIntervalo,
                            FimIntervalo = funcionario.HorarioAtendimento.FimIntervalo,
                            Intervalo = funcionario.HorarioAtendimento.Intervalo
                        };
                        _context.HorariosAtendimento.Add(horaatendimento);
                        funcionario.HorarioId = horaatendimento.Id;
                        _context.UsuariosEmpresas.Update(funcionario);
                    }
                }

                await _context.SaveChangesAsync();
                return Ok("Configurações salvas com sucesso!");
            }
            catch (Exception ex)
            {
                return BadRequest("Erro ao tentar salvar configurações!");
            }

        } 
        [HttpPost("/Cadastrar-Funcionario/")]
        public async Task<IActionResult> PostFuncionario([FromBody] ComercioClientes profissional)
        {
            if (profissional == null || string.IsNullOrWhiteSpace(profissional.Nome) || string.IsNullOrWhiteSpace(profissional.Telefone)) { return BadRequest("Você deve preencher todos os campos!"); }
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (userId == null) { return NotFound("Erro, usuário não encontrado!"); }
            try
            {
                var comercio = await _context.UsuariosEmpresas.Where(ue => ue.UsuarioId == userId && ue.TipoPermissao == TipoPermissao.Admin && ue.Status).Select(s => s.Comercio).FirstOrDefaultAsync();
                if (comercio == null) { return NotFound("Comércio não encontrado!"); }
                Usuario usuario = new Usuario
                {
                    UserName = profissional.Nome,
                    PhoneNumber = profissional.Telefone,
                    CPF = "00000000000",
                    Status = false,
                    DateCreate = DateTime.Now
                };
                _context.Users.Add(usuario);
                await _context.SaveChangesAsync();
                var usuarioEmpresa = new UsuarioEmpresa
                {
                    UsuarioId = usuario.Id,
                    ComercioId = comercio.Id,
                    Status = true,
                    TipoPermissao = TipoPermissao.Profissional,
                };

                _context.UsuariosEmpresas.Add(usuarioEmpresa);
                _context.SaveChanges();
                return Ok(new { Message = "Funcionário cadastrado com sucesso!", UsuarioId = usuario.Id });
            }
            catch (Exception ex)
            {
                return BadRequest("Erro ao tentar cadastrar funcionário!");
            }
            
        }
        // PUT api/<EmpresasController>/5
        [HttpPut("/Editar/{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] ComercioConfg comercioConfg)
        {
            var comercio = await _context.Comercios.Include(s => s.HorarioAtendimento).FirstOrDefaultAsync(e => e.Id == id);
            if (comercio == null)
            {
                return NotFound("Comércio não encontrado.");
            }
            comercio.Nome = comercioConfg.nome;
            comercio.Endereco = comercioConfg.endereco;
            comercio.Telefone = comercioConfg.telefone;
            comercio.NotificarAgendamento = comercioConfg.NotificarAgendamento;
            comercio.LembrarAgendamento = comercioConfg.LembrarAgendamento;
            comercio.ResumoDiario = comercioConfg.ResumoDiario;
            var horarioUtil = comercio.HorarioAtendimento.FirstOrDefault(h => h.Dias.Count() > 2);
            if (horarioUtil != null)
            {
                horarioUtil.HoraInicio = comercioConfg.HoraEntradaUtil;
                horarioUtil.HoraFim = comercioConfg.HoraSaidaUtil;
            }
            else
            {
                horarioUtil = new HorarioAtendimento
                {
                    ComercioId = comercio.Id,
                    Dias = new List<DayOfWeek> { DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday },
                    HoraInicio = comercioConfg.HoraEntradaUtil,
                    HoraFim = comercioConfg.HoraSaidaUtil
                };
                _context.HorariosAtendimento.Add(horarioUtil);
            }
            var horarioFimDeSem = comercio.HorarioAtendimento.FirstOrDefault(h => h.Dias.Count() <= 2);
            if (horarioFimDeSem != null)
            {
                horarioFimDeSem.HoraInicio = comercioConfg.HoraEntradaFimDeSem;
                horarioFimDeSem.HoraFim = comercioConfg.HoraSaidaFimDeSem;
            }
            else
            {
                horarioFimDeSem = new HorarioAtendimento
                {
                    ComercioId = comercio.Id,
                    Dias = new List<DayOfWeek> { DayOfWeek.Saturday, DayOfWeek.Sunday },
                    HoraInicio = comercioConfg.HoraEntradaFimDeSem,
                    HoraFim = comercioConfg.HoraSaidaFimDeSem
                };
                _context.HorariosAtendimento.Add(horarioFimDeSem);
            }
            await _context.SaveChangesAsync();
            return Ok();
        }
        [HttpPut("/Editar-Atendimento/{id}")]
        public async Task<IActionResult> PutAtendimento(int id, [FromBody] ComercioConfiguracao comercioConfiguracao)
        {
            try
            {
                if (comercioConfiguracao == null)
                {
                    return BadRequest("Configuração de atendimento inválida.");
                }
                if (comercioConfiguracao.HorarioAtendimento != null)
                {
                    var horario = await _context.HorariosAtendimento.FirstOrDefaultAsync(h => h.Id == comercioConfiguracao.HorarioAtendimento.Id);
                    if (horario != null)
                    {
                        horario.HoraInicio = comercioConfiguracao.HorarioAtendimento.HoraInicio;
                        horario.HoraFim = comercioConfiguracao.HorarioAtendimento.HoraFim;
                        horario.Dias = comercioConfiguracao.HorarioAtendimento.Dias;
                        horario.InicioIntervalo = comercioConfiguracao.HorarioAtendimento.InicioIntervalo;
                        horario.FimIntervalo = comercioConfiguracao.HorarioAtendimento.FimIntervalo;

                        _context.HorariosAtendimento.Update(horario);
                    }
                    else
                    {
                        return NotFound("Horário de atendimento não encontrado.");
                    }
                }
                if (comercioConfiguracao.Configuracao != null)
                {
                    var configComercio =await _context.ConfiguracoesComercio.Where(s => s.Id == comercioConfiguracao.Configuracao.Id).FirstOrDefaultAsync();
                    if (configComercio != null)
                    {
                        configComercio.AgendaSimultanea = comercioConfiguracao.Configuracao.AgendaSimultanea;
                        configComercio.AntecedenciaMin = comercioConfiguracao.Configuracao.AntecedenciaMin;
                        configComercio.ConfirmaAuto = comercioConfiguracao.Configuracao.ConfirmaAuto;
                        configComercio.FechaFeriadosMunicipais = comercioConfiguracao.Configuracao.FechaFeriadosMunicipais;
                        configComercio.FechaFeriadosNacionais = comercioConfiguracao.Configuracao.FechaFeriadosNacionais;
                        configComercio.HorarioPorProfissional = comercioConfiguracao.Configuracao.HorarioPorProfissional;
                        configComercio.LimiteAgendar = comercioConfiguracao.Configuracao.LimiteAgendar;
                        configComercio.Reagendar = comercioConfiguracao.Configuracao.Reagendar;
                        configComercio.TempoCancelamento = comercioConfiguracao.Configuracao.TempoCancelamento;
                        configComercio.TempoDuracaoPadrao = comercioConfiguracao.Configuracao.TempoDuracaoPadrao;
                        configComercio.TempoIntervalo = comercioConfiguracao.Configuracao.TempoIntervalo;


                        foreach (var diaFechado in comercioConfiguracao.Configuracao.DiasFechados)
                        {
                            var diaFechadoExistente = configComercio.DiasFechados.FirstOrDefault(df => df.Id == diaFechado.Id);
                            if (diaFechadoExistente != null)
                            {
                                diaFechadoExistente.Data = diaFechado.Data;
                                diaFechadoExistente.Descricao = diaFechado.Descricao;
                                _context.DiasFechados.Update(diaFechadoExistente);
                            }
                            else
                            {
                                var novoDiaFechado = new DiaFechado
                                {
                                    ConfigComercioId = configComercio.Id,
                                    Data = diaFechado.Data,
                                    Descricao = diaFechado.Descricao
                                };
                                _context.DiasFechados.Add(novoDiaFechado);
                            }
                        }
                    }
                    else
                    {
                        return NotFound("Configurações de atendimento não encontrado.");
                    }
                }
                if (comercioConfiguracao.Funcionarios != null && comercioConfiguracao.Funcionarios.Count() > 0)
                {
                    foreach (var funcionario in comercioConfiguracao.Funcionarios)
                    {
                        var horaAtendimento =await _context.UsuariosEmpresas.Where(s => s.UsuarioId == funcionario.UsuarioId && s.ComercioId == funcionario.ComercioId).Select(s => s.HorarioAtendimento).FirstOrDefaultAsync();
                        if (horaAtendimento != null)
                        {
                            horaAtendimento.HoraInicio = funcionario.HorarioAtendimento.HoraInicio;
                            horaAtendimento.HoraFim = funcionario.HorarioAtendimento.HoraFim;
                            horaAtendimento.Dias = funcionario.HorarioAtendimento.Dias;
                            horaAtendimento.InicioIntervalo = funcionario.HorarioAtendimento.InicioIntervalo;
                            horaAtendimento.FimIntervalo = funcionario.HorarioAtendimento.FimIntervalo;
                            horaAtendimento.Intervalo = funcionario.HorarioAtendimento.Intervalo;
                            _context.HorariosAtendimento.Update(horaAtendimento);
                        }
                        else
                        {
                            var novoHorario = new HorarioAtendimento
                            {
                                ComercioId = funcionario.ComercioId,
                                Dias = funcionario.HorarioAtendimento.Dias,
                                HoraInicio = funcionario.HorarioAtendimento.HoraInicio,
                                HoraFim = funcionario.HorarioAtendimento.HoraFim,
                                InicioIntervalo = funcionario.HorarioAtendimento.InicioIntervalo,
                                FimIntervalo = funcionario.HorarioAtendimento.FimIntervalo,
                                Intervalo = funcionario.HorarioAtendimento.Intervalo

                            };
                            _context.HorariosAtendimento.Add(novoHorario);
                            var usuarioEmpresaExistente = _context.UsuariosEmpresas.FirstOrDefault(ue => ue.UsuarioId == funcionario.UsuarioId && ue.ComercioId == funcionario.ComercioId);
                            usuarioEmpresaExistente.HorarioId = novoHorario.Id;
                            _context.Update(usuarioEmpresaExistente);
                        }
                    }
                }
                await _context.SaveChangesAsync();
                return Ok("Atualização feita com sucesso!");
            }
            catch (Exception ex)
            {
                return BadRequest("Erro ao tentar atualizar!");
                throw;
            }
        }

        // DELETE api/<EmpresasController>/5
        [HttpDelete("/Desativar-Usuario/{idEmpresa}/{id}")]
        public async Task<IActionResult> Delete(int idEmpresa,string id)
        {
            var usuarioEmpresa =await _context.UsuariosEmpresas.FirstOrDefaultAsync(ue => ue.UsuarioId == id && ue.ComercioId == idEmpresa);
            try
            {
                if (usuarioEmpresa != null)
                {
                    usuarioEmpresa.Status = false;
                    _context.UsuariosEmpresas.Update(usuarioEmpresa);
                    await _context.SaveChangesAsync();
                    return Ok(usuarioEmpresa);
                }
                return BadRequest("Usuário não encontrado!");
            }
            catch (Exception)
            {
                return NotFound("Erro ao deletar usuário!");
            }
        }
    }
}
