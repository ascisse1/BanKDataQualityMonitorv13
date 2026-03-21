import { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface FatcaTrendChartProps {
  isLoading?: boolean;
}

const FatcaTrendChart = ({ isLoading = false }: FatcaTrendChartProps) => {
  const [chartData, setChartData] = useState<{
    series: {
      name: string;
      data: number[];
    }[];
    options: ApexOptions;
  }>({
    series: [
      {
        name: 'Clients FATCA',
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
      colors: ['#F0B429'],
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
        categories: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août'],
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
        x: {
          format: 'dd/MM/yy',
        },
      },
      markers: {
        size: 4,
        colors: ['#F0B429'],
        strokeColors: '#fff',
        strokeWidth: 2,
        hover: {
          size: 6,
        },
      },
    },
  });

  useEffect(() => {
    if (!isLoading) {
      // Simulate API call for chart data
      const timer = setTimeout(() => {
        setChartData({
          ...chartData,
          series: [
            {
              name: 'Clients FATCA',
              data: [85, 102, 123, 137, 162, 178, 195, 210].filter(Boolean),
            },
          ],
        });
      }, 300);

      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (isLoading) {
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

export default FatcaTrendChart;