import React, { useState } from 'react';
import { Download, FileText, Database, FileJson } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toaster';
import { useNotification } from '../../../context/NotificationContext';

interface DatabaseRule {
  id: string;
  name: string;
  description: string;
  table: string;
  field: string;
  condition: string;
  errorMessage: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  category: string;
}

interface ExportDatabaseRulesButtonProps {
  rules: DatabaseRule[];
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const ExportDatabaseRulesButton: React.FC<ExportDatabaseRulesButtonProps> = ({
  rules,
  variant = 'outline',
  size = 'sm'
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { addToast } = useToast();
  const { showNotification } = useNotification();

  const handleExport = async (format: 'json' | 'csv' | 'sql') => {
    try {
      setIsExporting(true);
      showNotification('Préparation de l\'export...', 'loading');

      if (rules.length === 0) {
        addToast('Aucune règle à exporter', 'warning');
        showNotification('Aucune règle à exporter', 'warning');
        return;
      }

      // Format the data based on the export type
      if (format === 'json') {
        exportAsJson(rules);
      } else if (format === 'csv') {
        exportAsCsv(rules);
      } else if (format === 'sql') {
        exportAsSql(rules);
      }

      addToast(`Export des règles en ${format.toUpperCase()} réussi (${rules.length} règles)`, 'success');
      showNotification(`Export des règles en ${format.toUpperCase()} réussi`, 'success');
    } catch (error) {
      console.error('Error exporting rules:', error);
      addToast('Erreur lors de l\'export des règles', 'error');
      showNotification('Erreur lors de l\'export des règles', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsJson = (rules: DatabaseRule[]) => {
    const jsonContent = JSON.stringify(rules, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    downloadFile(blob, `regles_database_${getFormattedDate()}.json`);
  };

  const exportAsCsv = (rules: DatabaseRule[]) => {
    // Define CSV headers
    const headers = [
      'ID',
      'Nom',
      'Description',
      'Table',
      'Champ',
      'Condition',
      'Message d\'erreur',
      'Sévérité',
      'Statut',
      'Catégorie'
    ];

    // Convert rules to CSV rows
    const rows = rules.map(rule => [
      rule.id,
      rule.name,
      rule.description,
      rule.table,
      rule.field,
      rule.condition,
      rule.errorMessage,
      rule.severity,
      rule.isActive ? 'Active' : 'Inactive',
      rule.category
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => {
          // Escape commas and quotes
          const cellStr = String(cell || '');
          if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
            return `"${cellStr.replace(/"/g, '""')}"`;
          }
          return cellStr;
        }).join(',')
      )
    ].join('\n');

    // Add BOM for Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    downloadFile(blob, `regles_database_${getFormattedDate()}.csv`);
  };

  const exportAsSql = (rules: DatabaseRule[]) => {
    // Create SQL content with CREATE TABLE and INSERT statements
    let sqlContent = `-- Règles de validation de base de données
-- Date d'export: ${new Date().toLocaleDateString('fr-FR')}
-- Nombre de règles: ${rules.length}

-- Création de la table si elle n'existe pas
CREATE TABLE IF NOT EXISTS validation_rules (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  table_name VARCHAR(50) NOT NULL,
  field_name VARCHAR(50) NOT NULL,
  condition TEXT NOT NULL,
  error_message TEXT NOT NULL,
  severity VARCHAR(20) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  category VARCHAR(50)
);

-- Suppression des règles existantes
DELETE FROM validation_rules;

-- Insertion des règles
`;

    // Add INSERT statements for each rule
    rules.forEach(rule => {
      sqlContent += `INSERT INTO validation_rules (id, name, description, table_name, field_name, condition, error_message, severity, is_active, category)
VALUES (
  '${escapeSql(rule.id)}',
  '${escapeSql(rule.name)}',
  '${escapeSql(rule.description)}',
  '${escapeSql(rule.table)}',
  '${escapeSql(rule.field)}',
  '${escapeSql(rule.condition)}',
  '${escapeSql(rule.errorMessage)}',
  '${escapeSql(rule.severity)}',
  ${rule.isActive},
  '${escapeSql(rule.category)}'
);\n\n`;
    });

    const blob = new Blob([sqlContent], { type: 'text/plain;charset=utf-8;' });
    downloadFile(blob, `regles_database_${getFormattedDate()}.sql`);
  };

  const escapeSql = (str: string): string => {
    if (!str) return '';
    return str.replace(/'/g, "''");
  };

  const downloadFile = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const getFormattedDate = (): string => {
    return new Date().toISOString().split('T')[0];
  };

  return (
    <div className="flex space-x-2">
      <Button
        variant={variant}
        size={size}
        leftIcon={<FileJson className="h-4 w-4" />}
        onClick={() => handleExport('json')}
        isLoading={isExporting}
        disabled={isExporting}
      >
        JSON
      </Button>
      <Button
        variant={variant}
        size={size}
        leftIcon={<FileText className="h-4 w-4" />}
        onClick={() => handleExport('csv')}
        isLoading={isExporting}
        disabled={isExporting}
      >
        CSV
      </Button>
      <Button
        variant={variant}
        size={size}
        leftIcon={<Database className="h-4 w-4" />}
        onClick={() => handleExport('sql')}
        isLoading={isExporting}
        disabled={isExporting}
      >
        SQL
      </Button>
    </div>
  );
};

export default ExportDatabaseRulesButton;