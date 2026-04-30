'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Search, Mail, Phone, Calendar, Plus, UserPlus } from 'lucide-react';
import { Cliente } from '@/types';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

export default function AdminClientesPage() {
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');

  const fetchClientes = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      // Assuming endpoint for getting clientes
      const commerceId = (user as any)?.id || 1;
      const data = await fetchApi(`/api/ComercioUsuarios/Clientes/${commerceId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        skipToast: true
      } as any);
      setClientes(Array.isArray(data) ? data : (data ? [data] : []));
    } catch (err) {
      console.error("Erro ao buscar clientes:", err);
      setClientes([]);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchClientes();
    }
  }, [token]);

  const handleInviteCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const commerceId = (user as any)?.id || 1;
      await fetchApi('/api/ComercioUsuarios/Cadastrar-Funcionario-Cliente', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          idComercio: commerceId,
          nome,
          email,
          permissao: 0 // Cliente
        }),
        skipToast: true
      } as any);

      setIsModalOpen(false);
      setNome('');
      setEmail('');
      showToast('Convite enviado com sucesso!', 'success');
      // Refresh the list after a short delay to ensure DB consistency
      setTimeout(() => fetchClientes(true), 500);
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Erro ao convidar cliente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

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
        <div className="flex w-full max-sm:flex-col sm:w-auto items-center gap-2">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input type="text" placeholder="Buscar cliente..." className="pl-9 w-full" />
          </div>
          <Button className="w-full sm:w-auto whitespace-nowrap" onClick={() => setIsModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Convidar Cliente
          </Button>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Convidar Novo Cliente">
        <form onSubmit={handleInviteCliente} className="space-y-4">
          <p className="text-sm text-gray-500">
            Enviaremos um convite por e-mail para que o cliente realize o cadastro completo.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="nome">Nome do Cliente</label>
            <Input 
              id="nome" 
              required 
              placeholder="Ex: João da Silva" 
              value={nome} 
              onChange={(e) => setNome(e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="email">E-mail</label>
            <Input 
              id="email" 
              type="email"
              required 
              placeholder="exemplo@email.com" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando Convite...' : 'Enviar Convite'}
            </Button>
          </div>
        </form>
      </Modal>

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
                  <th scope="col" className="px-6 py-3 text-center">Status</th>
                  <th scope="col" className="px-6 py-3 text-center">Total de Agendamentos</th>
                  <th scope="col" className="px-6 py-3">Último Agendamento</th>
                  <th scope="col" className="px-6 py-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {clientes.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                      Nenhum cliente encontrado.
                    </td>
                  </tr>
                ) : (
                  clientes.map((cliente) => (
                    <tr key={cliente.id} className="border-b bg-white hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                            {cliente.nome.charAt(0)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{cliente.nome}</div>
                            <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                              {cliente.email && <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {cliente.email}</span>}
                              {cliente.telefone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {cliente.telefone}</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          (cliente.status || 'Pendente').toLowerCase() === 'ativo' 
                            ? 'bg-green-100 text-green-800' 
                            : (cliente.status || 'Pendente').toLowerCase() === 'pendente'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {cliente.status || 'Pendente'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-medium text-gray-900">
                        {cliente.totalAgendamentos ?? 0}
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
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
