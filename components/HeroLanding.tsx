
import React, { useEffect, useState } from 'react';
import { ArrowRight, Compass, Users, Zap, Leaf, ShieldCheck, Star, Target, Cpu, Layers } from 'lucide-react';

interface HeroProps {
    onGetStarted: () => void;
    onViewDemo?: () => void;
}

export const HeroLanding: React.FC<HeroProps> = ({ onGetStarted, onViewDemo }) => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 50);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="min-h-screen bg-[#020604] overflow-hidden font-sans relative text-white selection:bg-emerald-500/30">
            
            {/* --- AMBIENT SOUNDSCAPE VISUAL --- */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,_#0f392b_0%,_#020604_60%)]"></div>
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald-500/10 blur-[120px] rounded-full mix-blend-screen pointer-events-none"></div>
            </div>

            {/* Navbar */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrolled ? 'bg-[#020604]/90 backdrop-blur-md border-b border-white/5 py-4' : 'bg-transparent py-6'}`}>
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                            <Compass size={20} />
                        </div>
                        <span className="text-xl font-bold tracking-tight">CareerOS</span>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={onGetStarted} className="text-sm font-bold text-slate-300 hover:text-white transition-colors">Log In</button>
                        <button 
                            onClick={onGetStarted}
                            className="px-5 py-2 rounded-full bg-white text-emerald-950 text-sm font-bold hover:bg-emerald-50 transition-colors shadow-lg"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Content */}
            <header className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-6 flex flex-col items-center text-center z-10">
                <div className="inline-flex items-center px-4 py-2 rounded-full border border-emerald-500/30 bg-emerald-900/20 backdrop-blur-md text-emerald-300 text-xs font-bold uppercase tracking-wider mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <Zap size={12} className="mr-2 text-yellow-400" />
                    AI-Powered Career Acceleration
                </div>
                
                <h1 className="text-5xl md:text-8xl font-bold tracking-tighter mb-8 leading-[0.9] animate-in fade-in slide-in-from-bottom-8 duration-1000">
                    Your Career. <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-200">Systematized.</span>
                </h1>
                
                <p className="text-xl md:text-2xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
                    Stop guessing. Use AI to analyze your market value, identify skill gaps, and auto-apply to high-probability roles.
                </p>
                
                <div className="flex flex-col md:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
                    <button 
                        onClick={onGetStarted}
                        className="px-8 py-4 rounded-full bg-emerald-600 text-white font-bold text-lg hover:bg-emerald-500 hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/50"
                    >
                        Launch OS
                        <ArrowRight size={20} />
                    </button>
                    <button 
                        onClick={onViewDemo}
                        className="px-8 py-4 rounded-full border border-white/10 bg-white/5 text-white font-bold text-lg hover:bg-white/10 transition-all"
                    >
                        See Demo
                    </button>
                </div>
            </header>

            {/* Feature Grid */}
            <section className="py-24 max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-[#0a1f16]/50 border border-emerald-500/20 p-8 rounded-3xl backdrop-blur-sm hover:border-emerald-500/40 transition-colors">
                        <div className="w-12 h-12 bg-emerald-900/50 rounded-xl flex items-center justify-center text-emerald-400 mb-6">
                            <Target size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Strategy Engine</h3>
                        <p className="text-slate-400">Map your Ikigai, assess your Wheel of Life, and build a 100-day career roadmap.</p>
                    </div>
                    <div className="bg-[#0a1f16]/50 border border-emerald-500/20 p-8 rounded-3xl backdrop-blur-sm hover:border-emerald-500/40 transition-colors">
                        <div className="w-12 h-12 bg-blue-900/50 rounded-xl flex items-center justify-center text-blue-400 mb-6">
                            <Cpu size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">AI Career Toolkit</h3>
                        <p className="text-slate-400">Instant resume tailoring, cover letter generation, and mock interview simulations.</p>
                    </div>
                    <div className="bg-[#0a1f16]/50 border border-emerald-500/20 p-8 rounded-3xl backdrop-blur-sm hover:border-emerald-500/40 transition-colors">
                        <div className="w-12 h-12 bg-purple-900/50 rounded-xl flex items-center justify-center text-purple-400 mb-6">
                            <Layers size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Skills Academy</h3>
                        <p className="text-slate-400">Close gaps with AI-generated "Deep Dive" courses created from any PDF or topic.</p>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 text-center text-slate-600 text-sm relative z-10">
                <p>&copy; 2026 CareerOS. All potential reserved.</p>
            </footer>
        </div>
    );
};
