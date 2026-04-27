import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface CadastroComercioPageProps {
  onSuccess?: () => void;
}

export default function CadastroComercioPage({ onSuccess }: CadastroComercioPageProps) {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    endereco: '',
    telefone: '',
    email: '',
    descricao: '',
    instagram: '',
    facebook: '',
    site: '',
    notificarAgendamento: true,
    lembrarAgendamento: true,
    resumoDiario: true
  });
  const [image, setImage] = useState<File | null>(null);

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [id]: checked }));
      return;
    }

    let finalValue = value;
    if (id === 'telefone') {
      finalValue = formatTelefone(value);
    } else if (id === 'cnpj') {
      finalValue = formatCNPJ(value);
    }
    setFormData(prev => ({ ...prev, [id]: finalValue }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const data = new FormData();
      data.append('Nome', formData.nome);
      data.append('Endereco', formData.endereco);
      data.append('Telefone', formData.telefone.replace(/\D/g, ''));
      data.append('CNPJ', formData.cnpj.replace(/\D/g, ''));
      data.append('Email', formData.email);
      data.append('Descricao', formData.descricao);
      data.append('Instagram', formData.instagram);
      data.append('Facebook', formData.facebook);
      data.append('Site', formData.site);
      data.append('NotificarAgendamento', String(formData.notificarAgendamento));
      data.append('LembrarAgendamento', String(formData.lembrarAgendamento));
      data.append('ResumoDiario', String(formData.resumoDiario));
      
      if (image) {
        data.append('Image', image);
      } else {
        data.append('Image', '');
      }

      await fetchApi('/api/Comercios', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data
      });
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao cadastrar comércio. Verifique os dados e tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">Configurar Comércio</h1>
        <p className="text-sm text-gray-600">
          Precisamos de algumas informações sobre o seu estabelecimento.
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        {error && (
          <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
            {error}
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="nome">Nome do Comércio</label>
            <Input id="nome" required placeholder="Ex: Salão Beleza Pura" value={formData.nome} onChange={handleChange} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="cnpj">CNPJ</label>
            <Input id="cnpj" required placeholder="00.000.000/0000-00" maxLength={18} value={formData.cnpj} onChange={handleChange} />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="endereco">Endereço Completo</label>
          <Input id="endereco" required placeholder="Ex: Av. Paulista, 1000, Centro, São Paulo - SP" value={formData.endereco} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="telefone">Telefone</label>
            <Input id="telefone" required placeholder="(00) 00000-0000" maxLength={15} value={formData.telefone} onChange={handleChange} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="email">Email</label>
            <Input id="email" type="email" required placeholder="contato@empresa.com" value={formData.email} onChange={handleChange} />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="descricao">Descrição</label>
          <textarea 
            id="descricao" 
            rows={2}
            className="flex w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Conte um pouco sobre o seu negócio..."
            value={formData.descricao}
            onChange={handleChange}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="instagram">Instagram</label>
            <Input id="instagram" placeholder="@seu-perfil" value={formData.instagram} onChange={handleChange} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="facebook">Facebook</label>
            <Input id="facebook" placeholder="facebook.com/perfil" value={formData.facebook} onChange={handleChange} />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium" htmlFor="site">Site</label>
            <Input id="site" placeholder="www.seu-site.com" value={formData.site} onChange={handleChange} />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-sm font-medium" htmlFor="image">Logo / Imagem</label>
          <Input id="image" type="file" accept="image/*" onChange={handleFileChange} />
        </div>

        <div className="space-y-3 bg-gray-50 p-3 rounded-lg">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Configurações de Notificação</p>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" id="notificarAgendamento" checked={formData.notificarAgendamento} onChange={handleChange} className="rounded" />
              <span className="text-sm">Notificar sobre novos agendamentos</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" id="lembrarAgendamento" checked={formData.lembrarAgendamento} onChange={handleChange} className="rounded" />
              <span className="text-sm">Lembrar clientes de seus agendamentos</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" id="resumoDiario" checked={formData.resumoDiario} onChange={handleChange} className="rounded" />
              <span className="text-sm">Enviar resumo diário de compromissos</span>
            </label>
          </div>
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? 'Salvando...' : 'Finalizar Cadastro'}
        </Button>

        <Button 
          type="button" 
          variant="outline" 
          className="w-full border-dashed border-gray-400 text-gray-500 hover:text-gray-700" 
          onClick={() => {
            const randomString = Math.random().toString(36).substring(2, 8);
            const randomPhone = `279${Array.from({ length: 8 }, () => Math.floor(Math.random() * 10)).join('')}`;
            setFormData({
              ...formData,
              nome: `Comércio ${randomString}`,
              cnpj: '12.345.678/0001-90',
              endereco: 'Rua Teste, 123, Centro',
              telefone: formatTelefone(randomPhone),
              email: formData.email || `contato_${randomString}@example.com`,
              descricao: 'Descrição de teste para este comércio criado automaticamente.',
              instagram: '@teste_insta',
              facebook: 'fb.com/teste',
              site: 'www.teste.com',
              notificarAgendamento: true,
              lembrarAgendamento: true,
              resumoDiario: true
            });
          }}
        >
          Preencher Dados Aleatórios (Dev)
        </Button>
      </form>
    </div>
  );
}
