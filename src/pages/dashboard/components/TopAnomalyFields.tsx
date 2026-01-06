import { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface TopAnomalyFieldsProps {
  isLoading?: boolean;
}

const TopAnomalyFields = ({ isLoading = false }: TopAnomalyFieldsProps) => {
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
    // Utiliser directement les données en dur
    if (true) {
      // Simulate API call for chart data
      setChartData({
        ...chartData,
        series: [
          {
            name: 'Anomalies',
            data: [342, 215, 127, 95, 63].filter(Boolean),
          },
        ],
        options: {
          ...chartData.options,
          xaxis: {
            ...chartData.options.xaxis,
            categories: ['Email (bkemacli)', 'NID (nid)', 'Mother\'s Name (nmer)', 'Birth Date (dna)', 'Reg. Number (nrc)'],
          },
        },
      });
    }
  }, [isLoading]);

  if (isLoading) {
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