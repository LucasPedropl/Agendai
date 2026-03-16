import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Search, Scissors, Heart, CalendarCheck, Star } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function LandingPage() {
  const categories = [
    { icon: Scissors, label: 'Barbearia' },
    { icon: Heart, label: 'Salão de Beleza' },
    { icon: CalendarCheck, label: 'Clínica' },
    { icon: Star, label: 'Estética' },
  ];

  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full bg-indigo-600 px-4 py-20 text-center text-white md:py-32">
        <h1 className="mb-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl">
          Agende seus serviços com facilidade
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-indigo-100 sm:text-xl">
          Encontre os melhores profissionais e estabelecimentos perto de você. Reserve seu horário em segundos, sem complicações.
        </p>
        
        <div className="mx-auto flex max-w-md items-center gap-2 rounded-lg bg-white p-2 shadow-lg">
          <Search className="ml-2 h-5 w-5 text-gray-400" />
          <Input 
            type="text" 
            placeholder="O que você procura?" 
            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          <Button>Buscar</Button>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-bold text-gray-900">Categorias Populares</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:gap-8">
          {categories.map((cat, i) => (
            <div key={i} className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:border-indigo-600 hover:shadow-md">
              <cat.icon className="mb-3 h-8 w-8 text-indigo-600" />
              <span className="font-medium text-gray-900">{cat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full bg-gray-50 px-4 py-16 text-center">
        <h2 className="mb-4 text-3xl font-bold text-gray-900">Você é um profissional?</h2>
        <p className="mx-auto mb-8 max-w-2xl text-gray-600">
          Junte-se a milhares de estabelecimentos que usam o AgendaAi para gerenciar suas reservas, clientes e finanças.
        </p>
        <Link to="/cadastro/estabelecimento">
          <Button size="lg" variant="outline" className="border-indigo-600 text-indigo-600 hover:bg-indigo-50">
            Cadastrar meu negócio
          </Button>
        </Link>
      </section>
    </div>
  );
}
