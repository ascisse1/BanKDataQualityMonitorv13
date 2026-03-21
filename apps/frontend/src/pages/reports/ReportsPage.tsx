import { useState, useEffect } from 'react';
import { Download, FileBarChart2, RefreshCw, FileSpreadsheet, Loader2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toaster';
import { db } from '../../services/db';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const ReportsPage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [reports, setReports] = useState([]);
  const { addToast } = useToast();

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      // Fetch anomalies data
      const individualAnomalies = await db.getIndividualAnomalies();
      const corporateAnomalies = await db.getCorporateAnomalies();
      const branchAnomalies = await db.getAnomaliesByBranch();

      // For now, we'll just store the counts
      setReports([
        {
          id: 1,
          title: 'Weekly Data Quality Report',
          date: new Date().toISOString(),
          type: 'weekly',
          data: {
            individualAnomalies: individualAnomalies.length,
            corporateAnomalies: corporateAnomalies.length,
            branchAnomalies: branchAnomalies.length
          }
        }
      ]);
    } catch (error) {
      addToast('Error loading reports', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDF = async () => {
    try {
      const doc = new jsPDF();
      
      // Add title
      doc.setFontSize(20);
      doc.text('Data Quality Report', 20, 20);
      
      // Add date
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
      
      // Add summary table
      const summaryData = [
        ['Individual Client Anomalies', reports[0]?.data.individualAnomalies || 0],
        ['Corporate Client Anomalies', reports[0]?.data.corporateAnomalies || 0],
        ['Branch Anomalies', reports[0]?.data.branchAnomalies || 0],
      ];
      
      doc.autoTable({
        startY: 40,
        head: [['Category', 'Count']],
        body: summaryData,
      });
      
      // Save the PDF
      doc.save(`data-quality-report-${new Date().toISOString().split('T')[0]}.pdf`);
      addToast('Report generated successfully', 'success');
    } catch (error) {
      addToast('Error generating report', 'error');
    }
  };

  const generateExcelDashboard = async () => {
    try {
      setIsExporting(true);
      addToast('Préparation de l\'export Excel...', 'info');

      // Récupérer les données nécessaires
      const [
        individualAnomalies,
        corporateAnomalies,
        fatcaClients,
        validationMetrics,
        branchAnomalies
      ] = await Promise.all([
        db.getIndividualAnomalies(1, 1000, true),
        db.getCorporateAnomalies(1, 1000, true),
        db.getFatcaClients(1, 1000, true),
        db.getValidationMetrics(),
        db.getAnomaliesByBranch()
      ]);

      // Créer un nouveau classeur Excel
      const workbook = XLSX.utils.book_new();

      // 1. Feuille de synthèse avec les indicateurs
      const dashboardData = [
        ['Tableau de Bord - Qualité des Données', '', '', ''],
        ['Date de génération', new Date().toLocaleDateString('fr-FR'), '', ''],
        ['', '', '', ''],
        ['INDICATEURS DE QUALITÉ', '', '', ''],
        ['Catégorie', 'Total', 'Valides', 'Score (%)'],
      ];

      // Ajouter les métriques de validation
      validationMetrics.forEach(metric => {
        dashboardData.push([
          metric.category,
          metric.total_records,
          metric.valid_records,
          metric.quality_score
        ]);
      });

      // Ajouter un espace
      dashboardData.push(['', '', '', '']);
      dashboardData.push(['ANOMALIES PAR AGENCE (TOP 10)', '', '', '']);
      dashboardData.push(['Code Agence', 'Nom Agence', 'Nombre d\'anomalies', '']);

      // Ajouter les anomalies par agence (top 10)
      branchAnomalies.slice(0, 10).forEach(branch => {
        dashboardData.push([
          branch.code_agence,
          branch.lib_agence,
          branch.nombre_anomalies,
          ''
        ]);
      });

      // Ajouter un espace
      dashboardData.push(['', '', '', '']);
      dashboardData.push(['RÉSUMÉ DES ANOMALIES', '', '', '']);
      dashboardData.push(['Type', 'Nombre', '', '']);
      dashboardData.push(['Clients Particuliers', individualAnomalies.data?.length || 0, '', '']);
      dashboardData.push(['Clients Entreprises', corporateAnomalies.data?.length || 0, '', '']);
      dashboardData.push(['Clients FATCA', fatcaClients.data?.length || 0, '', '']);

      // Créer la feuille de synthèse
      const dashboardSheet = XLSX.utils.aoa_to_sheet(dashboardData);
      XLSX.utils.book_append_sheet(workbook, dashboardSheet, 'Synthèse');

      // 2. Feuille des anomalies clients particuliers
      const individualData = [
        ['ANOMALIES CLIENTS PARTICULIERS', '', '', '', '', '', '', ''],
        ['Code Client', 'Nom', 'Prénom', 'Type d\'anomalie', 'Champ', 'Agence', 'Sévérité', 'Statut']
      ];

      // Formater les données des anomalies particuliers
      if (individualAnomalies.data && individualAnomalies.data.length > 0) {
        individualAnomalies.data.forEach(anomaly => {
          const severity = getSeverity(anomaly);
          individualData.push([
            anomaly.cli || '',
            anomaly.nom || '',
            anomaly.pre || '',
            getErrorType(anomaly),
            getFieldName(anomaly),
            anomaly.age || '',
            severity,
            'Nouveau'
          ]);
        });
      }

      // Créer la feuille des anomalies particuliers
      const individualSheet = XLSX.utils.aoa_to_sheet(individualData);
      XLSX.utils.book_append_sheet(workbook, individualSheet, 'Anomalies Particuliers');

      // 3. Feuille des anomalies clients entreprises
      const corporateData = [
        ['ANOMALIES CLIENTS ENTREPRISES', '', '', '', '', '', '', ''],
        ['Code Client', 'Raison Sociale', 'Type d\'anomalie', 'Champ', 'Agence', 'Sévérité', 'Statut', '']
      ];

      // Formater les données des anomalies entreprises
      if (corporateAnomalies.data && corporateAnomalies.data.length > 0) {
        corporateAnomalies.data.forEach(anomaly => {
          const severity = getSeverity(anomaly);
          corporateData.push([
            anomaly.cli || '',
            anomaly.nom || '',
            getErrorType(anomaly),
            getFieldName(anomaly),
            anomaly.age || '',
            severity,
            'Nouveau',
            ''
          ]);
        });
      }

      // Créer la feuille des anomalies entreprises
      const corporateSheet = XLSX.utils.aoa_to_sheet(corporateData);
      XLSX.utils.book_append_sheet(workbook, corporateSheet, 'Anomalies Entreprises');

      // 4. Feuille des clients FATCA
      const fatcaData = [
        ['CLIENTS FATCA', '', '', '', '', '', '', '', ''],
        ['Code Client', 'Nom', 'Date Entrée', 'Pays Naissance', 'Nationalité', 'Pays Adresse', 'Téléphone', 'Statut FATCA', 'Type Relation']
      ];

      // Formater les données des clients FATCA
      if (fatcaClients.data && fatcaClients.data.length > 0) {
        fatcaClients.data.forEach(client => {
          fatcaData.push([
            client.cli || '',
            client.nom || '',
            formatDate(client.date_entree_relation),
            client.pays_naissance || '',
            client.nationalite || '',
            client.pays_adresse || '',
            client.telephone || '',
            client.fatca_status || 'À vérifier',
            client.type_relation || ''
          ]);
        });
      }

      // Créer la feuille des clients FATCA
      const fatcaSheet = XLSX.utils.aoa_to_sheet(fatcaData);
      XLSX.utils.book_append_sheet(workbook, fatcaSheet, 'Clients FATCA');

      // Générer le fichier Excel
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Créer un lien de téléchargement
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tableau-de-bord-qualite-donnees-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      addToast('Tableau de bord Excel généré avec succès', 'success');
    } catch (error) {
      console.error('Error generating Excel dashboard:', error);
      addToast('Erreur lors de la génération du tableau de bord Excel', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Fonctions utilitaires pour formater les données
  const getFieldName = (anomaly: any): string => {
    if (anomaly.tcli === '1') {
      if (!anomaly.nmer || anomaly.nmer.trim() === '') return 'Nom de la mère';
      if (!anomaly.dna || anomaly.dna.trim() === '') return 'Date de naissance';
      if (!anomaly.nid || anomaly.nid.trim() === '') return 'Numéro d\'identité';
      if (!anomaly.nat || anomaly.nat.trim() === '') return 'Nationalité';
    } else {
      if (!anomaly.nrc || anomaly.nrc.trim() === '') return 'Numéro de registre';
      if (!anomaly.datc || anomaly.datc.trim() === '') return 'Date de création';
      if (!anomaly.rso || anomaly.rso.trim() === '') return 'Raison sociale';
    }
    return 'Inconnu';
  };

  const getErrorType = (anomaly: any): string => {
    if (anomaly.tcli === '1') {
      if (!anomaly.nmer || anomaly.nmer.trim() === '') return 'Valeur manquante';
      if (!anomaly.dna || anomaly.dna.trim() === '') return 'Valeur manquante';
      if (!anomaly.nid || anomaly.nid.trim() === '') return 'Valeur manquante';
      if (!anomaly.nat || anomaly.nat.trim() === '') return 'Valeur manquante';
    } else {
      if (!anomaly.nrc || anomaly.nrc.trim() === '') return 'Valeur manquante';
      if (!anomaly.datc || anomaly.datc.trim() === '') return 'Valeur manquante';
      if (!anomaly.rso || anomaly.rso.trim() === '') return 'Valeur manquante';
    }
    return 'Erreur inconnue';
  };

  const getSeverity = (anomaly: any): 'Faible' | 'Moyenne' | 'Haute' => {
    if (anomaly.tcli === '1') {
      if (!anomaly.nid || anomaly.nid.trim() === '') return 'Haute';
      if (!anomaly.nmer || anomaly.nmer.trim() === '') return 'Haute';
      if (!anomaly.dna || anomaly.dna.trim() === '') return 'Haute';
      if (!anomaly.nat || anomaly.nat.trim() === '') return 'Moyenne';
    } else {
      if (!anomaly.nrc || anomaly.nrc.trim() === '') return 'Haute';
      if (!anomaly.datc || anomaly.datc.trim() === '') return 'Moyenne';
      if (!anomaly.rso || anomaly.rso.trim() === '') return 'Haute';
    }
    return 'Faible';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    
    // Format YYYYMMDD to DD/MM/YYYY
    if (dateString.length === 8 && !dateString.includes('-')) {
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      return `${day}/${month}/${year}`;
    }
    
    // Format YYYY-MM-DD to DD/MM/YYYY
    if (dateString.includes('-')) {
      const [year, month, day] = dateString.split('-');
      return `${day}/${month}/${year}`;
    }
    
    return dateString;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Rapports</h1>
          <p className="mt-1 text-sm text-gray-500">
            Générer et consulter les rapports de qualité des données
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={loadReports}
            disabled={isLoading || isExporting}
          >
            Actualiser
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            leftIcon={<FileSpreadsheet className="h-4 w-4" />}
            onClick={generateExcelDashboard}
            disabled={isLoading || isExporting}
            isLoading={isExporting}
          >
            Export Tableau de Bord Excel
          </Button>
          
          <Button 
            variant="primary" 
            size="sm" 
            leftIcon={<Download className="h-4 w-4" />}
            onClick={generatePDF}
            disabled={isLoading || isExporting}
          >
            Générer un rapport PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card
          title="Rapports récents"
          description="Liste des rapports récemment générés"
          isLoading={isLoading}
        >
          <div className="space-y-4">
            {reports.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center">
                  <div className="h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <FileBarChart2 className="h-5 w-5 text-primary-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-900">{report.title}</p>
                    <p className="text-xs text-gray-500">
                      Généré le {new Date(report.date).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  leftIcon={<Download className="h-4 w-4" />}
                  onClick={generatePDF}
                >
                  Télécharger
                </Button>
              </div>
            ))}

            {reports.length === 0 && !isLoading && (
              <div className="text-center text-gray-500 py-8">
                <FileBarChart2 className="h-12 w-12 mx-auto text-gray-400 mb-3" />
                <p className="text-lg font-medium">Aucun rapport disponible</p>
                <p className="text-sm">Générez votre premier rapport en cliquant sur le bouton ci-dessus</p>
              </div>
            )}
          </div>
        </Card>

        <Card
          title="Paramètres des rapports"
          description="Configurer les options de génération des rapports"
          isLoading={isLoading}
        >
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type de rapport
              </label>
              <select className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md">
                <option>Rapport de qualité hebdomadaire</option>
                <option>Résumé mensuel des anomalies</option>
                <option>Rapport d'audit de qualité</option>
                <option>Rapport personnalisé</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sections à inclure
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" 
                    defaultChecked 
                  />
                  <span className="ml-2 text-sm text-gray-700">Résumé exécutif</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" 
                    defaultChecked 
                  />
                  <span className="ml-2 text-sm text-gray-700">Détails des anomalies</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" 
                    defaultChecked 
                  />
                  <span className="ml-2 text-sm text-gray-700">Graphiques et tableaux</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" 
                    defaultChecked 
                  />
                  <span className="ml-2 text-sm text-gray-700">Recommandations</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Format d'export
              </label>
              <div className="space-x-4">
                <label className="inline-flex items-center">
                  <input 
                    type="radio" 
                    name="export-format" 
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300" 
                    defaultChecked 
                  />
                  <span className="ml-2 text-sm text-gray-700">PDF</span>
                </label>
                <label className="inline-flex items-center">
                  <input 
                    type="radio" 
                    name="export-format" 
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300" 
                  />
                  <span className="ml-2 text-sm text-gray-700">Excel</span>
                </label>
                <label className="inline-flex items-center">
                  <input 
                    type="radio" 
                    name="export-format" 
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300" 
                  />
                  <span className="ml-2 text-sm text-gray-700">CSV</span>
                </label>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="border-primary-200 bg-primary-50">
        <div className="p-6">
          <h3 className="text-lg font-medium text-primary-800 mb-4">Tableau de Bord Excel</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-primary-700">Feuille de Synthèse</h4>
              <ul className="text-sm text-primary-600 space-y-1">
                <li>• Indicateurs de qualité des données</li>
                <li>• Top 10 des agences par anomalies</li>
                <li>• Résumé des anomalies par type</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-primary-700">Feuille des Anomalies</h4>
              <ul className="text-sm text-primary-600 space-y-1">
                <li>• Liste des anomalies clients particuliers</li>
                <li>• Liste des anomalies clients entreprises</li>
                <li>• Détails des champs en erreur</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-primary-700">Feuille FATCA</h4>
              <ul className="text-sm text-primary-600 space-y-1">
                <li>• Liste des clients avec indices US</li>
                <li>• Statut de documentation FATCA</li>
                <li>• Informations de contact</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-4 pt-4 border-t border-primary-200 flex justify-center">
            <Button 
              variant="primary" 
              leftIcon={<FileSpreadsheet className="h-4 w-4" />}
              onClick={generateExcelDashboard}
              disabled={isLoading || isExporting}
              isLoading={isExporting}
              className="w-full md:w-auto"
            >
              Générer le Tableau de Bord Excel Complet
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ReportsPage;