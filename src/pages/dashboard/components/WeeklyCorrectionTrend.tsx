import { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { useToast } from '../../../components/ui/Toaster';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from '../../../components/ui/Button';

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
  const [useHardcodedData, setUseHardcodedData] = useState(false);
  const { addToast } = useToast();
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!isLoading) {
      if (useHardcodedData) {
        // Utiliser directement les données en dur
        const hardcodedData = [
          { year_week: "20251", week_label: "2025-W1", status: "detected", count: 142 },
          { year_week: "20251", week_label: "2025-W1", status: "in_review", count: 87 },
          { year_week: "20251", week_label: "2025-W1", status: "fixed", count: 65 },
          { year_week: "20251", week_label: "2025-W1", status: "rejected", count: 12 },
          { year_week: "20252", week_label: "2025-W2", status: "detected", count: 128 },
          { year_week: "20252", week_label: "2025-W2", status: "in_review", count: 92 },
          { year_week: "20252", week_label: "2025-W2", status: "fixed", count: 58 },
          { year_week: "20252", week_label: "2025-W2", status: "rejected", count: 15 },
          { year_week: "20253", week_label: "2025-W3", status: "detected", count: 135 },
          { year_week: "20253", week_label: "2025-W3", status: "in_review", count: 78 },
          { year_week: "20253", week_label: "2025-W3", status: "fixed", count: 62 },
          { year_week: "20253", week_label: "2025-W3", status: "rejected", count: 18 }
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
      
      // Generate fallback data
      const testData = generateTestData();
      setStats(testData);
      updateChartWithData(testData);
      
    } catch (error) {
      console.error('Error fetching weekly correction stats:', error);
      setError('Erreur lors du chargement des données');
      
      // Use fallback data in case of error
      const testData = generateTestData();
      setStats(testData);
      updateChartWithData(testData);
    } finally {
      setLoading(false);
    }
  };

  const generateTestData = (): WeeklyCorrectionStat[] => {
    const weeks = 12;
    const result: WeeklyCorrectionStat[] = [];
    
    for (let i = 0; i < weeks; i++) {
      const date = new Date();
      date.setDate(date.getDate() - (weeks - i) * 7);
      
      const yearWeek = `${date.getFullYear()}${Math.floor(i / 4) + 1}`;
      const weekLabel = `${date.getFullYear()}-W${String(Math.floor(i / 4) + 1).padStart(2, '0')}`;
      
      // Generate random values for each status
      const detectedCount = Math.floor(Math.random() * 100) + 50;
      const inReviewCount = Math.floor(Math.random() * 80) + 20;
      const fixedCount = Math.floor(Math.random() * 60) + 10;
      const rejectedCount = Math.floor(Math.random() * 20) + 5;
      
      result.push(
        { year_week: yearWeek, week_label: weekLabel, status: 'detected', count: detectedCount },
        { year_week: yearWeek, week_label: weekLabel, status: 'in_review', count: inReviewCount },
        { year_week: yearWeek, week_label: weekLabel, status: 'fixed', count: fixedCount },
        { year_week: yearWeek, week_label: weekLabel, status: 'rejected', count: rejectedCount }
      );
    }
    
    return result;
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