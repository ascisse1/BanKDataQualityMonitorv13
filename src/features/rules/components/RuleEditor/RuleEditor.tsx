import React, { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Save, Loader2, AlertCircle, ChevronDown } from 'lucide-react';
import {
  ruleFormSchema,
  RuleFormData,
  ValidationRule,
  FIELD_OPTIONS,
  CATEGORY_OPTIONS,
  SEVERITY_LABELS,
  CLIENT_TYPE_LABELS,
  RULE_TYPE_LABELS,
  RuleCondition,
} from '../../schemas/ruleSchema';
import { RuleBuilder } from '../RuleBuilder';
import Button from '../../../../components/ui/Button';
import Input from '../../../../components/ui/Input';

interface RuleEditorProps {
  rule?: ValidationRule | null;
  onSave: (data: RuleFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const RuleEditor: React.FC<RuleEditorProps> = ({
  rule,
  onSave,
  onCancel,
  isLoading = false,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const isEditing = !!rule;

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors, isDirty, isValid, isSubmitting },
  } = useForm<RuleFormData>({
    resolver: zodResolver(ruleFormSchema),
    mode: 'onChange',
    defaultValues: rule
      ? {
          name: rule.name,
          description: rule.description || '',
          field: rule.field,
          fieldLabel: rule.fieldLabel || '',
          clientType: rule.clientType || '',
          ruleType: rule.ruleType,
          ruleDefinition: rule.ruleDefinition || [],
          errorMessage: rule.errorMessage,
          severity: rule.severity,
          isActive: rule.isActive,
          category: rule.category || 'Autres',
          priority: rule.priority,
        }
      : {
          name: '',
          description: '',
          field: '',
          fieldLabel: '',
          clientType: '',
          ruleType: 'required',
          ruleDefinition: [],
          errorMessage: '',
          severity: 'medium',
          isActive: true,
          category: 'Autres',
        },
  });

  const selectedField = watch('field');
  const selectedFieldOption = FIELD_OPTIONS.find((f) => f.code === selectedField);

  // Update field label when field changes
  useEffect(() => {
    if (selectedFieldOption && !rule) {
      setValue('fieldLabel', selectedFieldOption.label);
    }
  }, [selectedFieldOption, setValue, rule]);

  const onSubmit = async (data: RuleFormData) => {
    await onSave(data);
  };

  // Field autocomplete component
  const FieldCombobox = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');

    const filteredFields = FIELD_OPTIONS.filter(
      (field) =>
        field.code.toLowerCase().includes(search.toLowerCase()) ||
        field.label.toLowerCase().includes(search.toLowerCase())
    );

    return (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Champ à contrôler <span className="text-error-500">*</span>
        </label>
        <div
          className={`flex items-center border rounded-md cursor-pointer transition-colors ${
            errors.field ? 'border-error-500' : 'border-gray-300 hover:border-gray-400'
          }`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <input
            type="text"
            value={selectedField || ''}
            readOnly
            className="flex-1 px-3 py-2 bg-transparent cursor-pointer outline-none"
            placeholder="Sélectionner un champ"
          />
          <ChevronDown className="w-4 h-4 mr-2 text-gray-400" />
        </div>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-64 overflow-hidden">
              <div className="p-2 border-b border-gray-100">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Rechercher un champ..."
                  autoFocus
                />
              </div>
              <div className="max-h-48 overflow-y-auto">
                {filteredFields.map((field) => (
                  <button
                    key={field.code}
                    type="button"
                    onClick={() => {
                      setValue('field', field.code, { shouldValidate: true });
                      setValue('fieldLabel', field.label);
                      setIsOpen(false);
                      setSearch('');
                    }}
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center justify-between ${
                      selectedField === field.code ? 'bg-primary-50 text-primary-700' : ''
                    }`}
                  >
                    <span>{field.label}</span>
                    <code className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                      {field.code}
                    </code>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {errors.field && (
          <p className="mt-1 text-sm text-error-600 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            {errors.field.message}
          </p>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-primary-50 to-secondary-50">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {isEditing ? 'Modifier la Règle' : 'Nouvelle Règle de Validation'}
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {isEditing
                ? 'Modifiez les paramètres de la règle de validation'
                : 'Créez une nouvelle règle pour contrôler la qualité des données'}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto">
          <div className="px-6 py-6 space-y-6">
            {/* Basic info section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Rule name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom de la règle <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('name')}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.name ? 'border-error-500' : 'border-gray-300'
                  }`}
                  placeholder="Ex: Numéro d'identité obligatoire"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-error-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Client type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de client
                </label>
                <select
                  {...register('clientType')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="">Tous les types</option>
                  <option value="1">{CLIENT_TYPE_LABELS['1']}</option>
                  <option value="2">{CLIENT_TYPE_LABELS['2']}</option>
                  <option value="3">{CLIENT_TYPE_LABELS['3']}</option>
                </select>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={2}
                className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                  errors.description ? 'border-error-500' : 'border-gray-300'
                }`}
                placeholder="Décrivez l'objectif de cette règle..."
              />
              {errors.description && (
                <p className="mt-1 text-sm text-error-600">{errors.description.message}</p>
              )}
            </div>

            {/* Field and rule type */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FieldCombobox />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type de règle
                </label>
                <select
                  {...register('ruleType')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {Object.entries(RULE_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Visual Rule Builder */}
            <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <Controller
                name="ruleDefinition"
                control={control}
                render={({ field }) => (
                  <RuleBuilder
                    conditions={field.value || []}
                    onChange={field.onChange}
                    fieldType={selectedFieldOption?.type}
                  />
                )}
              />
            </div>

            {/* Error message and severity */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message d'erreur <span className="text-error-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('errorMessage')}
                  className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                    errors.errorMessage ? 'border-error-500' : 'border-gray-300'
                  }`}
                  placeholder="Message affiché en cas d'erreur..."
                />
                {errors.errorMessage && (
                  <p className="mt-1 text-sm text-error-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />
                    {errors.errorMessage.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sévérité
                </label>
                <select
                  {...register('severity')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {Object.entries(SEVERITY_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Advanced options */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
              >
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`}
                />
                Options avancées
              </button>

              {showAdvanced && (
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Catégorie
                    </label>
                    <select
                      {...register('category')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                      {CATEGORY_OPTIONS.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Priorité
                    </label>
                    <input
                      type="number"
                      {...register('priority', { valueAsNumber: true })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                      placeholder="1-100 (1 = plus haute)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Condition SQL (legacy)
                    </label>
                    <textarea
                      {...register('condition')}
                      rows={2}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-mono text-sm"
                      placeholder="Ex: NOT NULL AND TRIM(field) != ''"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Active status */}
            <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="isActive"
                {...register('isActive')}
                className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">
                <span className="font-medium">Règle active</span>
                <span className="block text-gray-500">
                  Les règles inactives ne seront pas appliquées lors de la validation
                </span>
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            {isDirty ? (
              <span className="text-warning-600">Modifications non sauvegardées</span>
            ) : (
              isEditing && <span>Aucune modification</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={onCancel} disabled={isSubmitting}>
              Annuler
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit(onSubmit)}
              disabled={!isValid || isSubmitting || isLoading}
              isLoading={isSubmitting || isLoading}
              leftIcon={isSubmitting ? undefined : <Save className="w-4 h-4" />}
            >
              {isSubmitting ? 'Sauvegarde...' : isEditing ? 'Mettre à jour' : 'Créer la règle'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RuleEditor;
