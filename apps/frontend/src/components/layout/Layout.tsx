import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import AiChatWidget from '../ai/AiChatWidget';
import { useState } from 'react';

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:z-[100] focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-primary-600 focus:text-white focus:rounded-lg focus:shadow-lg"
      >
        Aller au contenu principal
      </a>

      {/* Sidebar for desktop */}
      <Sidebar isMobile={false} isOpen={true} onClose={() => {}} />
      
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75\" onClick={() => setSidebarOpen(false)} />
          <Sidebar isMobile={true} isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        </div>
      )}
      
      {/* Main content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        <Navbar onMenuClick={() => setSidebarOpen(true)} />
        
        <main id="main-content" className="flex-1 overflow-y-auto py-6 px-4 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>

      {/* AI Chat Assistant */}
      <AiChatWidget />
    </div>
  );
};

export default Layout;