import React, { useState } from 'react';
import { Play, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { ClientRecord, ValidationResult } from '../../../types/ValidationRules';
import { validationRulesService } from '../../../services/validationRules';

const ValidationTester: React.FC = () => {
  const [testRecord, setTestRecord] = useState<Partial<ClientRecord>>({
    cli: 'TEST001',
    nom: '',
    tcli: '1',
    pre: '',
    sext: '',
    dna: '',
    nid: '',
    nmer: '',
    nrc: '',
    datc: '',
    rso: '',
    sig: '',
    age: '01001',
    nat: 'ML',
    res: 'ML'
  });

  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleValidate = async () => {
    setIsValidating(true);
    
    // Simulation d'un délai de validation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const result = validationRulesService.validateRecord(testRecord as ClientRecord);
    setValidationResult(result);
    setIsValidating(false);
  };

  const handleFieldChange = (field: keyof ClientRecord, value: string) => {
    setTestRecord(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Reset validation result when data changes
    if (validationResult) {
      setValidationResult(null);
    }
  };

  const getClientTypeFields = () => {
    const commonFields = (
      <>
        <Input
          label="Code Client"
          value={testRecord.cli || ''}
          onChange={(e) => handleFieldChange('cli', e.target.value)}
        />
        
        <Input
          label="Code Agence"
          value={testRecord.age || ''}
          onChange={(e) => handleFieldChange('age', e.target.value)}
        />
      </>
    );

    switch (testRecord.tcli) {
      case '1': // Particuliers
        return (
          <>
            {commonFields}
            <Input
              label="Nom"
              value={testRecord.nom || ''}
              onChange={(e) => handleFieldChange('nom', e.target.value)}
            />
            <Input
              label="Prénom"
              value={testRecord.pre || ''}
              onChange={(e) => handleFieldChange('pre', e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sexe
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={testRecord.sext || ''}
                onChange={(e) => handleFieldChange('sext', e.target.value)}
              >
                <option value="">Sélectionner...</option>
                <option value="M">Masculin</option>
                <option value="F">Féminin</option>
              </select>
            </div>
            <Input
              label="Date de naissance"
              type="date"
              value={testRecord.dna || ''}
              onChange={(e) => handleFieldChange('dna', e.target.value)}
            />
            <Input
              label="Numéro d'identité"
              value={testRecord.nid || ''}
              onChange={(e) => handleFieldChange('nid', e.target.value)}
            />
            <Input
              label="Nom de la mère"
              value={testRecord.nmer || ''}
              onChange={(e) => handleFieldChange('nmer', e.target.value)}
            />
            <Input
              label="Nationalité"
              value={testRecord.nat || ''}
              onChange={(e) => handleFieldChange('nat', e.target.value)}
            />
            <Input
              label="Ville de naissance"
              value={testRecord.viln || ''}
              onChange={(e) => handleFieldChange('viln', e.target.value)}
            />
            <Input
              label="Pays de naissance"
              value={testRecord.payn || ''}
              onChange={(e) => handleFieldChange('payn', e.target.value)}
            />
            <Input
              label="Type de pièce d'identité"
              value={testRecord.tid || ''}
              onChange={(e) => handleFieldChange('tid', e.target.value)}
            />
          </>
        );

      case '2': // Entreprises
        return (
          <>
            {commonFields}
            <Input
              label="Raison sociale"
              value={testRecord.rso || ''}
              onChange={(e) => handleFieldChange('rso', e.target.value)}
            />
            <Input
              label="Sigle"
              value={testRecord.sig || ''}
              onChange={(e) => handleFieldChange('sig', e.target.value)}
            />
            <Input
              label="Numéro de registre de commerce"
              value={testRecord.nrc || ''}
              onChange={(e) => handleFieldChange('nrc', e.target.value)}
            />
            <Input
              label="Date de création"
              type="date"
              value={testRecord.datc || ''}
              onChange={(e) => handleFieldChange('datc', e.target.value)}
            />
            <Input
              label="Secteur d'activité"
              value={testRecord.sec || ''}
              onChange={(e) => handleFieldChange('sec', e.target.value)}
            />
            <Input
              label="Forme juridique"
              value={testRecord.fju || ''}
              onChange={(e) => handleFieldChange('fju', e.target.value)}
            />
            <Input
              label="Catégorie BC"
              value={testRecord.catn || ''}
              onChange={(e) => handleFieldChange('catn', e.target.value)}
            />
            <Input
              label="Lien avec la banque"
              value={testRecord.lienbq || ''}
              onChange={(e) => handleFieldChange('lienbq', e.target.value)}
            />
          </>
        );

      case '3': // Institutionnels
        return (
          <>
            {commonFields}
            <Input
              label="Raison sociale"
              value={testRecord.rso || ''}
              onChange={(e) => handleFieldChange('rso', e.target.value)}
            />
            <Input
              label="Numéro de registre"
              value={testRecord.nrc || ''}
              onChange={(e) => handleFieldChange('nrc', e.target.value)}
            />
            <Input
              label="Date de création"
              type="date"
              value={testRecord.datc || ''}
              onChange={(e) => handleFieldChange('datc', e.target.value)}
            />
            <Input
              label="Secteur d'activité"
              value={testRecord.sec || ''}
              onChange={(e) => handleFieldChange('sec', e.target.value)}
            />
            <Input
              label="Forme juridique"
              value={testRecord.fju || ''}
              onChange={(e) => handleFieldChange('fju', e.target.value)}
            />
            <Input
              label="Catégorie BC"
              value={testRecord.catn || ''}
              onChange={(e) => handleFieldChange('catn', e.target.value)}
            />
            <Input
              label="Lien avec la banque"
              value={testRecord.lienbq || ''}
              onChange={(e) => handleFieldChange('lienbq', e.target.value)}
            />
          </>
        );

      default:
        return commonFields;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">Testeur de Validation</h2>
        <p className="mt-1 text-sm text-gray-500">
          Testez les règles de validation avec des données d'exemple
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Formulaire de test */}
        <Card>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Données de Test</h3>
              <Button
                variant="primary"
                size="sm"
                leftIcon={<Play className="h-4 w-4" />}
                onClick={handleValidate}
                isLoading={isValidating}
              >
                Valider
              </Button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de client
              </label>
              <select
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={testRecord.tcli || '1'}
                onChange={(e) => handleFieldChange('tcli', e.target.value)}
              >
                <option value="1">Particulier</option>
                <option value="2">Entreprise</option>
                <option value="3">Institutionnel</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {getClientTypeFields()}
            </div>
          </div>
        </Card>

        {/* Résultats de validation */}
        <Card>
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Résultats de Validation</h3>

            {!validationResult ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p>Cliquez sur "Valider" pour voir les résultats</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Statut global */}
                <div className={`p-4 rounded-lg border ${
                  validationResult.isValid 
                    ? 'bg-success-50 border-success-200' 
                    : 'bg-error-50 border-error-200'
                }`}>
                  <div className="flex items-center">
                    {validationResult.isValid ? (
                      <CheckCircle className="h-5 w-5 text-success-600 mr-2" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 text-error-600 mr-2" />
                    )}
                    <span className={`font-medium ${
                      validationResult.isValid ? 'text-success-800' : 'text-error-800'
                    }`}>
                      {validationResult.isValid ? 'Validation réussie' : 'Erreurs détectées'}
                    </span>
                  </div>
                </div>

                {/* Erreurs */}
                {validationResult.errors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-error-800 mb-2">
                      Erreurs ({validationResult.errors.length})
                    </h4>
                    <div className="space-y-2">
                      {validationResult.errors.map((error, index) => (
                        <div key={index} className="p-3 bg-error-50 border border-error-200 rounded-md">
                          <div className="flex items-start">
                            <AlertTriangle className="h-4 w-4 text-error-500 mt-0.5 mr-2 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-error-800">
                                {error.field}
                              </p>
                              <p className="text-sm text-error-700 mt-1">
                                {error.message}
                              </p>
                              <div className="flex items-center mt-2 space-x-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  error.severity === 'critical' ? 'bg-error-100 text-error-800' :
                                  error.severity === 'high' ? 'bg-warning-100 text-warning-800' :
                                  'bg-gray-100 text-gray-800'
                                }`}>
                                  {error.severity}
                                </span>
                                {error.value && (
                                  <span className="text-xs text-gray-500">
                                    Valeur: "{error.value}"
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Avertissements */}
                {validationResult.warnings.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-warning-800 mb-2">
                      Avertissements ({validationResult.warnings.length})
                    </h4>
                    <div className="space-y-2">
                      {validationResult.warnings.map((warning, index) => (
                        <div key={index} className="p-3 bg-warning-50 border border-warning-200 rounded-md">
                          <div className="flex items-start">
                            <AlertTriangle className="h-4 w-4 text-warning-500 mt-0.5 mr-2 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-warning-800">
                                {warning.field}
                              </p>
                              <p className="text-sm text-warning-700 mt-1">
                                {warning.message}
                              </p>
                              {warning.value && (
                                <span className="text-xs text-gray-500 mt-1 block">
                                  Valeur: "{warning.value}"
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Résumé */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        {validationResult.errors.length}
                      </div>
                      <div className="text-sm text-error-600">Erreurs</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        {validationResult.warnings.length}
                      </div>
                      <div className="text-sm text-warning-600">Avertissements</div>
                    </div>
                    <div>
                      <div className="text-lg font-semibold text-gray-900">
                        {validationResult.isValid ? '✓' : '✗'}
                      </div>
                      <div className={`text-sm ${validationResult.isValid ? 'text-success-600' : 'text-error-600'}`}>
                        Statut
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ValidationTester;