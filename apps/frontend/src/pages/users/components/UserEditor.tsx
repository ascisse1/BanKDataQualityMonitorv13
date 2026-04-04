import { useState } from 'react';
import { Save } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { User, Agency } from './types';

interface UserEditorProps {
  user: User | null;
  agencies: Agency[];
  onSave: (user: any) => void;
  onCancel: () => void;
}

const UserEditor: React.FC<UserEditorProps> = ({ user, agencies, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    fullName: user?.fullName || '',
    role: user?.role || 'USER',
    department: user?.department || '',
    status: user?.status || 'ACTIVE',
    structureCode: user?.structureCodes?.[0] || '',
    password: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Le nom d\'utilisateur est requis';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'L\'email est requis';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Le nom complet est requis';
    }

    if (!user && !formData.password.trim()) {
      newErrors.password = 'Le mot de passe est requis pour un nouvel utilisateur';
    }

    if (formData.role === 'AGENCY_USER' && !formData.structureCode) {
      newErrors.structureCode = 'Le code agence est requis pour un utilisateur d\'agence';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      const userData = user ? { ...user, ...formData } : formData;
      onSave(userData);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {user ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <Input
            label="Nom d'utilisateur"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            error={errors.username}
            required
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={errors.email}
            required
          />

          <Input
            label="Nom complet"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            error={errors.fullName}
            required
          />

          <Input
            label="Departement"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
          />

          {!user && (
            <Input
              label="Mot de passe"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              error={errors.password}
              required
            />
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
            >
              <option value="USER">Utilisateur</option>
              <option value="AGENCY_USER">Utilisateur Agence</option>
              <option value="AUDITOR">Auditeur</option>
              <option value="ADMIN">Administrateur</option>
            </select>
          </div>

          {formData.role === 'AGENCY_USER' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Agence
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.structureCode}
                onChange={(e) => setFormData({ ...formData, structureCode: e.target.value })}
              >
                <option value="">Selectionner une agence</option>
                {agencies.map(agency => (
                  <option key={agency.code_agence} value={agency.code_agence}>
                    {agency.code_agence} - {agency.lib_agence}
                  </option>
                ))}
              </select>
              {errors.structureCode && (
                <p className="mt-1 text-sm text-error-500">{errors.structureCode}</p>
              )}
            </div>
          )}

          {user && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Statut
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              >
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
              </select>
            </div>
          )}
        </form>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleSubmit}
            leftIcon={<Save className="h-4 w-4" />}
          >
            {user ? 'Mettre a jour' : 'Creer'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default UserEditor;
