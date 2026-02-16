
import React, { useState, useEffect } from 'react';
import { Sidebar, MobileNav } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { Subscription } from './components/Subscription';
import { Settings } from './components/Settings';
import { LandingPage } from './components/LandingPage';
import { WelcomeIntro } from './components/WelcomeIntro';
import { Marketplace } from './components/Marketplace';
import { StrategyEngine } from './components/StrategyEngine';
import { Academy } from './components/Academy';
import { AdminDashboard } from './components/AdminDashboard';
import { ChiefOfStaff } from './components/ChiefOfStaff';
import { UserGuide } from './components/UserGuide';
import { CareerToolkit } from './components/CareerToolkit';
import { NetworkHub } from './components/NetworkHub';
import { AuthModal } from './components/AuthModal';
import { ViewState, UserProfile, Course } from './types';
import { authService } from './services/authService';

// CareerOS Initial State
const INITIAL_USER: UserProfile = {
  name: '',
  email: '',
  primaryFocus: 'Professional', 
  keywords: [],
  isSubscribed: false,
  appliedJobIds: [],
  savedJobIds: [],
  strategicRoadmap: [],
  scaleScore: 500,
  marketValue: 3500,
  skillScore: 65,
  resumeText: ''
};

// Initial Courses (Content mock)
const INITIAL_COURSES: Course[] = [
    {
        id: 'c1',
        title: 'The AI-First Professional',
        type: 'Technical',
        targetAudience: 'Professional',
        duration: '3 Weeks',
        price: 199,
        rating: 4.9,
        students: 4200,
        imageColor: 'bg-emerald-900',
        isCertified: true,
        category: 'Future of Work',
        partner: 'CareerOS AI Lab',
        description: 'Master prompting, workflow automation, and AI ethics. Become the most productive person in any room.',
        skillsGained: ['Prompt Engineering', 'Workflow Automation', 'AI Ethics'],
        modules: [
            { id: 'm1-1', title: 'The Generative Mindset', duration: '20 mins', type: 'Audio', isCompleted: false },
            { id: 'm1-2', title: 'Automating the Boring Stuff', duration: '35 mins', type: 'Slides', isCompleted: false },
            { id: 'm1-3', title: 'Advanced Prompting Frameworks', duration: '25 mins', type: 'Interactive', isCompleted: false }
        ]
    },
    {
        id: 'c2',
        title: 'Strategic Project Management (PMP Focus)',
        type: 'LDP',
        targetAudience: 'Professional',
        duration: '5 Weeks',
        price: 350,
        rating: 4.8,
        students: 2100,
        imageColor: 'bg-blue-900',
        isCertified: true,
        category: 'Management',
        partner: 'PM Institute',
        description: 'Move from "doing tasks" to "managing outcomes". Learn Agile, Scrum, and Stakeholder Management.',
        skillsGained: ['Agile Methodologies', 'Risk Management', 'Stakeholder Comms'],
        modules: [
            { id: 'm2-1', title: 'Waterfall vs Agile', duration: '30 mins', type: 'Audio', isCompleted: false },
            { id: 'm2-2', title: 'Managing Scope Creep', duration: '40 mins', type: 'Slides', isCompleted: false }
        ]
    },
    // ... (Add back other mock courses if needed, keeping short for brevity)
    {
        id: 'c6',
        title: 'Winning Public Sector Bids',
        type: 'Technical',
        targetAudience: 'Contractor',
        duration: '2 Weeks',
        price: 300,
        rating: 4.8,
        students: 850,
        imageColor: 'bg-amber-900',
        isCertified: true,
        category: 'Procurement',
        partner: 'PRAZ Academy',
        description: 'Master the art of government tendering. Learn compliance, competitive pricing, and proposal writing.',
        skillsGained: ['Tender Compliance', 'Bid Strategy', 'Proposal Writing'],
        modules: [
            { id: 'm6-1', title: 'Understanding the Request for Proposal (RFP)', duration: '20 mins', type: 'Audio', isCompleted: false },
            { id: 'm6-2', title: 'Pricing for Profit & Competitiveness', duration: '35 mins', type: 'Slides', isCompleted: false }
        ]
    }
];

export default function App() {
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [view, setView] = useState<ViewState>('hero'); 
  const [darkMode, setDarkMode] = useState(true);
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [showGuide, setShowGuide] = useState(false);
  const [targetCourseId, setTargetCourseId] = useState<string | undefined>(undefined);
  
  // Auth State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [targetPersona, setTargetPersona] = useState<string | undefined>(undefined);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    document.documentElement.classList.add('dark');
    setDarkMode(true);
    
    // RESTORE SESSION VIA SERVICE
    const initSession = async () => {
        const storedUser = await authService.restoreSession();
        if (storedUser) {
            setUser(storedUser);
            if (storedUser.primaryFocus === 'Admin') {
                setView('admin');
            } else if (!storedUser.industry || storedUser.name === 'User') {
                setView('welcome');
            } else {
                setView('dashboard');
            }
        }
        setIsInitializing(false);
    };
    
    initSession();

    // Load courses from local storage if available
    const savedCourses = localStorage.getItem('careeros_courses');
    if (savedCourses) {
        try {
            setCourses(JSON.parse(savedCourses));
        } catch (e) {
            console.error(e);
        }
    }
  }, []);

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    authService.updateUser(updatedUser); // PERSIST via Service
  };

  const handleLogin = (loggedInUser: UserProfile) => {
      setUser(loggedInUser);
      setIsAuthOpen(false);
      
      if (loggedInUser.primaryFocus === 'Admin') {
          setView('admin');
      } else if (loggedInUser.name === 'User' || !loggedInUser.industry) {
          setView('welcome');
      } else {
          setView('dashboard');
          setShowGuide(true);
      }
  };

  const handleLogout = () => {
      authService.logout();
      setUser(INITIAL_USER);
      setView('hero');
      setShowGuide(false);
  };

  const handleChangeView = (newView: ViewState, data?: any) => {
      const lockedViews = ['strategy', 'toolkit'];
      if (lockedViews.includes(newView) && !user.isSubscribed) {
          setView('subscription');
          return;
      }
      if (newView === 'academy' && data?.courseId) {
          setTargetCourseId(data.courseId);
      } else {
          setTargetCourseId(undefined);
      }
      setView(newView);
  };

  const openAuth = (mode: 'login' | 'signup', persona?: string) => {
      setAuthMode(mode);
      setTargetPersona(persona);
      setIsAuthOpen(true);
  };

  // --- RENDER LOGIC ---

  if (isInitializing) return null; // Or a splash screen

  if (view === 'hero') {
      return (
        <>
            <LandingPage onOpenAuth={openAuth} />
            <AuthModal 
                isOpen={isAuthOpen} 
                onClose={() => setIsAuthOpen(false)} 
                initialMode={authMode}
                onLogin={handleLogin}
                targetPersona={targetPersona}
            />
        </>
      );
  }

  if (view === 'welcome') {
      return (
        <WelcomeIntro 
            user={user} 
            onUpdateUser={handleUpdateUser}
            onContinue={(v) => {
                setView(v || 'dashboard');
                if ((v || 'dashboard') === 'dashboard') setShowGuide(true);
            }} 
        />
      );
  }

  const renderView = () => {
      switch (view) {
          case 'dashboard':
              return <Dashboard user={user} onChangeView={handleChangeView} />;
          case 'marketplace':
              return <Marketplace user={user} onChangeView={handleChangeView} courses={courses} onUpdateUser={handleUpdateUser} />;
          case 'strategy':
              return <StrategyEngine user={user} onUpdateUser={handleUpdateUser} onChangeView={handleChangeView} />;
          case 'academy':
              return <Academy user={user} onUpdateUser={handleUpdateUser} courses={courses} initialCourseId={targetCourseId} onChangeView={handleChangeView} />;
          case 'toolkit':
              return <CareerToolkit user={user} onUpdateUser={handleUpdateUser} />;
          case 'network':
              return <NetworkHub user={user} />;
          case 'subscription':
              return <Subscription user={user} onUpdateUser={handleUpdateUser} />;
          case 'settings':
              return <Settings user={user} onUpdateUser={handleUpdateUser} onLogout={handleLogout} isDarkMode={darkMode} toggleTheme={() => setDarkMode(!darkMode)} />;
          case 'admin':
              return <AdminDashboard user={user} courses={courses} onAddCourse={(c) => setCourses([c, ...courses])} onUpdateCourse={(c) => setCourses(courses.map(x => x.id === c.id ? c : x))} />;
          default:
              return <Dashboard user={user} onChangeView={handleChangeView} />;
      }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'bg-[#020604] text-slate-100' : 'bg-[#F5F5F7] text-slate-900'}`}>
        <Sidebar currentView={view} onChangeView={handleChangeView} onLogout={handleLogout} user={user} />
        <MobileNav currentView={view} onChangeView={handleChangeView} user={user} />

        <main className="md:ml-80 pt-4 transition-all duration-300">
            {renderView()}
        </main>

        {showGuide && <UserGuide user={user} onClose={() => setShowGuide(false)} />}

        <ChiefOfStaff user={user} currentView={view} onChangeView={handleChangeView} />
    </div>
  );
}
