using AgendaAi.Models;
using AgendaAi.Services;
using AgendaAi.ViewModels;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.UI.Services;
using Microsoft.AspNetCore.Mvc;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace AgendaAi.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LoginController : ControllerBase
    {
        private readonly DbAgendaAi _context;
        private readonly IUserService _userService;
        private readonly UserManager<Usuario> _userManager;
        private readonly Services.IEnvioSender _envioSender;
        public LoginController(DbAgendaAi context, IUserService userService, UserManager<Usuario> userManager, Services.IEnvioSender envioSender)
        {
            _context = context;
            _userService = userService;
            _userManager = userManager;
            _envioSender = envioSender;
        }
        // GET api/<LoginController>/5
        [HttpPost("Acesso")]
        public IActionResult Get([FromBody] Login login)
        {
            var usuario= _context.Users.FirstOrDefault(u => u.Email == login.Email && u.Status==true);
            if (usuario == null)
            {
                return BadRequest("Usuario não encontrado ou inativo");
            }
            var hasher = new PasswordHasher<Usuario>();
            var senha = login.Password;
            senha = hasher.HashPassword(usuario, senha);
            if (senha != usuario.PasswordHash)
            {
                return Unauthorized("Senha ou usuário incorreta");
            }
            var usuarioDto = new UsuarioDto
            {
                Id = usuario.Id,
                UserName = usuario.UserName,
                Email = usuario.Email,
                tipoPermissao = "Cliente"
            };
            var tipoUsuario= _context.UsuariosEmpresas.FirstOrDefault(ue => ue.UsuarioId == usuario.Id && ue.TipoPermissao==TipoPermissao.Admin);
            if (tipoUsuario == null)
            {
                usuarioDto.tipoPermissao="Admin";
            }
            var token= _userService.GerarToken(usuarioDto);
            var tokenReturn= new TokenResponse
            {
                Token = token,
                Expiracao = (int)TimeSpan.FromMinutes(10).TotalSeconds + "s",
                Permissao= usuarioDto.tipoPermissao
            };
            return Ok(tokenReturn);
        }
        // POST api/<LoginController>
        [HttpPost("Registrar")]
        public async Task<IActionResult> Post([FromBody] Registrar usuario)
        {
            if (usuario == null) {
                return BadRequest("Erro ao criar usuario");
            }
            if (usuario.Password != usuario.ConfirmPassword)
            {
                return BadRequest("Senha e Confirmar Senha não conferem");
            }
            if (_context.Users.Any(u => u.Email == usuario.Email))
            {
                return BadRequest("Email já cadastrado");
            }
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var novoUsuario = new Usuario
            {
                UserName = usuario.Nome + " " + usuario.Sobrenome,
                Email = usuario.Email,
                CPF = usuario.CPF,
                PhoneNumber = usuario.Telefone,
                DateBirth = usuario.DataNascimento,
                Status = false,
                DateCreate = DateTime.Now,
                SecurityStamp = Guid.NewGuid().ToString()
            };
            var hasher = new PasswordHasher<Usuario>();
            novoUsuario.PasswordHash = hasher.HashPassword(novoUsuario, usuario.Password);
            
            _context.Users.Add(novoUsuario);
            _context.SaveChanges();
            var token = await _userManager.GenerateEmailConfirmationTokenAsync(novoUsuario);
            var confirmationUrl = $"https://seusite.com/confirm-email?userId={novoUsuario.Id}&token={Uri.EscapeDataString(token)}";

            await _envioSender.SendEmailAsync(usuario.Email, "Ativação de conta AgendaAI",
            $"Clique aqui para validar sua conta: {confirmationUrl}");

            return Ok(new { message = "Usuário criado! Verifique seu e-mail para confirmar." });
        }
        [HttpPost("Registrar-Cliente")]
        public async Task<IActionResult> Registrar(RegistrarCliente usuario)
        {
            if (usuario == null)
            {
                return BadRequest("Erro ao criar usuario");
            }
            var user = await _userManager.FindByEmailAsync(usuario.Email);
            if (user!=null)
            {
                var userEmpresa = _context.UsuariosEmpresas.FirstOrDefault(ue => ue.UsuarioId == user.Id && ue.ComercioId == usuario.ComercioId);
                if (userEmpresa!=null)
                {
                    return BadRequest("Email já cadastrado");
                }
                else{
                    UsuarioEmpresa newUsuarioEmpresa = new UsuarioEmpresa
                    {
                        UsuarioId = user.Id,
                        ComercioId = usuario.ComercioId,
                        TipoPermissao = TipoPermissao.Cliente,
                        Status= true,
                        Favorito= false
                    };
                    _context.UsuariosEmpresas.Add(newUsuarioEmpresa);
                    await _context.SaveChangesAsync();
                    return Ok(new { message = "Usuário adicionado!" });
                }
            }
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            var novoUsuario = new Usuario
            {
                UserName = usuario.Nome,
                LastName= usuario.Sobrenome,
                Email = usuario.Email,
                CPF = usuario.CPF,
                PhoneNumber = usuario.Telefone,
                DateBirth = usuario.DataNascimento,
                Status = false,
                DateCreate = DateTime.Now,
                SecurityStamp = Guid.NewGuid().ToString()
            };
            _context.Users.Add(novoUsuario);
            
            var novoUsuarioEmpresa = new UsuarioEmpresa
            {
                UsuarioId = novoUsuario.Id,
                ComercioId = usuario.ComercioId,
                TipoPermissao = TipoPermissao.Cliente,
                Status= true,
                Favorito= false
            };
            _context.UsuariosEmpresas.Add(novoUsuarioEmpresa);
            _context.SaveChanges();
            var token = await _userManager.GenerateEmailConfirmationTokenAsync(novoUsuario);
            var confirmationUrl = $"https://seusite.com/confirm-email?userId={novoUsuario.Id}&token={Uri.EscapeDataString(token)}";
            if (usuario.tipoEnvio == 0) 
            {
               await _envioSender.SendEmailAsync(usuario.Email, "Ativação de conta AgendaAI", $"Clique aqui para validar sua conta: {confirmationUrl}");
            }
            if (usuario.tipoEnvio==1)
            {
                var whats= _context.WhatsApps.Where(w => w.comercioId==usuario.ComercioId).Select(s=>s.Id).FirstOrDefault();
                if (whats <= 0) 
                {
                    return BadRequest(new { message = "Usuario Criado, Erro ao enviar Mensagem!" });
                }
                usuario.Telefone ="55"+usuario.Telefone.Replace("(", "").Replace(")", "").Replace("-", "").Replace(" ", "");
                var WhatsAppMessage = new WhatsMessage {
                    message = $"Clique aqui para validar sua conta: {confirmationUrl}",
                    to = usuario.Telefone,
                    instance_id = whats
                };
                if (await _envioSender.SendWhatsAsync(WhatsAppMessage))
                {
                    return Ok(new { message = "Usuario Criado e Link Enviado!" });
                }
                else
                {
                    return BadRequest(new { message = "Usuario Criado, Erro ao enviar Mensagem!" });
                }
            }
            return Ok(new { message = "Usuario Criado com Sucesso!" });
        }
        // GET: api/auth/confirm-email
        [HttpGet("Ativar-Login")]
        public async Task<IActionResult> ConfirmEmail(string userId, string token)
        {
            if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(token))
                return BadRequest("Dados inválidos.");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound("Usuário não encontrado.");

            var result = await _userManager.ConfirmEmailAsync(user, token);
            var configUsuario = new ConfigUsuario
            {
                UsuarioId = user.Id,
                NotificaAgendamento = true,
                NotificaPromo = false,
                NotificaDiaAgendado = true
            };
            _context.ConfigUsuarios.Add(configUsuario);
            await _context.SaveChangesAsync();
            if (result.Succeeded)
                return Ok(new { message = "E-mail confirmado com sucesso!" });

            return BadRequest(new { message = "Erro ao confirmar e-mail.", errors = result.Errors });
        }
        [HttpGet("Dados-Usuario/{id}")]
        public async Task<IActionResult> PerfilUsuario(string id)
        {
            if (string.IsNullOrWhiteSpace(id))
                return BadRequest("Dados inválidos.");
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return NotFound("Usuário não encontrado.");
            var usuario = new EditarUsuario
            {
                Id = user.Id,
                Nome = user.UserName ?? "",
                Sobrenome = user.LastName,
                Email = user.Email ?? "",
                CPF = user.CPF,
                Telefone = user.PhoneNumber ?? "",
                DataNascimento = user.DateBirth
            };
            return Ok(usuario);
        }
        // PUT api/<LoginController>/5
        [HttpPut("Editar-Perfil/{id}")]
        public async Task<IActionResult> Put(string id, [FromBody] EditarUsuario usuario)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return NotFound("Usuário não encontrado.");

            user.UserName = usuario.Nome;
            user.LastName = usuario.Sobrenome;
            user.CPF = usuario.CPF;
            user.PhoneNumber = usuario.Telefone;
            user.DateBirth = usuario.DataNascimento;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return BadRequest("Erro ao atualizar o perfil.");
            return Ok("Perfil Atualizado com Sucesso!");
        }
        [HttpGet("Config-Usuario/{id}")]
        public async Task<IActionResult> GetConfigUsuario(int id)
        {
            var config = await _context.ConfigUsuarios.FindAsync(id);
            if (config == null)
                return NotFound("Erro não encontrado.");
            return Ok(config);
        }
        [HttpPut("Config-Usuario/{id}")]
        public async Task<IActionResult> ConfigUsuario(int id,ConfigUsuario configUsuario)
        {
            var config = await _context.ConfigUsuarios.FindAsync(id);
            if (config == null)
                return NotFound("Erro não encontrado.");
            
            config.NotificaAgendamento = configUsuario.NotificaAgendamento;
            config.NotificaPromo = configUsuario.NotificaPromo;
            config.NotificaDiaAgendado = configUsuario.NotificaDiaAgendado;

            await _context.SaveChangesAsync();
            return Ok(configUsuario);
        }
        // DELETE api/<LoginController>/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            var user = await _userManager.FindByIdAsync(id);
            if (user == null)
                return NotFound("Usuário não encontrado.");
            user.Status = false;
            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                return BadRequest("Erro ao desativar o usuário.");
            return Ok("Usuário desativado com sucesso.");
        }
    }
}
