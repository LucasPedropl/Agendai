using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace AgendaAi.ViewModels
{
    public class Login
    {
        public required string Email { get; set; }
        public required string Password { get; set; }
    }
    public class UsuarioDto     {
        public required string Id { get; set; }
        public required string UserName { get; set; }
        public required string Email { get; set; }
        public required string tipoPermissao { get; set; }
    }
    public class Registrar
    {
        [StringLength(18, ErrorMessage = "O {0} deve ser preenchido corretamente.", MinimumLength = 3)]
        public required string Nome { get; set; }
        public string? Sobrenome { get; set; }
        [StringLength(14, ErrorMessage = "O {0} deve ser preenchido corretamente.", MinimumLength = 11)]
        public required string CPF { get; set; }
        [StringLength(15, ErrorMessage = "O {0} deve ser preenchido corretamente.", MinimumLength = 10)]
        public required string Telefone { get; set; }
        public DateTime DataNascimento { get; set; }
        public required string Email { get; set; }
        [DataType(DataType.Password)]
        public required string Password { get; set; }
        [DataType(DataType.Password)]
        public required string ConfirmPassword { get; set; }
    }
    public class EditarUsuario
    {
        public required string Id { get; set; }
        [StringLength(18, ErrorMessage = "O {0} deve ser preenchido corretamente.", MinimumLength = 3)]
        public required string Nome { get; set; }
        public string? Sobrenome { get; set; }
        [StringLength(14, ErrorMessage = "O {0} deve ser preenchido corretamente.", MinimumLength = 11)]
        public required string CPF { get; set; }
        [StringLength(15, ErrorMessage = "O {0} deve ser preenchido corretamente.", MinimumLength = 10)]
        public required string Telefone { get; set; }
        public DateTime DataNascimento { get; set; }
        [EmailAddress]
        public required string Email { get; set; }
    }
    public class RegistrarCliente
    {
        [StringLength(18, ErrorMessage = "O {0} deve ser preenchido corretamente.", MinimumLength = 3)]
        public required string Nome { get; set; }
        public string? Sobrenome { get; set; }
        [StringLength(14, ErrorMessage = "O {0} deve ser preenchido corretamente.", MinimumLength = 11)]
        public required string CPF { get; set; }
        [StringLength(15, ErrorMessage = "O {0} deve ser preenchido corretamente.", MinimumLength = 10)]
        public required string Telefone { get; set; }
        public DateTime DataNascimento { get; set; }
        public required string Email { get; set; }
        public int ComercioId { get; set; }
        public int tipoEnvio { get; set; }
    }
    public class TokenResponse
    {
        public required string Token { get; set; }
        public required string Expiracao { get; set; }
        public string? Permissao { get; set; }
    }
}
