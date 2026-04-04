import { useState } from 'react';
import { Save } from 'lucide-react';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import type { Agency } from './types';

interface AgencyUserEditorProps {
  agencies: Agency[];
  onSave: (user: any) => void;
  onCancel: () => void;
}

const AgencyUserEditor: React.FC<AgencyUserEditorProps> = ({ agencies, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    fullName: '',
    password: '',
    structureCode: '',
    structureName: ''
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

    if (!formData.password.trim()) {
      newErrors.password = 'Le mot de passe est requis';
    }

    if (!formData.structureCode) {
      newErrors.structureCode = 'Le code agence est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAgencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const structureCode = e.target.value;
    const selectedAgency = agencies.find(a => a.code_agence === structureCode);

    setFormData({
      ...formData,
      structureCode,
      structureName: selectedAgency?.lib_agence || '',
      username: structureCode ? `agency_${structureCode.toLowerCase()}` : '',
      email: structureCode ? `agence.${structureCode.toLowerCase()}@banque.ml` : '',
      fullName: selectedAgency ? `Utilisateur Agence ${selectedAgency.lib_agence}` : ''
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Nouvel utilisateur d'agence
          </h3>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Agence
            </label>
            <select
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              value={formData.structureCode}
              onChange={handleAgencyChange}
              required
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
            label="Mot de passe"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={errors.password}
            required
          />
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
            Creer
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AgencyUserEditor;
