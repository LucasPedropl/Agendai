import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Servico } from '@/types';

export default function AdminServicosPage() {
  const [servicos, setServicos] = useState<Servico[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setServicos([
        { id: '1', nome: 'Corte de Cabelo', duracao: '45 min', preco: '50,00', categoria: 'Cabelo', ativo: true },
        { id: '2', nome: 'Barba', duracao: '30 min', preco: '30,00', categoria: 'Barba', ativo: true },
        { id: '3', nome: 'Sobrancelha', duracao: '15 min', preco: '20,00', categoria: 'Rosto', ativo: false },
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Serviços</h1>
          <p className="text-gray-500">Gerencie os serviços oferecidos.</p>
        </div>
        <Button className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Novo Serviço
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Serviços</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3">Nome</th>
                  <th scope="col" className="px-6 py-3">Categoria</th>
                  <th scope="col" className="px-6 py-3">Duração</th>
                  <th scope="col" className="px-6 py-3">Preço (R$)</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {servicos.map((servico) => (
                  <tr key={servico.id} className="border-b bg-white hover:bg-gray-50">
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">{servico.nome}</td>
                    <td className="px-6 py-4">{servico.categoria}</td>
                    <td className="px-6 py-4">{servico.duracao}</td>
                    <td className="px-6 py-4">{servico.preco}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        servico.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {servico.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="ghost" size="icon" className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-900 hover:bg-red-50">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
