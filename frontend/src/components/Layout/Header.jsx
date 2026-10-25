import { Bell, Search } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const Header = () => {
  const { user } = useAuth();
  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <header className="h-20 mt-4 mr-4 bg-white border border-slate-200 shadow-sm rounded-sharp flex items-center justify-between px-6 z-10">
      <div>
        <h2 className="text-lg font-bold text-slate-800 tracking-tight">Welcome back, {user?.name?.split(' ')[0]}</h2>
        <p className="text-sm text-slate-500 font-medium">{date}</p>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative group hidden md:block">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Search database..." 
            className="pl-9 pr-4 py-2 border border-slate-200 rounded-sharp text-sm focus:border-primary focus:ring-1 focus:ring-primary w-64 bg-slate-50 focus:bg-white transition-all font-medium outline-none"
          />
        </div>
        <button className="relative p-2 text-slate-400 hover:text-slate-600 transition-colors rounded-sharp hover:bg-slate-50">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border border-white"></span>
        </button>
      </div>
    </header>
  );
};

export default Header;
