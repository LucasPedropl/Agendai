import { Link } from 'react-router-dom';
import { User, Store } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginSelectionPage() {
  return (
    <div className="container mx-auto flex min-h-[calc(100vh-160px)] flex-col items-center justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Como você deseja entrar?</h1>
        <p className="mt-2 text-gray-600">Selecione o seu perfil para continuar</p>
      </div>

      <div className="grid w-full max-w-3xl gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-4">
          <Link to="/login?type=cliente" className="group">
            <Card className="h-full transition-all hover:border-indigo-600 hover:shadow-md">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <User className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl">Sou Cliente</CardTitle>
                <CardDescription>
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
          <Link to="/login?type=estabelecimento" className="group">
            <Card className="h-full transition-all hover:border-indigo-600 hover:shadow-md">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-100 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Store className="h-8 w-8" />
                </div>
                <CardTitle className="text-2xl">Sou Estabelecimento</CardTitle>
                <CardDescription>
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
