
import React, { useState, useEffect } from 'react';
import { Bell, Mail, MessageSquare, Smartphone, Shield, LogOut, Moon, Sun, Target, Plus, X as XIcon, Sparkles, CreditCard, Download, Check, User, Briefcase, Truck, Rocket, GraduationCap, HardHat, Share2 } from 'lucide-react';
import { UserProfile, NotificationSettings } from '../types';

interface SettingsProps {
    user: UserProfile;
    onUpdateUser: (user: UserProfile) => void;
    onLogout: () => void;
    isDarkMode: boolean;
    toggleTheme: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ user, onUpdateUser, onLogout, isDarkMode, toggleTheme }) => {
    const [notifs, setNotifs] = useState<NotificationSettings>({
        email: true,
        sms: false,
        whatsapp: true,
        push: true,
        frequency: 'Instant'
    });
    
    const [newKeyword, setNewKeyword] = useState('');
    const [saved, setSaved] = useState(false);
    
    // PWA Install Prompt State
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        if (window.matchMedia('(display-mode: standalone)').matches) {
            setIsInstalled(true);
        }

        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = () => {
        if (!deferredPrompt) {
            // If no prompt stored, it might be installed or on iOS/unsupported
            if (isInstalled) {
                alert("CareerOS is already installed on this device.");
            } else {
                alert("To install CareerOS:\n\niOS: Tap 'Share' -> 'Add to Home Screen'\nAndroid: Tap 'Menu' -> 'Install App'");
            }
            return;
        }
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult: any) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
                setIsInstalled(true);
            }
            setDeferredPrompt(null);
        });
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'CareerOS',
                    text: 'Join me on CareerOS: The Operating System for Human Potential.',
                    url: window.location.href,
                });
            } catch (error) {
                console.log('Error sharing:', error);
            }
        } else {
            alert('Share URL copied to clipboard!');
            navigator.clipboard.writeText(window.location.href);
        }
    };

    // --- Dynamic Persona Logic ---
    const getLabelForCompany = () => {
        switch (user.primaryFocus) {
            case 'Professional': return 'Current Job Title';
            case 'Recruiter': return 'Agency Name';
            case 'AssetOwner': return 'Fleet / Holding Company';
            case 'GrowthStartup': return 'Startup Name';
            case 'Contractor': return 'Contractor / SME Name';
            default: return 'Company Name';
        }
    };

    const getLabelForBio = () => {
        switch (user.primaryFocus) {
            case 'Professional': return 'Professional Summary & Career Goals';
            case 'Recruiter': return 'Agency Focus & Hiring Needs';
            default: return 'Business Description & Capabilities';
        }
    };

    const getPlaceholderForBio = () => {
        switch (user.primaryFocus) {
            case 'Professional': 
                return "E.g. Senior Civil Engineer with 10 years experience managing large-scale road projects. Seeking contract roles in SADC region. Expert in FIDIC contracts.";
            case 'Recruiter':
                return "E.g. We are a specialist recruitment agency focusing on executive placement in the Mining and Energy sectors across Africa.";
            case 'AssetOwner':
                return "E.g. Heavy equipment rental specialist with a fleet of 20+ Yellow Machines including Graders, Excavators and Tippers based in Harare.";
            case 'GrowthStartup':
                return "E.g. Fintech startup building payment rails for the informal sector. Currently raising Seed round. Pre-revenue but high traction.";
            case 'Contractor':
                return "E.g. We are a Grade A Construction company specializing in civil works, road maintenance, and building construction. PRAZ registered.";
            default: 
                return "E.g. We are a construction firm specialized in road maintenance and tarring. We have capacity for projects up to $2M.";
        }
    };

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

    // --- Handlers ---

    const handleAddKeyword = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newKeyword.trim()) {
            const currentKeywords = user.keywords || [];
            if (!currentKeywords.includes(newKeyword.trim())) {
                onUpdateUser({
                    ...user,
                    keywords: [...currentKeywords, newKeyword.trim()]
                });
            }
            setNewKeyword('');
        }
    };

    const removeKeyword = (keywordToRemove: string) => {
        const currentKeywords = user.keywords || [];
        onUpdateUser({
            ...user,
            keywords: currentKeywords.filter(k => k !== keywordToRemove)
        });
    };

    const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onUpdateUser({ ...user, businessDescription: e.target.value });
    };
    
    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdateUser({ ...user, phoneNumber: e.target.value });
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdateUser({ ...user, name: e.target.value });
    };

    const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdateUser({ ...user, companyName: e.target.value });
    };

    const handleIndustryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdateUser({ ...user, industry: e.target.value });
    };

    const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onUpdateUser({ ...user, email: e.target.value });
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

    return (
        <div className="p-6 md:p-10 max-w-4xl mx-auto pb-24">
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8 tracking-tight">Settings</h1>

            {/* Install App Banner */}
            {!isInstalled && (
            <div className="mb-8 p-4 bg-gradient-to-r from-emerald-900 to-emerald-950 rounded-2xl border border-emerald-500/20 flex flex-col sm:flex-row items-center justify-between shadow-lg gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-400">
                        <Smartphone size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">Download Mobile App</h3>
                        <p className="text-xs text-emerald-200/70">Install CareerOS on your home screen for instant access.</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={handleShare}
                        className="px-4 py-2 bg-emerald-900/50 text-emerald-300 rounded-lg text-xs font-bold hover:bg-emerald-900 transition-colors flex items-center gap-2 border border-emerald-500/30"
                    >
                        <Share2 size={14} /> Share
                    </button>
                    <button 
                        onClick={handleInstallClick}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 transition-colors flex items-center gap-2"
                    >
                        <Download size={14} /> Install Now
                    </button>
                </div>
            </div>
            )}

            <div className="space-y-6">
                {/* Profile Section */}
                <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
                    <div className="flex items-center space-x-4 mb-8">
                        <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center border border-slate-200 dark:border-slate-700">
                            {getAvatarIcon()}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 dark:text-white">{user.name}</h2>
                            <p className="text-slate-500 dark:text-slate-400">{user.companyName} • {user.industry}</p>
                            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded mt-1 inline-block">
                                {user.primaryFocus} Account
                            </span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">User Name</label>
                            <input 
                                type="text" 
                                value={user.name} 
                                onChange={handleNameChange}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" 
                            />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">{getLabelForCompany()}</label>
                            <input 
                                type="text" 
                                value={user.companyName} 
                                onChange={handleCompanyChange}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" 
                            />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Primary Email</label>
                            <input 
                                type="email" 
                                value={user.email || ''} 
                                onChange={handleEmailChange} 
                                placeholder="name@work.com"
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" 
                            />
                         </div>
                         <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Industry Sector</label>
                            <input 
                                type="text" 
                                value={user.industry} 
                                onChange={handleIndustryChange}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-none text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" 
                            />
                         </div>
                    </div>
                </section>

                {/* AI Personalization Section */}
                <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                        <Target className="mr-2 text-indigo-500" size={20} />
                        AI Tuning
                    </h3>
                    
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                {getLabelForBio()}
                            </label>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                Describe exactly what you do. The AI uses this to calculate match scores and generate strategic advice.
                            </p>
                            <textarea 
                                value={user.businessDescription || ''}
                                onChange={handleDescriptionChange}
                                placeholder={getPlaceholderForBio()}
                                className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-transparent focus:border-blue-500 focus:bg-white dark:focus:bg-slate-800 focus:ring-4 focus:ring-blue-500/10 transition-all outline-none text-slate-900 dark:text-white h-32 resize-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                                Filtering Keywords
                            </label>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                                Press Enter to add tags. These are used to highlight opportunities in the feed.
                            </p>
                            <div className="flex flex-wrap gap-2 mb-3">
                                {user.keywords?.map((keyword, index) => (
                                    <span key={index} className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                                        {keyword}
                                        <button onClick={() => removeKeyword(keyword)} className="ml-2 hover:text-indigo-900 dark:hover:text-white">
                                            <XIcon size={14} />
                                        </button>
                                    </span>
                                ))}
                                <input 
                                    type="text"
                                    value={newKeyword}
                                    onChange={(e) => setNewKeyword(e.target.value)}
                                    onKeyDown={handleAddKeyword}
                                    placeholder="+ Add keyword"
                                    className="px-3 py-1.5 rounded-lg text-sm bg-transparent border border-dashed border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 outline-none focus:border-indigo-500 focus:text-indigo-600 dark:focus:text-indigo-400 w-32"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Notification Section */}
                <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                        <Bell className="mr-2" size={20} />
                        Notification Channels
                    </h3>
                    
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Mobile Number for Alerts</label>
                        <div className="relative">
                            <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="tel" 
                                value={user.phoneNumber || ''}
                                onChange={handlePhoneChange}
                                placeholder="+263 7..." 
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all text-slate-900 dark:text-white" 
                            />
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">Required for WhatsApp and SMS alerts.</p>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-blue-400 rounded-lg"><Mail size={20}/></div>
                                <div>
                                    <div className="font-medium text-slate-900 dark:text-white">Email Digest</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">Receive daily summaries of new bids</div>
                                </div>
                            </div>
                            <Toggle active={notifs.email} onToggle={() => setNotifs({...notifs, email: !notifs.email})} />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-green-50 dark:bg-slate-800 text-green-600 dark:text-green-400 rounded-lg"><MessageSquare size={20}/></div>
                                <div>
                                    <div className="font-medium text-slate-900 dark:text-white">WhatsApp Alerts</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">Instant alerts for high-match opportunities</div>
                                </div>
                            </div>
                            <Toggle active={notifs.whatsapp} onToggle={() => setNotifs({...notifs, whatsapp: !notifs.whatsapp})} />
                        </div>

                         <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="p-2 bg-purple-50 dark:bg-slate-800 text-purple-600 dark:text-purple-400 rounded-lg"><Smartphone size={20}/></div>
                                <div>
                                    <div className="font-medium text-slate-900 dark:text-white">SMS Notifications</div>
                                    <div className="text-sm text-slate-500 dark:text-slate-400">Urgent deadline reminders</div>
                                </div>
                            </div>
                            <Toggle active={notifs.sms} onToggle={() => setNotifs({...notifs, sms: !notifs.sms})} />
                        </div>
                    </div>
                </section>
                
                {/* Billing History (Mock) */}
                <section className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm transition-colors duration-300">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center">
                        <CreditCard className="mr-2" size={20} />
                        Billing History
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="text-xs text-slate-500 uppercase bg-slate-50 dark:bg-slate-800/50 rounded-lg">
                                <tr>
                                    <th className="px-4 py-3 rounded-l-lg">Date</th>
                                    <th className="px-4 py-3">Amount</th>
                                    <th className="px-4 py-3">Method</th>
                                    <th className="px-4 py-3">Status</th>
                                    <th className="px-4 py-3 rounded-r-lg">Invoice</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm text-slate-600 dark:text-slate-300">
                                <tr>
                                    <td className="px-4 py-3">Oct 1, 2024</td>
                                    <td className="px-4 py-3">$30.00</td>
                                    <td className="px-4 py-3">Ecocash</td>
                                    <td className="px-4 py-3"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">PAID</span></td>
                                    <td className="px-4 py-3"><button className="text-blue-500 hover:text-blue-600"><Download size={16} /></button></td>
                                </tr>
                                 <tr>
                                    <td className="px-4 py-3">Sep 1, 2024</td>
                                    <td className="px-4 py-3">$30.00</td>
                                    <td className="px-4 py-3">Innbucks</td>
                                    <td className="px-4 py-3"><span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold">PAID</span></td>
                                    <td className="px-4 py-3"><button className="text-blue-500 hover:text-blue-600"><Download size={16} /></button></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <div className="flex justify-between items-center pt-6">
                     <button 
                        onClick={onLogout}
                        className="px-6 py-3 font-medium rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors flex items-center gap-2 text-sm"
                     >
                        <LogOut size={18} /> Sign Out
                     </button>

                     <button 
                        onClick={handleSave}
                        disabled={saved}
                        className={`px-8 py-3 font-medium rounded-xl shadow-lg transition-all flex items-center gap-2 ${saved ? 'bg-green-600 text-white' : 'bg-blue-600 text-white hover:bg-blue-500 shadow-blue-500/20'}`}
                     >
                        {saved ? <Check size={18} /> : null}
                        {saved ? 'Saved Successfully' : 'Save Changes'}
                     </button>
                </div>
            </div>
        </div>
    );
};
