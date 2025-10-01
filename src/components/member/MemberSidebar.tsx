import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Edit3, CheckSquare, User, Settings, LifeBuoy, X } from 'lucide-react';
import Logo from '../Logo';

const navItems = [
  { to: '/member/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/member/propose-question', icon: Edit3, label: 'Proposer une question' },
  { to: '/member/contributions', icon: CheckSquare, label: 'Mes contributions' },
];

interface MemberSidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

const MemberSidebar: React.FC<MemberSidebarProps> = ({ isOpen, setIsOpen }) => {
  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsOpen(false)}
      ></div>

      {/* Sidebar */}
      <div className={`fixed top-0 left-0 h-full w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-20 flex items-center justify-between px-6">
          <Logo />
          <button onClick={() => setIsOpen(false)} className="md:hidden text-gray-500 hover:text-gray-700">
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) =>
                `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-brand-light text-white shadow-sm'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`
              }
            >
              <item.icon className="h-5 w-5 mr-3" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-4 space-y-2 border-t border-gray-200 dark:border-gray-700">
          <NavLink to="/member/profile" className={({ isActive }) => `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${ isActive ? 'bg-brand-light text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <User className="h-5 w-5 mr-3" />
            Mon Profil
          </NavLink>
          <NavLink to="/member/help" className={({ isActive }) => `flex items-center px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${ isActive ? 'bg-brand-light text-white' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
            <LifeBuoy className="h-5 w-5 mr-3" />
            Aide
          </NavLink>
        </div>
      </div>
    </>
  );
};

export default MemberSidebar;
