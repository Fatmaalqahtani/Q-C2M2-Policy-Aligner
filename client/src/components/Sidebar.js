import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Shield, 
  FileText, 
  Map, 
  BarChart3, 
  FileBarChart, 
  LogOut, 
  Menu,
  Users 
} from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  if (!user) return null;

  const navItems = [
    { path: '/', label: 'Dashboard', icon: Shield },
    { path: '/documents', label: 'Documents', icon: FileText },
    { path: '/mapping', label: 'Mapping', icon: Map },
    { path: '/analysis', label: 'Analysis', icon: BarChart3 },
    { path: '/reports', label: 'Reports', icon: FileBarChart },
    { path: '/users', label: 'Users', icon: Users },
  ];

  return (
    <div className={`${collapsed ? 'w-20' : 'w-64'} bg-white text-gray-700 h-screen fixed left-0 top-0 transition-all duration-300 flex flex-col border-r border-gray-200`}>

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!collapsed && (
       <div className="flex items-center gap-3">
  <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg shadow-sm">
    <Shield className="w-6 h-6 text-white" />
  </div>

  <div className="leading-tight">
    <h1 className="text-lg font-bold text-blue-600">Q-C2M2</h1>
    <p className="text-xs text-gray-500">Policy Aligner</p>
  </div>
</div>

        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="text-gray-500 hover:text-gray-700"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Nav Links */}
      <div className="flex-1 p-2 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-3 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-blue-50 text-blue-600 font-medium'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
            >
              <Icon className="w-5 h-5" />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </div>

      {/* User + Logout */}
      <div className="p-4 border-t border-gray-200">
       
       
      </div>
    </div>
  );
};

export default Sidebar;
