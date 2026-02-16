
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, Mentor, NetworkEvent } from '../types';
import { Users, Calendar, MessageSquare, MapPin, Search, X, Send, Filter, MoreHorizontal, Video, Globe, Briefcase, Award, TrendingUp, ChevronRight, Hash, Bell, Clock, Kanban, List, CheckCircle2, Mic2, Bot, BrainCircuit, Sparkles, User, Loader2, RefreshCw } from 'lucide-react';
import { simulateBoardroom, generateMentors, generateEvents } from '../services/geminiService';
import { authService } from '../services/authService';

interface NetworkProps {
    user: UserProfile;
}

export const NetworkHub: React.FC<NetworkProps> = ({ user }) => {
    const isRecruiter = user.primaryFocus === 'Recruiter';

    // --- STATE ---
    const [activeTab, setActiveTab] = useState<'Boardroom' | 'Rolodex' | 'Events' | 'Pipeline'>('Boardroom');
    
    // Data State
    const [mentors, setMentors] = useState<Mentor[]>(user.network || []);
    const [events, setEvents] = useState<NetworkEvent[]>(user.events || []);
    const [isGenerating, setIsGenerating] = useState(false);
    
    // Boardroom State
    const [boardTopic, setBoardTopic] = useState('');
    const [boardHistory, setBoardHistory] = useState<{speaker: string, text: string, sentiment: 'Positive'|'Negative'|'Neutral'}[]>([]);
    const [isBoardThinking, setIsBoardThinking] = useState(false);
    const boardScrollRef = useRef<HTMLDivElement>(null);

    // Search State
    const [searchQuery, setSearchQuery] = useState('');

    // --- EFFECTS ---
    useEffect(() => {
        if (isRecruiter) setActiveTab('Pipeline');
    }, [isRecruiter]);

    useEffect(() => {
        if (boardScrollRef.current) {
            boardScrollRef.current.scrollTop = boardScrollRef.current.scrollHeight;
        }
    }, [boardHistory]);

    // --- HANDLERS ---
    
    const handleStartDebate = async () => {
        if (!boardTopic.trim()) return;
        setIsBoardThinking(true);
        setBoardHistory(prev => [...prev, { speaker: 'You', text: boardTopic, sentiment: 'Neutral' }]);
        
        try {
            const context = `User: ${user.name}, Role: ${user.role || 'Professional'}, Industry: ${user.industry}`;
            const debate = await simulateBoardroom(boardTopic, context);
            setBoardTopic('');
            
            // Stream the debate responses with a slight delay for realism
            for (const turn of debate) {
                await new Promise(resolve => setTimeout(resolve, 1500));
                setBoardHistory(prev => [...prev, turn]);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsBoardThinking(false);
        }
    };

    const handleRSVP = (id: string) => {
        const updatedEvents = events.map(e => e.id === id ? { ...e, isAttending: !e.isAttending } : e);
        setEvents(updatedEvents);
        authService.updateUser({ ...user, events: updatedEvents });
    };

    const handleConnect = (id: string) => {
        const updatedMentors = mentors.map(m => m.id === id ? { ...m, isConnected: !m.isConnected } : m);
        setMentors(updatedMentors);
        authService.updateUser({ ...user, network: updatedMentors });
    };

    const handleGenerateNetwork = async (type: 'mentors' | 'events') => {
        setIsGenerating(true);
        try {
            if (type === 'mentors') {
                const newMentors = await generateMentors(user.industry || 'General', user.currentRole || 'Professional');
                setMentors(newMentors);
                authService.updateUser({ ...user, network: newMentors });
            } else {
                const newEvents = await generateEvents(user.industry || 'General', user.location || 'Online');
                setEvents(newEvents);
                authService.updateUser({ ...user, events: newEvents });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsGenerating(false);
        }
    };

    // --- SUB-COMPONENTS ---

    const BoardroomWidget = () => (
        <div className="flex flex-col h-full bg-[#0B0F19] rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
            {/* Header / Council Seats */}
            <div className="flex-none p-6 border-b border-white/10 bg-slate-900/50 backdrop-blur-md">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                            <BrainCircuit className="text-emerald-500" size={24}/> The Boardroom
                        </h3>
                        <p className="text-xs text-slate-400 mt-1">AI Strategic Council • <span className="text-emerald-400 animate-pulse">Session Active</span></p>
                    </div>
                    <button 
                        onClick={() => setBoardHistory([])} 
                        className="text-xs text-slate-500 hover:text-white transition-colors"
                    >
                        Clear Session
                    </button>
                </div>
                
                {/* Persona Cards */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { name: 'The CFO', alias: 'Marcus', color: 'text-rose-400', border: 'border-rose-500/30', bg: 'bg-rose-500/10' },
                        { name: 'The Visionary', alias: 'Elena', color: 'text-emerald-400', border: 'border-emerald-500/30', bg: 'bg-emerald-500/10' },
                        { name: 'The Strategist', alias: 'Dr. K', color: 'text-blue-400', border: 'border-blue-500/30', bg: 'bg-blue-500/10' }
                    ].map((persona) => {
                        const lastSpeaker = boardHistory.length > 0 ? boardHistory[boardHistory.length - 1].speaker : '';
                        const isSpeaking = lastSpeaker.includes(persona.alias) || lastSpeaker.includes(persona.name);
                        
                        return (
                            <div key={persona.name} className={`p-3 rounded-xl border ${persona.border} ${persona.bg} flex flex-col items-center text-center transition-all duration-500 ${isSpeaking ? 'ring-1 ring-white/20 scale-105 shadow-lg opacity-100' : 'opacity-60 scale-100 grayscale-[0.3]'}`}>
                                <div className={`w-10 h-10 rounded-full mb-2 flex items-center justify-center font-bold text-white ${persona.bg.replace('10', '50')} border border-white/10 shadow-inner`}>
                                    {persona.alias[0]}
                                </div>
                                <div className={`text-xs font-bold ${persona.color}`}>{persona.alias}</div>
                                <div className="text-[10px] text-white/50 uppercase tracking-wider">{persona.name}</div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gradient-to-b from-[#0B0F19] to-[#05080d]" ref={boardScrollRef}>
                {boardHistory.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                        <Bot size={64} className="mb-4 text-purple-500/50" />
                        <h3 className="text-xl font-bold text-white mb-2">Board is Assembled</h3>
                        <p className="max-w-sm text-slate-400">Present a dilemma, strategy, or tender opportunity. The board will debate its viability.</p>
                    </div>
                ) : (
                    boardHistory.map((turn, i) => {
                        const isUser = turn.speaker === 'You';
                        const speakerStyle = 
                            turn.speaker.includes('CFO') || turn.speaker.includes('Marcus') ? 'border-rose-500/30 bg-rose-900/10 text-rose-100' :
                            turn.speaker.includes('Visionary') || turn.speaker.includes('Elena') ? 'border-emerald-500/30 bg-emerald-900/10 text-emerald-100' :
                            turn.speaker.includes('Strategist') || turn.speaker.includes('Dr. K') ? 'border-blue-500/30 bg-blue-900/10 text-blue-100' :
                            'border-slate-700 bg-slate-800 text-slate-200';

                        return (
                            <div key={i} className={`flex ${isUser ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 fade-in duration-500`}>
                                <div className={`max-w-[85%] rounded-2xl p-5 border shadow-lg ${
                                    isUser 
                                    ? 'bg-purple-600/20 border-purple-500/30 text-purple-100 rounded-br-none' 
                                    : `${speakerStyle} rounded-bl-none`
                                }`}>
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">{turn.speaker}</span>
                                        {turn.sentiment && !isUser && (
                                            <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                                                turn.sentiment === 'Positive' ? 'bg-emerald-500/20 text-emerald-400' :
                                                turn.sentiment === 'Negative' ? 'bg-rose-500/20 text-rose-400' :
                                                'bg-blue-500/20 text-blue-400'
                                            }`}>{turn.sentiment}</span>
                                        )}
                                    </div>
                                    <p className="leading-relaxed text-sm font-medium">{turn.text}</p>
                                </div>
                            </div>
                        );
                    })
                )}
                {isBoardThinking && (
                    <div className="flex items-center gap-2 text-purple-400 text-xs font-bold animate-pulse p-4 justify-center">
                        <Loader2 size={14} className="animate-spin" /> The Board is deliberating...
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="flex-none p-6 bg-[#0B0F19] border-t border-white/10">
                <div className="relative">
                    <input 
                        value={boardTopic}
                        onChange={(e) => setBoardTopic(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleStartDebate()}
                        placeholder="E.g. Should I pivot my career to Data Science? OR Evaluate this tender opportunity..."
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-6 pr-14 text-white outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500/50 transition-all placeholder-slate-600 shadow-inner"
                        disabled={isBoardThinking}
                    />
                    <button 
                        onClick={handleStartDebate}
                        disabled={!boardTopic.trim() || isBoardThinking}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors disabled:opacity-50 shadow-lg"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    );

    // --- MAIN RENDER ---

    return (
        <div className="p-6 md:p-12 pb-32 min-h-screen bg-[#020604] flex flex-col">
            {/* Header */}
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 flex-none">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2 flex items-center gap-3">
                        <div className="p-2 bg-indigo-600 rounded-lg"><Users size={24} className="text-white"/></div>
                        {isRecruiter ? 'Talent CRM' : 'Inner Circle'}
                    </h1>
                    <p className="text-slate-400">
                        {isRecruiter ? 'Manage your hiring pipeline.' : 'AI-Simulated Boardroom & Strategic Network.'}
                    </p>
                </div>
                
                {/* Tabs */}
                <div className="bg-slate-900 p-1 rounded-xl flex gap-1 border border-slate-800 overflow-x-auto">
                    {isRecruiter ? (
                        ['Pipeline', 'Sourced', 'Archived'].map((tab) => (
                            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}>{tab}</button>
                        ))
                    ) : (
                        ['Boardroom', 'Rolodex', 'Events'].map((tab) => (
                            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab ? 'bg-slate-800 text-white shadow-sm border border-slate-700' : 'text-slate-500 hover:text-slate-300'}`}>{tab}</button>
                        ))
                    )}
                </div>
            </div>

            {/* --- RECRUITER PIPELINE VIEW --- */}
            {isRecruiter && activeTab === 'Pipeline' && (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {['Sourced', 'Screening', 'Interview', 'Offer'].map(stage => (
                            <div key={stage} className="bg-slate-900/50 rounded-2xl border border-slate-800 p-4 h-full min-h-[500px]">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-slate-300 uppercase text-xs tracking-wider">{stage}</h3>
                                    <span className="bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full text-xs font-bold">
                                        0
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    <div className="text-center py-8 text-slate-500 text-xs">No active candidates.</div>
                                    <button className="w-full py-3 border border-dashed border-slate-700 rounded-xl text-slate-500 text-xs font-bold hover:bg-slate-800 hover:text-white transition-colors">+ Add Candidate</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- STANDARD TALENT CONTENT SWITCHER --- */}
            {!isRecruiter && (
                <div className="flex-1 min-h-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    
                    {/* BOARDROOM TAB */}
                    {activeTab === 'Boardroom' && (
                        <div className="h-[calc(100dvh-220px)] min-h-[500px]">
                            <BoardroomWidget />
                        </div>
                    )}

                    {/* MENTORS TAB */}
                    {activeTab === 'Rolodex' && (
                        <div className="space-y-6 h-full overflow-y-auto custom-scrollbar">
                            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex gap-4">
                                <div className="flex-1 relative">
                                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                                    <input type="text" placeholder="Search by role, company, or skill..." className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-white" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                </div>
                                <button className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-white"><Filter size={20} /></button>
                            </div>
                            
                            {mentors.length === 0 ? (
                                <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed">
                                    <div className="w-20 h-20 bg-indigo-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Users size={40} className="text-indigo-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">No Mentors Connected</h3>
                                    <p className="text-slate-400 mb-8 max-w-sm mx-auto">Build your inner circle. AI will find professionals in <strong>{user.industry}</strong> that match your career stage.</p>
                                    <button 
                                        onClick={() => handleGenerateNetwork('mentors')}
                                        disabled={isGenerating}
                                        className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 transition-colors shadow-lg flex items-center gap-2 mx-auto"
                                    >
                                        {isGenerating ? <Loader2 className="animate-spin"/> : <RefreshCw size={18}/>}
                                        {isGenerating ? 'Scouting Talent...' : 'Find Strategic Mentors'}
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {mentors.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.role.toLowerCase().includes(searchQuery.toLowerCase())).map(m => (
                                        <div key={m.id} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 hover:border-indigo-500 transition-colors group relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity"><Sparkles size={16} className="text-amber-400" /></div>
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className={`w-14 h-14 rounded-full flex items-center justify-center font-bold text-lg ${m.isConnected ? 'bg-emerald-900 text-emerald-400' : 'bg-slate-800 text-slate-400'}`}>{m.name.charAt(0)}</div>
                                                <div>
                                                    <h3 className="font-bold text-white text-lg">{m.name}</h3>
                                                    <p className="text-sm text-slate-400">{m.role}</p>
                                                    <p className="text-xs text-slate-500">{m.company}</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-2 mb-6">
                                                <span className="px-2 py-1 bg-slate-800 rounded text-xs text-slate-400 border border-slate-700">{m.expertise}</span>
                                                {m.match > 85 && <span className="px-2 py-1 bg-indigo-900/30 rounded text-xs text-indigo-400 border border-indigo-500/30">High Match</span>}
                                            </div>
                                            <button onClick={() => handleConnect(m.id)} className={`w-full py-3 rounded-xl font-bold transition-colors ${m.isConnected ? 'bg-slate-800 text-white' : 'bg-indigo-600 text-white hover:bg-indigo-500'}`}>{m.isConnected ? 'Message' : 'Smart Connect (AI Intro)'}</button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* EVENTS TAB */}
                    {activeTab === 'Events' && (
                        <div className="h-full overflow-y-auto custom-scrollbar pb-20">
                            {events.length === 0 ? (
                                <div className="text-center py-20 bg-slate-900/50 rounded-3xl border border-slate-800 border-dashed">
                                    <div className="w-20 h-20 bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Calendar size={40} className="text-emerald-400" />
                                    </div>
                                    <h3 className="text-xl font-bold text-white mb-2">No Upcoming Events</h3>
                                    <p className="text-slate-400 mb-8 max-w-sm mx-auto">Find relevant conferences, webinars, and meetups for <strong>{user.industry}</strong>.</p>
                                    <button 
                                        onClick={() => handleGenerateNetwork('events')}
                                        disabled={isGenerating}
                                        className="px-8 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 transition-colors shadow-lg flex items-center gap-2 mx-auto"
                                    >
                                        {isGenerating ? <Loader2 className="animate-spin"/> : <RefreshCw size={18}/>}
                                        {isGenerating ? 'Scanning Calendar...' : 'Discover Events'}
                                    </button>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    {events.map(e => (
                                        <div key={e.id} className="group bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 hover:border-slate-600 transition-all cursor-pointer">
                                            <div className={`h-40 ${e.image || 'bg-slate-800'} relative p-6 flex flex-col justify-end`}>
                                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors"></div>
                                                <div className="relative z-10">
                                                    <span className="bg-black/40 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded border border-white/10 uppercase mb-2 inline-block">{e.type}</span>
                                                    <h3 className="text-xl font-bold text-white leading-tight">{e.title}</h3>
                                                </div>
                                            </div>
                                            <div className="p-6">
                                                <div className="flex items-center gap-4 text-sm text-slate-400 mb-4">
                                                    <span className="flex items-center gap-1"><Calendar size={14}/> {e.date}</span>
                                                    <span className="flex items-center gap-1"><Clock size={14}/> {e.time}</span>
                                                </div>
                                                <p className="text-sm text-slate-500 mb-6">{e.desc}</p>
                                                <button onClick={() => handleRSVP(e.id)} className={`w-full py-3 rounded-xl font-bold transition-all ${e.isAttending ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-white text-slate-900 hover:bg-slate-200'}`}>{e.isAttending ? 'Registered' : 'Generate Prep Brief & RSVP'}</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
