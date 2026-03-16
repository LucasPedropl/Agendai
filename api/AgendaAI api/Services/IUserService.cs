using AgendaAi.Models;
using AgendaAi.ViewModels;

namespace AgendaAi.Services
{
    public interface IUserService
    {
        public string GerarToken(UsuarioDto usuario);
    }
}
