
import React, { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Smartphone, LogOut, Download, Check, User, Briefcase, Truck, Rocket, GraduationCap, HardHat, Share2, Database, AlertCircle, CloudCheck, Sparkles, Shield } from 'lucide-react';
import { UserProfile, NotificationSettings } from '../types';

interface SettingsProps {
    user: UserProfile;
    onUpdateUser: (user: UserProfile) => void;
    onLogout: () => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser, onLogout }) => {
    const [notifs, setNotifs] = useState<NotificationSettings>({
        email: true,
        sms: false,
        whatsapp: true,
        push: true,
        frequency: 'Instant'
    });
    
    const [newKeyword, setNewKeyword] = useState('');
    const [saved, setSaved] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        if (window.matchMedia('(display-mode: standalone)').matches) setIsInstalled(true);
    }, []);

    // ... (Keep existing helpers: getLabelForCompany, getAvatarIcon etc.)
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

    const Toggle = ({ active, onToggle }: { active: boolean, onToggle: () => void }) => (
        <button 
            onClick={onToggle}
            className={`w-12 h-7 rounded-full transition-colors duration-200 ease-in-out relative ${active ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'}`}
        >
            <span className={`absolute top-1 left-1 bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform duration-200 ${active ? 'translate-x-5' : 'translate-x-0'}`} />
        </button>
    );

    const handleAddKeyword = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newKeyword.trim()) {
            const currentKeywords = user.keywords || [];
            if (!currentKeywords.includes(newKeyword.trim())) {
                onUpdateUser({ ...user, keywords: [...currentKeywords, newKeyword.trim()] });
            }
            setNewKeyword('');
        }
    };

    const removeKeyword = (k: string) => {
        onUpdateUser({ ...user, keywords: (user.keywords || []).filter(item => item !== k) });
    };

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto pb-24">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 tracking-tight">Settings</h1>

            {/* DATA SYNC STATUS INDICATOR */}
            <div className="mb-8 p-4 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-500/10 rounded-lg text-emerald-500">
                        <Database size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-slate-900 dark:text-white text-sm">Data Storage</h4>
                        <p className="text-xs text-slate-500">Synced to CareerOS Cloud (Firebase)</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                    <Check size={14} /> Cloud Active
                </div>
            </div>

            {/* App Install Banner */}
            {!isInstalled && (
            <div className="mb-8 p-4 bg-gradient-to-r from-emerald-900 to-emerald-950 rounded-2xl border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between shadow-lg gap-4">
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

            <div className="space-y-6">
                {/* Profile Section */}
                <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
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

                <div className="flex justify-between items-center pt-6">
                     <button onClick={onLogout} className="px-6 py-3 font-medium rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center gap-2 text-sm"><LogOut size={18} /> Sign Out</button>
                     <button onClick={handleSave} disabled={saved} className={`px-8 py-3 font-medium rounded-xl shadow-lg transition-all flex items-center gap-2 ${saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/20'}`}>{saved ? <Check size={18} /> : null}{saved ? 'Saved Successfully' : 'Save Changes'}</button>
                </div>
            </div>
        </div>
    );
};
