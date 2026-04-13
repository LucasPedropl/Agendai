import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

export default function CadastroComercioPage() {
  const navigate = useNavigate();
  const { token, userType } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    comercioNome: '',
    comercioCnpj: '',
    comercioEndereco: '',
    comercioTelefone: '',
    comercioEmail: ''
  });

  const formatCNPJ = (value: string) => {
    return value
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d{1,2})/, '$1-$2')
      .replace(/(-\d{2})\d+?$/, '$1');
  };

  const formatTelefone = (value: string) => {
    const v = value.replace(/\D/g, '');
    if (v.length <= 10) {
      return v
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4})(\d)/, '$1-$2')
        .replace(/(-\d{4})\d+?$/, '$1');
    }
    return v
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2')
      .replace(/(-\d{4})\d+?$/, '$1');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    if (e.target.id === 'comercioTelefone') {
      value = formatTelefone(value);
    } else if (e.target.id === 'comercioCnpj') {
      value = formatCNPJ(value);
    }
    setFormData({ ...formData, [e.target.id]: value });
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const comercioPayload = {
        nome: formData.comercioNome,
        endereco: formData.comercioEndereco,
        telefone: formData.comercioTelefone.replace(/\D/g, ''),
        cnpj: formData.comercioCnpj.replace(/\D/g, ''),
        email: formData.comercioEmail,
        notificarAgendamento: true,
        lembrarAgendamento: true,
        resumoDiario: true
      };

      await fetchApi('/api/Comercios', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(comercioPayload)
      });
      
      // Redirect to dashboard after successful commerce registration
      navigate('/estabelecimento/dashboard');
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao cadastrar comércio. Verifique os dados e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Configurar Comércio</h1>
        <p className="text-gray-600">
          Para continuar, precisamos de algumas informações sobre o seu estabelecimento.
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
            {error}
          </div>
        )}
        
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="comercioNome">Nome do Comércio</label>
          <Input id="comercioNome" required placeholder="Ex: Salão Beleza Pura" value={formData.comercioNome} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="comercioCnpj">CNPJ</label>
          <Input id="comercioCnpj" required placeholder="00.000.000/0000-00" maxLength={18} value={formData.comercioCnpj} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="comercioEndereco">Endereço Completo</label>
          <Input id="comercioEndereco" required placeholder="Ex: Av. Paulista, 1000, Centro, São Paulo - SP" value={formData.comercioEndereco} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="comercioTelefone">Telefone do Comércio</label>
          <Input id="comercioTelefone" required placeholder="(00) 00000-0000" maxLength={15} value={formData.comercioTelefone} onChange={handleChange} />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="comercioEmail">Email do Comércio</label>
          <Input id="comercioEmail" type="email" required placeholder="contato@empresa.com" value={formData.comercioEmail} onChange={handleChange} />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Finalizar Cadastro'}
        </Button>
      </form>
    </div>
  );
}
