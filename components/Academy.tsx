
import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Course, EnrolledCourse, CourseModule, QuizQuestion } from '../types';
import { GraduationCap, BookOpen, Play, CheckCircle2, Award, ChevronRight, Lock, Clock, Users, Mic, Headphones, FileText, BrainCircuit, Maximize2, Minimize2, MessageSquare, ArrowLeft, ArrowRight, RefreshCw, Zap, ShieldAlert, Swords, Loader2, Share2, Download, Check, QrCode, Presentation, ChevronLeft, Info, ListChecks, Signal, Target, Flag, Table, List, TrendingUp, PieChart, Activity, Pause, Volume2, VolumeX, Radio, Swords as SwordsIcon, Sparkles } from 'lucide-react';
import { chatWithMentor, generateQuiz, generateLearningPodcast, generateSimulationScenario, evaluateSimulation } from '../services/geminiService';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AcademyProps {
    user: UserProfile;
    onUpdateUser: (user: UserProfile) => void;
    courses: Course[];
    initialCourseId?: string;
    onChangeView?: (view: any) => void; // Added for redirection
}

// ... (Keep existing mocks & decoding functions)
// Mock Slides for the "Deconstruct" Phase
const MOCK_SLIDES = [
    { title: "The Monopoly Secret", content: "Competition is for losers. True growth comes from creating a monopoly.", notes: "Key takeaway: Aim for 10x improvement over closest substitute." },
    { title: "Vertical Progress", content: "Going from 0 to 1 (Technology) vs 1 to n (Globalization).", notes: "Most companies focus on 1 to n. You need to focus on 0 to 1." },
    { title: "Last Mover Advantage", content: "It's not about who starts first, but who finishes last. Capture the long-term value.", notes: "Case Study: Facebook vs MySpace." },
    { title: "The Contrarian Question", content: "What important truth do very few people agree with you on?", notes: "This is the hardest interview question to answer correctly." }
];

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

export const Academy: React.FC<AcademyProps> = ({ user, onUpdateUser, courses, initialCourseId, onChangeView }) => {
    const [viewMode, setViewMode] = useState<'Dashboard' | 'CourseBriefing' | 'DeepDive'>('Dashboard');
    const [activeCourse, setActiveCourse] = useState<Course | null>(null);
    const isPremium = user.isSubscribed;
    
    // ... (Keep existing State)
    const [activeModuleIndex, setActiveModuleIndex] = useState(0);
    const [moduleProgress, setModuleProgress] = useState<boolean[]>([]); 
    const [diveTab, setDiveTab] = useState<'Audio' | 'Deconstruct' | 'Simulation' | 'Checkpoint' | 'Challenge' | 'FinalExam'>('Audio');
    const [isPlaying, setIsPlaying] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [slideIdx, setSlideIdx] = useState(0);
    const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
    const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
    const startTimeRef = useRef<number>(0);
    const pauseTimeRef = useRef<number>(0);
    const [simState, setSimState] = useState<'Intro' | 'Active' | 'Feedback'>('Intro');
    const [simScenario, setSimScenario] = useState<{role: string, context: string, objective: string} | null>(null);
    const [simHistory, setSimHistory] = useState<{role: string, text: string}[]>([]);
    const [simInput, setSimInput] = useState('');
    const [simEvaluation, setSimEvaluation] = useState<{score: number, feedback: string, tips: string[]} | null>(null);
    const [isSimLoading, setIsSimLoading] = useState(false);
    const simScrollRef = useRef<HTMLDivElement>(null);
    const [quizMode, setQuizMode] = useState<'Module' | 'Final'>('Module');
    const [examState, setExamState] = useState<'Loading' | 'Intro' | 'InProgress' | 'Result' | 'Certified'>('Intro');
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);

    // --- Effects ---
    
    useEffect(() => {
        if (initialCourseId) {
            const target = courses.find(c => c.id === initialCourseId);
            if (target) {
                handleStartCourse(target);
            }
        }
    }, [initialCourseId, courses]);

    // ... (Keep existing Audio Logic)
    useEffect(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        }
        return () => {
            stopAudio();
            audioContextRef.current?.close();
        };
    }, []);

    useEffect(() => {
        if (simScrollRef.current) {
            simScrollRef.current.scrollTop = simScrollRef.current.scrollHeight;
        }
    }, [simHistory, simState]);

    const playAudio = () => {
        if (!audioBuffer || !audioContextRef.current) return;
        if (sourceNodeRef.current) sourceNodeRef.current.disconnect();
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBuffer;
        const gainNode = audioContextRef.current.createGain();
        gainNode.gain.value = isMuted ? 0 : 1;
        source.connect(gainNode);
        gainNode.connect(audioContextRef.current.destination);
        const offset = pauseTimeRef.current % audioBuffer.duration;
        source.start(0, offset);
        startTimeRef.current = audioContextRef.current.currentTime - offset;
        source.onended = () => { setIsPlaying(false); pauseTimeRef.current = 0; };
        sourceNodeRef.current = source;
        setIsPlaying(true);
    };

    const pauseAudio = () => {
        if (sourceNodeRef.current && audioContextRef.current) {
            sourceNodeRef.current.stop();
            pauseTimeRef.current = audioContextRef.current.currentTime - startTimeRef.current;
            setIsPlaying(false);
        }
    };

    const stopAudio = () => {
        if (sourceNodeRef.current) {
            sourceNodeRef.current.stop();
            sourceNodeRef.current.disconnect();
        }
        setIsPlaying(false);
        pauseTimeRef.current = 0;
    };

    const handleGeneratePodcast = async () => {
        const activeModule = activeCourse?.modules[activeModuleIndex];
        if (!activeModule) return;
        stopAudio();
        setIsGeneratingAudio(true);
        setAudioBuffer(null);
        const base64Audio = await generateLearningPodcast(activeModule.title, activeModule.content || "No content provided.");
        if (base64Audio && audioContextRef.current) {
            const decoded = decode(base64Audio);
            const buffer = await decodeAudioData(decoded, audioContextRef.current, 24000, 1);
            setAudioBuffer(buffer);
            setIsGeneratingAudio(false);
        } else {
            setIsGeneratingAudio(false);
            alert("Failed to generate audio. Please try again.");
        }
    };

    // ... (Keep existing Simulation & Helper Logic)
    const startSimulation = async () => {
        const activeModule = activeCourse?.modules[activeModuleIndex];
        if (!activeModule) return;
        setSimState('Intro');
        setIsSimLoading(true);
        const scenario = await generateSimulationScenario(activeModule.title);
        if (scenario) {
            setSimScenario(scenario);
            setSimHistory([{ role: scenario.role, text: scenario.openingLine }]);
            setSimState('Active');
        } else {
            alert("Failed to initialize simulation.");
        }
        setIsSimLoading(false);
    };

    const sendSimMessage = async () => {
        if (!simInput.trim() || !simScenario) return;
        const newHistory = [...simHistory, { role: 'User', text: simInput }];
        setSimHistory(newHistory);
        setSimInput('');
        setIsSimLoading(true);
        const response = await chatWithMentor(
            simInput, 
            `You are roleplaying as ${simScenario.role}. Context: ${simScenario.context}. Objective for user: ${simScenario.objective}. Keep responses short (under 2 sentences) and reactive. Stay in character.`,
            newHistory.map(h => ({ role: h.role === 'User' ? 'user' : 'ai', text: h.text }))
        );
        setSimHistory(prev => [...prev, { role: simScenario.role, text: response }]);
        setIsSimLoading(false);
    };

    const endSimulation = async () => {
        if (!simScenario) return;
        setIsSimLoading(true);
        const feedback = await evaluateSimulation(simHistory, simScenario.objective);
        setSimEvaluation(feedback);
        setSimState('Feedback');
        setIsSimLoading(false);
    };

    useEffect(() => {
        if (audioBuffer && !isPlaying && !isGeneratingAudio) {
             playAudio(); 
        }
    }, [audioBuffer]);

    const getRecommendation = () => {
        return courses; 
    };

    // --- COURSE START LOGIC WITH GATING ---
    const handleStartCourse = async (course: Course) => {
        setActiveCourse(course);
        setModuleProgress(new Array(course.modules.length).fill(false)); 
        setActiveModuleIndex(0);
        setViewMode('CourseBriefing'); 
    };

    const handleInitiateProtocol = async () => {
        if (!activeCourse) return;
        
        // --- PREMIUM GATING ---
        const isPremiumCourse = activeCourse.type === 'LDP' || activeCourse.type === 'Technical';
        if (isPremiumCourse && !user.isSubscribed) {
            // Trigger subscription view via prop if available, or simple alert for now
            if (onChangeView) {
                onChangeView('subscription'); 
            } else {
                alert("This advanced course requires an Executive Suite subscription.");
            }
            return;
        }

        setViewMode('DeepDive');
        setDiveTab('Audio');
        setActiveModuleIndex(0);
    };

    // ... (Keep remaining handlers & renderers)
    const handleModuleSelect = (index: number) => {
        if (index === 0 || moduleProgress[index - 1]) {
            stopAudio();
            setAudioBuffer(null); 
            setActiveModuleIndex(index);
            setDiveTab('Audio');
            setSlideIdx(0);
        }
    };

    const handleStartCheckpoint = async () => {
        stopAudio();
        setQuizMode('Module');
        setExamState('Loading');
        setDiveTab('Checkpoint');
        try {
            const moduleTitle = activeCourse?.modules[activeModuleIndex].title || "General Knowledge";
            const generatedQuiz = await generateQuiz(moduleTitle, 'Intermediate');
            setQuestions(generatedQuiz.slice(0, 2)); 
            setExamState('InProgress');
            setScore(0);
            setCurrentQuestionIdx(0);
        } catch (e) {
            console.error("Failed to gen quiz", e);
        }
    };

    const handleStartFinalExam = async () => {
        stopAudio();
        setQuizMode('Final');
        setExamState('Intro');
        setDiveTab('FinalExam');
        if (activeCourse?.exam && activeCourse.exam.length > 0) {
            setQuestions(activeCourse.exam);
        } else {
            setExamState('Loading');
            try {
                const generatedQuiz = await generateQuiz(activeCourse?.title || "Final", 'Expert');
                setQuestions(generatedQuiz);
                setExamState('Intro');
            } catch (e) {
                console.error("Failed to gen quiz", e);
            }
        }
    };

    const handleAnswer = (optionIdx: number) => {
        setSelectedOption(optionIdx);
        setTimeout(() => {
            const isCorrect = optionIdx === questions[currentQuestionIdx].correctAnswer;
            if (isCorrect) setScore(s => s + 1);
            if (currentQuestionIdx < questions.length - 1) {
                setCurrentQuestionIdx(p => p + 1);
                setSelectedOption(null);
            } else {
                const finalScore = isCorrect ? score + 1 : score;
                const percentage = finalScore / questions.length;
                const passed = percentage >= 0.5; 
                if (quizMode === 'Module') {
                    if (passed) {
                        const newProgress = [...moduleProgress];
                        newProgress[activeModuleIndex] = true;
                        setModuleProgress(newProgress);
                        setExamState('Result');
                    } else {
                        setExamState('Result');
                    }
                } else {
                    setExamState(passed ? 'Certified' : 'Result');
                }
            }
        }, 800);
    };

    const handleNextModule = () => {
        if (activeModuleIndex < (activeCourse?.modules.length || 0) - 1) {
            stopAudio();
            setAudioBuffer(null);
            setActiveModuleIndex(p => p + 1);
            setDiveTab('Audio');
        }
    };

    const CourseBriefing = () => {
        if (!activeCourse) return null;
        const difficulty = activeCourse.targetAudience === 'Executive' ? 'Classified / Expert' : 'Professional';
        const isLocked = !user.isSubscribed && (activeCourse.type === 'LDP' || activeCourse.type === 'Technical');

        return (
            <div className="fixed inset-0 z-[60] bg-[#0B0F19] text-white flex flex-col overflow-y-auto animate-in fade-in duration-500">
                {/* Hero Section */}
                <div className={`relative h-[40vh] w-full ${activeCourse.imageColor} flex flex-col`}>
                    <div className="absolute inset-0 bg-black/40"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19] to-transparent"></div>
                    <div className="relative z-10 p-8 md:p-12 flex-1 flex flex-col justify-between">
                        <button onClick={() => setViewMode('Dashboard')} className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <span className="px-3 py-1 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                    <Signal size={12} className="text-emerald-400 animate-pulse"/>
                                    Live Briefing
                                </span>
                                <span className="px-3 py-1 rounded-full border border-white/20 bg-white/10 backdrop-blur-md text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                                    {difficulty}
                                </span>
                            </div>
                            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-2 leading-tight">{activeCourse.title}</h1>
                            <p className="text-lg text-slate-300 max-w-2xl">{activeCourse.description || "Master the hidden mechanics of this sector. Move beyond imitation and build true leverage."}</p>
                        </div>
                    </div>
                </div>

                {/* Briefing Content */}
                <div className="flex-1 max-w-5xl mx-auto w-full p-8 md:p-12">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <div className="mb-8">
                                <h4 className="text-white font-bold mb-4 flex items-center gap-2">
                                    <Zap size={18} className="text-amber-400" /> Competencies Acquired
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {activeCourse.skillsGained?.map((skill, i) => (
                                        <span key={i} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-xs font-bold text-slate-300">
                                            {skill}
                                        </span>
                                    )) || (
                                        <span className="text-slate-500 text-xs italic">Core strategic skills</span>
                                    )}
                                </div>
                            </div>
                            <div className="relative border-l-2 border-slate-800 pl-8 space-y-12">
                                {activeCourse.modules.map((mod, i) => (
                                    <div key={i} className="relative">
                                        <span className="absolute -left-[41px] top-0 w-6 h-6 rounded-full bg-slate-900 border-2 border-indigo-500 flex items-center justify-center text-[10px] font-bold text-indigo-400">
                                            {i + 1}
                                        </span>
                                        <h4 className="font-bold text-white text-lg mb-1">{mod.title}</h4>
                                        <p className="text-sm text-slate-400">Duration: {mod.duration} • Format: {mod.type}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="flex flex-col justify-center items-start">
                            {isLocked ? (
                                <div className="p-8 rounded-3xl bg-slate-900 border border-amber-500/30 text-center w-full shadow-2xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[50px] rounded-full"></div>
                                    <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-amber-500">
                                        <Lock size={32} />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Executive Access Only</h3>
                                    <p className="text-slate-400 mb-6">This advanced protocol requires a Pro subscription.</p>
                                    <button 
                                        onClick={handleInitiateProtocol} // This will trigger the check and redirect
                                        className="w-full py-4 bg-amber-500 text-white rounded-xl font-bold text-lg hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
                                    >
                                        <Sparkles size={18} /> Unlock Access
                                    </button>
                                </div>
                            ) : (
                                <button 
                                    onClick={handleInitiateProtocol}
                                    className="w-full py-4 bg-white text-slate-900 rounded-xl font-bold text-lg hover:scale-105 transition-transform shadow-xl flex items-center justify-center gap-2"
                                >
                                    Initiate Protocol <ArrowRight size={20} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // ... (DeepDivePlayer remains same, ensure locked simulations also check sub)
    const DeepDivePlayer = () => {
        // ... (existing code)
        if (!activeCourse) return null;
        
        const activeModule = activeCourse.modules[activeModuleIndex];
        const hasContent = activeModule.content !== undefined;
        const slideContent = activeModule.content ? activeModule.content.split('---').map(s => s.trim()).filter(s => s) : [];
        const isSlides = slideContent.length > 1;
        const markdownComponents = {
            h1: ({node, ...props}: any) => (<h1 className="text-4xl md:text-5xl font-extrabold mb-8 pb-4 border-b-4 border-indigo-500 inline-block text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-700 dark:from-white dark:to-slate-300" {...props} />),
            h2: ({node, ...props}: any) => (<div className="flex items-center gap-3 mt-8 mb-4"><div className="h-8 w-1 bg-indigo-500 rounded-full"></div><h2 className="text-2xl font-bold text-slate-800 dark:text-white uppercase tracking-tight" {...props} /></div>),
            h3: ({node, ...props}: any) => (<h3 className="text-lg font-bold mt-6 mb-3 text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2" {...props} />),
            ul: ({node, ...props}: any) => (<ul className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6" {...props} />),
            li: ({node, ...props}: any) => (<li className="flex items-start gap-4 p-5 rounded-2xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:border-indigo-500/30 transition-all duration-300 group"><div className="mt-1 w-6 h-6 rounded-full bg-indigo-50 dark:bg-indigo-900/30 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform"><div className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400"></div></div><span className="text-slate-600 dark:text-slate-300 text-sm leading-relaxed font-medium">{props.children}</span></li>),
            blockquote: ({node, ...props}: any) => (<div className="relative my-8 p-8 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-3xl shadow-xl text-white overflow-hidden transform hover:scale-[1.01] transition-transform"><div className="absolute top-0 right-0 p-6 opacity-10"><Zap size={120} /></div><div className="absolute top-6 left-6 bg-white/20 backdrop-blur-md p-2 rounded-xl"><Info size={20} className="text-white" /></div><div className="relative z-10 pt-10 text-lg font-medium italic leading-relaxed font-serif pl-2 border-l-4 border-white/30">{props.children}</div></div>),
            table: ({node, ...props}: any) => (<div className="my-8 w-full overflow-hidden rounded-2xl border border-slate-300 dark:border-slate-700 shadow-lg bg-white dark:bg-slate-900"><div className="overflow-x-auto"><table className="w-full text-sm text-left border-collapse min-w-full" {...props} /></div></div>),
            thead: ({node, ...props}: any) => (<thead className="bg-slate-100 dark:bg-slate-800 text-xs uppercase font-bold text-slate-700 dark:text-slate-300 tracking-wider border-b-2 border-slate-300 dark:border-slate-600" {...props} />),
            tbody: ({node, ...props}: any) => (<tbody className="bg-white dark:bg-slate-900 divide-y divide-slate-200 dark:divide-slate-800" {...props} />),
            tr: ({node, ...props}: any) => (<tr className="hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-colors border-b border-slate-200 dark:border-slate-800 last:border-0" {...props} />),
            th: ({node, ...props}: any) => (<th className="px-6 py-4 font-bold text-left border-r border-slate-200 dark:border-slate-700 last:border-r-0" {...props} />),
            td: ({node, ...props}: any) => (<td className="px-6 py-4 text-slate-700 dark:text-slate-300 whitespace-pre-wrap border-r border-slate-200 dark:border-slate-700 last:border-r-0" {...props} />),
            strong: ({node, ...props}: any) => <strong className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400" {...props} />,
            hr: ({node, ...props}: any) => <div className="my-8 h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-700 to-transparent opacity-50" {...props} />
        };

        return (
            <div className="fixed inset-0 z-[60] bg-[#0B0F19] text-white flex flex-col animate-in slide-in-from-bottom-10 duration-500 font-sans">
                {/* Header ... */}
                <div className="h-16 border-b border-white/10 flex justify-between items-center px-6 bg-slate-900/50 backdrop-blur-md">
                    <div className="flex items-center gap-4">
                        <button onClick={() => { setViewMode('CourseBriefing'); stopAudio(); }} className="p-2 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition-colors">
                            <ArrowLeft size={20}/>
                        </button>
                        <div>
                            <h2 className="font-bold text-xs text-slate-400 uppercase tracking-widest">Growth Engine</h2>
                            <div className="font-bold text-lg">{activeCourse.title}</div>
                        </div>
                    </div>
                    <div className="flex bg-white/5 rounded-full p-1 border border-white/10">
                        <button onClick={() => { setDiveTab('Audio'); }} className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${diveTab === 'Audio' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Headphones size={14} /> Absorb</button>
                        <div className="w-px h-4 bg-white/10 my-auto mx-1"></div>
                        <button onClick={() => { setDiveTab('Deconstruct'); stopAudio(); }} className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${diveTab === 'Deconstruct' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Presentation size={14} /> Deconstruct</button>
                        <div className="w-px h-4 bg-white/10 my-auto mx-1"></div>
                        <button onClick={() => { setDiveTab('Simulation'); stopAudio(); }} className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${diveTab === 'Simulation' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><SwordsIcon size={14} /> Simulation</button>
                        <div className="w-px h-4 bg-white/10 my-auto mx-1"></div>
                        <button onClick={handleStartCheckpoint} className={`px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 transition-all ${diveTab === 'Checkpoint' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><CheckCircle2 size={14} /> Checkpoint</button>
                    </div>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    <div className="flex-1 p-0 flex flex-col items-center justify-center relative bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 to-[#0B0F19]">
                        {/* Audio Tab */}
                        {diveTab === 'Audio' && (
                            <div className="w-full h-full flex flex-col animate-in fade-in zoom-in duration-500 relative">
                                <div className="flex-1 flex items-center justify-center relative overflow-hidden">
                                    <div className="relative group cursor-pointer" onClick={() => isPlaying ? pauseAudio() : playAudio()}>
                                        <div className={`absolute inset-0 bg-indigo-500/20 rounded-full blur-3xl transition-all duration-1000 ${isPlaying ? 'scale-150 opacity-100' : 'scale-75 opacity-50'}`}></div>
                                        <div className="relative z-10 w-64 h-64 bg-slate-900 border-2 border-white/10 rounded-full flex items-center justify-center shadow-2xl overflow-hidden">
                                            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1614726365723-49cfae96c694?q=80&w=1000')] bg-cover opacity-20 mix-blend-overlay"></div>
                                            {isPlaying ? (<div className="flex gap-1.5 items-end h-12">{[1,2,3,4,5,6,7,8,9,10].map(i => (<div key={i} className="w-2 bg-indigo-500 animate-[bounce_1s_infinite]" style={{ height: Math.random() * 40 + 10 + 'px', animationDelay: i * 0.1 + 's' }}></div>))}</div>) : isGeneratingAudio ? (<div className="flex flex-col items-center"><Loader2 className="animate-spin text-indigo-500" size={48} /></div>) : (<Play size={48} fill="white" className="ml-2" />)}
                                        </div>
                                        <div className="absolute -bottom-16 left-1/2 -translate-x-1/2 text-center w-full">
                                            <div className="text-sm font-bold text-white uppercase tracking-widest mb-1">{isGeneratingAudio ? 'Synthesizing...' : isPlaying ? 'Now Playing' : 'Ready to Play'}</div>
                                            <div className="text-xs text-slate-500 font-mono">{isGeneratingAudio ? 'AI Hosts are analyzing script' : 'Deep Dive Podcast Mode'}</div>
                                        </div>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} className="absolute top-8 right-8 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors">{isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}</button>
                                    <div className="absolute bottom-20 flex flex-col items-center w-full gap-6">
                                        {!audioBuffer && !isGeneratingAudio && (<button onClick={handleGeneratePodcast} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full font-bold shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-transform hover:scale-105 animate-in slide-in-from-bottom-4"><Radio size={18} /> Generate Deep Dive Podcast</button>)}
                                        <div className="flex flex-col items-center">
                                            <p className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-widest">Module {activeModuleIndex + 1}: {activeModule.title}</p>
                                            <button onClick={() => { setDiveTab('Deconstruct'); stopAudio(); }} className="flex items-center gap-2 text-xs text-indigo-400 hover:text-white transition-colors mt-2">View Slides <ArrowRight size={12}/></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Deconstruct Tab */}
                        {diveTab === 'Deconstruct' && (
                            <div className="w-full h-full flex flex-col items-center justify-center animate-in slide-in-from-right duration-300 p-8">
                                <div className="w-full max-w-6xl h-full flex gap-6">
                                    <div className="flex-1 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden relative group border border-slate-200 dark:border-slate-800">
                                        {hasContent ? (isSlides ? (<div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-900/50"><div className="flex-1 px-16 py-12 flex flex-col justify-center animate-in fade-in duration-500 key={slideIdx} overflow-y-auto custom-scrollbar relative"><div className="prose prose-lg dark:prose-invert max-w-4xl mx-auto w-full font-sans relative z-10"><ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{slideContent[slideIdx]}</ReactMarkdown></div></div></div>) : (<div className="flex-1 p-12 overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 min-h-0"><div className="prose prose-lg dark:prose-invert max-w-3xl mx-auto font-sans"><ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{activeModule.content}</ReactMarkdown></div></div>)) : (<div className="flex-1 flex flex-col min-h-0"><div className="flex-1 p-16 flex flex-col justify-center items-center text-center"><h2 className="text-4xl font-bold mb-8 text-slate-900">{MOCK_SLIDES[slideIdx].title}</h2><p className="text-2xl text-slate-600 leading-relaxed font-serif">{MOCK_SLIDES[slideIdx].content}</p></div></div>)}
                                        <div className="h-24 bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center px-10 relative z-20 shrink-0">
                                            <div className="flex items-center gap-4"><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{isSlides ? 'SLIDE PROGRESS' : 'MODULE PROGRESS'}</span><div className="flex gap-1">{isSlides ? slideContent.map((_, i) => (<div key={i} className={`h-1.5 w-8 rounded-full transition-all duration-300 ${i <= slideIdx ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-800'}`}></div>)) : <div className="h-1.5 w-24 rounded-full bg-indigo-500"></div>}</div></div>
                                            <div className="flex gap-4">
                                                {isSlides ? (<><button onClick={() => setSlideIdx(Math.max(0, slideIdx - 1))} disabled={slideIdx === 0} className="px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-50 transition-colors flex items-center gap-2 font-bold text-sm"><ChevronLeft size={16} /> Prev Slide</button><button onClick={() => setSlideIdx(Math.min(slideContent.length - 1, slideIdx + 1))} disabled={slideIdx === slideContent.length - 1} className="px-8 py-3 rounded-xl bg-indigo-600 text-white disabled:opacity-50 hover:bg-indigo-500 transition-colors flex items-center gap-2 font-bold text-sm shadow-lg shadow-indigo-500/20">Next Slide <ChevronRight size={16} /></button></>) : (<button onClick={handleStartCheckpoint} className="px-8 py-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-colors flex items-center gap-2 font-bold text-sm shadow-lg shadow-indigo-500/20">Complete Module <CheckCircle2 size={16} /></button>)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-80 bg-slate-900/50 backdrop-blur-md border border-white/10 rounded-2xl p-6 flex flex-col">
                                        <div className="flex items-center gap-2 mb-6"><BrainCircuit size={18} className="text-blue-400" /><h3 className="font-bold text-sm text-white">AI Analysis</h3></div>
                                        <div className="flex-1"><div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 mb-4"><div className="text-xs font-bold text-blue-300 uppercase mb-2">Key Takeaway</div><p className="text-sm text-blue-100 leading-relaxed">{hasContent ? (isSlides ? "Focus on the core concept presented in this slide. Can you apply this principle immediately?" : "This reading material covers foundational theory. Ensure you understand the definitions before moving on.") : MOCK_SLIDES[slideIdx].notes}</p></div></div>
                                        <button onClick={handleStartCheckpoint} className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2">Complete Checkpoint <CheckCircle2 size={14}/></button>
                                    </div>
                                </div>
                            </div>
                        )}
                        {/* Simulation Tab */}
                        {diveTab === 'Simulation' && (
                            <div className="w-full h-full flex flex-col items-center justify-center animate-in slide-in-from-bottom duration-500 p-8">
                                <div className="w-full max-w-4xl h-full flex flex-col bg-slate-900 rounded-3xl border border-slate-800 shadow-2xl overflow-hidden relative">
                                    {!isPremium && (<div className="absolute inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex flex-col items-center justify-center text-center p-8"><div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mb-6"><Lock size={40} className="text-amber-500" /></div><h3 className="text-3xl font-bold text-white mb-2">Premium Feature Locked</h3><p className="text-slate-400 max-w-md mb-8">Roleplay simulations require an Executive Suite subscription.</p><button onClick={() => onChangeView && onChangeView('subscription')} className="px-8 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-400 transition-colors shadow-lg">Unlock Simulations</button></div>)}
                                    {simState === 'Intro' && (<div className="flex-1 flex flex-col items-center justify-center text-center p-12"><div className="w-24 h-24 bg-purple-900/30 rounded-full flex items-center justify-center mb-8 border border-purple-500/30 shadow-[0_0_40px_rgba(168,85,247,0.2)]"><SwordsIcon size={48} className="text-purple-400" /></div><h2 className="text-4xl font-bold text-white mb-4">AI Roleplay Simulation</h2><p className="text-slate-400 max-w-lg mb-8 text-lg">Practice high-stakes conversations in a risk-free environment.</p><button onClick={startSimulation} disabled={isSimLoading} className="px-10 py-4 bg-purple-600 text-white font-bold rounded-full text-lg hover:bg-purple-500 transition-all flex items-center gap-3 shadow-lg shadow-purple-900/50">{isSimLoading ? <Loader2 className="animate-spin"/> : <Play size={20} fill="currentColor"/>} Start Simulation</button></div>)}
                                    {simState === 'Active' && simScenario && (<><div className="h-20 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-8"><div><div className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">CURRENT SCENARIO</div><div className="font-bold text-white text-lg flex items-center gap-2"><BrainCircuit size={18} className="text-slate-500" />{simScenario.role}</div></div><button onClick={endSimulation} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-700 transition-colors border border-slate-700">End & Evaluate</button></div><div className="flex-1 overflow-y-auto p-8 space-y-6 bg-[#0B0F19]" ref={simScrollRef}><div className="bg-purple-900/20 border border-purple-500/30 p-4 rounded-xl mb-8 flex items-start gap-3"><Info size={20} className="text-purple-400 mt-0.5 shrink-0" /><div><div className="text-xs font-bold text-purple-400 uppercase mb-1">Your Objective</div><p className="text-sm text-purple-100 leading-relaxed">{simScenario.objective}</p></div></div>{simHistory.map((msg, i) => (<div key={i} className={`flex ${msg.role === 'User' ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[80%] p-5 rounded-2xl text-sm leading-relaxed shadow-lg ${msg.role === 'User' ? 'bg-purple-600 text-white rounded-br-none' : 'bg-slate-800 border border-slate-700 text-slate-200 rounded-bl-none'}`}>{msg.role !== 'User' && <div className="text-[10px] font-bold text-slate-500 uppercase mb-2">{msg.role}</div>}{msg.text}</div></div>))}{isSimLoading && (<div className="flex justify-start"><div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl rounded-bl-none"><div className="flex gap-1"><div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-100"></div><div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce delay-200"></div></div></div></div>)}</div><div className="p-6 bg-slate-900 border-t border-slate-800"><div className="relative"><input value={simInput} onChange={e => setSimInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendSimMessage()} placeholder="Type your response..." className="w-full pl-6 pr-14 py-4 bg-slate-950 border border-slate-800 rounded-2xl outline-none focus:border-purple-500 text-white placeholder-slate-600 transition-colors" disabled={isSimLoading} /><button onClick={sendSimMessage} disabled={!simInput.trim() || isSimLoading} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-purple-600 text-white rounded-xl hover:bg-purple-500 transition-colors disabled:opacity-50"><ArrowRight size={20} /></button></div></div></>)}
                                    {simState === 'Feedback' && simEvaluation && (<div className="flex-1 p-12 overflow-y-auto"><div className="text-center mb-10"><div className="inline-flex items-center justify-center w-24 h-24 rounded-full border-4 border-slate-800 bg-slate-900 mb-6 relative"><span className={`text-4xl font-black ${simEvaluation.score >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>{simEvaluation.score}</span></div><h2 className="text-3xl font-bold text-white mb-2">Performance Analysis</h2><p className="text-slate-400 text-lg">{simEvaluation.feedback}</p></div><div className="bg-slate-950 rounded-2xl p-8 border border-slate-800 max-w-2xl mx-auto"><h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-6">Key Improvements</h3><ul className="space-y-4">{simEvaluation.tips.map((tip, i) => (<li key={i} className="flex items-start gap-4"><div className="w-6 h-6 rounded-full bg-purple-900/30 border border-purple-500/30 flex items-center justify-center shrink-0 mt-0.5 text-purple-400 font-bold text-xs">{i+1}</div><p className="text-slate-300 leading-relaxed">{tip}</p></li>))}</ul></div><div className="flex justify-center gap-4 mt-10"><button onClick={() => startSimulation()} className="px-8 py-3 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-700 transition-colors">Retry Scenario</button><button onClick={() => handleStartCheckpoint()} className="px-8 py-3 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-500 transition-colors">Complete Module</button></div></div>)}
                                </div>
                            </div>
                        )}
                        {/* Exam/Checkpoint Logic */}
                        {(diveTab === 'Checkpoint' || diveTab === 'FinalExam') && (
                            <div className="w-full h-full flex items-center justify-center p-6 animate-in zoom-in duration-300">
                                {examState === 'Loading' && (<div className="text-center"><Loader2 size={48} className="animate-spin text-emerald-500 mx-auto mb-4" /><h2 className="text-xl font-bold">Generating {quizMode === 'Module' ? 'Checkpoint' : 'Gauntlet'}...</h2></div>)}
                                {examState === 'Intro' && quizMode === 'Final' && (<div className="text-center max-w-xl"><div className="mb-8 relative inline-block"><div className="absolute inset-0 bg-emerald-500/30 blur-2xl rounded-full"></div><ShieldAlert size={80} className="text-emerald-400 relative z-10" /></div><h2 className="text-3xl font-bold mb-4">The Final Gauntlet</h2><button className="w-full py-4 bg-emerald-600 text-white font-bold rounded-xl text-lg hover:bg-emerald-500 transition-all" onClick={() => setExamState('InProgress')}>Begin Certification</button></div>)}
                                {examState === 'InProgress' && questions.length > 0 && (<div className="w-full max-w-2xl bg-slate-900 rounded-3xl border border-slate-800 p-8 shadow-2xl"><div className="flex justify-between items-center mb-8"><span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{quizMode === 'Module' ? `Checkpoint: Module ${activeModuleIndex + 1}` : 'Final Certification'}</span><div className="flex gap-1">{questions.map((_, i) => (<div key={i} className={`w-2 h-2 rounded-full ${i <= currentQuestionIdx ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>))}</div></div><h2 className="text-2xl font-bold mb-8 leading-relaxed">{questions[currentQuestionIdx].question}</h2><div className="space-y-4">{questions[currentQuestionIdx].options.map((opt, i) => (<button key={i} onClick={() => handleAnswer(i)} disabled={selectedOption !== null} className={`w-full p-6 rounded-xl text-left border transition-all flex items-center justify-between group ${selectedOption === i ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : 'bg-slate-800 border-white/5 hover:bg-slate-700 text-slate-300'}`}><span className="text-lg">{opt}</span>{selectedOption === i && <CheckCircle2 size={20} />}</button>))}</div></div>)}
                                {examState === 'Result' && (<div className="text-center max-w-md"><div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 border ${score / questions.length >= 0.5 ? 'bg-emerald-500/20 text-emerald-500 border-emerald-500/50' : 'bg-rose-500/20 text-rose-500 border-rose-500/50'}`}>{score / questions.length >= 0.5 ? <Check size={40} /> : <ShieldAlert size={40} />}</div><h2 className="text-3xl font-bold mb-2">{score / questions.length >= 0.5 ? 'Checkpoint Cleared' : 'Access Denied'}</h2><p className="text-slate-400 mb-8">You scored {score}/{questions.length}.</p><div className="flex gap-4"><button onClick={() => { setDiveTab('Audio'); setIsPlaying(true); }} className="flex-1 py-3 bg-slate-800 text-white font-bold rounded-xl hover:bg-slate-700 transition-colors">Review Material</button>{score / questions.length >= 0.5 && quizMode === 'Module' && (<button onClick={handleNextModule} className="flex-1 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors">Next Module</button>)}{score / questions.length < 0.5 && (<button onClick={handleStartCheckpoint} className="flex-1 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors">Retry</button>)}</div></div>)}
                                {examState === 'Certified' && (<div className="relative w-full max-w-4xl aspect-[1.414/1] bg-[#FDFBF7] text-slate-900 shadow-2xl border-[16px] border-double border-slate-900 p-12 flex flex-col items-center justify-between overflow-hidden animate-in zoom-in duration-700"><div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div><div className="text-center relative z-10 mt-4"><div className="flex items-center justify-center gap-3 mb-2"><Award size={32} className="text-amber-500" /><span className="text-xs font-bold tracking-[0.3em] uppercase text-slate-500">Limitless Foundation</span></div><h1 className="text-6xl font-serif font-bold text-slate-900 mb-2 tracking-tight">CERTIFICATE</h1><p className="text-sm font-bold tracking-[0.4em] uppercase text-amber-600">OF STRATEGIC MASTERY</p></div><div className="text-center relative z-10 max-w-2xl"><p className="text-slate-500 italic font-serif text-lg mb-6">This credential certifies that</p><h2 className="text-5xl font-serif font-bold text-slate-900 border-b-2 border-slate-200 pb-4 mb-6 italic">{user.name}</h2><p className="text-slate-600 leading-relaxed font-serif">Has successfully conquered the Final Gauntlet for<br/><strong className="text-slate-900 text-xl block mt-2">{activeCourse.title}</strong></p></div><div className="w-full flex justify-between items-end relative z-10 mb-4 px-12"><div className="text-center flex flex-col items-center"><div className="bg-white p-2 border border-slate-200 mb-2"><QrCode size={48} className="text-slate-900" /></div><div className="text-[8px] font-bold text-slate-400 uppercase mt-1">Verified</div></div><div className="relative -mb-4"><div className="w-24 h-24 bg-amber-500 rounded-full flex items-center justify-center shadow-lg border-4 border-amber-200 text-white font-bold text-[10px] uppercase tracking-widest text-center">Official<br/>Seal</div></div><div className="text-center"><div className="font-serif text-2xl text-slate-900 italic mb-1" style={{fontFamily: 'cursive'}}>Michael Chitenderu</div><div className="w-40 h-px bg-slate-300 mx-auto"></div><div className="text-[10px] font-bold text-slate-900 uppercase mt-2">Executive Director</div></div></div><div className="absolute bottom-4 right-4 flex gap-2 no-print"><button onClick={() => window.print()} className="p-2 bg-slate-900 text-white rounded-full hover:bg-slate-700 shadow-lg"><Download size={20}/></button><button onClick={() => setViewMode('Dashboard')} className="p-2 bg-slate-200 text-slate-900 rounded-full hover:bg-slate-300 shadow-lg"><Check size={20}/></button></div></div>)}
                            </div>
                        )}
                    </div>
                    {/* Sidebar... */}
                    <div className="w-72 border-l border-white/5 bg-slate-900/30 p-4 flex flex-col backdrop-blur-xl">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">Mission Syllabus</div>
                        <div className="space-y-2 overflow-y-auto flex-1 custom-scrollbar">
                            {activeCourse.modules.map((mod, i) => {
                                const isLocked = i > 0 && !moduleProgress[i-1];
                                const isComplete = moduleProgress[i];
                                return (<button key={i} onClick={() => handleModuleSelect(i)} disabled={isLocked} className={`w-full p-3 rounded-xl text-left transition-all border group relative ${activeModuleIndex === i ? 'bg-white/10 border-white/20 text-white' : isLocked ? 'opacity-50 cursor-not-allowed border-transparent' : 'bg-transparent border-transparent hover:bg-white/5 text-slate-500'}`}><div className="flex justify-between items-center mb-1"><span className={`text-[10px] font-bold ${activeModuleIndex === i ? 'text-indigo-400' : 'text-slate-600'}`}>0{i+1}</span>{isComplete ? (<CheckCircle2 size={12} className="text-emerald-500"/>) : isLocked ? (<Lock size={12} />) : (<div className="w-2 h-2 rounded-full bg-slate-700"></div>)}</div><div className="font-bold text-xs line-clamp-2 leading-snug group-hover:text-white transition-colors">{mod.title}</div></button>);
                            })}
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10"><button onClick={handleStartFinalExam} disabled={!moduleProgress.every(Boolean)} className={`w-full p-4 rounded-xl border flex flex-col items-center text-center transition-all ${moduleProgress.every(Boolean) ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 hover:bg-emerald-500/30 cursor-pointer animate-pulse' : 'bg-slate-900 border-slate-800 text-slate-600 opacity-50 cursor-not-allowed'}`}><Award size={24} className="mb-2" /><span className="font-bold text-sm">CONQUER</span><span className="text-[10px] uppercase tracking-wider mt-1">Final Certification</span></button></div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 md:p-12 pb-32 min-h-screen bg-[#F8FAFC] dark:bg-[#0B0F19]">
            {viewMode === 'CourseBriefing' && <CourseBriefing />}
            {viewMode === 'DeepDive' && <DeepDivePlayer />}

            <header className="mb-10">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-2xl shadow-lg shadow-indigo-500/20">
                        <GraduationCap className="text-white" size={28} />
                    </div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Growth Engine</h1>
                </div>
                <p className="text-lg text-slate-500 dark:text-slate-400">
                    AI-Architected Curriculum. Bridge your skill gaps instantly.
                </p>
            </header>

            <div className="space-y-12 animate-in fade-in">
                <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 text-white shadow-2xl group cursor-pointer" onClick={() => handleStartCourse(courses[0])}>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-900 to-indigo-900 opacity-90 transition-opacity group-hover:opacity-100"></div>
                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20 group-hover:scale-105 transition-transform duration-700"></div>
                    <div className="relative z-10 p-10 md:p-16 max-w-3xl">
                        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-500/50 text-rose-300 text-xs font-bold uppercase tracking-wider mb-6"><Zap size={12} fill="currentColor" /> Priority Gap Identified</span>
                        <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">{user.primaryFocus === 'Executive' ? 'Strategic Vision & Boardroom Dynamics' : 'Operational Excellence & Team Lead Fundamentals'}</h2>
                        <p className="text-lg text-slate-300 mb-8 leading-relaxed max-w-2xl">{user.primaryFocus === 'Executive' ? "This advanced module simulates high-stakes decision making. Upload your company strategy document to contextualize the training." : "Master the basics of management. Learn how to delegate, communicate effectively, and manage projects using agile methodologies."}</p>
                        <div className="flex flex-wrap gap-4"><button className="px-8 py-4 bg-white text-slate-900 rounded-xl font-bold hover:bg-slate-100 transition-colors shadow-lg flex items-center gap-2"><Play size={18} fill="currentColor" /> Start Deep Dive</button></div>
                    </div>
                </div>

                <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Your Learning Path</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {getRecommendation().map(course => (
                            <div key={course.id} onClick={() => handleStartCourse(course)} className="group bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden cursor-pointer hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 transform hover:-translate-y-1">
                                <div className={`h-48 ${course.imageColor} relative p-6 flex flex-col justify-end`}>
                                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors"></div>
                                    <div className="relative z-10">
                                        <div className="flex gap-2 mb-2"><span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg border border-white/10">{course.category || 'General'}</span><span className="bg-white/20 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-lg border border-white/10">{course.duration}</span></div>
                                        <h3 className="text-2xl font-bold text-white leading-tight">{course.title}</h3>
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex flex-wrap gap-1 mb-4 h-6 overflow-hidden">{course.skillsGained?.slice(0, 3).map((skill, idx) => (<span key={idx} className="text-[10px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">{skill}</span>))}</div>
                                    <div className="flex items-center gap-2 mb-4"><div className="flex -space-x-2">{[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-slate-300 border-2 border-white dark:border-slate-900"></div>)}</div><span className="text-xs text-slate-500">+{course.students} Learners</span></div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-4"><div className="bg-indigo-500 h-full w-0 group-hover:w-full transition-all duration-1000"></div></div>
                                    <div className="flex justify-between items-center text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider"><span>Start Module</span><ArrowRight size={14} className="group-hover:translate-x-1 transition-transform"/></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};
