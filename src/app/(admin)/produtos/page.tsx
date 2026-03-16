import React, { useState } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical,
  Edit2,
  Trash2,
  Check
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';

export default function AdminProductsPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Gerenciar Produtos</h1>
          <p className="text-slate-500">Crie e gerencie os produtos comercializados</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700">
          <Plus className="h-4 w-4 mr-2" />
          Novo Produto
        </Button>
      </div>

      {/* Empty State */}
      <Card className="flex flex-col items-center justify-center py-24 border-none shadow-sm bg-white">
        <div className="mb-6 p-6 rounded-full bg-slate-50 text-slate-400">
          <Package className="h-16 w-16" />
        </div>
        <h3 className="text-xl font-bold text-slate-900">Nenhum produto cadastrado</h3>
        <p className="text-slate-500 mt-2 mb-8 text-center max-w-xs">
          Você ainda não possui produtos cadastrados no seu estabelecimento.
        </p>
        <Button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 px-8">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Primeiro Produto
        </Button>
      </Card>

      {/* New Product Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Novo Produto"
      >
        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Nome*</label>
            <input 
              type="text" 
              placeholder="Ex: Shampoo Anticaspa"
              className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Descrição</label>
            <textarea 
              placeholder="Descreva o produto..."
              rows={3}
              className="w-full rounded-xl border border-gray-200 p-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Preço (R$)*</label>
              <input 
                type="text" 
                placeholder="0,00"
                className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Estoque*</label>
              <input 
                type="number" 
                placeholder="0"
                className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Categoria*</label>
            <select className="w-full h-11 rounded-xl border border-gray-200 px-4 text-sm focus:ring-2 focus:ring-indigo-600 outline-none transition-all bg-white">
              <option value="produto">Produto</option>
              <option value="acessorio">Acessório</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <div className="flex h-5 w-5 items-center justify-center rounded border border-indigo-600 bg-indigo-600 text-white">
              <Check className="h-3 w-3" />
            </div>
            <span className="text-sm text-slate-700">Produto ativo</span>
          </div>

          <div className="flex gap-3 pt-6">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1 h-12 rounded-xl"
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1 h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700"
            >
              Criar
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
