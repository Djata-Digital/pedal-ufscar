import { useState } from 'react';
import type { FormEvent } from 'react';

import { Bike, Lock, Mail } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useAuth } from '../contexts/AuthContext';

interface LoginResponseUser {
  id: string;
  fullName: string;
  email: string;
  userType: string;
}

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  function getRedirectPath(user: LoginResponseUser) {
    const adminTypes = ['admin', 'operator', 'mechanic'];

    if (adminTypes.includes(user.userType)) {
      return '/dashboard';
    }

    return '/public/dashboard';
  }

  async function handleLogin(event: FormEvent) {
    event.preventDefault();

    try {
      const response = await login({
        email,
        password,
      });

      const user = response?.user;

      if (!user) {
        throw new Error('Usuário não encontrado na resposta do login.');
      }

      if (['student', 'teacher', 'staff', 'outsourced_worker'].includes(user.userType)) {
        localStorage.setItem('public_access_token', response.accessToken);
        localStorage.setItem('public_user', JSON.stringify(user));
      }

      toast.success('Login realizado com sucesso!');

      navigate(getRedirectPath(user));
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          error?.message ||
          'Erro ao fazer login.',
      );
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      <div className="hidden flex-1 flex-col justify-between bg-slate-950 p-12 text-white lg:flex">
        <div>
          <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600 shadow-lg shadow-blue-950/40">
            <Bike size={34} />
          </div>

          <h1 className="mt-8 text-5xl font-black leading-tight">
            Sistema
            <br />
            PEDAL-UFSCar
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-slate-300">
            Plataforma para gestão de empréstimos de bicicletas, controle de
            usuários, equipamentos, devoluções e estatísticas operacionais.
          </p>
        </div>

        <div className="rounded-3xl bg-white/10 p-6 backdrop-blur">
          <p className="text-sm uppercase tracking-widest text-slate-400">
            Módulos disponíveis
          </p>

          <div className="mt-4 grid grid-cols-2 gap-3 text-sm font-semibold">
            <span className="rounded-xl bg-white/10 px-4 py-3">
              Usuários
            </span>
            <span className="rounded-xl bg-white/10 px-4 py-3">
              Equipamentos
            </span>
            <span className="rounded-xl bg-white/10 px-4 py-3">
              Empréstimos
            </span>
            <span className="rounded-xl bg-white/10 px-4 py-3">
              Dashboard
            </span>
          </div>
        </div>
      </div>

      <div className="flex w-full items-center justify-center p-6 lg:w-[520px]">
        <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-2xl shadow-slate-300/60">
          <div className="mb-8 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-blue-600 text-white shadow-lg shadow-blue-950/20">
              <Bike size={32} />
            </div>

            <h2 className="mt-5 text-3xl font-black text-slate-900">
              Entrar no sistema
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Acesse o PEDAL-UFSCar conforme seu perfil.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-bold text-slate-700">
                E-mail
              </span>

              <div className="relative">
                <Mail
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="email"
                  placeholder="Digite seu e-mail"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-12 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-sm font-bold text-slate-700">
                Senha
              </span>

              <div className="relative">
                <Lock
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />

                <input
                  type="password"
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-12 w-full rounded-xl border border-slate-200 pl-11 pr-4 text-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
              </div>
            </label>

            <button
              type="submit"
              className="h-12 w-full rounded-xl bg-blue-600 font-black text-white shadow-lg shadow-blue-950/20 transition hover:bg-blue-700"
            >
              Entrar
            </button>
          </form>

          <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-center">
            <p className="text-sm text-slate-500">
              Estudante ou servidor sem cadastro?{' '}
              <a
                href="/public/register"
                className="font-bold text-blue-600 hover:text-blue-700"
              >
                Criar conta
              </a>
            </p>
          </div>

          <p className="mt-8 text-center text-xs text-slate-400">
            PEDAL-UFSCar · Sistema de gestão de bicicletas
          </p>
        </div>
      </div>
    </div>
  );
}