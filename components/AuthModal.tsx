
import React, { useState, useEffect } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, User, X, ShieldCheck, Github, Chrome, KeyRound, CheckCircle2, AlertTriangle, Leaf, Compass } from 'lucide-react';
import { UserProfile } from '../types';

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (user: UserProfile) => void;
    initialMode?: 'login' | 'signup';
    targetPersona?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onLogin, initialMode = 'login', targetPersona }) => {
    const [mode, setMode] = useState<'login' | 'signup'>(initialMode);
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [lockedOut, setLockedOut] = useState(false);
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });
    const [error, setError] = useState('');

    useEffect(() => {
        setMode(initialMode);
        setFormData({ name: '', email: '', password: '' });
        setError('');
        setAttempts(0);
        setLockedOut(false);
    }, [initialMode, isOpen]);

    if (!isOpen) return null;

    const fillDemoCredentials = () => {
        setFormData({
            name: '',
            email: 'demo@careeros.com',
            password: 'DemoUser123!'
        });
        setError('');
    };

    const getPasswordStrength = (pass: string) => {
        let strength = 0;
        if (pass.length > 7) strength++;
        if (pass.match(/[a-z]+/)) strength++;
        if (pass.match(/[A-Z]+/)) strength++;
        if (pass.match(/[0-9]+/)) strength++;
        if (pass.match(/[$@#&!]+/)) strength++;
        return strength;
    }

    const handleSocialLogin = (provider: string) => {
        setIsLoading(true);
        setTimeout(() => {
            const socialUser: UserProfile = {
                name: `${provider} User`,
                email: `user@${provider.toLowerCase()}.com`,
                primaryFocus: (targetPersona as any) || 'Professional',
                keywords: ['Tech', 'Innovation'],
                isSubscribed: false,
                scaleScore: 600,
                marketValue: 3000,
                skillScore: 40,
                industry: 'Technology'
            };
            localStorage.setItem('careeros_token', `mock_token_${Date.now()}_${Math.random().toString(36).substr(2)}`);
            onLogin(socialUser);
        }, 1500);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (lockedOut) return;

        setError('');
        setIsLoading(true);

        if (!formData.email.includes('@') || !formData.email.includes('.')) {
            setError('Invalid email format.');
            setIsLoading(false);
            return;
        }
        
        if (mode === 'signup') {
            const strength = getPasswordStrength(formData.password);
            if (strength < 4) {
                setError('Weak password. Use 8+ chars, mixed case, numbers & symbols.');
                setIsLoading(false);
                return;
            }
        }

        setTimeout(() => {
            if (formData.password === 'wrong') {
                setIsLoading(false);
                setAttempts(prev => prev + 1);
                if (attempts >= 3) {
                    setLockedOut(true);
                    setError('Too many failed attempts. Try again in 5 minutes.');
                } else {
                    setError('Incorrect credentials.');
                }
                return;
            }

            setIsLoading(false);
            const token = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('careeros_token', token);

            if (mode === 'login' && formData.email === 'demo@careeros.com') {
                onLogin({
                    name: 'Michael Chitenderu',
                    email: 'demo@careeros.com',
                    industry: 'Tech & Strategy',
                    primaryFocus: 'Executive',
                    keywords: ['Strategy', 'Leadership', 'Product'],
                    scaleScore: 850,
                    marketValue: 5000,
                    companyName: 'TechCorp',
                    role: 'Director',
                    isSubscribed: true
                });
                return;
            }

            if (mode === 'login' && formData.email === 'admin@careeros.com') {
                onLogin({
                    name: 'System Admin',
                    email: 'admin@careeros.com',
                    industry: 'Internal',
                    primaryFocus: 'Admin',
                    keywords: ['Operations'],
                    isSubscribed: true
                });
                return;
            }

            const newUser: UserProfile = {
                name: mode === 'login' ? 'User' : formData.name,
                email: formData.email,
                primaryFocus: (targetPersona as any) || 'Professional', 
                keywords: [],
                isSubscribed: false,
                scaleScore: 500,
                marketValue: 2500,
                skillScore: 0
            };
            onLogin(newUser);
        }, 1500);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Dark Jungle Backdrop */}
            <div className="absolute inset-0 bg-[#010804]/90 backdrop-blur-xl transition-opacity" onClick={onClose} />
            
            {/* The "Clearing" Modal */}
            <div className="relative w-full max-w-md bg-[#0a1f16]/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border border-emerald-500/20 ring-1 ring-white/5">
                
                {/* Decorative Top Light */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-1 bg-emerald-500 rounded-b-full shadow-[0_0_20px_rgba(16,185,129,0.5)]"></div>

                {/* Header */}
                <div className="px-8 pt-10 pb-6 text-center relative z-10">
                    <div className="w-16 h-16 bg-gradient-to-b from-emerald-900 to-[#020604] rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.2)] transform rotate-45">
                        <div className="transform -rotate-45">
                            {mode === 'login' ? <Leaf size={28} className="text-emerald-400" /> : <Compass size={28} className="text-amber-400" />}
                        </div>
                    </div>
                    <h2 className="text-3xl font-serif font-bold text-white mb-2 tracking-wide">
                        {mode === 'login' ? 'Enter the Jungle' : 'Begin Expedition'}
                    </h2>
                    <p className="text-emerald-200/60 text-sm font-medium tracking-wide uppercase">
                        {targetPersona && mode === 'signup' 
                            ? `Preparing ${targetPersona} Gear...`
                            : (mode === 'login' ? 'Resume your journey.' : 'Claim your territory.')}
                    </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-8 pb-8 space-y-5 relative z-10">
                    {mode === 'signup' && (
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest ml-4">Codename (Name)</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-400 transition-colors" size={18} />
                                <input 
                                    type="text"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    className="w-full pl-12 pr-4 py-4 bg-[#010804]/50 border border-emerald-500/10 rounded-2xl outline-none focus:border-emerald-500/50 focus:bg-[#010804]/80 text-white placeholder-emerald-800/50 transition-all font-medium"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest ml-4">Signal (Email)</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-400 transition-colors" size={18} />
                            <input 
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                                className="w-full pl-12 pr-4 py-4 bg-[#010804]/50 border border-emerald-500/10 rounded-2xl outline-none focus:border-emerald-500/50 focus:bg-[#010804]/80 text-white placeholder-emerald-800/50 transition-all font-medium"
                                placeholder="name@work.com"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <div className="flex justify-between items-center px-4">
                            <label className="text-[10px] font-bold text-emerald-500/80 uppercase tracking-widest">Key (Password)</label>
                            {mode === 'login' && (
                                <button type="button" className="text-[10px] hover:text-amber-400 text-emerald-600 transition-colors font-bold uppercase tracking-wider">Lost Key?</button>
                            )}
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50 group-focus-within:text-emerald-400 transition-colors" size={18} />
                            <input 
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={e => setFormData({...formData, password: e.target.value})}
                                className="w-full pl-12 pr-12 py-4 bg-[#010804]/50 border border-emerald-500/10 rounded-2xl outline-none focus:border-emerald-500/50 focus:bg-[#010804]/80 text-white placeholder-emerald-800/50 transition-all font-medium font-mono"
                                placeholder="••••••••"
                                required
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-700 hover:text-emerald-400 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {mode === 'signup' && formData.password.length > 0 && (
                            <div className="flex gap-1 mt-2 px-1">
                                <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${getPasswordStrength(formData.password) > 1 ? 'bg-red-500 shadow-[0_0_10px_red]' : 'bg-emerald-950'}`}></div>
                                <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${getPasswordStrength(formData.password) > 2 ? 'bg-amber-500 shadow-[0_0_10px_orange]' : 'bg-emerald-950'}`}></div>
                                <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${getPasswordStrength(formData.password) > 3 ? 'bg-emerald-500 shadow-[0_0_10px_emerald]' : 'bg-emerald-950'}`}></div>
                                <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${getPasswordStrength(formData.password) > 4 ? 'bg-blue-500 shadow-[0_0_10px_blue]' : 'bg-emerald-950'}`}></div>
                            </div>
                        )}
                    </div>

                    {error && (
                        <div className="p-3 bg-red-950/50 border border-red-500/30 text-red-300 text-xs rounded-xl flex items-center gap-2 animate-in slide-in-from-top-1 font-bold">
                            <AlertTriangle size={14} /> {error}
                        </div>
                    )}

                    {/* THE GOLD BUTTON */}
                    <button 
                        type="submit"
                        disabled={isLoading || lockedOut}
                        className="w-full py-4 rounded-2xl font-bold text-black transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg, #fbbf24 0%, #d97706 100%)'
                        }}
                    >
                        {/* Shine effect */}
                        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-500 skew-y-12"></div>
                        
                        <div className="relative flex items-center gap-2 uppercase tracking-wider text-sm">
                            {isLoading ? <Loader2 className="animate-spin" /> : (lockedOut ? 'Path Blocked' : (mode === 'login' ? 'Resume Path' : 'Found Gold'))}
                            {!isLoading && !lockedOut && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
                        </div>
                    </button>

                    {/* Social Auth Mocks */}
                    <div className="relative py-4">
                        <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-emerald-500/10"></div></div>
                        <div className="relative flex justify-center text-[10px] font-bold uppercase tracking-widest"><span className="bg-[#0a1f16] px-2 text-emerald-500/50">Or use satellite uplink</span></div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            type="button" 
                            onClick={() => handleSocialLogin('Google')}
                            className="flex items-center justify-center gap-2 py-3 border border-emerald-500/10 rounded-xl hover:bg-emerald-500/10 transition-colors bg-[#010804]/30"
                        >
                            <Chrome size={18} className="text-white" /> <span className="text-xs font-bold text-emerald-100">Google</span>
                        </button>
                        <button 
                            type="button" 
                            onClick={() => handleSocialLogin('GitHub')}
                            className="flex items-center justify-center gap-2 py-3 border border-emerald-500/10 rounded-xl hover:bg-emerald-500/10 transition-colors bg-[#010804]/30"
                        >
                            <Github size={18} className="text-white" /> <span className="text-xs font-bold text-emerald-100">GitHub</span>
                        </button>
                    </div>
                </form>

                {/* Footer Switcher */}
                <div className="p-6 bg-[#010804]/60 text-center text-xs text-emerald-400/60 border-t border-emerald-500/10">
                    {mode === 'login' ? "New to the ecosystem? " : "Already established? "}
                    <button 
                        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                        className="font-bold text-amber-400 hover:text-amber-300 hover:underline uppercase tracking-wide ml-1"
                    >
                        {mode === 'login' ? 'Start Expedition' : 'Log In'}
                    </button>
                </div>

                {/* Demo Shortcut */}
                {mode === 'login' && (
                    <button 
                        onClick={fillDemoCredentials}
                        className="absolute top-6 left-6 text-[10px] font-bold text-emerald-700 hover:text-emerald-400 transition-colors flex items-center gap-1 uppercase tracking-widest"
                        title="Auto-fill demo credentials"
                    >
                        <KeyRound size={12} /> Auto-Nav
                    </button>
                )}

                <button onClick={onClose} className="absolute top-6 right-6 p-2 text-emerald-700 hover:text-emerald-400 transition-colors">
                    <X size={20} />
                </button>
            </div>
        </div>
    );
};
