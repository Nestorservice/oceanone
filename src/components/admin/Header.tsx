import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { ChevronDown, LogOut, User, Menu } from 'lucide-react';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { user, signOut } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const getInitials = (email: string) => {
    return email ? email.substring(0, 2).toUpperCase() : '..';
  };

  return (
    <header className="h-20 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 sm:px-6">
      <button onClick={toggleSidebar} className="md:hidden text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white">
        <Menu className="h-6 w-6" />
      </button>
      
      <div className="flex-1"></div> {/* Spacer */}

      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center space-x-2"
        >
          <div className="w-10 h-10 rounded-full bg-brand-DEFAULT text-white flex items-center justify-center font-bold">
            {user?.email ? getInitials(user.email) : <User />}
          </div>
          <span className="hidden md:inline text-sm font-medium text-gray-700 dark:text-gray-200">{user?.email}</span>
          <ChevronDown className="h-5 w-5 text-gray-500" />
        </button>
        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-20">
            <button
              onClick={signOut}
              className="w-full text-left flex items-center px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Déconnexion
            </button>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
