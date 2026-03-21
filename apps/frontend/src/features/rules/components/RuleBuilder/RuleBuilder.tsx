import React, { useState } from 'react';
import { Plus, X, ChevronDown, GripVertical } from 'lucide-react';
import {
  RuleCondition,
  RuleConditionType,
  CONDITION_TYPE_LABELS,
  CONDITION_TYPES_BY_CATEGORY,
} from '../../schemas/ruleSchema';
import Button from '../../../../components/ui/Button';

interface RuleBuilderProps {
  conditions: RuleCondition[];
  onChange: (conditions: RuleCondition[]) => void;
  fieldType?: 'string' | 'date' | 'number';
}

interface ConditionConfigProps {
  type: RuleConditionType;
  condition: RuleCondition;
  onChange: (condition: RuleCondition) => void;
  onRemove: () => void;
}

const ConditionConfig: React.FC<ConditionConfigProps> = ({
  type,
  condition,
  onChange,
  onRemove,
}) => {
  const renderValueInput = () => {
    switch (type) {
      case 'minLength':
      case 'maxLength':
      case 'exactLength':
      case 'minValue':
      case 'maxValue':
        return (
          <input
            type="number"
            value={condition.value || ''}
            onChange={(e) => onChange({ ...condition, value: parseInt(e.target.value) || 0 })}
            className="w-24 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder="Valeur"
          />
        );

      case 'valueRange':
      case 'dateRange':
        return (
          <div className="flex items-center gap-2">
            <input
              type={type === 'dateRange' ? 'date' : 'number'}
              value={condition.min || ''}
              onChange={(e) => onChange({ ...condition, min: e.target.value })}
              className="w-32 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Min"
            />
            <span className="text-gray-500">à</span>
            <input
              type={type === 'dateRange' ? 'date' : 'number'}
              value={condition.max || ''}
              onChange={(e) => onChange({ ...condition, max: e.target.value })}
              className="w-32 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Max"
            />
          </div>
        );

      case 'dateAfter':
      case 'dateBefore':
        return (
          <input
            type="date"
            value={condition.value || ''}
            onChange={(e) => onChange({ ...condition, value: e.target.value })}
            className="w-40 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        );

      case 'startsWith':
      case 'endsWith':
      case 'contains':
      case 'customRegex':
        return (
          <input
            type="text"
            value={condition.value || ''}
            onChange={(e) => onChange({ ...condition, value: e.target.value })}
            className="w-48 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            placeholder={type === 'customRegex' ? 'Expression régulière' : 'Texte'}
          />
        );

      case 'forbiddenPatterns':
      case 'forbiddenValues':
      case 'inList':
      case 'notInList':
        return (
          <ValuesListInput
            values={condition.values || []}
            onChange={(values) => onChange({ ...condition, values })}
            placeholder={type.includes('Pattern') ? 'Motif' : 'Valeur'}
          />
        );

      case 'required':
      case 'optional':
      case 'alphanumeric':
      case 'alphaOnly':
      case 'numericOnly':
      case 'uppercase':
      case 'email':
      case 'phone':
      case 'notPlaceholder':
      case 'dateNotFuture':
      case 'dateNotExpired':
        // These don't need additional input
        return null;

      default:
        return null;
    }
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 group">
      <div className="cursor-grab text-gray-400 hover:text-gray-600">
        <GripVertical className="w-4 h-4" />
      </div>

      <div className="flex-1 flex items-center gap-3 flex-wrap">
        <span className="px-3 py-1.5 bg-primary-100 text-primary-800 rounded-md text-sm font-medium">
          {CONDITION_TYPE_LABELS[type]}
        </span>
        {renderValueInput()}
      </div>

      <div className="flex items-center gap-2">
        <input
          type="text"
          value={condition.message || ''}
          onChange={(e) => onChange({ ...condition, message: e.target.value })}
          className="w-48 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder="Message d'erreur personnalisé"
        />
        <button
          type="button"
          onClick={onRemove}
          className="p-1.5 text-gray-400 hover:text-error-600 hover:bg-error-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Helper component for managing list of values
const ValuesListInput: React.FC<{
  values: string[];
  onChange: (values: string[]) => void;
  placeholder: string;
}> = ({ values, onChange, placeholder }) => {
  const [inputValue, setInputValue] = useState('');

  const handleAdd = () => {
    if (inputValue.trim() && !values.includes(inputValue.trim())) {
      onChange([...values, inputValue.trim()]);
      setInputValue('');
    }
  };

  const handleRemove = (index: number) => {
    onChange(values.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="w-32 px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={handleAdd}
          className="p-1.5 text-primary-600 hover:bg-primary-50 rounded-md transition-colors"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
      {values.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {values.map((value, index) => (
            <span
              key={index}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-200 text-gray-700 rounded text-xs"
            >
              {value}
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="hover:text-error-600"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// Dropdown for selecting condition type
const ConditionTypeSelector: React.FC<{
  onSelect: (type: RuleConditionType) => void;
  existingTypes: RuleConditionType[];
}> = ({ onSelect, existingTypes }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        leftIcon={<Plus className="w-4 h-4" />}
        onClick={() => setIsOpen(!isOpen)}
      >
        Ajouter une condition
        <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </Button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
            {Object.entries(CONDITION_TYPES_BY_CATEGORY).map(([category, types]) => (
              <div key={category}>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50 sticky top-0">
                  {category}
                </div>
                {types.map((type) => {
                  const isDisabled = existingTypes.includes(type as RuleConditionType);
                  return (
                    <button
                      key={type}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => {
                        onSelect(type as RuleConditionType);
                        setIsOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                        isDisabled ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700'
                      }`}
                    >
                      {CONDITION_TYPE_LABELS[type as RuleConditionType]}
                      {isDisabled && (
                        <span className="ml-2 text-xs text-gray-400">(déjà ajouté)</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export const RuleBuilder: React.FC<RuleBuilderProps> = ({
  conditions,
  onChange,
  fieldType = 'string',
}) => {
  const handleAddCondition = (type: RuleConditionType) => {
    const newCondition: RuleCondition = { type };
    onChange([...conditions, newCondition]);
  };

  const handleUpdateCondition = (index: number, updatedCondition: RuleCondition) => {
    const newConditions = [...conditions];
    newConditions[index] = updatedCondition;
    onChange(newConditions);
  };

  const handleRemoveCondition = (index: number) => {
    onChange(conditions.filter((_, i) => i !== index));
  };

  const existingTypes = conditions.map((c) => c.type);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Conditions de validation
        </label>
        <span className="text-xs text-gray-500">
          {conditions.length} condition{conditions.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Visual representation */}
      <div className="p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-lg border border-primary-100">
        <div className="flex items-center gap-2 flex-wrap text-sm">
          <span className="font-medium text-gray-700">Le champ</span>
          <span className="px-2 py-0.5 bg-white border border-gray-300 rounded text-gray-600">
            [sélectionné]
          </span>
          {conditions.length === 0 ? (
            <span className="text-gray-500 italic">n'a aucune condition</span>
          ) : (
            conditions.map((condition, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span className="text-gray-500">et</span>}
                <span className="px-2 py-0.5 bg-primary-100 text-primary-800 rounded font-medium">
                  {CONDITION_TYPE_LABELS[condition.type].toLowerCase()}
                  {condition.value && ` (${condition.value})`}
                </span>
              </React.Fragment>
            ))
          )}
        </div>
      </div>

      {/* Condition list */}
      <div className="space-y-2">
        {conditions.map((condition, index) => (
          <ConditionConfig
            key={index}
            type={condition.type}
            condition={condition}
            onChange={(updated) => handleUpdateCondition(index, updated)}
            onRemove={() => handleRemoveCondition(index)}
          />
        ))}
      </div>

      {/* Add condition button */}
      <ConditionTypeSelector
        onSelect={handleAddCondition}
        existingTypes={existingTypes}
      />

      {/* Help text */}
      {conditions.length === 0 && (
        <p className="text-sm text-gray-500 italic">
          Ajoutez des conditions pour définir les règles de validation de ce champ.
        </p>
      )}
    </div>
  );
};

export default RuleBuilder;
