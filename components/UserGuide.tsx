
import React, { useState } from 'react';
import { UserProfile } from '../types';
import { X, ArrowRight, CheckCircle2, LayoutDashboard, Briefcase, Truck, Wallet, GraduationCap, ShieldCheck } from 'lucide-react';

interface UserGuideProps {
    user: UserProfile;
    onClose: () => void;
}

export const UserGuide: React.FC<UserGuideProps> = ({ user, onClose }) => {
    const [step, setStep] = useState(0);

    const getPersonaConfig = () => {
        switch (user.primaryFocus) {
            case 'Contractor':
                return {
                    title: 'Welcome to Business OS',
                    steps: [
                        { 
                            title: 'Your Command Center', 
                            desc: 'The Dashboard aggregates live tenders, cash flow, and strategy alerts.',
                            icon: LayoutDashboard,
                            color: 'bg-blue-600'
                        },
                        { 
                            title: 'Win Contracts', 
                            desc: 'Use the Proposal Builder to draft compliance-checked bids in minutes.', 
                            icon: ShieldCheck,
                            color: 'bg-indigo-600'
                        },
                        { 
                            title: 'Access Capital', 
                            desc: 'Once you win, use the Finance Engine to get project funding instantly.',
                            icon: Wallet,
                            color: 'bg-emerald-600'
                        }
                    ]
                };
            case 'Professional':
                return {
                    title: 'Welcome to Career OS',
                    steps: [
                        { 
                            title: 'Market Value Engine', 
                            desc: 'The Marketplace analyzes your CV and predicts your salary potential.',
                            icon: Briefcase,
                            color: 'bg-purple-600'
                        },
                        { 
                            title: 'Close Skill Gaps', 
                            desc: 'If you lack a skill for a job, the Leadership Academy provides instant certification.',
                            icon: GraduationCap,
                            color: 'bg-pink-600'
                        },
                        { 
                            title: 'My Tools: Income Wallet', 
                            desc: 'Track your freelance earnings, manage gig payments from the Marketplace, and monitor your market value growth.',
                            icon: Wallet,
                            color: 'bg-emerald-600'
                        }
                    ]
                };
            case 'AssetOwner':
                return {
                    title: 'Welcome to Fleet OS',
                    steps: [
                        { 
                            title: 'Asset Command', 
                            desc: 'Track every vehicle and machine. Know what is idle and losing money.',
                            icon: Truck,
                            color: 'bg-orange-600'
                        },
                        { 
                            title: 'Monetize Idle Gear', 
                            desc: 'One-click listing to the Marketplace when your equipment is sitting idle.',
                            icon: Wallet,
                            color: 'bg-emerald-600'
                        }
                    ]
                };
            default:
                return { title: 'Welcome to ProcureAI', steps: [] };
        }
    };

    const config = getPersonaConfig();
    const currentStep = config.steps[step];

    if (!currentStep) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 pointer-events-none">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm pointer-events-auto transition-opacity" onClick={onClose} />
            
            <div className="relative w-full sm:max-w-md bg-white dark:bg-slate-900 sm:rounded-3xl shadow-2xl overflow-hidden pointer-events-auto animate-in slide-in-from-bottom-10 duration-500">
                {/* Progress Bar */}
                <div className="h-1 bg-slate-100 dark:bg-slate-800 w-full flex">
                    {config.steps.map((_, i) => (
                        <div key={i} className={`h-full transition-all duration-300 ${i <= step ? 'bg-blue-600 w-full' : 'w-0'}`}></div>
                    ))}
                </div>

                <div className="p-8">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{config.title} • Step {step + 1}/{config.steps.length}</span>
                        <button onClick={onClose} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                            <X size={16} className="text-slate-400" />
                        </button>
                    </div>

                    <div className="flex flex-col items-center text-center mb-8">
                        <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-xl ${currentStep.color} text-white transition-all transform duration-500`}>
                            <currentStep.icon size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{currentStep.title}</h2>
                        <p className="text-slate-500 dark:text-slate-400 leading-relaxed">{currentStep.desc}</p>
                    </div>

                    <div className="flex gap-3">
                        <button 
                            onClick={onClose}
                            className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
                        >
                            Skip Tour
                        </button>
                        <button 
                            onClick={() => {
                                if (step < config.steps.length - 1) {
                                    setStep(step + 1);
                                } else {
                                    onClose();
                                }
                            }}
                            className="flex-[2] py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                        >
                            {step < config.steps.length - 1 ? (
                                <>Next <ArrowRight size={16} /></>
                            ) : (
                                <>Get Started <CheckCircle2 size={16} /></>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
