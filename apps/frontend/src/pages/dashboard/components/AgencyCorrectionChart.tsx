import { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { useToast } from '../../../components/ui/Toaster';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '../../../components/ui/Button';
import { log } from '../../../services/log';

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
  const { addToast } = useToast();
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      fetchData();
    }
  }, [isLoading, retryCount]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with real API call
      setStats([]);
      updateChartWithData([]);

    } catch (error) {
      log.error('api', 'Error fetching agency correction stats', { error });
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
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