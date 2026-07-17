import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

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
    // Check active sessions and sets the user
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (username: string, password: string) => {
    try {
      const email = `${username.toLowerCase().replace(/\s+/g, '')}@roi10x.com`;
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Login error:', error.message);
      throw error;
    }
  };

  const signUp = async (username: string, password: string, codigo: string) => {
    try {
      const email = `${username.toLowerCase().replace(/\s+/g, '')}@roi10x.com`;
      // 1. Verificar se o código existe e não foi usado
      const { data: codigoData, error: codigoError } = await supabase
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

      // 2. Criar o usuário no Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      });

      if (authError) {
        throw authError;
      }

      // 3. Atualizar o código como usado
      await supabase
        .from('codigos_convite')
        .update({ 
          usado: true, 
          usado_por: email,
          data_uso: new Date().toISOString()
        })
        .eq('codigo', codigo);

      // 4. Inserir na tabela de usuários (opcional, para compatibilidade com logs)
      if (authData.user) {
        await supabase
          .from('usuarios')
          .insert([{
             nome: username,
             email: email,
             senha: '***' // Não salva a senha real aqui
          }]);
      }
      
    } catch (error: any) {
      console.error('Signup error:', error.message);
      throw error;
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
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
