import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Activity, Plus, Play, Pause, BarChart2, Calendar as CalendarIcon, Server, ChevronLeft, ChevronRight, Layers, X, Check } from 'lucide-react';
import { toast } from '../lib/toast';
import { useOperacao } from '../context/OperacaoContext';

interface Campanha {
  id: string;
  data_registro: string;
  nome_campanha: string;
  hora_inicio: string;
  orcamento: number;
  tipo_orcamento: 'CBO' | 'ABO';
  qtd_criativos: number;
  status: 'Ativa' | 'Pausada';
  id_bm: string;
  bm?: { nome_bm: string };
}

interface BM {
  id_bm: string;
  nome_bm: string;
}

export default function Trafego() {
  const { operacao } = useOperacao();
  const [campanhas, setCampanhas] = useState<Campanha[]>([]);
  const [bms, setBms] = useState<BM[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const getBrazilDateString = () => {
    const d = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayStr = getBrazilDateString();
  const [dataFiltro, setDataFiltro] = useState(todayStr);

  // Form states
  const [dataRegistro, setDataRegistro] = useState(todayStr);
  const [nomeCampanha, setNomeCampanha] = useState('');
  const [horaInicio, setHoraInicio] = useState('');
  const [orcamento, setOrcamento] = useState('');
  const [tipoOrcamento, setTipoOrcamento] = useState<'CBO' | 'ABO'>('CBO');
  const [nomesCriativos, setNomesCriativos] = useState('');
  const [idBm, setIdBm] = useState('');

  // Modal Criativos
  const [criativosModal, setCriativosModal] = useState<{isOpen: boolean, campanhaId: string, nomeCampanha: string}>({isOpen: false, campanhaId: '', nomeCampanha: ''});
  const [criativosList, setCriativosList] = useState<any[]>([]);
  const [loadingCriativos, setLoadingCriativos] = useState(false);

  useEffect(() => {
    fetchBms();
  }, []);

  useEffect(() => {
    fetchCampanhas();
  }, [dataFiltro, operacao]);

  const fetchBms = async () => {
    try {
      const { data, error } = await supabase.from('infraestrutura_meta').select('id_bm, nome_bm');
      if (error) throw error;
      if (data) setBms(data);
    } catch (error: any) {
      toast.error('Erro ao buscar BMs: ' + error.message);
    }
  };

  const fetchCampanhas = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('campanhas_diarias')
        .select('*, bm:infraestrutura_meta(nome_bm)')
        .eq('data_registro', dataFiltro)
        .eq('operacao', operacao === 'NUTRA' ? 'Nutra' : 'Info')
        .order('hora_inicio', { ascending: false });
      
      if (error) throw error;
      
      const mapped = (data || []).map((c: any) => ({
        ...c,
        bm: c.bm
      }));
      setCampanhas(mapped);
    } catch (error: any) {
      toast.error('Erro ao buscar campanhas: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idBm) return toast.error('Selecione uma BM');
    
    setSubmitting(true);
    
    try {
      const nomes = nomesCriativos.split(',').map(n => n.trim()).filter(Boolean);
      const qtd = nomes.length || 1;

      const { data: newCamp, error } = await supabase.from('campanhas_diarias').insert([
        {
          data_registro: dataRegistro,
          nome_campanha: nomeCampanha,
          hora_inicio: horaInicio,
          orcamento: Number(orcamento),
          tipo_orcamento: tipoOrcamento,
          qtd_criativos: qtd,
          status: 'Ativa',
          id_bm: idBm,
          operacao: operacao === 'NUTRA' ? 'Nutra' : 'Info'
        }
      ]).select('id').single();

      if (error) throw error;
      
      if (nomes.length > 0) {
         const criativosJson = JSON.stringify(nomes.map(n => ({
           id: crypto.randomUUID(),
           nome: n,
           status: 'Ativo',
           data_desativacao: null
         })));
         
         await supabase.from('system_settings').insert([{
           key: `criativos_campanha_${newCamp.id}`,
           value: criativosJson,
           description: `Criativos da campanha ${newCamp.id}`
         }]);
      }
      
      toast.success('Campanha registrada com sucesso!');
      setNomeCampanha('');
      setHoraInicio('');
      setOrcamento('');
      setTipoOrcamento('CBO');
      setNomesCriativos('');
      setIdBm('');
      
      if (dataFiltro === dataRegistro) {
        fetchCampanhas();
      } else {
        setDataFiltro(dataRegistro); 
      }
    } catch (error: any) {
      toast.error('Erro ao registrar campanha: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleStatus = async (campanha: Campanha) => {
    const newStatus = campanha.status === 'Ativa' ? 'Pausada' : 'Ativa';
    try {
      const { error } = await supabase
        .from('campanhas_diarias')
        .update({ status: newStatus })
        .eq('id', campanha.id);
        
      if (error) throw error;
      toast.success(`Campanha ${newStatus.toLowerCase()}!`);
      fetchCampanhas();
    } catch (error: any) {
      toast.error('Erro ao atualizar status: ' + error.message);
    }
  };

  useEffect(() => {
    if (criativosModal.isOpen && criativosModal.campanhaId) {
      fetchCriativos(criativosModal.campanhaId);
    }
  }, [criativosModal.isOpen, criativosModal.campanhaId]);

  const fetchCriativos = async (campanhaId: string) => {
    setLoadingCriativos(true);
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', `criativos_campanha_${campanhaId}`)
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setCriativosList(JSON.parse(data[0].value));
      } else {
        setCriativosList([]);
      }
    } catch (error: any) {
      toast.error('Erro ao buscar criativos: ' + error.message);
    } finally {
      setLoadingCriativos(false);
    }
  };

  const handleToggleCriativo = async (criativoId: string) => {
    const updatedList = criativosList.map(c => {
      if (c.id === criativoId) {
        const isAtivo = c.status === 'Ativo';
        return {
          ...c,
          status: isAtivo ? 'Inativo' : 'Ativo',
          data_desativacao: isAtivo ? todayStr : null
        };
      }
      return c;
    });

    setCriativosList(updatedList);

    try {
      const { data: existing } = await supabase
        .from('system_settings')
        .select('key')
        .eq('key', `criativos_campanha_${criativosModal.campanhaId}`);

      if (existing && existing.length > 0) {
        await supabase
          .from('system_settings')
          .update({ value: JSON.stringify(updatedList) })
          .eq('key', `criativos_campanha_${criativosModal.campanhaId}`);
      } else {
        await supabase
          .from('system_settings')
          .insert([{
            key: `criativos_campanha_${criativosModal.campanhaId}`,
            value: JSON.stringify(updatedList),
            description: `Criativos da campanha ${criativosModal.campanhaId}`
          }]);
      }
      toast.success('Status do criativo atualizado!');
    } catch (error: any) {
      toast.error('Erro ao atualizar criativo: ' + error.message);
    }
  };

  const handleDateChange = (offset: number) => {
    const d = new Date(dataFiltro + 'T12:00:00Z');
    d.setUTCDate(d.getUTCDate() + offset);
    setDataFiltro(d.toISOString().split('T')[0]);
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="border-b border-gray-800 pb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
          <Activity className="w-8 h-8 text-blue-500" />
          Tráfego Diário
        </h1>
        <p className="text-gray-400 mt-2">Coração da operação. Registre as subidas do dia e acompanhe o fluxo.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Formulário de Subida */}
        <div className="xl:col-span-1">
          <form onSubmit={handleSubmit} className="bg-[#111] border border-gray-800 rounded-xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 mb-4">
              <BarChart2 className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-white">Nova Campanha</h2>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Data de Início</label>
                <input 
                  required
                  type="date" 
                  value={dataRegistro}
                  onChange={(e) => setDataRegistro(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Hora Início</label>
                <input 
                  required
                  type="time" 
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-400">Selecione a BM</label>
                <a href="/infraestrutura" className="text-[11px] font-bold text-blue-400 hover:text-blue-300">
                  + Nova BM
                </a>
              </div>
              <div className="relative">
                <Server className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                <select 
                  required
                  value={idBm}
                  onChange={(e) => setIdBm(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 transition-all appearance-none"
                >
                  <option value="">Selecione...</option>
                  {bms.map(bm => (
                    <option key={bm.id_bm} value={bm.id_bm}>{bm.nome_bm}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Nome da Campanha</label>
              <input 
                required
                type="text" 
                value={nomeCampanha}
                onChange={(e) => setNomeCampanha(e.target.value)}
                className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 transition-all"
                placeholder="Ex: [CBO] Conversão VSL 01"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400">Tipo de Orçamento</label>
              <select 
                value={tipoOrcamento}
                onChange={(e) => setTipoOrcamento(e.target.value as 'CBO' | 'ABO')}
                className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 transition-all"
              >
                <option value="CBO">CBO</option>
                <option value="ABO">ABO</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Orçamento (R$)</label>
                <input 
                  required
                  type="number" 
                  step="0.01"
                  value={orcamento}
                  onChange={(e) => setOrcamento(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                  placeholder="0.00"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">Criativos (separados por vírgula)</label>
                <input 
                  required
                  type="text" 
                  value={nomesCriativos}
                  onChange={(e) => setNomesCriativos(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500/50 transition-all font-mono"
                  placeholder="CT01, CT02, CT03"
                />
              </div>
            </div>

            <button 
              type="submit" 
              disabled={submitting}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {submitting ? 'Registrando...' : <><Plus className="w-5 h-5" /> Registrar Subida</>}
            </button>
          </form>
        </div>

        {/* Lista de Campanhas Ativas de Hoje */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between bg-[#111] border border-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <CalendarIcon className="w-5 h-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-300">Data Base:</span>
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => handleDateChange(-1)}
                className="p-1.5 bg-[#0A0A0A] border border-gray-800 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input 
                type="date" 
                value={dataFiltro}
                onChange={(e) => setDataFiltro(e.target.value)}
                className="bg-[#0A0A0A] border border-gray-800 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500/50"
              />
              <button 
                onClick={() => handleDateChange(1)}
                className="p-1.5 bg-[#0A0A0A] border border-gray-800 rounded-lg hover:bg-gray-800 text-gray-400 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="bg-[#111] border border-gray-800 rounded-xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-gray-800 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-white">
                Campanhas {dataFiltro === todayStr ? 'de Hoje' : 'do Dia'}
              </h2>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-[#0A0A0A] text-gray-400 uppercase text-xs">
                  <tr>
                    <th className="px-6 py-4 font-medium">BM</th>
                    <th className="px-6 py-4 font-medium">Hora</th>
                    <th className="px-6 py-4 font-medium">Nome</th>
                    <th className="px-6 py-4 font-medium">Tipo</th>
                    <th className="px-6 py-4 font-medium">Orçamento</th>
                    <th className="px-6 py-4 font-medium">Criativos</th>
                    <th className="px-6 py-4 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {loading ? (
                    <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Carregando painel de tráfego...</td></tr>
                  ) : campanhas.length === 0 ? (
                    <tr><td colSpan={7} className="px-6 py-8 text-center text-gray-500">Nenhuma campanha registrada nesta data.</td></tr>
                  ) : (
                    campanhas.map((camp) => (
                      <tr key={camp.id} className="hover:bg-gray-800/20 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-blue-400">{camp.bm?.nome_bm || 'N/A'}</td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-gray-300 bg-gray-800/30 px-2 py-1 rounded">{camp.hora_inicio.substring(0,5)}</span>
                        </td>
                        <td className="px-6 py-4 font-medium text-white">{camp.nome_campanha}</td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${camp.tipo_orcamento === 'CBO' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-orange-500/10 text-orange-400 border border-orange-500/20'}`}>
                            {camp.tipo_orcamento}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-300 font-mono">
                          R$ {Number(camp.orcamento).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button 
                            onClick={() => {
                              setCriativosModal({ isOpen: true, campanhaId: camp.id, nomeCampanha: camp.nome_campanha });
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-800/50 hover:bg-gray-800 text-gray-300 rounded-lg text-xs font-medium transition-colors border border-gray-700/50"
                          >
                            <Layers className="w-3.5 h-3.5 text-blue-400" />
                            {camp.qtd_criativos}
                          </button>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleToggleStatus(camp)}
                            className={`inline-flex items-center justify-center gap-1.5 w-24 py-1.5 rounded-full text-xs font-semibold transition-colors border ${
                              camp.status === 'Ativa' 
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' 
                                : 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700'
                            }`}
                          >
                            {camp.status === 'Ativa' ? <Play className="w-3 h-3" /> : <Pause className="w-3 h-3" />}
                            {camp.status}
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

      {/* Modal Criativos */}
      {criativosModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#111] border border-gray-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-gray-800 flex justify-between items-center bg-[#0A0A0A]">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-blue-500" />
                  Gerenciar Criativos
                </h3>
                <p className="text-sm text-gray-400 mt-1">Campanha: {criativosModal.nomeCampanha}</p>
              </div>
              <button 
                onClick={() => setCriativosModal({ isOpen: false, campanhaId: '', nomeCampanha: '' })}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              {loadingCriativos ? (
                <div className="text-center py-8 text-gray-500">Carregando criativos...</div>
              ) : criativosList.length === 0 ? (
                <div className="text-center py-8 text-gray-500">Nenhum criativo nomeado para esta campanha.</div>
              ) : (
                <div className="space-y-3">
                  {criativosList.map(criativo => (
                    <div 
                      key={criativo.id} 
                      className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                        criativo.status === 'Ativo' 
                          ? 'bg-gray-800/20 border-gray-700/50' 
                          : 'bg-red-950/10 border-red-900/30 opacity-75'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium text-white">{criativo.nome}</span>
                        {criativo.data_desativacao && (
                          <span className="text-xs text-red-400 mt-0.5">Desativado em: {criativo.data_desativacao}</span>
                        )}
                      </div>
                      
                      <button
                        onClick={() => handleToggleCriativo(criativo.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-colors ${
                          criativo.status === 'Ativo'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20'
                            : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                        }`}
                      >
                        {criativo.status === 'Ativo' ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                        {criativo.status}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-5 border-t border-gray-800 bg-[#0A0A0A] flex justify-end">
              <button 
                onClick={() => setCriativosModal({ isOpen: false, campanhaId: '', nomeCampanha: '' })}
                className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
