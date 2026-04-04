import { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { apiService } from '@/services/apiService';
import { log } from '@/services/log';

interface ValidationMetric {
  category: string;
  total_records: number;
  valid_records: number;
  quality_score: number;
}

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string | null;
}

const DataQualityTrends = ({ isLoading = false }) => {
  const [chartData, setChartData] = useState<{
    series: { name: string; data: number[] }[];
    categories: string[];
  }>({ series: [], categories: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQualityData();
  }, []);

  const fetchQualityData = async () => {
    try {
      setLoading(true);
      const response = await apiService.get<ApiResponse<ValidationMetric[]>>('/stats/validation-metrics');

      if (response.success && response.data) {
        const metrics = Array.isArray(response.data) ? response.data : [];

        const categories = metrics.map(m => m.category);
        const scores = metrics.map(m => typeof m.quality_score === 'number' ? m.quality_score : 0);
        const totalRecords = metrics.map(m => m.total_records || 0);

        setChartData({
          series: [
            { name: 'Score Qualite (%)', data: scores },
          ],
          categories,
        });
      }
    } catch (err) {
      log.error('api', 'Failed to fetch quality trends', { error: err });
    } finally {
      setLoading(false);
    }
  };

  const options: ApexOptions = {
    chart: {
      type: 'bar',
      height: 350,
      toolbar: { show: false },
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '55%',
        borderRadius: 6,
      },
    },
    colors: chartData.series[0]?.data.map(score =>
      score >= 90 ? '#22c55e' : score >= 70 ? '#f59e0b' : '#ef4444'
    ) || ['#4371AF'],
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.3,
        opacityFrom: 0.9,
        opacityTo: 0.7,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => val.toFixed(1) + '%',
      style: { fontSize: '12px', fontWeight: 600 },
    },
    title: {
      text: 'Score de Qualite par Categorie',
      align: 'left',
      style: { fontSize: '14px', fontWeight: 600 },
    },
    xaxis: {
      categories: chartData.categories,
    },
    yaxis: {
      min: 0,
      max: 100,
      labels: {
        formatter: (val) => val.toFixed(0) + '%',
      },
    },
    tooltip: {
      y: {
        formatter: (val) => val.toFixed(1) + '%',
      },
    },
    grid: {
      borderColor: '#f1f1f1',
    },
  };

  if (isLoading || loading) {
    return (
      <div className="animate-pulse">
        <div className="h-[350px] bg-gray-200 rounded"></div>
      </div>
    );
  }

  if (chartData.series.length === 0 || chartData.categories.length === 0) {
    return (
      <div className="flex items-center justify-center h-[350px] text-gray-500">
        Aucune donnee de qualite disponible
      </div>
    );
  }

  return (
    <div className="w-full h-[350px]">
      <Chart
        options={options}
        series={chartData.series}
        type="bar"
        height="100%"
      />
    </div>
  );
};

export default DataQualityTrends;
