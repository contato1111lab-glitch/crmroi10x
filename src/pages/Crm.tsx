import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Users, Phone, Calendar, X, Zap, Check, UserMinus } from 'lucide-react';
import { toast } from '../lib/toast';

interface Lead {
  id: string;
  nome_cliente: string;
  telefone: string;
  id_produto: string;
  fase_funil: string;
  data_entrada: string;
  data_prevista_entrega?: string;
}

interface Produto {
  id: string;
  nome_produto: string;
}

const FASES_FUNIL = ['Agendado', 'Pagou', 'Blacklist / Sumiu'];

export default function Crm() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);

  const getBrazilDateString = () => {
    const d = new Date(new Date().toLocaleString("en-US", {timeZone: "America/Sao_Paulo"}));
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  const todayStr = getBrazilDateString();
  
  // State for Add Lead Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [nomeCliente, setNomeCliente] = useState('');
  const [telefone, setTelefone] = useState('');
  const [dataVenda, setDataVenda] = useState(todayStr);
  const [statusRapido, setStatusRapido] = useState('Agendado');
  const [dataEntregaRapida, setDataEntregaRapida] = useState('');
  const [idProduto, setIdProduto] = useState('');
  
  // State for Agendamento Modal (Mudar Fase)
  const [agendamentoModal, setAgendamentoModal] = useState({ isOpen: false, leadId: '', novaFase: '', dataPrevista: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Buscar Leads
      const { data: leadsData, error: leadsError } = await supabase
        .from('leads_crm')
        .select('*')
        .order('data_entrada', { ascending: false });
      
      if (leadsError) throw leadsError;
      if (leadsData) setLeads(leadsData);

      // Buscar Produtos
      const { data: produtosData, error: produtosError } = await supabase
        .from('produtos')
        .select('id, nome_produto');
        
      if (produtosError) throw produtosError;
      if (produtosData) {
        setProdutos(produtosData);
        if (produtosData.length > 0 && !idProduto) setIdProduto(produtosData[0].id);
      }
    } catch (error: any) {
      toast.error('Erro ao buscar dados do CRM: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idProduto) return toast.error('Cadastre um produto primeiro!');
    if (!dataEntregaRapida) return toast.error('Informe a data de entrega!');

    const insertData: any = {
      nome_cliente: nomeCliente,
      telefone: telefone,
      id_produto: idProduto,
      fase_funil: 'Agendado',
      data_entrada: dataVenda,
      data_prevista_entrega: dataEntregaRapida
    };

    try {
      const { error } = await supabase.from('leads_crm').insert([insertData]);
      if (error) throw error;
      
      toast.success('Cliente registrado com sucesso!');
      setNomeCliente('');
      setTelefone('');
      setDataVenda(todayStr);
      setStatusRapido('Agendado');
      setDataEntregaRapida('');
      setIsAddModalOpen(false);
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao salvar cliente: ' + error.message);
    }
  };

  const handleMudarFase = async (id: string, novaFase: string) => {
    if (novaFase === 'Agendado') {
      setAgendamentoModal({ isOpen: true, leadId: id, novaFase, dataPrevista: '' });
      return;
    }

    try {
      const { error } = await supabase
        .from('leads_crm')
        .update({ fase_funil: novaFase })
        .eq('id', id);
        
      if (error) throw error;
      toast.success('Status atualizado com sucesso!');
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao atualizar status: ' + error.message);
    }
  };

  const confirmarAgendamento = async () => {
    const { leadId, novaFase, dataPrevista } = agendamentoModal;
    
    let updateData: any = { fase_funil: novaFase };
    if (dataPrevista) {
      updateData.data_prevista_entrega = dataPrevista;
    }

    try {
      const { error } = await supabase
        .from('leads_crm')
        .update(updateData)
        .eq('id', leadId);
        
      if (error) throw error;
      toast.success('Agendamento confirmado!');
      setAgendamentoModal({ isOpen: false, leadId: '', novaFase: '', dataPrevista: '' });
      fetchData();
    } catch (error: any) {
      toast.error('Erro ao agendar: ' + error.message);
    }
  };

  const getProdutoNome = (id: string) => {
    const p = produtos.find(p => p.id === id);
    return p ? p.nome_produto : 'Produto Desconhecido';
  };

  // Cores dinâmicas para as colunas do Kanban
  const getFaseColor = (fase: string) => {
    switch(fase) {
      case 'Agendado': return 'border-yellow-500 text-yellow-400';
      case 'Pagou': return 'border-emerald-500 text-emerald-400';
      case 'Blacklist / Sumiu': return 'border-red-500 text-red-400';
      default: return 'border-gray-500 text-gray-400';
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 animate-in fade-in duration-500 relative">
      {/* Modal de Novo Cliente */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-gray-800 rounded-xl p-6 w-full max-w-md shadow-2xl relative">
            <button 
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-6">Novo Cliente Expresso</h3>
            <form onSubmit={handleAddLead} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-400">Nome do Cliente</label>
                  <input 
                    required type="text"
                    value={nomeCliente} onChange={e => setNomeCliente(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-400">WhatsApp</label>
                  <input 
                    required type="text"
                    value={telefone} onChange={e => setTelefone(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-400">Data da Venda</label>
                  <input 
                    type="date" required
                    value={dataVenda} onChange={e => setDataVenda(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-purple-400">Prev. de Entrega</label>
                  <input 
                    type="date" required
                    value={dataEntregaRapida} onChange={e => setDataEntregaRapida(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-400">Produto</label>
                <select 
                  value={idProduto} onChange={e => setIdProduto(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                >
                  {produtos.map(p => <option key={p.id} value={p.id}>{p.nome_produto}</option>)}
                </select>
              </div>

              <button type="submit" className="w-full mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-lg transition-colors shadow-lg shadow-blue-500/20">
                Salvar Cliente
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Agendamento */}
      {agendamentoModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111] border border-gray-800 rounded-xl p-6 w-full max-w-sm shadow-2xl relative">
            <button 
              onClick={() => setAgendamentoModal({ isOpen: false, leadId: '', novaFase: '', dataPrevista: '' })}
              className="absolute top-4 right-4 text-gray-500 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-bold text-white mb-4">Agendar Entrega</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-400 block mb-1">Qual a data prevista de entrega?</label>
                <input 
                  type="date"
                  value={agendamentoModal.dataPrevista}
                  onChange={(e) => setAgendamentoModal({ ...agendamentoModal, dataPrevista: e.target.value })}
                  className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                />
                <p className="text-xs text-gray-500 mt-2">Deixe em branco se não houver entrega física.</p>
              </div>
              <button 
                onClick={confirmarAgendamento}
                className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-2 rounded-lg transition-colors"
              >
                Confirmar Agendamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quadro Kanban Actions */}
      <div className="flex justify-center pb-6">
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-full font-bold transition-colors shadow-[0_0_20px_rgba(37,99,235,0.2)] flex items-center gap-2"
        >
          <Users className="w-5 h-5" />
          + Adicionar Cliente
        </button>
      </div>

      {/* Quadro Kanban */}
      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-6 h-full items-start min-w-max">
          
          {loading ? (
            <div className="text-gray-500 p-8">Carregando funil...</div>
          ) : (
            FASES_FUNIL.map(fase => {
              const leadsNaFase = leads.filter(l => l.fase_funil === fase);
              
              return (
                <div key={fase} className="w-[320px] flex flex-col bg-[#0A0A0A] border border-gray-800 rounded-xl overflow-hidden shrink-0">
                  {/* Cabeçalho da Coluna */}
                  <div className={`border-t-4 bg-[#111] p-4 flex items-center justify-between ${getFaseColor(fase)}`}>
                    <h3 className="font-semibold uppercase tracking-wider text-sm">{fase}</h3>
                    <span className="bg-black/50 px-2 py-0.5 rounded-full text-xs font-bold border border-gray-800 text-white">
                      {leadsNaFase.length}
                    </span>
                  </div>

                  {/* Lista de Cards */}
                  <div className="p-3 space-y-3 min-h-[150px] overflow-y-auto">
                    {leadsNaFase.map(lead => (
                      <div key={lead.id} className="bg-[#1A1A1A] border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors shadow-lg">
                        <h4 className="font-medium text-white mb-1">{lead.nome_cliente}</h4>
                        
                        <div className="space-y-1.5 mb-4">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <Phone className="w-3 h-3" />
                            <span>{lead.telefone}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <PackageIcon className="w-3 h-3" />
                            <span className="truncate">{getProdutoNome(lead.id_produto)}</span>
                          </div>
                          {lead.data_prevista_entrega && (
                            <div className="flex items-center gap-2 text-xs text-purple-400">
                              <Calendar className="w-3 h-3" />
                              <span>Entrega: {new Date(lead.data_prevista_entrega).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>
                            </div>
                          )}
                        </div>

                        {fase !== 'Pagou' && fase !== 'Blacklist / Sumiu' && (
                          <div className="grid grid-cols-2 gap-2 mb-3">
                            <button 
                              onClick={() => handleMudarFase(lead.id, 'Pagou')}
                              className="flex items-center justify-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 text-[11px] font-medium py-1.5 rounded transition-colors"
                            >
                              <Check className="w-3 h-3" /> Pagou
                            </button>
                            <button 
                              onClick={() => handleMudarFase(lead.id, 'Blacklist / Sumiu')}
                              className="flex items-center justify-center gap-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-[11px] font-medium py-1.5 rounded transition-colors"
                            >
                              <UserMinus className="w-3 h-3" /> Sumiu
                            </button>
                          </div>
                        )}

                        <div className="pt-3 border-t border-gray-800/50 flex items-center justify-between">
                          <span className="text-[10px] text-gray-500 font-mono">
                            {new Date(lead.data_entrada).toLocaleDateString('pt-BR')}
                          </span>
                          
                          {/* Mudar Fase Fallback */}
                          <select 
                            value={lead.fase_funil}
                            onChange={(e) => handleMudarFase(lead.id, e.target.value)}
                            className="bg-[#222] text-[10px] text-gray-300 border border-gray-700 rounded px-1.5 py-1 focus:outline-none focus:border-gray-500 cursor-pointer max-w-[120px]"
                          >
                            {FASES_FUNIL.map(f => (
                              <option key={f} value={f}>{f}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                    ))}
                    
                    {leadsNaFase.length === 0 && (
                      <div className="text-center py-6 text-gray-600 text-xs border border-dashed border-gray-800 rounded-lg">
                        Nenhum lead
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

        </div>
      </div>
    </div>
  );
}

function PackageIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/></svg>
  );
}
