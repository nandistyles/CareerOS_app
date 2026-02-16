
import React, { useState, useEffect } from 'react';
import { UserProfile, JobOpportunity, ViewState, Course, TailoredResume } from '../types';
import { Search, MapPin, Building2, Briefcase, Globe, Filter, Loader2, RefreshCw, AlertTriangle, BookOpen, ArrowRight, X, FileText, PenTool, CheckCircle, Send, Sparkles, Shield, Landmark, Gift, HeartHandshake, Mic2, ExternalLink, Download, ChevronDown, Radar, Target, Crosshair, TrendingUp, Lock, Users, User, Save } from 'lucide-react';
import { generateMarketplaceOpportunities, generateCoverLetter, tailorResumeToJob, generateOpportunities } from '../services/geminiService';

interface MarketplaceProps {
    user: UserProfile;
    onUpdateUser?: (user: UserProfile) => void;
    onChangeView: (view: ViewState, data?: any) => void;
    initialSearch?: string;
    courses: Course[];
}

const SUGGESTED_INDUSTRIES = [
    "Technology", "Finance", "Healthcare", "Mining", "Agriculture", 
    "Construction", "Education", "Logistics", "Energy", "Retail", 
    "Government", "Creative", "NGO"
];

const SUGGESTED_LOCATIONS = [
    "Worldwide", "Remote", "Zimbabwe", "South Africa", "United Kingdom", 
    "United States", "Dubai", "Kenya", "Nigeria", "Harare"
];

export const Marketplace: React.FC<MarketplaceProps> = ({ user, onChangeView, initialSearch, courses, onUpdateUser }) => {
    const isContractor = ['Contractor', 'AssetOwner', 'GrowthStartup'].includes(user.primaryFocus || '');
    const isRecruiter = user.primaryFocus === 'Recruiter';
    
    // Search State
    const [searchQuery, setSearchQuery] = useState(initialSearch || '');
    const [industryFilter, setIndustryFilter] = useState(user.industry || '');
    const [locationFilter, setLocationFilter] = useState(user.location || 'Worldwide');
    
    const [jobs, setJobs] = useState<JobOpportunity[]>([]);
    const [filterType, setFilterType] = useState('All');
    const [isLoading, setIsLoading] = useState(false);
    
    // Intel / Application State
    const [selectedJob, setSelectedJob] = useState<JobOpportunity | null>(null);
    const [intelMode, setIntelMode] = useState(false); 
    const [appStep, setAppStep] = useState<'generating' | 'review' | 'success'>('generating');
    const [generatedAssets, setGeneratedAssets] = useState<{coverLetter: string, tailoredResume: string}>({ coverLetter: '', tailoredResume: '' });
    const [activeAssetTab, setActiveAssetTab] = useState<'cover' | 'resume'>('cover');

    useEffect(() => {
        if (jobs.length === 0) handleSearch(false);
    }, []);

    const handleSearch = async (append = false) => {
        setIsLoading(true);
        try {
            const industry = industryFilter.trim() || 'General';
            const location = locationFilter.trim() || 'Worldwide';
            const keywords = searchQuery.trim() ? [searchQuery] : (user.keywords || []);
            
            let results: JobOpportunity[] = [];

            if (isContractor && filterType === 'All' && !searchQuery) {
                const bids = await generateOpportunities(industry, location);
                results = bids.map(bid => ({
                    id: bid.id,
                    title: bid.title,
                    company: bid.agency,
                    type: 'Tender',
                    budget: bid.value,
                    description: bid.description || `Procurement: ${bid.procurementMethod}`,
                    skills: bid.requirements,
                    postedDate: `Close: ${bid.closingDate}`,
                    location: bid.country || location,
                    isExclusive: false,
                    isFeatured: bid.matchScore ? bid.matchScore > 85 : false,
                    isVerified: true,
                    applicantsCount: Math.floor(Math.random() * 20),
                    matchReason: `${bid.matchScore}% Strategic Fit`,
                    probability: bid.matchScore || 75,
                    sourceUrl: bid.sourceUrl
                }));
            } else {
                results = await generateMarketplaceOpportunities(
                    industry, 
                    location, 
                    keywords, 
                    filterType, 
                    0, 
                    user.primaryFocus // Pass persona to service
                );
            }
            
            // Add "Intel" properties purely for UI demonstration
            const enhancedResults = results.map(j => ({
                ...j,
                probability: j.probability || Math.floor(Math.random() * (98 - 60) + 60),
                matchReason: j.matchReason || (j.probability && j.probability > 85 ? "High Synergy Detected" : "Standard Alignment")
            }));

            setJobs(append ? [...jobs, ...enhancedResults] : enhancedResults);
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleApplyClick = async (job: JobOpportunity) => {
        setSelectedJob(job);
        setAppStep('generating');
        
        try {
            if (isRecruiter) {
                // RECRUITER LOGIC: Generate Interview Request
                const letter = `Dear ${job.title.split(' - ')[0] || 'Candidate'},\n\nI came across your profile and was impressed by your experience at ${job.company}. We have an opening that aligns perfectly with your skills in ${job.skills.slice(0,2).join(', ')}.\n\nWould you be open to a brief chat regarding a ${job.type} opportunity?`;
                setGeneratedAssets({ coverLetter: letter, tailoredResume: '' });
                setAppStep('review');
                return;
            }

            const userResume = user.resumeText || user.businessDescription || `Professional in ${user.industry}`;
            
            let letter = '', resume = '';
            
            if (isContractor || job.type === 'Tender') {
                letter = `**BID PROPOSAL: ${job.title}**\n\n**To:** ${job.company}\n\n**Executive Summary**\nWe are pleased to submit our proposal. Our firm, ${user.companyName}, has extensive experience in ${user.industry}.\n\n**Technical Approach**\nOur methodology ensures compliance with all requirements...\n\n**Financial Offer**\nCompetitive pricing structure aligned with market rates.`;
                resume = `**CAPABILITY STATEMENT**\n\n**Firm:** ${user.companyName}\n**Experience:** ${user.yearsExperience || 5} Years\n\n**Relevant Projects**\n- Similar project executed in 2024.\n- Compliant with PRAZ regulations.`;
            } else {
                [letter, resume] = await Promise.all([
                    generateCoverLetter(job, userResume),
                    tailorResumeToJob(userResume, job.title, job.description)
                ]);
            }
            
            setGeneratedAssets({ coverLetter: letter, tailoredResume: resume });
            setAppStep('review');
        } catch (e) {
            setAppStep('review');
        }
    };

    const confirmApplication = () => {
        if (onUpdateUser && selectedJob) {
            const newHistoryItem: TailoredResume = {
                id: `resume-${Date.now()}`,
                jobTitle: selectedJob.title,
                company: selectedJob.company,
                content: generatedAssets.tailoredResume,
                date: new Date().toLocaleDateString()
            };

            const appliedJobIds = [...(user.appliedJobIds || []), selectedJob.id];
            const resumeHistory = [...(user.resumeHistory || []), newHistoryItem];

            // Update User Profile with new Application ID AND new Tailored Resume
            onUpdateUser({ 
                ...user, 
                appliedJobIds,
                resumeHistory
            });
        }
        setAppStep('success');
        setTimeout(() => setSelectedJob(null), 2500);
    };

    // --- RENDER HELPERS ---

    const ProbabilityRing = ({ score }: { score: number }) => {
        const color = score >= 85 ? 'text-emerald-500' : score >= 70 ? 'text-amber-500' : 'text-slate-500';
        const stroke = score >= 85 ? '#10b981' : score >= 70 ? '#f59e0b' : '#64748b';
        return (
            <div className="relative w-12 h-12 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                    <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-slate-800" />
                    <circle cx="24" cy="24" r="20" stroke={stroke} strokeWidth="4" fill="transparent" strokeDasharray={125.6} strokeDashoffset={125.6 - (125.6 * score) / 100} className="transition-all duration-1000 ease-out" />
                </svg>
                <span className={`absolute text-[10px] font-bold ${color}`}>{score}%</span>
            </div>
        );
    };

    const IntelCard = ({ job }: { job: JobOpportunity }) => (
        <div className="bg-[#050b09]/95 backdrop-blur-xl border border-white/10 rounded-3xl p-6 absolute inset-0 z-30 flex flex-col animate-in fade-in zoom-in-95 overflow-hidden">
            <div className="flex justify-between items-start mb-6 shrink-0">
                <div>
                    <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-1">
                        <Radar size={14} className="animate-pulse" /> {isRecruiter ? 'Talent Analysis' : 'Strategic Intel'}
                    </div>
                    <h3 className="text-white font-bold text-lg leading-tight line-clamp-1">{isRecruiter ? job.title : job.company + ' Analysis'}</h3>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setIntelMode(false); }} className="text-slate-400 hover:text-white p-2 bg-white/5 rounded-full transition-colors"><X size={18} /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-6 overflow-y-auto custom-scrollbar flex-1 content-start">
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">{isRecruiter ? 'Flight Risk' : 'Density'}</div>
                    <div className="text-white font-bold text-sm">
                        {isRecruiter ? (job.probability && job.probability > 80 ? 'High' : 'Low') : (job.applicantsCount < 10 ? 'Low' : 'High')}
                    </div>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">{isRecruiter ? 'Salary Exp.' : 'Budget'}</div>
                    <div className="text-emerald-400 font-bold text-sm">{isRecruiter ? job.budget : 'Liquid'}</div>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">{isRecruiter ? 'Current Role' : 'Decision Maker'}</div>
                    <div className="text-white font-bold text-sm truncate">{isRecruiter ? job.company : 'Director Lvl'}</div>
                </div>
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                    <div className="text-slate-500 text-[10px] uppercase font-bold mb-1">{isRecruiter ? 'Placement Prob.' : 'Win Prob.'}</div>
                    <div className="text-emerald-400 font-bold text-sm">{job.probability}%</div>
                </div>
            </div>

            <div className="mt-auto shrink-0">
                <button 
                    onClick={(e) => { e.stopPropagation(); setIntelMode(false); handleApplyClick(job); }}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/50 flex items-center justify-center gap-2 text-sm transition-all hover:scale-[1.02]"
                >
                    <Crosshair size={18} /> {isRecruiter ? 'Draft Offer / Message' : 'Initiate Strike (Apply)'}
                </button>
            </div>
        </div>
    );

    const recruiterFilters = ['All', 'Senior', 'Mid-Level', 'Junior', 'Contract'];
    const standardFilters = ['All', 'Full-time', 'Contract', 'Grant', 'Tender'];

    return (
        <div className="p-6 md:p-12 pb-32 min-h-screen bg-[#020604] relative">
            {/* Background Texture */}
            <div className="absolute top-0 left-0 w-full h-96 bg-emerald-900/10 blur-[100px] pointer-events-none"></div>

            {/* Header */}
            <div className="relative z-10 mb-8">
                <h1 className="text-3xl md:text-4xl font-serif font-bold text-white tracking-tight mb-2 flex items-center gap-3">
                    {isRecruiter ? <Users size={32} className="text-blue-500"/> : isContractor ? <Landmark size={32} className="text-amber-500" /> : <Target size={32} className="text-emerald-500" />}
                    {isRecruiter ? 'Talent Sourcing' : isContractor ? 'Procurement Radar' : 'Opportunity Targeting'}
                </h1>
                <p className="text-slate-400 text-sm md:text-base">
                    AI-Calibrated {isRecruiter ? 'Candidates' : 'Opportunities'}. <span className="text-emerald-400 font-bold">{isRecruiter ? 'Placement Probability' : 'Win Probability'}</span> > 70% highlighted.
                </p>
            </div>

            {/* Control Bar */}
            <div className="sticky top-4 z-40 bg-[#0a1f16]/90 backdrop-blur-xl rounded-2xl p-2 border border-emerald-500/20 shadow-2xl mb-8 flex flex-col md:flex-row gap-2">
                <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500/50" size={18} />
                    <input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch(false)}
                        placeholder={isRecruiter ? "Search for skills, roles (e.g. React Developer)..." : isContractor ? "Search tenders by ID, keyword or agency..." : "Search roles, skills or companies..."}
                        className="w-full pl-12 pr-4 py-3 bg-[#020604]/50 border border-emerald-500/10 rounded-xl text-white outline-none focus:border-emerald-500/50 placeholder-slate-600 transition-all text-sm"
                    />
                </div>
                <div className="flex gap-2">
                    <select 
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="px-4 py-3 bg-[#020604]/50 border border-emerald-500/10 rounded-xl text-slate-300 outline-none focus:border-emerald-500/50 text-sm font-bold w-full md:w-auto"
                    >
                        {SUGGESTED_LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                    </select>
                    <button 
                        onClick={() => handleSearch(false)}
                        disabled={isLoading}
                        className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 whitespace-nowrap text-sm"
                    >
                        {isLoading ? <Loader2 className="animate-spin" size={18}/> : <RefreshCw size={18}/>}
                        <span className="hidden md:inline">{isRecruiter ? 'Scout Talent' : 'Scan Sector'}</span>
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 custom-scrollbar">
                {(isRecruiter ? recruiterFilters : standardFilters).map(f => (
                    <button 
                        key={f} 
                        onClick={() => setFilterType(f)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${filterType === f ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-transparent border-slate-800 text-slate-500 hover:text-slate-300'}`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-20">
                {jobs.map(job => {
                    const isApplied = user.appliedJobIds?.includes(job.id);
                    const course = courses.find(c => c.id === job.recommendedCourseId);
                    
                    return (
                        <div key={job.id} className={`relative bg-[#0a1410] border rounded-3xl p-6 transition-all group overflow-hidden min-h-[450px] flex flex-col justify-between ${isApplied ? 'border-emerald-500/30 opacity-60' : 'border-white/5 hover:border-emerald-500/50 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]'}`}>
                            {intelMode && selectedJob?.id === job.id && <IntelCard job={job} />}
                            
                            <div className="flex-1">
                                {/* Header */}
                                <div className="flex justify-between items-start mb-6">
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-slate-800 rounded-xl flex items-center justify-center text-slate-400 font-bold text-xl border border-white/5 shrink-0">
                                            {isRecruiter ? <User size={24}/> : job.company.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-white text-lg group-hover:text-emerald-400 transition-colors line-clamp-2 leading-tight">{job.title}</h3>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                                                {isRecruiter ? <Briefcase size={12}/> : <Building2 size={12}/>} 
                                                {job.company}
                                                <span>•</span>
                                                <MapPin size={12}/> {job.location}
                                            </div>
                                        </div>
                                    </div>
                                    <ProbabilityRing score={job.probability || 60} />
                                </div>

                                {/* Tags */}
                                <div className="flex flex-wrap gap-2 mb-6">
                                    <span className="px-2 py-1 bg-white/5 rounded text-[10px] font-bold text-slate-400 border border-white/5">{job.type}</span>
                                    <span className="px-2 py-1 bg-emerald-500/10 rounded text-[10px] font-bold text-emerald-400 border border-emerald-500/20">{job.budget}</span>
                                    {job.isFeatured && <span className="px-2 py-1 bg-amber-500/10 rounded text-[10px] font-bold text-amber-400 border border-amber-500/20 flex items-center gap-1"><Sparkles size={10}/> {isRecruiter ? 'Top Talent' : 'Priority'}</span>}
                                </div>

                                {/* Description Preview */}
                                <p className="text-sm text-slate-400 line-clamp-3 mb-6 leading-relaxed">
                                    {job.description}
                                </p>

                                {/* Skill Gap Warning (if any) - Only for Job Seekers */}
                                {!isRecruiter && course && !isApplied && (
                                    <div className="mb-6 p-3 bg-amber-950/30 border border-amber-500/20 rounded-xl flex items-center justify-between">
                                        <div className="flex items-center gap-2 text-amber-500 text-xs font-bold">
                                            <AlertTriangle size={14} /> Gap: {course.title.split(' ').slice(0,2).join(' ')}...
                                        </div>
                                        <button onClick={() => onChangeView('academy', { courseId: course.id })} className="text-[10px] bg-amber-500 text-black px-2 py-1 rounded font-bold hover:bg-amber-400 whitespace-nowrap">Bridge Gap</button>
                                    </div>
                                )}
                            </div>

                            {/* Action Bar */}
                            <div className="flex items-center gap-3 pt-6 border-t border-white/5 mt-auto shrink-0">
                                <button 
                                    onClick={() => { setSelectedJob(job); setIntelMode(true); }}
                                    className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                                >
                                    <Radar size={14} /> {isRecruiter ? 'Analyze Profile' : 'Reveal Intel'}
                                </button>
                                <button 
                                    onClick={() => handleApplyClick(job)}
                                    disabled={isApplied}
                                    className={`flex-1 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${isApplied ? 'bg-emerald-900/20 text-emerald-600 border border-emerald-900' : 'bg-white text-black hover:bg-emerald-400 hover:scale-105'}`}
                                >
                                    {isApplied ? (isRecruiter ? 'Contacted' : 'Target Acquired') : (isRecruiter ? 'Contact Talent' : 'Initiate Strike')} {isApplied ? <CheckCircle size={14}/> : <ArrowRight size={14}/>}
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* --- Application/Contact Modal --- */}
            {selectedJob && !intelMode && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={() => setSelectedJob(null)}></div>
                    <div className="relative w-full max-w-4xl bg-[#0B0F19] border border-slate-700 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95">
                        
                        {/* Modal Header */}
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-[#050b09]">
                            <div>
                                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                    <Crosshair size={20} className="text-emerald-500"/>
                                    {appStep === 'success' ? (isRecruiter ? 'Pipeline Updated' : 'Mission Accomplished') : (isRecruiter ? `Contacting: ${selectedJob.title}` : `Engaging Target: ${selectedJob.company}`)}
                                </h2>
                                <p className="text-xs text-slate-500 font-mono mt-1">ID: {selectedJob.id.toUpperCase()}</p>
                            </div>
                            {appStep !== 'success' && <button onClick={() => setSelectedJob(null)} className="p-2 hover:bg-slate-800 rounded-full"><X size={20} className="text-slate-500"/></button>}
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-0">
                            {appStep === 'generating' && (
                                <div className="flex flex-col items-center justify-center h-80">
                                    <Loader2 size={48} className="text-emerald-500 animate-spin mb-6" />
                                    <h3 className="text-white font-bold text-lg">Synthesizing Assets...</h3>
                                    <p className="text-slate-500 text-sm mt-2">Aligning bio-vector to target requirements.</p>
                                </div>
                            )}

                            {appStep === 'review' && (
                                <div className="flex flex-col md:flex-row h-full min-h-[500px]">
                                    <div className="w-full md:w-64 bg-[#020604] border-r border-slate-800 p-4 space-y-2">
                                        <button onClick={() => setActiveAssetTab('cover')} className={`w-full p-3 rounded-xl text-left text-sm font-bold flex items-center gap-2 ${activeAssetTab === 'cover' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-500 hover:text-white'}`}>
                                            <PenTool size={14}/> {isRecruiter ? 'Outreach Message' : 'Cover Letter'}
                                        </button>
                                        {!isRecruiter && (
                                            <button onClick={() => setActiveAssetTab('resume')} className={`w-full p-3 rounded-xl text-left text-sm font-bold flex items-center gap-2 ${activeAssetTab === 'resume' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'text-slate-500 hover:text-white'}`}>
                                                <FileText size={14}/> Tailored Resume
                                            </button>
                                        )}
                                    </div>
                                    <div className="flex-1 bg-[#0a1410] p-6">
                                        <textarea 
                                            className="w-full h-full bg-transparent resize-none outline-none text-slate-300 font-mono text-sm leading-relaxed"
                                            value={activeAssetTab === 'cover' ? generatedAssets.coverLetter : generatedAssets.tailoredResume}
                                            onChange={(e) => setGeneratedAssets(prev => ({...prev, [activeAssetTab === 'cover' ? 'coverLetter' : 'tailoredResume']: e.target.value}))}
                                        />
                                    </div>
                                </div>
                            )}

                            {appStep === 'success' && (
                                <div className="flex flex-col items-center justify-center h-80 text-center">
                                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6 border border-emerald-500/50">
                                        <CheckCircle size={40} className="text-emerald-500" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">{isRecruiter ? 'Outreach Sent' : 'Application Deployed'}</h3>
                                    <p className="text-slate-400 text-sm">Target has been flagged in your dashboard.</p>
                                    {!isRecruiter && (
                                        <div className="mt-4 flex items-center gap-2 text-xs text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                                            <Save size={12}/> Tailored CV saved to Profile
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        {appStep === 'review' && (
                            <div className="p-6 border-t border-slate-800 bg-[#050b09] flex justify-end gap-4">
                                <button onClick={() => setSelectedJob(null)} className="text-slate-500 hover:text-white text-sm font-bold px-4">Abort</button>
                                {selectedJob.sourceUrl && !isRecruiter ? (
                                    <button 
                                        onClick={() => { window.open(selectedJob.sourceUrl, '_blank'); confirmApplication(); }}
                                        className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg"
                                    >
                                        <ExternalLink size={16}/> Apply on Site
                                    </button>
                                ) : (
                                    <button 
                                        onClick={confirmApplication}
                                        className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl flex items-center gap-2 shadow-lg shadow-emerald-900/50"
                                    >
                                        <Send size={16}/> {isRecruiter ? 'Send Message' : 'Launch Application'}
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
