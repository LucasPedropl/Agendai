import { Outlet, Link } from 'react-router-dom';
import { Sparkles, Calendar, Users, TrendingUp } from 'lucide-react';

const features = [
  { icon: Calendar, text: 'Agendamentos inteligentes' },
  { icon: Users, text: 'Gestão de clientes e equipe' },
  { icon: TrendingUp, text: 'Controle financeiro integrado' },
];

export function AuthLayout() {
  return (
    <div className="min-h-screen flex bg-background">
      <div className="hidden lg:flex w-1/2 auth-gradient text-white p-12 flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-72 h-72 rounded-full bg-primary blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-purple-500 blur-3xl" />
        </div>

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-2xl font-extrabold tracking-tight">Agendai</span>
        </div>

        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight">
              Gerencie seu negócio com facilidade.
            </h1>
            <p className="text-white/70 text-lg max-w-md">
              A plataforma completa para agendamentos, finanças e gestão de clientes.
            </p>
          </div>
          <ul className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-white/80">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative z-10 text-sm text-white/40">
          &copy; {new Date().getFullYear()} Agendai. Todos os direitos reservados.
        </p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="lg:hidden flex items-center gap-2 mb-8">
          <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center text-primary-foreground">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="text-xl font-extrabold">Agendai</span>
        </div>
        <div className="w-full max-w-md">
          <Outlet />
        </div>
        <p className="mt-8 text-xs text-muted-foreground lg:hidden">
          <Link to="/" className="hover:text-primary transition-colors">Voltar ao início</Link>
        </p>
      </div>
    </div>
  );
}
