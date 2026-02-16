
import React, { useState } from 'react';
import { LayoutDashboard, LogOut, Compass, GraduationCap, Users, Search, Target, Menu, X, Briefcase, UserCircle, FileText, ShieldCheck, Lock, Sparkles, Map } from 'lucide-react';
import { ViewState, UserProfile } from '../types';

interface NavProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
  onLogout: () => void;
  user: UserProfile;
}

export const Sidebar: React.FC<NavProps> = ({ currentView, onChangeView, onLogout, user }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // Persona Logic
  const isRecruiter = user.primaryFocus === 'Recruiter';
  const isContractor = ['Contractor', 'AssetOwner', 'GrowthStartup'].includes(user.primaryFocus || '');
  const isAdmin = user.primaryFocus === 'Admin';
  
  // Monetization Logic
  const isPremium = user.isSubscribed;

  const NavItem = ({ view, icon: Icon, label, activeColor = 'emerald', isLocked = false }: { view: ViewState; icon: any; label: string; activeColor?: string; isLocked?: boolean }) => {
    const isActive = currentView === view;
    
    // JUNGLE OS COLOR SYSTEM
    let activeGradient = 'from-slate-700 to-slate-900';
    if (activeColor === 'emerald') activeGradient = 'from-emerald-600 to-teal-600 shadow-[0_0_15px_rgba(16,185,129,0.4)]'; // Primary / Growth
    if (activeColor === 'amber') activeGradient = 'from-amber-500 to-orange-600 shadow-[0_0_15px_rgba(245,158,11,0.4)]'; // Value / Gold
    if (activeColor === 'teal') activeGradient = 'from-teal-500 to-cyan-600 shadow-[0_0_15px_rgba(20,184,166,0.4)]'; // Search / Water
    if (activeColor === 'indigo') activeGradient = 'from-indigo-600 to-violet-600 shadow-[0_0_15px_rgba(99,102,241,0.4)]'; // Deep Tech
    
    return (
      <button
        onClick={() => { onChangeView(view); setIsMobileMenuOpen(false); }}
        className={`group relative flex items-center w-full px-4 py-3 space-x-3 transition-all duration-300 rounded-xl mb-1 overflow-hidden ${
          isActive
            ? 'text-white'
            : 'text-slate-400 hover:text-emerald-100 hover:bg-emerald-950/30'
        }`}
      >
        {isActive && (
            <div className={`absolute inset-0 bg-gradient-to-r ${activeGradient}`}></div>
        )}
        
        <Icon size={18} className={`relative z-10 transition-colors ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-emerald-400'}`} />
        <span className={`relative z-10 font-medium text-sm tracking-wide flex-1 text-left ${isActive ? 'font-bold' : ''}`}>{label}</span>
        
        {isLocked && !isPremium && (
            <Lock size={14} className="relative z-10 text-amber-500/70" />
        )}
      </button>
    );
  };

  const SidebarContent = () => (
      <div className="flex flex-col h-full">
        {/* Brand Header */}
        <div className="flex items-center space-x-3 mb-10 px-2 mt-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-gradient-to-br from-emerald-500 to-teal-900 text-white relative overflow-hidden border border-emerald-400/20">
                <div className="absolute inset-0 bg-emerald-400/20 blur-md"></div>
                <Compass size={24} className="relative z-10"/>
            </div>
            <div>
                <span className="block text-xl font-serif font-bold text-slate-100 tracking-tight leading-none">Career<span className="text-emerald-500">OS</span></span>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 flex items-center gap-1 mt-1">
                    {isPremium ? <span className="text-amber-400 flex items-center gap-1"><Sparkles size={8} /> ELITE</span> : 'BASE CAMP'}
                </span>
            </div>
        </div>
        
        <nav className="flex-1 space-y-8">
            <div>
                <div className="px-4 text-[10px] font-bold text-emerald-500/50 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                    <Map size={10} /> Navigation
                </div>
                <NavItem view="dashboard" icon={LayoutDashboard} label="Command Center" activeColor="emerald" />
                <NavItem 
                    view="strategy" 
                    icon={Target} 
                    label={isContractor ? "Strategy War Room" : "Strategy Engine"} 
                    activeColor="amber" 
                    isLocked={true}
                />
            </div>

            <div>
                <div className="px-4 text-[10px] font-bold text-emerald-500/50 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                    <Briefcase size={10} /> Expedition
                </div>
                <NavItem 
                    view="marketplace" 
                    icon={Search} 
                    label={isRecruiter ? "Talent Scout" : isContractor ? "Tender Radar" : "Job Hunt"} 
                    activeColor="teal" 
                />
                <NavItem 
                    view="network" 
                    icon={Users} 
                    label={isRecruiter ? "Talent Pool" : "Tribes & Mentors"} 
                    activeColor="indigo" 
                />
                <NavItem 
                    view="academy" 
                    icon={GraduationCap} 
                    label={isContractor ? "Compliance Drill" : "Survival Skills"} 
                    activeColor="indigo" 
                />
            </div>

            <div>
                <div className="px-4 text-[10px] font-bold text-emerald-500/50 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                    <ShieldCheck size={10} /> Gear
                </div>
                {!isRecruiter && (
                    <NavItem 
                        view="toolkit" 
                        icon={isContractor ? FileText : Briefcase} 
                        label={isContractor ? "Bid Toolkit" : "Career Toolkit"} 
                        activeColor="amber"
                        isLocked={true}
                    />
                )}
                {isAdmin && (
                    <NavItem 
                        view="admin" 
                        icon={ShieldCheck} 
                        label="Admin Console" 
                        activeColor="rose" 
                    />
                )}
                <NavItem view="settings" icon={UserCircle} label={isContractor ? "HQ Settings" : "Profile & Comms"} activeColor="slate" />
            </div>
        </nav>

        {!isPremium && (
            <div 
                className="mb-4 p-5 rounded-2xl relative overflow-hidden group cursor-pointer border border-amber-500/30"
                onClick={() => onChangeView('subscription')}
            >
                {/* Golden Gradient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-amber-900/80 to-yellow-900/40"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl -mr-10 -mt-10 group-hover:bg-amber-500/20 transition-colors"></div>
                
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2 text-amber-200">
                        <Lock size={14} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Restricted Access</span>
                    </div>
                    <h4 className="font-serif font-bold text-white text-lg mb-1">Unlock The Gold</h4>
                    <p className="text-xs text-amber-100/80 mb-4 leading-relaxed">Access the Strategy Engine & AI Auto-Bidding tools.</p>
                    <button className="w-full py-2 bg-gradient-to-r from-amber-400 to-yellow-500 text-black rounded-lg text-xs font-bold hover:shadow-[0_0_15px_rgba(245,158,11,0.5)] transition-all shadow-lg flex items-center justify-center gap-2">
                        <Sparkles size={12} /> Upgrade Status
                    </button>
                </div>
            </div>
        )}

        <div className="pt-4 border-t border-white/5">
            <button
            onClick={onLogout}
            className="flex items-center w-full px-5 py-3 space-x-3 text-slate-500 hover:text-red-400 transition-colors rounded-xl hover:bg-red-900/10 group"
            >
            <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
            <span className="font-medium text-sm">Abort Session</span>
            </button>
        </div>
      </div>
  );

  return (
    <>
        {/* Desktop Sidebar - The Jungle HUD */}
        <div className="hidden md:flex flex-col w-72 h-[96vh] fixed left-4 top-[2vh] z-50 rounded-[2rem] border border-white/5 bg-[#050b09]/80 backdrop-blur-2xl shadow-2xl p-6 transition-all duration-300">
            {/* Subtle Noise Texture */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
            <SidebarContent />
        </div>

        {/* Mobile Header & Menu */}
        <div className="md:hidden fixed top-0 w-full z-50 p-4 flex justify-between items-center bg-[#020604]/90 backdrop-blur-xl border-b border-white/10">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-white">
                    <Compass size={18} />
                </div>
                <span className="font-serif font-bold text-white tracking-wide">CareerOS</span>
            </div>
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 text-slate-300">
                <Menu size={24} />
            </button>
        </div>

        {/* Mobile Drawer */}
        {isMobileMenuOpen && (
            <div className="fixed inset-0 z-[60] bg-[#010403]/90 backdrop-blur-sm animate-in fade-in">
                <div className="absolute right-0 top-0 h-full w-72 bg-[#050b09] border-l border-white/10 p-6 shadow-2xl animate-in slide-in-from-right">
                    <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-4 right-4 text-slate-400">
                        <X size={24} />
                    </button>
                    <div className="mt-8 h-full">
                        <SidebarContent />
                    </div>
                </div>
            </div>
        )}
    </>
  );
};

export const MobileNav: React.FC<NavProps> = ({ currentView, onChangeView, user }) => {
  const isRecruiter = user.primaryFocus === 'Recruiter';
  const isContractor = ['Contractor', 'AssetOwner', 'GrowthStartup'].includes(user.primaryFocus || '');
  
  const navItems = [
      { view: 'dashboard', icon: LayoutDashboard },
      { view: 'marketplace', icon: Search },
      { view: 'academy', icon: GraduationCap },
      { view: isRecruiter ? 'network' : 'toolkit', icon: isRecruiter ? Users : (isContractor ? FileText : Briefcase) },
      { view: 'settings', icon: UserCircle },
  ];

  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 bg-[#050b09]/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl px-2 py-3 flex justify-around items-center z-50">
      {navItems.map((item) => (
          <button
            key={item.view}
            onClick={() => onChangeView(item.view as ViewState)}
            className={`relative flex flex-col items-center justify-center p-3 rounded-2xl transition-all ${
                currentView === item.view ? 'text-emerald-400 bg-emerald-900/20' : 'text-slate-500'
            }`}
            >
            <item.icon size={22} className="relative z-10" />
        </button>
      ))}
    </div>
  );
};
