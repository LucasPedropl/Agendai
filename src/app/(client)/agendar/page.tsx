import React, { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { demoEstabelecimentos, demoServicos } from '@/lib/demoData';

export default function AgendarPage() {
  const [step, setStep] = useState(1);
  const [estabelecimentos, setEstabelecimentos] = useState<any[]>([]);
  const [servicos, setServicos] = useState<any[]>([]);
  const [selectedEstabelecimento, setSelectedEstabelecimento] = useState<any>(null);
  const [selectedServico, setSelectedServico] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Modo Demo
  const isDemo = true;

  useEffect(() => {
    if (isDemo) {
      setEstabelecimentos(demoEstabelecimentos);
    } else {
      loadEstabelecimentos();
    }
  }, [isDemo]);

  const loadEstabelecimentos = async () => {
    setLoading(true);
    try {
      const data = await fetchApi('/api/Comercios');
      setEstabelecimentos(data);
    } catch (error) {
      console.error("Erro ao carregar estabelecimentos:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEstabelecimento = (est: any) => {
    setSelectedEstabelecimento(est);
    if (isDemo) {
      setServicos(demoServicos[est.id as keyof typeof demoServicos] || []);
    } else {
      // Carregar serviços da API...
    }
    setStep(2);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Agendar Serviço</h1>
      
      {step === 1 && (
        <div>
          <h2 className="text-xl mb-4">Escolha um estabelecimento:</h2>
          <div className="grid gap-4">
            {estabelecimentos.map((est) => (
              <button 
                key={est.id}
                onClick={() => handleSelectEstabelecimento(est)}
                className="p-4 border rounded-lg hover:bg-gray-50 text-left"
              >
                <h3 className="font-bold">{est.nome}</h3>
                <p className="text-sm text-gray-600">{est.endereco}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 2 && selectedEstabelecimento && (
        <div>
          <h2 className="text-xl mb-4">Escolha um serviço em {selectedEstabelecimento.nome}:</h2>
          <div className="grid gap-4">
            {servicos.map((serv) => (
              <button 
                key={serv.id}
                onClick={() => { setSelectedServico(serv); setStep(3); }}
                className="p-4 border rounded-lg hover:bg-gray-50 text-left"
              >
                <h3 className="font-bold">{serv.nome}</h3>
                <p className="text-sm text-gray-600">{serv.duracao} - R$ {serv.preco.toFixed(2)}</p>
              </button>
            ))}
          </div>
          <button onClick={() => setStep(1)} className="mt-4 text-blue-600 underline">Voltar</button>
        </div>
      )}
    </div>
  );
}
