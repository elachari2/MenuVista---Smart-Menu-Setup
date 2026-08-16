import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Coffee, LayoutDashboard, Plus, Sparkles } from 'lucide-react';

interface NavLinkProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

function NavLink({ icon, label, active = false, onClick }: NavLinkProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
        active
          ? 'bg-[#FDF0EB] text-[#E85D2C] border border-[#FADBD8]'
          : 'text-[#5A554F] hover:text-[#1E1A18] hover:bg-gray-100'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

/**
 * En-tête officiel MenuVista avec badge esthétique "Votre menu digitalisé en un instant"
 */
export const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <header className="border-b border-[#E8E4E0] bg-white sticky top-0 z-40 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between">
          {/* Logo & Marque */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="p-2 rounded-xl bg-[#E85D2C] text-white shadow-2xs group-hover:bg-[#D14C1E] transition-colors">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-extrabold text-[#1E1A18] tracking-tight">MenuVista</span>
              <span className="text-[10px] font-bold text-[#E85D2C] block leading-none tracking-wider">SMART SETUP</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <NavLink
              icon={<LayoutDashboard className="w-4 h-4" />}
              label="Accueil"
              active={location.pathname === '/'}
              onClick={() => navigate('/')}
            />
            <NavLink
              icon={<Coffee className="w-4 h-4" />}
              label="Menu"
              active={location.pathname.includes('/preview')}
              onClick={() => navigate('/preview/demo-menu-id')}
            />
            <NavLink
              icon={<Plus className="w-4 h-4" />}
              label="Nouveau menu"
              active={location.pathname === '/upload'}
              onClick={() => navigate('/')}
            />
          </nav>

          {/* Cadre Professionnel Esthétique Slogan */}
          <div className="flex items-center gap-2 bg-[#FDF0EB] border border-[#FADBD8] px-3.5 py-1.5 rounded-full shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-[#E85D2C]" />
            <span className="text-xs font-extrabold text-[#E85D2C] tracking-wide">
              Votre menu digitalisé en un instant
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
