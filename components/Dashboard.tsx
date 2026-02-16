
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, ViewState } from '../types';
import { TrendingUp, Award, Briefcase, Target, BookOpen, Sparkles, Zap, ArrowRight, Users, Clock, Activity, MapPin, Download, Building2, Play, Plus, CheckCircle, DollarSign, FileText, Globe, Landmark, AlertTriangle, ShieldCheck, Sun, Calendar, Layout } from 'lucide-react';

interface DashboardProps {
  user: UserProfile;
  onChangeView: (view: ViewState, data?: any) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onChangeView }) => {
  const isContractor = ['Contractor', 'AssetOwner', 'GrowthStartup'].includes(user.primaryFocus || '');
  const isRecruiter = user.primaryFocus === 'Recruiter';

  // --- Reactive Data (Simulated) ---
  const appliedCount = user.appliedJobIds?.length || 0;
  const courseCount = user.enrolledCourses?.filter(c => c.status === 'Completed').length || 0;
  const skillPoints = (user.skillScore || 0) + (courseCount * 15);
  const marketVal = (user.marketValue || 3000) + (courseCount * 250) + (appliedCount * 50);

  // --- Spotlight Logic ---
  const gridRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (gridRef.current) {
        const cards = gridRef.current.getElementsByClassName('dashboard-card');
        for (const card of cards) {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          (card as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
          (card as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
        }
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const getGreeting = () => {
      const hour = new Date().getHours();
      if (hour < 12) return "Good Morning";
      if (hour < 18) return "Good Afternoon";
      return "Good Evening";
  };

  const VelocitySparkline = ({ color = "currentColor" }) => (
      <svg width="100%" height="40" viewBox="0 0 200 40" className="opacity-70 overflow-visible">
          <defs>
            <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="currentColor" stopOpacity="0.2"/>
                <stop offset="100%" stopColor="currentColor" stopOpacity="0"/>
            </linearGradient>
          </defs>
          <path d="M0,35 C20,35 40,20 60,25 C80,30 100,5 120,15 C140,25 160,10 200,5" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" className="animate-[dash_2s_ease-out_forwards]" strokeDasharray="300" strokeDashoffset="0" />
          <path d="M0,35 C20,35 40,20 60,25 C80,30 100,5 120,15 C140,25 160,10 200,5 V40 H0 Z" fill="url(#gradient)" stroke="none" className="text-current opacity-20" />
      </svg>
  );

  return (
    <div className="p-6 md:p-8 pb-32 max-w-[1600px] mx-auto animate-in fade-in">
      
      {/* 1. HEADER HUD */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4 bg-[#0a1410] p-6 rounded-3xl border border-white/5">
          <div>
              <div className="flex items-center gap-2 mb-2 text-emerald-400 text-xs font-bold uppercase tracking-widest">
                  <Sun size={14} className="text-yellow-400" />
                  Daily Tactical Brief
              </div>
              <h1 className="text-2xl md:text-4xl font-serif font-bold text-white tracking-wide mb-1">
                  {getGreeting()}, {user.name.split(' ')[0]}.
              </h1>
              <p className="text-slate-400 text-sm">
                  System status: <span className="text-emerald-400 font-bold">OPTIMIZED</span>. Market liquidity is <span className="text-emerald-400 font-bold">HIGH</span> today.
              </p>
          </div>
          <div className="flex gap-3">
              <button className="px-4 py-2 border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-emerald-500/20 transition-colors uppercase tracking-wider">
                  <Activity size={14}/> Run Diagnostics
              </button>
              <button 
                onClick={() => onChangeView('marketplace')}
                className="px-6 py-3 bg-white text-[#010804] rounded-xl font-bold text-sm hover:bg-emerald-50 transition-colors shadow-[0_0_20px_rgba(255,255,255,0.2)] flex items-center gap-2 hover:scale-105 transform active:scale-95"
              >
                  {isRecruiter ? <Users size={16}/> : <Target size={16}/>} 
                  {isRecruiter ? 'Source Talent' : 'Acquire Targets'}
              </button>
          </div>
      </div>

      {/* 2. BENTO GRID LAYOUT */}
      <div ref={gridRef} className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[minmax(180px,auto)]">
          
          {/* CARD: PRIMARY METRIC (Value) */}
          <div 
            onClick={() => onChangeView('strategy')}
            className="dashboard-card md:col-span-2 lg:col-span-2 row-span-1 bg-[#050b09] rounded-[2rem] border border-white/5 relative overflow-hidden group cursor-pointer"
          >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                    background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(16, 185, 129, 0.1), transparent 40%)`
                }}
              />
              
              <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity text-emerald-400">
                  <TrendingUp size={140} />
              </div>
              
              <div className="relative z-10 flex flex-col h-full justify-between p-8">
                  <div>
                      <div className="flex items-center gap-2 mb-3">
                          <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                              <DollarSign size={20} />
                          </div>
                          <span className="text-xs font-bold text-emerald-200/70 uppercase tracking-[0.1em]">{isContractor ? 'Projected Revenue' : 'Market Valuation'}</span>
                      </div>
                      <div className="text-5xl md:text-6xl font-serif font-bold text-white tracking-tight mb-2">
                          ${marketVal.toLocaleString()}
                          <span className="text-lg text-emerald-500/50 font-sans font-medium ml-2">{isContractor ? '' : '/mo'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 bg-emerald-500/10 w-fit px-3 py-1 rounded-full border border-emerald-500/20">
                          <TrendingUp size={12} /> +12.5% Growth Vector
                      </div>
                  </div>
                  <div className="w-full text-emerald-500 h-16 mt-4">
                      <VelocitySparkline color="#34d399" />
                  </div>
              </div>
          </div>

          {/* CARD: SKILL/COMPLIANCE */}
          <div 
            onClick={() => onChangeView(isContractor ? 'toolkit' : 'academy')}
            className="dashboard-card bg-[#0B0F19] p-6 rounded-[2rem] border border-white/5 text-white relative overflow-hidden group cursor-pointer"
          >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{background: `radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), rgba(99, 102, 241, 0.15), transparent 40%)`}} />
              <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/30 text-indigo-400">
                      {isContractor ? <ShieldCheck size={20}/> : <Target size={20}/>}
                  </div>
                  <ArrowRight size={18} className="text-slate-500 group-hover:text-indigo-400 transition-colors" />
              </div>
              <div className="relative z-10">
                  <div className="text-4xl font-serif font-bold mb-1 text-indigo-100">{isContractor ? '92%' : skillPoints}</div>
                  <div className="text-[10px] text-indigo-300/70 font-bold uppercase tracking-widest">{isContractor ? 'Compliance Health' : 'Skill Points'}</div>
                  <div className="mt-6 w-full bg-indigo-900/30 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-indigo-500 h-full w-[85%] shadow-[0_0_10px_#6366f1]"></div>
                  </div>
                  <p className="text-[10px] text-indigo-300 mt-2 flex items-center gap-1">
                      <CheckCircle size={10} /> {isContractor ? 'Tax Clearance Valid' : 'Top 5% in Strategy'}
                  </p>
              </div>
          </div>

          {/* CARD: ACTIVE PIPELINE */}
          <div 
            onClick={() => onChangeView(isRecruiter ? 'network' : 'marketplace')}
            className="dashboard-card bg-[#0B0F19] p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group cursor-pointer"
          >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{background: `radial-gradient(400px circle at var(--mouse-x) var(--mouse-y), rgba(20, 184, 166, 0.15), transparent 40%)`}} />
              <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="p-2 bg-teal-500/10 text-teal-400 rounded-lg border border-teal-500/30">
                      {isRecruiter ? <Users size={20}/> : <Activity size={20}/>}
                  </div>
                  <span className="bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Live</span>
              </div>
              <div className="relative z-10">
                  <div className="text-4xl font-serif font-bold text-teal-100 mb-1">
                      {isRecruiter ? '14' : appliedCount}
                  </div>
                  <div className="text-[10px] text-teal-300/70 font-bold uppercase tracking-widest">
                      {isRecruiter ? 'Active Candidates' : isContractor ? 'Submitted Bids' : 'Applications'}
                  </div>
                  <div className="flex -space-x-3 mt-6 pl-2">
                      {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0B0F19] bg-slate-700"></div>)}
                      <div className="w-8 h-8 rounded-full border-2 border-[#0B0F19] bg-slate-800 flex items-center justify-center text-[10px] font-bold text-slate-400">+</div>
                  </div>
              </div>
          </div>

          {/* CARD: RECOMMENDED OPPORTUNITY */}
          <div 
            onClick={() => onChangeView('marketplace')}
            className="dashboard-card md:col-span-2 lg:col-span-3 bg-[#0e1621] p-8 rounded-[2rem] border border-white/5 shadow-xl flex flex-col md:flex-row gap-8 items-center cursor-pointer relative overflow-hidden group"
          >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{background: `radial-gradient(800px circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.05), transparent 40%)`}} />
              
              <div className="flex-1 relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider mb-4 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                      <Sparkles size={10} fill="currentColor"/> High Priority Intel
                  </div>
                  <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-2 group-hover:text-emerald-400 transition-colors">
                      {isContractor ? 'Ministry of Transport: Road Rehab' : 'Global Strategy Lead'}
                  </h3>
                  <div className="flex items-center gap-4 text-sm text-slate-400 mb-8">
                      <span className="flex items-center gap-1"><Building2 size={14} className="text-slate-500"/> {isContractor ? 'Govt of Zimbabwe' : 'TechCorp Inc.'}</span>
                      <span className="flex items-center gap-1"><MapPin size={14} className="text-slate-500"/> {isContractor ? 'Harare' : 'Remote'}</span>
                      <span className="font-bold text-emerald-100 bg-emerald-900/30 px-2 py-0.5 rounded">{isContractor ? '$500k Budget' : '$8k/mo'}</span>
                  </div>
                  <div className="flex gap-3">
                      <button className="px-6 py-3 bg-white text-black rounded-xl text-xs font-bold hover:bg-emerald-50 transition-colors uppercase tracking-wider">
                          Engage Target
                      </button>
                      <button className="px-6 py-3 border border-white/10 text-slate-300 rounded-xl text-xs font-bold hover:bg-white/5 transition-colors uppercase tracking-wider">
                          Analyze
                      </button>
                  </div>
              </div>
              <div className="w-full md:w-1/3 h-full min-h-[160px] bg-slate-900 rounded-2xl flex flex-col items-center justify-center relative overflow-hidden border border-white/5">
                  <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20 mix-blend-overlay"></div>
                  <div className="relative z-10 text-center">
                      <div className="text-5xl font-black text-emerald-500 mb-1 drop-shadow-lg">98%</div>
                      <div className="text-[10px] font-bold text-emerald-200/50 uppercase tracking-[0.2em]">Win Probability</div>
                  </div>
              </div>
          </div>

          {/* CARD: ALERTS */}
          <div className="bg-[#0B0F19] p-6 rounded-[2rem] border border-slate-800 flex flex-col relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-transparent"></div>
              <h3 className="font-bold text-white mb-6 flex items-center gap-2">
                  <Zap size={18} className="text-yellow-400"/> Daily Mission
              </h3>
              <div className="flex-1 space-y-4">
                  <div className="text-sm text-slate-300 leading-relaxed pl-3 border-l-2 border-slate-700 hover:border-emerald-500 transition-colors cursor-pointer group">
                      <div className="text-[10px] font-bold text-slate-500 uppercase mb-1 group-hover:text-emerald-400">Strategy</div>
                      Update <strong>{isContractor ? 'Portfolio' : 'Resume'}</strong> to match new market trend.
                  </div>
                  <div className="text-sm text-slate-300 leading-relaxed pl-3 border-l-2 border-slate-700 hover:border-emerald-500 transition-colors cursor-pointer group">
                      <div className="text-[10px] font-bold text-slate-500 uppercase mb-1 group-hover:text-emerald-400">Execution</div>
                      Apply to <strong>3 High Probability</strong> targets.
                  </div>
              </div>
          </div>

          {/* CARD: NETWORK TEASER */}
          <div 
            onClick={() => onChangeView('network')}
            className="dashboard-card md:col-span-2 lg:col-span-2 bg-[#0e1621] p-6 rounded-[2rem] border border-white/5 shadow-sm flex flex-col justify-between group cursor-pointer relative overflow-hidden"
          >
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(59, 130, 246, 0.1), transparent 40%)`}} />
              <div className="flex justify-between items-center mb-4 relative z-10">
                  <h3 className="font-bold text-white flex items-center gap-2">
                      <Globe size={18} className="text-blue-500"/> Network Activity
                  </h3>
                  <ArrowRight size={16} className="text-slate-500 group-hover:text-white group-hover:translate-x-1 transition-all"/>
              </div>
              <div className="space-y-3 relative z-10">
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white border border-slate-600">SN</div>
                      <div className="flex-1">
                          <div className="text-sm font-bold text-slate-200">Sarah Ndlovu</div>
                          <div className="text-xs text-slate-500">Shared "Executive Leadership" protocol.</div>
                      </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                      <div className="w-8 h-8 rounded-full bg-indigo-900/50 text-indigo-400 border border-indigo-500/30 flex items-center justify-center text-xs font-bold">JM</div>
                      <div className="flex-1">
                          <div className="text-sm font-bold text-slate-200">John Moyo</div>
                          <div className="text-xs text-slate-500">Connected with you via "Tech Titans".</div>
                      </div>
                  </div>
              </div>
          </div>

          {/* CARD: ADD WIDGET */}
          <div 
            onClick={() => onChangeView('settings')}
            className="bg-[#0B0F19] p-6 rounded-[2rem] border border-dashed border-slate-800 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-slate-900 transition-colors"
          >
              <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center mb-3 shadow-sm text-slate-500 group-hover:text-white transition-colors">
                  <Plus size={24}/>
              </div>
              <div className="font-bold text-slate-500 text-xs uppercase tracking-widest">Customize HUD</div>
          </div>

      </div>
    </div>
  );
};
