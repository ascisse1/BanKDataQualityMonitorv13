import { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { useToast } from '../../../components/ui/Toaster';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '../../../components/ui/Button';

interface AgencyCorrectionChartProps {
  isLoading?: boolean;
}

interface AgencyCorrectionStat {
  agency_code: string;
  agency_name: string;
  total_anomalies: number;
  fixed_anomalies: number;
  in_review_anomalies: number;
  rejected_anomalies: number;
  correction_rate: number;
  last_updated: string;
}

const AgencyCorrectionChart = ({ isLoading = false }: AgencyCorrectionChartProps) => {
  const [chartData, setChartData] = useState<{
    series: {
      name: string;
      data: number[];
    }[];
    options: ApexOptions;
  }>({
    series: [
      {
        name: 'Taux de correction',
        data: [],
      },
    ],
    options: {
      chart: {
        type: 'bar',
        height: 450,
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '90%',
          borderRadius: 4,
          distributed: true,
          dataLabels: {
            position: 'bottom',
          },
        },
      },
      colors: ['#4371AF', '#1A365D', '#34BB80', '#F0B429', '#EF4744'],
      dataLabels: {
        enabled: true,
        formatter: function (val) {
          return val.toFixed(1) + '%';
        },
        style: {
          fontSize: '12px',
          colors: ['#1A365D'],
        },
        offsetX: 30,
      },
      xaxis: {
        categories: [],
        labels: {
          style: {
            colors: '#6B7280',
            fontSize: '12px',
          },
          formatter: function (val) {
            return val.toFixed(1) + '%';
          },
        },
        axisBorder: {
          show: false,
        },
        axisTicks: {
          show: false,
        },
      },
      yaxis: {
        labels: {
          style: {
            colors: '#6B7280',
            fontSize: '12px',
          },
          maxWidth: 200,
        },
      },
      grid: {
        borderColor: '#f1f1f1',
        xaxis: {
          lines: {
            show: true,
          },
        },
        yaxis: {
          lines: {
            show: false,
          },
        },
      },
      tooltip: {
        y: {
          title: {
            formatter: () => 'Taux de correction',
          },
          formatter: (val) => `${val.toFixed(1)}%`,
        },
      },
    },
  });

  const [stats, setStats] = useState<AgencyCorrectionStat[]>([]);
  const [loading, setLoading] = useState(isLoading);
  const [error, setError] = useState<string | null>(null);
  const [useHardcodedData, setUseHardcodedData] = useState(false);
  const { addToast } = useToast();
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      if (useHardcodedData) {
        // Utiliser directement les données en dur
        const hardcodedData = [
          { agency_code: "01001", agency_name: "AGENCE OUAGADOUGOU PRINCIPALE", total_anomalies: 4801, fixed_anomalies: 3842, in_review_anomalies: 523, rejected_anomalies: 120, correction_rate: 80.0, last_updated: new Date().toISOString() },
          { agency_code: "01002", agency_name: "AGENCE OUAGADOUGOU CENTRE", total_anomalies: 3631, fixed_anomalies: 2905, in_review_anomalies: 453, rejected_anomalies: 100, correction_rate: 79.9, last_updated: new Date().toISOString() },
          { agency_code: "01003", agency_name: "AGENCE OUAGADOUGOU NORD", total_anomalies: 4843, fixed_anomalies: 3630, in_review_anomalies: 605, rejected_anomalies: 150, correction_rate: 75.0, last_updated: new Date().toISOString() },
          { agency_code: "01004", agency_name: "AGENCE OUAGADOUGOU SUD", total_anomalies: 4471, fixed_anomalies: 3130, in_review_anomalies: 670, rejected_anomalies: 200, correction_rate: 70.0, last_updated: new Date().toISOString() },
          { agency_code: "01005", agency_name: "AGENCE OUAGADOUGOU EST", total_anomalies: 3194, fixed_anomalies: 2235, in_review_anomalies: 479, rejected_anomalies: 160, correction_rate: 70.0, last_updated: new Date().toISOString() },
          { agency_code: "02001", agency_name: "AGENCE BOBO-DIOULASSO PRINCIPALE", total_anomalies: 3592, fixed_anomalies: 2155, in_review_anomalies: 539, rejected_anomalies: 180, correction_rate: 60.0, last_updated: new Date().toISOString() },
          { agency_code: "03001", agency_name: "AGENCE KOUDOUGOU PRINCIPALE", total_anomalies: 2584, fixed_anomalies: 1550, in_review_anomalies: 388, rejected_anomalies: 129, correction_rate: 60.0, last_updated: new Date().toISOString() },
          { agency_code: "04001", agency_name: "AGENCE BANFORA PRINCIPALE", total_anomalies: 1804, fixed_anomalies: 902, in_review_anomalies: 270, rejected_anomalies: 90, correction_rate: 50.0, last_updated: new Date().toISOString() },
          { agency_code: "05001", agency_name: "AGENCE OUAHIGOUYA PRINCIPALE", total_anomalies: 1716, fixed_anomalies: 686, in_review_anomalies: 257, rejected_anomalies: 86, correction_rate: 40.0, last_updated: new Date().toISOString() },
          { agency_code: "16001", agency_name: "AGENCE THOMAS SANKARA", total_anomalies: 2716, fixed_anomalies: 2173, in_review_anomalies: 407, rejected_anomalies: 136, correction_rate: 80.0, last_updated: new Date().toISOString() }
        ];
        setStats(hardcodedData);
        updateChartWithData(hardcodedData);
        setLoading(false);
      } else {
        fetchData();
      }
    }
  }, [isLoading, retryCount]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Generate test data
      const testData = generateTestData();
      setStats(testData);
      updateChartWithData(testData);
      
    } catch (error) {
      console.error('Error fetching agency correction stats:', error);
      setError('Erreur lors du chargement des données');
      
      // Use test data in case of error
      const testData = generateTestData();
      setStats(testData);
      updateChartWithData(testData);
    } finally {
      setLoading(false);
    }
  };

  const generateTestData = (): AgencyCorrectionStat[] => {
    return [
      { agency_code: '01001', agency_name: 'AGENCE OUAGADOUGOU PRINCIPALE', total_anomalies: 4801, fixed_anomalies: 3842, in_review_anomalies: 523, rejected_anomalies: 120, correction_rate: 80.0, last_updated: new Date().toISOString() },
      { agency_code: '01002', agency_name: 'AGENCE OUAGADOUGOU CENTRE', total_anomalies: 363, fixed_anomalies: 290, in_review_anomalies: 45, rejected_anomalies: 10, correction_rate: 79.9, last_updated: new Date().toISOString() },
      { agency_code: '01003', agency_name: 'AGENCE OUAGADOUGOU NORD', total_anomalies: 4843, fixed_anomalies: 3630, in_review_anomalies: 605, rejected_anomalies: 150, correction_rate: 75.0, last_updated: new Date().toISOString() },
      { agency_code: '01004', agency_name: 'AGENCE OUAGADOUGOU SUD', total_anomalies: 4471, fixed_anomalies: 3130, in_review_anomalies: 670, rejected_anomalies: 200, correction_rate: 70.0, last_updated: new Date().toISOString() },
      { agency_code: '01005', agency_name: 'AGENCE OUAGADOUGOU EST', total_anomalies: 3194, fixed_anomalies: 2235, in_review_anomalies: 479, rejected_anomalies: 160, correction_rate: 70.0, last_updated: new Date().toISOString() },
      { agency_code: '01006', agency_name: 'AGENCE OUAGADOUGOU OUEST', total_anomalies: 702, fixed_anomalies: 456, in_review_anomalies: 105, rejected_anomalies: 35, correction_rate: 65.0, last_updated: new Date().toISOString() },
      { agency_code: '01007', agency_name: 'AGENCE OUAGADOUGOU ENTREPRISES', total_anomalies: 3592, fixed_anomalies: 2155, in_review_anomalies: 539, rejected_anomalies: 180, correction_rate: 60.0, last_updated: new Date().toISOString() },
      { agency_code: '01008', agency_name: 'AGENCE OUAGADOUGOU INTERNATIONALE', total_anomalies: 2584, fixed_anomalies: 1550, in_review_anomalies: 388, rejected_anomalies: 129, correction_rate: 60.0, last_updated: new Date().toISOString() },
      { agency_code: '01009', agency_name: 'AGENCE OUAGADOUGOU ZONE INDUSTRIELLE', total_anomalies: 804, fixed_anomalies: 402, in_review_anomalies: 120, rejected_anomalies: 40, correction_rate: 50.0, last_updated: new Date().toISOString() },
      { agency_code: '01010', agency_name: 'AGENCE OUAGADOUGOU QUARTIER DU COMMERCE', total_anomalies: 716, fixed_anomalies: 286, in_review_anomalies: 107, rejected_anomalies: 36, correction_rate: 40.0, last_updated: new Date().toISOString() }
    ];
  };

  const updateChartWithData = (data: AgencyCorrectionStat[]) => {
    // Sort by correction rate in descending order
    const sortedData = [...data].sort((a, b) => b.correction_rate - a.correction_rate);
    
    // Take the top 10 agencies
    const top10 = sortedData.slice(0, 10);
    
    setChartData({
      ...chartData,
      series: [
        {
          name: 'Taux de correction',
          data: top10.map(item => item.correction_rate).filter(Boolean),
        },
      ],
      options: {
        ...chartData.options,
        xaxis: {
          ...chartData.options.xaxis,
          categories: top10.map(item => `${item.agency_name} (${item.agency_code})`),
        },
        colors: top10.map(item => {
          if (item.correction_rate >= 75) return '#34BB80'; // Green for >= 75%
          if (item.correction_rate >= 50) return '#F0B429'; // Yellow for >= 50%
          return '#EF4744'; // Red for < 50%
        }),
      },
    });
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    addToast('Tentative de rechargement des données...', 'info');
  };

  if (loading) {
    return (
      <div className="w-full h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-[450px] bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-error-50 border border-error-200 rounded-lg">
        <AlertTriangle className="h-12 w-12 text-error-500 mb-4" />
        <p className="text-error-700 mb-4">{error}</p>
        <Button
          variant="primary"
          size="sm"
          leftIcon={<RefreshCw className="h-4 w-4" />}
          onClick={handleRetry}
        >
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full h-[450px]">
      <Chart
        options={chartData.options}
        series={chartData.series}
        type="bar"
        height="100%"
      />
    </div>
  );
};

export default AgencyCorrectionChart;