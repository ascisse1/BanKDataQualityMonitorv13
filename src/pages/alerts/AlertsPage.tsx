import { Bell } from 'lucide-react';
import Card from '../../components/ui/Card';

const AlertsPage = () => {
  return (
    <div className="p-6">
      <div className="flex items-center gap-3 mb-6">
        <Bell className="w-6 h-6 text-blue-600" />
        <h1 className="text-2xl font-semibold text-gray-900">Alerts</h1>
      </div>
      
      <Card className="p-6">
        <div className="text-center text-gray-600">
          <p>Alerts dashboard is under development</p>
        </div>
      </Card>
    </div>
  );
};

export default AlertsPage;