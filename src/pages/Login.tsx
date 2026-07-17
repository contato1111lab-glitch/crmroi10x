import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, Lock, Loader2, Key, User, Hash } from 'lucide-react';
import { toast } from '../lib/toast';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [codigo, setCodigo] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegistering) {
        if (!username || !password || !codigo) {
          throw new Error("Preencha todos os campos obrigatórios.");
        }
        await signUp(username, password, codigo);
        toast.success(`Conta criada com sucesso! Bem-vindo, ${username}!`);
      } else {
        if (!username || !password) {
          throw new Error("Preencha nome de usuário e senha.");
        }
        await signIn(username, password);
        toast.success(`Login realizado com sucesso!`);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="flex items-baseline justify-center gap-1 mb-2">
            <span className="text-4xl font-bold text-gray-300 tracking-tight">CRM ROI</span>
            <span className="text-6xl font-black text-blue-500 tracking-tighter">10X</span>
          </h1>
          <p className="text-gray-400 font-medium">Acesso Restrito ao Sistema</p>
        </div>

        <div className="bg-[#111] border border-gray-800 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-50 pointer-events-none">
            <Shield className="w-32 h-32 text-gray-800/30" strokeWidth={1} />
          </div>
          
          <form onSubmit={handleSubmit} className="relative z-10 space-y-4">
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Nome de Usuário</label>
              <div className="relative">
                <User className="w-5 h-5 text-gray-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="Seu usuário"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Senha</label>
              <div className="relative">
                <Key className="w-5 h-5 text-gray-500 absolute left-3 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {isRegistering && (
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Código de Convite</label>
                <div className="relative">
                  <Hash className="w-5 h-5 text-blue-500/50 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className="w-full bg-[#0A0A0A] border border-blue-500/30 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:border-blue-500 transition-colors"
                    placeholder="Código de uso único"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-6 shadow-[0_0_20px_rgba(37,99,235,0.2)]"
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Lock className="w-5 h-5" />
                  {isRegistering ? 'Criar Conta' : 'Entrar no Sistema'}
                </>
              )}
            </button>
          </form>

          <div className="relative z-10 mt-6 text-center">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(!isRegistering);
                // Clear fields when toggling
                setUsername('');
                setCodigo('');
              }}
              className="text-sm text-gray-400 hover:text-white transition-colors underline decoration-gray-800 hover:decoration-gray-400 underline-offset-4"
            >
              {isRegistering 
                ? 'Já possui uma conta? Faça login.' 
                : 'Novo usuário? Criar conta com código.'}
            </button>
          </div>
        </div>
        
        <p className="text-center text-xs text-gray-600 mt-8 font-mono">
          As ações realizadas neste sistema são auditadas e rastreadas.
        </p>
      </div>
    </div>
  );
}
