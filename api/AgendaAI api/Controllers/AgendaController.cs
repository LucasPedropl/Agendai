using AgendaAi.Models;
using AgendaAi.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using static System.Runtime.InteropServices.JavaScript.JSType;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace AgendaAi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AgendaController : ControllerBase
    {
        private readonly DbAgendaAi _context;
        public AgendaController(DbAgendaAi context)
        {
            _context = context;
        }
        [HttpGet("Agenda-Datas/")]
        public async Task<IActionResult> GetAgendaDatas([FromQuery] AgendamentoData agendamentoData) 
        {
            if (agendamentoData.ano < DateTime.Now.Year || agendamentoData.mes < 1 || agendamentoData.mes > 12)
                return BadRequest("Data inválida.");

            var diasDisponiveis = new List<int>();

            // 1. Busca o serviço
            var servico = await _context.Servicos.FindAsync(agendamentoData.servicoId);
            if (servico == null) return Ok(diasDisponiveis);

            // 2. Busca o Horário de Atendimento (Profissional ou Loja)
            var vinculo = await _context.UsuariosEmpresas
                .Include(ue => ue.HorarioAtendimento)
                .FirstOrDefaultAsync(ue => ue.UsuarioId == agendamentoData.profissionalId && ue.ComercioId == agendamentoData.comercioId);

            var horarioAtendimento = vinculo?.HorarioAtendimento;
            if (horarioAtendimento == null)
            {
                horarioAtendimento = await _context.HorariosAtendimento
                    .FirstOrDefaultAsync(ha => ha.ComercioId == agendamentoData.comercioId && ha.UsuariosEmpresas.Count == 0);
            }

            if (horarioAtendimento == null || !horarioAtendimento.Dias.Any())
                return Ok(diasDisponiveis); // Não tem horário configurado

            // 3. Busca TODOS os dias fechados deste mês de uma vez só (Performance)
            var diasFechadosMes = await _context.DiasFechados
                .Where(df => df.ConfigComercioId == agendamentoData.comercioId &&
                             df.Data.Year == agendamentoData.ano &&
                             df.Data.Month == agendamentoData.mes)
                .Select(df => df.Data.Day)
                .ToListAsync();

            // 4. Busca TODOS os agendamentos deste profissional neste mês de uma vez só
            var agendamentosMes = await _context.Agendamentos
                .Where(a => a.ProfissionalId == agendamentoData.profissionalId &&
                            a.DataAgendamento.Year == agendamentoData.ano &&
                            a.DataAgendamento.Month == agendamentoData.mes &&
                            a.Status != AppointmentStatus.Cancelado)
                .Select(a => new { a.DataAgendamento.Day, a.HoraAgendamento, Fim = a.HoraAgendamento.Add(servico.Duracao) })
                .ToListAsync();

            // Configuração de intervalo
            var config = await _context.ConfiguracoesComercio.FirstOrDefaultAsync(c => c.ComercioId == agendamentoData.comercioId);
            var intervalo = config?.TempoIntervalo ?? 0;

            // 5. Varredura dos dias do mês
            int diasNoMes = DateTime.DaysInMonth(agendamentoData.ano, agendamentoData.mes);
            var dataDeHoje = DateTime.Today;

            for (int dia = 1; dia <= diasNoMes; dia++)
            {
                var dataAtual = new DateTime(agendamentoData.ano, agendamentoData.mes, dia);

                // A. Passado: Ignora dias que já passaram (se for o mês atual)
                if (dataAtual < dataDeHoje) continue;

                // B. Dia da Semana: O profissional/loja trabalha neste dia da semana?
                // Obs: Se você usou Enum ou string para os dias, converta adequadamente aqui
                if (!horarioAtendimento.Dias.Contains(dataAtual.DayOfWeek)) continue;

                // C. Feriado/Bloqueio: Está na lista de dias fechados?
                if (diasFechadosMes.Contains(dia)) continue;

                // D. Verificação de Lotação: Tem pelo menos UM horário livre neste dia?
                var agendamentosDesteDia = agendamentosMes.Where(a => a.Day == dia).ToList();

                bool temPeloMenosUmSlotLivre = VerificarSlotLivre(
                    horarioAtendimento,
                    agendamentosDesteDia,
                    servico.Duracao,
                    TimeSpan.FromMinutes(intervalo)
                );

                if (temPeloMenosUmSlotLivre)
                {
                    diasDisponiveis.Add(dia);
                }
            }
            return Ok(diasDisponiveis);
        }
        private bool VerificarSlotLivre(HorarioAtendimento horario, dynamic agendamentosDoDia, TimeSpan duracaoServico, TimeSpan intervalo)
        {
            TimeSpan horaAtual = horario.HoraInicio;

            while (horaAtual.Add(duracaoServico) <= horario.HoraFim)
            {
                TimeSpan possivelFim = horaAtual.Add(duracaoServico);
                bool slotValido = true;

                // Regra do Almoço
                if (horario.Intervalo && horario.InicioIntervalo.HasValue && horario.FimIntervalo.HasValue)
                {
                    if (horaAtual < horario.FimIntervalo.Value && possivelFim > horario.InicioIntervalo.Value)
                    {
                        horaAtual = horario.FimIntervalo.Value;
                        continue;
                    }
                }

                // Regra de Conflito com Agendamentos Existentes
                foreach (var agendado in agendamentosDoDia)
                {
                    if (horaAtual < agendado.Fim && possivelFim > agendado.HoraAgendamento)
                    {
                        slotValido = false;
                        horaAtual = agendado.Fim;
                        break;
                    }
                }

                // Se achou UM único slot que serve, o dia está disponível! Pode parar de procurar.
                if (slotValido) return true;

                // Avança para tentar o próximo slot
                horaAtual = horaAtual.Add(duracaoServico).Add(intervalo);
            }

            // Se o loop terminou e não achou nenhum slot válido, o dia está lotado.
            return false;
        }
        [HttpGet("Agenda-Horarios/")]
        public async Task<IActionResult> GetHorariosDisponiveisAsync([FromQuery] AgendamentoHorario agendamento)
        {
            var horariosDisponiveis = new List<string>();
            var response = new { Data = agendamento.dataEscolhida.Date};

            // 1. Busca o serviço (precisamos saber a duração)
            var servico = await _context.Servicos.FindAsync(agendamento.servicoId);
            if (servico == null) return BadRequest("Serviço não encontrado!");

            // 2. Verifica se é um Dia Fechado (Feriado ou bloqueio manual)
            var diaFechado = await _context.DiasFechados
                .AnyAsync(df => df.ConfigComercioId == agendamento.comercioId && df.Data == agendamento.dataEscolhida.Date);
            if (diaFechado) return Ok(response); // Retorna lista vazia, loja fechada

            // 3. Busca o Horário de Atendimento (Pode ser do profissional ou da loja)
            var diaDaSemana = agendamento.dataEscolhida.DayOfWeek;

            // Tenta achar o horário específico do profissional (vínculo UsuarioEmpresa)
            var vinculo = await _context.UsuariosEmpresas
                .Include(ue => ue.HorarioAtendimento)
                .FirstOrDefaultAsync(ue => ue.UsuarioId == agendamento.profissionalId && ue.ComercioId == agendamento.comercioId);

            var horarioAtendimento = vinculo?.HorarioAtendimento;

            // Se o profissional não tiver horário próprio, busca o horário padrão do comércio
            if (horarioAtendimento == null)
            {
                horarioAtendimento = await _context.HorariosAtendimento
                    .FirstOrDefaultAsync(ha => ha.ComercioId == agendamento.comercioId &&
                                               ha.UsuariosEmpresas.Count == 0); // O padrão (sem vinculo específico)
            }

            // Se a loja não abre nesse dia da semana ou não tem horário cadastrado
            if (horarioAtendimento == null || !horarioAtendimento.Dias.Contains(diaDaSemana))
                return Ok(response);

            // 4. Busca os agendamentos já marcados para este profissional neste dia
            var agendamentosDoDia = await _context.Agendamentos
                .Where(a => a.ProfissionalId == agendamento.profissionalId &&
                            a.DataAgendamento == agendamento.dataEscolhida.Date &&
                            a.Status != AppointmentStatus.Cancelado)
                .Select(a => new { a.HoraAgendamento, Fim = a.HoraAgendamento.Add(servico.Duracao) })
                // Nota: O ideal é que o agendamento já tenha a propriedade "HoraFim" salva no banco para não recalcular aqui
                .ToListAsync();

            // 5. Geração dos Slots (O cálculo mágico)
            var config = await _context.ConfiguracoesComercio.FirstOrDefaultAsync(c => c.ComercioId == agendamento.comercioId);
            var intervaloEntreServicos = config?.TempoIntervalo ?? 0;

            TimeSpan horaAtual = horarioAtendimento.HoraInicio;

            while (horaAtual.Add(servico.Duracao) <= horarioAtendimento.HoraFim)
            {
                TimeSpan possivelFim = horaAtual.Add(servico.Duracao);
                bool slotValido = true;

                // Regra A: Interfere no horário de almoço?
                if (horarioAtendimento.Intervalo && horarioAtendimento.InicioIntervalo.HasValue && horarioAtendimento.FimIntervalo.HasValue)
                {
                    if (horaAtual < horarioAtendimento.FimIntervalo.Value && possivelFim > horarioAtendimento.InicioIntervalo.Value)
                    {
                        slotValido = false;
                        // Pula direto para o fim do almoço para otimizar
                        horaAtual = horarioAtendimento.FimIntervalo.Value;
                        continue;
                    }
                }

                // Regra B: Interfere em algum agendamento existente?
                foreach (var agendado in agendamentosDoDia)
                {
                    // Lógica de colisão de tempo: Começa antes do outro terminar E termina depois do outro começar
                    if (horaAtual < agendado.Fim && possivelFim > agendado.HoraAgendamento)
                    {
                        slotValido = false;
                        // Pula para o final do agendamento conflitante
                        horaAtual = agendado.Fim;
                        break;
                    }
                }

                // Se passou por todas as regras e o slot é válido, adiciona na lista
                if (slotValido)
                {
                    // Formata bonitinho para o Front-end (ex: "09:00")
                    horariosDisponiveis.Add(horaAtual.ToString(@"hh\:mm"));

                    // Avança para o próximo possível slot. 
                    // Pode avançar pela duração do serviço + intervalo de limpeza configurado
                    horaAtual = horaAtual.Add(servico.Duracao).Add(TimeSpan.FromMinutes(intervaloEntreServicos));
                }
            }
            var resultado = new
            {
                Data = agendamento.dataEscolhida.Date,
                HorariosDisponiveis = horariosDisponiveis
            };
            return Ok(resultado);
        }
        [HttpGet("Cliente/{id}")]
        public async Task<IActionResult> Get(string id)
        {
            if (id == null)
            {
                return BadRequest("ID inválido.");
            }
            var agendas = await _context.Agendamentos
                .Where(a => a.UsuarioId == id && a.DataAgendamento >= DateTime.UtcNow.Date)
                .Include(a => a.Servico)
                .Include(a => a.Profissional)
                .ToListAsync();
            var agendaViews = agendas.Select(a => new AgendaView
            {
                Id = a.Id,
                DataAgendamento = a.DataAgendamento,
                ServicoNome = a.Servico.Nome,
                ProfissionalNome = a.Profissional.UserName,
                Status = a.Status.ToString()
            }).ToList();
            return Ok(agendaViews);
        }
        [HttpGet("Cliente-Historico/{id}")]
        public async Task<IActionResult> GetHistorico(string id, DateTime? date)
        {
            if (id == null)
            {
                return BadRequest("ID inválido.");
            }
            var agendas = await _context.Agendamentos
                .Where(a => a.UsuarioId == id && a.DataAgendamento < DateTime.UtcNow)
                .Include(a => a.Servico)
                .Include(a => a.Profissional)
                .ToListAsync();
            if (date.HasValue)
            {
                agendas = agendas.Where(a => a.DataAgendamento.Date <= date.Value.Date).ToList();
            }
            var agendahistorico = agendas.Select(a => new AgendaHistoricoView
            {
                DataAgendamento = a.DataAgendamento,
                ServicoNome = a.Servico.Nome,
                Status = a.Status.ToString(),
                Valor= a.Servico.Preco
            }).ToList();
            return Ok(agendahistorico);
        }
        [HttpGet("Comercio/{id}")]
        public async Task<IActionResult> GetComercio(int id) 
        {
            var agenda = await _context.Agendamentos
                    .Where(a => a.Servico.ComercioId == id && a.DataAgendamento.Date >= DateTime.UtcNow.Date && a.Status!= AppointmentStatus.Cancelado)
                    .Include(a => a.Servico)
                    .Include(a => a.Usuario)
                    .ToListAsync();
            if (agenda!= null && agenda.Count()>0)
            {
                var agendaViews = agenda.Select(a => new
                {
                    DataAgendamento = a.DataAgendamento,
                    ServicoNome = a.Servico.Nome,
                    UsuarioNome = a.Usuario.UserName,
                    Status = a.Status.ToString(),
                    HoraAgendamento = a.HoraAgendamento
                }).ToList();
                return Ok(agendaViews);

            }
            return Ok("Agenda Vazia");
        }
        [HttpGet("Comercio-Historico/{id}")]
        public async Task<IActionResult> GetComercioHistorico(int id,string periodo,string? status,string? profissional)
        {
            var agenda = await _context.Agendamentos
                    .Where(a => a.Servico.ComercioId == id && a.DataAgendamento.Date < DateTime.UtcNow.Date && a.Status != AppointmentStatus.Cancelado)
                    .Include(a => a.Servico)
                    .Include(a => a.Usuario)
                    .Include(a => a.Profissional)
                    .ToListAsync();
            if (!string.IsNullOrEmpty(periodo))
            {

            }
            if (!string.IsNullOrEmpty(profissional)) 
            {
                agenda = agenda.Where(a => a.Profissional.Id == profissional).ToList();
            }
            if (!string.IsNullOrEmpty(status))
            {
                if (status == "Concluido") 
                {
                    agenda = agenda.Where(a => a.Status == AppointmentStatus.Finalizado).ToList();
                }
                if (status == "Cancelado") 
                {
                    agenda = agenda.Where(a => a.Status == AppointmentStatus.Cancelado).ToList();
                }
                if (status == "Não compareceu") 
                {
                    agenda = agenda.Where(a => a.Status == AppointmentStatus.NaoCompareceu).ToList();
                }
            }
            if (agenda != null && agenda.Count() > 0)
            {
                var agendaViews = agenda.Select(a => new
                {
                    DataAgendamento = a.DataAgendamento,
                    ServicoNome = a.Servico.Nome,
                    UsuarioNome = a.Usuario.UserName,
                    Status = a.Status.ToString(),
                    HoraAgendamento = a.HoraAgendamento
                }).ToList();
                return Ok(agendaViews);

            }
            return Ok("Histórico Vazio");
        }
        // POST api/<AgendaController>
        [HttpPost]
        public async Task<IActionResult> Post([FromBody] AgendamentoView agendamento)
        {
            if (agendamento == null)
            {
                return BadRequest("Dados de agendamento inválidos.");
            }
            if (!ModelState.IsValid)
            {
                return BadRequest("Dados Incorretos ou não preenchidos!");
            }
            try
            {

                Agendamento novoAgendamento = new Agendamento
                {
                    ProfissionalId = agendamento.IdProssional,
                    DataAgendamento = agendamento.Data.Date,
                    HoraAgendamento = agendamento.Horario,
                    ServicoId = agendamento.IdServico,
                    UsuarioId = agendamento.IdUsuario, // Substitua pelo ID real do usuário autenticado
                    Status = AppointmentStatus.Confirmado,
                    DataCriacao = DateTime.UtcNow
                };
                _context.Agendamentos.Add(novoAgendamento);
                await _context.SaveChangesAsync();
                return Ok("Agendamento Realizado!");
            }
            catch (Exception ex)
            {
                return BadRequest("Erro ao Agendar!");
            }
        }

        // PUT api/<AgendaController>/5
        [HttpPut("Cliente-Cancela/{id}")]
        public async Task<IActionResult> Put(int id, [FromBody] bool cancelar)
        {
            var agendamento = await _context.Agendamentos.FindAsync(id);
            if (agendamento == null)
            {
                return NotFound("Agendamento não encontrado.");
            }
            if (cancelar)
            {
                agendamento.Status = AppointmentStatus.Cancelado;
                _context.Agendamentos.Update(agendamento);
                await _context.SaveChangesAsync();
                return Ok("Agendamento cancelado com sucesso.");
            }
            return BadRequest("Operação inválida.");
        }

        // DELETE api/<AgendaController>/5
        [HttpDelete("Cancelar/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var agendamento =await _context.Agendamentos.Where(s=>s.Id==id).Include(s=>s.Servico).FirstOrDefaultAsync();
            if (agendamento == null)
            {
                return NotFound("Agendamento não encontrado.");
            }
            var configComercio= await _context.ConfiguracoesComercio.FirstOrDefaultAsync(c => c.ComercioId == agendamento.Servico.ComercioId);
            if (configComercio == null)
            {
                return NotFound("Configuração do comércio não encontrada.");
            }
            var tempoCancelamento = configComercio.TempoCancelamento;
            if (agendamento.DataAgendamento.AddHours(-tempoCancelamento) < DateTime.UtcNow)
            {
                return BadRequest($"O agendamento só pode ser cancelado com pelo menos {tempoCancelamento} hora(s) de antecedência.");
            }
            _context.Agendamentos.Remove(agendamento);
            await _context.SaveChangesAsync();
            return Ok("Cancelado com Sucesso!");
        }
    }
}
