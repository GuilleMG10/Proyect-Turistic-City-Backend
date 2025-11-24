import React, { useState } from 'react';
import { X, User, Lock, Mail, Calendar } from 'lucide-react';
import { useUserStore } from '../../store/userStore';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

type Mode = 'login' | 'register';

export default function LoginModal({ isOpen, onClose }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    age: '',
  });

  const { login, register, isLoading, error } = useUserStore();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    try {
      if (mode === 'login') {
        await login(formData.username, formData.password);
        onClose();
      } else {
        const registerData: {
          name: string;
          username: string;
          password: string;
          email?: string;
          age?: number;
        } = {
          name: formData.name,
          username: formData.username,
          password: formData.password,
        };
        
        if (formData.email) registerData.email = formData.email;
        if (formData.age) registerData.age = parseInt(formData.age);

        await register(registerData);
        onClose();
      }
    } catch {
      setLocalError(error || 'Ocurrió un error. Por favor intenta de nuevo.');
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setLocalError(null);
    setFormData({
      username: '',
      password: '',
      name: '',
      email: '',
      age: '',
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-2xl overflow-hidden ring-1 ring-black/5">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-cyan-500 to-blue-600 px-8 py-10 text-center">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors backdrop-blur-sm"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
          
          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
            {mode === 'login' ? '¡Hola de nuevo!' : 'Únete a nosotros'}
          </h2>
          <p className="text-cyan-50 text-sm font-medium">
            {mode === 'login' 
              ? 'Ingresa para continuar tu aventura' 
              : 'Crea una cuenta y descubre lugares increíbles'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {localError && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm font-medium flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
              {localError}
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                Nombre completo
              </label>
              <div className="relative group">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-cyan-500 transition-colors" />
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                  placeholder="Juan Pérez"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="username" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Usuario
            </label>
            <div className="relative group">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-cyan-500 transition-colors" />
              <input
                id="username"
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                placeholder={mode === 'login' ? 'Ingresa tu usuario' : 'Elige un nombre de usuario'}
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Contraseña
            </label>
            <div className="relative group">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-cyan-500 transition-colors" />
              <input
                id="password"
                type="password"
                required
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                placeholder="••••••••"
                minLength={mode === 'register' ? 6 : undefined}
              />
            </div>
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Email <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-cyan-500 transition-colors" />
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                    placeholder="tu@email.com"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="age" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  Edad <span className="text-gray-400 font-normal">(opcional)</span>
                </label>
                <div className="relative group">
                  <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-cyan-500 transition-colors" />
                  <input
                    id="age"
                    type="number"
                    min="1"
                    max="150"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full pl-11 pr-4 py-3 border border-gray-200 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-gray-900/50 text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:bg-white dark:focus:bg-gray-800 transition-all"
                    placeholder="25"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl transition-all shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/40 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:ring-offset-2 mt-2"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Procesando...
              </span>
            ) : (
              mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'
            )}
          </button>
        </form>

        {/* Switch Mode */}
        <div className="px-8 pb-8 text-center">
          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">o</span>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}{' '}
            <button
              type="button"
              onClick={switchMode}
              className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-700 dark:hover:text-cyan-300 font-bold focus:outline-none focus:underline transition-colors"
            >
              {mode === 'login' ? 'Regístrate gratis' : 'Inicia sesión aquí'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
