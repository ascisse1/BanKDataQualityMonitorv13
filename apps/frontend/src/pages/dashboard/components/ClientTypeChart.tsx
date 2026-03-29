import { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { apiService } from '../../../services/apiService';
import { log } from '../../../services/log';

interface CountsByType {
  INDIVIDUAL: number;
  CORPORATE: number;
  INSTITUTIONAL: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

interface ClientTypeChartProps {
  isLoading?: boolean;
}

const ClientTypeChart = ({ isLoading: externalLoading = false }: ClientTypeChartProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [chartData, setChartData] = useState<{
    series: number[];
    options: ApexOptions;
  }>({
    series: [0, 0, 0],
    options: {
      chart: {
        type: 'donut',
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      labels: ['Particuliers', 'Entreprises', 'Institutionnels'],
      colors: ['#4371AF', '#F0B429', '#34BB80'],
      plotOptions: {
        pie: {
          donut: {
            size: '55%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '14px',
                fontWeight: 600,
              },
              value: {
                show: true,
                fontSize: '16px',
                fontWeight: 400,
                formatter: (val) => `${val}`,
              },
              total: {
                show: true,
                fontSize: '14px',
                fontWeight: 600,
                label: 'Total',
                formatter: (w) => {
                  return `${w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)}`;
                },
              },
            },
          },
        },
      },
      dataLabels: {
        enabled: false,
      },
      legend: {
        position: 'bottom',
        horizontalAlign: 'center',
        fontSize: '13px',
        markers: {
          radius: 12,
        },
      },
      stroke: {
        width: 0,
      },
      tooltip: {
        y: {
          formatter: (val) => `${val} anomalies`,
        },
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              height: 300,
            },
            legend: {
              position: 'bottom',
            },
          },
        },
      ],
    },
  });

  useEffect(() => {
    const fetchCountsByType = async () => {
      try {
        setIsLoading(true);
        const response = await apiService.get<ApiResponse<CountsByType>>('/anomalies/counts/by-type');

        if (response.success && response.data) {
          const data = response.data;
          setChartData(prev => ({
            ...prev,
            series: [
              Number(data.INDIVIDUAL) || 0,
              Number(data.CORPORATE) || 0,
              Number(data.INSTITUTIONAL) || 0,
            ],
          }));
        }
      } catch (err) {
        log.error('api', 'Failed to fetch anomaly counts by type', { error: err });
      } finally {
        setIsLoading(false);
      }
    };

    if (!externalLoading) {
      fetchCountsByType();
    }
  }, [externalLoading]);

  if (isLoading || externalLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-full max-w-md mx-auto">
          <div className="animate-pulse flex flex-col items-center">
            <div className="rounded-full bg-gray-200 h-64 w-64"></div>
            <div className="mt-5 flex space-x-4 justify-center w-full">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
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
        type="donut"
        height="100%"
      />
    </div>
  );
};

export default ClientTypeChart;
