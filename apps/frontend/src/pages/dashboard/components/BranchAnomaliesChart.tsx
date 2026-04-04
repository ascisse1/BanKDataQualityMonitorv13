import { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { apiService } from '@/services/apiService';
import { log } from '@/services/log';

interface BranchData {
  code_agence: string;
  lib_agence: string;
  nombre_anomalies: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

interface BranchAnomaliesChartProps {
  isLoading?: boolean;
}

const BranchAnomaliesChart = ({ isLoading: externalLoading = false }: BranchAnomaliesChartProps) => {
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
        },
      },
      dataLabels: {
        enabled: true,
        formatter: function (val) {
          return val.toString();
        },
        style: {
          fontSize: '12px',
          colors: ['#1A365D'],
        },
      },
      colors: ['#4371AF', '#1A365D', '#34BB80', '#F0B429', '#EF4744'],
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
            formatter: () => 'Anomalies',
          },
        },
      },
    },
  });

  useEffect(() => {
    const fetchBranchData = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.get<ApiResponse<BranchData[]>>('/anomalies/by-branch');

        if (response.success && response.data && response.data.length > 0) {
          const topAgences = response.data.slice(0, 15);

          setChartData(prev => ({
            ...prev,
            series: [
              {
                name: 'Anomalies',
                data: topAgences.map(a => Number(a.nombre_anomalies) || 0),
              },
            ],
            options: {
              ...prev.options,
              xaxis: {
                ...prev.options.xaxis,
                categories: topAgences.map(a => `${a.lib_agence || 'Agence'} (${a.code_agence || ''})`),
              },
            },
          }));
        }
      } catch (err) {
        log.error('api', 'Error fetching branch data', { error: err });
      } finally {
        setIsLoading(false);
      }
    };

    if (!externalLoading) {
      fetchBranchData();
    }
  }, [externalLoading]);

  if (isLoading || externalLoading) {
    return (
      <div className="w-full h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-[450px] bg-gray-200 rounded"></div>
        </div>
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

export default BranchAnomaliesChart;
