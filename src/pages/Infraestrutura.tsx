import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Server, Plus, Trash2, Power } from 'lucide-react';

interface BM {
  id_bm: string;
  nome_bm: string;
  perfil_dono: string;
  cartao_final: string;
  status: 'Ativa' | 'Bloqueada';
}

export default function Infraestrutura() {
  const [bms, setBms] = useState<BM[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [nomeBm, setNomeBm] = useState('');
  const [perfilDono, setPerfilDono] = useState('');
  const [cartaoFinal, setCartaoFinal] = useState('');
  const [status, setStatus] = useState<'Ativa' | 'Bloqueada'>('Ativa');

  useEffect(() => {
    fetchBms();
  }, []);

  const fetchBms = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('infraestrutura_meta')
      .select('*')
      .order('nome_bm', { ascending: true });
    
    if (error) console.error('Erro ao buscar BMs:', error);
    else setBms(data || []);
    
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    const { error } = await supabase.from('infraestrutura_meta').insert([
      {
        nome_bm: nomeBm,
        perfil_dono: perfilDono,
        cartao_final: cartaoFinal,
        status
      }
    ]);

    if (error) {
      console.error('Erro ao cadastrar BM:', error);
      alert('Erro ao cadastrar BM. Verifique o console.');
    } else {
      setNomeBm('');
      setPerfilDono('');
      setCartaoFinal('');
      setStatus('Ativa');
      fetchBms();
    }
    setSubmitting(false);
  };

  const handleToggleStatus = async (bm: BM) => {
    const newStatus = bm.status === 'Ativa' ? 'Bloqueada' : 'Ativa';
    // O Trigger no banco vai pegar este UPDATE e gerar o log no X9 automaticamente!
    const { error } = await supabase
      .from('infraestrutura_meta')
      .update({ status: newStatus })
      .eq('id_bm', bm.id_bm);
      
    if (error) console.error('Erro ao atualizar status:', error);
    else fetchBms();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta BM?')) return;
    const { error } = await supabase.from('infraestrutura_meta').delete().eq('id_bm', id);
    if (error) console.error('Erro ao deletar:', error);
    else fetchBms();
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="border-b border-gray-800 pb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Server className="w-8 h-8 text-indigo-500" />
          Infraestrutura Meta
        </h1>
        <p className="text-gray-400 mt-2">Controle da contingência: BMs, Perfis e Cartões.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulário */}
        <div className="lg:col-span-1">
          <form onSubmit={handleSubmit} className="bg-[#111] border border-gray-800 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white mb-4">Registrar BM</h2>
            
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Nome da BM</label>
              <input 
                required
                type="text" 
                value={nomeBm}
                onChange={(e) => setNomeBm(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 transition-all"
                placeholder="Ex: BM 01 - Principal"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Perfil Dono</label>
              <input 
                required
                type="text" 
                value={perfilDono}
                onChange={(e) => setPerfilDono(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500/50 transition-all"
                placeholder="Ex: Joao Silva 03"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Final do Cartão (4 dígitos)</label>
              <input 
                type="text" 
                maxLength={4}
                value={cartaoFinal}
                onChange={(e) => setCartaoFinal(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500/50 transition-all font-mono"
                placeholder="1234"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Status Inicial</label>
              <select 
                value={status}
                onChange={(e) => setStatus(e.target.value as 'Ativa' | 'Bloqueada')}
                className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-indigo-500/50 transition-all"
              >
                <option value="Ativa">Ativa</option>
                <option value="Bloqueada">Bloqueada</option>
              </select>
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full mt-4 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? 'Salvando...' : <><Plus className="w-5 h-5" /> Adicionar BM</>}
            </button>
          </form>
        </div>

        {/* Lista */}
        <div className="lg:col-span-2">
          <div className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-6 border-b border-gray-800">
              <h2 className="text-lg font-semibold text-white">Inventário de Contingência</h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#0A0A0A] text-gray-400 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 font-medium">Nome BM</th>
                    <th className="px-6 py-4 font-medium">Perfil Dono</th>
                    <th className="px-6 py-4 font-medium">Cartão</th>
                    <th className="px-6 py-4 font-medium">Status</th>
                    <th className="px-6 py-4 text-right font-medium">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {loading ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Carregando infraestrutura...</td></tr>
                  ) : bms.length === 0 ? (
                    <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Nenhuma BM registrada.</td></tr>
                  ) : (
                    bms.map((bm) => (
                      <tr key={bm.id_bm} className="hover:bg-gray-800/20 transition-colors">
                        <td className="px-6 py-4 font-medium text-white">{bm.nome_bm}</td>
                        <td className="px-6 py-4 text-gray-300">{bm.perfil_dono}</td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-gray-400 bg-gray-800/50 px-2 py-1 rounded">
                            {bm.cartao_final ? `**** ${bm.cartao_final}` : 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => handleToggleStatus(bm)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-colors border ${
                              bm.status === 'Ativa' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                                : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                            }`}
                          >
                            <Power className="w-3 h-3" />
                            {bm.status}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button 
                            onClick={() => handleDelete(bm.id_bm)}
                            className="text-gray-500 hover:text-red-400 transition-colors"
                            title="Excluir BM"
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
