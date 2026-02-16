
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
import { ViewState, UserProfile, AppMode, Course } from './types';

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

// Initial Courses - HIGH IMPACT CURRICULUM
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
    {
        id: 'c3',
        title: 'Financial Intelligence for Non-Financial Managers',
        type: 'Technical',
        targetAudience: 'Executive',
        duration: '4 Weeks',
        price: 499,
        rating: 5.0,
        students: 950,
        imageColor: 'bg-slate-900',
        isCertified: true,
        category: 'Finance',
        partner: 'Wharton Online (Sim)',
        description: 'Read a P&L like a book. Understand cash flow, margins, and ROI to make board-level decisions.',
        skillsGained: ['P&L Analysis', 'Cash Flow Mgmt', 'ROI Calculation'],
        modules: [
            { id: 'm3-1', title: 'The Language of Business', duration: '25 mins', type: 'Audio', isCompleted: false },
            { id: 'm3-2', title: 'Balance Sheet Decode', duration: '45 mins', type: 'Slides', isCompleted: false }
        ]
    },
    {
        id: 'c4',
        title: 'The Art of Negotiation & Persuasion',
        type: 'Soft Skills',
        targetAudience: 'Professional',
        duration: '2 Weeks',
        price: 150,
        rating: 4.7,
        students: 5600,
        imageColor: 'bg-purple-900',
        isCertified: true,
        category: 'Soft Skills',
        partner: 'Harvard PON (Sim)',
        description: 'Never leave money on the table. Learn to negotiate salaries, contracts, and conflict resolution.',
        skillsGained: ['Salary Negotiation', 'Conflict Resolution', 'Persuasion'],
        modules: [
            { id: 'm4-1', title: 'BATNA & ZOPA', duration: '20 mins', type: 'Audio', isCompleted: false },
            { id: 'm4-2', title: 'Psychology of Influence', duration: '30 mins', type: 'Slides', isCompleted: false }
        ]
    },
    {
        id: 'c5',
        title: 'Data Storytelling & Analytics',
        type: 'Technical',
        targetAudience: 'Starter',
        duration: '3 Weeks',
        price: 250,
        rating: 4.6,
        students: 3100,
        imageColor: 'bg-orange-800',
        isCertified: true,
        category: 'Data',
        partner: 'DataCamp (Sim)',
        description: 'Turn raw numbers into compelling narratives. Essential for marketing, sales, and strategy roles.',
        skillsGained: ['Data Visualization', 'Excel Advanced', 'Presentation'],
        modules: [
            { id: 'm5-1', title: 'Why Data Matters', duration: '15 mins', type: 'Audio', isCompleted: false },
            { id: 'm5-2', title: 'Building Dashboards', duration: '50 mins', type: 'Slides', isCompleted: false }
        ]
    },
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
            { id: 'm6-2', title: 'Pricing for Profit & Competitiveness', duration: '35 mins', type: 'Slides', isCompleted: false },
            { id: 'm6-3', title: 'Common Compliance Pitfalls', duration: '15 mins', type: 'Reading', isCompleted: false }
        ]
    }
];

export default function App() {
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [view, setView] = useState<ViewState>('hero'); 
  const [darkMode, setDarkMode] = useState(true); // Default to Dark Mode for Jungle Theme
  const [courses, setCourses] = useState<Course[]>(INITIAL_COURSES);
  const [showGuide, setShowGuide] = useState(false);
  const [targetCourseId, setTargetCourseId] = useState<string | undefined>(undefined);
  
  // Auth State
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [targetPersona, setTargetPersona] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Force dark mode logic for consistency with Jungle Theme
    document.documentElement.classList.add('dark');
    setDarkMode(true);
    
    // Check local storage for persistent session
    const savedUser = localStorage.getItem('careeros_user');
    const token = localStorage.getItem('careeros_token');

    if (savedUser && token) {
        try {
            const parsedUser = JSON.parse(savedUser);
            setUser(parsedUser);
            // Don't just set 'dashboard', check if they finished onboarding
            if (parsedUser.primaryFocus === 'Admin') {
                setView('admin');
            } else if (!parsedUser.industry || parsedUser.name === 'User') {
                setView('welcome');
            } else {
                setView('dashboard');
            }
        } catch (e) {
            console.error("Failed to parse saved user", e);
            handleLogout();
        }
    }

    // Check local storage for persistent courses
    const savedCourses = localStorage.getItem('careeros_courses');
    if (savedCourses) {
        try {
            setCourses(JSON.parse(savedCourses));
        } catch (e) {
            console.error("Failed to parse saved courses", e);
        }
    }
  }, []);

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem('careeros_user', JSON.stringify(updatedUser)); // Persist updates
  };

  const handleAddCourse = (newCourse: Course) => {
      const updatedCourses = [newCourse, ...courses];
      setCourses(updatedCourses);
      localStorage.setItem('careeros_courses', JSON.stringify(updatedCourses));
  };

  const handleUpdateCourse = (updatedCourse: Course) => {
      const updatedCourses = courses.map(c => c.id === updatedCourse.id ? updatedCourse : c);
      setCourses(updatedCourses);
      localStorage.setItem('careeros_courses', JSON.stringify(updatedCourses));
  };

  // --- MONETIZATION GATE ---
  const handleChangeView = (newView: ViewState, data?: any) => {
      // PREMIUM FEATURES CHECK
      const lockedViews = ['strategy', 'toolkit'];
      
      if (lockedViews.includes(newView) && !user.isSubscribed) {
          // Redirect to subscription with intent
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

  const handleLogin = (loggedInUser: UserProfile) => {
      setUser(loggedInUser);
      localStorage.setItem('careeros_user', JSON.stringify(loggedInUser));
      setIsAuthOpen(false);
      
      // If Admin, go to Admin Dashboard
      if (loggedInUser.primaryFocus === 'Admin') {
          setView('admin');
          return;
      }

      // If it's a fresh user (no name yet or name is 'User' from signup placeholder), go to welcome
      if (loggedInUser.name === 'User' || !loggedInUser.industry) {
          setView('welcome');
      } else {
          setView('dashboard');
          setShowGuide(true);
      }
  };

  const handleLogout = () => {
      localStorage.removeItem('careeros_user');
      localStorage.removeItem('careeros_token');
      setUser(INITIAL_USER);
      setView('hero');
      setShowGuide(false);
  };

  const toggleTheme = () => setDarkMode(!darkMode);

  const handleOnboardingComplete = (targetView: ViewState = 'dashboard') => {
      setView(targetView);
      if (targetView === 'dashboard') {
          setShowGuide(true);
      }
  };

  const openAuth = (mode: 'login' | 'signup', persona?: string) => {
      setAuthMode(mode);
      setTargetPersona(persona);
      setIsAuthOpen(true);
  };

  // --- RENDER LOGIC ---

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
            onContinue={handleOnboardingComplete} 
        />
      );
  }

  // --- MAIN APP SHELL ---

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
              return <Settings user={user} onUpdateUser={handleUpdateUser} onLogout={handleLogout} isDarkMode={darkMode} toggleTheme={toggleTheme} />;
          case 'admin':
              return <AdminDashboard user={user} courses={courses} onAddCourse={handleAddCourse} onUpdateCourse={handleUpdateCourse} />;
          default:
              return <Dashboard user={user} onChangeView={handleChangeView} />;
      }
  };

  return (
    // Update BG to match Jungle Theme (Deep Green/Black)
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
