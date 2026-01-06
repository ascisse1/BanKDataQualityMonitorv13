import { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface ClientTypeChartProps {
  isLoading?: boolean;
}

const ClientTypeChart = ({ isLoading = false }: ClientTypeChartProps) => {
  const [chartData, setChartData] = useState<{
    series: number[];
    options: ApexOptions;
  }>({
    series: [0, 0, 0, 0],
    options: {
      chart: {
        type: 'donut',
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      labels: ['Individual', 'Corporate', 'SME', 'VIP'],
      colors: ['#4371AF', '#F0B429', '#34BB80', '#EF4744'],
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
                  return `${w.globals.seriesTotals.reduce((a, b) => a + b, 0)}`;
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
          formatter: (val) => `${val} clients`,
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
    // Utiliser directement les données en dur
    if (true) {
      // Simulate API call for chart data
      setChartData({
        ...chartData,
        series: [19873, 5231, 3348, 682].filter(Boolean),
      });
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-full max-w-md mx-auto">
          <div className="animate-pulse flex flex-col items-center">
            <div className="rounded-full bg-gray-200 h-64 w-64"></div>
            <div className="mt-5 flex space-x-4 justify-center w-full">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
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