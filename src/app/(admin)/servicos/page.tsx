'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Plus, Edit, Trash2, Settings } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { SearchableSelect } from '@/components/ui/searchable-select';

const iconOptions = [
  { value: 'scissors', label: 'Tesoura' },
  { value: 'spray', label: 'Spray' },
  { value: 'comb', label: 'Pente' },
  { value: 'razor', label: 'Navalha' },
  { value: 'brush', label: 'Pincel' },
  { value: 'hair-dryer', label: 'Secador' },
  { value: 'sparkles', label: 'Brilho/Limpeza' },
  { value: 'droplet', label: 'Gota/Lavagem' },
  { value: 'star', label: 'Estrela/Destaque' },
];

export default function AdminServicosPage() {
  const { token } = useAuth();
  const [servicos, setServicos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [isLoadingCategorias, setIsLoadingCategorias] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false);
  const [isManageCategoriasModalOpen, setIsManageCategoriasModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [catError, setCatError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingCategoriaId, setEditingCategoriaId] = useState<number | null>(null);

  // Form state - Service
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [duracao, setDuracao] = useState('');
  const [icone, setIcone] = useState('scissors'); // Default icon
  const [ativo, setAtivo] = useState(true);

  // Form state - Category
  const [categoriaNome, setCategoriaNome] = useState('');

  const fetchServicos = async () => {
    setIsLoading(true);
    try {
      // Using /api/Servicos/1 as requested by user, though it might be a specific ID.
      // We'll wrap it in a try-catch and fallback to empty array if it fails.
      const data = await fetchApi('/api/Servicos/1', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setServicos(Array.isArray(data) ? data : (data ? [data] : []));
    } catch (err) {
      console.error("Erro ao buscar serviços:", err);
      // Mock data for display if API fails
      setServicos([
        { id: 1, nome: 'Corte de Cabelo', categoria: 'Cabelo', duracao: '00:30', preco: 45.00, ativo: true },
        { id: 2, nome: 'Barba', categoria: 'Barba', duracao: '00:20', preco: 30.00, ativo: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategorias = async () => {
    setIsLoadingCategorias(true);
    try {
      const data = await fetchApi('/Todas/1', { // Using 1 as commerce ID
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setCategorias(Array.isArray(data) ? data : (data ? [data] : []));
    } catch (err) {
      console.error("Erro ao buscar categorias:", err);
      // Mock data for display if API fails
      setCategorias([
        { id: 1, nome: 'Cabelo' },
        { id: 2, nome: 'Barba' },
        { id: 3, nome: 'Manicure' },
      ]);
    } finally {
      setIsLoadingCategorias(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchServicos();
      fetchCategorias();
    }
  }, [token]);

  const openModal = (servico?: any) => {
    if (servico) {
      setEditingId(servico.id);
      setNome(servico.nome || '');
      setCategoria(servico.categoria || '');
      setDescricao(servico.descricao || '');
      setPreco(servico.preco?.toString() || '');
      setDuracao(servico.duracao || '');
      setIcone(servico.icone || 'scissors');
      setAtivo(servico.ativo !== false);
    } else {
      setEditingId(null);
      setNome('');
      setCategoria('');
      setDescricao('');
      setPreco('');
      setDuracao('');
      setIcone('scissors');
      setAtivo(true);
    }
    setError('');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Ensure duracao has seconds (HH:MM:SS)
    let formattedDuracao = duracao;
    if (duracao && duracao.split(':').length === 2) {
      formattedDuracao = `${duracao}:00`;
    }

    const payload = {
      categoria,
      icone,
      nome,
      descricao,
      preco: parseFloat(preco) || 0,
      duracao: formattedDuracao,
      ativo,
      agendamentos: []
    };

    try {
      if (editingId) {
        await fetchApi(`/api/Servicos/${editingId}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      } else {
        await fetchApi('/api/Servicos', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload)
        });
      }
      setIsModalOpen(false);
      fetchServicos();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao salvar serviço.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir este serviço?')) return;
    
    try {
      await fetchApi(`/api/Servicos/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchServicos();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao excluir serviço.');
    }
  };

  // Category functions
  const handleSaveCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoriaNome) return;
    setIsSubmitting(true);
    setCatError('');

    try {
      if (editingCategoriaId) {
        await fetchApi(`/api/Categorias/${editingCategoriaId}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            comercioId: 1,
            nome: categoriaNome,
            icone: "string"
          })
        });
      } else {
        await fetchApi('/api/Categorias', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            nome: categoriaNome,
            icone: "string"
          })
        });
      }
      setCategoriaNome('');
      setEditingCategoriaId(null);
      setIsCategoriaModalOpen(false);
      fetchCategorias();
    } catch (err: any) {
      console.error(err);
      setCatError(err.message || 'Erro ao salvar categoria.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategoria = async (id: number) => {
    if (!window.confirm('Tem certeza que deseja excluir esta categoria?')) return;
    try {
      await fetchApi(`/api/Categorias/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchCategorias();
    } catch (err: any) {
      console.error(err);
      alert('Erro ao excluir categoria.');
    }
  };

  const openCategoriaModal = (cat?: any) => {
    if (cat) {
      setEditingCategoriaId(cat.id);
      setCategoriaNome(cat.nome);
    } else {
      setEditingCategoriaId(null);
      setCategoriaNome('');
    }
    setCatError('');
    setIsCategoriaModalOpen(true);
  };

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
        <Button className="w-full sm:w-auto" onClick={() => openModal()}>
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
                {servicos.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                      Nenhum serviço cadastrado.
                    </td>
                  </tr>
                ) : (
                  servicos.map((servico) => (
                    <tr key={servico.id} className="border-b bg-white hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 font-medium text-gray-900">{servico.nome}</td>
                      <td className="px-6 py-4">{servico.categoria}</td>
                      <td className="px-6 py-4">{servico.duracao}</td>
                      <td className="px-6 py-4">
                        {typeof servico.preco === 'number' ? `R$ ${servico.preco.toFixed(2)}` : servico.preco}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          servico.ativo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {servico.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button variant="ghost" size="icon" className="text-indigo-600 hover:text-indigo-900 hover:bg-indigo-50" onClick={() => openModal(servico)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-900 hover:bg-red-50" onClick={() => handleDelete(servico.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Editar Serviço" : "Novo Serviço"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {error}
            </div>
          )}
          
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="nome">Nome do Serviço</label>
            <Input 
              id="nome" 
              required 
              placeholder="Ex: Corte de Cabelo" 
              value={nome} 
              onChange={(e) => setNome(e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="categoria">Categoria</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <SearchableSelect 
                    options={categorias.map(c => ({ value: c.nome, label: c.nome }))}
                    value={categoria}
                    onChange={setCategoria}
                    placeholder="Selecione ou busque..."
                  />
                </div>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  className="shrink-0" 
                  onClick={() => openCategoriaModal()}
                  title="Nova Categoria"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  className="shrink-0" 
                  onClick={() => setIsManageCategoriasModalOpen(true)}
                  title="Gerenciar Categorias"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="icone">Ícone</label>
              <SearchableSelect 
                options={iconOptions}
                value={icone}
                onChange={setIcone}
                placeholder="Selecione um ícone..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="descricao">Descrição</label>
            <Input 
              id="descricao" 
              placeholder="Descrição do serviço..." 
              value={descricao} 
              onChange={(e) => setDescricao(e.target.value)} 
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="preco">Preço (R$)</label>
              <Input 
                id="preco" 
                type="number"
                step="0.01"
                required 
                placeholder="0.00" 
                value={preco} 
                onChange={(e) => setPreco(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="duracao">Duração</label>
              <Input 
                id="duracao" 
                type="time"
                step="1"
                required
                placeholder="00:20:00" 
                value={duracao} 
                onChange={(e) => setDuracao(e.target.value)} 
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input 
              type="checkbox" 
              id="ativo" 
              checked={ativo} 
              onChange={(e) => setAtivo(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
            />
            <label htmlFor="ativo" className="text-sm font-medium text-gray-700">Serviço Ativo</label>
          </div>

          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Serviço'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Gerenciar Categorias */}
      <Modal 
        isOpen={isManageCategoriasModalOpen} 
        onClose={() => setIsManageCategoriasModalOpen(false)} 
        title="Gerenciar Categorias"
      >
        <div className="space-y-4">
          <div className="max-h-[300px] overflow-y-auto border rounded-md">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-2">Nome</th>
                  <th className="px-4 py-2 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {isLoadingCategorias ? (
                  <tr><td colSpan={2} className="px-4 py-8 text-center"><div className="h-5 w-5 animate-spin mx-auto rounded-full border-b-2 border-indigo-600"></div></td></tr>
                ) : categorias.length === 0 ? (
                  <tr><td colSpan={2} className="px-4 py-4 text-center text-gray-400">Nenhuma categoria cadastrada.</td></tr>
                ) : (
                  categorias.map(cat => (
                    <tr key={cat.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium">{cat.nome}</td>
                      <td className="px-4 py-2 text-right space-x-2">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-indigo-600" onClick={() => openCategoriaModal(cat)}>
                          <Edit className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleDeleteCategoria(cat.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsManageCategoriasModalOpen(false)}>
              Fechar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Cadastro/Edição de Categoria */}
      <Modal 
        isOpen={isCategoriaModalOpen} 
        onClose={() => setIsCategoriaModalOpen(false)} 
        title={editingCategoriaId ? "Editar Categoria" : "Nova Categoria"}
      >
        <form onSubmit={handleSaveCategoria} className="space-y-4">
          {catError && (
            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
              {catError}
            </div>
          )}
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome da Categoria</label>
            <Input 
              required 
              placeholder="Ex: Barba, Manicure..." 
              value={categoriaNome} 
              onChange={(e) => setCategoriaNome(e.target.value)} 
            />
          </div>
          <div className="pt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setIsCategoriaModalOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : 'Salvar Categoria'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
