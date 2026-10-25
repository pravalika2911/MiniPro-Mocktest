import { NavLink } from 'react-router-dom';
import { Home, FileText, Settings, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const links = [
    { name: 'Dashboard', path: '/dashboard', icon: Home, roles: ['student'] },
    { name: 'Manage Exams', path: '/admin-panel', icon: FileText, roles: ['admin'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['student', 'admin'] },
  ];

  const filteredLinks = links.filter(link => link.roles.includes(user?.role?.toLowerCase()));

  return (
    <aside className="w-64 h-[calc(100vh-2rem)] m-4 flex flex-col bg-white border border-slate-200 shadow-sm rounded-sharp z-10 transition-all flex-shrink-0">
      <div className="p-6 border-b border-slate-100">
        <h1 className="text-xl font-bold tracking-tight text-slate-900 border-l-4 border-primary pl-3 uppercase">
          SENTINEL<span className="text-primary italic">.EXAM</span>
        </h1>
      </div>
      
      <nav className="flex-1 p-4 space-y-2">
        {filteredLinks.map((link) => (
          <NavLink
            key={link.name}
            to={link.path}
            className={({ isActive }) =>
              `flex items-center p-3 transition-colors rounded-sharp border ${
                isActive 
                  ? 'bg-primary/10 text-primary border-primary/20 font-medium' 
                  : 'text-slate-600 border-transparent hover:bg-slate-50 hover:text-slate-900'
              }`
            }
          >
            <link.icon className="w-5 h-5 mr-3" />
            {link.name}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-100">
        <div className="flex items-center px-3 mb-4">
          <div className="w-8 h-8 rounded-sharp bg-accent text-white flex items-center justify-center font-bold mr-3">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-semibold truncate text-slate-900">{user?.name}</p>
            <p className="text-xs text-slate-500 truncate">{user?.role}</p>
          </div>
        </div>
        <button 
          onClick={logout}
          className="w-full flex items-center p-3 text-slate-600 transition-colors hover:bg-red-50 hover:text-red-600 rounded-sharp"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
