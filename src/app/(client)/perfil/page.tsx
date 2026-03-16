import React, { useState, useEffect } from 'react';
import { User, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useClientProfile } from '@/hooks/useClientProfile';

export default function ClientProfilePage() {
  const { user } = useAuth();
  const { getPerfil, updatePerfil, isLoading, error } = useClientProfile();
  const [successMsg, setSuccessMsg] = useState('');
  
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    telefone: '',
    dataNascimento: '',
  });

  useEffect(() => {
    loadPerfil();
  }, [user]);

  const loadPerfil = async () => {
    const userId = user?.id || 'demo-user-id';
    const data = await getPerfil(userId);
    if (data) {
      setFormData({
        nome: data.nome || '',
        email: data.email || '',
        telefone: data.telefone || '',
        dataNascimento: data.dataNascimento ? data.dataNascimento.split('T')[0] : '',
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('');
    const userId = user?.id || 'demo-user-id';
    const success = await updatePerfil(userId, formData);
    if (success) {
      setSuccessMsg('Perfil atualizado com sucesso!');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <User className="h-6 w-6 text-blue-600" />
          Meu Perfil
        </h1>
        <p className="text-sm text-slate-500 mt-1">Gerencie suas informações pessoais.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md text-sm">
          {error}
        </div>
      )}

      {successMsg && (
        <div className="bg-green-50 text-green-600 p-4 rounded-md text-sm flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5" />
          {successMsg}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900">Informações Pessoais</h2>
        </div>
        
        <form onSubmit={handleSave} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label htmlFor="nome" className="block text-sm font-medium text-slate-700">
                Nome Completo
              </label>
              <input
                type="text"
                id="nome"
                value={formData.nome}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                E-mail
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="telefone" className="block text-sm font-medium text-slate-700">
                Telefone
              </label>
              <input
                type="text"
                id="telefone"
                value={formData.telefone}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="dataNascimento" className="block text-sm font-medium text-slate-700">
                Data de Nascimento
              </label>
              <input
                type="date"
                id="dataNascimento"
                value={formData.dataNascimento}
                onChange={handleChange}
                className="w-full border border-slate-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
