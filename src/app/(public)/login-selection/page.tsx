import { Link } from 'react-router-dom';
import { User, Store, Briefcase } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginSelectionPage() {
  return (
    <div className="flex flex-col items-center justify-center w-full max-w-5xl mx-auto">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Como você deseja entrar?</h1>
        <p className="mt-4 text-lg text-gray-600">Selecione o seu perfil para continuar</p>
      </div>

      <div className="grid w-full gap-8 md:grid-cols-3">
        <div className="flex flex-col gap-4">
          <Link to="/login?type=cliente" className="group">
            <Card className="h-full transition-all hover:border-indigo-600 hover:shadow-lg p-6">
              <CardHeader className="text-center p-0">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <User className="h-10 w-10" />
                </div>
                <CardTitle className="text-2xl mb-4">Sou Cliente</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Quero agendar serviços, ver meu histórico e gerenciar meus favoritos.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link to="/app" className="text-center text-sm font-medium text-indigo-600 hover:underline">
            Entrar como Convidado (Demo)
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          <Link to="/login?type=profissional" className="group">
            <Card className="h-full transition-all hover:border-indigo-600 hover:shadow-lg p-6">
              <CardHeader className="text-center p-0">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Briefcase className="h-10 w-10" />
                </div>
                <CardTitle className="text-2xl mb-4">Sou Profissional</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Quero gerenciar meus atendimentos, horários e clientes.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link to="/app" className="text-center text-sm font-medium text-indigo-600 hover:underline">
            Entrar como Convidado (Demo)
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          <Link to="/login?type=estabelecimento" className="group">
            <Card className="h-full transition-all hover:border-indigo-600 hover:shadow-lg p-6">
              <CardHeader className="text-center p-0">
                <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Store className="h-10 w-10" />
                </div>
                <CardTitle className="text-2xl mb-4">Sou Estabelecimento</CardTitle>
                <CardDescription className="text-sm leading-relaxed">
                  Quero gerenciar minha agenda, profissionais, serviços e clientes.
                </CardDescription>
              </CardHeader>
            </Card>
          </Link>
          <Link to="/estabelecimento/dashboard" className="text-center text-sm font-medium text-indigo-600 hover:underline">
            Entrar como Convidado (Demo)
          </Link>
        </div>
      </div>
    </div>
  );
}
