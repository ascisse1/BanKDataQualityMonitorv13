import { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

const DataQualityTrends = ({ isLoading = false }) => {
  const [chartData, setChartData] = useState<{
    series: { name: string; data: number[] }[];
    options: ApexOptions;
  }>({ 
    series: [
      {
        name: 'Particuliers',
        data: [92, 89, 91, 93, 88, 90, 94].filter(Boolean), 
      },
      {
        name: 'Entreprises',
        data: [85, 87, 84, 88, 86, 89, 91].filter(Boolean), 
      },
    ],
    options: {
      chart: {
        type: 'line',
        height: 350,
        toolbar: { show: false },
        zoom: { enabled: false },
      },
      colors: ['#4371AF', '#F0B429'],
      dataLabels: { enabled: false },
      stroke: {
        width: [3, 3],
        curve: 'smooth',
        dashArray: [0, 0],
      },
      title: {
        text: 'Évolution de la Qualité des Données',
        align: 'left',
        style: { fontSize: '14px', fontWeight: 600 },
      },
      legend: {
        tooltipHoverFormatter: function(val, opts) {
          return val + ' - ' + opts.w.globals.series[opts.seriesIndex][opts.dataPointIndex] + '%';
        },
      },
      markers: {
        size: 0,
        hover: { sizeOffset: 6 },
      },
      xaxis: {
        categories: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul'],
      },
      yaxis: {
        min: 60,
        max: 100,
        labels: {
          formatter: (val) => val.toFixed(0) + '%',
        },
      },
      tooltip: {
        y: [
          {
            title: {
              formatter: (val) => val + ' (%)',
            },
          },
          {
            title: {
              formatter: (val) => val + ' (%)',
            },
          },
        ],
      },
      grid: {
        borderColor: '#f1f1f1',
      },
    },
  });

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-[350px] bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-[350px]">
      <Chart
        options={chartData.options}
        series={chartData.series}
        type="line"
        height="100%"
      />
    </div>
  );
};

export default DataQualityTrends;