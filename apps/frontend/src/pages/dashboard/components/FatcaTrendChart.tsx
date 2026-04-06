import { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { db } from '@/services/db';
import { log } from '@/services/log';

interface FatcaTrendChartProps {
  isLoading?: boolean;
}

const MONTH_LABELS: Record<string, string> = {
  '01': 'Jan', '02': 'Fev', '03': 'Mar', '04': 'Avr', '05': 'Mai', '06': 'Juin',
  '07': 'Juil', '08': 'Aout', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dec',
};

const FatcaTrendChart = ({ isLoading = false }: FatcaTrendChartProps) => {
  const [chartData, setChartData] = useState<{ series: { name: string; data: number[] }[]; options: ApexOptions }>({
    series: [{ name: 'Clients FATCA', data: [] }],
    options: {
      chart: { type: 'area', fontFamily: 'Inter, system-ui, sans-serif', toolbar: { show: false }, zoom: { enabled: false } },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3 },
      colors: ['#F0B429'],
      fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.5, opacityTo: 0.1, stops: [0, 100] } },
      grid: { borderColor: '#f1f1f1' },
      xaxis: { categories: [], labels: { style: { colors: '#6B7280', fontSize: '12px' } }, axisBorder: { show: false }, axisTicks: { show: false } },
      yaxis: { labels: { style: { colors: '#6B7280', fontSize: '12px' }, formatter: (v) => `${v}` } },
      tooltip: { y: { formatter: (v) => `${v} clients` } },
      markers: { size: 4, colors: ['#F0B429'], strokeColors: '#fff', strokeWidth: 2, hover: { size: 6 } },
    },
  });

  useEffect(() => {
    if (!isLoading) fetchData();
  }, [isLoading]);

  const fetchData = async () => {
    try {
      const result = await (db as any).fetchApi('/fatca/trend', {}, { months: 12 });
      const data: { month: string; count: number }[] = Array.isArray(result) ? result : [];

      if (data.length > 0) {
        const categories = data.map(d => {
          const mm = d.month.split('-')[1];
          return MONTH_LABELS[mm] || d.month;
        });
        const values = data.map(d => d.count);

        setChartData(prev => ({
          ...prev,
          series: [{ name: 'Clients FATCA detectes', data: values }],
          options: { ...prev.options, xaxis: { ...prev.options.xaxis, categories } },
        }));
      }
    } catch (error) {
      log.error('api', 'Error fetching FATCA trend', { error });
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="w-full h-full animate-pulse"><div className="h-full bg-gray-200 rounded" /></div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <Chart options={chartData.options} series={chartData.series} type="area" height="100%" />
    </div>
  );
};

export default FatcaTrendChart;
