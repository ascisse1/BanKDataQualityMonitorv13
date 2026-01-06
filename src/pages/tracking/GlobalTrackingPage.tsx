import React, { useState, useEffect } from 'react';
import { BarChart, PieChart, TrendingUp, Calendar, Filter, Download, RefreshCw, FileSpreadsheet, Loader2, Building } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Input from '../../components/ui/Input';
import { useToast } from '../../components/ui/Toaster';
import { db } from '../../services/db';
import { useNotification } from '../../context/NotificationContext';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface TrackingData {
  agencyCode: string;
  agencyName: string;
  flux: {
    total: number;
    anomalies: number;
    fiabilises: number;
  };
  stock: {
    actifs: number;
    anomalies: number;
    fiabilises: number;
  };
  general: {
    actifs: number;
    anomalies: number;
    fiabilises: number;
  };
  indicators: {
    tauxAnomalies: number;
    tauxFiabilisation: number;
  };
}

const GlobalTrackingPage: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [trackingData, setTrackingData] = useState<TrackingData[]>([]);
  const [filteredData, setFilteredData] = useState<TrackingData[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAgency, setSelectedAgency] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 3);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    const date = new Date();
    return date.toISOString().split('T')[0];
  });
  const [clientTypes, setClientTypes] = useState<string[]>(['1', '2', '3']);
  const [agencies, setAgencies] = useState<{code_agence: string, lib_agence: string}[]>([]);
  const { addToast } = useToast();
  const { showNotification } = useNotification();

  useEffect(() => {
    fetchAgencies();
    fetchTrackingData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [trackingData, selectedAgency, clientTypes]);

  const fetchAgencies = async () => {
    try {
      const response = await fetch('/api/agencies');
      if (response.ok) {
        const data = await response.json();
        setAgencies(data);
      }
    } catch (error) {
      console.error('Error loading agencies:', error);
    }
  };

  const fetchTrackingData = async () => {
    try {
      setIsLoading(true);
      showNotification('Chargement des données de suivi...', 'loading');
      
      // Utiliser des données fictives pour le Burkina Faso
      const data = [
        {
          agencyCode: "01001",
          agencyName: "AGENCE OUAGADOUGOU PRINCIPALE",
          flux: {
            total: 876,
            anomalies: 175,
            fiabilises: 140
          },
          stock: {
            actifs: 8765,
            anomalies: 1753,
            fiabilises: 1402
          },
          general: {
            actifs: 8765,
            anomalies: 1753,
            fiabilises: 1402
          },
          indicators: {
            tauxAnomalies: 20.0,
            tauxFiabilisation: 80.0
          }
        },
        {
          agencyCode: "01002",
          agencyName: "AGENCE OUAGADOUGOU CENTRE",
          flux: {
            total: 765,
            anomalies: 153,
            fiabilises: 122
          },
          stock: {
            actifs: 7654,
            anomalies: 1531,
            fiabilises: 1225
          },
          general: {
            actifs: 7654,
            anomalies: 1531,
            fiabilises: 1225
          },
          indicators: {
            tauxAnomalies: 20.0,
            tauxFiabilisation: 80.0
          }
        },
        {
          agencyCode: "01003",
          agencyName: "AGENCE OUAGADOUGOU NORD",
          flux: {
            total: 654,
            anomalies: 196,
            fiabilises: 137
          },
          stock: {
            actifs: 6543,
            anomalies: 1963,
            fiabilises: 1374
          },
          general: {
            actifs: 6543,
            anomalies: 1963,
            fiabilises: 1374
          },
          indicators: {
            tauxAnomalies: 30.0,
            tauxFiabilisation: 70.0
          }
        },
        {
          agencyCode: "01004",
          agencyName: "AGENCE OUAGADOUGOU SUD",
          flux: {
            total: 543,
            anomalies: 163,
            fiabilises: 98
          },
          stock: {
            actifs: 5432,
            anomalies: 1630,
            fiabilises: 978
          },
          general: {
            actifs: 5432,
            anomalies: 1630,
            fiabilises: 978
          },
          indicators: {
            tauxAnomalies: 30.0,
            tauxFiabilisation: 60.0
          }
        },
        {
          agencyCode: "01005",
          agencyName: "AGENCE OUAGADOUGOU EST",
          flux: {
            total: 432,
            anomalies: 130,
            fiabilises: 65
          },
          stock: {
            actifs: 4321,
            anomalies: 1296,
            fiabilises: 648
          },
          general: {
            actifs: 4321,
            anomalies: 1296,
            fiabilises: 648
          },
          indicators: {
            tauxAnomalies: 30.0,
            tauxFiabilisation: 50.0
          }
        },
        {
          agencyCode: "01006",
          agencyName: "AGENCE OUAGADOUGOU OUEST",
          flux: {
            total: 398,
            anomalies: 120,
            fiabilises: 72
          },
          stock: {
            actifs: 3980,
            anomalies: 1194,
            fiabilises: 717
          },
          general: {
            actifs: 3980,
            anomalies: 1194,
            fiabilises: 717
          },
          indicators: {
            tauxAnomalies: 30.0,
            tauxFiabilisation: 60.0
          }
        },
        {
          agencyCode: "02001",
          agencyName: "AGENCE BOBO-DIOULASSO PRINCIPALE",
          flux: {
            total: 345,
            anomalies: 104,
            fiabilises: 73
          },
          stock: {
            actifs: 3450,
            anomalies: 1035,
            fiabilises: 725
          },
          general: {
            actifs: 3450,
            anomalies: 1035,
            fiabilises: 725
          },
          indicators: {
            tauxAnomalies: 30.0,
            tauxFiabilisation: 70.0
          }
        },
        {
          agencyCode: "03001",
          agencyName: "AGENCE KOUDOUGOU PRINCIPALE",
          flux: {
            total: 287,
            anomalies: 86,
            fiabilises: 52
          },
          stock: {
            actifs: 2870,
            anomalies: 861,
            fiabilises: 517
          },
          general: {
            actifs: 2870,
            anomalies: 861,
            fiabilises: 517
          },
          indicators: {
            tauxAnomalies: 30.0,
            tauxFiabilisation: 60.0
          }
        },
        {
          agencyCode: "04001",
          agencyName: "AGENCE BANFORA PRINCIPALE",
          flux: {
            total: 234,
            anomalies: 70,
            fiabilises: 35
          },
          stock: {
            actifs: 2340,
            anomalies: 702,
            fiabilises: 351
          },
          general: {
            actifs: 2340,
            anomalies: 702,
            fiabilises: 351
          },
          indicators: {
            tauxAnomalies: 30.0,
            tauxFiabilisation: 50.0
          }
        },
        {
          agencyCode: "05001",
          agencyName: "AGENCE OUAHIGOUYA PRINCIPALE",
          flux: {
            total: 198,
            anomalies: 59,
            fiabilises: 24
          },
          stock: {
            actifs: 1980,
            anomalies: 594,
            fiabilises: 237
          },
          general: {
            actifs: 1980,
            anomalies: 594,
            fiabilises: 237
          },
          indicators: {
            tauxAnomalies: 30.0,
            tauxFiabilisation: 40.0
          }
        }
      ];
      
      setTrackingData(data);
      setFilteredData(data);
      showNotification('Données de suivi chargées avec succès', 'success');
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      showNotification('Erreur lors du chargement des données de suivi', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...trackingData];
    
    if (selectedAgency) {
      filtered = filtered.filter(item => item.agencyCode === selectedAgency);
    }
    
    setFilteredData(filtered);
  };

  const handleAgencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedAgency(value || null);
  };

  const handleClientTypeChange = (type: string) => {
    setClientTypes(prev => {
      if (prev.includes(type)) {
        return prev.filter(t => t !== type);
      } else {
        return [...prev, type];
      }
    });
  };

  const handleRefresh = () => {
    fetchTrackingData();
  };

  const handleExportPDF = async () => {
    try {
      setIsExporting(true);
      showNotification('Préparation de l\'export PDF...', 'loading');

      const doc = new jsPDF('l', 'mm', 'a4');
      
      // Title
      doc.setFontSize(16);
      doc.text('Suivi Global de la Qualité des Données', 20, 20);
      
      // Date range
      doc.setFontSize(12);
      doc.text(`Période: ${startDate} à ${endDate}`, 20, 30);
      
      // Filters applied
      let filtersText = 'Filtres appliqués: ';
      if (selectedAgency) {
        const agencyName = agencies.find(a => a.code_agence === selectedAgency)?.lib_agence || selectedAgency;
        filtersText += `Agence: ${selectedAgency} (${agencyName}); `;
      }
      if (clientTypes.length < 3) {
        filtersText += `Types de clients: ${clientTypes.map(t => 
          t === '1' ? 'Particuliers' : t === '2' ? 'Entreprises' : 'Institutionnels'
        ).join(', ')}; `;
      }
      
      doc.text(filtersText, 20, 40);

      // Table headers
      const headers = [
        'Agence', 
        'Flux Total', 
        'Flux Anomalies', 
        'Flux Fiabilisés',
        'Stock Actifs',
        'Stock Anomalies',
        'Stock Fiabilisés',
        'Taux Anomalies',
        'Taux Fiabilisation'
      ];
      
      // Table data
      const data = filteredData.map(item => [
        `${item.agencyCode} - ${item.agencyName}`,
        item.flux.total.toString(),
        item.flux.anomalies.toString(),
        item.flux.fiabilises.toString(),
        item.stock.actifs.toString(),
        item.stock.anomalies.toString(),
        item.stock.fiabilises.toString(),
        `${item.indicators.tauxAnomalies.toFixed(1)}%`,
        `${item.indicators.tauxFiabilisation.toFixed(1)}%`
      ]);
      
      // Add the table
      (doc as any).autoTable({
        head: [headers],
        body: data,
        startY: 50,
        theme: 'grid',
        headStyles: { fillColor: [26, 54, 93], textColor: [255, 255, 255] },
        styles: { fontSize: 8 },
        columnStyles: {
          0: { cellWidth: 40 },
          7: { cellWidth: 25 },
          8: { cellWidth: 25 }
        }
      });
      
      // Add summary
      if (filteredData.length > 0) {
        const totalFlux = filteredData.reduce((sum, item) => sum + item.flux.total, 0);
        const totalFluxAnomalies = filteredData.reduce((sum, item) => sum + item.flux.anomalies, 0);
        const totalFluxFiabilises = filteredData.reduce((sum, item) => sum + item.flux.fiabilises, 0);
        const totalStockActifs = filteredData.reduce((sum, item) => sum + item.stock.actifs, 0);
        const totalStockAnomalies = filteredData.reduce((sum, item) => sum + item.stock.anomalies, 0);
        const totalStockFiabilises = filteredData.reduce((sum, item) => sum + item.stock.fiabilises, 0);
        
        const avgTauxAnomalies = filteredData.reduce((sum, item) => sum + item.indicators.tauxAnomalies, 0) / filteredData.length;
        const avgTauxFiabilisation = filteredData.reduce((sum, item) => sum + item.indicators.tauxFiabilisation, 0) / filteredData.length;
        
        doc.setFontSize(12);
        doc.text('Résumé Global', 20, doc.autoTable.previous.finalY + 15);
        
        const summaryData = [
          ['Total Flux', totalFlux.toString()],
          ['Total Flux Anomalies', totalFluxAnomalies.toString()],
          ['Total Flux Fiabilisés', totalFluxFiabilises.toString()],
          ['Total Stock Actifs', totalStockActifs.toString()],
          ['Total Stock Anomalies', totalStockAnomalies.toString()],
          ['Total Stock Fiabilisés', totalStockFiabilises.toString()],
          ['Taux Moyen Anomalies', `${avgTauxAnomalies.toFixed(1)}%`],
          ['Taux Moyen Fiabilisation', `${avgTauxFiabilisation.toFixed(1)}%`]
        ];
        
        (doc as any).autoTable({
          body: summaryData,
          startY: doc.autoTable.previous.finalY + 20,
          theme: 'grid',
          styles: { fontSize: 10 },
          columnStyles: {
            0: { fontStyle: 'bold' }
          }
        });
      }
      
      // Save the PDF
      const date = new Date().toISOString().split('T')[0];
      const filename = `suivi_global_${date}.pdf`;
      doc.save(filename);
      
      showNotification('Export PDF réussi', 'success');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      showNotification('Erreur lors de l\'export PDF', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      showNotification('Préparation de l\'export Excel...', 'loading');

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Create CSV content
      const headers = [
        'Code Agence',
        'Nom Agence',
        'Flux Total',
        'Flux Anomalies',
        'Flux Fiabilisés',
        'Stock Actifs',
        'Stock Anomalies',
        'Stock Fiabilisés',
        'Taux Anomalies (%)',
        'Taux Fiabilisation (%)'
      ];

      const rows = filteredData.map(item => [
        item.agencyCode,
        item.agencyName,
        item.flux.total,
        item.flux.anomalies,
        item.flux.fiabilises,
        item.stock.actifs,
        item.stock.anomalies,
        item.stock.fiabilises,
        item.indicators.tauxAnomalies.toFixed(1),
        item.indicators.tauxFiabilisation.toFixed(1)
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => 
          row.map(cell => {
            // Escape commas and quotes
            const cellStr = String(cell);
            if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
              return `"${cellStr.replace(/"/g, '""')}"`;
            }
            return cellStr;
          }).join(',')
        )
      ].join('\n');

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      const date = new Date().toISOString().split('T')[0];
      const filename = `suivi_global_${date}.csv`;
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      showNotification('Export Excel réussi', 'success');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      showNotification('Erreur lors de l\'export Excel', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // Chart options for anomaly rates
  const anomalyRateChartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: true,
        dataLabels: {
          position: 'top'
        }
      }
    },
    dataLabels: {
      enabled: true,
      formatter: function(val) {
        return val + '%';
      },
      offsetX: 20,
      style: {
        fontSize: '12px',
        colors: ['#304758']
      }
    },
    stroke: {
      show: true,
      width: 1,
      colors: ['#fff']
    },
    xaxis: {
      categories: filteredData.map(item => `${item.agencyCode} - ${item.agencyName}`),
      labels: {
        formatter: function(val) {
          return val + '%';
        }
      }
    },
    yaxis: {
      labels: {
        maxWidth: 150
      }
    },
    colors: ['#1A365D']
  };

  // Chart options for fiabilisation rates
  const fiabilisationRateChartOptions: ApexOptions = {
    ...anomalyRateChartOptions,
    colors: ['#34BB80']
  };

  // Chart options for flux comparison
  const fluxComparisonChartOptions: ApexOptions = {
    chart: {
      type: 'bar',
      height: 350,
      stacked: true,
      toolbar: {
        show: false
      }
    },
    plotOptions: {
      bar: {
        horizontal: false
      }
    },
    stroke: {
      width: 1,
      colors: ['#fff']
    },
    xaxis: {
      categories: filteredData.map(item => item.agencyCode)
    },
    yaxis: {
      title: {
        text: 'Nombre d\'enregistrements'
      }
    },
    fill: {
      opacity: 1
    },
    legend: {
      position: 'top',
      horizontalAlign: 'left'
    },
    colors: ['#1A365D', '#F0B429', '#34BB80']
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Suivi Global</h1>
          <p className="mt-1 text-sm text-gray-500">
            Suivi de la qualité des données et des corrections par agence
          </p>
        </div>
        
        <div className="mt-4 sm:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            leftIcon={<RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />}
            onClick={handleRefresh}
            disabled={isLoading || isExporting}
          >
            {isLoading ? 'Chargement...' : 'Actualiser'}
          </Button>
          
          <Button 
            variant="outline" 
            size="sm" 
            leftIcon={<FileSpreadsheet className="h-4 w-4" />}
            onClick={handleExportExcel}
            disabled={isLoading || isExporting}
          >
            Export Excel
          </Button>

          <Button 
            variant="outline" 
            size="sm" 
            leftIcon={isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            onClick={handleExportPDF}
            disabled={isLoading || isExporting}
          >
            Export PDF
          </Button>
          
          <Button 
            variant={showFilters ? 'primary' : 'outline'} 
            size="sm" 
            leftIcon={<Filter className="h-4 w-4" />}
            onClick={() => setShowFilters(!showFilters)}
            disabled={isLoading || isExporting}
          >
            {showFilters ? 'Masquer les filtres' : 'Afficher les filtres'}
          </Button>
        </div>
      </div>

      {showFilters && (
        <Card>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Période
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    leftIcon={<Calendar className="h-4 w-4 text-gray-400" />}
                  />
                  <Input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    leftIcon={<Calendar className="h-4 w-4 text-gray-400" />}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agence
                </label>
                <select
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={selectedAgency || ''}
                  onChange={handleAgencyChange}
                >
                  <option value="">Toutes les agences</option>
                  {agencies.map((agency) => (
                    <option key={agency.code_agence} value={agency.code_agence}>
                      {agency.code_agence} - {agency.lib_agence}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Types de clients
                </label>
                <div className="space-y-2">
                  <label className="inline-flex items-center mr-4">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                      checked={clientTypes.includes('1')}
                      onChange={() => handleClientTypeChange('1')}
                    />
                    <span className="ml-2 text-sm text-gray-700">Particuliers</span>
                  </label>
                  <label className="inline-flex items-center mr-4">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                      checked={clientTypes.includes('2')}
                      onChange={() => handleClientTypeChange('2')}
                    />
                    <span className="ml-2 text-sm text-gray-700">Entreprises</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                      checked={clientTypes.includes('3')}
                      onChange={() => handleClientTypeChange('3')}
                    />
                    <span className="ml-2 text-sm text-gray-700">Institutionnels</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={handleRefresh}
                disabled={isLoading}
              >
                Appliquer les filtres
              </Button>
            </div>
          </div>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => (
            <Card key={i} isLoading={true} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-primary-100 rounded-full">
                <TrendingUp className="h-5 w-5 text-primary-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Taux moyen d'anomalies</p>
                <p className="text-lg font-semibold text-gray-900">
                  {filteredData.length > 0 
                    ? (filteredData.reduce((sum, item) => sum + item.indicators.tauxAnomalies, 0) / filteredData.length).toFixed(1)
                    : '0.0'}%
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-success-100 rounded-full">
                <TrendingUp className="h-5 w-5 text-success-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Taux moyen de fiabilisation</p>
                <p className="text-lg font-semibold text-gray-900">
                  {filteredData.length > 0 
                    ? (filteredData.reduce((sum, item) => sum + item.indicators.tauxFiabilisation, 0) / filteredData.length).toFixed(1)
                    : '0.0'}%
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center">
              <div className="p-2 bg-warning-100 rounded-full">
                <Building className="h-5 w-5 text-warning-600" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-500">Agences suivies</p>
                <p className="text-lg font-semibold text-gray-900">{filteredData.length}</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      <Card
        title="Taux d'anomalies par agence"
        description="Pourcentage d'anomalies détectées par rapport au nombre total de clients"
        isLoading={isLoading}
      >
        {filteredData.length > 0 ? (
          <div className="h-96">
            <Chart
              options={anomalyRateChartOptions}
              series={[{
                name: 'Taux d\'anomalies',
                data: filteredData.map(item => item.indicators.tauxAnomalies).filter(Boolean)
              }]}
              type="bar"
              height="100%"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Aucune donnée disponible</p>
          </div>
        )}
      </Card>

      <Card
        title="Taux de fiabilisation par agence"
        description="Pourcentage d'anomalies corrigées par rapport au nombre total d'anomalies"
        isLoading={isLoading}
      >
        {filteredData.length > 0 ? (
          <div className="h-96">
            <Chart
              options={fiabilisationRateChartOptions}
              series={[{
                name: 'Taux de fiabilisation',
                data: filteredData.map(item => item.indicators.tauxFiabilisation).filter(Boolean)
              }]}
              type="bar"
              height="100%"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Aucune donnée disponible</p>
          </div>
        )}
      </Card>

      <Card
        title="Comparaison des flux par agence"
        description="Répartition des flux totaux, anomalies et fiabilisés par agence"
        isLoading={isLoading}
      >
        {filteredData.length > 0 ? (
          <div className="h-96">
            <Chart
              options={fluxComparisonChartOptions}
              series={[
                {
                  name: 'Flux Total',
                  data: filteredData.map(item => item.flux.total).filter(Boolean)
                },
                {
                  name: 'Anomalies',
                  data: filteredData.map(item => item.flux.anomalies).filter(Boolean)
                },
                {
                  name: 'Fiabilisés',
                  data: filteredData.map(item => item.flux.fiabilises).filter(Boolean)
                }
              ]}
              type="bar"
              height="100%"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64">
            <p className="text-gray-500">Aucune donnée disponible</p>
          </div>
        )}
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Agence
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Flux Total
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Flux Anomalies
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Flux Fiabilisés
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Actifs
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Anomalies
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Stock Fiabilisés
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taux Anomalies
                </th>
                <th scope="col" className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Taux Fiabilisation
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="px-3 py-4 whitespace-nowrap">
                    <div className="flex justify-center">
                      <Loader2 className="h-5 w-5 text-primary-500 animate-spin" />
                    </div>
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-3 py-4 whitespace-nowrap text-center text-gray-500">
                    Aucune donnée disponible
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.agencyCode} className="hover:bg-gray-50">
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                          <Building className="h-4 w-4 text-gray-500" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{item.agencyCode}</div>
                          <div className="text-xs text-gray-500">{item.agencyName}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.flux.total.toLocaleString('fr-FR')}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.flux.anomalies.toLocaleString('fr-FR')}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.flux.fiabilises.toLocaleString('fr-FR')}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.stock.actifs.toLocaleString('fr-FR')}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.stock.anomalies.toLocaleString('fr-FR')}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap text-sm text-gray-900">
                      {item.stock.fiabilises.toLocaleString('fr-FR')}
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{item.indicators.tauxAnomalies.toFixed(1)}%</span>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-primary-500 rounded-full h-2" 
                            style={{ width: `${Math.min(100, item.indicators.tauxAnomalies)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-gray-900">{item.indicators.tauxFiabilisation.toFixed(1)}%</span>
                        <div className="ml-2 w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-success-500 rounded-full h-2" 
                            style={{ width: `${Math.min(100, item.indicators.tauxFiabilisation)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="border-primary-200 bg-primary-50">
        <div className="p-6">
          <h3 className="text-lg font-medium text-primary-800 mb-4">Suivi de la Qualité des Données</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-primary-700">Flux</h4>
              <ul className="text-sm text-primary-600 space-y-1">
                <li>• Nouveaux clients entrés en relation</li>
                <li>• Anomalies détectées sur les nouveaux clients</li>
                <li>• Anomalies corrigées sur les nouveaux clients</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-primary-700">Stock</h4>
              <ul className="text-sm text-primary-600 space-y-1">
                <li>• Clients actifs dans le portefeuille</li>
                <li>• Anomalies détectées sur le portefeuille</li>
                <li>• Anomalies corrigées sur le portefeuille</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-primary-700">Indicateurs</h4>
              <ul className="text-sm text-primary-600 space-y-1">
                <li>• Taux d'anomalies = Anomalies / Clients actifs</li>
                <li>• Taux de fiabilisation = Corrigés / Anomalies</li>
                <li>• Suivi par agence et par type de client</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GlobalTrackingPage;