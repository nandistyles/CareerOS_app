
import React, { useState, useEffect, useRef } from 'react';
import { Compass, Users, HardHat, MoveRight, LogIn, ScanFace, Map, Leaf, Bird } from 'lucide-react';

interface LandingProps {
  onOpenAuth: (mode: 'login' | 'signup', persona?: string) => void;
}

export const LandingPage: React.FC<LandingProps> = ({ onOpenAuth }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [scrolled, setScrolled] = useState(false);
  
  // Spotlight Ref Logic
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeCard, setActiveCard] = useState<number | null>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth) * 2 - 1,
        y: (e.clientY / window.innerHeight) * 2 - 1,
      });

      // Update CSS variables for spotlight effect
      if (containerRef.current) {
        const cards = containerRef.current.getElementsByClassName('spotlight-card');
        for (const card of cards) {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          (card as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
          (card as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
        }
      }
    };

    const handleScroll = () => {
        setScrolled(window.scrollY > 50);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('scroll', handleScroll);
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#010804] overflow-hidden font-sans relative text-white selection:bg-emerald-500/30">
      
      {/* --- LAYER 0: DEEP ATMOSPHERE (Static) --- */}
      <div className="fixed inset-0 z-0 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#064e3b_0%,_#022c22_40%,_#010804_80%)]"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/foggy-birds.png')] opacity-10 mix-blend-overlay animate-pulse-slow"></div>
          <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[120vw] h-[100vh] bg-gradient-to-b from-emerald-500/10 via-transparent to-transparent blur-[100px] rounded-[100%] pointer-events-none"></div>
      </div>

      {/* --- LAYER 1: BACK FOLIAGE (Slow Parallax) --- */}
      <div 
        className="fixed inset-0 z-0 opacity-40 pointer-events-none transition-transform duration-1000 ease-out"
        style={{ transform: `translate(${mousePos.x * -15}px, ${mousePos.y * -15}px)` }}
      >
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vh] bg-emerald-900/30 blur-2xl rounded-full mix-blend-multiply"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vh] bg-emerald-950/50 blur-3xl rounded-full mix-blend-multiply"></div>
      </div>

      {/* --- LAYER 2: INTERACTIVE PARTICLES (Fireflies) --- */}
      <div className="fixed inset-0 z-10 pointer-events-none">
         {[...Array(20)].map((_, i) => (
            <div 
                key={i}
                className="absolute bg-amber-200 rounded-full blur-[1px] animate-float opacity-0 animate-fade-in"
                style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    width: `${Math.random() * 3 + 1}px`,
                    height: `${Math.random() * 3 + 1}px`,
                    animationDuration: `${Math.random() * 10 + 5}s`,
                    animationDelay: `${Math.random() * 5}s`,
                    opacity: Math.random() * 0.4 + 0.1,
                    boxShadow: '0 0 10px 2px rgba(251, 191, 36, 0.3)'
                }}
            />
         ))}
      </div>

      {/* --- LAYER 3: FOREGROUND (Fast Parallax) --- */}
      <div 
        className="fixed inset-0 z-50 pointer-events-none transition-transform duration-100 ease-out"
        style={{ transform: `translate(${mousePos.x * -40}px, ${mousePos.y * -40}px)` }}
      >
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-[#010804] blur-[60px] rounded-full opacity-90"></div>
          <div className="absolute -bottom-20 -right-20 w-[500px] h-[500px] bg-[#010804] blur-[80px] rounded-full opacity-90"></div>
      </div>


      {/* --- MAIN CONTENT UI --- */}
      <div className="relative z-40 flex flex-col min-h-screen">
          
          {/* Navigation HUD */}
          <nav className={`fixed top-0 w-full transition-all duration-500 z-50 border-b ${scrolled ? 'bg-[#010804]/80 backdrop-blur-xl border-white/5 py-4' : 'bg-transparent border-transparent py-8'}`}>
              <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
                <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo(0,0)}>
                    <div className="relative w-10 h-10 flex items-center justify-center">
                        <div className="absolute inset-0 bg-emerald-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity"></div>
                        <div className="relative w-full h-full bg-gradient-to-br from-emerald-900 to-black border border-emerald-500/30 rounded-xl flex items-center justify-center overflow-hidden">
                            <div className="absolute inset-0 bg-emerald-400/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                            <Leaf className="text-emerald-400 group-hover:scale-110 transition-transform duration-500 relative z-10" size={20} />
                        </div>
                    </div>
                    <span className="font-serif font-bold text-xl tracking-wide text-white">Career<span className="text-emerald-500">OS</span></span>
                </div>
                
                <div className="flex gap-4">
                    <button 
                        onClick={() => onOpenAuth('login')}
                        className="hidden md:flex items-center gap-2 px-6 py-2.5 rounded-full border border-emerald-500/20 bg-emerald-950/30 backdrop-blur-md hover:bg-emerald-900/50 hover:border-emerald-500/50 transition-all text-sm font-medium text-emerald-100 group"
                    >
                        <LogIn size={16} className="group-hover:text-emerald-400 transition-colors" /> Member Login
                    </button>
                    <button 
                        onClick={() => onOpenAuth('signup')}
                        className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:shadow-[0_0_30px_rgba(245,158,11,0.5)] transition-all text-sm font-bold tracking-wide transform hover:scale-105 active:scale-95"
                    >
                        <ScanFace size={16} /> Get Started
                    </button>
                </div>
              </div>
          </nav>

          {/* Hero Content */}
          <div className="flex-1 flex flex-col justify-center items-center text-center px-6 md:px-20 max-w-7xl mx-auto w-full pt-28 pb-10">
              
              <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-emerald-950/40 border border-emerald-500/20 backdrop-blur-md text-emerald-300 text-xs font-bold uppercase tracking-[0.2em] mb-10 animate-in slide-in-from-bottom-4 fade-in duration-1000 border-l-4 border-l-emerald-500 shadow-2xl hover:bg-emerald-900/40 transition-colors cursor-default">
                  <span className="animate-pulse text-amber-400"><Bird size={14} /></span>
                  Welcome to the Ecosystem
              </div>

              <h1 className="text-6xl md:text-9xl font-bold tracking-tighter mb-8 leading-[0.9] md:leading-[0.9] animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-100 font-serif relative">
                  <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-b from-white via-emerald-100 to-emerald-900/80 drop-shadow-2xl">Survive the</span>
                  <br />
                  <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-200 to-emerald-500 italic pr-4">
                    Concrete Jungle.
                  </span>
                  {/* Text Glow Behind */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-emerald-500/20 blur-[120px] -z-10 rounded-full animate-pulse-slow"></div>
              </h1>

              <p className="text-lg md:text-2xl text-slate-400 max-w-3xl mx-auto mb-20 leading-relaxed animate-in slide-in-from-bottom-8 fade-in duration-1000 delay-200 font-light">
                  The operating system that evolves with you. 
                  <span className="text-emerald-200 font-medium px-1"> Identify prey (jobs)</span>, 
                  <span className="text-emerald-200 font-medium px-1"> camouflage weaknesses (upskill)</span>, and 
                  <span className="text-amber-400 font-bold border-b border-amber-500/50 pb-0.5 ml-1"> claim the gold</span>.
              </p>

              {/* SPOTLIGHT CARDS CONTAINER */}
              <div 
                ref={containerRef}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-7xl animate-in slide-in-from-bottom-12 fade-in duration-1000 delay-300"
              >
                  {[
                    { 
                        id: 1, 
                        role: 'Professional', 
                        icon: Compass, 
                        title: 'Talent', 
                        desc: 'Navigate the career wilderness. Find remote roles and upkill instantly.', 
                        color: 'emerald',
                        img: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=800&auto=format&fit=crop'
                    },
                    { 
                        id: 2, 
                        role: 'Contractor', 
                        icon: HardHat, 
                        title: 'Contractor', 
                        desc: 'Build your empire. Secure government tenders and track financing.', 
                        color: 'amber',
                        img: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=800&auto=format&fit=crop'
                    },
                    { 
                        id: 3, 
                        role: 'Recruiter', 
                        icon: Users, 
                        title: 'Recruiter', 
                        desc: 'Apex Predators. Hunt elite talent packs and dominate the market.', 
                        color: 'blue',
                        img: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=800&auto=format&fit=crop'
                    }
                  ].map((card, index) => (
                    <div 
                        key={card.id}
                        onMouseEnter={() => setActiveCard(index)}
                        onMouseLeave={() => setActiveCard(null)}
                        onClick={() => onOpenAuth('signup', card.role)}
                        className={`spotlight-card group relative h-96 rounded-[2.5rem] overflow-hidden cursor-pointer transition-all duration-500 hover:-translate-y-4 ${activeCard !== null && activeCard !== index ? 'opacity-50 scale-95' : 'opacity-100 scale-100'}`}
                    >
                        {/* Dynamic Spotlight Border */}
                        <div 
                            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-20 pointer-events-none"
                            style={{
                                background: `radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255,255,255,0.1), transparent 40%)`
                            }}
                        />
                        
                        {/* Background Image with Reveal */}
                        <div className="absolute inset-0 bg-[#0a1f16] z-0"></div>
                        <div 
                            className="absolute inset-0 bg-cover bg-center opacity-40 mix-blend-overlay transition-transform duration-1000 group-hover:scale-110 grayscale group-hover:grayscale-0"
                            style={{ backgroundImage: `url('${card.img}')` }}
                        ></div>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#010804] via-[#010804]/80 to-transparent z-10"></div>

                        {/* Content */}
                        <div className="relative z-30 h-full flex flex-col justify-between p-8 text-left">
                            <div className={`w-16 h-16 rounded-2xl border flex items-center justify-center backdrop-blur-md transition-all duration-500 group-hover:scale-110 ${
                                card.color === 'emerald' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black' :
                                card.color === 'amber' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 group-hover:bg-amber-500 group-hover:text-black' :
                                'bg-blue-500/10 border-blue-500/30 text-blue-400 group-hover:bg-blue-500 group-hover:text-black'
                            }`}>
                                <card.icon size={32} />
                            </div>
                            
                            <div>
                                <h3 className={`text-3xl font-bold text-white mb-3 font-serif transition-colors ${
                                    card.color === 'emerald' ? 'group-hover:text-emerald-300' :
                                    card.color === 'amber' ? 'group-hover:text-amber-300' :
                                    'group-hover:text-blue-300'
                                }`}>{card.title}</h3>
                                
                                <p className="text-sm text-slate-400 group-hover:text-white/90 transition-colors leading-relaxed mb-6">
                                    {card.desc}
                                </p>
                                
                                <div className={`flex items-center text-xs font-bold uppercase tracking-wider opacity-60 group-hover:opacity-100 transition-all translate-x-0 group-hover:translate-x-2 ${
                                    card.color === 'emerald' ? 'text-emerald-500' :
                                    card.color === 'amber' ? 'text-amber-500' :
                                    'text-blue-500'
                                }`}>
                                    Initialize <MoveRight size={14} className="ml-2" />
                                </div>
                            </div>
                        </div>
                    </div>
                  ))}
              </div>

          </div>

          {/* Footer Stats */}
          <div className="w-full border-t border-white/5 bg-[#010804]/80 backdrop-blur-xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-center gap-6 text-[10px] uppercase tracking-widest text-slate-500 font-mono relative z-20 mt-20">
              <div className="flex gap-8">
                  <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                      <span>System: Online</span>
                  </div>
                  <div className="flex items-center gap-2">
                      <Map size={12} className="text-amber-400" />
                      <span>Nodes: 14,205</span>
                  </div>
              </div>
              <div className="flex gap-4">
                  <span>© 2026 CAREER_OS</span>
                  <span className="hidden md:inline">|</span>
                  <span>VERSION 4.0.2 (JUNGLE)</span>
              </div>
          </div>

      </div>
    </div>
  );
};
