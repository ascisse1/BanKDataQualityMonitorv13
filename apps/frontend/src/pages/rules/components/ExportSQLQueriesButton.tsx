import React, { useState } from 'react';
import { Download, FileText, Code } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toaster';
import { useNotification } from '../../../context/NotificationContext';

interface SQLQuery {
  name: string;
  description: string;
  query: string;
}

interface ExportSQLQueriesButtonProps {
  queries: Record<string, string>;
  descriptions: Record<string, string>;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const ExportSQLQueriesButton: React.FC<ExportSQLQueriesButtonProps> = ({
  queries,
  descriptions,
  variant = 'outline',
  size = 'sm'
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { addToast } = useToast();
  const { showNotification } = useNotification();

  const handleExport = async (format: 'sql' | 'json' | 'markdown') => {
    try {
      setIsExporting(true);
      showNotification('Préparation de l\'export...', 'loading');

      const queryEntries = Object.entries(queries);
      
      if (queryEntries.length === 0) {
        addToast('Aucune requête à exporter', 'warning');
        showNotification('Aucune requête à exporter', 'warning');
        return;
      }

      // Format the data based on the export type
      if (format === 'sql') {
        exportAsSql(queryEntries, descriptions);
      } else if (format === 'json') {
        exportAsJson(queryEntries, descriptions);
      } else if (format === 'markdown') {
        exportAsMarkdown(queryEntries, descriptions);
      }

      addToast(`Export des requêtes en ${format.toUpperCase()} réussi (${queryEntries.length} requêtes)`, 'success');
      showNotification(`Export des requêtes en ${format.toUpperCase()} réussi`, 'success');
    } catch (error) {
      console.error('Error exporting queries:', error);
      addToast('Erreur lors de l\'export des requêtes', 'error');
      showNotification('Erreur lors de l\'export des requêtes', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const exportAsSql = (queryEntries: [string, string][], descriptions: Record<string, string>) => {
    // Create SQL content with comments
    let sqlContent = `-- Requêtes SQL de détection d'anomalies
-- Date d'export: ${new Date().toLocaleDateString('fr-FR')}
-- Nombre de requêtes: ${queryEntries.length}

`;

    // Add each query with comments
    queryEntries.forEach(([name, query]) => {
      sqlContent += `-- ============================================================
-- Nom: ${name}
-- Description: ${descriptions[name] || 'Aucune description disponible'}
-- ============================================================
${query}

`;
    });

    const blob = new Blob([sqlContent], { type: 'text/plain;charset=utf-8;' });
    downloadFile(blob, `requetes_sql_${getFormattedDate()}.sql`);
  };

  const exportAsJson = (queryEntries: [string, string][], descriptions: Record<string, string>) => {
    // Create JSON structure
    const queriesJson = queryEntries.map(([name, query]) => ({
      name,
      description: descriptions[name] || 'Aucune description disponible',
      query
    }));

    const jsonContent = JSON.stringify(queriesJson, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    downloadFile(blob, `requetes_sql_${getFormattedDate()}.json`);
  };

  const exportAsMarkdown = (queryEntries: [string, string][], descriptions: Record<string, string>) => {
    // Create Markdown content
    let mdContent = `# Requêtes SQL de détection d'anomalies
Date d'export: ${new Date().toLocaleDateString('fr-FR')}  
Nombre de requêtes: ${queryEntries.length}

`;

    // Add each query with markdown formatting
    queryEntries.forEach(([name, query]) => {
      mdContent += `## ${name}
${descriptions[name] || 'Aucune description disponible'}

\`\`\`sql
${query}
\`\`\`

`;
    });

    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    downloadFile(blob, `requetes_sql_${getFormattedDate()}.md`);
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
        leftIcon={<Code className="h-4 w-4" />}
        onClick={() => handleExport('sql')}
        isLoading={isExporting}
        disabled={isExporting}
      >
        SQL
      </Button>
      <Button
        variant={variant}
        size={size}
        leftIcon={<FileText className="h-4 w-4" />}
        onClick={() => handleExport('markdown')}
        isLoading={isExporting}
        disabled={isExporting}
      >
        Markdown
      </Button>
      <Button
        variant={variant}
        size={size}
        leftIcon={<Download className="h-4 w-4" />}
        onClick={() => handleExport('json')}
        isLoading={isExporting}
        disabled={isExporting}
      >
        JSON
      </Button>
    </div>
  );
};

export default ExportSQLQueriesButton;