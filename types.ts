
export type AppMode = 'career';

export interface JobOpportunity {
    id: string;
    title: string;
    company: string;
    type: 'Full-time' | 'Contract' | 'Remote' | 'Freelance' | 'Internship' | 'Tender' | 'Grant' | 'Fellowship' | 'Workshop' | 'Conference';
    budget: string; // Salary range, Grant amount, or Ticket price
    description: string;
    skills: string[];
    postedDate: string;
    location: string;
    isExclusive: boolean; 
    isFeatured: boolean;  
    isVerified: boolean;  
    applicantsCount: number;
    matchReason?: string; // AI explanation
    probability?: number; // 0-100 hiring/winning chance
    logo?: string;
    recommendedCourseId?: string; // Link to Academy
    sourceUrl?: string; // Direct link to application page
}

// --- STRATEGY & SELF ---

export interface Assessment {
    id: string;
    type: 'WheelOfLife' | 'Ikigai' | 'Strengths';
    date: string;
    scores: Record<string, number>; 
    insights: string[];
}

export interface StrategicGoal {
    id: string;
    title: string;
    category: 'Career' | 'Wealth' | 'Health' | 'Network' | 'Learning';
    deadline: string;
    status: 'Not Started' | 'In Progress' | 'Achieved';
    steps: string[];
}

// --- ACADEMY & LEARNING ---

export interface QuizQuestion {
    id: string;
    question: string;
    options: string[];
    correctAnswer: number; 
}

export interface CourseModule {
    id: string;
    title: string;
    duration: string;
    type: 'Video' | 'Audio' | 'Reading' | 'Interactive' | 'Slides';
    isCompleted: boolean;
    contentSummary?: string;
    content?: string; // Actual markdown content for the lesson
}

export interface Course {
    id: string;
    title: string;
    type?: 'LDP' | 'Technical' | 'Soft Skills';
    targetAudience: 'Executive' | 'Professional' | 'Starter' | 'Contractor';
    duration: string;
    price: number;
    rating: number;
    students: number;
    imageColor: string;
    isCertified: boolean;
    description?: string;
    modules: CourseModule[]; 
    exam?: QuizQuestion[];
    partner?: string; 
    pdfSource?: string;
    category?: string;
    skillsGained?: string[]; // New field for specific competencies
}

export interface EnrolledCourse extends Course {
    progress: number;
    status: 'In Progress' | 'Completed';
    currentModuleId?: string;
}

export interface CoachingSession {
    id: string;
    type: 'AI-Simulated' | 'Human-Mentor';
    coachName: string;
    date: string;
    topic: string;
    status: 'Scheduled' | 'Completed';
    notes?: string;
}

export interface ResumeAnalysis {
    score: number;
    summary: string;
    strengths: string[];
    improvements: string[];
    roleFit: string;
}

// NEW: Analysis for Career Pathfinder
export interface RoleMatchAnalysis {
    seniorityLevel: string; // e.g. "Mid-Senior Level"
    recommendedRoles: {
        title: string;
        matchPercentage: number;
        reason: string;
    }[];
    confidenceBoost: string; // Motivational analysis
    hiddenSuperpower: string; // A unique skill combo detected
    industryFit: string[];
}

export interface TailoredResume {
    id: string;
    jobTitle: string;
    company: string;
    content: string;
    date: string;
}

// --- NETWORK ---

export interface Mentor {
    id: string;
    name: string;
    role: string;
    company: string;
    expertise: string;
    match: number;
    isConnected: boolean;
}

export interface NetworkEvent {
    id: string;
    date: string;
    time: string;
    month: string;
    day: string;
    type: string;
    title: string;
    host: string;
    attendees: number;
    image: string;
    isAttending: boolean;
    desc: string;
}

export interface UserProfile {
  name: string;
  headline?: string; 
  email?: string;
  location?: string;
  
  // Career Identity
  industry?: string;
  currentRole?: string;
  yearsExperience?: number;
  // UPDATED: Added comprehensive list of personas to match Auth/Landing logic
  primaryFocus?: 'Executive' | 'Professional' | 'Student' | 'Freelancer' | 'Recruiter' | 'AssetOwner' | 'GrowthStartup' | 'Contractor' | 'Admin'; 
  bio?: string;
  keywords?: string[];
  phoneNumber?: string;
  businessDescription?: string;
  companyName?: string;
  role?: string;
  
  // App State
  isSubscribed?: boolean;
  appliedJobIds?: string[];
  savedJobIds?: string[];
  
  // Strategy & Growth
  assessments?: Assessment[];
  strategicRoadmap?: StrategicGoal[];
  scaleScore?: number; // Personal Balance Score (0-1000)
  marketValue?: number; // Estimated Salary/Rate

  // Content
  resumeText?: string; // The Master CV
  resumeHistory?: TailoredResume[]; // History of applied/tailored CVs
  resumeAnalysis?: ResumeAnalysis;
  pathfinderAnalysis?: RoleMatchAnalysis; // Saved Pathfinder results
  profileImage?: string;
  
  // Learning
  enrolledCourses?: EnrolledCourse[];
  coachingSessions?: CoachingSession[];
  
  skillScore?: number; 

  // Network
  network?: Mentor[];
  events?: NetworkEvent[];
}

export interface NotificationSettings {
  email: boolean;
  whatsapp: boolean;
  push: boolean;
  sms: boolean;
  frequency?: string;
}

export type ViewState = 'hero' | 'welcome' | 'dashboard' | 'marketplace' | 'academy' | 'strategy' | 'network' | 'settings' | 'toolkit' | 'subscription' | 'admin';

export interface AIMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    actionLink?: { label: string; view: ViewState };
}

// --- NEW TYPES FOR GEMINI SERVICES ---

export interface Bid {
    id: string;
    title: string;
    agency: string;
    value: string;
    procurementMethod: string;
    publicationDate: string;
    closingDate: string;
    industry?: string;
    country?: string;
    matchScore?: number;
    requirements: string[];
    description?: string;
    status: 'Open' | 'Closed' | 'Reviewing';
    sourceUrl?: string;
    agencyReputation?: number;
    projectDuration?: string;
}

export interface StrategicPillar {
    title: string;
    description: string;
    objectives: string[];
}
