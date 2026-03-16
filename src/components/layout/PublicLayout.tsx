import { Outlet, Link } from 'react-router-dom';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center gap-2">
            <CalendarDays className="h-6 w-6 text-indigo-600" />
            <span className="text-xl font-bold tracking-tight text-gray-900">AgendaAi</span>
          </Link>
          <nav className="flex items-center gap-4">
            <Link to="/login-selection">
              <Button variant="ghost">Entrar</Button>
            </Link>
            <Link to="/cadastro">
              <Button>Cadastrar</Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-gray-200 bg-white py-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} AgendaAi. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  );
}
