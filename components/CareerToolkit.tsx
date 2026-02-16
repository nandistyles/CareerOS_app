
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, ResumeAnalysis, RoleMatchAnalysis } from '../types';
import { FileText, Mic, PenTool, Download, RefreshCw, Check, AlertCircle, Play, User, Briefcase, ChevronRight, Star, Sparkles, Printer, LayoutTemplate, Palette, Globe, Phone, MapPin, Mail, Zap, Edit3, Type, Layers, Compass, Target, BadgeCheck, Heart, Shield } from 'lucide-react';
import { analyzeResume, improveResumeText, generateInterviewQuestion, generateCoverLetter, tailorResumeToJob, matchRolesToResume } from '../services/geminiService';

declare global {
    interface Window {
        html2pdf: any;
    }
}

interface CareerToolkitProps {
    user: UserProfile;
    onUpdateUser: (user: UserProfile) => void;
}

// --- Resume Parser Helper ---
const parseResume = (markdown: string) => {
    const lines = markdown.split('\n');
    const structure = {
        name: '',
        role: '',
        contact: [] as string[],
        summary: '',
        sections: [] as { title: string; content: { type: 'text' | 'bullet' | 'sub'; text: string }[] }[]
    };

    let currentSection: { title: string; content: any[] } | null = null;
    let isHeader = true; // Flag to track if we are in the top header section

    lines.forEach(line => {
        const trimmed = line.trim();
        if (!trimmed) return;

        if (trimmed.startsWith('# ')) {
            structure.name = trimmed.replace(/^#\s+/, '');
        } else if (trimmed.startsWith('## ')) {
            isHeader = false; // We hit the first section, header is done
            if (currentSection) structure.sections.push(currentSection);
            currentSection = { title: trimmed.replace(/^##\s+/, ''), content: [] };
        } else if (trimmed.startsWith('### ')) {
             // Explicit Subheader
             if(currentSection) {
                 currentSection.content.push({ type: 'sub', text: trimmed.replace(/^###\s+/, '') });
             }
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const text = trimmed.replace(/^[-*]\s+/, '');
            if (currentSection) {
                currentSection.content.push({ type: 'bullet', text });
            }
        } else {
            // Regular text processing
            if (isHeader) {
                // Heuristic detection for header info
                if (trimmed.includes('@') || trimmed.match(/(\+|00)[0-9]{1,3}[0-9 \-]{6,}/) || trimmed.toLowerCase().includes('.com')) {
                    structure.contact.push(trimmed);
                } else if (!structure.role && trimmed.length < 60 && !trimmed.includes('.')) {
                    // Assume short line without period is a Role Title if not already set
                    structure.role = trimmed;
                } else {
                    // Otherwise append to summary
                    structure.summary += (structure.summary ? ' ' : '') + trimmed;
                }
            } else {
                if (currentSection) {
                    // Heuristic: If line contains pipe | or looks like "Title - Company", treat as subheader
                    if (trimmed.includes('|') || (trimmed.includes(' - ') && trimmed.length < 80)) {
                         currentSection.content.push({ type: 'sub', text: trimmed });
                    } else {
                         currentSection.content.push({ type: 'text', text: trimmed });
                    }
                }
            }
        }
    });
    if (currentSection) structure.sections.push(currentSection);
    return structure;
};

export const CareerToolkit: React.FC<CareerToolkitProps> = ({ user, onUpdateUser }) => {
    const [activeTab, setActiveTab] = useState<'Resume' | 'Interview' | 'CoverLetter' | 'Pathfinder'>('Resume');
    const isContractor = ['Contractor', 'AssetOwner', 'GrowthStartup'].includes(user.primaryFocus || '');
    
    // Resume State
    const [resumeContent, setResumeContent] = useState(user.resumeText || '');
    const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(user.resumeAnalysis || null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isRewriting, setIsRewriting] = useState(false);
    const [previewMode, setPreviewMode] = useState(false);
    const [selectedTemplate, setSelectedTemplate] = useState<'modern' | 'minimal' | 'executive' | 'creative' | 'tech'>('modern');

    // Pathfinder State
    const [pathfinderResult, setPathfinderResult] = useState<RoleMatchAnalysis | null>(user.pathfinderAnalysis || null);
    const [isMatchingRoles, setIsMatchingRoles] = useState(false);

    // Interview State
    const [interviewRole, setInterviewRole] = useState(user.industry ? `${user.industry} ${isContractor ? 'Client' : 'Specialist'}` : 'Project Manager');
    const [interviewChat, setInterviewChat] = useState<{role: 'ai'|'user', text: string}[]>([]);
    const [userResponse, setUserResponse] = useState('');
    const [isInterviewerThinking, setIsInterviewerThinking] = useState(false);
    const [interviewStarted, setInterviewStarted] = useState(false);
    
    // Cover Letter State
    const [jobDesc, setJobDesc] = useState('');
    const [generatedLetter, setGeneratedLetter] = useState('');
    const [isDrafting, setIsDrafting] = useState(false);

    const chatScrollRef = useRef<HTMLDivElement>(null);

    // Sync resume content if user profile updates
    useEffect(() => {
        if (user.resumeText && user.resumeText !== resumeContent) {
            setResumeContent(user.resumeText);
        }
        if (user.resumeAnalysis && !analysis) {
            setAnalysis(user.resumeAnalysis);
        }
        if (user.pathfinderAnalysis && !pathfinderResult) {
            setPathfinderResult(user.pathfinderAnalysis);
        }
        if (!user.resumeText && !resumeContent) {
            const template = '# ' + user.name + '\n' + (user.email || '') + ' | ' + (user.phoneNumber || '') + ' | ' + (user.location || '') + '\n\n## Professional Summary\nExperienced professional with a demonstrated history of working in the ' + (user.industry || 'industry') + '. Skilled in Strategic Planning, Management, and Leadership.\n\n## Experience\n### Role Title | Company Name | Date - Present\n- Achieved X resulting in Y improvement.\n- Led a team of Z people.\n\n## Education\n### Degree Name | University | Date';
            setResumeContent(template);
        }
    }, [user.resumeText, user.resumeAnalysis, user.pathfinderAnalysis, user.name]);

    useEffect(() => {
        if (chatScrollRef.current) {
            chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
    }, [interviewChat]);

    // --- HANDLERS ---

    const handleAnalyzeResume = async () => {
        if (!resumeContent.trim()) return;
        setIsAnalyzing(true);
        const result = await analyzeResume(resumeContent, user.industry || 'General');
        setAnalysis(result);
        if (result) {
            onUpdateUser({ ...user, resumeText: resumeContent, resumeAnalysis: result });
        }
        setIsAnalyzing(false);
    };

    const handleRunPathfinder = async () => {
        if (!resumeContent.trim()) {
            alert("Please add content to your CV first in the Resume Architect tab.");
            setActiveTab('Resume');
            return;
        }
        setIsMatchingRoles(true);
        const result = await matchRolesToResume(resumeContent);
        if (result) {
            setPathfinderResult(result);
            onUpdateUser({ ...user, pathfinderAnalysis: result });
        }
        setIsMatchingRoles(false);
    };

    const handleAutoImprove = async () => {
        setIsRewriting(true);
        const improved = await improveResumeText(resumeContent);
        setResumeContent(improved);
        setIsRewriting(false);
    };

    const handleDownloadResume = () => {
        const element = document.getElementById('resume-preview-container');
        if (!element || !window.html2pdf) {
            alert("PDF Generator is initializing. Please try again in a moment.");
            return;
        }
        
        const opt = {
            margin: 0,
            filename: `${user.name.replace(/\s+/g, '_')}_${isContractor ? 'Profile' : 'Resume'}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
        };

        window.html2pdf().set(opt).from(element).save();
    };

    const startInterview = async () => {
        setInterviewStarted(true);
        setIsInterviewerThinking(true);
        setInterviewChat([]);
        const q = await generateInterviewQuestion(interviewRole, user.industry || 'General');
        setInterviewChat([{ role: 'ai', text: q }]);
        setIsInterviewerThinking(false);
    };

    const handleSendAnswer = async () => {
        if (!userResponse.trim()) return;
        const newHistory = [...interviewChat, { role: 'user' as const, text: userResponse }];
        setInterviewChat(newHistory);
        setUserResponse('');
        setIsInterviewerThinking(true);
        const nextQ = await generateInterviewQuestion(interviewRole, user.industry || 'General', userResponse);
        setInterviewChat([...newHistory, { role: 'ai', text: nextQ }]);
        setIsInterviewerThinking(false);
    };

    const handleGenerateCoverLetter = async () => {
        if (!jobDesc.trim()) return;
        setIsDrafting(true);
        const letter = await generateCoverLetter({ 
            title: isContractor ? 'Tender/Project' : 'Target Role', 
            company: isContractor ? 'Procurement Authority' : 'Hiring Company', 
            description: jobDesc, 
            skills: [],
            id: 'temp', 
            type: 'Full-time', 
            budget: '', 
            postedDate: '', 
            location: '', 
            isExclusive: false, 
            isFeatured: false, 
            isVerified: false, 
            applicantsCount: 0 
        }, user.resumeAnalysis?.summary || user.businessDescription || '');
        setGeneratedLetter(letter);
        setIsDrafting(false);
    };

    // --- TEMPLATE RENDERER ---
    
    const ResumePreview = () => {
        const structure = parseResume(resumeContent);
        
        // Template Classes
        const templates = {
            modern: {
                container: "flex min-h-full font-sans bg-white text-slate-800",
                sidebar: "w-[32%] bg-slate-900 text-white p-6 pt-10 flex flex-col gap-6 shrink-0",
                main: "flex-1 p-8 pt-10 bg-white",
                name: "text-3xl font-bold uppercase tracking-tight mb-1 text-slate-900 leading-none",
                role: "text-slate-500 font-bold uppercase text-xs tracking-wider mb-6",
                sectionTitle: "text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 border-b border-slate-200 pb-1 mt-6",
                sidebarTitle: "text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-700 pb-1",
            },
            minimal: {
                container: "min-h-full bg-white text-slate-900 p-10 font-serif",
                sidebar: "hidden",
                main: "w-full mx-auto max-w-2xl",
                name: "text-4xl font-normal text-center mb-1 font-serif text-slate-900",
                role: "text-center text-xs uppercase tracking-[0.2em] text-slate-500 mb-6 font-sans",
                sectionTitle: "text-sm font-bold uppercase text-center border-b border-black pb-1 mb-4 mt-8 font-sans",
                sidebarTitle: "",
            },
            executive: {
                container: "min-h-full bg-white text-slate-900 p-10 font-sans",
                sidebar: "hidden",
                main: "w-full",
                name: "text-3xl font-bold uppercase text-blue-900 mb-1 border-l-8 border-blue-900 pl-4",
                role: "text-blue-700 font-medium pl-4 mb-6",
                sectionTitle: "bg-slate-100 text-blue-900 font-bold px-3 py-1 mb-4 mt-6 text-sm uppercase",
                sidebarTitle: "",
            },
            creative: {
                container: "min-h-full bg-white text-slate-800 font-sans",
                sidebar: "hidden",
                main: "w-full",
                name: "text-5xl font-extrabold text-white mb-2 leading-none",
                role: "text-white/80 font-medium text-lg",
                sectionTitle: "text-rose-500 font-bold text-xl mb-4 mt-8 flex items-center gap-2",
                sidebarTitle: "",
            },
            tech: {
                container: "min-h-full bg-slate-50 text-slate-800 p-8 font-mono text-xs",
                sidebar: "hidden",
                main: "w-full",
                name: "text-2xl font-bold text-indigo-600 mb-1",
                role: "text-slate-500 mb-6",
                sectionTitle: "text-indigo-500 font-bold mb-4 mt-8 border-b-2 border-dashed border-indigo-200 pb-1",
                sidebarTitle: "",
            }
        };

        const t = templates[selectedTemplate];

        // --- Render Helpers ---
        const RenderContact = () => (
            <div className={`space-y-1.5 text-xs ${selectedTemplate === 'modern' ? 'text-slate-300' : 'text-slate-600 flex flex-wrap justify-center gap-4'}`}>
                {structure.contact.map((c, i) => (
                    <div key={i} className="flex items-center gap-2 break-all">
                        {selectedTemplate === 'modern' ? (
                            <>
                                {c.includes('@') && <Mail size={10} className="shrink-0"/>}
                                {c.match(/[0-9]{6,}/) && <Phone size={10} className="shrink-0"/>}
                                {!c.includes('@') && !c.match(/[0-9]{6,}/) && <MapPin size={10} className="shrink-0"/>}
                            </>
                        ) : null}
                        <span>{c}</span>
                    </div>
                ))}
            </div>
        );

        return (
            <div id="resume-preview-container" className={`${t.container} shadow-xl relative overflow-hidden print:shadow-none`}>
                
                {/* --- CREATIVE HEADER (Special Case) --- */}
                {selectedTemplate === 'creative' && (
                    <div className="bg-slate-900 p-10 w-full mb-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500 rounded-full blur-[80px] opacity-50 mix-blend-screen pointer-events-none"></div>
                        <h1 className={t.name}>{structure.name}</h1>
                        <p className={t.role}>{structure.role || user.currentRole || (isContractor ? 'Business Profile' : 'Creative Professional')}</p>
                        <div className="flex flex-wrap gap-4 mt-6 text-white/70 text-sm font-medium">
                            {structure.contact.map((c, i) => <span key={i}>{c}</span>)}
                        </div>
                    </div>
                )}

                {/* --- SIDEBAR (Modern Only) --- */}
                {selectedTemplate === 'modern' && (
                    <div className={t.sidebar}>
                        <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center text-xl font-bold text-white mb-2 shrink-0">
                            {structure.name.substring(0, 2).toUpperCase()}
                        </div>
                        
                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-700 pb-1">Contact</h3>
                            <RenderContact />
                        </div>

                        <div>
                            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-3 border-b border-slate-700 pb-1">{isContractor ? 'Services' : 'Skills'}</h3>
                            <div className="flex flex-wrap gap-2">
                                {user.keywords?.map((k, i) => (
                                    <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-2 py-1 rounded">{k}</span>
                                )) || <span className="text-[10px] text-slate-500">Edit profile to add skills</span>}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- MAIN CONTENT --- */}
                <div className={t.main}>
                    {selectedTemplate !== 'creative' && (
                        <div className="mb-6">
                            <h1 className={t.name}>{structure.name}</h1>
                            <p className={t.role}>{structure.role || user.currentRole || (isContractor ? 'Business Profile' : 'Professional')}</p>
                            {selectedTemplate !== 'modern' && <RenderContact />}
                        </div>
                    )}

                    {/* Summary */}
                    {structure.summary && (
                        <div className="mb-6">
                            <h2 className={t.sectionTitle}>
                                {selectedTemplate === 'tech' ? '> ' : ''}{isContractor ? 'Company Overview' : 'Professional Profile'}
                            </h2>
                            <p className={`leading-relaxed opacity-90 ${selectedTemplate === 'tech' ? 'text-xs' : 'text-sm'}`}>
                                {structure.summary}
                            </p>
                        </div>
                    )}

                    {/* Dynamic Sections */}
                    {structure.sections.map((sec, i) => (
                        <div key={i} className="mb-6">
                            <h2 className={t.sectionTitle}>
                                {selectedTemplate === 'tech' ? '> ' : ''}{sec.title}
                            </h2>
                            <div className="space-y-3">
                                {sec.content.map((item, j) => {
                                    if (item.type === 'sub') {
                                        return (
                                            <div key={j} className="mt-3 first:mt-0">
                                                <h3 className={`font-bold ${selectedTemplate === 'tech' ? 'text-xs text-indigo-700' : 'text-sm'}`}>
                                                    {item.text.replace(/\|/g, ' • ')}
                                                </h3>
                                            </div>
                                        );
                                    } else if (item.type === 'bullet') {
                                        return (
                                            <div key={j} className={`flex items-start gap-2 ${selectedTemplate === 'tech' ? 'pl-0' : 'pl-2'}`}>
                                                <span className={`mt-1.5 w-1 h-1 bg-current rounded-full shrink-0 opacity-50`}></span>
                                                <span className={`opacity-90 leading-relaxed ${selectedTemplate === 'tech' ? 'text-xs' : 'text-sm'}`}>
                                                    {item.text}
                                                </span>
                                            </div>
                                        );
                                    } else {
                                        return (
                                            <p key={j} className={`leading-relaxed opacity-90 ${selectedTemplate === 'tech' ? 'text-xs' : 'text-sm'}`}>
                                                {item.text}
                                            </p>
                                        );
                                    }
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 md:p-12 pb-32 min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19]">
            <header className="mb-10 flex flex-col md:flex-row justify-between items-end gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/20">
                            <Briefcase className="text-white" size={28} />
                        </div>
                        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">
                            {isContractor ? 'Bid & Proposal Toolkit' : 'Career Toolkit'}
                        </h1>
                    </div>
                    <p className="text-lg text-slate-500 dark:text-slate-400">
                        {isContractor ? 'Generate winning bids and capability statements.' : 'AI-powered tools to accelerate your hiring potential.'}
                    </p>
                </div>
                
                <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto max-w-full">
                    <button onClick={() => setActiveTab('Resume')} className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'Resume' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                        <FileText size={16} /> {isContractor ? 'Capability Statement' : 'Resume Architect'}
                    </button>
                    <button onClick={() => setActiveTab('Pathfinder')} className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'Pathfinder' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                        <Compass size={16} /> Pathfinder
                    </button>
                    <button onClick={() => setActiveTab('Interview')} className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'Interview' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                        <Mic size={16} /> {isContractor ? 'Pitch Simulator' : 'Interview Sim'}
                    </button>
                    <button onClick={() => setActiveTab('CoverLetter')} className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'CoverLetter' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
                        <PenTool size={16} /> {isContractor ? 'Proposal Gen' : 'Cover Letter'}
                    </button>
                </div>
            </header>

            {/* === RESUME ARCHITECT (CAPABILITY STATEMENT) === */}
            {activeTab === 'Resume' && (
                <div className="flex flex-col gap-6 h-[calc(100vh-250px)] min-h-[600px]">
                    
                    {/* New User Nudge */}
                    {!analysis && resumeContent.length > 50 && (
                        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-4 text-white flex items-center justify-between shadow-lg animate-in slide-in-from-top-4">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white/20 rounded-full animate-pulse"><Zap size={20} /></div>
                                <div>
                                    <h4 className="font-bold text-sm">Data Ingested</h4>
                                    <p className="text-xs text-indigo-100">Your profile data is loaded. Run the AI Analysis to see your score.</p>
                                </div>
                            </div>
                            <button 
                                onClick={handleAnalyzeResume}
                                className="px-4 py-2 bg-white text-indigo-700 text-xs font-bold rounded-lg hover:bg-indigo-50 transition-colors"
                            >
                                Analyze Now
                            </button>
                        </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 flex-1">
                        {/* Editor Side */}
                        <div className={`flex flex-col bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden transition-all duration-300 ${previewMode ? 'lg:col-span-2' : ''}`}>
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
                                <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                                    <User size={18} /> {previewMode ? 'Live Preview' : 'Content Editor'}
                                </h3>
                                <div className="flex gap-2">
                                    {!previewMode && (
                                        <button 
                                            onClick={handleAutoImprove}
                                            disabled={isRewriting || !resumeContent}
                                            className="px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs font-bold rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-1"
                                        >
                                            {isRewriting ? <RefreshCw className="animate-spin" size={12}/> : <Sparkles size={12}/>}
                                            AI Enhance
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => setPreviewMode(!previewMode)}
                                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${previewMode ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}
                                    >
                                        {previewMode ? <Edit3 size={14}/> : <LayoutTemplate size={14}/>}
                                        {previewMode ? 'Back to Editor' : 'Preview & Download'}
                                    </button>
                                </div>
                            </div>
                            
                            {previewMode ? (
                                <div className="flex-1 bg-slate-200 dark:bg-slate-950 p-8 overflow-hidden flex flex-col items-center relative">
                                    {/* Template Toolbar */}
                                    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 p-2 rounded-full shadow-xl border border-slate-200 dark:border-slate-700 flex gap-2 z-20 overflow-x-auto max-w-[90vw]">
                                        {[
                                            { id: 'modern', label: 'Modern', icon: LayoutTemplate },
                                            { id: 'minimal', label: 'Minimal', icon: Type },
                                            { id: 'executive', label: 'Executive', icon: Briefcase },
                                            { id: 'creative', label: 'Creative', icon: Palette },
                                            { id: 'tech', label: 'Tech', icon: Layers },
                                        ].map((t) => (
                                            <button 
                                                key={t.id}
                                                onClick={() => setSelectedTemplate(t.id as any)}
                                                className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap ${selectedTemplate === t.id ? 'bg-indigo-600 text-white' : 'hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500'}`}
                                            >
                                                <t.icon size={14}/> {t.label}
                                            </button>
                                        ))}
                                    </div>

                                    {/* Preview Canvas (A4 Aspect Ratio) */}
                                    <div className="flex-1 w-full overflow-y-auto custom-scrollbar flex justify-center py-12">
                                        <div className="w-[210mm] min-h-[297mm] bg-white shadow-2xl origin-top transition-transform duration-300">
                                            <ResumePreview />
                                        </div>
                                    </div>

                                    {/* Floating Actions */}
                                    <div className="absolute bottom-8 right-8 flex gap-4">
                                        <button 
                                            onClick={handleDownloadResume}
                                            className="px-6 py-4 bg-slate-900 text-white font-bold rounded-full shadow-2xl hover:scale-105 transition-transform flex items-center gap-3"
                                        >
                                            <Download size={20} /> Download PDF
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <textarea 
                                    className="flex-1 p-6 resize-none outline-none bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono text-sm leading-relaxed"
                                    placeholder={isContractor ? "# Company Name&#10;## Core Capabilities&#10;- Specialized in X..." : "# Your Name&#10;## Professional Experience&#10;- Achieved X by doing Y..."}
                                    value={resumeContent}
                                    onChange={(e) => setResumeContent(e.target.value)}
                                />
                            )}
                            
                            {!previewMode && (
                            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between">
                                <span className="text-xs text-slate-400 self-center">Supports Markdown</span>
                                <button 
                                    onClick={handleAnalyzeResume}
                                    disabled={isAnalyzing || !resumeContent}
                                    className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-500 shadow-lg flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isAnalyzing ? 'Analyzing...' : 'Analyze & Score'} <ChevronRight size={16} />
                                </button>
                            </div>
                            )}
                        </div>

                        {/* Feedback / Results Side (Hidden in Preview) */}
                        {!previewMode && (
                            <div className="flex flex-col gap-6 overflow-y-auto">
                                {analysis ? (
                                    <>
                                        {/* Score Card */}
                                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
                                            <div className="flex justify-between items-start relative z-10">
                                                <div>
                                                    <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">{isContractor ? 'Capability Score' : 'Resume Score'}</h3>
                                                    <div className="text-5xl font-extrabold text-slate-900 dark:text-white">{analysis.score}</div>
                                                </div>
                                                <div className={`px-4 py-1 rounded-full text-xs font-bold ${analysis.score >= 80 ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                                                    {analysis.score >= 80 ? 'Excellent' : 'Needs Work'}
                                                </div>
                                            </div>
                                            <div className="mt-4 w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                                                <div className="bg-blue-600 h-full transition-all duration-1000" style={{ width: `${analysis.score}%` }}></div>
                                            </div>
                                            
                                            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800/50">
                                                <div className="text-xs font-bold text-blue-600 dark:text-blue-300 uppercase mb-2">Recommended Strategy</div>
                                                <div className="font-bold text-slate-900 dark:text-white">{analysis.roleFit}</div>
                                            </div>
                                        </div>

                                        {/* Analysis Details */}
                                        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex-1">
                                            <h3 className="font-bold text-slate-900 dark:text-white mb-4">AI Feedback</h3>
                                            
                                            <div className="space-y-6">
                                                <div>
                                                    <h4 className="text-xs font-bold text-green-600 uppercase mb-2 flex items-center gap-1"><Check size={14}/> Key Strengths</h4>
                                                    <ul className="space-y-2">
                                                        {analysis.strengths.map((s, i) => (
                                                            <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0"></span>
                                                                {s}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div>
                                                    <h4 className="text-xs font-bold text-amber-600 uppercase mb-2 flex items-center gap-1"><AlertCircle size={14}/> Improvements Needed</h4>
                                                    <ul className="space-y-2">
                                                        {analysis.improvements.map((s, i) => (
                                                            <li key={i} className="text-sm text-slate-600 dark:text-slate-300 flex items-start gap-2">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                                                                {s}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center text-center p-8 bg-slate-50 dark:bg-slate-900/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-800">
                                        <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                                            <Sparkles size={32} />
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Ready to Optimize?</h3>
                                        <p className="text-slate-500 dark:text-slate-400 max-w-xs">
                                            Paste your current profile on the left and click "Analyze" to get a score and actionable feedback.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* === CAREER PATHFINDER (Role Matcher) === */}
            {activeTab === 'Pathfinder' && (
                <div className="h-[calc(100vh-250px)] min-h-[600px] flex flex-col">
                    {!pathfinderResult ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto p-8">
                            <div className="w-24 h-24 bg-emerald-500/10 rounded-full flex items-center justify-center mb-8 border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.2)]">
                                <Compass size={48} className="text-emerald-500" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Uncover Your True Value</h2>
                            <p className="text-slate-500 dark:text-slate-400 text-lg mb-8 leading-relaxed">
                                Not sure what jobs you can get? Feeling like an imposter? <br/>
                                Our AI will deeply analyze your experience to find your <strong>Real Seniority Level</strong> and matching <strong>Job Titles</strong>.
                            </p>
                            <button 
                                onClick={handleRunPathfinder}
                                disabled={isMatchingRoles}
                                className="px-10 py-4 bg-emerald-600 text-white font-bold rounded-full text-lg hover:bg-emerald-500 hover:scale-105 transition-all shadow-xl flex items-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {isMatchingRoles ? <RefreshCw className="animate-spin" /> : <Target size={20} />}
                                {isMatchingRoles ? 'Analyzing Career DNA...' : 'Reveal My Matches'}
                            </button>
                            <p className="text-xs text-slate-400 mt-6">Uses your current CV content from the "Resume Architect" tab.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full overflow-y-auto pb-10 animate-in fade-in slide-in-from-bottom-4">
                            {/* Left: Validation & Confidence */}
                            <div className="space-y-6">
                                <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <BadgeCheck className="text-emerald-400" size={24} />
                                            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">Market Verification</h3>
                                        </div>
                                        <h2 className="text-4xl font-bold text-white mb-2">{pathfinderResult.seniorityLevel}</h2>
                                        <p className="text-slate-400 text-sm">Your experience qualifies you for this level.</p>
                                        
                                        <div className="mt-8 p-6 bg-emerald-900/20 border border-emerald-500/20 rounded-2xl">
                                            <h4 className="font-bold text-white mb-2 flex items-center gap-2"><Zap size={16} className="text-yellow-400"/> Hidden Superpower</h4>
                                            <p className="text-emerald-100 text-sm leading-relaxed">{pathfinderResult.hiddenSuperpower}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl">
                                    <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><Heart size={18} className="text-rose-500"/> Confidence Boost</h3>
                                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed italic border-l-4 border-rose-500/50 pl-4">
                                        "{pathfinderResult.confidenceBoost}"
                                    </p>
                                </div>
                            </div>

                            {/* Right: Job Matches */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-xl overflow-y-auto">
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">Your Best-Fit Roles</h3>
                                    <button onClick={handleRunPathfinder} className="text-xs text-blue-500 font-bold hover:underline flex items-center gap-1"><RefreshCw size={12}/> Re-Analyze</button>
                                </div>
                                <div className="space-y-4">
                                    {pathfinderResult.recommendedRoles.map((role, i) => (
                                        <div key={i} className="p-5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-blue-500 transition-colors group">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-bold text-slate-900 dark:text-white text-lg">{role.title}</h4>
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${role.matchPercentage > 85 ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                                                    {role.matchPercentage}% Match
                                                </span>
                                            </div>
                                            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{role.reason}</p>
                                            <div className="flex gap-2">
                                                {pathfinderResult.industryFit.slice(0,2).map((ind, idx) => (
                                                    <span key={idx} className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded">{ind}</span>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* === INTERVIEW & COVER LETTER (Standard) === */}
            {activeTab === 'Interview' && (
                <div className="max-w-4xl mx-auto h-[calc(100vh-250px)] min-h-[600px] flex flex-col bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                    {!interviewStarted ? (
                        <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-gradient-to-b from-white to-slate-50 dark:from-slate-900 dark:to-slate-950">
                            <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-8 animate-pulse">
                                <Mic size={40} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">{isContractor ? 'Pitch Simulator' : 'Mock Interview'}</h2>
                            <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-md">
                                {isContractor 
                                    ? <span>I will act as a <strong>Procurement Officer</strong>. I'll ask you about your capacity, pricing, and compliance.</span> 
                                    : <span>I will act as a hiring manager for the role of <strong>{interviewRole}</strong>. I'll ask you behavioral and technical questions.</span>
                                }
                            </p>
                            
                            <div className="flex items-center gap-4 mb-8">
                                <input 
                                    value={interviewRole}
                                    onChange={(e) => setInterviewRole(e.target.value)}
                                    className="px-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-bold text-center w-64"
                                />
                            </div>

                            <button 
                                onClick={startInterview}
                                className="px-10 py-4 bg-blue-600 text-white font-bold rounded-full text-lg hover:scale-105 transition-transform shadow-xl"
                            >
                                Start {isContractor ? 'Pitch' : 'Interview'}
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 relative z-10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-lg">
                                        🤖
                                    </div>
                                    <div>
                                        <div className="font-bold text-sm text-slate-900 dark:text-white">{isContractor ? 'Procurement Officer' : 'Hiring Manager'}</div>
                                        <div className="text-xs text-slate-500">Context: {interviewRole}</div>
                                    </div>
                                </div>
                                <button onClick={() => setInterviewStarted(false)} className="text-xs font-bold text-slate-400 hover:text-slate-600">End Session</button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50 dark:bg-slate-950" ref={chatScrollRef}>
                                {interviewChat.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-5 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                            msg.role === 'user' 
                                            ? 'bg-blue-600 text-white rounded-br-none' 
                                            : 'bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 rounded-bl-none border border-slate-200 dark:border-slate-800'
                                        }`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {isInterviewerThinking && (
                                    <div className="flex justify-start">
                                        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl rounded-bl-none border border-slate-200 dark:border-slate-800">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
                                <div className="relative">
                                    <textarea 
                                        value={userResponse}
                                        onChange={(e) => setUserResponse(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && !e.shiftKey) {
                                                e.preventDefault();
                                                handleSendAnswer();
                                            }
                                        }}
                                        placeholder="Type your answer here..."
                                        className="w-full pl-6 pr-16 py-4 bg-slate-100 dark:bg-slate-800 border-none rounded-2xl outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors shadow-inner resize-none h-24 dark:text-white"
                                    />
                                    <button 
                                        onClick={handleSendAnswer}
                                        disabled={!userResponse.trim() || isInterviewerThinking}
                                        className="absolute right-4 bottom-4 p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-500 transition-colors disabled:opacity-50 shadow-lg"
                                    >
                                        <Mic size={20} />
                                    </button>
                                </div>
                                <p className="text-center text-xs text-slate-400 mt-2">
                                    Tip: Be concise and professional.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* === COVER LETTER GENERATOR (Standard) === */}
            {activeTab === 'CoverLetter' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-250px)] min-h-[600px]">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col overflow-hidden">
                        <div className="p-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800">
                            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                <Briefcase size={18} /> {isContractor ? 'Tender Details' : 'Job Details'}
                            </h3>
                        </div>
                        <div className="p-6 flex-1 flex flex-col">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2">{isContractor ? 'Requirements / Scope' : 'Job Description'}</label>
                            <textarea 
                                className="flex-1 w-full p-4 bg-slate-100 dark:bg-slate-800 rounded-xl resize-none outline-none focus:ring-2 focus:ring-blue-500/20 mb-4 text-sm dark:text-white"
                                placeholder={isContractor ? "Paste the tender scope of work here..." : "Paste the job description here..."}
                                value={jobDesc}
                                onChange={(e) => setJobDesc(e.target.value)}
                            />
                            <button 
                                onClick={handleGenerateCoverLetter}
                                disabled={isDrafting || !jobDesc}
                                className="w-full py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                {isDrafting ? <RefreshCw className="animate-spin" /> : <PenTool size={18} />}
                                {isDrafting ? 'Drafting...' : (isContractor ? 'Generate Proposal' : 'Generate Cover Letter')}
                            </button>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl flex flex-col overflow-hidden relative">
                        <div className="p-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 dark:text-white">Generated Draft</h3>
                            <button className="text-xs text-blue-600 hover:underline flex items-center gap-1">
                                <Download size={12} /> Copy Text
                            </button>
                        </div>
                        <div className="flex-1 p-8 overflow-y-auto bg-white">
                            {generatedLetter ? (
                                <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-line font-serif">
                                    {generatedLetter}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                    <FileText size={48} className="mb-4 opacity-20" />
                                    <p>Your tailored draft will appear here.</p>
                                </div>
                            )}
                        </div>
                        {isDrafting && (
                            <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm flex items-center justify-center">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-10 h-10 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                    <span className="font-bold text-purple-600">Writing...</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
