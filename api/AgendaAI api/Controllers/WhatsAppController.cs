using AgendaAi.Models;
using AgendaAi.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace AgendaAi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class WhatsAppController : ControllerBase
    {
        private readonly DbAgendaAi _context;
        private readonly HttpClient _httpClient;
        private readonly TokenStorage _tokenStorage;
        public WhatsAppController(DbAgendaAi context, TokenStorage tokenStorage)
        {
            _httpClient = new HttpClient();
            _context = context;
            _tokenStorage = tokenStorage;
            _httpClient.BaseAddress = new Uri("https://dev.bixs.com.br/v1/api/message/");
            var tokenAtual = _tokenStorage.Token;
            // Configura o cabeçalho de autorização padrão para todas as requisições
            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue("Bearer", tokenAtual);
        }
        public class StatusResponse
        {
            public string? status { get; set; }
        }
        public class QrCodeResponse
        {
            public string? qrcode { get; set; }
            public string? status { get; set; }
        }
        // GET api/<WhatsAppController>/5
        [HttpGet("Status/{id}")]
        public async Task<IActionResult> Get(int id)
        {
            try
            {
                var whatsApp = await _context.WhatsApps.Where(s => s.comercioId == id).FirstOrDefaultAsync();
                var erro = new WhatsAppView();
                if (whatsApp == null)
                {
                    erro.status = "Sessão não encontrada.";
                    return Ok(erro);
                }
                // Requisição GET para a API
                var response = await _httpClient.GetAsync($"instances/{whatsApp.Id}/status");
                // Verifica se a requisição foi bem-sucedida
                if (response.IsSuccessStatusCode)
                {
                    var content = await response.Content.ReadAsStringAsync();
                    // Tenta deserializar o JSON para extrair o status
                    var resultado = JsonSerializer.Deserialize<WhatsAppView>(content);
                    if (resultado != null && resultado.status != whatsApp.status)
                    {
                        whatsApp.status = resultado.status;
                        whatsApp.atualizado = DateTime.Now;
                        whatsApp.ntelefone = resultado.phone_number;
                        _context.WhatsApps.Update(whatsApp);
                        await _context.SaveChangesAsync();
                    }
                    return Ok(resultado);
                }
                if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
                {
                    erro.status = "Sessão não encontrada.";
                    return Ok(erro);
                }
                else
                {
                    erro.status = $"Erro ao verificar sessão";
                    return Ok(erro);
                }
            }
            catch (Exception ex)
            {
                var erro = new WhatsAppView();
                ErroRegistro.LogError($"Erro ao chamar VerificarStatusWhats: {ex}");
                erro.status = "Erro";
                return Ok(erro);
            }
        }

        // POST api/<WhatsAppController>
        [HttpGet("Obter-QrCode/{id}")]
        public async Task<IActionResult> ObterQrCode(int id)
        {   try{
                var whatsApp = await _context.WhatsApps.Where(s => s.Id == id).FirstOrDefaultAsync();
                if (whatsApp == null)
                {
                    whatsApp = await CriarSessao(id);
                    if (whatsApp == null)
                        return BadRequest(new { success = false, message = "Sessão não encontrada." });
                }
                _httpClient.DefaultRequestHeaders.Accept.Clear();
                _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                HttpResponseMessage response = await _httpClient.GetAsync($"instances/{whatsApp.Id}/qrcode");
                if (response.IsSuccessStatusCode)
                {
                    string jsonResponse = await response.Content.ReadAsStringAsync();
                    var resultado = JsonSerializer.Deserialize<QrCodeResponse>(jsonResponse);
                    return Ok(new { qrCode = resultado.qrcode });
                }
                else
                {
                    return BadRequest(new { message = "Falha ao obter QR Code" });
                }
            }
            catch (Exception ex)
            {
                ErroRegistro.LogError($"Erro ao chamar ObterQrCorde: {ex}");
                return BadRequest(new { success = false, message = "Erro ao obter QR Code." });
            }
        }
        private async Task<WhatsApp> CriarSessao(int id)
        {
            try
            {
                var requestBody = new { name = "COM-"+id };
                string jsonRequestBody = JsonSerializer.Serialize(requestBody);
                var content = new StringContent(jsonRequestBody, Encoding.UTF8, "application/json");

                // 2. ADICIONADO cabeçalho Accept conforme documentação
                _httpClient.DefaultRequestHeaders.Accept.Clear();
                _httpClient.DefaultRequestHeaders.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                HttpResponseMessage response = await _httpClient.PostAsync($"instances", content);
                if (response.IsSuccessStatusCode)
                {
                    string jsonResponse = await response.Content.ReadAsStringAsync();
                    var resultado = JsonSerializer.Deserialize<WhatsAppView>(jsonResponse);
                    var newWhatsApp = new WhatsApp
                    {
                        sessao = resultado.name,
                        status = resultado.status,
                        ntelefone = resultado.phone_number,
                        criado = resultado.created_at,
                        Id = resultado.id,
                        atualizado = resultado.updated_at,
                        comercioId = id
                    };
                    using (var transaction = await _context.Database.BeginTransactionAsync())
                    {
                        // CORREÇÃO: Tabela correta é WhatsApps
                        await _context.Database.ExecuteSqlRawAsync("SET IDENTITY_INSERT dbo.WhatsApps ON");

                        await _context.WhatsApps.AddAsync(newWhatsApp);
                        await _context.SaveChangesAsync();

                        await _context.Database.ExecuteSqlRawAsync("SET IDENTITY_INSERT dbo.WhatsApps OFF");

                        await transaction.CommitAsync();
                    }
                    return newWhatsApp;
                }
                else
                {
                    var erro = new WhatsApp()
                    {
                        status = "Erro ao criar sessão",
                        ntelefone = "",
                    };
                    return erro;
                }
            }
            catch (Exception ex)
            {
                var erro = new WhatsApp()
                {
                    status = "Erro ao criar sessão",
                    ntelefone = "",
                };
                ErroRegistro.LogError($"Erro ao chamar Sincronizar: {ex}");
                return erro;
            }
        }

        // DELETE api/<WhatsAppController>/5
        [HttpDelete("Desconectar/{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            if (id == 0)
            {
                return BadRequest("Erro ao Desconectar" );
            }
            var whatsApp = await _context.WhatsApps.Where(s => s.comercioId == id).FirstOrDefaultAsync();
            if (whatsApp == null)
            {
                return NotFound("Sessão não Encontrada!");
            }
            var response = await _httpClient.DeleteAsync($"instances/{whatsApp.Id}");
            // Verifica se a requisição foi bem-sucedida
            if (response.IsSuccessStatusCode)
            {
                _context.WhatsApps.Remove(whatsApp);
                await _context.SaveChangesAsync();
                return Ok("Desconectado!");
            }
            return BadRequest("Erro ao Desconectar");
        }
    }
}
