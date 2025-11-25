import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, Shield, Edit3, Heart } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import PreferencesSelector from '../components/features/PreferencesSelector';

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useUserStore();

  if (!user) {
    navigate('/');
    return null;
  }

  const isAdmin = user.role_id === 1;

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-10">
      {/* Profile Header Card */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl dark:shadow-gray-900/50 overflow-hidden border border-gray-100 dark:border-gray-700 relative group">
        {/* Background Banner */}
        <div className="h-48 bg-gradient-to-r from-cyan-500 to-blue-600 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30"></div>
        </div>

        {/* Profile Content */}
        <div className="px-8 pb-8 relative">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-20 mb-6">
            {/* Avatar */}
            <div className="relative">
              <div className="h-40 w-40 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-cyan-500 to-blue-600 shadow-2xl ring-4 ring-white dark:ring-gray-800 z-10">
                {user.name.charAt(0).toUpperCase()}
              </div>
              {isAdmin && (
                <div className="absolute bottom-2 right-2 bg-amber-400 text-amber-900 p-2 rounded-full shadow-lg border-2 border-white dark:border-gray-800" title="Administrador">
                  <Shield className="h-6 w-6" />
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex-1 pt-4 md:pt-0">
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-1">{user.name}</h1>
              <p className="text-lg text-gray-500 dark:text-gray-400 font-medium flex items-center gap-2">
                @{user.username}
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                <span className="text-sm text-cyan-600 dark:text-cyan-400">Miembro activo</span>
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-4 md:mt-0">
              <button className="px-5 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2">
                <Edit3 className="h-4 w-4" />
                Editar Perfil
              </button>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {/* Email */}
            <div className="p-5 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-cyan-200 dark:hover:border-cyan-800 transition-colors group/item">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-cyan-600 dark:text-cyan-400 group-hover/item:scale-110 transition-transform">
                  <Mail className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Correo Electrónico</span>
              </div>
              <p className="text-gray-900 dark:text-white font-semibold truncate" title={user.email || ''}>{user.email}</p>
            </div>

            {/* Age */}
            <div className="p-5 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-cyan-200 dark:hover:border-cyan-800 transition-colors group/item">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-cyan-600 dark:text-cyan-400 group-hover/item:scale-110 transition-transform">
                  <User className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Edad</span>
              </div>
              <p className="text-gray-900 dark:text-white font-semibold">{user.age ? `${user.age} años` : 'No especificada'}</p>
            </div>

            {/* Member Since */}
            <div className="p-5 bg-gray-50 dark:bg-gray-700/30 rounded-2xl border border-gray-100 dark:border-gray-700 hover:border-cyan-200 dark:hover:border-cyan-800 transition-colors group/item">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm text-cyan-600 dark:text-cyan-400 group-hover/item:scale-110 transition-transform">
                  <Calendar className="h-5 w-5" />
                </div>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Miembro desde</span>
              </div>
              <p className="text-gray-900 dark:text-white font-semibold">
                {new Date(user.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Preferences Section */}
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-lg dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl shadow-lg text-white">
              <Heart className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Tus Gustos e Intereses</h2>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Selecciona las categorías que te interesan para recibir mejores recomendaciones</p>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-6 border border-gray-100 dark:border-gray-700">
            <PreferencesSelector userId={user.id} />
          </div>
        </div>
      </div>
    </div>
  );
}