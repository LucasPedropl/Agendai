'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Plus, Edit, Trash2, Phone } from 'lucide-react';
import { Profissional } from '@/types';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';

export default function AdminProfissionaisPage() {
  const { token, user } = useAuth();
  const { showToast } = useToast();
  const [profissionais, setProfissionais] = useState<Profissional[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProfissionais = async () => {
    setIsLoading(true);
    try {
      const commerceId = (user as any)?.id || 1;
      const data = await fetchApi(`/api/ComercioUsuarios/Profissionais/${commerceId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        skipToast: true
      } as any);
      setProfissionais(Array.isArray(data) ? data : (data ? [data] : []));
    } catch (err) {
      console.error("Erro ao buscar profissionais:", err);
      setProfissionais([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchProfissionais();
    }
  }, [token]);

  const handleInviteProfissional = async (e: React.FormEvent) => {
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
          permissao: 1 // Profissional
        }),
        skipToast: true
      } as any);

      setIsModalOpen(false);
      setNome('');
      setEmail('');
      showToast('Convite enviado com sucesso para o profissional!', 'success');
      fetchProfissionais();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Erro ao convidar profissional.', 'error');
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
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Profissionais</h1>
          <p className="text-gray-500">Gerencie sua equipe e especialidades.</p>
        </div>
        <Button className="w-full sm:w-auto" onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Convidar Profissional
        </Button>
      </div>

      {profissionais.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-12 border-dashed">
          <p className="text-gray-500 mb-4">Nenhum profissional cadastrado.</p>
          <Button variant="outline" onClick={() => setIsModalOpen(true)}>Adicionar Primeiro Profissional</Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {profissionais.map((profissional) => (
            <Card key={profissional.id} className="overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-lg">
                      {profissional.nome.charAt(0)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{profissional.nome}</CardTitle>
                      {profissional.status && (
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium mt-1 ${
                          profissional.status.toLowerCase() === 'ativo' 
                            ? 'bg-green-100 text-green-800' 
                            : profissional.status.toLowerCase() === 'pendente'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {profissional.status}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    {profissional.telefone || 'Sem telefone'}
                  </div>
                </div>
                <div className="mt-6 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <Edit className="mr-2 h-4 w-4" /> Editar
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                    <Trash2 className="mr-2 h-4 w-4" /> Remover
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Convidar Profissional">
        <form onSubmit={handleInviteProfissional} className="space-y-4">
          <p className="text-sm text-gray-500">
            Enviaremos um convite por e-mail para que o profissional realize seu cadastro e tenha acesso ao painel.
          </p>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="nome">Nome Completo</label>
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
    </div>
  );
}
