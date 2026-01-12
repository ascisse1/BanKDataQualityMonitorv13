import { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { apiService } from '../../../services/apiService';

interface FieldData {
  fieldName: string;
  count: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

interface TopAnomalyFieldsProps {
  isLoading?: boolean;
  clientType?: 'INDIVIDUAL' | 'CORPORATE' | 'INSTITUTIONAL';
}

const TopAnomalyFields = ({ isLoading: externalLoading = false, clientType = 'INDIVIDUAL' }: TopAnomalyFieldsProps) => {
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
        type: 'bar',
        fontFamily: 'Inter, system-ui, sans-serif',
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '60%',
          borderRadius: 4,
        },
      },
      dataLabels: {
        enabled: false,
      },
      colors: ['#1A365D'],
      grid: {
        borderColor: '#f1f1f1',
        xaxis: {
          lines: {
            show: false,
          },
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
        },
      },
      tooltip: {
        y: {
          formatter: (val) => `${val} anomalies`,
        },
      },
    },
  });

  useEffect(() => {
    const fetchTopFields = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.get<ApiResponse<FieldData[]>>(`/anomalies/top-fields/${clientType}?limit=5`);

        if (response.success && response.data && response.data.length > 0) {
          const fieldNames = response.data.map(item => item.fieldName || 'Inconnu');
          const counts = response.data.map(item => Number(item.count) || 0);

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
                categories: fieldNames,
              },
            },
          }));
        }
      } catch (err) {
        console.error('Failed to fetch top anomaly fields:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (!externalLoading) {
      fetchTopFields();
    }
  }, [externalLoading, clientType]);

  if (isLoading || externalLoading) {
    return (
      <div className="w-full h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Chart
        options={chartData.options}
        series={chartData.series}
        type="bar"
        height="100%"
      />
    </div>
  );
};

export default TopAnomalyFields;
