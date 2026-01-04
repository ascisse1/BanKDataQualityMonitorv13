import { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface AnomalyTrendChartProps {
  isLoading?: boolean;
}

const AnomalyTrendChart = ({ isLoading = false }: AnomalyTrendChartProps) => {
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
        categories: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8'],
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
    // Utiliser directement les données en dur
    if (true) {
      // Simulate API call for chart data
      setChartData({
        ...chartData,
        series: [
          {
            name: 'Anomalies',
            data: [125, 142, 98, 113, 86, 112, 91, 75].filter(Boolean),
          },
        ],
      });
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

export default AnomalyTrendChart;