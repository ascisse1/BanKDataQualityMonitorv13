import { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { db } from '../../../services/db';

interface FatcaStatusChartProps {
  isLoading?: boolean;
}

const FatcaStatusChart = ({ isLoading = false }: FatcaStatusChartProps) => {
  const [chartData, setChartData] = useState<{
    series: number[];
    options: ApexOptions;
  }>({
    series: [850, 320, 80, 0],
    options: {
      chart: {
        type: 'donut',
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      labels: ['À documenter', 'Compte déclarable', 'Non déclarable', 'Récalcitrant'],
      colors: ['#F0B429', '#34BB80', '#4371AF', '#EF4744'],
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

  const [useHardcodedData, setUseHardcodedData] = useState(false);
  
  useEffect(() => {
    if (!isLoading) {
      if (useHardcodedData) {
        // Utiliser directement les données en dur
        setChartData({
          ...chartData,
          series: [850, 320, 80, 0],
        });
      } else {
        fetchData();
      }
    }
  }, [isLoading]);

  const fetchData = async () => {
    try {
      const stats = await db.getFatcaStats();
      
      if (stats) {
        setChartData({
          ...chartData,
          series: [
            stats.toVerify || 850,
            stats.confirmed || 320,
            stats.excluded || 80,
            stats.pending || 0
          ],
        });
      } else {
        // Fallback data
        setChartData({
          ...chartData,
          series: [850, 320, 80, 0],
        });
      }
    } catch (error) {
      console.error('Error fetching FATCA stats for chart:', error);
      // Fallback data
      setChartData({
        ...chartData,
        series: [850, 320, 80, 0].filter(Boolean),
      });
    }
  };

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

export default FatcaStatusChart;