import { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { db } from '@/services/db';
import { log } from '@/services/log';

interface FatcaStatusChartProps {
  isLoading?: boolean;
}

const FatcaStatusChart = ({ isLoading = false }: FatcaStatusChartProps) => {
  const [chartData, setChartData] = useState<{
    series: number[];
    options: ApexOptions;
  }>({
    series: [0, 0, 0, 0, 0],
    options: {
      chart: {
        type: 'donut' as const,
        fontFamily: 'Inter, system-ui, sans-serif',
      },
      labels: ['A verifier', 'Conforme', 'Non conforme', 'En investigation', 'Exempte'],
      colors: ['#F0B429', '#34BB80', '#EF4744', '#4371AF', '#9CA3AF'],
      plotOptions: {
        pie: {
          donut: {
            size: '55%',
            labels: {
              show: true,
              name: { show: true, fontSize: '14px', fontWeight: 600 },
              value: { show: true, fontSize: '16px', fontWeight: 400, formatter: (val) => `${val}` },
              total: {
                show: true, fontSize: '14px', fontWeight: 600, label: 'Total',
                formatter: (w) => `${w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0)}`,
              },
            },
          },
        },
      },
      dataLabels: { enabled: false },
      legend: { position: 'bottom' as const, horizontalAlign: 'center', fontSize: '13px', markers: { size: 6 } },
      stroke: { width: 0 },
      tooltip: { y: { formatter: (val) => `${val} clients` } },
      responsive: [{ breakpoint: 480, options: { chart: { height: 300 }, legend: { position: 'bottom' } } }],
    },
  });

  useEffect(() => {
    if (!isLoading) fetchData();
  }, [isLoading]);

  const fetchData = async () => {
    try {
      const stats = await db.getFatcaStats();
      if (stats) {
        setChartData({
          ...chartData,
          series: [
            stats.pendingReview || 0,
            stats.compliantClients || 0,
            stats.nonCompliantClients || 0,
            stats.underInvestigation || 0,
            (stats.clientsByStatus?.['EXEMPT'] as number) || 0,
          ],
        });
      }
    } catch (error) {
      log.error('api', 'Error fetching FATCA stats for chart', { error });
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-full max-w-md mx-auto animate-pulse flex flex-col items-center">
          <div className="rounded-full bg-gray-200 h-64 w-64" />
          <div className="mt-5 flex space-x-4 justify-center w-full">
            {[...Array(5)].map((_, i) => <div key={i} className="h-4 bg-gray-200 rounded w-16" />)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Chart options={chartData.options} series={chartData.series} type="donut" height="100%" />
    </div>
  );
};

export default FatcaStatusChart;
