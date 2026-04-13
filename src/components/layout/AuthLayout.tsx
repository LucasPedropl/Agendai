import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex">
      {/* Left Side: Branding/Content */}
      <div className="hidden lg:flex w-1/2 bg-slate-900 text-white p-12 flex-col justify-between">
        <div className="text-3xl font-bold">AgendaAi</div>
        <div className="space-y-4">
          <h1 className="text-4xl font-bold">Gerencie seu negócio com facilidade.</h1>
          <p className="text-slate-400 text-lg">A plataforma completa para agendamentos, finanças e gestão de clientes.</p>
        </div>
        <div className="text-sm text-slate-500">&copy; {new Date().getFullYear()} AgendaAi</div>
      </div>

      {/* Right Side: Form */}
      <div className="flex-1 flex items-center justify-center p-4 lg:p-12">
        <div className="w-full max-w-2xl flex justify-center">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
