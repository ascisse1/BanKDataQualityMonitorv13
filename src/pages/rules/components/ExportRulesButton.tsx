import React, { useState } from 'react';
import { Download, FileText, Database, FileJson } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { validationRulesService } from '../../../services/validationRules';
import { useToast } from '../../../components/ui/Toaster';
import { useNotification } from '../../../context/NotificationContext';

interface ExportRulesButtonProps {
  clientType?: '1' | '2' | '3' | 'all';
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const ExportRulesButton: React.FC<ExportRulesButtonProps> = ({
  clientType = 'all',
  variant = 'outline',
  size = 'sm'
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const { addToast } = useToast();
  const { showNotification } = useNotification();

  const handleExport = async (format: 'json' | 'csv' | 'pdf') => {
    try {
      setIsExporting(true);
      showNotification('Préparation de l\'export...', 'loading');

      // Get rules based on client type
      const rules = clientType === 'all' 
        ? validationRulesService.getRules() 
        : validationRulesService.getRulesByClientType(clientType);

      // Filter active rules if needed
      const activeRules = rules.filter(rule => rule.isActive);

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
      } else if (format === 'pdf') {
        exportAsPdf(rules);
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

  const exportAsJson = (rules: any[]) => {
    const jsonContent = JSON.stringify(rules, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    downloadFile(blob, `regles_validation_${getClientTypeLabel(clientType)}_${getFormattedDate()}.json`);
  };

  const exportAsCsv = (rules: any[]) => {
    // Define CSV headers
    const headers = [
      'ID',
      'Nom',
      'Description',
      'Champ',
      'Type Client',
      'Type Règle',
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
      rule.field,
      getClientTypeLabel(rule.clientType),
      rule.ruleType,
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
    downloadFile(blob, `regles_validation_${getClientTypeLabel(clientType)}_${getFormattedDate()}.csv`);
  };

  const exportAsPdf = async (rules: any[]) => {
    try {
      // Dynamically import jsPDF to reduce initial bundle size
      const { jsPDF } = await import('jspdf');
      const { default: autoTable } = await import('jspdf-autotable');

      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(16);
      doc.text(`Règles de Validation - ${getClientTypeLabel(clientType)}`, 14, 20);
      
      // Add date
      doc.setFontSize(12);
      doc.text(`Date d'export: ${new Date().toLocaleDateString('fr-FR')}`, 14, 30);
      
      // Add summary
      doc.setFontSize(12);
      doc.text(`Total: ${rules.length} règles (${rules.filter(r => r.isActive).length} actives)`, 14, 40);
      
      // Prepare table data
      const tableData = rules.map(rule => [
        rule.id,
        rule.name,
        rule.field,
        getClientTypeLabel(rule.clientType),
        rule.severity,
        rule.isActive ? 'Active' : 'Inactive',
        rule.category
      ]);
      
      // Add table
      autoTable(doc, {
        head: [['ID', 'Nom', 'Champ', 'Type Client', 'Sévérité', 'Statut', 'Catégorie']],
        body: tableData,
        startY: 50,
        styles: { fontSize: 8 },
        headStyles: { fillColor: [26, 54, 93], textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 40 },
          2: { cellWidth: 20 },
          3: { cellWidth: 20 },
          4: { cellWidth: 20 },
          5: { cellWidth: 20 },
          6: { cellWidth: 30 }
        }
      });
      
      // Save the PDF
      doc.save(`regles_validation_${getClientTypeLabel(clientType)}_${getFormattedDate()}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      addToast('Erreur lors de la génération du PDF', 'error');
    }
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

  const getClientTypeLabel = (type: string): string => {
    switch (type) {
      case '1': return 'Particuliers';
      case '2': return 'Entreprises';
      case '3': return 'Institutionnels';
      default: return 'Tous';
    }
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
        leftIcon={<Download className="h-4 w-4" />}
        onClick={() => handleExport('pdf')}
        isLoading={isExporting}
        disabled={isExporting}
      >
        PDF
      </Button>
    </div>
  );
};

export default ExportRulesButton;