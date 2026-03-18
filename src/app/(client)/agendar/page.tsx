import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { demoEstabelecimentos, demoServicos } from '@/lib/demoData';
import { EstablishmentCard } from '@/components/EstablishmentCard';
import { Search } from 'lucide-react';

export default function AgendarPage() {
  const [step, setStep] = useState(1);
  const [estabelecimentos, setEstabelecimentos] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [selectedEstabelecimento, setSelectedEstabelecimento] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modo Demo
  const isDemo = true;

  useEffect(() => {
    if (isDemo) {
      setEstabelecimentos(demoEstabelecimentos);
    } else {
      // loadEstabelecimentos();
    }
  }, [isDemo]);

  const handleSelectEstabelecimento = (est: any) => {
    setSelectedEstabelecimento(est);
    if (isDemo) {
      setServicos(demoServicos[est.id as keyof typeof demoServicos] || []);
    }
    setStep(2);
  };

  const filteredEstabelecimentos = estabelecimentos.filter(est =>
    est.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Estabelecimentos</h1>
            <p className="text-slate-500">Escolha um estabelecimento para ver os serviços disponíveis.</p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Pesquisar estabelecimentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredEstabelecimentos.map((est) => (
              <EstablishmentCard
                key={est.id}
                name={est.nome}
                address={est.endereco}
                rating={est.nota}
                reviews={est.avaliacoes}
                hours={est.horario}
                onClick={() => handleSelectEstabelecimento(est)}
              />
            ))}
          </div>
        </div>
      )}

      {step === 2 && selectedEstabelecimento && (
        <div className="space-y-6">
          <h2 className="text-xl font-bold">Serviços em {selectedEstabelecimento.nome}</h2>
          <div className="grid gap-4">
            {servicos.map((serv) => (
              <button 
                key={serv.id}
                onClick={() => { /* setStep(3); */ }}
                className="p-4 border border-slate-200 rounded-lg hover:bg-slate-50 text-left"
              >
                <h3 className="font-bold">{serv.nome}</h3>
                <p className="text-sm text-slate-600">{serv.duracao} - R$ {serv.preco.toFixed(2)}</p>
              </button>
            ))}
          </div>
          <button onClick={() => setStep(1)} className="text-blue-600 underline">Voltar</button>
        </div>
      )}
    </div>
  );
}
