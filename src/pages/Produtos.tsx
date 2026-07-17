import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Package, Plus, Trash2 } from 'lucide-react';
import { useOperacao } from '../context/OperacaoContext';
import { toast } from '../lib/toast';

interface Produto {
  id: string;
  nome_produto: string;
  tipo: 'Nutra' | 'Info';
  faturamento_bruto_produto: number;
  faturamento_bruto_operacao: number;
}

export default function Produtos() {
  const { operacao } = useOperacao();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [nomeProduto, setNomeProduto] = useState('');
  const [fatProduto, setFatProduto] = useState('');
  const [fatOperacao, setFatOperacao] = useState('');

  useEffect(() => {
    fetchProdutos();
  }, [operacao]);

  const fetchProdutos = async () => {
    setLoading(true);
    try {
      const tipoFiltro = operacao === 'NUTRA' ? 'Nutra' : 'Info';
      const { data, error } = await supabase
        .from('produtos')
        .select('*')
        .eq('tipo', tipoFiltro)
        .order('nome_produto', { ascending: true });
      
      if (error) throw error;
      setProdutos(data || []);
    } catch (error: any) {
      toast.error('Erro ao buscar produtos: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const isInfo = operacao === 'INFO';
      const fatProd = isInfo ? 0 : Number(fatProduto);

      const { error } = await supabase.from('produtos').insert([
        {
          nome_produto: nomeProduto,
          tipo: operacao === 'NUTRA' ? 'Nutra' : 'Info',
          faturamento_bruto_produto: fatProd,
          faturamento_bruto_operacao: Number(fatOperacao)
        }
      ]);

      if (error) throw error;

      toast.success('Produto cadastrado com sucesso!');
      setNomeProduto('');
      setFatProduto('');
      setFatOperacao('');
      fetchProdutos();
    } catch (error: any) {
      toast.error('Erro ao cadastrar produto: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;
    try {
      const { error } = await supabase.from('produtos').delete().eq('id', id);
      if (error) throw error;
      toast.success('Produto removido!');
      fetchProdutos();
    } catch (error: any) {
      toast.error('Erro ao deletar produto: ' + error.message);
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="border-b border-gray-800 pb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Package className={`w-8 h-8 ${operacao === 'NUTRA' ? 'text-emerald-500' : 'text-blue-500'}`} />
          Produtos {operacao}
        </h1>
        <p className="text-gray-400 mt-2">Cadastre e gerencie seus produtos da operação {operacao}.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="bg-[#111] border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white mb-4">Novo Produto {operacao}</h2>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Nome do Produto</label>
              <input 
                required
                type="text" 
                value={nomeProduto}
                onChange={(e) => setNomeProduto(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                placeholder="Ex: Método ou Emagrecedor"
              />
            </div>

            {operacao === 'NUTRA' && (
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Faturamento Bruto (Produto) R$</label>
                <input 
                  required
                  type="number" 
                  step="0.01"
                  value={fatProduto}
                  onChange={(e) => setFatProduto(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                  placeholder="0.00"
                />
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Valor da Comissão / Operação R$</label>
              <input 
                required
                type="number" 
                step="0.01"
                value={fatOperacao}
                onChange={(e) => setFatOperacao(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                placeholder="0.00"
              />
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className={`w-full mt-4 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 ${
                operacao === 'NUTRA' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-blue-600 hover:bg-blue-500'
              }`}
            >
              {submitting ? 'Salvando...' : <><Plus className="w-5 h-5" /> Cadastrar Produto</>}
            </button>
          </form>
        </div>

        {/* Lista */}
        <div className="lg:col-span-2">
          <div className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Produtos Cadastrados ({operacao})</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#0A0A0A] text-gray-400 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 font-medium">Nome</th>
                    {operacao === 'NUTRA' && <th className="px-6 py-4 font-medium">Fat. Produto</th>}
                    <th className="px-6 py-4 font-medium">Comissão/Fat. Op.</th>
                    <th className="px-6 py-4 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {loading ? (
                    <tr><td colSpan={operacao === 'NUTRA' ? 4 : 3} className="px-6 py-8 text-center text-gray-500">Carregando produtos...</td></tr>
                  ) : produtos.length === 0 ? (
                    <tr><td colSpan={operacao === 'NUTRA' ? 4 : 3} className="px-6 py-8 text-center text-gray-500">Nenhum produto cadastrado.</td></tr>
                  ) : (
                    produtos.map((produto) => (
                      <tr key={produto.id} className="hover:bg-gray-800/20 transition-colors">
                        <td className="px-6 py-4 font-medium text-white">{produto.nome_produto}</td>
                        {operacao === 'NUTRA' && (
                          <td className="px-6 py-4 text-gray-300">R$ {Number(produto.faturamento_bruto_produto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        )}
                        <td className="px-6 py-4 text-gray-300">R$ {Number(produto.faturamento_bruto_operacao).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleDelete(produto.id)}
                            className="text-gray-500 hover:text-red-400 transition-colors"
                            title="Excluir produto"
                          >
                            <Trash2 className="w-4 h-4 inline" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
