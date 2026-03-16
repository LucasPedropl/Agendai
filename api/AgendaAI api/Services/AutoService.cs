namespace AgendaAi.Services
{
    public class TokenRefreshWorker : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;

        public TokenRefreshWorker(IServiceProvider serviceProvider)
        {
            _serviceProvider = serviceProvider;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                using (var scope = _serviceProvider.CreateScope())
                {
                    var authService = scope.ServiceProvider.GetRequiredService<AuthService>();
                    await authService.RefreshTokenAsync();
                }

                // Aguarda 24 horas antes da próxima execução
                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);
            }
        }
    }
}
