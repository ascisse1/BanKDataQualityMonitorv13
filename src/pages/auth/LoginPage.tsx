import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useForm } from 'react-hook-form';
import { FileText, Lock, User, Users } from 'lucide-react';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useNotification } from '../../context/NotificationContext';

interface LoginFormData {
  username: string;
  password: string;
}

const LoginPage = () => {
  const [error, setError] = useState<string | null>(null);
  const [authType, setAuthType] = useState<'local' | 'ldap'>('local');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors } 
  } = useForm<LoginFormData>();
  
  const onSubmit = async (data: LoginFormData) => {
    try {
      setIsLoading(true);
      setError(null);
      showNotification('Connexion en cours...', 'loading');

      console.log('Tentative de connexion avec:', data.username);
      console.log('Type d\'authentification:', authType);
      
      const success = await login(data.username, data.password);
      
      if (success) {
        showNotification('Connexion réussie', 'success');
        navigate('/dashboard');
      } else {
        setError('Nom d\'utilisateur ou mot de passe invalide');
        showNotification('Échec de la connexion', 'error');
      }
    } catch (err) {
      setError('Une erreur est survenue. Veuillez réessayer.');
      showNotification('Erreur de connexion', 'error');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="flex justify-center">
            <img src="/logo-bsic-2.png" alt="BSIC Bank" className="h-16 w-auto" />
          </div>
          <h2 className="mt-4 text-3xl font-bold text-gray-900">
            BSIC Bank
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Moniteur de Qualité des Données Clients
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-6 shadow-card rounded-card sm:px-10 animate-slide-up">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900">Connexion</h3>
              <p className="text-gray-500 text-sm mt-1">
                Entrez vos identifiants pour accéder au tableau de bord
              </p>
              <div className="mt-4 flex space-x-2">
                <Button
                  variant={authType === 'local' ? 'primary' : 'outline'}
                  size="sm"
                  leftIcon={<User className="h-4 w-4" />}
                  onClick={() => setAuthType('local')}
                >
                  Authentification Locale
                </Button>
                <Button
                  variant={authType === 'ldap' ? 'primary' : 'outline'}
                  size="sm"
                  leftIcon={<Users className="h-4 w-4" />}
                  onClick={() => setAuthType('ldap')}
                >
                  Authentification LDAP
                </Button>
              </div>
            </div>
            
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {error && (
                <div className="bg-error-50 border-l-4 border-error-500 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <AlertTriangle className="h-5 w-5 text-error-500" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-error-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div>
                <Input
                  label="Nom d'utilisateur"
                  {...register('username', { required: 'Le nom d\'utilisateur est requis' })}
                  error={errors.username?.message}
                  leftIcon={<User className="h-5 w-5 text-gray-400" />}
                  fullWidth
                  autoComplete="username"
                />
              </div>

              <div>
                <Input
                  label="Mot de passe"
                  type="password"
                  {...register('password', { required: 'Le mot de passe est requis' })}
                  error={errors.password?.message}
                  leftIcon={<Lock className="h-5 w-5 text-gray-400" />}
                  fullWidth
                  autoComplete="current-password"
                />
              </div>

              <div>
                <Button type="submit" isLoading={isLoading} fullWidth>
                  Se connecter
                </Button>
              </div>
            </form>
            
            <div className="mt-6 text-sm text-gray-500">
              <p className="text-center">Mode démo - Comptes disponibles:</p>
              <ul className="mt-2 space-y-1">
                {authType === 'local' ? (
                  <>
                    <li className="flex items-center">
                      <span className="inline-block w-4 h-4 mr-2 bg-primary-100 rounded-full"></span>
                      <strong>admin</strong> / admin123 (Administrateur)
                    </li>
                    <li className="flex items-center">
                      <span className="inline-block w-4 h-4 mr-2 bg-secondary-100 rounded-full"></span>
                      <strong>auditor</strong> / audit123 (Auditeur)
                    </li>
                    <li className="flex items-center">
                      <span className="inline-block w-4 h-4 mr-2 bg-gray-100 rounded-full"></span>
                      <strong>user</strong> / user123 (Utilisateur standard)
                    </li>
                    <li className="flex items-center">
                      <span className="inline-block w-4 h-4 mr-2 bg-success-100 rounded-full"></span>
                      <strong>agency_01001</strong> / agency01001 (Agence Ouagadougou Principale)
                    </li>
                    <li className="flex items-center">
                      <span className="inline-block w-4 h-4 mr-2 bg-success-100 rounded-full"></span>
                      <strong>agency_01002</strong> / agency01002 (Agence Ouagadougou Centre)
                    </li>
                    <li className="flex items-center">
                      <span className="inline-block w-4 h-4 mr-2 bg-success-100 rounded-full"></span>
                      <strong>agency_01003</strong> / agency01003 (Agence Ouagadougou Nord)
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-center">
                      <span className="inline-block w-4 h-4 mr-2 bg-primary-100 rounded-full"></span>
                      <strong>ldap_admin</strong> / ldap123 (Administrateur LDAP)
                    </li>
                    <li className="flex items-center">
                      <span className="inline-block w-4 h-4 mr-2 bg-secondary-100 rounded-full"></span>
                      <strong>ldap_auditor</strong> / ldap123 (Auditeur LDAP)
                    </li>
                  </>
                )}
              </ul>
              <p className="mt-2 text-center text-xs text-gray-400">
                Application en mode démo avec des données fictives
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const AlertTriangle = (props: any) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
      <line x1="12" y1="9" x2="12" y2="13"></line>
      <line x1="12" y1="17" x2="12.01" y2="17"></line>
    </svg>
  );
};

export default LoginPage;