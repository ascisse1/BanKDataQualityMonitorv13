import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useForm } from 'react-hook-form';
import { Lock, Save, ArrowLeft } from 'lucide-react';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { useNotification } from '../../context/NotificationContext';

interface ChangePasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const ChangePasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  
  const { 
    register, 
    handleSubmit, 
    watch,
    formState: { errors } 
  } = useForm<ChangePasswordFormData>();
  
  const newPassword = watch('newPassword');
  
  const onSubmit = async (data: ChangePasswordFormData) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      showNotification('Changement du mot de passe en cours...', 'loading');
      
      const response = await fetch(`/api/users/${user.id}/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user.token}`
        },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        })
      });
      
      if (response.ok) {
        showNotification('Mot de passe modifié avec succès', 'success');
        navigate(-1); // Retour à la page précédente
      } else {
        const errorData = await response.json();
        showNotification(errorData.error || 'Erreur lors du changement de mot de passe', 'error');
      }
    } catch (error) {
      console.error('Error changing password:', error);
      showNotification('Erreur lors du changement de mot de passe', 'error');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="max-w-md mx-auto py-8 animate-fade-in">
      <Card>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-semibold text-gray-900">Changer mon mot de passe</h1>
            <Button
              variant="ghost"
              size="sm"
              leftIcon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => navigate(-1)}
            >
              Retour
            </Button>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              type="password"
              label="Mot de passe actuel"
              leftIcon={<Lock className="h-4 w-4 text-gray-400" />}
              {...register('currentPassword', { 
                required: 'Le mot de passe actuel est requis' 
              })}
              error={errors.currentPassword?.message}
              fullWidth
            />
            
            <Input
              type="password"
              label="Nouveau mot de passe"
              leftIcon={<Lock className="h-4 w-4 text-gray-400" />}
              {...register('newPassword', { 
                required: 'Le nouveau mot de passe est requis',
                minLength: {
                  value: 8,
                  message: 'Le mot de passe doit contenir au moins 8 caractères'
                }
              })}
              error={errors.newPassword?.message}
              fullWidth
            />
            
            <Input
              type="password"
              label="Confirmer le nouveau mot de passe"
              leftIcon={<Lock className="h-4 w-4 text-gray-400" />}
              {...register('confirmPassword', { 
                required: 'Veuillez confirmer le mot de passe',
                validate: value => value === newPassword || 'Les mots de passe ne correspondent pas'
              })}
              error={errors.confirmPassword?.message}
              fullWidth
            />
            
            <div className="pt-4">
              <Button
                type="submit"
                variant="primary"
                leftIcon={<Save className="h-4 w-4" />}
                isLoading={isLoading}
                fullWidth
              >
                Enregistrer le nouveau mot de passe
              </Button>
            </div>
          </form>
          
          <div className="mt-6 text-sm text-gray-500">
            <p>Conseils pour un mot de passe sécurisé :</p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Utilisez au moins 8 caractères</li>
              <li>Combinez lettres majuscules et minuscules</li>
              <li>Incluez des chiffres et des caractères spéciaux</li>
              <li>Évitez les informations personnelles facilement devinables</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ChangePasswordPage;