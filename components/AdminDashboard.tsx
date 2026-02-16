
import React, { useState, useEffect } from 'react';
import { UserProfile, Course, CourseModule } from '../types';
import { UploadCloud, Loader2, FileText, CheckCircle2, BrainCircuit, Mic, Layers, Play, FileInput, Presentation, Users, DollarSign, Activity, Server, Search, Filter, MoreHorizontal, BookOpen, Trash2, Edit3, Plus, BarChart3, Lock, Shield, Eye, PenTool, Save, X, List, Sparkles, TrendingUp, ArrowRight, Video, Headphones, FileQuestion } from 'lucide-react';
import { generateQuiz, generateCourseFromTopic, getMarketCourseSuggestions, enhanceModuleContent } from '../services/geminiService';

interface AdminDashboardProps {
    user: UserProfile;
    courses: Course[];
    onAddCourse: (course: Course) => void;
    onUpdateCourse?: (course: Course) => void;
}

// Mock User Data
const MOCK_USERS = [
    { id: 'u1', name: 'Sarah Jenkins', email: 'sarah.j@gmail.com', role: 'Professional', joined: 'Oct 12, 2024', status: 'Active' },
    { id: 'u2', name: 'David Moyo', email: 'd.moyo@construct.co.zw', role: 'Contractor', joined: 'Nov 01, 2024', status: 'Active' },
    { id: 'u3', name: 'TechRecruit Ltd', email: 'hiring@techrecruit.com', role: 'Recruiter', joined: 'Jan 15, 2025', status: 'Pending' },
    { id: 'u4', name: 'James Carter', email: 'j.carter@consulting.com', role: 'Executive', joined: 'Feb 20, 2025', status: 'Active' },
    { id: 'u5', name: 'Grace Chigumba', email: 'grace.c@yahoo.com', role: 'Student', joined: 'Feb 22, 2025', status: 'Suspended' },
];

// Mock Activity Logs
const ACTIVITY_LOGS = [
    { id: 1, text: "Sarah J. completed course Strategic Project Mgmt", time: "2 mins ago", icon: CheckCircle2, color: "text-green-500" },
    { id: 2, text: "David M. uploaded bid ZESA Tender #402", time: "15 mins ago", icon: FileText, color: "text-blue-500" },
    { id: 3, text: "TechRecruit posted job Senior React Dev", time: "1 hour ago", icon: Users, color: "text-purple-500" },
    { id: 4, text: "System alert High traffic detected", time: "2 hours ago", icon: Server, color: "text-amber-500" },
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, courses, onAddCourse, onUpdateCourse }) => {
    const [activeTab, setActiveTab] = useState<'Overview' | 'Users' | 'Content' | 'System'>('Overview');
    
    // Content Engine State
    const [creationMode, setCreationMode] = useState<'ai' | 'manual' | null>(null);
    const [aiSubMode, setAiSubMode] = useState<'select' | 'upload' | 'topic' | 'market'>('select');
    const [editingCourse, setEditingCourse] = useState<Course | null>(null);
    
    // AI Upload State
    const [isDragging, setIsDragging] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [processingStep, setProcessingStep] = useState<number>(0); 
    
    // AI Topic State
    const [topicInput, setTopicInput] = useState('');
    const [focusInput, setFocusInput] = useState('');
    const [isGeneratingTopic, setIsGeneratingTopic] = useState(false);

    // AI Market State
    const [marketSuggestions, setMarketSuggestions] = useState<any[]>([]);
    const [isLoadingMarket, setIsLoadingMarket] = useState(false);

    // Manual/Edit State
    const [formData, setFormData] = useState<Partial<Course>>({});
    
    // Module Editing State
    const [showModuleModal, setShowModuleModal] = useState(false);
    const [currentModule, setCurrentModule] = useState<Partial<CourseModule>>({ title: '', duration: '', type: 'Video', content: '' });
    const [editingModuleIndex, setEditingModuleIndex] = useState<number | null>(null);
    const [isEnhancing, setIsEnhancing] = useState(false);

    // User Management State
    const [userSearch, setUserSearch] = useState('');

    useEffect(() => {
        if (creationMode === 'ai' && aiSubMode === 'market' && marketSuggestions.length === 0) {
            loadMarketSuggestions();
        }
    }, [creationMode, aiSubMode]);

    const loadMarketSuggestions = async () => {
        setIsLoadingMarket(true);
        const suggestions = await getMarketCourseSuggestions();
        setMarketSuggestions(suggestions);
        setIsLoadingMarket(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
        }
    };

    const handleProcessAIUpload = async () => {
        if (!file) return;
        setProcessingStep(1);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setProcessingStep(2);
        
        const quiz = await generateQuiz(file.name.replace('.pdf', ''), 'Advanced');
        
        setProcessingStep(3);
        await new Promise(resolve => setTimeout(resolve, 2500));
        setProcessingStep(4);
        
        const newCourse: Course = {
            id: `gen-${Date.now()}`,
            title: file.name.replace(/\.(pdf|pptx?)$/i, ''), 
            type: 'Technical',
            targetAudience: 'Professional', 
            duration: '2 Weeks',
            price: 0,
            rating: 5.0,
            students: 0,
            imageColor: 'bg-indigo-900',
            isCertified: true,
            modules: [
                { id: 'm1', title: 'Deep Dive Briefing', duration: '12 mins', type: 'Audio', isCompleted: false },
                { id: 'm2', title: 'Source Material Analysis', duration: '20 mins', type: 'Slides', isCompleted: false },
                { id: 'm3', title: 'Core Concepts & Application', duration: '15 mins', type: 'Reading', isCompleted: false }
            ],
            exam: quiz,
            category: 'AI Generated',
            pdfSource: file.name
        };
        onAddCourse(newCourse);
        setTimeout(() => {
            setProcessingStep(0);
            setFile(null);
            setCreationMode(null);
            setAiSubMode('select');
        }, 1000);
    };

    const handleGenerateFromTopic = async (topic: string, focus: string) => {
        setIsGeneratingTopic(true);
        const generatedCourse = await generateCourseFromTopic(topic, focus);
        setIsGeneratingTopic(false);
        
        if (generatedCourse) {
            // Instead of adding immediately, open in editor
            setEditingCourse(generatedCourse);
            setCreationMode(null); // Exit creation selector
            setAiSubMode('select');
        }
    };

    const handleSaveManual = () => {
        if (!formData.title) return;
        const newCourse: Course = {
            id: `man-${Date.now()}`,
            title: formData.title || 'Untitled Course',
            type: formData.type || 'Technical',
            targetAudience: formData.targetAudience || 'Professional',
            duration: formData.duration || '4 Weeks',
            price: 0,
            rating: 0,
            students: 0,
            imageColor: 'bg-slate-800',
            isCertified: true,
            description: formData.description,
            category: formData.category || 'General',
            modules: formData.modules || [],
            exam: []
        };
        onAddCourse(newCourse);
        setCreationMode(null);
        setFormData({});
        setEditingModuleIndex(null);
    };

    const handleSaveEdit = () => {
        if (!editingCourse) return;
        
        // Check if it's a new generated course (not in list) or existing
        const exists = courses.find(c => c.id === editingCourse.id);
        if (exists && onUpdateCourse) {
            onUpdateCourse(editingCourse);
        } else {
            onAddCourse(editingCourse);
        }
        setEditingCourse(null);
        setEditingModuleIndex(null);
    };

    const openModuleModal = (index: number | null, isEditMode: boolean) => {
        setEditingModuleIndex(index);
        
        if (index !== null) {
            const modules = isEditMode && editingCourse ? editingCourse.modules : formData.modules || [];
            if (modules[index]) {
                setCurrentModule({ ...modules[index] });
            }
        } else {
            setCurrentModule({ title: '', duration: '10 mins', type: 'Reading', content: '' });
        }
        setShowModuleModal(true);
    };

    const handleEnhanceContent = async () => {
        if (!currentModule.content) return;
        setIsEnhancing(true);
        const enhanced = await enhanceModuleContent(currentModule.content, currentModule.type as any);
        setCurrentModule(prev => ({ ...prev, content: enhanced }));
        setIsEnhancing(false);
    };

    const saveModuleFromModal = () => {
        if (!currentModule.title) return;

        const moduleToSave: CourseModule = {
            id: currentModule.id || `mod-${Date.now()}`,
            title: currentModule.title || 'Untitled Module',
            duration: currentModule.duration || '10 mins',
            type: currentModule.type || 'Reading',
            isCompleted: false,
            content: currentModule.content || ''
        };

        if (editingCourse) {
            const updatedModules = [...editingCourse.modules];
            if (editingModuleIndex !== null) {
                updatedModules[editingModuleIndex] = moduleToSave;
            } else {
                updatedModules.push(moduleToSave);
            }
            setEditingCourse({ ...editingCourse, modules: updatedModules });
        } else {
            const updatedModules = [...(formData.modules || [])];
            if (editingModuleIndex !== null) {
                updatedModules[editingModuleIndex] = moduleToSave;
            } else {
                updatedModules.push(moduleToSave);
            }
            setFormData({ ...formData, modules: updatedModules });
        }
        
        setShowModuleModal(false);
        setCurrentModule({ title: '', duration: '', type: 'Video', content: '' });
    };

    const handleDeleteModule = (idx: number, isEditMode: boolean) => {
        if (isEditMode && editingCourse) {
            const updated = [...editingCourse.modules];
            updated.splice(idx, 1);
            setEditingCourse({ ...editingCourse, modules: updated });
        } else {
            const updated = [...(formData.modules || [])];
            updated.splice(idx, 1);
            setFormData({ ...formData, modules: updated });
        }
    };

    const StatCard = ({ title, value, sub, icon: Icon, color }: any) => (
        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 relative overflow-hidden group hover:border-slate-700 transition-all">
            <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity ${color}`}>
                <Icon size={64} />
            </div>
            <div className="flex items-center gap-3 mb-2">
                <div className={`p-2 rounded-lg bg-slate-800 ${color.replace('text-', 'text-')}`}>
                    <Icon size={20} className={color} />
                </div>
                <h3 className="text-slate-400 text-sm font-bold uppercase tracking-wider">{title}</h3>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{value}</div>
            <div className="text-xs font-medium text-slate-500">{sub}</div>
        </div>
    );

    return (
        <div className="p-6 md:p-8 min-h-screen bg-[#0B0F19] text-white">
            
            {/* Top Bar */}
            <header className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
                <div>
                    <h1 className="text-3xl font-bold flex items-center gap-3 mb-2">
                        <Shield className="text-indigo-500" size={32} />
                        Command Center
                    </h1>
                    <p className="text-slate-400">System Status: <span className="text-emerald-400 font-mono">OPERATIONAL</span></p>
                </div>
                
                <div className="bg-slate-900 p-1 rounded-xl flex border border-slate-800">
                    {['Overview', 'Users', 'Content', 'System'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab as any)}
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${
                                activeTab === tab 
                                ? 'bg-indigo-600 text-white shadow-lg' 
                                : 'text-slate-400 hover:text-white hover:bg-slate-800'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </header>

            {/* === OVERVIEW TAB === */}
            {activeTab === 'Overview' && (
                <div className="animate-in fade-in space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <StatCard title="Total Users" value="12,450" sub="+12% from last month" icon={Users} color="text-blue-500" />
                        <StatCard title="Revenue (MRR)" value="$45,200" sub="98% collection rate" icon={DollarSign} color="text-emerald-500" />
                        <StatCard title="Active Courses" value={courses.length} sub={`${courses.reduce((a,c) => a + c.students, 0)} total enrollments`} icon={BookOpen} color="text-purple-500" />
                        <StatCard title="System Health" value="99.9%" sub="Latency: 24ms" icon={Activity} color="text-rose-500" />
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Live Feed */}
                        <div className="lg:col-span-2 bg-slate-900 rounded-3xl border border-slate-800 p-6">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-white">Live Activity Feed</h3>
                                <button className="text-xs text-indigo-400 hover:text-white font-bold">View All Logs</button>
                            </div>
                            <div className="space-y-4">
                                {ACTIVITY_LOGS.map((log) => (
                                    <div key={log.id} className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800 hover:border-slate-700 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center border border-slate-800 ${log.color}`}>
                                                <log.icon size={18} />
                                            </div>
                                            <div>
                                                <div className="text-sm font-medium text-slate-200">{log.text}</div>
                                                <div className="text-xs text-slate-500">{log.time}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-indigo-900/20 rounded-3xl border border-indigo-900/50 p-6 flex flex-col justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white mb-2">Administrative Actions</h3>
                                <div className="space-y-3 mt-6">
                                    <button onClick={() => setActiveTab('Content')} className="w-full py-3 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-500 transition-colors flex items-center gap-3 px-4">
                                        <UploadCloud size={18} /> Manage Content
                                    </button>
                                    <button onClick={() => setActiveTab('Users')} className="w-full py-3 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors flex items-center gap-3 px-4">
                                        <Users size={18} /> Manage Users
                                    </button>
                                    <button className="w-full py-3 bg-slate-800 text-white rounded-xl text-sm font-bold hover:bg-slate-700 transition-colors flex items-center gap-3 px-4">
                                        <Shield size={18} className="text-emerald-400" /> Audit Security Logs
                                    </button>
                                </div>
                            </div>
                            <div className="mt-8 text-center text-xs text-indigo-300/50 font-mono">
                                Version 4.2.0 <span className="text-emerald-500 ml-2">● Stable</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* === USERS TAB === */}
            {activeTab === 'Users' && (
                <div className="animate-in fade-in space-y-6">
                    {/* User Filters */}
                    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 flex gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                            <input 
                                type="text" 
                                placeholder="Search by name, email, or role..." 
                                className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 text-white"
                                value={userSearch}
                                onChange={(e) => setUserSearch(e.target.value)}
                            />
                        </div>
                        <button className="px-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-slate-400 hover:text-white flex items-center gap-2">
                            <Filter size={20} /> <span className="hidden md:inline">Filter</span>
                        </button>
                        <button className="px-4 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-500">
                            <Plus size={20} /> <span className="hidden md:inline">Add User</span>
                        </button>
                    </div>

                    {/* Users Table */}
                    <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-bold tracking-wider">
                                    <tr>
                                        <th className="p-6">User Identity</th>
                                        <th className="p-6">Role</th>
                                        <th className="p-6">Joined Date</th>
                                        <th className="p-6">Status</th>
                                        <th className="p-6 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800 text-sm">
                                    {MOCK_USERS.filter(u => 
                                        u.name.toLowerCase().includes(userSearch.toLowerCase()) || 
                                        u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
                                        u.role.toLowerCase().includes(userSearch.toLowerCase())
                                    ).map(u => (
                                        <tr key={u.id} className="hover:bg-slate-800/50 transition-colors group">
                                            <td className="p-6">
                                                <div className="font-bold text-white">{u.name}</div>
                                                <div className="text-xs text-slate-500">{u.email}</div>
                                            </td>
                                            <td className="p-6 text-slate-300">
                                                <span className="bg-slate-800 px-2 py-1 rounded text-xs border border-slate-700">{u.role}</span>
                                            </td>
                                            <td className="p-6 text-slate-400 font-mono text-xs">{u.joined}</td>
                                            <td className="p-6">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                                    u.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                                    u.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                                    'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                                }`}>
                                                    {u.status}
                                                </span>
                                            </td>
                                            <td className="p-6 text-right">
                                                <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                    <button className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors">
                                                        <Edit3 size={16} />
                                                    </button>
                                                    <button className="p-2 hover:bg-rose-900/30 rounded-lg text-slate-400 hover:text-rose-500 transition-colors">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* === CONTENT TAB === */}
            {activeTab === 'Content' && (
                <div className="animate-in fade-in space-y-8">
                    
                    {/* Creation Mode Switcher */}
                    {creationMode === null && !editingCourse && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <button 
                                onClick={() => { setCreationMode('ai'); setAiSubMode('select'); }}
                                className="p-8 bg-gradient-to-br from-indigo-900/50 to-purple-900/50 rounded-3xl border border-indigo-500/30 hover:border-indigo-500 transition-all flex flex-col items-center text-center group"
                            >
                                <div className="w-16 h-16 bg-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-indigo-500/30 group-hover:scale-110 transition-transform">
                                    <BrainCircuit size={32} />
                                </div>
                                <h3 className="text-xl font-bold mb-2">AI Generator</h3>
                                <p className="text-slate-400 text-sm">Create courses from files, topics, or market trends.</p>
                            </button>

                            <button 
                                onClick={() => setCreationMode('manual')}
                                className="p-8 bg-slate-900 rounded-3xl border border-slate-800 hover:border-slate-600 transition-all flex flex-col items-center text-center group"
                            >
                                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                    <PenTool size={32} className="text-slate-300" />
                                </div>
                                <h3 className="text-xl font-bold mb-2">Manual Builder</h3>
                                <p className="text-slate-400 text-sm">Build from scratch. Define modules, upload content, and set quizzes manually.</p>
                            </button>
                        </div>
                    )}

                    {/* AI Generator Panel */}
                    {creationMode === 'ai' && (
                        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 relative flex flex-col min-h-[400px]">
                            <button onClick={() => { setCreationMode(null); setAiSubMode('select'); }} className="absolute top-4 right-4 p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white z-10"><X size={20}/></button>
                            
                            <h3 className="text-xl font-bold mb-6 flex items-center gap-2"><BrainCircuit className="text-indigo-500"/> AI Course Generator</h3>
                            
                            {/* ... AI SUB-MODES (Select, Upload, Topic, Market) ... */}
                            {aiSubMode === 'select' && (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 items-center">
                                    <button onClick={() => setAiSubMode('upload')} className="p-6 bg-slate-800/50 border border-slate-700 hover:border-indigo-500 rounded-2xl flex flex-col items-center text-center hover:bg-slate-800 transition-all group h-full">
                                        <UploadCloud size={40} className="text-slate-400 group-hover:text-indigo-400 mb-4" />
                                        <h4 className="font-bold text-white mb-2">Upload Source File</h4>
                                        <p className="text-xs text-slate-500">PDF, DOCX, or PPTX</p>
                                    </button>
                                    <button onClick={() => setAiSubMode('topic')} className="p-6 bg-slate-800/50 border border-slate-700 hover:border-purple-500 rounded-2xl flex flex-col items-center text-center hover:bg-slate-800 transition-all group h-full">
                                        <Sparkles size={40} className="text-slate-400 group-hover:text-purple-400 mb-4" />
                                        <h4 className="font-bold text-white mb-2">Topic Prompt</h4>
                                        <p className="text-xs text-slate-500">Generate from title & goals</p>
                                    </button>
                                    <button onClick={() => setAiSubMode('market')} className="p-6 bg-slate-800/50 border border-slate-700 hover:border-emerald-500 rounded-2xl flex flex-col items-center text-center hover:bg-slate-800 transition-all group h-full">
                                        <TrendingUp size={40} className="text-slate-400 group-hover:text-emerald-400 mb-4" />
                                        <h4 className="font-bold text-white mb-2">Market Intelligence</h4>
                                        <p className="text-xs text-slate-500">Suggest based on job data</p>
                                    </button>
                                </div>
                            )}

                            {/* UPLOAD SUB-MODE */}
                            {aiSubMode === 'upload' && (
                                <div className="flex-1 flex flex-col justify-center items-center">
                                    {file ? (
                                        <div className="text-center animate-in zoom-in">
                                            {processingStep < 4 ? (
                                                <>
                                                    <Loader2 size={48} className="animate-spin text-indigo-500 mx-auto mb-6" />
                                                    <h3 className="text-xl font-bold mb-2">Processing {file.name}...</h3>
                                                    <p className="text-slate-400 text-sm mb-6">
                                                        {processingStep === 1 ? "Ingesting vector embeddings..." : 
                                                            processingStep === 2 ? "Structuring learning modules..." : 
                                                            "Generating contrarian exam questions..."}
                                                    </p>
                                                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden max-w-xs mx-auto">
                                                        <div className="bg-indigo-500 h-full transition-all duration-1000" style={{ width: `${processingStep * 33}%` }}></div>
                                                    </div>
                                                </>
                                            ) : (
                                                <div className="text-center">
                                                    <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-6">
                                                        <CheckCircle2 size={32} className="text-white" />
                                                    </div>
                                                    <h3 className="text-xl font-bold mb-2 text-white">Generation Complete</h3>
                                                    <p className="text-slate-400 text-sm">Course has been added to the library.</p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div 
                                            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                                            onDragLeave={() => setIsDragging(false)}
                                            onDrop={handleDrop}
                                            className={`border-2 border-dashed rounded-2xl h-64 w-full flex flex-col items-center justify-center transition-all ${
                                                isDragging ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'
                                            }`}
                                        >
                                            <UploadCloud size={48} className="text-slate-500 mb-4" />
                                            <div className="text-slate-300 font-bold">Drop Source File</div>
                                            <div className="text-xs text-slate-500 mt-2">PDF, PPTX, DOCX</div>
                                            <input type="file" className="hidden" onChange={(e) => { if(e.target.files && e.target.files[0]) { setFile(e.target.files[0]); handleProcessAIUpload(); } }} id="file-upload" />
                                            <label htmlFor="file-upload" className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-bold cursor-pointer transition-colors">Browse Files</label>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* TOPIC SUB-MODE */}
                            {aiSubMode === 'topic' && (
                                <div className="flex-1 flex flex-col justify-center max-w-xl mx-auto w-full">
                                    {isGeneratingTopic ? (
                                        <div className="text-center">
                                            <Loader2 size={48} className="animate-spin text-purple-500 mx-auto mb-6" />
                                            <h3 className="text-xl font-bold mb-2">Architecting Course...</h3>
                                            <p className="text-slate-400">Designing modules, outcomes, and materials.</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-6">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Course Topic</label>
                                                <input 
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white outline-none focus:border-purple-500" 
                                                    placeholder="e.g. Advanced React Design Patterns" 
                                                    value={topicInput}
                                                    onChange={(e) => setTopicInput(e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Target Audience / Focus</label>
                                                <input 
                                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white outline-none focus:border-purple-500" 
                                                    placeholder="e.g. Senior Developers, Performance Optimization" 
                                                    value={focusInput}
                                                    onChange={(e) => setFocusInput(e.target.value)}
                                                />
                                            </div>
                                            <button 
                                                onClick={() => handleGenerateFromTopic(topicInput, focusInput)}
                                                disabled={!topicInput || !focusInput}
                                                className="w-full py-4 bg-purple-600 text-white font-bold rounded-xl hover:bg-purple-500 transition-colors shadow-lg shadow-purple-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                            >
                                                <Sparkles size={18} /> Generate Course
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* MARKET SUB-MODE */}
                            {aiSubMode === 'market' && (
                                <div className="flex-1 flex flex-col">
                                    {isLoadingMarket ? (
                                        <div className="flex-1 flex flex-col items-center justify-center">
                                            <Loader2 size={48} className="animate-spin text-emerald-500 mb-6" />
                                            <h3 className="text-xl font-bold mb-2">Analyzing Job Market...</h3>
                                            <p className="text-slate-400">Scanning for supply/demand gaps.</p>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full">
                                            {marketSuggestions.map((suggestion, i) => (
                                                <div key={i} className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6 flex flex-col hover:border-emerald-500 transition-colors">
                                                    <div className="flex items-center gap-2 mb-4 text-emerald-400 font-bold text-xs uppercase tracking-widest">
                                                        <TrendingUp size={14} /> High Demand
                                                    </div>
                                                    <h3 className="text-lg font-bold text-white mb-2">{suggestion.title}</h3>
                                                    <p className="text-sm text-slate-400 mb-6 flex-1">{suggestion.reason}</p>
                                                    <button 
                                                        onClick={() => handleGenerateFromTopic(suggestion.topic, suggestion.audience)}
                                                        className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors text-xs"
                                                    >
                                                        Generate This Course
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Manual Creator Panel */}
                    {creationMode === 'manual' && (
                        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold flex items-center gap-2"><PenTool className="text-emerald-500"/> Create New Course</h3>
                                <button onClick={() => { setCreationMode(null); setFormData({}); setEditingModuleIndex(null); }} className="text-slate-400 hover:text-white"><X size={20}/></button>
                            </div>
                            
                            <div className="space-y-6">
                                {/* ... Basic Fields ... */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Course Title</label>
                                        <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500" value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="e.g. Advanced Leadership" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Category</label>
                                        <input className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500" value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value})} placeholder="e.g. Management" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Description</label>
                                    <textarea className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-emerald-500 h-24 resize-none" value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Course overview..." />
                                </div>

                                {/* Module Builder */}
                                <div className="border-t border-slate-800 pt-6">
                                    <h4 className="font-bold text-white mb-4 flex items-center gap-2"><List size={16}/> Modules</h4>
                                    
                                    <div className="space-y-3 mb-4">
                                        {formData.modules?.map((mod, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                                                <div className="flex items-center gap-3">
                                                    <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-400">{i+1}</span>
                                                    <div>
                                                        <div className="text-sm font-bold text-white">{mod.title}</div>
                                                        <div className="text-xs text-slate-500">{mod.type} • {mod.duration}</div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => openModuleModal(i, false)} className="text-slate-400 hover:text-indigo-400"><Edit3 size={16}/></button>
                                                    <button onClick={() => handleDeleteModule(i, false)} className="text-rose-500 hover:text-rose-400"><Trash2 size={16}/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <button onClick={() => openModuleModal(null, false)} className="w-full py-3 border border-dashed border-slate-700 hover:border-emerald-500 rounded-xl text-slate-500 hover:text-emerald-500 flex items-center justify-center gap-2 text-sm font-bold transition-all">
                                        <Plus size={16}/> Add Module
                                    </button>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button onClick={handleSaveManual} className="px-6 py-3 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-500 flex items-center gap-2">
                                        <Save size={18}/> Save Course
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Course Editor Panel (Main Edit Mode) */}
                    {editingCourse && (
                        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8 animate-in slide-in-from-right">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold flex items-center gap-2 text-indigo-400"><Edit3 size={20}/> Editing: {editingCourse.title}</h3>
                                <button onClick={() => { setEditingCourse(null); setEditingModuleIndex(null); }} className="text-slate-400 hover:text-white"><X size={20}/></button>
                            </div>
                            
                            <div className="space-y-6">
                                {/* ... Basic Fields ... */}
                                <div className="grid grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Title</label>
                                        <input 
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-indigo-500" 
                                            value={editingCourse.title} 
                                            onChange={e => setEditingCourse({...editingCourse, title: e.target.value})} 
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Duration</label>
                                        <input 
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-indigo-500" 
                                            value={editingCourse.duration} 
                                            onChange={e => setEditingCourse({...editingCourse, duration: e.target.value})} 
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Description</label>
                                    <textarea 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-indigo-500 h-24 resize-none" 
                                        value={editingCourse.description || ''} 
                                        onChange={e => setEditingCourse({...editingCourse, description: e.target.value})} 
                                    />
                                </div>

                                {/* Module Builder */}
                                <div className="border-t border-slate-800 pt-6">
                                    <h4 className="font-bold text-white mb-4">Modules</h4>
                                    <div className="space-y-3 mb-4">
                                        {editingCourse.modules.map((mod, i) => (
                                            <div key={i} className={`flex items-center justify-between p-3 rounded-xl border ${editingModuleIndex === i ? 'bg-indigo-900/20 border-indigo-500' : 'bg-slate-950 border-slate-800'}`}>
                                                <div className="flex items-center gap-3">
                                                    {mod.type === 'Video' && <Video size={14} className="text-slate-500" />}
                                                    {mod.type === 'Audio' && <Headphones size={14} className="text-slate-500" />}
                                                    {mod.type === 'Slides' && <Presentation size={14} className="text-slate-500" />}
                                                    <span className="text-sm font-bold text-white">{mod.title}</span>
                                                    <span className="text-xs text-slate-500">({mod.duration})</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button onClick={() => openModuleModal(i, true)} className="text-slate-400 hover:text-indigo-400"><Edit3 size={16}/></button>
                                                    <button onClick={() => handleDeleteModule(i, true)} className="text-rose-500 hover:text-rose-400"><Trash2 size={16}/></button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <button onClick={() => openModuleModal(null, true)} className="w-full py-3 border border-dashed border-slate-700 hover:border-indigo-500 rounded-xl text-slate-500 hover:text-indigo-500 flex items-center justify-center gap-2 text-sm font-bold transition-all">
                                        <Plus size={16}/> Add Module
                                    </button>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <button onClick={handleSaveEdit} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-500 flex items-center gap-2">
                                        <Save size={18}/> {courses.find(c => c.id === editingCourse.id) ? 'Update Course' : 'Create Course'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. Library Management Table (unchanged) */}
                    {!editingCourse && creationMode === null && (
                        <div className="bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden">
                            <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                                <h3 className="font-bold text-lg">Course Library</h3>
                                <div className="text-xs text-slate-500 font-mono">{courses.length} ASSETS</div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-slate-950 text-slate-400 text-xs uppercase font-bold tracking-wider">
                                        <tr>
                                            <th className="p-6">Course Title</th>
                                            <th className="p-6">Category</th>
                                            <th className="p-6">Students</th>
                                            <th className="p-6">Rating</th>
                                            <th className="p-6 text-right">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800 text-sm">
                                        {courses.map(c => (
                                            <tr key={c.id} className="hover:bg-slate-800/50 transition-colors group">
                                                <td className="p-6 font-bold text-white flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-lg ${c.imageColor}`}></div>
                                                    {c.title}
                                                </td>
                                                <td className="p-6 text-slate-400">
                                                    <span className="bg-slate-800 px-2 py-1 rounded text-xs border border-slate-700">{c.category}</span>
                                                </td>
                                                <td className="p-6 text-slate-300 font-mono">{c.students}</td>
                                                <td className="p-6 text-yellow-400 font-bold flex items-center gap-1">
                                                    <span className="text-xs">★</span> {c.rating}
                                                </td>
                                                <td className="p-6 text-right">
                                                    <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition-opacity">
                                                        <button 
                                                            onClick={() => setEditingCourse(c)}
                                                            className="p-2 hover:bg-indigo-600 hover:text-white rounded-lg text-slate-400 transition-colors" title="Edit Course"
                                                        >
                                                            <Edit3 size={16} />
                                                        </button>
                                                        <button className="p-2 hover:bg-rose-900/30 rounded-lg text-slate-400 hover:text-rose-500 transition-colors">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* === MODULE EDIT MODAL === */}
            {showModuleModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowModuleModal(false)}></div>
                    <div className="relative w-full max-w-2xl bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Layers size={20} className="text-indigo-500"/>
                                {editingModuleIndex !== null ? 'Edit Module' : 'Add New Module'}
                            </h3>
                            <button onClick={() => setShowModuleModal(false)} className="text-slate-400 hover:text-white"><X size={20}/></button>
                        </div>
                        
                        <div className="p-6 flex-1 overflow-y-auto space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Module Title</label>
                                    <input 
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-indigo-500"
                                        placeholder="e.g. Introduction to Strategy"
                                        value={currentModule.title}
                                        onChange={e => setCurrentModule({...currentModule, title: e.target.value})}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Duration</label>
                                        <input 
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-indigo-500"
                                            placeholder="10 mins"
                                            value={currentModule.duration}
                                            onChange={e => setCurrentModule({...currentModule, duration: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Type</label>
                                        <select 
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white outline-none focus:border-indigo-500"
                                            value={currentModule.type}
                                            onChange={e => setCurrentModule({...currentModule, type: e.target.value as any})}
                                        >
                                            <option value="Reading">Reading</option>
                                            <option value="Video">Video</option>
                                            <option value="Audio">Audio</option>
                                            <option value="Slides">Slides</option>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="h-full flex flex-col">
                                <div className="flex justify-between items-center mb-2">
                                    <label className="block text-xs font-bold text-slate-500 uppercase">Module Content (Markdown)</label>
                                    <button 
                                        onClick={handleEnhanceContent}
                                        disabled={isEnhancing || !currentModule.content}
                                        className="text-xs font-bold bg-indigo-500/10 text-indigo-400 px-3 py-1 rounded-lg border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-colors flex items-center gap-1"
                                    >
                                        {isEnhancing ? <Loader2 className="animate-spin" size={12}/> : <Sparkles size={12}/>}
                                        AI Auto-Format
                                    </button>
                                </div>
                                <textarea 
                                    className="w-full min-h-[300px] bg-slate-950 border border-slate-800 rounded-xl p-4 text-white outline-none focus:border-indigo-500 font-mono text-sm leading-relaxed resize-none flex-1"
                                    placeholder={currentModule.type === 'Slides' ? "Paste raw text here and click 'AI Auto-Format' to generate slides." : "# Lesson Header\n\nWrite your course content here using markdown..."}
                                    value={currentModule.content || ''}
                                    onChange={e => setCurrentModule({...currentModule, content: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-800 flex justify-end gap-3">
                            <button onClick={() => setShowModuleModal(false)} className="px-4 py-2 text-slate-400 hover:text-white font-bold">Cancel</button>
                            <button onClick={saveModuleFromModal} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 shadow-lg">
                                {editingModuleIndex !== null ? 'Save Changes' : 'Add Module'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* === SYSTEM TAB (unchanged) === */}
            {activeTab === 'System' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in">
                    {/* ... (System tab content remains the same) ... */}
                    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                            <Server size={20} className="text-slate-400" /> System Configuration
                        </h3>
                        <div className="space-y-6">
                            {['Maintenance Mode', 'Allow New Signups', 'Beta Features', 'Debug Logging'].map(setting => (
                                <div key={setting} className="flex items-center justify-between p-4 bg-slate-950 rounded-xl border border-slate-800">
                                    <span className="font-bold text-sm text-slate-300">{setting}</span>
                                    <button className="w-12 h-6 bg-slate-800 rounded-full relative transition-colors hover:bg-slate-700">
                                        <div className="absolute left-1 top-1 w-4 h-4 bg-slate-500 rounded-full transition-transform"></div>
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="bg-slate-900 rounded-3xl border border-slate-800 p-8">
                        <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                            <Activity size={20} className="text-emerald-400" /> API Usage
                        </h3>
                        <div className="space-y-6">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-400">Gemini Pro Tokens</span>
                                    <span className="text-white font-bold">14.2M / 20M</span>
                                </div>
                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div className="bg-emerald-500 h-full w-[70%]"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-400">Image Generation</span>
                                    <span className="text-white font-bold">850 / 1000</span>
                                </div>
                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div className="bg-indigo-500 h-full w-[85%]"></div>
                                </div>
                            </div>
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-slate-400">Storage (S3)</span>
                                    <span className="text-white font-bold">450GB / 1TB</span>
                                </div>
                                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                                    <div className="bg-blue-500 h-full w-[45%]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
