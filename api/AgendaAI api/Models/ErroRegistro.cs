namespace AgendaAi.Models
{
    public class ErroRegistro
    {
        public string? RequestId { get; set; }

        public bool ShowRequestId => !string.IsNullOrEmpty(RequestId);

        public static void LogError(string message)
        {
            try
            {
                string diretorio = Directory.GetCurrentDirectory();
                diretorio = diretorio + "/wwwroot/ErroRegistro/erros.txt";

                using (StreamWriter writer = new StreamWriter(diretorio, true))
                {
                    writer.WriteLine($"{DateTime.Now}: {message}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Erro ao registrar no arquivo de log: {ex.Message}");
            }
        }
    }
}
