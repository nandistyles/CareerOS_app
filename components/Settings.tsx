
import React, { useState, useEffect, useRef } from 'react';
import { Bell, Mail, MessageSquare, Smartphone, LogOut, Download, Check, User, Briefcase, Truck, Rocket, GraduationCap, HardHat, Share2, Database, AlertCircle, CloudCheck, Sparkles, Shield, FileText, UploadCloud, File, Trash2, Copy, History, ChevronDown, ChevronUp, Bot, Send, BrainCircuit, RefreshCw, Zap } from 'lucide-react';
import { UserProfile, NotificationSettings } from '../types';
import { runProfileDiscovery } from '../services/geminiService';

interface SettingsProps {
    user: UserProfile;
    onUpdateUser: (user: UserProfile) => void;
    onLogout: () => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser, onLogout }) => {
    const [activeTab, setActiveTab] = useState<'General' | 'Documents' | 'Discovery'>('General');
    const [notifs, setNotifs] = useState<NotificationSettings>({
        email: true,
        sms: false,
        whatsapp: true,
        push: true,
        frequency: 'Instant'
    });
    
    const [saved, setSaved] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);
    const [expandedResumeId, setExpandedResumeId] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Discovery State
    const [discoveryChat, setDiscoveryChat] = useState<{role: 'user'|'ai', text: string}[]>([]);
    const [discoveryInput, setDiscoveryInput] = useState('');
    const [isDiscovering, setIsDiscovering] = useState(false);
    const discoveryScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (window.matchMedia('(display-mode: standalone)').matches) setIsInstalled(true);
    }, []);

    useEffect(() => {
        if (discoveryScrollRef.current) {
            discoveryScrollRef.current.scrollTop = discoveryScrollRef.current.scrollHeight;
        }
    }, [discoveryChat]);

    const getAvatarIcon = () => {
        switch (user.primaryFocus) {
            case 'Professional': return <GraduationCap size={32} className="text-purple-500" />;
            case 'AssetOwner': return <Truck size={32} className="text-orange-500" />;
            case 'GrowthStartup': return <Rocket size={32} className="text-emerald-500" />;
            case 'Recruiter': return <User size={32} className="text-indigo-500" />;
            case 'Contractor': return <HardHat size={32} className="text-yellow-500" />;
            default: return <Briefcase size={32} className="text-blue-500" />;
        }
    };

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            // Simulate extracting text from the file for the Master CV
            // In a real app, this would use a backend PDF parser
            const simulatedText = `# ${user.name}\n\n[Content extracted from ${file.name}]\n\nProfessional Summary:\nExperienced professional in ${user.industry}...\n\nExperience:\n- Role at Company A\n- Role at Company B`;
            
            onUpdateUser({ ...user, resumeText: simulatedText });
            setSaved(true);
            setTimeout(() => setSaved(false), 2000);
        }
    };

    const deleteResumeVersion = (id: string) => {
        const updatedHistory = user.resumeHistory?.filter(r => r.id !== id) || [];
        onUpdateUser({ ...user, resumeHistory: updatedHistory });
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert("Resume content copied to clipboard");
    };

    // --- DISCOVERY LOGIC ---
    
    const startDiscovery = () => {
        setDiscoveryChat([
            { role: 'ai', text: "Hello! I'm your Career Archaeologist. I see your CV, but I know there's more to your story. \n\nTell me about a project you're proud of that ISN'T detailed in your resume yet." }
        ]);
    };

    const handleSendDiscovery = async () => {
        if (!discoveryInput.trim()) return;
        
        const newHistory = [...discoveryChat, { role: 'user' as const, text: discoveryInput }];
        setDiscoveryChat(newHistory);
        setDiscoveryInput('');
        setIsDiscovering(true);

        const result = await runProfileDiscovery(
            user.resumeText || '',
            discoveryChat,
            discoveryInput
        );

        if (result) {
            setDiscoveryChat(prev => [...prev, { role: 'ai', text: result.aiQuestion }]);
            
            // Extract and Update
            if (result.extractedSkills && result.extractedSkills.length > 0) {
                const currentKeywords = user.keywords || [];
                const uniqueNewSkills = result.extractedSkills.filter(s => !currentKeywords.includes(s));
                
                if (uniqueNewSkills.length > 0) {
                    onUpdateUser({
                        ...user,
                        keywords: [...currentKeywords, ...uniqueNewSkills],
                        resumeText: (user.resumeText || '') + `\n- [Discovered]: ${result.newContextParam}`
                    });
                }
            }
        } else {
            setDiscoveryChat(prev => [...prev, { role: 'ai', text: "I'm having trouble analyzing that. Could you rephrase?" }]);
        }
        setIsDiscovering(false);
    };

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto pb-24">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 tracking-tight">Profile & Comms</h1>

            {/* Tab Navigation */}
            <div className="flex flex-wrap gap-2 mb-8 bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl w-fit">
                <button 
                    onClick={() => setActiveTab('General')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'General' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    General Settings
                </button>
                <button 
                    onClick={() => setActiveTab('Documents')}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors ${activeTab === 'Documents' ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    CV & Documents
                </button>
                <button 
                    onClick={() => { setActiveTab('Discovery'); if(discoveryChat.length===0) startDiscovery(); }}
                    className={`px-6 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2 ${activeTab === 'Discovery' ? 'bg-white dark:bg-slate-800 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
                >
                    <BrainCircuit size={16}/> Career Discovery
                </button>
            </div>

            {activeTab === 'General' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                    {/* DATA SYNC STATUS */}
                    <div className="p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                                <Database size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Data Storage</h4>
                                <p className="text-xs text-slate-500">Synced to CareerOS Cloud</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                            <Check size={14} /> Cloud Active
                        </div>
                    </div>

                    {/* App Install Banner */}
                    {!isInstalled && (
                    <div className="p-4 bg-gradient-to-r from-emerald-900 to-emerald-950 rounded-2xl border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between shadow-lg gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                                <Smartphone size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-sm">Download Mobile App</h3>
                                <p className="text-xs text-emerald-200/70">Install CareerOS on your home screen.</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="px-4 py-2 bg-emerald-900/50 text-emerald-300 rounded-lg text-xs font-bold hover:bg-emerald-900 transition-colors flex items-center gap-2 border border-emerald-500/30"><Share2 size={14} /> Share</button>
                            <button onClick={() => alert("Tap Share -> Add to Home Screen")} className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 transition-colors flex items-center gap-2"><Download size={14} /> Install Now</button>
                        </div>
                    </div>
                    )}

                    {/* Profile Section */}
                    <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center space-x-4">
                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700">
                                    {getAvatarIcon()}
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
                                    <p className="text-slate-500 dark:text-slate-400">{user.email}</p>
                                    <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded mt-1 inline-block">
                                        {user.primaryFocus} Account
                                    </span>
                                </div>
                            </div>
                            {user.isSubscribed ? (
                                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-amber-500/10 text-amber-500 rounded-full border border-amber-500/20 text-xs font-bold uppercase tracking-widest">
                                    <Sparkles size={12} fill="currentColor" /> Executive Suite
                                </div>
                            ) : (
                                <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full text-xs font-bold uppercase tracking-widest border border-slate-200 dark:border-slate-700">
                                    Free Tier
                                </div>
                            )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                             <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Display Name</label>
                                <input type="text" value={user.name} onChange={(e) => onUpdateUser({...user, name: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Role / Title</label>
                                <input type="text" value={user.currentRole || ''} onChange={(e) => onUpdateUser({...user, currentRole: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                             </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Industry</label>
                                <input type="text" value={user.industry || ''} onChange={(e) => onUpdateUser({...user, industry: e.target.value})} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                             </div>
                        </div>
                    </section>
                </div>
            )}

            {activeTab === 'Documents' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
                    {/* Master CV Upload Section */}
                    <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                    <FileText size={20} className="text-blue-500"/> Master Base CV
                                </h2>
                                <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                                    This is your primary data source. The AI uses this to create tailored versions for every job you apply to.
                                </p>
                            </div>
                            <div className="relative">
                                <input 
                                    type="file" 
                                    ref={fileInputRef}
                                    className="hidden" 
                                    accept=".pdf,.docx,.txt"
                                    onChange={handleFileUpload}
                                />
                                <button 
                                    onClick={() => fileInputRef.current?.click()}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-2"
                                >
                                    <UploadCloud size={14} /> Upload New Master
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
                            <textarea 
                                className="w-full h-48 bg-transparent border-none outline-none text-slate-700 dark:text-slate-300 font-mono text-sm leading-relaxed resize-none"
                                value={user.resumeText || ''}
                                onChange={(e) => onUpdateUser({...user, resumeText: e.target.value})}
                                placeholder="# Your Name..."
                            />
                        </div>
                        <div className="flex justify-end mt-4">
                            <button onClick={handleSave} className="text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1">
                                {saved ? <Check size={14}/> : <Check size={14} className="opacity-0"/>}
                                {saved ? 'Saved' : 'Save Changes'}
                            </button>
                        </div>
                    </section>

                    {/* Tailored CV History */}
                    <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm">
                        <div className="flex items-center gap-2 mb-6">
                            <History size={20} className="text-purple-500"/>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Tailored CV History</h2>
                        </div>

                        {(!user.resumeHistory || user.resumeHistory.length === 0) ? (
                            <div className="text-center py-12 text-slate-500 text-sm">
                                <p>No tailored CVs yet.</p>
                                <p className="text-xs opacity-70 mt-1">Apply to jobs in the Marketplace to generate tailored versions automatically.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {user.resumeHistory.map((resume) => (
                                    <div key={resume.id} className="border border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50 dark:bg-slate-950 overflow-hidden">
                                        <div 
                                            className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors"
                                            onClick={() => setExpandedResumeId(expandedResumeId === resume.id ? null : resume.id)}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className="p-2 bg-purple-500/10 rounded-lg text-purple-500">
                                                    <FileText size={18} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-sm text-slate-900 dark:text-white">{resume.jobTitle}</h3>
                                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                                        <span>{resume.company}</span>
                                                        <span>•</span>
                                                        <span>{resume.date}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-400">
                                                {expandedResumeId === resume.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                            </div>
                                        </div>

                                        {expandedResumeId === resume.id && (
                                            <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                                                <div className="max-h-60 overflow-y-auto custom-scrollbar p-2 mb-4 bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800">
                                                    <pre className="text-xs font-mono text-slate-600 dark:text-slate-300 whitespace-pre-wrap">{resume.content}</pre>
                                                </div>
                                                <div className="flex justify-end gap-3">
                                                    <button 
                                                        onClick={() => copyToClipboard(resume.content)}
                                                        className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-2"
                                                    >
                                                        <Copy size={12}/> Copy Text
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteResumeVersion(resume.id)}
                                                        className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-500 text-xs font-bold hover:bg-red-500/20 flex items-center gap-2"
                                                    >
                                                        <Trash2 size={12}/> Delete
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </div>
            )}

            {activeTab === 'Discovery' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[600px] animate-in fade-in slide-in-from-bottom-2">
                    {/* CHAT INTERFACE */}
                    <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col overflow-hidden">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-600 dark:text-purple-400">
                                <Bot size={20} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-900 dark:text-white">Career Archaeologist</h3>
                                <p className="text-xs text-slate-500">Uncovering hidden value in your history.</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-[#0B0F19]" ref={discoveryScrollRef}>
                            {discoveryChat.map((msg, i) => (
                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                        msg.role === 'user' 
                                        ? 'bg-purple-600 text-white rounded-br-none' 
                                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-700'
                                    }`}>
                                        {msg.text}
                                    </div>
                                </div>
                            ))}
                            {isDiscovering && (
                                <div className="flex justify-start">
                                    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-bl-none border border-slate-200 dark:border-slate-700 flex items-center gap-2">
                                        <RefreshCw size={16} className="animate-spin text-purple-500" />
                                        <span className="text-xs text-slate-500">Extracting skills...</span>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                            <div className="relative">
                                <input 
                                    value={discoveryInput}
                                    onChange={(e) => setDiscoveryInput(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendDiscovery()}
                                    placeholder="I led a team of 5 developers to ship..."
                                    className="w-full pl-6 pr-12 py-4 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-sm outline-none focus:ring-2 focus:ring-purple-500/20 dark:text-white"
                                    disabled={isDiscovering}
                                />
                                <button 
                                    onClick={handleSendDiscovery}
                                    disabled={!discoveryInput.trim() || isDiscovering}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-purple-600 text-white rounded-lg hover:bg-purple-500 transition-colors disabled:opacity-50"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* LIVE UPDATES */}
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl p-6 flex flex-col">
                        <h3 className="font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                            <Zap size={18} className="text-amber-400" /> Discovered Assets
                        </h3>
                        
                        <div className="flex-1 overflow-y-auto">
                            <div className="mb-6">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Extracted Skills</h4>
                                <div className="flex flex-wrap gap-2">
                                    {user.keywords && user.keywords.length > 0 ? (
                                        user.keywords.map((skill, i) => (
                                            <span key={i} className="px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-300 rounded text-xs border border-purple-100 dark:border-purple-800/50">
                                                {skill}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-slate-400 text-xs italic">No skills extracted yet. Start chatting!</p>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Context Added</h4>
                                <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-xl border border-slate-100 dark:border-slate-800 h-40 overflow-y-auto">
                                    <p className="text-xs text-slate-600 dark:text-slate-400 font-mono whitespace-pre-wrap">
                                        {user.resumeText || "Profile empty."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Footer Actions */}
            <div className="flex justify-between items-center pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
                 <button onClick={onLogout} className="px-6 py-3 font-medium rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center gap-2 text-sm"><LogOut size={18} /> Sign Out</button>
                 {activeTab === 'General' && <button onClick={handleSave} disabled={saved} className={`px-8 py-3 font-medium rounded-xl shadow-lg transition-all flex items-center gap-2 ${saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/20'}`}>{saved ? <Check size={18} /> : null}{saved ? 'Saved Successfully' : 'Save Changes'}</button>}
            </div>
        </div>
    );
};
