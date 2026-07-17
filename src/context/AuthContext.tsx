import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabaseAdmin } from '../lib/supabase';

export interface User {
  id: string;
  nome: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<void>;
  signUp: (username: string, password: string, codigo: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('@crm10x:user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        // ignore
      }
    }
    setLoading(false);
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('usuarios')
        .select('*')
        .eq('nome', username)
        .eq('senha', password)
        .single();

      if (error || !data) {
        throw new Error('Usuário ou senha incorretos.');
      }

      const loggedUser = { id: data.id, nome: data.nome };
      setUser(loggedUser);
      localStorage.setItem('@crm10x:user', JSON.stringify(loggedUser));
    } catch (error: any) {
      console.error('Login error:', error.message);
      throw error;
    }
  };

  const signUp = async (username: string, password: string, codigo: string) => {
    try {
      // 1. Verificar se o código existe e não foi usado
      const { data: codigoData, error: codigoError } = await supabaseAdmin
        .from('codigos_convite')
        .select('*')
        .eq('codigo', codigo)
        .single();

      if (codigoError || !codigoData) {
        throw new Error('Código de convite inválido ou não encontrado.');
      }

      if (codigoData.usado) {
        throw new Error('Este código de convite já foi utilizado.');
      }

      // 2. Verificar se usuário já existe
      const { data: existingUser } = await supabaseAdmin
        .from('usuarios')
        .select('id')
        .eq('nome', username)
        .maybeSingle();

      if (existingUser) {
        throw new Error('Este nome de usuário já está em uso.');
      }

      // 3. Criar usuário
      const email = `${username.toLowerCase().replace(/\s+/g, '')}@roi10x.com`;
      const { data: newUser, error: createError } = await supabaseAdmin
        .from('usuarios')
        .insert([{
            nome: username,
            email: email,
            senha: password
        }])
        .select()
        .single();

      if (createError || !newUser) {
        throw new Error('Erro ao criar usuário: ' + createError?.message);
      }

      // 4. Atualizar o código como usado
      await supabaseAdmin
        .from('codigos_convite')
        .update({ 
          usado: true, 
          usado_por: username,
          data_uso: new Date().toISOString()
        })
        .eq('codigo', codigo);

      const loggedUser = { id: newUser.id, nome: newUser.nome };
      setUser(loggedUser);
      localStorage.setItem('@crm10x:user', JSON.stringify(loggedUser));
      
    } catch (error: any) {
      console.error('Signup error:', error.message);
      throw error;
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('@crm10x:user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
