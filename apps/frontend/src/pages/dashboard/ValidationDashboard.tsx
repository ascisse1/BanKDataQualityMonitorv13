import { useState, useEffect } from 'react';
import { BarChart2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toaster';

interface ValidationMetric {
  field: string;
  total: number;
  valid: number;
  invalid: number;
  percentage: number;
}

const ValidationDashboard = () => {
  const [metrics, setMetrics] = useState<ValidationMetric[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToast } = useToast();

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/validation-metrics');
      if (!response.ok) throw new Error('Failed to fetch metrics');
      const data = await response.json();
      setMetrics(data);
    } catch (error) {
      addToast('Failed to load validation metrics', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (percentage: number) => {
    if (percentage >= 90) return 'text-success-500';
    if (percentage >= 70) return 'text-warning-500';
    return 'text-error-500';
  };

  const getStatusIcon = (percentage: number) => {
    if (percentage >= 90) return <CheckCircle className="h-5 w-5 text-success-500" />;
    if (percentage >= 70) return <AlertTriangle className="h-5 w-5 text-warning-500" />;
    return <XCircle className="h-5 w-5 text-error-500" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Validation Overview</h2>
          <p className="text-sm text-gray-500">Current data quality metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="flex items-center text-sm text-gray-500">
            <div className="h-2 w-2 rounded-full bg-success-500 mr-1"></div>
            Good (≥90%)
          </span>
          <span className="flex items-center text-sm text-gray-500">
            <div className="h-2 w-2 rounded-full bg-warning-500 mr-1"></div>
            Warning (≥70%)
          </span>
          <span className="flex items-center text-sm text-gray-500">
            <div className="h-2 w-2 rounded-full bg-error-500 mr-1"></div>
            Critical (&lt;70%)
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.field} className="relative">
            <div className="absolute top-3 right-3">
              {getStatusIcon(metric.percentage)}
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-900">{metric.field}</h3>
              <div className="flex items-end justify-between">
                <div>
                  <p className={`text-2xl font-semibold ${getStatusColor(metric.percentage)}`}>
                    {metric.percentage.toFixed(1)}%
                  </p>
                  <p className="text-sm text-gray-500">Valid records</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-900">{metric.valid} / {metric.total}</p>
                  <p className="text-xs text-gray-500">Records</p>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    metric.percentage >= 90 ? 'bg-success-500' :
                    metric.percentage >= 70 ? 'bg-warning-500' :
                    'bg-error-500'
                  }`}
                  style={{ width: `${metric.percentage}%` }}
                ></div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Validation History</h3>
            <select className="text-sm border-gray-300 rounded-md">
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
          <div className="h-64">
            {/* Chart will be added here */}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ValidationDashboard;