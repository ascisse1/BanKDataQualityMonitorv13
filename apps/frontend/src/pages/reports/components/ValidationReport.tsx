import { useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import Chart from 'react-apexcharts';
import { FileBarChart2, Download, RefreshCw } from 'lucide-react';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toaster';

interface ValidationMetrics {
  errorDistribution: {
    field: string;
    count: number;
    percentage: number;
  }[];
  correctionProgress: {
    date: string;
    errors: number;
    cumulative: number;
  }[];
  qualityMetrics: {
    category: string;
    valid: number;
    total: number;
    percentage: number;
  }[];
}

const ValidationReport = () => {
  const [metrics, setMetrics] = useState<ValidationMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      const [distribution, progress, quality] = await Promise.all([
        fetch('/api/reports/error-distribution').then(r => r.json()),
        fetch('/api/reports/correction-progress').then(r => r.json()),
        fetch('/api/reports/quality-metrics').then(r => r.json())
      ]);

      setMetrics({
        errorDistribution: distribution,
        correctionProgress: progress,
        qualityMetrics: quality
      });
    } catch (error) {
      addToast('Failed to fetch validation metrics', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      
      // Title
      doc.setFontSize(20);
      doc.text('Data Validation Report', 20, 20);
      
      // Date
      doc.setFontSize(12);
      doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30);
      
      // Quality Metrics Table
      doc.autoTable({
        startY: 40,
        head: [['Category', 'Valid Records', 'Total Records', 'Percentage']],
        body: metrics?.qualityMetrics.map(m => [
          m.category,
          m.valid,
          m.total,
          `${m.percentage.toFixed(1)}%`
        ]) || [],
      });
      
      // Error Distribution Table
      doc.autoTable({
        startY: doc.lastAutoTable.finalY + 10,
        head: [['Field', 'Error Count', 'Percentage']],
        body: metrics?.errorDistribution.map(d => [
          d.field,
          d.count,
          `${d.percentage.toFixed(1)}%`
        ]) || [],
      });
      
      doc.save('validation-report.pdf');
      addToast('Report generated successfully', 'success');
    } catch (error) {
      addToast('Failed to generate report', 'error');
    }
  };

  const chartOptions = {
    chart: {
      type: 'line',
      height: 350,
      toolbar: {
        show: false
      }
    },
    stroke: {
      curve: 'smooth',
      width: 3
    },
    xaxis: {
      type: 'datetime'
    },
    yaxis: {
      title: {
        text: 'Number of Errors'
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Validation Report</h2>
          <p className="text-sm text-gray-500">
            Comprehensive overview of data validation status
          </p>
        </div>
        
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<RefreshCw className="h-4 w-4" />}
            onClick={fetchMetrics}
            disabled={isLoading}
          >
            Refresh
          </Button>
          
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Download className="h-4 w-4" />}
            onClick={generatePDF}
            disabled={isLoading || !metrics}
          >
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card
          title="Data Quality Overview"
          isLoading={isLoading}
        >
          <div className="space-y-4">
            {metrics?.qualityMetrics.map((metric, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-gray-700">{metric.category}</span>
                  <span className="text-gray-900">{metric.percentage.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      metric.percentage >= 90 ? 'bg-success-500' :
                      metric.percentage >= 70 ? 'bg-warning-500' :
                      'bg-error-500'
                    }`}
                    style={{ width: `${metric.percentage}%` }}
                  />
                </div>
                <div className="text-xs text-gray-500">
                  {metric.valid.toLocaleString()} valid records out of {metric.total.toLocaleString()} total
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Error Distribution"
          isLoading={isLoading}
        >
          <div className="space-y-4">
            {metrics?.errorDistribution.map((error, index) => (
              <div key={index} className="flex items-center space-x-4">
                <div className="w-32 text-sm font-medium text-gray-700">
                  {error.field}
                </div>
                <div className="flex-1">
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-error-500 rounded-full"
                      style={{ width: `${error.percentage}%` }}
                    />
                  </div>
                </div>
                <div className="w-20 text-sm text-gray-500 text-right">
                  {error.count}
                </div>
                <div className="w-16 text-sm text-gray-900 text-right">
                  {error.percentage.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card
        title="Error Correction Progress"
        isLoading={isLoading}
      >
        <div className="h-80">
          {metrics && (
            <Chart
              options={chartOptions}
              series={[
                {
                  name: 'Errors',
                  data: metrics.correctionProgress.map(p => ({
                    x: new Date(p.date).getTime(),
                   y: p.errors || 0
                  }))
                },
                {
                  name: 'Cumulative',
                  data: metrics.correctionProgress.map(p => ({
                    x: new Date(p.date).getTime(),
                   y: p.cumulative || 0
                  }))
                }
              ]}
              type="line"
              height="100%"
            />
          )}
        </div>
      </Card>
    </div>
  );
};

export default ValidationReport;