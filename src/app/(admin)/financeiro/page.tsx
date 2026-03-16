import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, ArrowUpRight, ArrowDownRight, DollarSign, Calendar } from 'lucide-react';
import { Transacao } from '@/types';

export default function AdminFinanceiroPage() {
  const [transacoes, setTransacoes] = useState<Transacao[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setTimeout(() => {
      setTransacoes([
        { id: '1', descricao: 'Corte de Cabelo - João Silva', valor: 50, data: '2023-10-25', status: 'pago', servico: 'Corte de Cabelo' },
        { id: '2', descricao: 'Barba - Pedro Souza', valor: 30, data: '2023-10-25', status: 'pendente', servico: 'Barba' },
        { id: '3', descricao: 'Aluguel do Espaço', valor: -1500, data: '2023-10-05', status: 'pago' },
        { id: '4', descricao: 'Produtos de Limpeza', valor: -200, data: '2023-10-10', status: 'pago' },
      ]);
      setIsLoading(false);
    }, 1000);
  }, []);

  if (isLoading) {
    return <div className="flex h-full items-center justify-center p-8"><div className="h-8 w-8 animate-spin rounded-full border-b-2 border-indigo-600"></div></div>;
  }

  const totalEntradas = transacoes.filter(t => t.valor > 0 && t.status === 'pago').reduce((acc, t) => acc + t.valor, 0);
  const totalSaidas = transacoes.filter(t => t.valor < 0 && t.status === 'pago').reduce((acc, t) => acc + Math.abs(t.valor), 0);
  const saldo = totalEntradas - totalSaidas;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Financeiro</h1>
          <p className="text-gray-500">Acompanhe suas receitas e despesas.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="w-full sm:w-auto text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
            <Plus className="mr-2 h-4 w-4" /> Despesa
          </Button>
          <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700">
            <Plus className="mr-2 h-4 w-4" /> Receita
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Atual</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              R$ {saldo.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entradas (Mês)</CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              R$ {totalEntradas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saídas (Mês)</CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">
              R$ {totalSaidas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimas Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-500">
              <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3">Descrição</th>
                  <th scope="col" className="px-6 py-3">Data</th>
                  <th scope="col" className="px-6 py-3">Status</th>
                  <th scope="col" className="px-6 py-3 text-right">Valor (R$)</th>
                </tr>
              </thead>
              <tbody>
                {transacoes.map((transacao) => (
                  <tr key={transacao.id} className="border-b bg-white hover:bg-gray-50">
                    <td className="px-6 py-4 font-medium text-gray-900">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${transacao.valor > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                          {transacao.valor > 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                        </div>
                        {transacao.descricao}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        {new Date(transacao.data).toLocaleDateString('pt-BR')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        transacao.status === 'pago' ? 'bg-green-100 text-green-800' : 
                        transacao.status === 'pendente' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {transacao.status.charAt(0).toUpperCase() + transacao.status.slice(1)}
                      </span>
                    </td>
                    <td className={`px-6 py-4 text-right font-medium ${transacao.valor > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {transacao.valor > 0 ? '+' : ''}{transacao.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
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
