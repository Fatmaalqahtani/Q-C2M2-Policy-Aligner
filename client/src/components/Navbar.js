import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, LogOut, User } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 shadow-sm">

      {/* Left Side — Logo + Title */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center justify-center w-10 h-10 bg-blue-600 rounded-lg shadow-sm">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-gray-800 leading-none">
            Q-C2M2 Policy Aligner
          </h1>
          <p className="text-xs text-gray-500">
            Cybersecurity Policy Analysis Tool
          </p>
        </div>
      </div>

      {/* Right Side — User */}
      <div className="flex items-center space-x-6 text-sm">
        <div className="flex items-center space-x-2 text-gray-600">
          <User className="w-4 h-4" />
          <span>{user.username}</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
            {user.role}
          </span>
        </div>

        <button
          onClick={logout}
          className="flex items-center space-x-2 text-red-500 hover:text-red-600 transition"
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Navbar;
