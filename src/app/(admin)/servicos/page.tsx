'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Modal } from '@/components/ui/modal';
import { Plus, Edit, Trash2, Clock, Tag } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { normalizeApiList } from '@/lib/apiHelpers';
import { useAuth } from '@/contexts/AuthContext';
import { useComercioId } from '@/hooks/useComercioId';
import { useToast } from '@/contexts/ToastContext';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { PageHeader } from '@/components/ui/page-header';
import { PageLoader } from '@/components/ui/page-loader';
import { EmptyState } from '@/components/ui/empty-state';
import { StatusBadge } from '@/components/ui/status-badge';

export default function AdminServicosPage() {
  const { token } = useAuth();
  const { comercioId, isLoading: isComercioLoading } = useComercioId();
  const { showToast } = useToast();
  const [servicos, setServicos] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categorias, setCategorias] = useState<any[]>([]);
  const [isLoadingCategorias, setIsLoadingCategorias] = useState(false);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCategoriaModalOpen, setIsCategoriaModalOpen] = useState(false);
  const [isManageCategoriasModalOpen, setIsManageCategoriasModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingCategoriaId, setEditingCategoriaId] = useState<number | null>(null);

  // Form state - Service
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('');
  const [descricao, setDescricao] = useState('');
  const [preco, setPreco] = useState('');
  const [duracao, setDuracao] = useState('');
  const [ativo, setAtivo] = useState(true);

  // Form state - Category
  const [categoriaNome, setCategoriaNome] = useState('');

  const fetchServicos = async (id?: number, silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const activeId = id ?? comercioId;
      if (!activeId) {
        setServicos([]);
        return;
      }
      const data = await fetchApi(`/api/Servicos/Todos/${activeId}`, {
        skipToast: true,
        notFoundAsEmpty: true,
      });
      setServicos(normalizeApiList(data));
    } catch (err) {
      console.error('Erro ao buscar serviços:', err);
      setServicos([]);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const fetchCategorias = async (id?: number, silent = false) => {
    if (!silent) setIsLoadingCategorias(true);
    try {
      const activeId = id ?? comercioId;
      if (!activeId) {
        setCategorias([]);
        return;
      }
      const data = await fetchApi(`/api/Categorias/Todas/${activeId}`, {
        skipToast: true,
        notFoundAsEmpty: true,
      });
      setCategorias(normalizeApiList(data));
    } catch (err) {
      console.error('Erro ao buscar categorias:', err);
      setCategorias([]);
    } finally {
      if (!silent) setIsLoadingCategorias(false);
    }
  };

  useEffect(() => {
    if (isComercioLoading) return;
    if (!comercioId) {
      setIsLoading(false);
      setServicos([]);
      setCategorias([]);
      return;
    }
    fetchServicos(comercioId);
    fetchCategorias(comercioId);
  }, [comercioId, isComercioLoading]);

  const openModal = (servico?: any) => {
    if (servico) {
      setEditingId(servico.id);
      setNome(servico.nome || '');
      
      // Como a API não retorna o ID da categoria no ServicoGetDTO, 
      // buscamos o ID localmente pelo nome para pré-selecionar no modal
      const firstCatName = servico.categorias?.[0]?.nome;
      const localCat = categorias.find(c => c.nome === firstCatName);
      setCategoria(localCat?.id?.toString() || '');
      
      setDescricao(servico.descricao || '');
      setPreco(servico.preco?.toString() || '');
      setDuracao(servico.duracao || '');
      setAtivo(servico.ativo !== false);
    } else {
      setEditingId(null);
      setNome('');
      setCategoria('');
      setDescricao('');
      setPreco('');
      setDuracao('');
      setAtivo(true);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Ensure duracao has seconds (HH:MM:SS)
    let formattedDuracao = duracao;
    if (duracao && duracao.split(':').length === 2) {
      formattedDuracao = `${duracao}:00`;
    }

    if (!comercioId) {
      showToast('Nenhum comércio vinculado à sua conta.', 'error');
      setIsSubmitting(false);
      return;
    }

    const activeCommerceId = comercioId;

    // Find category ID from category name if necessary, 
    // but we'll try to store ID directly in state if it fits better.
    const selectedCat = categorias.find(c => c.nome === categoria || c.id.toString() === categoria);
    const catId = selectedCat ? parseInt(selectedCat.id) : 0;

    const payload = {
      comercioId: activeCommerceId,
      categoria: [
        {
          idCategoria: catId
        }
      ],
      icone: "string",
      nome,
      servico: nome, // Adding this because API said it's required
      descricao,
      preco: parseFloat(preco) || 0,
      duracao: formattedDuracao,
      ativo
    };

    try {
      if (editingId) {
        await fetchApi(`/api/Servicos/${editingId}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload),
          skipToast: true
        } as any);
      } else {
        await fetchApi('/api/Servicos', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: JSON.stringify(payload),
          skipToast: true
        } as any);
      }
      setIsModalOpen(false);
      showToast(editingId ? 'Serviço atualizado com sucesso!' : 'Serviço criado com sucesso!', 'success');
      setTimeout(() => fetchServicos(undefined, true), 500);
    } catch (err: any) {
      console.error("Full Submit Error:", err);
      showToast(err.message || 'Erro ao salvar serviço.', 'error');
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
      showToast('Serviço excluído com sucesso!', 'success');
      fetchServicos();
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao excluir serviço.', 'error');
    }
  };

  // Category functions
  const handleSaveCategoria = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoriaNome) return;
    setIsSubmitting(true);

    try {
      if (!comercioId) {
        showToast('Nenhum comércio vinculado à sua conta.', 'error');
        setIsSubmitting(false);
        return;
      }

      const activeCommerceId = comercioId;
      if (editingCategoriaId) {
        await fetchApi(`/api/Categorias/${editingCategoriaId}`, {
          method: 'PUT',
          headers: { 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            comercioId: activeCommerceId,
            nome: categoriaNome,
            icone: "string"
          }),
          skipToast: true
        } as any);
      } else {
        await fetchApi('/api/Categorias', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({
            comercioId: activeCommerceId,
            nome: categoriaNome,
            icone: "string"
          }),
          skipToast: true
        } as any);
      }
      setCategoriaNome('');
      setEditingCategoriaId(null);
      setIsCategoriaModalOpen(false);
      showToast('Categoria salva com sucesso!', 'success');
      setTimeout(() => fetchCategorias(undefined, true), 500);
    } catch (err: any) {
      console.error("Save Category Error:", err);
      showToast(err.message || 'Erro ao salvar categoria.', 'error');
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
      showToast('Categoria excluída com sucesso!', 'success');
      fetchCategorias();
    } catch (err: any) {
      console.error(err);
      showToast('Erro ao excluir categoria.', 'error');
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
    setIsCategoriaModalOpen(true);
  };

  const getCategoriaNome = (servico: { categorias?: { nome: string }[]; categoria?: string }) =>
    servico.categorias?.[0]?.nome ?? servico.categoria ?? 'Sem categoria';

  const formatPreco = (preco: number | string | undefined) =>
    typeof preco === 'number' ? `R$ ${preco.toFixed(2)}` : preco ?? '—';

  const formatDuracao = (duracao: string | undefined) => {
    if (!duracao) return '—';
    const parts = duracao.split(':');
    if (parts.length >= 2) return `${parts[0]}h ${parts[1]}min`;
    return duracao;
  };

  if (isLoading || isComercioLoading) {
    return <PageLoader label="Carregando serviços..." />;
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Serviços" description="Gerencie os serviços oferecidos pelo estabelecimento.">
        <Button onClick={() => openModal()}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Serviço
        </Button>
      </PageHeader>

      {servicos.length === 0 ? (
        <EmptyState
          icon={Tag}
          title="Nenhum serviço cadastrado"
          description="Cadastre seu primeiro serviço para disponibilizá-lo na agenda."
          actionLabel="Novo Serviço"
          onAction={() => openModal()}
        />
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {servicos.map((servico) => (
            <Card key={servico.id} className="overflow-hidden hover:border-primary/30 transition-colors">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <CardTitle className="text-base truncate">{servico.nome}</CardTitle>
                    <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
                      <Tag className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{getCategoriaNome(servico)}</span>
                    </div>
                  </div>
                  <StatusBadge
                    label={servico.ativo !== false ? 'Ativo' : 'Inativo'}
                    variant={servico.ativo !== false ? 'success' : 'neutral'}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {servico.descricao && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{servico.descricao}</p>
                )}
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    {formatDuracao(servico.duracao)}
                  </div>
                  <span className="font-bold text-foreground">{formatPreco(servico.preco)}</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openModal(servico)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20"
                    onClick={() => handleDelete(servico.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? "Editar Serviço" : "Novo Serviço"}>
        <form onSubmit={handleSubmit} className="space-y-4">
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

          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="categoria">Categoria</label>
            <SearchableSelect 
              options={categorias.filter(c => c && c.nome).map(c => ({ value: c.id.toString(), label: c.nome }))}
              value={categoria}
              onChange={setCategoria}
              placeholder="Pesquise ou selecione uma categoria"
              onAdd={() => openCategoriaModal()}
              onSettings={() => setIsManageCategoriasModalOpen(true)}
            />
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
