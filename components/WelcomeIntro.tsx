
import React, { useState, useRef } from 'react';
import { Sparkles, ArrowRight, Briefcase, User, CheckCircle2, GraduationCap, Users, FileText, UploadCloud, Loader2, File, X, ShieldCheck, Building2, HardHat } from 'lucide-react';
import { UserProfile, ViewState } from '../types';
import { parseProfileFromText } from '../services/geminiService';

interface WelcomeProps {
    user: UserProfile;
    onUpdateUser: (user: UserProfile) => void;
    onContinue: (view?: ViewState) => void;
}

const INDUSTRIES = [
    "Technology & Software",
    "Finance & Banking",
    "Healthcare",
    "Engineering & Construction",
    "Logistics & Supply Chain",
    "Marketing & Media",
    "Education",
    "Mining & Resources",
    "Agriculture",
    "Retail & FMCG"
];

export const WelcomeIntro: React.FC<WelcomeProps> = ({ user, onUpdateUser, onContinue }) => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        name: user.name || '',
        role: '',
        email: '',
        password: '',
        industry: '',
        focus: (user.primaryFocus || '') as 'Executive' | 'Professional' | 'Student' | 'Recruiter' | 'Contractor' | '',
        resumeText: ''
    });
    const [customIndustry, setCustomIndustry] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [aiStatus, setAiStatus] = useState("Initializing Identity Architect...");
    const [uploadedFile, setUploadedFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleNext = async () => {
        if (step === 1 && !formData.name) return;
        if (step === 2 && !formData.focus) return;
        
        const finalIndustry = customIndustry.trim() || formData.industry;
        if (step === 3 && !finalIndustry) return;
        
        // Step 4 Validation & AI Extraction
        if (step === 4) {
            if (!formData.resumeText && !uploadedFile && formData.resumeText.length < 20) return; 
            
            setIsProcessing(true);
            setAiStatus("Parsing professional DNA...");
            
            try {
                // Call AI to extract structured data
                const extractedProfile = await parseProfileFromText(formData.resumeText, formData.focus || 'Professional');
                
                setAiStatus("Calibrating career trajectory...");
                await new Promise(resolve => setTimeout(resolve, 800)); // UX delay

                // Fallback / Merge Logic
                const updatedUser: UserProfile = {
                    ...user,
                    name: extractedProfile?.name || formData.name,
                    email: extractedProfile?.email || formData.email || user.email || '',
                    phoneNumber: extractedProfile?.phoneNumber || user.phoneNumber || '',
                    industry: extractedProfile?.industry || finalIndustry,
                    primaryFocus: formData.focus as any,
                    keywords: extractedProfile?.keywords || [finalIndustry, formData.focus === 'Recruiter' ? 'Hiring' : 'Career'], 
                    businessDescription: extractedProfile?.bio || (extractedProfile?.currentRole + " in " + finalIndustry),
                    companyName: extractedProfile?.companyName || (formData.focus === 'Recruiter' ? formData.name + ' Agency' : 'Freelance'),
                    currentRole: extractedProfile?.currentRole || 'Professional',
                    yearsExperience: extractedProfile?.yearsExperience || 2,
                    marketValue: extractedProfile?.marketValue || (formData.focus === 'Contractor' ? 50000 : 3500),
                    resumeText: formData.resumeText, // Save raw text for other tools
                    scaleScore: 550
                };

                onUpdateUser(updatedUser);
                setIsProcessing(false);
                setStep(5);
            } catch (e) {
                console.error("AI Extraction failed, using fallback", e);
                // Fallback to manual/simple
                setStep(5);
                setIsProcessing(false);
            }
        } else {
            setStep(prev => prev + 1);
        }
    };

    const handleIndustrySelect = (ind: string) => {
        setFormData({ ...formData, industry: ind });
        setCustomIndustry('');
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setUploadedFile(file);
            
            // Simulating text extraction from file for now (In a real app, we'd parse PDF/Docx here)
            // For demo purposes, we will populate resumeText with a placeholder that AI can try to read
            setIsProcessing(true);
            setAiStatus("Reading file content...");
            
            setTimeout(() => {
                const mockText = `[EXTRACTED CONTENT FROM ${file.name}]\n\nProfessional Summary: Experienced ${formData.industry} specialist with 5 years experience. \nSkills: Project Management, Strategy, leadership.\nRole: Senior Manager.`;
                setFormData(prev => ({ ...prev, resumeText: mockText }));
                setIsProcessing(false);
            }, 1000);
        }
    };

    const isRecruiter = formData.focus === 'Recruiter';
    const isContractor = formData.focus === 'Contractor';

    return (
        <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden font-sans">
            <div className="relative z-10 max-w-2xl w-full">
                
                {/* PROGRESS */}
                <div className="flex justify-center mb-12 gap-2">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`h-1 rounded-full transition-all duration-500 ${step >= i ? 'w-12 bg-indigo-500' : 'w-4 bg-slate-800'}`}></div>
                    ))}
                </div>

                {/* STEP 1: IDENTITY */}
                {step === 1 && (
                    <div className="animate-in fade-in slide-in-from-bottom-8 duration-700">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center tracking-tight">Architect your future.</h1>
                        <p className="text-slate-400 text-center mb-10 text-lg">Let's build your profile.</p>
                        
                        <div className="space-y-6">
                            <div className="bg-slate-900/50 border border-slate-800 p-1 rounded-2xl flex items-center transition-all focus-within:border-indigo-500">
                                <div className="p-4 text-slate-500"><User size={24} /></div>
                                <input 
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                    placeholder="Your Full Name"
                                    className="bg-transparent w-full p-4 outline-none text-lg placeholder-slate-600"
                                    autoFocus
                                />
                            </div>
                        </div>

                        <button 
                            onClick={handleNext}
                            disabled={!formData.name}
                            className="w-full mt-10 bg-white text-black font-bold py-4 rounded-xl text-lg hover:bg-slate-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            Next Step <ArrowRight size={20} />
                        </button>
                    </div>
                )}

                {/* STEP 2: PERSONA */}
                {step === 2 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-700">
                        <h1 className="text-3xl md:text-5xl font-bold mb-4 text-center">Choose your path.</h1>
                        <p className="text-slate-400 text-center mb-8 text-lg">We tailor CareerOS to your ambition.</p>
                        
                        <div className="space-y-3">
                            <button 
                                onClick={() => setFormData({...formData, focus: 'Executive'})}
                                className={`w-full p-5 rounded-3xl border text-left transition-all flex items-start gap-4 ${formData.focus === 'Executive' ? 'bg-indigo-600 border-indigo-500' : 'bg-slate-900/50 border-slate-800 hover:border-slate-600'}`}
                            >
                                <div className="p-3 rounded-2xl bg-white/10"><Briefcase size={24} className="text-white" /></div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Executive</h3>
                                    <p className="text-xs text-slate-300">Strategy tools, board roles, and high-level networking.</p>
                                </div>
                            </button>

                            <button 
                                onClick={() => setFormData({...formData, focus: 'Professional'})}
                                className={`w-full p-5 rounded-3xl border text-left transition-all flex items-start gap-4 ${formData.focus === 'Professional' ? 'bg-purple-600 border-purple-500' : 'bg-slate-900/50 border-slate-800 hover:border-slate-600'}`}
                            >
                                <div className="p-3 rounded-2xl bg-white/10"><User size={24} className="text-white" /></div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Professional</h3>
                                    <p className="text-xs text-slate-300">Find global remote work, upskill, and track income.</p>
                                </div>
                            </button>

                            <button 
                                onClick={() => setFormData({...formData, focus: 'Contractor'})}
                                className={`w-full p-5 rounded-3xl border text-left transition-all flex items-start gap-4 ${formData.focus === 'Contractor' ? 'bg-emerald-600 border-emerald-500' : 'bg-slate-900/50 border-slate-800 hover:border-slate-600'}`}
                            >
                                <div className="p-3 rounded-2xl bg-white/10"><HardHat size={24} className="text-white" /></div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Contractor / SME</h3>
                                    <p className="text-xs text-slate-300">Find government tenders, generate proposals, and secure funding.</p>
                                </div>
                            </button>

                            <button 
                                onClick={() => setFormData({...formData, focus: 'Recruiter'})}
                                className={`w-full p-5 rounded-3xl border text-left transition-all flex items-start gap-4 ${formData.focus === 'Recruiter' ? 'bg-blue-600 border-blue-500' : 'bg-slate-900/50 border-slate-800 hover:border-slate-600'}`}
                            >
                                <div className="p-3 rounded-2xl bg-white/10"><Users size={24} className="text-white" /></div>
                                <div>
                                    <h3 className="text-lg font-bold text-white">Recruiter / School</h3>
                                    <p className="text-xs text-slate-300">Hire top talent or manage an alumni network.</p>
                                </div>
                            </button>
                        </div>

                        <button onClick={handleNext} disabled={!formData.focus} className="w-full mt-6 bg-white text-black font-bold py-4 rounded-xl text-lg hover:bg-slate-200 transition-all disabled:opacity-50">Next Step</button>
                    </div>
                )}

                {/* STEP 3: INDUSTRY */}
                {step === 3 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-700">
                        <h1 className="text-4xl md:text-5xl font-bold mb-4 text-center">Target Sector?</h1>
                        <p className="text-slate-400 text-center mb-10 text-lg">
                            {isRecruiter ? "Which industry are you hiring for?" : isContractor ? "What sectors do you tender for?" : "We'll filter opportunities for this industry."}
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 max-h-[35vh] overflow-y-auto custom-scrollbar p-2">
                            {INDUSTRIES.map(ind => (
                                <button key={ind} onClick={() => handleIndustrySelect(ind)} className={`p-4 rounded-xl text-left border transition-all flex items-center justify-between ${formData.industry === ind ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900/50 border-slate-800 text-slate-300 hover:border-slate-600'}`}>
                                    <span className="font-medium">{ind}</span>
                                    {formData.industry === ind && <CheckCircle2 size={20} />}
                                </button>
                            ))}
                        </div>
                        <button onClick={handleNext} disabled={!formData.industry && !customIndustry} className="w-full bg-white text-black font-bold py-4 rounded-xl text-lg hover:bg-slate-200 transition-all disabled:opacity-50">Next Step</button>
                    </div>
                )}

                {/* STEP 4: RESUME / PROFILE INGESTION */}
                {isProcessing ? (
                    <div className="text-center animate-in fade-in duration-700">
                        <div className="w-24 h-24 relative mx-auto mb-8">
                            <div className="absolute inset-0 rounded-full border-4 border-indigo-500/30"></div>
                            <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center"><Sparkles className="text-indigo-400 animate-pulse" size={32} /></div>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Analyzing Profile...</h2>
                        <p className="text-indigo-400 font-mono text-sm animate-pulse">{aiStatus}</p>
                    </div>
                ) : step === 4 && (
                    <div className="animate-in fade-in slide-in-from-right-8 duration-700 w-full">
                        <div className="text-center mb-8">
                            <h1 className="text-3xl md:text-5xl font-bold mb-4">Data Ingestion.</h1>
                            <p className="text-slate-400 text-lg">
                                {isRecruiter 
                                    ? <span>Upload your <span className="text-indigo-400 font-bold">Company Profile</span> or typical <span className="text-indigo-400 font-bold">Job Description</span>.</span>
                                    : isContractor 
                                        ? <span>Upload your <span className="text-indigo-400 font-bold">Company Profile</span> or <span className="text-indigo-400 font-bold">Past Projects</span>.</span>
                                        : <span>Paste or upload your <span className="text-indigo-400 font-bold">CV/Resume</span>. Our AI will extract your identity.</span>
                                }
                            </p>
                        </div>
                        
                        {/* File Upload Zone */}
                        {!uploadedFile && !formData.resumeText && (
                            <div 
                                onClick={() => fileInputRef.current?.click()}
                                className="border-2 border-dashed border-slate-700 bg-slate-900/50 hover:bg-slate-900 hover:border-indigo-500 rounded-3xl p-10 text-center cursor-pointer transition-all mb-6 group"
                            >
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    onChange={handleFileUpload} 
                                    className="hidden" 
                                    accept=".pdf,.doc,.docx,.txt"
                                />
                                <div className="w-16 h-16 bg-slate-800 group-hover:bg-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400 group-hover:text-white transition-colors">
                                    {isRecruiter || isContractor ? <Building2 size={32} /> : <UploadCloud size={32} />}
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2">
                                    {isRecruiter ? "Upload Agency Profile" : isContractor ? "Upload Company Capability Statement" : "Click to Upload Resume"}
                                </h3>
                                <p className="text-slate-500">PDF, DOCX, or TXT (Max 5MB)</p>
                            </div>
                        )}

                        {/* Text Area (Fallback or Edit) */}
                        <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-4 mb-6 relative group focus-within:border-indigo-500 transition-colors">
                            {uploadedFile && (
                                <div className="absolute top-2 right-2 bg-indigo-900/50 text-indigo-300 text-xs px-2 py-1 rounded flex items-center gap-2">
                                    <File size={12}/> {uploadedFile.name} <button onClick={() => {setUploadedFile(null); setFormData(p => ({...p, resumeText: ''}))}}><X size={12}/></button>
                                </div>
                            )}
                            <div className="flex items-center gap-2 mb-2 text-slate-500 text-xs uppercase font-bold tracking-wider">
                                <FileText size={14} /> {isRecruiter || isContractor ? "Company Description / Projects" : "Source Text / Bio"}
                            </div>
                            <textarea 
                                value={formData.resumeText}
                                onChange={(e) => setFormData({...formData, resumeText: e.target.value})}
                                placeholder={isRecruiter ? "Paste your agency's bio or a sample job description here..." : isContractor ? "Paste your company capability statement here..." : "Or paste your CV text here for best results..."}
                                className="w-full h-48 bg-transparent border-none outline-none text-sm text-slate-300 font-mono resize-none placeholder-slate-600"
                            />
                        </div>

                        <button 
                            onClick={handleNext} 
                            disabled={!formData.resumeText || formData.resumeText.length < 20}
                            className="w-full bg-white text-black font-bold py-4 rounded-xl text-lg hover:bg-slate-200 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            <Sparkles size={20} /> Analyze & Initialize
                        </button>
                    </div>
                )}

                {/* STEP 5: READY */}
                {step === 5 && (
                    <div className="text-center animate-in fade-in zoom-in duration-700">
                        <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-8 border border-white/20 shadow-2xl shadow-indigo-500/20">
                            <ShieldCheck size={48} className="text-white" />
                        </div>
                        <h1 className="text-4xl font-bold mb-4">Profile Populated.</h1>
                        <p className="text-slate-400 text-lg max-w-lg mx-auto mb-10">
                            We've extracted your details and calibrated the engine for <span className="text-white font-bold">{formData.focus}</span> mode.
                        </p>
                        
                        <div className="flex flex-col gap-4">
                            <button 
                                onClick={() => onContinue(formData.focus === 'Recruiter' ? 'dashboard' : formData.focus === 'Contractor' ? 'dashboard' : 'toolkit')} 
                                className="w-full px-10 py-4 bg-white text-black font-bold rounded-full text-lg hover:scale-105 transition-transform shadow-xl flex items-center justify-center gap-2"
                            >
                                <Briefcase size={20} />
                                {formData.focus === 'Recruiter' ? 'Launch Recruiter Dashboard' : formData.focus === 'Contractor' ? 'Launch Procurement Dashboard' : 'Launch Career Toolkit (Optimize CV)'}
                            </button>
                            <button 
                                onClick={() => onContinue('dashboard')} 
                                className="text-slate-500 hover:text-white font-bold text-sm transition-colors"
                            >
                                Skip to Dashboard
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
