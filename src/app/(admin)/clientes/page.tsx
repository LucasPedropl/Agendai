import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Mail, Phone, Calendar } from 'lucide-react';
import { Cliente } from '@/types';

export default function AdminClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setClientes([
        { id: '1', nome: 'Ana Souza', email: 'ana@email.com', telefone: '(11) 98888-1111', totalAgendamentos: 15, ultimoAgendamento: '2023-10-20', tipo: 'cliente' },
        { id: '2', nome: 'Carlos Mendes', email: 'carlos@email.com', telefone: '(11) 98888-2222', totalAgendamentos: 5, ultimoAgendamento: '2023-10-15', tipo: 'cliente' },
        { id: '3', nome: 'Mariana Lima', email: 'mariana@email.com', telefone: '(11) 98888-3333', totalAgendamentos: 2, ultimoAgendamento: '2023-09-10', tipo: 'cliente' },
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Clientes</h1>
          <p className="text-gray-500">Gerencie sua base de clientes e histórico.</p>
        </div>
        <div className="flex w-full max-w-sm items-center gap-2">
          <Input type="text" placeholder="Buscar cliente..." className="w-full" />
          <Button variant="outline" size="icon">
            <Search className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de Clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3">Nome / Contato</th>
                  <th scope="col" className="px-6 py-3 text-center">Total de Agendamentos</th>
                  <th scope="col" className="px-6 py-3">Último Agendamento</th>
                  <th scope="col" className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="border-b bg-white hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                          {cliente.nome.charAt(0)}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{cliente.nome}</div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {cliente.email}</span>
                            <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {cliente.telefone}</span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center font-medium text-gray-900">
                      {cliente.totalAgendamentos}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {cliente.ultimoAgendamento ? new Date(cliente.ultimoAgendamento).toLocaleDateString('pt-BR') : '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button variant="outline" size="sm">Ver Histórico</Button>
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
