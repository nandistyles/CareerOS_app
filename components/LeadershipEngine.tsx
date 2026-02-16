
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Course, EnrolledCourse, QuizQuestion, CoachingSession } from '../types';
import { GraduationCap, BookOpen, Users, Play, FileText, Bot, Send, Award, ChevronRight, Lock, Clock, CheckCircle2, AlertCircle, TrendingUp, Target, Brain, Zap, Layout, Star, ArrowRight, Sparkles, BarChart3, Search, Bookmark, Share2, Volume2, Maximize2, Minimize2, ChevronLeft, MoreHorizontal, RotateCcw, Calendar, MessageSquare, Mic, Video, Pause, X, QrCode, ShieldCheck, Loader2 } from 'lucide-react';
import { chatWithMentor } from '../services/geminiService';

interface LeadershipEngineProps {
    user: UserProfile;
    onUpdateUser: (user: UserProfile) => void;
    courses: Course[];
}

// Mock Data for "NotebookLM" style Audio Overview
const AUDIO_BRIEF_DURATION = "12:45";

// Mock Human Mentors
const MENTORS = [
    { id: 'm1', name: 'Dr. Sarah Ndlovu', role: 'Ex-Procurement Director', company: 'Mining Corp', expertise: ['Governance', 'Ethics'], rate: '$150/hr', image: 'bg-purple-100 text-purple-600' },
    { id: 'm2', name: 'James Carter', role: 'Strategy Partner', company: 'Global Consult', expertise: ['Career Pivot', 'Salary Neg.'], rate: '$200/hr', image: 'bg-blue-100 text-blue-600' },
    { id: 'm3', name: 'Tendai M.', role: 'Chief Engineer', company: 'InfraBuild', expertise: ['Technical Leadership'], rate: '$120/hr', image: 'bg-emerald-100 text-emerald-600' },
];

export const LeadershipEngine: React.FC<LeadershipEngineProps> = ({ user, onUpdateUser, courses }) => {
    const [activeTab, setActiveTab] = useState<'Academy' | 'Coaching'>('Academy');
    
    // Academy State
    const [viewMode, setViewMode] = useState<'Dashboard' | 'CourseDetail' | 'StudyRoom' | 'Exam' | 'Certified'>('Dashboard');
    const [activeCourse, setActiveCourse] = useState<Course | null>(null);
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    
    // Coaching State
    const [coachView, setCoachView] = useState<'AI' | 'Human'>('AI');
    const [atlasMessages, setAtlasMessages] = useState<{role: 'user'|'ai', text: string}[]>([
        { role: 'ai', text: "Hello. I am Atlas, your Executive Career Strategist. I'm here to help you navigate office politics, negotiate salaries, or plan your next promotion. What's on your mind?" }
    ]);
    const [atlasInput, setAtlasInput] = useState('');
    const [isAtlasTyping, setIsAtlasTyping] = useState(false);
    const [showVideoRoom, setShowVideoRoom] = useState(false);
    
    // Study Room State
    const [studyTab, setStudyTab] = useState<'Chat' | 'Flashcards' | 'Notes'>('Chat');
    const [chatMessages, setChatMessages] = useState<{role: 'user'|'ai', text: string}[]>([]);
    const [chatInput, setChatInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isImmersive, setIsImmersive] = useState(false);
    
    // Exam State
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [examScore, setExamScore] = useState(0);

    // Derived State
    const completedCount = user.enrolledCourses?.filter(c => c.status === 'Completed').length || 0;
    
    // Skill Radar Data (Dynamic based on completed courses)
    const [skillData, setSkillData] = useState([
        { name: 'Strategy', level: 40 },
        { name: 'Finance', level: 30 },
        { name: 'Ops', level: 50 },
        { name: 'Leadership', level: 45 },
        { name: 'Comp', level: 60 } // Compliance
    ]);

    const handleRecalibrate = () => {
        // Mock recalibration - randomize slightly to show liveliness
        const newData = skillData.map(s => ({
            ...s,
            level: Math.min(100, Math.max(20, s.level + (Math.random() > 0.5 ? 10 : -5)))
        }));
        setSkillData(newData);
    };

    const chatScrollRef = useRef<HTMLDivElement>(null);
    const atlasScrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (chatScrollRef.current) chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        if (atlasScrollRef.current) atlasScrollRef.current.scrollTop = atlasScrollRef.current.scrollHeight;
    }, [chatMessages, atlasMessages, studyTab, coachView]);

    // --- Actions ---

    const handleStartCourse = (course: Course) => {
        setActiveCourse(course);
        const isEnrolled = user.enrolledCourses?.find(c => c.id === course.id);
        if (!isEnrolled) {
            const newEnrollment: EnrolledCourse = { ...course, progress: 0, status: 'In Progress' };
            onUpdateUser({ ...user, enrolledCourses: [...(user.enrolledCourses || []), newEnrollment] });
        }
        setViewMode('CourseDetail');
    };

    const enterStudyRoom = () => {
        setViewMode('StudyRoom');
        if (chatMessages.length === 0) {
            setChatMessages([{ role: 'ai', text: `Welcome to the workspace for "${activeCourse?.title}". I've analyzed the entire syllabus. \n\nI can create a quiz, summarize key concepts, or we can roleplay a scenario. What would you like to do?` }]);
        }
    };

    const handleSendAtlas = async () => {
        if (!atlasInput.trim()) return;
        const newMsgs = [...atlasMessages, { role: 'user' as const, text: atlasInput }];
        setAtlasMessages(newMsgs);
        setAtlasInput('');
        setIsAtlasTyping(true);

        const response = await chatWithMentor(
            atlasInput, 
            "Atlas, an Executive Career Strategist. You are tough, direct, and highly strategic. Focus on high-level corporate politics, salary negotiation, and leadership presence.",
            atlasMessages
        );

        setAtlasMessages(prev => [...prev, { role: 'ai', text: response }]);
        setIsAtlasTyping(false);
    };

    const handleBookMentor = (mentorName: string) => {
        const newSession: CoachingSession = {
            id: `sess-${Date.now()}`,
            type: 'Human-Mentor', // Fixed from '1-on-1' to match type definition
            coachName: mentorName,
            date: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0], // 2 days later
            topic: 'Career Strategy',
            status: 'Scheduled'
        };
        onUpdateUser({ ...user, coachingSessions: [...(user.coachingSessions || []), newSession] });
        alert(`Session confirmed with ${mentorName} for ${newSession.date}. Added to schedule.`);
    };

    const handleSendMessage = async () => {
        if (!chatInput.trim()) return;
        const newMsgs = [...chatMessages, { role: 'user' as const, text: chatInput }];
        setChatMessages(newMsgs);
        setChatInput('');
        setIsTyping(true);

        const response = await chatWithMentor(
            chatInput,
            `An AI Socratic Tutor for the course "${activeCourse?.title}". You are explaining concepts from the course module. Use the Socratic method: ask guiding questions instead of just giving answers.`,
            chatMessages
        );
        
        setChatMessages(prev => [...prev, { role: 'ai', text: response }]);
        setIsTyping(false);
    };

    const finishExam = (score: number) => {
        if (!activeCourse?.exam) return;
        const passed = (score / activeCourse.exam.length) >= 0.5;
        
        if (passed) {
            const updatedEnrolled = user.enrolledCourses?.map(c => c.id === activeCourse.id ? { ...c, status: 'Completed', progress: 100 } : c) || [];
            const newKeywords = Array.from(new Set([...(user.keywords || []), activeCourse.category]));
            onUpdateUser({ 
                ...user, 
                enrolledCourses: updatedEnrolled as EnrolledCourse[],
                keywords: newKeywords,
                scaleScore: (user.scaleScore || 500) + 50
            });
            setViewMode('Certified');
        } else {
            alert("Score: " + Math.round((score/activeCourse.exam.length)*100) + "%. You need 50% to pass. Review the material and try again.");
            setViewMode('StudyRoom');
        }
    };

    const RadarChart = () => {
        const size = 200;
        const center = size / 2;
        const radius = 80;
        const angleSlice = (Math.PI * 2) / 5;

        const getCoords = (value: number, index: number) => {
            const angle = index * angleSlice - Math.PI / 2;
            return {
                x: center + radius * (value / 100) * Math.cos(angle),
                y: center + radius * (value / 100) * Math.sin(angle)
            };
        };

        const currentPoints = skillData.map((s, i) => getCoords(s.level, i)).map(p => `${p.x},${p.y}`).join(' ');

        return (
            <div className="relative flex items-center justify-center h-64 w-full">
                <svg width={size} height={size} className="overflow-visible transform rotate-0 hover:scale-105 transition-transform duration-500">
                    {[25, 50, 75, 100].map(level => (
                        <polygon 
                            key={level}
                            points={skillData.map((_, i) => {
                                const {x, y} = getCoords(level, i);
                                return `${x},${y}`;
                            }).join(' ')}
                            fill="none"
                            stroke="currentColor"
                            className="text-slate-200 dark:text-slate-800"
                            strokeWidth="1"
                        />
                    ))}
                    <polygon points={currentPoints} fill="rgba(99, 102, 241, 0.2)" stroke="#6366f1" strokeWidth="2" className="drop-shadow-lg transition-all duration-700 ease-out" />
                    {skillData.map((s, i) => {
                        const {x, y} = getCoords(115, i);
                        return (
                            <text key={i} x={x} y={y} textAnchor="middle" dominantBaseline="middle" className="text-[10px] font-bold fill-slate-500 dark:fill-slate-400 uppercase tracking-widest">
                                {s.name}
                            </text>
                        );
                    })}
                </svg>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                    <div className="text-xs font-bold text-slate-400">GAP</div>
                    <div className="text-lg font-bold text-slate-900 dark:text-white">
                        {Math.round(skillData.reduce((acc, s) => acc + s.level, 0) / 5)}%
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 md:p-12 pb-32 min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19] transition-colors relative">
            
            {/* Header with Switcher */}
            <header className="mb-10">
                <div className="flex flex-col md:flex-row justify-between items-end gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-3 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl shadow-lg shadow-indigo-500/20">
                                {activeTab === 'Academy' ? <GraduationCap className="text-white" size={28} /> : <Users className="text-white" size={28} />}
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Leadership Engine</h1>
                        </div>
                        <p className="text-lg text-slate-500 dark:text-slate-400">
                            {activeTab === 'Academy' ? 'AI-driven upskilling to maximize market value.' : 'Executive mentoring and strategic career advice.'}
                        </p>
                    </div>
                    
                    {/* Switcher */}
                    <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex">
                        <button 
                            onClick={() => setActiveTab('Academy')} 
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'Academy' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            <GraduationCap size={16} /> Academy
                        </button>
                        <button 
                            onClick={() => setActiveTab('Coaching')} 
                            className={`px-6 py-2.5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${activeTab === 'Coaching' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
                        >
                            <Users size={16} /> Coaching
                        </button>
                    </div>
                </div>
            </header>

            {/* === COACHING TAB === */}
            {activeTab === 'Coaching' && (
                <div className="animate-in fade-in">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-250px)] min-h-[600px]">
                        
                        {/* LEFT: AI Executive Coach (Atlas) */}
                        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden flex flex-col">
                            <div className="p-6 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg">
                                        <Bot className="text-white" size={20} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-white">Atlas</h3>
                                        <div className="text-xs text-slate-500">Executive AI Mentor • 24/7</div>
                                    </div>
                                </div>
                                <button className="text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-lg font-bold hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                    Clear History
                                </button>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-6" ref={atlasScrollRef}>
                                {atlasMessages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                                            msg.role === 'user' 
                                            ? 'bg-indigo-600 text-white rounded-br-none' 
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-bl-none'
                                        }`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {isAtlasTyping && (
                                    <div className="flex justify-start">
                                        <div className="bg-slate-100 dark:bg-slate-800 p-4 rounded-2xl rounded-bl-none">
                                            <div className="flex gap-1">
                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></div>
                                                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
                                <div className="relative">
                                    <input 
                                        value={atlasInput}
                                        onChange={(e) => setAtlasInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendAtlas()}
                                        placeholder="Ask for advice on leadership, conflict, or strategy..."
                                        className="w-full pl-6 pr-12 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl outline-none focus:border-indigo-500 transition-colors shadow-sm dark:text-white"
                                        disabled={isAtlasTyping}
                                    />
                                    <button 
                                        onClick={handleSendAtlas}
                                        disabled={!atlasInput.trim() || isAtlasTyping}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 transition-colors disabled:opacity-50"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Human Mentors & Schedule */}
                        <div className="flex flex-col gap-6">
                            {/* Upcoming Sessions */}
                            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                                    <Calendar size={18} className="text-indigo-500" /> Upcoming Sessions
                                </h3>
                                {user.coachingSessions && user.coachingSessions.length > 0 ? (
                                    <div className="space-y-3">
                                        {user.coachingSessions.map(sess => (
                                            <div key={sess.id} className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                                                <div className="flex justify-between items-start mb-1">
                                                    <span className="font-bold text-sm text-slate-900 dark:text-white">{sess.coachName}</span>
                                                    <span className="text-[10px] bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-300 px-2 py-0.5 rounded font-bold">Confirmed</span>
                                                </div>
                                                <div className="text-xs text-slate-500 mb-2">{sess.date} • {sess.topic}</div>
                                                <button 
                                                    onClick={() => setShowVideoRoom(true)}
                                                    className="w-full py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-600 flex items-center justify-center gap-1"
                                                >
                                                    <Video size={12} /> Join Room
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-slate-400 text-xs">
                                        No upcoming sessions.
                                    </div>
                                )}
                            </div>

                            {/* Book a Mentor */}
                            <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-xl overflow-y-auto custom-scrollbar">
                                <h3 className="font-bold text-slate-900 dark:text-white mb-4">Book an Expert</h3>
                                <div className="space-y-4">
                                    {MENTORS.map(mentor => (
                                        <div key={mentor.id} className="border border-slate-100 dark:border-slate-700 rounded-2xl p-4 hover:border-indigo-500 transition-colors group">
                                            <div className="flex items-center gap-3 mb-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${mentor.image}`}>
                                                    {mentor.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-sm text-slate-900 dark:text-white">{mentor.name}</div>
                                                    <div className="text-xs text-slate-500">{mentor.role}</div>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-1 mb-4">
                                                {mentor.expertise.map(e => (
                                                    <span key={e} className="text-[10px] bg-slate-50 dark:bg-slate-800 text-slate-500 px-2 py-1 rounded">
                                                        {e}
                                                    </span>
                                                ))}
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="font-bold text-sm text-slate-700 dark:text-slate-300">{mentor.rate}</span>
                                                <button 
                                                    onClick={() => handleBookMentor(mentor.name)}
                                                    className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold hover:opacity-90"
                                                >
                                                    Book
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* === ACADEMY TAB === */}
            {activeTab === 'Academy' && (
                <>
                    {/* ... (Keep existing dashboard logic) */}
                    {viewMode === 'Dashboard' && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in">
                            {/* ... */}
                            <div className="lg:col-span-1 space-y-6">
                                {/* ... Skill Radar ... */}
                                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] p-8 border border-slate-200 dark:border-slate-800 shadow-xl relative overflow-hidden">
                                    <div className="flex justify-between items-center mb-2 relative z-10">
                                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                            <Target size={18} className="text-rose-500"/> Skill Matrix
                                        </h3>
                                        <button 
                                            onClick={handleRecalibrate}
                                            className="text-[10px] font-bold bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full text-slate-500 hover:text-indigo-500 transition-colors"
                                        >
                                            Recalibrate
                                        </button>
                                    </div>
                                    <RadarChart />
                                </div>
                                {/* ... Daily Learning ... */}
                            </div>

                            <div className="lg:col-span-2 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                                {/* ... Recommended Courses ... */}
                                <section>
                                    <div className="flex justify-between items-end mb-4 ml-1">
                                        <div>
                                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider">Recommended For You</h3>
                                            <p className="text-xs text-slate-400 mt-1">Based on your goal: <strong>Win Government Tenders</strong></p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {courses.map(course => (
                                            <div key={course.id} className="group bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 overflow-hidden hover:shadow-2xl hover:shadow-indigo-500/10 transition-all cursor-pointer flex flex-col" onClick={() => handleStartCourse(course)}>
                                                <div className={`h-40 ${course.imageColor} relative p-6 flex flex-col justify-between overflow-hidden`}>
                                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                                                    <div className="relative z-10">
                                                        <span className="bg-black/20 backdrop-blur-md text-white text-[10px] font-bold px-3 py-1 rounded-full border border-white/10 uppercase tracking-wide">
                                                            {course.category}
                                                        </span>
                                                        <h3 className="font-bold text-xl text-white leading-tight mt-4 mb-1 drop-shadow-md">
                                                            {course.title}
                                                        </h3>
                                                    </div>
                                                </div>
                                                <div className="p-6 flex-1 flex flex-col justify-between">
                                                    <div className="flex items-center gap-4 text-xs text-slate-500 font-medium mb-4">
                                                        <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg"><Clock size={12}/> {course.duration}</span>
                                                        <span className="flex items-center gap-1 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg"><Users size={12}/> {course.students}</span>
                                                    </div>
                                                    <button className="w-full py-2 bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition-colors">Start Course</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </div>
                        </div>
                    )}

                    {viewMode === 'CourseDetail' && activeCourse && (
                        // ... (Existing Course Detail View)
                        <div className="fixed inset-0 z-[60] bg-white dark:bg-slate-950 overflow-y-auto animate-in slide-in-from-right duration-300">
                            {/* ... Header and Content ... */}
                            <div className={`h-[45vh] ${activeCourse.imageColor} relative`}>
                                <button onClick={() => setViewMode('Dashboard')} className="absolute top-6 left-6 bg-black/20 hover:bg-black/30 backdrop-blur-md text-white p-3 rounded-full transition-colors z-20">
                                    <ChevronLeft size={24} />
                                </button>
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                                <div className="absolute bottom-0 left-0 w-full p-8 md:p-12 max-w-5xl mx-auto">
                                    <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight animate-in slide-in-from-bottom-4 fade-in duration-700 delay-100">{activeCourse.title}</h1>
                                    <div className="flex flex-wrap gap-4 animate-in slide-in-from-bottom-4 fade-in duration-700 delay-300">
                                        <button 
                                            onClick={enterStudyRoom}
                                            className="px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:scale-105 transition-transform shadow-xl flex items-center gap-3 group"
                                        >
                                            <Play size={20} fill="currentColor" className="group-hover:text-indigo-600 transition-colors" /> 
                                            Start Learning
                                        </button>
                                    </div>
                                </div>
                            </div>
                            {/* ... (Rest of detail view logic) */}
                        </div>
                    )}

                    {viewMode === 'StudyRoom' && activeCourse && (
                        // ... (Existing Study Room)
                        <div className={`fixed inset-0 z-[60] flex flex-col bg-slate-50 dark:bg-[#0B0F19] animate-in fade-in transition-all duration-500 ${isImmersive ? 'bg-black text-slate-300' : ''}`}>
                            <div className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center px-6 shadow-sm z-20">
                                <button onClick={() => setViewMode('CourseDetail')}><ChevronLeft /></button>
                                <h2 className="font-bold">{activeCourse.title}</h2>
                                <button 
                                    onClick={() => { setViewMode('Exam'); setCurrentQuestionIdx(0); setExamScore(0); }}
                                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold"
                                >
                                    Take Exam
                                </button>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center p-6">
                                <div className="w-full max-w-3xl h-full flex flex-col">
                                    <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                                        {chatMessages.length === 0 ? (
                                            <div className="text-center text-slate-500 py-20">
                                                <Bot size={48} className="mx-auto mb-4 opacity-30" />
                                                <p>I am your Socratic Tutor for this course. Ask me anything.</p>
                                            </div>
                                        ) : chatMessages.map((msg, i) => (
                                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[80%] p-4 rounded-2xl text-lg ${msg.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'}`}>
                                                    {msg.text}
                                                </div>
                                            </div>
                                        ))}
                                        {isTyping && (
                                            <div className="flex justify-start">
                                                <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700">
                                                    <Loader2 className="animate-spin text-slate-400" size={20} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="relative">
                                        <input 
                                            value={chatInput} 
                                            onChange={e => setChatInput(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                            className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 pr-12 text-slate-900 dark:text-white outline-none focus:border-indigo-500 shadow-sm"
                                            placeholder="Ask a question about the material..."
                                            disabled={isTyping}
                                        />
                                        <button 
                                            onClick={handleSendMessage} 
                                            disabled={!chatInput.trim() || isTyping}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 rounded-lg hover:bg-indigo-500 text-white disabled:opacity-50"
                                        >
                                            <ArrowRight size={18} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {viewMode === 'Exam' && activeCourse?.exam && (
                        // ... (Existing Exam View)
                        <div className="fixed inset-0 z-[60] bg-[#0B0F19] flex items-center justify-center p-6 animate-in zoom-in-95">
                            <div className="w-full max-w-2xl bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden relative shadow-2xl flex flex-col">
                                <div className="p-8 md:p-12">
                                    <h2 className="text-2xl md:text-3xl font-bold text-white mb-10 leading-snug">{activeCourse.exam[currentQuestionIdx].question}</h2>
                                    <div className="space-y-4">
                                        {activeCourse.exam[currentQuestionIdx].options.map((opt, i) => (
                                            <button 
                                                key={i}
                                                onClick={() => {
                                                    const nextScore = i === activeCourse.exam![currentQuestionIdx].correctAnswer ? examScore + 1 : examScore;
                                                    setExamScore(nextScore);
                                                    if (currentQuestionIdx < (activeCourse.exam?.length || 0) - 1) {
                                                        setCurrentQuestionIdx(prev => prev + 1);
                                                    } else {
                                                        finishExam(nextScore);
                                                    }
                                                }}
                                                className="w-full p-5 rounded-2xl border border-slate-700 bg-slate-800/50 text-left text-slate-300 hover:bg-white hover:text-slate-900 transition-all font-medium group flex items-center gap-4 text-lg"
                                            >
                                                <span className="w-8 h-8 rounded-full border border-slate-600 flex items-center justify-center text-sm font-bold group-hover:border-slate-900 group-hover:bg-slate-200 transition-colors">
                                                    {String.fromCharCode(65 + i)}
                                                </span>
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {viewMode === 'Certified' && (
                        <div className="fixed inset-0 z-[60] bg-slate-950 flex items-center justify-center p-6 animate-in zoom-in duration-700">
                            {/* PREMIUM CERTIFICATE DESIGN */}
                            <div className="relative w-full max-w-4xl aspect-[1.414/1] bg-[#FDFBF7] text-slate-900 shadow-2xl border-[16px] border-double border-slate-900 p-12 flex flex-col items-center justify-between overflow-hidden">
                                
                                {/* Security Background Pattern (Guilloche Simulation) */}
                                <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                                <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                                    <svg viewBox="0 0 200 200" className="w-full h-full animate-spin-slow" style={{animationDuration: '60s'}}>
                                        <path fill="currentColor" d="M42.7,-72.6C56.3,-65.8,68.8,-57.3,77.9,-46.3C87,-35.3,92.7,-21.8,92.2,-8.6C91.7,4.7,85,17.7,76.6,29.8C68.2,41.9,58.1,53.2,46.5,62.6C34.9,72,21.8,79.5,8.1,81.1C-5.6,82.8,-19.9,78.6,-33.1,71.5C-46.3,64.4,-58.4,54.4,-67.6,42.1C-76.8,29.8,-83.1,15.2,-82.3,0.9C-81.5,-13.4,-73.6,-27.4,-63.3,-38.7C-53,-50,-40.3,-58.6,-27.4,-65.9C-14.5,-73.2,-1.4,-79.2,12.2,-78.9C25.8,-78.6,51.6,-72,42.7,-72.6Z" transform="translate(100 100)" />
                                    </svg>
                                </div>

                                {/* Corner Decor */}
                                <div className="absolute top-0 left-0 w-32 h-32 border-t-4 border-l-4 border-amber-500"></div>
                                <div className="absolute top-0 right-0 w-32 h-32 border-t-4 border-r-4 border-amber-500"></div>
                                <div className="absolute bottom-0 left-0 w-32 h-32 border-b-4 border-l-4 border-amber-500"></div>
                                <div className="absolute bottom-0 right-0 w-32 h-32 border-b-4 border-r-4 border-amber-500"></div>

                                {/* Header */}
                                <div className="text-center relative z-10 mt-4">
                                    <div className="flex items-center justify-center gap-3 mb-2">
                                        <Award size={32} className="text-amber-500" />
                                        <span className="text-xs font-bold tracking-[0.3em] uppercase text-slate-500">Limitless Foundation</span>
                                    </div>
                                    <h1 className="text-6xl font-serif font-bold text-slate-900 mb-2 tracking-tight">CERTIFICATE</h1>
                                    <p className="text-sm font-bold tracking-[0.4em] uppercase text-amber-600">OF ACHIEVEMENT</p>
                                </div>

                                {/* Body */}
                                <div className="text-center relative z-10 max-w-2xl">
                                    <p className="text-slate-500 italic font-serif text-lg mb-6">This certificate is proudly presented to</p>
                                    <h2 className="text-5xl font-serif font-bold text-slate-900 border-b-2 border-slate-200 pb-4 mb-6 italic">{user.name}</h2>
                                    <p className="text-slate-600 leading-relaxed font-serif">
                                        For successfully completing the comprehensive executive course
                                        <br/>
                                        <strong className="text-slate-900 text-xl block mt-2">{activeCourse?.title}</strong>
                                    </p>
                                    <p className="text-xs text-slate-400 mt-4 uppercase tracking-widest">In Partnership with CareerOS Academy</p>
                                </div>

                                {/* Security Footer */}
                                <div className="w-full flex justify-between items-end relative z-10 mb-4 px-12">
                                    
                                    {/* Verification QR */}
                                    <div className="text-center flex flex-col items-center">
                                        <div className="bg-white p-2 border border-slate-200 mb-2">
                                            <QrCode size={48} className="text-slate-900" />
                                        </div>
                                        <div className="text-[8px] font-mono text-slate-400">ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}</div>
                                        <div className="text-[8px] font-bold text-slate-400 uppercase mt-1">Scan to Verify</div>
                                    </div>

                                    {/* Holographic Seal */}
                                    <div className="relative -mb-4">
                                        <div className="w-28 h-28 bg-gradient-to-br from-amber-300 via-yellow-400 to-amber-600 rounded-full flex items-center justify-center shadow-2xl border-4 border-amber-200 relative overflow-hidden group">
                                            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700 transform rotate-45 translate-x-full group-hover:-translate-x-full"></div>
                                            <div className="w-24 h-24 border border-amber-200/50 rounded-full flex flex-col items-center justify-center text-center">
                                                <ShieldCheck size={32} className="text-white drop-shadow-md mb-1" />
                                                <div className="text-[8px] font-bold text-white uppercase tracking-widest">Official<br/>Seal</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Signatures */}
                                    <div className="text-center">
                                        <div className="font-serif text-2xl text-slate-900 italic mb-1" style={{fontFamily: 'cursive'}}>Michael Chitenderu</div>
                                        <div className="w-40 h-px bg-slate-300 mx-auto"></div>
                                        <div className="text-[10px] font-bold text-slate-900 uppercase mt-2">Michael Chitenderu</div>
                                        <div className="text-[8px] font-bold text-amber-600 uppercase">Executive Director</div>
                                    </div>
                                </div>

                                {/* Close Button */}
                                <button 
                                    onClick={() => setViewMode('Dashboard')} 
                                    className="absolute top-4 right-4 bg-slate-900 text-white p-2 rounded-full hover:bg-slate-700 transition-colors z-50 print:hidden"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};
