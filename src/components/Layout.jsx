import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

const Layout = () => {
  const location = useLocation();
  // Show sidebar only on pages under a project's path (e.g., /project/some-id, /project/some-id/files)
  const isProjectPage = location.pathname.startsWith('/project/');

  return (
    <div className="flex flex-col h-screen">
      <Navbar /> {/* Navbar is always visible */}
      <div className="flex flex-1 overflow-hidden">
        {isProjectPage && <Sidebar />} {/* Sidebar is conditional based on the route */}
        <main className="flex-1 overflow-y-auto  bg-white"> {/* Changed bg-gray-100 to bg-white */}
          <Outlet /> {/* Page content will be rendered here */}
        </main>
      </div>
    </div>
  );
};

export default Layout;