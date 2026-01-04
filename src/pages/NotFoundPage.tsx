import { useNavigate } from 'react-router-dom';
import { FileQuestion } from 'lucide-react';
import Button from '../components/ui/Button';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center">
      <div className="mx-auto max-w-md px-4 sm:px-6 lg:px-8 text-center">
        <div className="bg-white p-8 rounded-lg shadow-card animate-fade-in">
          <div className="flex justify-center">
            <div className="h-16 w-16 bg-primary-100 rounded-full flex items-center justify-center">
              <FileQuestion className="h-8 w-8 text-primary-600" />
            </div>
          </div>
          <h1 className="mt-5 text-3xl font-bold text-gray-900">Page Not Found</h1>
          <p className="mt-3 text-gray-600">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <div className="mt-8">
            <Button
              onClick={() => navigate('/')}
              variant="primary"
              fullWidth
            >
              Go back home
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;