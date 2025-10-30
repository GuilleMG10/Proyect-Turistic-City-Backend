import { useNavigate } from 'react-router-dom';
import { User, Mail, Calendar, Shield } from 'lucide-react';
import { useUserStore } from '../store/userStore';
import PreferencesSelector from '../components/PreferencesSelector';

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useUserStore();

  if (!user) {
    navigate('/');
    return null;
  }

  const isAdmin = user.role_id === 1;

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-6 py-8">
              <div className="flex items-center gap-6">
                {/* Avatar */}
                <div className="h-24 w-24 bg-white rounded-full flex items-center justify-center text-4xl font-bold text-blue-600 shadow-lg flex-shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                {/* User Info */}
                <div className="flex-1 text-white">
                  <h2 className="text-3xl font-bold">{user.name}</h2>
                  <p className="text-blue-100 text-lg mt-1">@{user.username}</p>
                  {isAdmin && (
                    <div className="inline-flex items-center gap-2 mt-3 px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-sm font-semibold">
                      <Shield className="h-4 w-4" />
                      Administrador
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* User Details */}
            <div className="px-6 py-6 space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Información Personal
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Email */}
                {user.email && (
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <Mail className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Correo Electrónico</p>
                      <p className="text-gray-900 font-medium break-all">{user.email}</p>
                    </div>
                  </div>
                )}

                {/* Age */}
                {user.age && (
                  <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                    <Calendar className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-gray-500">Edad</p>
                      <p className="text-gray-900 font-medium">{user.age} años</p>
                    </div>
                  </div>
                )}

                {/* Username */}
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Usuario</p>
                    <p className="text-gray-900 font-medium">@{user.username}</p>
                  </div>
                </div>

                {/* Account Created */}
                <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-gray-500">Miembro desde</p>
                    <p className="text-gray-900 font-medium">
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
          </div>

      {/* Preferences Section */}
      <div className="bg-white rounded-xl shadow-lg px-6 py-8">
        <PreferencesSelector userId={user.id} />
      </div>
    </div>
  );
}