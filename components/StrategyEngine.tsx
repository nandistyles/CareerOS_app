
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, ViewState, StrategicGoal } from '../types';
import { Compass, Target, BrainCircuit, Activity, Heart, Briefcase, Zap, Plus, ArrowRight, CheckCircle2, Lock, Loader2, TrendingUp, DollarSign, Users, RefreshCw, ChevronRight, Layers, BarChart3, ShieldCheck, Trophy, AlertTriangle, Sparkles } from 'lucide-react';
import { generateCareerRoadmap } from '../services/geminiService';

interface StrategyEngineProps {
    user: UserProfile;
    onUpdateUser: (user: UserProfile) => void;
    onChangeView: (view: ViewState, data?: any) => void;
}

// Benchmark Profiles
const BENCHMARKS: Record<string, Record<string, number>> = {
    'Executive': { Career: 9, Finance: 8, Health: 6, Network: 9, Growth: 7, Fun: 5 },
    'Founder': { Sales: 10, Finance: 7, Ops: 5, Product: 9, Team: 8, Brand: 6 },
    'Balanced': { Career: 7, Finance: 7, Health: 8, Network: 6, Growth: 7, Fun: 8 },
};

export const StrategyEngine: React.FC<StrategyEngineProps> = ({ user, onUpdateUser, onChangeView }) => {
    const isContractor = ['Contractor', 'AssetOwner', 'GrowthStartup'].includes(user.primaryFocus || '');
    
    const [activeTab, setActiveTab] = useState<'Calibration' | 'Roadmap' | 'Ikigai'>('Calibration');
    
    // Dynamic Categories based on Persona
    const CATEGORIES = isContractor 
        ? ['Sales', 'Finance', 'Ops', 'Product', 'Team', 'Brand']
        : ['Career', 'Finance', 'Health', 'Network', 'Growth', 'Fun'];

    const [wheelData, setWheelData] = useState<Record<string, number>>(() => {
        // Try to load existing, else default based on persona
        const saved = user.assessments?.[0]?.scores;
        if (saved) return saved;
        return isContractor 
            ? { Sales: 5, Finance: 4, Ops: 6, Product: 5, Team: 4, Brand: 3 }
            : { Career: 6, Finance: 5, Health: 7, Network: 4, Growth: 6, Fun: 5 };
    });

    const [selectedBenchmark, setSelectedBenchmark] = useState<string>(isContractor ? 'Founder' : 'Executive');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [roadmap, setRoadmap] = useState<StrategicGoal[]>(user.strategicRoadmap || []);
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

    // --- Dynamic Analysis Logic ---
    const getAnalysis = () => {
        const scores = Object.entries(wheelData) as [string, number][];
        
        if (scores.length === 0) {
            return {
                title: "Data Needed",
                msg: "Please calibrate your wheel to get insights.",
                color: "text-slate-400",
                borderColor: "border-slate-500",
                icon: Activity
            };
        }

        // Sort by value to find gaps
        const sorted = [...scores].sort((a, b) => a[1] - b[1]);
        const lowest = sorted[0];
        const highest = sorted[sorted.length - 1];
        
        // Calculate spread/divergence
        const highVal = highest ? highest[1] : 0;
        const lowVal = lowest ? lowest[1] : 0;
        const spread = highVal - lowVal;

        const average = scores.reduce((acc, curr) => acc + curr[1], 0) / (scores.length || 1);
        
        if (average >= 8.5) {
            return {
                title: "Elite Performance",
                msg: `Your profile is performing in the top 1% of the market. ${lowest?.[0]} is your relative constraint at ${lowVal}/10, but your overall system is exceptional.`,
                color: "text-emerald-400",
                borderColor: "border-emerald-500",
                icon: Trophy
            };
        }
        
        if (spread > 4) {
            return {
                title: "Critical Asymmetry",
                msg: `Critical Gap Detected: Your '${lowest?.[0]}' score (${lowVal}/10) is significantly lagging behind '${highest?.[0]}' (${highVal}/10). This creates drag on your velocity.`,
                color: "text-rose-400",
                borderColor: "border-rose-500",
                icon: AlertTriangle
            };
        }
        
        return {
            title: "Growth Opportunity",
            msg: `Your system is balanced but has room for power. Increasing '${lowest?.[0]}' (${lowVal}/10) will provide the highest ROI right now.`,
            color: "text-amber-400",
            borderColor: "border-amber-500",
            icon: Zap
        };
    };

    const getRecruiterInsight = () => {
        if (isContractor) {
            const s = wheelData['Sales'] || 0;
            const f = wheelData['Finance'] || 0;
            const score = (s + f) / 2;
            if (score > 8) return { label: "Investable", color: "text-emerald-400", desc: "Investors see your venture as high-growth, low-risk." };
            if (score > 5) return { label: "Sustainable", color: "text-blue-400", desc: "Solid business fundamentals. Scaling 'Brand' would increase valuation." };
            return { label: "Pre-Revenue", color: "text-amber-400", desc: "Focus on Sales and Product-Market Fit." };
        }

        const c = wheelData['Career'] || 0;
        const g = wheelData['Growth'] || 0;
        const n = wheelData['Network'] || 0;
        const score = (c + g + n) / 3;
        
        if (score > 8) return { label: "Top 1% Talent", color: "text-emerald-400", desc: "Recruiters see you as a high-value, low-risk placement." };
        if (score > 5) return { label: "High Potential", color: "text-blue-400", desc: "Strong baseline. Upskilling in 'Network' would trigger more offers." };
        return { label: "Developing", color: "text-amber-400", desc: "Focus on foundational skills to pass ATS filters." };
    };

    const analysis = getAnalysis();
    const insight = getRecruiterInsight();

    // --- Logic ---

    const handleScoreChange = (category: string, val: number) => {
        setWheelData(prev => ({ ...prev, [category]: val }));
    };

    const handleRunAnalysis = async () => {
        setIsAnalyzing(true);
        
        // UX Delay to simulate "Thinking"
        await new Promise(resolve => setTimeout(resolve, 1500));

        try {
            let goals: StrategicGoal[] = [];
            
            try {
                // Attempt to generate via AI
                goals = await generateCareerRoadmap(wheelData, user.companyName ? `${user.role} at ${user.companyName}` : (user.currentRole || 'Professional'));
            } catch (e) {
                console.warn("API call failed, proceeding to fallback logic.");
            }
            
            // FAIL-SAFE: If API returns empty/fails, use local intelligence to generate a roadmap
            if (!goals || goals.length === 0) {
                const entries = Object.entries(wheelData) as [string, number][];
                let lowestCat = isContractor ? 'Sales' : 'Career';
                if (entries.length > 0) {
                    const sorted = entries.sort((a,b) => a[1] - b[1]);
                    if (sorted.length > 0) lowestCat = sorted[0][0];
                }

                if (isContractor) {
                    goals = [
                        { id: 'g1', title: 'Revenue Optimization', category: 'Wealth' as any, deadline: 'Week 4', status: 'Not Started', steps: ['Audit sales funnel', 'Launch outbound campaign'] },
                        { id: 'g2', title: 'Operational Efficiency', category: 'Career' as any, deadline: 'Week 8', status: 'Not Started', steps: ['Automate invoicing', 'Hire VA'] },
                        { id: 'g3', title: 'Brand Authority', category: 'Network' as any, deadline: 'Week 12', status: 'Not Started', steps: ['Publish case study', 'Speak at industry event'] }
                    ];
                } else {
                    goals = [
                        { id: 'g1', title: `${lowestCat} Optimization Protocol`, category: 'Career' as any, deadline: 'Week 4', status: 'Not Started', steps: ['Audit current metrics', 'Identify leverage points'] },
                        { id: 'g2', title: 'Strategic Network Expansion', category: 'Network' as any, deadline: 'Week 8', status: 'Not Started', steps: ['Identify 5 key mentors'] },
                    ];
                }
            }

            setRoadmap(goals);
            onUpdateUser({ 
                ...user, 
                strategicRoadmap: goals, 
                assessments: [{ 
                    id: Date.now().toString(), 
                    type: 'WheelOfLife', 
                    date: new Date().toISOString(), 
                    scores: wheelData, 
                    insights: [analysis.msg] 
                }] 
            });
            setActiveTab('Roadmap');
        } catch (error) {
            console.error("Strategy Engine Critical Error:", error);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // --- Visualization Components ---

    const InteractiveRadar = () => {
        const radius = 120;
        const center = 160;
        const count = CATEGORIES.length;
        const sliceAngle = (2 * Math.PI) / count;

        const getPoints = (data: Record<string, number>) => {
            return CATEGORIES.map((cat, i) => {
                const val = data[cat] || 0;
                const angle = i * sliceAngle - Math.PI / 2;
                const x = center + (val / 10) * radius * Math.cos(angle);
                const y = center + (val / 10) * radius * Math.sin(angle);
                return `${x},${y}`;
            }).join(' ');
        };

        const userPoints = getPoints(wheelData);
        // Fallback for benchmark if categories mismatch
        const benchmarkPoints = getPoints(BENCHMARKS[selectedBenchmark] || BENCHMARKS['Balanced']);
        
        // Calculate Alignment Score dynamically
        const values = Object.values(wheelData) as number[];
        const totalScore = values.reduce((a, b) => a + b, 0);
        const alignmentPct = Math.round((totalScore / 60) * 100);

        return (
            <div className="relative w-full h-[400px] flex items-center justify-center group">
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none"></div>
                
                <svg width="320" height="320" className="overflow-visible">
                    {/* Concentric Webs */}
                    {[2, 4, 6, 8, 10].map(r => (
                        <circle key={r} cx={center} cy={center} r={(r / 10) * radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                    ))}
                    
                    {/* Axis Lines */}
                    {CATEGORIES.map((_, i) => {
                        const angle = i * sliceAngle - Math.PI / 2;
                        const x = center + radius * Math.cos(angle);
                        const y = center + radius * Math.sin(angle);
                        return <line key={i} x1={center} y1={center} x2={x} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />;
                    })}

                    {/* Benchmark Shape (Ghost) */}
                    <polygon 
                        points={benchmarkPoints}
                        fill="rgba(255, 255, 255, 0.05)"
                        stroke="rgba(255, 255, 255, 0.2)"
                        strokeWidth="1"
                        strokeDasharray="4 2"
                        className="transition-all duration-700 ease-out"
                    />

                    {/* User Data Shape */}
                    <polygon 
                        points={userPoints}
                        fill="rgba(99, 102, 241, 0.4)"
                        stroke="#818cf8"
                        strokeWidth="2"
                        className="drop-shadow-[0_0_10px_rgba(99,102,241,0.5)] transition-all duration-300 ease-out"
                    />

                    {/* Interactive Knobs */}
                    {CATEGORIES.map((cat, i) => {
                        const val = wheelData[cat] || 0;
                        const angle = i * sliceAngle - Math.PI / 2;
                        const x = center + (val / 10) * radius * Math.cos(angle);
                        const y = center + (val / 10) * radius * Math.sin(angle);
                        
                        // Label Position (pushed out)
                        const lx = center + (radius + 40) * Math.cos(angle);
                        const ly = center + (radius + 40) * Math.sin(angle);

                        return (
                            <g key={cat} onMouseEnter={() => setHoveredCategory(cat)} onMouseLeave={() => setHoveredCategory(null)}>
                                {/* The Label */}
                                <text 
                                    x={lx} y={ly} 
                                    textAnchor="middle" 
                                    dominantBaseline="middle" 
                                    className={`text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer ${hoveredCategory === cat ? 'fill-white text-shadow-glow' : 'fill-slate-500'}`}
                                >
                                    {cat}
                                </text>
                                {/* The Knob */}
                                <circle 
                                    cx={x} cy={y} r="6" 
                                    className="fill-white stroke-indigo-500 stroke-2 cursor-pointer hover:r-8 transition-all"
                                />
                            </g>
                        );
                    })}
                </svg>
                
                {/* Center Stats */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                        <div className={`text-4xl font-black tracking-tighter transition-colors duration-500 ${alignmentPct < 50 ? 'text-rose-400' : 'text-white'}`}>
                            {alignmentPct}%
                        </div>
                        <div className="text-[10px] text-indigo-400 uppercase font-bold tracking-widest">Alignment</div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 md:p-12 pb-32 min-h-screen bg-[#0B0F19] text-white">
            
            {/* --- Header & Nav --- */}
            <header className="mb-10 flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                            <Compass className="text-indigo-400" size={28} />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight">{isContractor ? 'Business Strategy' : 'Strategy Engine'}</h1>
                    </div>
                    <p className="text-lg text-slate-400">Calibrate your {isContractor ? 'company' : 'life'} systems. Identify leverage points. Execute.</p>
                </div>
                
                <div className="flex bg-slate-900/50 p-1 rounded-xl border border-white/10 backdrop-blur-md">
                    <button onClick={() => setActiveTab('Calibration')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'Calibration' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                        <Target size={16} className="inline mr-2" /> Calibration
                    </button>
                    <button onClick={() => setActiveTab('Ikigai')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'Ikigai' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                        <Layers size={16} className="inline mr-2" /> {isContractor ? 'Vision' : 'Ikigai'}
                    </button>
                    <button onClick={() => setActiveTab('Roadmap')} className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'Roadmap' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>
                        <Zap size={16} className="inline mr-2" /> Protocol
                    </button>
                </div>
            </header>

            {/* --- VIEW: CALIBRATION --- */}
            {activeTab === 'Calibration' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    
                    {/* LEFT: The Interface */}
                    <div className="lg:col-span-7 bg-slate-900/50 rounded-[2.5rem] p-8 border border-white/10 shadow-2xl backdrop-blur-sm relative overflow-hidden flex flex-col justify-between min-h-[600px]">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                        
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div>
                                <h2 className="text-2xl font-bold flex items-center gap-2">
                                    <Activity size={24} className="text-indigo-400" /> {isContractor ? 'Company Diagnostics' : 'Life OS Diagnostics'}
                                </h2>
                                <p className="text-slate-400 text-sm mt-1">Drag sliders to map your reality against market standards.</p>
                            </div>
                            
                            <div className="flex gap-2">
                                {Object.keys(BENCHMARKS).map(b => (
                                    <button 
                                        key={b}
                                        onClick={() => setSelectedBenchmark(b)}
                                        className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase transition-colors border ${
                                            selectedBenchmark === b 
                                            ? 'bg-white text-slate-900 border-white' 
                                            : 'bg-transparent text-slate-500 border-slate-700 hover:border-slate-500'
                                        }`}
                                    >
                                        {b}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="flex flex-col items-center relative z-10 flex-1">
                            {/* Interactive Radar Chart */}
                            <InteractiveRadar />

                            {/* Sliders Grid */}
                            <div className="w-full grid grid-cols-2 gap-x-8 gap-y-4 mt-8">
                                {CATEGORIES.map(cat => (
                                    <div key={cat} className="group relative">
                                        <div className="flex justify-between text-xs font-bold uppercase tracking-wider mb-2 text-slate-500 group-hover:text-white transition-colors">
                                            <span className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${wheelData[cat] < 5 ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                                                {cat}
                                            </span>
                                            <span>{wheelData[cat]}/10</span>
                                        </div>
                                        <div className="relative h-3 bg-slate-800 rounded-full overflow-hidden cursor-pointer group hover:bg-slate-700 transition-colors">
                                            <div 
                                                className={`absolute top-0 left-0 h-full transition-all duration-300 ${wheelData[cat] < 5 ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-600 to-blue-500'}`}
                                                style={{ width: `${wheelData[cat] * 10}%` }}
                                            ></div>
                                            {/* Benchmark Marker - Only if it exists in current benchmark */}
                                            {BENCHMARKS[selectedBenchmark][cat] && (
                                                <div 
                                                    className="absolute top-0 bottom-0 w-0.5 bg-white/50 z-10"
                                                    style={{ left: `${BENCHMARKS[selectedBenchmark][cat] * 10}%` }}
                                                ></div>
                                            )}
                                            <input 
                                                type="range" min="1" max="10" step="1"
                                                value={wheelData[cat]}
                                                onChange={(e) => handleScoreChange(cat, parseInt(e.target.value))}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: The Analysis & Intervention */}
                    <div className="lg:col-span-5 flex flex-col gap-6">
                        
                        {/* 1. Recruiter Insight Card */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-[2.5rem] p-8 border border-white/10 shadow-xl relative overflow-hidden">
                            <div className="flex justify-between items-start mb-6">
                                <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                                    <Briefcase size={24} className="text-indigo-400" />
                                </div>
                                <span className={`text-xs font-bold px-3 py-1 rounded-full border bg-white/5 ${insight.color.replace('text-', 'border-')}`}>
                                    {insight.label}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{isContractor ? 'Valuation Impact' : 'Market Value Impact'}</h3>
                            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
                                {insight.desc} Your profile demonstrates <strong className="text-white">High Agency</strong>.
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">{isContractor ? 'Projected Rev' : 'Projected Salary'}</div>
                                    <div className="text-lg font-bold text-emerald-400">{isContractor ? '$50k - $200k' : '$3,500 - $5k'}</div>
                                </div>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <div className="text-xs text-slate-500 uppercase font-bold mb-1">{isContractor ? 'Investor Interest' : 'Recruiter Interest'}</div>
                                    <div className="text-lg font-bold text-blue-400">High</div>
                                </div>
                            </div>
                        </div>

                        {/* 2. Neural Analysis Card (Dynamic) */}
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-white/10 shadow-xl relative overflow-hidden flex-1 flex flex-col justify-between">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5"></div>
                            
                            <div>
                                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                    <BrainCircuit size={20} className={analysis.color} /> Neural Analysis
                                </h3>
                                
                                <div className="space-y-4 mb-8">
                                    <div className={`p-4 bg-white/5 rounded-xl border-l-2 ${analysis.borderColor} animate-in slide-in-from-right duration-700`}>
                                        <div className={`font-bold mb-1 ${analysis.color}`}>{analysis.title}</div>
                                        <p className="text-sm text-slate-300 leading-relaxed">
                                            {analysis.msg}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button 
                                onClick={handleRunAnalysis}
                                disabled={isAnalyzing}
                                className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2"
                            >
                                {isAnalyzing ? <Loader2 className="animate-spin" /> : <Zap size={18} fill="currentColor" />}
                                {isAnalyzing ? 'Running Simulation...' : 'Generate 100-Day Protocol'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- VIEW: IKIGAI --- */}
            {activeTab === 'Ikigai' && (
                <div className="flex flex-col items-center justify-center h-[600px] animate-in zoom-in duration-500">
                    <div className="relative w-[500px] h-[500px]">
                        {/* CSS-only Ikigai visualization for visual flair */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-rose-500/30 mix-blend-screen animate-pulse flex items-center justify-center text-rose-200 font-bold tracking-widest text-xs pt-4 border border-rose-500/20">
                            {isContractor ? 'MARKET NEED' : 'LOVE'}
                        </div>
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-64 rounded-full bg-blue-500/30 mix-blend-screen animate-pulse delay-100 flex items-center justify-center text-blue-200 font-bold tracking-widest text-xs pb-4 border border-blue-500/20">
                            {isContractor ? 'BUSINESS MODEL' : 'PAID FOR'}
                        </div>
                        <div className="absolute top-1/2 left-0 -translate-y-1/2 w-64 h-64 rounded-full bg-emerald-500/30 mix-blend-screen animate-pulse delay-200 flex items-center justify-center text-emerald-200 font-bold tracking-widest text-xs pr-4 border border-emerald-500/20">
                            {isContractor ? 'COMPETENCY' : 'GOOD AT'}
                        </div>
                        <div className="absolute top-1/2 right-0 -translate-y-1/2 w-64 h-64 rounded-full bg-amber-500/30 mix-blend-screen animate-pulse delay-300 flex items-center justify-center text-amber-200 font-bold tracking-widest text-xs pl-4 border border-amber-500/20">
                            {isContractor ? 'MOAT' : 'WORLD NEEDS'}
                        </div>
                        
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-28 h-28 bg-white text-slate-900 rounded-full shadow-[0_0_50px_rgba(255,255,255,0.5)] flex flex-col items-center justify-center font-black z-10">
                            <span className="text-xl tracking-tighter">{isContractor ? 'UNICORN' : 'IKIGAI'}</span>
                            <span className="text-[8px] font-bold text-indigo-600 uppercase tracking-widest mt-1">Zone of Genius</span>
                        </div>
                    </div>
                    <p className="text-slate-400 mt-8 max-w-md text-center">
                        The Strategy Engine is calculating your zone of genius based on your Activity, Skills, and Market Value.
                    </p>
                </div>
            )}

            {/* --- VIEW: ROADMAP (TIMELINE) --- */}
            {activeTab === 'Roadmap' && (
                <div className="max-w-5xl mx-auto animate-in slide-in-from-right duration-500">
                    {roadmap.length > 0 ? (
                        <div className="grid grid-cols-1 gap-8 py-8">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-2xl font-bold flex items-center gap-3">
                                    <Trophy size={24} className="text-yellow-400" /> 100-Day Execution Protocol
                                </h2>
                                <button onClick={() => setActiveTab('Calibration')} className="text-sm font-bold text-slate-400 hover:text-white">Refine Strategy</button>
                            </div>

                            {roadmap.map((goal, i) => (
                                <div key={goal.id} className="relative group">
                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-transparent rounded-[2rem] -z-10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                    
                                    <div className="bg-slate-900/80 backdrop-blur-md rounded-[2rem] p-8 border border-white/10 hover:border-indigo-500/50 transition-all shadow-xl flex flex-col md:flex-row gap-8">
                                        {/* Status Column */}
                                        <div className="md:w-48 flex flex-col justify-between border-b md:border-b-0 md:border-r border-white/5 pb-6 md:pb-0 md:pr-6">
                                            <div>
                                                <div className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2">Phase {i + 1}</div>
                                                <div className="text-xl font-bold text-white mb-1">{goal.deadline}</div>
                                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
                                                    goal.category === 'Career' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' :
                                                    goal.category === 'Wealth' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                                                    'bg-purple-500/10 border-purple-500/30 text-purple-400'
                                                }`}>
                                                    {goal.category} Focus
                                                </div>
                                            </div>
                                            <div className="hidden md:block">
                                                <div className="text-xs font-bold text-slate-500 mb-2">Status</div>
                                                <div className="flex items-center gap-2 text-sm text-indigo-400">
                                                    <Loader2 size={14} className="animate-spin" /> In Progress
                                                </div>
                                            </div>
                                        </div>

                                        {/* Content Column */}
                                        <div className="flex-1">
                                            <h3 className="text-2xl font-bold text-white mb-6">{goal.title}</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {goal.steps.map((step, idx) => (
                                                    <div key={idx} className="flex items-start gap-3 p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group/step border border-white/5">
                                                        <div className="mt-1 w-5 h-5 rounded-full border border-slate-600 flex items-center justify-center group-hover/step:border-indigo-500 group-hover/step:bg-indigo-500/20 transition-colors bg-slate-800">
                                                            <CheckCircle2 size={12} className="opacity-0 group-hover/step:opacity-100 text-indigo-400" />
                                                        </div>
                                                        <span className="text-sm text-slate-300 group-hover/step:text-white transition-colors leading-relaxed font-medium">
                                                            {step}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Smart Action Footer */}
                                            <div className="mt-8 flex gap-4">
                                                {(goal.category === 'Career' || goal.category === 'Wealth') && (
                                                    <button onClick={() => onChangeView('marketplace')} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-lg">
                                                        <Briefcase size={16} /> Execute in Marketplace
                                                    </button>
                                                )}
                                                {goal.category === 'Learning' && (
                                                    <button onClick={() => onChangeView('academy')} className="px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold transition-colors flex items-center gap-2 shadow-lg">
                                                        <BrainCircuit size={16} /> Start Upskilling
                                                    </button>
                                                )}
                                                <button onClick={() => onChangeView('network')} className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl text-sm font-bold transition-colors flex items-center gap-2">
                                                    <Users size={16} /> Assign Mentor
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-32 text-center bg-slate-900/50 rounded-[3rem] border border-white/5 border-dashed">
                            <div className="w-24 h-24 bg-slate-800 rounded-full flex items-center justify-center mb-6 animate-pulse border border-slate-700 shadow-2xl">
                                <Target size={40} className="text-indigo-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Protocol Not Initialized</h3>
                            <p className="text-slate-400 mb-8 max-w-md text-lg">Run the Calibration simulation to generate your bespoke 100-day execution plan.</p>
                            <button onClick={() => setActiveTab('Calibration')} className="px-10 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold transition-all shadow-xl hover:shadow-indigo-500/20 text-lg">
                                Go to Calibration
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
