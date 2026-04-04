import { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { apiService } from '@/services/apiService';
import { useToast } from '@/components/ui/Toaster';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import { log } from '@/services/log';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

interface WeeklyCorrectionTrendProps {
  isLoading?: boolean;
}

interface WeeklyCorrectionStat {
  year_week: string;
  week_label: string;
  status: 'detected' | 'in_review' | 'fixed' | 'rejected';
  count: number;
}

const WeeklyCorrectionTrend = ({ isLoading = false }: WeeklyCorrectionTrendProps) => {
  const [chartData, setChartData] = useState<{
    series: {
      name: string;
      data: number[];
    }[];
    options: ApexOptions;
  }>({
    series: [
      {
        name: 'Détectées',
        data: [],
      },
      {
        name: 'En revue',
        data: [],
      },
      {
        name: 'Corrigées',
        data: [],
      },
      {
        name: 'Rejetées',
        data: [],
      },
    ],
    options: {
      chart: {
        type: 'line',
        height: 350,
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
      },
      colors: ['#EF4744', '#F0B429', '#34BB80', '#6B7280'],
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
        width: 3,
      },
      xaxis: {
        categories: [],
        labels: {
          style: {
            colors: '#6B7280',
            fontSize: '12px',
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
          formatter: (value) => `${value}`,
        },
      },
      tooltip: {
        y: {
          formatter: (val) => `${val} anomalies`,
        },
      },
      legend: {
        position: 'top',
        horizontalAlign: 'right',
        floating: true,
        offsetY: -25,
        offsetX: -5,
      },
      markers: {
        size: 4,
        strokeWidth: 0,
      },
    },
  });

  const [stats, setStats] = useState<WeeklyCorrectionStat[]>([]);
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

      const response = await apiService.get<ApiResponse<WeeklyCorrectionStat[]>>('/stats/weekly-correction-trend');

      if (response.success && response.data) {
        setStats(response.data);
        updateChartWithData(response.data);
      } else {
        setStats([]);
        updateChartWithData([]);
      }

    } catch (error) {
      log.error('api', 'Error fetching weekly correction stats', { error });
      setError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const updateChartWithData = (data: WeeklyCorrectionStat[]) => {
    // Get unique weeks
    const uniqueWeeks = Array.from(new Set(data.map(item => item.week_label))).sort();
    
    // Prepare data series for each status
    const detectedData = uniqueWeeks.map(week => {
      const item = data.find(d => d.week_label === week && d.status === 'detected');
      return item ? item.count : 0;
    });
    
    const inReviewData = uniqueWeeks.map(week => {
      const item = data.find(d => d.week_label === week && d.status === 'in_review');
      return item ? item.count : 0;
    });
    
    const fixedData = uniqueWeeks.map(week => {
      const item = data.find(d => d.week_label === week && d.status === 'fixed');
      return item ? item.count : 0;
    });
    
    const rejectedData = uniqueWeeks.map(week => {
      const item = data.find(d => d.week_label === week && d.status === 'rejected');
      return item ? item.count : 0;
    });
    
    setChartData({
      ...chartData,
      series: [
        {
          name: 'Détectées',
          data: detectedData.filter(Boolean),
        },
        {
          name: 'En revue',
          data: inReviewData.filter(Boolean),
        },
        {
          name: 'Corrigées',
          data: fixedData.filter(Boolean),
        },
        {
          name: 'Rejetées',
          data: rejectedData.filter(Boolean),
        },
      ],
      options: {
        ...chartData.options,
        xaxis: {
          ...chartData.options.xaxis,
          categories: uniqueWeeks,
        },
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
          <div className="h-[350px] bg-gray-200 rounded"></div>
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
    <div className="w-full h-[350px]">
      <Chart
        options={chartData.options}
        series={chartData.series}
        type="line"
        height="100%"
      />
    </div>
  );
};

export default WeeklyCorrectionTrend;