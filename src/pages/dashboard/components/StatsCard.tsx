import Card from '../../../components/ui/Card';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';
import React from 'react';

interface StatsCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  isLoading?: boolean;
}

const StatsCard = ({ title, value, change, trend, icon, isLoading = false }: StatsCardProps) => {
  let trendIcon;
  let trendColor;

  switch (trend) {
    case 'up':
      trendIcon = <ArrowUp className="h-3 w-3" />;
      trendColor = 'text-success-600 bg-success-50';
      break;
    case 'down':
      trendIcon = <ArrowDown className="h-3 w-3" />;
      trendColor = 'text-error-600 bg-error-50';
      break;
    default:
      trendIcon = <Minus className="h-3 w-3" />;
      trendColor = 'text-gray-600 bg-gray-50';
  }

  if (isLoading) {
    return (
      <Card isLoading>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-1 text-2xl font-semibold text-gray-900">{value}</p>
          <div className="mt-2 flex items-center">
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${trendColor}`}>
              {trendIcon}
              <span className="ml-1">{change}</span>
            </span>
            <span className="ml-2 text-xs text-gray-500">from last month</span>
          </div>
        </div>
        <div className="h-12 w-12 bg-gray-100 rounded-full flex items-center justify-center">
          {icon}
        </div>
      </div>
    </Card>
  );
};

export default StatsCard;