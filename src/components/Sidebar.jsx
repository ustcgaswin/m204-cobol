import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Files, 
  Package, 
  ClipboardList, 
  Download, 
  ChevronLeft, 
  ChevronRight,
} from 'lucide-react';
import { Link, useLocation, useParams } from 'react-router-dom';

// Sample project data (ideally, this would come from a shared context or API call)
const sampleProjectsForSidebar = [
  { id: '1', name: 'Project Alpha' },
  { id: '2', name: 'Project Beta' },
  { id: '3', name: 'Project Gamma' },
  { id: '4', name: 'Project Delta' },
  { id: '5', name: 'Project Epsilon' },
  { id: '6', name: 'Project Zeta' },
  { id: '7', name: 'Project Eta' },
  { id: '8', name: 'Project Theta' },
];

const SidebarItem = ({ to, icon, label, active, collapsed }) => {
  return (
    <li>
      <Link
        to={to}
        className={`w-full flex items-center px-4 py-3 rounded-lg transition-all duration-200 ${
          active
            ? 'bg-teal-100 text-teal-800 font-medium shadow-sm'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        }`}
      >
        <span className={`inline-flex items-center justify-center ${collapsed ? 'w-6' : 'w-6 h-6'} mr-3`}>
          {icon}
        </span>
        
        {!collapsed && <span className="text-sm font-medium">{label}</span>}
        
        {active && !collapsed && (
          <span className="ml-auto w-1.5 h-5 rounded-full bg-teal-500"></span>
        )}
      </Link>
    </li>
  );
};

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [projectName, setProjectName] = useState(''); // State for project name
  
  const location = useLocation(); 
  const { projectId } = useParams(); 

  useEffect(() => {
    if (projectId) {
      const project = sampleProjectsForSidebar.find(p => p.id === projectId);
      if (project) {
        setProjectName(project.name);
      } else {
        setProjectName(`Project ID: ${projectId}`); // Fallback if name not found
      }
    } else {
      setProjectName(''); // Clear project name if no projectId
    }
  }, [projectId]);

  const projectNavItems = projectId ? [ 
    {
      path: `/project/${projectId}`,
      label: 'Overview',
      icon: <LayoutDashboard size={18} />
    },
    {
      path: `/project/${projectId}/source-files`,
      label: 'Source Files',
      icon: <Files size={18} />
    },
    {
      path: `/project/${projectId}/inventory`,
      label: 'Inventory',
      icon: <Package size={18} />
    },
    {
      path: `/project/${projectId}/requirements`,
      label: 'Requirements',
      icon: <ClipboardList size={18} />
    },
    {
      path: `/project/${projectId}/artifacts`,
      label: 'Artifacts',
      icon: <Download size={18} />
    }
  ] : []; 

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) { 
        setShowMobileMenu(false); 
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize(); 
    return () => window.removeEventListener('resize', handleResize);
  }, []); 

  useEffect(() => {
    if (window.innerWidth <= 768 && !collapsed && !showMobileMenu) {
        // Consider behavior for mobile: e.g., setCollapsed(true) or rely on showMobileMenu
    }
  }, [collapsed, showMobileMenu]);


  if (!projectId) {
    return null; 
  }

  return (
    <>
      <div className="md:hidden fixed top-4 left-4 z-50"> 
        <button
          onClick={() => setShowMobileMenu(!showMobileMenu)}
          className="bg-white p-2 rounded-lg shadow-md hover:bg-gray-50 text-gray-600"
          aria-label="Toggle mobile menu"
        >
          {showMobileMenu ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
        </button>
      </div>

      {showMobileMenu && (
        <div 
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40" 
          onClick={() => setShowMobileMenu(false)}
        ></div>
      )}

      <aside className={`bg-white border-r border-gray-200 shadow-sm h-full flex flex-col transition-all duration-300 
        ${collapsed ? 'w-16' : 'w-64'} 
        ${showMobileMenu ? 'fixed inset-y-0 left-0 z-50 transform translate-x-0 w-64' : 'hidden md:flex'}
      `}>
        <div className="px-4 py-5 flex items-center justify-between border-b border-gray-200 bg-gray-50">
          {!collapsed && (
            <div className="font-bold text-gray-800 flex items-center space-x-2">
              <div className="h-8 w-8 rounded-md bg-teal-100 text-teal-600 flex items-center justify-center">
                <Package size={20} />
              </div>
              <span>Project Panel</span>
            </div>
          )}
          <button
            onClick={() => {
              setCollapsed(!collapsed);
              if (showMobileMenu) setShowMobileMenu(false); // Close mobile menu if collapsing sidebar
            }}
            className="p-1.5 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500 text-gray-500"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {!collapsed && projectId && ( 
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Current Project</div>
            <div className="text-sm font-medium text-gray-900 truncate" title={projectName}>{projectName}</div>
          </div>
        )}

        <div className="flex-grow overflow-y-auto">
          <nav className="p-2 mt-2">
            {!collapsed && ( 
                 <div className={`mb-1 px-2 ${collapsed ? 'hidden' : 'block'}`}> 
                    <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project Menu
                    </span>
                 </div>
            )}
            <ul className="space-y-1">
              {projectNavItems.map((item) => (
                <SidebarItem
                  key={item.path}
                  to={item.path} 
                  icon={item.icon}
                  label={item.label}
                  collapsed={collapsed}
                  active={location.pathname === item.path || (item.path !== `/project/${projectId}` && location.pathname.startsWith(item.path))} 
                />
              ))}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;