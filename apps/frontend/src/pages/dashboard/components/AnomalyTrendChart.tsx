import { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { apiService } from '../../../services/apiService';

interface TrendData {
  date: string;
  count: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

interface AnomalyTrendChartProps {
  isLoading?: boolean;
}

const AnomalyTrendChart = ({ isLoading: externalLoading = false }: AnomalyTrendChartProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<{
    series: {
      name: string;
      data: number[];
    }[];
    options: ApexOptions;
  }>({
    series: [
      {
        name: 'Anomalies',
        data: [],
      },
    ],
    options: {
      chart: {
        type: 'area',
        fontFamily: 'Inter, system-ui, sans-serif',
        toolbar: {
          show: false,
        },
        zoom: {
          enabled: false,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        curve: 'smooth',
        width: 3,
      },
      colors: ['#1A365D'],
      fill: {
        type: 'gradient',
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.5,
          opacityTo: 0.1,
          stops: [0, 100],
        },
      },
      grid: {
        borderColor: '#f1f1f1',
        row: {
          colors: ['transparent', 'transparent'],
          opacity: 0.5,
        },
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
          formatter: (value) => `${Math.round(value)}`,
        },
      },
      tooltip: {
        x: {
          format: 'dd/MM/yy',
        },
      },
      markers: {
        size: 4,
        colors: ['#1A365D'],
        strokeColors: '#fff',
        strokeWidth: 2,
        hover: {
          size: 6,
        },
      },
    },
  });

  useEffect(() => {
    const fetchTrendData = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.get<ApiResponse<TrendData[]>>('/anomalies/trends?days=30');

        if (response.success && response.data && response.data.length > 0) {
          const sortedData = [...response.data].sort((a, b) =>
            new Date(a.date).getTime() - new Date(b.date).getTime()
          );

          const dates = sortedData.map(item => {
            const date = new Date(item.date);
            return date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
          });

          const counts = sortedData.map(item => Number(item.count) || 0);

          setChartData(prev => ({
            ...prev,
            series: [
              {
                name: 'Anomalies',
                data: counts,
              },
            ],
            options: {
              ...prev.options,
              xaxis: {
                ...prev.options.xaxis,
                categories: dates,
              },
            },
          }));
        }
      } catch (err) {
        console.error('Failed to fetch anomaly trends:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (!externalLoading) {
      fetchTrendData();
    }
  }, [externalLoading]);

  if (isLoading || externalLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-full h-full">
          <div className="animate-pulse">
            <div className="h-full bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Chart
        options={chartData.options}
        series={chartData.series}
        type="area"
        height="100%"
      />
    </div>
  );
};

export default AnomalyTrendChart;
