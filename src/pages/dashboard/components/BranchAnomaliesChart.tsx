import { useState, useEffect } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { db } from '../../../services/db';

interface BranchAnomaliesChartProps {
  isLoading?: boolean;
}

const BranchAnomaliesChart = ({ isLoading = false }: BranchAnomaliesChartProps) => {
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
        height: 450,
        toolbar: {
          show: false,
        },
      },
      plotOptions: {
        bar: {
          horizontal: true,
          barHeight: '90%',
          borderRadius: 4,
          distributed: true,
        },
      },
      dataLabels: {
        enabled: true,
        formatter: function (val) {
          return val.toString();
        },
        style: {
          fontSize: '12px',
          colors: ['#1A365D'],
        },
      },
      colors: ['#4371AF', '#1A365D', '#34BB80', '#F0B429', '#EF4744'],
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
          maxWidth: 200,
        },
      },
      grid: {
        borderColor: '#f1f1f1',
        xaxis: {
          lines: {
            show: true,
          },
        },
        yaxis: {
          lines: {
            show: false,
          },
        },
      },
      tooltip: {
        y: {
          title: {
            formatter: () => 'Anomalies',
          },
        },
      },
    },
  });

  useEffect(() => {
    // Utiliser directement les données en dur
    if (true) {
      const hardcodedData = [
        { code_agence: "01001", lib_agence: "AGENCE OUAGADOUGOU PRINCIPALE", nombre_anomalies: 5243 },
        { code_agence: "01002", lib_agence: "AGENCE OUAGADOUGOU CENTRE", nombre_anomalies: 4872 },
        { code_agence: "01003", lib_agence: "AGENCE OUAGADOUGOU NORD", nombre_anomalies: 4521 },
        { code_agence: "01004", lib_agence: "AGENCE OUAGADOUGOU SUD", nombre_anomalies: 4123 },
        { code_agence: "01005", lib_agence: "AGENCE OUAGADOUGOU EST", nombre_anomalies: 3987 },
        { code_agence: "02001", lib_agence: "AGENCE BOBO-DIOULASSO PRINCIPALE", nombre_anomalies: 3654 },
        { code_agence: "02002", lib_agence: "AGENCE BOBO-DIOULASSO CENTRE", nombre_anomalies: 3421 },
        { code_agence: "03001", lib_agence: "AGENCE KOUDOUGOU PRINCIPALE", nombre_anomalies: 3210 },
        { code_agence: "04001", lib_agence: "AGENCE BANFORA PRINCIPALE", nombre_anomalies: 2987 },
        { code_agence: "05001", lib_agence: "AGENCE OUAHIGOUYA PRINCIPALE", nombre_anomalies: 2765 },
        { code_agence: "06001", lib_agence: "AGENCE KAYA PRINCIPALE", nombre_anomalies: 2654 },
        { code_agence: "07001", lib_agence: "AGENCE DÉDOUGOU PRINCIPALE", nombre_anomalies: 2521 },
        { code_agence: "08001", lib_agence: "AGENCE FADA N'GOURMA PRINCIPALE", nombre_anomalies: 2423 },
        { code_agence: "16001", lib_agence: "AGENCE THOMAS SANKARA", nombre_anomalies: 2321 },
        { code_agence: "17001", lib_agence: "AGENCE KWAME NKRUMAH", nombre_anomalies: 2187 }
      ];
      
      // Prendre les 15 premières agences avec le plus d'anomalies
      const topAgences = hardcodedData.slice(0, 15);

      setChartData({
        ...chartData,
        series: [
          {
            name: 'Anomalies',
            data: topAgences.map(a => a.nombre_anomalies).filter(Boolean),
          },
        ],
        options: {
          ...chartData.options,
          xaxis: {
            ...chartData.options.xaxis,
            categories: topAgences.map(a => `${a.lib_agence} (${a.code_agence})`),
          },
        },
      });
    }
  }, [isLoading]);

  const fetchBranchData = async () => {
    try {
      const data = await db.getAnomaliesByBranch();
      
      // Prendre les 15 premières agences avec le plus d'anomalies
      const topAgences = data.slice(0, 15);

      setChartData({
        ...chartData,
        series: [
          {
            name: 'Anomalies',
            data: topAgences.map(a => a.nombre_anomalies),
          },
        ],
        options: {
          ...chartData.options,
          xaxis: {
            ...chartData.options.xaxis,
            categories: topAgences.map(a => `${a.lib_agence} (${a.code_agence})`),
          },
        },
      });
    } catch (error) {
      console.error('Error fetching branch data:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-full">
        <div className="animate-pulse space-y-4">
          <div className="h-10 bg-gray-200 rounded"></div>
          <div className="h-[450px] bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-[450px]">
      <Chart
        options={chartData.options}
        series={chartData.series}
        type="bar"
        height="100%"
      />
    </div>
  );
};

export default BranchAnomaliesChart;