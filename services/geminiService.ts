
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Bid, StrategicPillar, JobOpportunity, ResumeAnalysis, QuizQuestion, StrategicGoal, Course, CourseModule, UserProfile, Mentor, NetworkEvent } from '../types';

const getClient = () => {
    try {
        if (typeof process === 'undefined' || !process.env) {
            return null;
        }
        const apiKey = process.env.API_KEY;
        if (!apiKey) {
            console.error("API Key not found");
            return null;
        }
        return new GoogleGenAI({ apiKey });
    } catch (e) {
        console.error("Failed to initialize GenAI client", e);
        return null;
    }
}

// --- NETWORK GENERATION ---

export const generateMentors = async (industry: string, role: string): Promise<Mentor[]> => {
    const ai = getClient();
    if (!ai) return [];

    const prompt = `
    Generate 5 realistic professional mentor profiles for a user in:
    Industry: ${industry}
    Role: ${role}
    
    The mentors should be slightly more senior/experienced.
    Return JSON array of Mentor objects.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            name: { type: Type.STRING },
                            role: { type: Type.STRING },
                            company: { type: Type.STRING },
                            expertise: { type: Type.STRING },
                            match: { type: Type.INTEGER },
                            isConnected: { type: Type.BOOLEAN }
                        },
                        required: ["id", "name", "role", "company", "expertise", "match"]
                    }
                }
            }
        });
        return JSON.parse(response.text || '[]') as Mentor[];
    } catch (e) {
        console.error("Mentor gen failed", e);
        return [];
    }
};

export const generateEvents = async (industry: string, location: string): Promise<NetworkEvent[]> => {
    const ai = getClient();
    if (!ai) return [];

    const prompt = `
    Generate 4 realistic professional networking events (Webinars, Meetups, Conferences) for:
    Industry: ${industry}
    Location: ${location} (If global, use 'Online' or major cities).
    
    Dates should be in the future relative to 2025/2026.
    
    Return JSON array of NetworkEvent objects.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            date: { type: Type.STRING },
                            time: { type: Type.STRING },
                            month: { type: Type.STRING },
                            day: { type: Type.STRING },
                            type: { type: Type.STRING },
                            title: { type: Type.STRING },
                            host: { type: Type.STRING },
                            attendees: { type: Type.INTEGER },
                            image: { type: Type.STRING },
                            isAttending: { type: Type.BOOLEAN },
                            desc: { type: Type.STRING }
                        },
                        required: ["id", "date", "time", "month", "day", "type", "title", "host", "desc"]
                    }
                }
            }
        });
        return JSON.parse(response.text || '[]') as NetworkEvent[];
    } catch (e) {
        console.error("Event gen failed", e);
        return [];
    }
};

// --- BOARDROOM SIMULATION (NEW) ---

export const simulateBoardroom = async (topic: string, context: string): Promise<{speaker: string, text: string, sentiment: 'Positive'|'Negative'|'Neutral'}[]> => {
    const ai = getClient();
    if (!ai) return [];

    const prompt = `
    Simulate a high-stakes boardroom debate about the following user query/dilemma.
    
    USER CONTEXT: ${context}
    TOPIC/DILEMMA: "${topic}"
    
    THE BOARD (Personas):
    1. "The CFO" (Marcus): Conservative, focused on risk, ROI, and cash flow. Skeptical.
    2. "The Visionary" (Elena): Ambitious, focused on growth, brand, and long-term potential. Optimistic.
    3. "The Strategist" (Dr. K): Pragmatic, Machiavellian, focused on leverage and execution. Neutral.
    
    TASK:
    Generate a 3-turn conversation where they debate the best course of action for the user.
    They should talk to each other and the user.
    
    Return JSON array of objects: { speaker: string, text: string, sentiment: 'Positive'|'Negative'|'Neutral' }
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            speaker: { type: Type.STRING },
                            text: { type: Type.STRING },
                            sentiment: { type: Type.STRING, enum: ['Positive', 'Negative', 'Neutral'] }
                        },
                        required: ["speaker", "text", "sentiment"]
                    }
                }
            }
        });
        return JSON.parse(response.text || '[]') as any[];
    } catch (e) {
        console.error("Boardroom sim failed", e);
        return [
            { speaker: "System", text: "Boardroom simulation unavailable. Please try again.", sentiment: "Neutral" }
        ];
    }
};

// --- IDENTITY ARCHITECT ---

export const parseProfileFromText = async (text: string, mode: string): Promise<Partial<UserProfile> | null> => {
    const ai = getClient();
    if (!ai) return null;

    const prompt = `
    Analyze the following raw text input from a user onboarding to "CareerOS".
    User Mode: ${mode} (Contractor/Business OR Professional/Talent).
    
    RAW INPUT:
    "${text.slice(0, 5000)}"
    
    TASK:
    Extract structured profile data. 
    - If mode is 'Contractor', treat 'name' as Company Name and 'role' as Director/Lead.
    - Infer 'marketValue' based on experience level (Junior=$2000, Mid=$4000, Senior=$8000, Exec=$15000).
    - Extract 5-7 distinct keywords/skills.
    
    Return JSON matching the UserProfile interface subset:
    {
        name: string,
        email: string (if found, else null),
        phoneNumber: string (if found, else null),
        industry: string,
        currentRole: string,
        companyName: string (current employer or own company),
        bio: string (professional summary, max 200 chars),
        keywords: string[],
        yearsExperience: number,
        marketValue: number
    }
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        email: { type: Type.STRING },
                        phoneNumber: { type: Type.STRING },
                        industry: { type: Type.STRING },
                        currentRole: { type: Type.STRING },
                        companyName: { type: Type.STRING },
                        bio: { type: Type.STRING },
                        keywords: { type: Type.ARRAY, items: { type: Type.STRING } },
                        yearsExperience: { type: Type.NUMBER },
                        marketValue: { type: Type.NUMBER }
                    }
                }
            }
        });
        return response.text ? JSON.parse(response.text) : null;
    } catch (e) {
        console.error("Identity extraction failed", e);
        return null;
    }
};

// --- SIMULATION ENGINE ---

export const generateSimulationScenario = async (moduleTitle: string): Promise<{
    role: string;
    context: string;
    objective: string;
    openingLine: string;
} | null> => {
    const ai = getClient();
    if (!ai) return null;

    const prompt = `
    Create a realistic, high-stakes roleplay scenario based on the topic: "${moduleTitle}".
    
    The user needs to practice this skill. Design a counter-party persona (e.g., A skeptic boss, an angry client, a frugal procurement officer).
    
    Return JSON:
    - role: The persona the AI will play.
    - context: The setting and situation.
    - objective: What the user needs to achieve.
    - openingLine: The first thing the AI persona says to start the conversation.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        role: { type: Type.STRING },
                        context: { type: Type.STRING },
                        objective: { type: Type.STRING },
                        openingLine: { type: Type.STRING },
                    },
                    required: ["role", "context", "objective", "openingLine"]
                }
            }
        });
        return response.text ? JSON.parse(response.text) : null;
    } catch (e) {
        console.error("Sim gen failed", e);
        return null;
    }
};

export const evaluateSimulation = async (history: {role: string, text: string}[], objective: string): Promise<{
    score: number;
    feedback: string;
    tips: string[];
} | null> => {
    const ai = getClient();
    if (!ai) return null;

    const prompt = `
    Evaluate the user's performance in this roleplay simulation.
    Objective: "${objective}"
    
    Conversation History:
    ${history.map(h => `${h.role}: ${h.text}`).join('\n')}
    
    Task:
    1. Score the user (0-100) based on effectiveness, tone, and strategy.
    2. Provide 1 sentence of direct feedback.
    3. Provide 3 actionable tips for next time.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.INTEGER },
                        feedback: { type: Type.STRING },
                        tips: { type: Type.ARRAY, items: { type: Type.STRING } }
                    },
                    required: ["score", "feedback", "tips"]
                }
            }
        });
        return response.text ? JSON.parse(response.text) : null;
    } catch (e) {
        console.error("Sim eval failed", e);
        return null;
    }
};

// --- AUDIO GENERATION ---

export const generateLearningPodcast = async (moduleTitle: string, content: string): Promise<string | null> => {
    const ai = getClient();
    if (!ai) return null;

    // 1. First, generate a natural dialogue script
    const scriptPrompt = `
    Convert the following course material into a concise, engaging podcast script between two hosts: 'Alex' (The curious host) and 'Dr. J' (The deep-dive expert).
    
    TOPIC: ${moduleTitle}
    CONTENT: "${content.slice(0, 5000)}"
    
    RULES:
    - Keep it under 2 minutes of speaking time.
    - Make it conversational, not reading a script.
    - Start directly. No "Welcome to the podcast".
    - Alex asks smart questions, Dr. J provides insightful, contrarian answers.
    - Format strictly as:
      Alex: [text]
      Dr. J: [text]
    `;

    try {
        // Step 1: Scripting
        const scriptResponse = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: scriptPrompt
        });
        
        const scriptText = scriptResponse.text;
        if (!scriptText) throw new Error("Failed to generate script");

        // Step 2: Synthesis
        // We prompt the model to "Say" the dialogue, using the multi-speaker config
        const audioPrompt = `Read this dialogue naturally:\n\n${scriptText}`;

        const audioResponse = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text: audioPrompt }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    multiSpeakerVoiceConfig: {
                        speakerVoiceConfigs: [
                            {
                                speaker: 'Alex',
                                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } // Energetic
                            },
                            {
                                speaker: 'Dr. J',
                                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } } // Deep, authoritative
                            }
                        ]
                    }
                }
            }
        });

        // Return Base64 Audio
        return audioResponse.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || null;

    } catch (e) {
        console.error("Podcast generation failed", e);
        return null;
    }
};

// --- EXISTING SERVICES ---

export const generateOpportunities = async (industry: string, country: string = "Worldwide"): Promise<Bid[]> => {
    const ai = getClient();
    if (!ai) return [];

    let searchDomains = "";
    let locationContext = "";

    if (country.toLowerCase() === 'zimbabwe') {
        searchDomains = "site:egp.praz.org.zw OR site:praz.org.zw OR site:gazettes.africa";
        locationContext = "Zimbabwe";
    } else if (country.toLowerCase() === 'global' || country.toLowerCase() === 'worldwide') {
        searchDomains = "site:ungm.org OR site:devbusiness.un.org OR site:tenders.info OR site:dgmarket.com";
        locationContext = "Global / International";
    } else {
        searchDomains = `site:gov.${country.substring(0, 2).toLowerCase()} OR site:tenders.${country.toLowerCase()}`;
        locationContext = country;
    }

    const prompt = `
    Find 20 REAL, ACTIVE government procurement opportunities (Tenders, RFPs, Bids) for the "${industry}" sector.
    Target Location: **${locationContext}**.
    
    CRITICAL SOURCE INSTRUCTION:
    - You MUST perform a Google Search using the tool provided.
    - SEARCH QUERY: "${searchDomains} ${industry} tender notice 2025"
    - If targeting Global, look for World Bank, UN, or International Development tenders.
    
    DATE RULES (STRICT):
    - Assume today is **FEBRUARY 15, 2026**.
    - **Closing Date MUST be after FEBRUARY 15, 2026**.
    
    URL SAFETY RULES (NO 404s):
    - **sourceUrl**: NEVER guess a deep link.
    - If you find a verified PDF link, use it.
    - If you cannot find a specific verified link, you **MUST** use a specific Google Search URL like "https://www.google.com/search?q=${industry}+${country}+Tenders+2026".
    
    Data Formatting:
    - **id**: Use the official ref number if visible, else generate (e.g. REF/2026/004).
    - **Match Score**: Estimate relevance (0-100).
    - **Status**: 'Open'.

    Return a JSON array of bids.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            title: { type: Type.STRING },
                            agency: { type: Type.STRING },
                            value: { type: Type.STRING, description: "Estimated value e.g. $500,000" },
                            procurementMethod: { type: Type.STRING, description: "e.g. International Competitive Bidding, RFP" },
                            publicationDate: { type: Type.STRING },
                            closingDate: { type: Type.STRING },
                            industry: { type: Type.STRING },
                            country: { type: Type.STRING },
                            matchScore: { type: Type.INTEGER },
                            requirements: { 
                                type: Type.ARRAY, 
                                items: { type: Type.STRING } 
                            },
                            description: { type: Type.STRING },
                            status: { type: Type.STRING, enum: ['Open', 'Closed', 'Reviewing'] },
                            sourceUrl: { type: Type.STRING, description: "Direct PDF link or Search URL" },
                            agencyReputation: { type: Type.INTEGER },
                            projectDuration: { type: Type.STRING }
                        },
                        required: ["id", "title", "agency", "value", "procurementMethod", "publicationDate", "closingDate", "requirements", "matchScore", "country", "status"]
                    }
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as Bid[];
        }
        return [];
    } catch (error) {
        console.error("Failed to generate opportunities:", error);
        return [];
    }
};

export const generateMarketplaceOpportunities = async (
    industry: string, 
    location: string, 
    keywords: string[],
    jobType?: string,
    minSalary?: number
): Promise<JobOpportunity[]> => {
    const ai = getClient();
    if (!ai) return [];

    const isGlobal = location.toLowerCase() === 'global' || location.toLowerCase() === 'worldwide';
    const locString = isGlobal ? "Globally (Worldwide)" : `in ${location}`;
    
    let searchFocus = `Find 20 REAL, ACTIVE Opportunities ${locString} related to "${industry}" and keywords: ${keywords.join(', ')}.`;
    let domainFocus = "";
    
    const isGrantSearch = keywords.some(k => k.toLowerCase().includes('grant') || k.toLowerCase().includes('funding') || k.toLowerCase().includes('donor'));
    const isFellowshipSearch = keywords.some(k => k.toLowerCase().includes('fellowship') || k.toLowerCase().includes('residency'));
    const isEventSearch = keywords.some(k => k.toLowerCase().includes('workshop') || k.toLowerCase().includes('conference') || k.toLowerCase().includes('summit'));

    if (jobType === 'Grant' || isGrantSearch) {
        searchFocus = `Find 20 ACTIVE Grants, Funding Calls, or Donor Opportunities for "${industry}" ${locString}. Focus on ESG, Tech, NGOs, and Startups.`;
        domainFocus = "site:fundsforngos.org OR site:terravivagrants.org OR site:grants.gov OR site:challenge.gov";
    } else if (jobType === 'Fellowship' || isFellowshipSearch) {
        searchFocus = `Find 20 ACTIVE Fellowships, Residencies, or Professional Exchange programs for "${industry}" professionals ${locString}.`;
        domainFocus = "site:opportunitiesforafricans.com OR site:mandelawashingtonfellowship.org OR site:profellow.com";
    } else if (jobType === 'Workshop' || jobType === 'Conference' || isEventSearch) {
        searchFocus = `Find 20 UPCOMING Seminars, Workshops, Critical Empowerment Conferences, or Industry Summits for "${industry}" ${locString}.`;
        domainFocus = "site:eventbrite.com OR site:linkedin.com/events OR site:10times.com";
    } else {
        if (minSalary && minSalary > 0) {
            searchFocus += ` PRIORITIZE roles with estimated budget above $${minSalary}.`;
        }
        if (jobType && jobType !== 'All') {
            searchFocus += ` FOCUS exclusively on "${jobType}" type roles.`;
        }
        if (isGlobal) {
            domainFocus = "site:weworkremotely.com OR site:linkedin.com/jobs OR site:indeed.com OR site:glassdoor.com OR site:remoteok.com";
        } else {
            domainFocus = `site:linkedin.com/jobs/ ${location} OR site:indeed.com ${location}`;
        }
    }

    const prompt = `
    ${searchFocus}
    
    Context:
    - User Keywords: ${keywords.join(', ')}
    - **SEARCH STRATEGY**: Perform a deep Google Search using these domains if relevant: ${domainFocus}.
    - **Goal**: Find REAL, recent listings. Focus on TECH, ESG, Finance, or whatever specific niche the user asked for in "${industry}".
    - **External Links**: You MUST try to find the "sourceUrl" (Direct application link or official listing page).
    
    Formatting:
    - **Type**: Must be strictly one of: 'Full-time' | 'Contract' | 'Remote' | 'Freelance' | 'Internship' | 'Tender' | 'Grant' | 'Fellowship' | 'Workshop' | 'Conference'.
    - **Budget**: 
        - For Jobs: Estimate salary (e.g. "$4,000 - $6,000/mo").
        - For Grants: Grant size (e.g. "$50,000 Funding").
        - For Workshops: Ticket price (e.g. "Free" or "$500 Entry").
        - For Fellowships: Stipend amount (e.g. "Fully Funded").
    - **Company**: For Events/Workshops, this is the Organizer/Host.
    - **sourceUrl**: Valid link to the opportunity. If not found, use a smart Google Search link (e.g., "https://www.google.com/search?q=${industry}+${location}+Application").
    
    Return a JSON array of JobOpportunity objects.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            title: { type: Type.STRING },
                            company: { type: Type.STRING },
                            type: { type: Type.STRING, enum: ['Full-time', 'Contract', 'Remote', 'Freelance', 'Internship', 'Tender', 'Grant', 'Fellowship', 'Workshop', 'Conference'] },
                            budget: { type: Type.STRING },
                            description: { type: Type.STRING },
                            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                            postedDate: { type: Type.STRING },
                            location: { type: Type.STRING },
                            isExclusive: { type: Type.BOOLEAN },
                            isFeatured: { type: Type.BOOLEAN },
                            isVerified: { type: Type.BOOLEAN },
                            applicantsCount: { type: Type.INTEGER },
                            sourceUrl: { type: Type.STRING, description: "URL to apply or view details" }
                        },
                        required: ["id", "title", "company", "type", "budget", "description", "skills", "location"]
                    }
                }
            }
        });

        if (response.text) {
            const jobs = JSON.parse(response.text) as JobOpportunity[];
            return jobs.map((job, idx) => {
                const courseIds = ['c1', 'c2', 'c3', 'c4', 'c5']; 
                if (idx % 2 === 0) {
                    return { ...job, recommendedCourseId: courseIds[idx % courseIds.length] };
                }
                return job;
            });
        }
        return [];
    } catch (error) {
        console.error("Failed to generate marketplace opportunities:", error);
        return [];
    }
};

export const chatWithNexus = async (
    message: string, 
    context: string,
    history: {role: string, content: string}[]
): Promise<string> => {
    const ai = getClient();
    if (!ai) return "I am offline. Please check your connection.";

    const prompt = `
    You are Nexus, an elite "Chief of Staff" AI for the ProcureAI platform.
    
    USER CONTEXT:
    ${context}
    
    YOUR ROLE:
    - You are helpful, professional, and strategic.
    - You have access to Google Search to find real-time information (exchange rates, news, regulations).
    - If the user asks about the app, guide them to the right module (Dashboard, Strategy, Marketplace, Finance).
    
    CURRENT QUERY:
    ${message}
    
    INSTRUCTIONS:
    - Be concise.
    - If the user asks for real-world info (e.g. "What is the ZiG rate?"), USE THE SEARCH TOOL.
    - If the user asks for advice, provide actionable steps.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
            }
        });
        
        return response.text || "I processed that, but have no response.";
    } catch (e) {
        console.error(e);
        return "I'm having trouble connecting to the network right now.";
    }
};

export const chatWithMentor = async (
    message: string,
    persona: string,
    history: {role: 'user'|'ai', text: string}[]
): Promise<string> => {
    const ai = getClient();
    if (!ai) return "Let me reflect on that...";

    const prompt = `
    ${persona}
    
    Conversation History:
    ${history.map(h => `${h.role === 'user' ? 'Candidate' : 'Mentor'}: ${h.text}`).join('\n')}
    
    Candidate's New Message:
    "${message}"
    
    INSTRUCTIONS:
    - Be brief (max 4 sentences).
    - If acting as the 'Zero to One' coach, be direct, challenge assumptions, and focus on creating monopolies/unique value.
    - Don't just give answers; force the user to think.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });
        return response.text || "That's an interesting perspective.";
    } catch (e) {
        console.error(e);
        return "I need a moment to think about that.";
    }
};

export const enhanceModuleContent = async (rawText: string, type: 'Slides' | 'Reading' | 'Video' | 'Audio'): Promise<string> => {
    const ai = getClient();
    if (!ai) return rawText;

    let formattingInstruction = "";
    if (type === 'Slides') {
        formattingInstruction = `
        FORMAT AS A VISUAL SLIDE DECK (Markdown):
        1. Break the content into 4-6 distinct "slides" using '---' as the delimiter.
        2. EACH slide MUST start with a H2 title (## Title).
        3. MANDATORY STRUCTURE PER SLIDE (Choose one or mix):
           - **Concept Card**: Use a bullet list for main points (e.g. "- Point 1").
           - **Strategic Insight**: Use a blockquote (>) for the key takeaway or "Golden Rule".
           - **Data Matrix**: Use a STRICT MARKDOWN TABLE to compare concepts. 
             * CRITICAL: The table MUST include the separator row with at least 3 dashes (e.g. \`|---|---|\`) between headers and body.
             * Example:
               | Strategy | Outcome |
               |---|---|
               | Old Way | Low Growth |
               | New Way | High Growth |
           - **Impact Stat**: Use bold text for key metrics (e.g. "**30% Increase**").
        4. Keep text concise. Think "Apple Keynote" not "Textbook".
        `;
    } else {
        formattingInstruction = `
        FORMAT AS A PROFESSIONAL ARTICLE (Markdown):
        1. Use H1 for the main title.
        2. Use H2/H3 for subsections.
        3. Use bolding for emphasis.
        4. Use blockquotes (>) for key callouts.
        5. Use strict markdown tables for structured data (ensure |---| separator row).
        6. Ensure logical flow and professional tone.
        `;
    }

    const prompt = `
    Act as an Instructional Designer. Enhance the following raw course material into a highly visual, structured format.
    
    RAW CONTENT:
    "${rawText}"
    
    ${formattingInstruction}
    
    OUTPUT:
    Return ONLY the formatted Markdown. Do not add "Here is the content" preamble.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });
        return response.text || rawText;
    } catch (e) {
        console.error("Content enhancement failed", e);
        return rawText;
    }
};

export const generateCareerRoadmap = async (
    wheelData: Record<string, number>,
    userRole: string
): Promise<StrategicGoal[]> => {
    const ai = getClient();
    if (!ai) return [];

    const prompt = `
    Act as a Life, Career, and Business Strategist.
    
    Client Role / Business Context: ${userRole}
    
    Assessment Data (Scale 1-10):
    ${Object.entries(wheelData).map(([k,v]) => `- ${k}: ${v}`).join('\n')}
    
    TASK:
    Generate a 100-Day Strategic Roadmap consisting of 3-4 high-impact goals to optimize the client's system (whether personal or business).
    Focus on the areas with the lowest scores.
    If the categories are business-related (Sales, Finance, Ops), generate business growth goals.
    If the categories are personal (Career, Health), generate personal growth goals.
    
    Return JSON array of StrategicGoal objects.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            title: { type: Type.STRING },
                            category: { type: Type.STRING, enum: ['Career', 'Wealth', 'Health', 'Network', 'Learning'] },
                            deadline: { type: Type.STRING },
                            status: { type: Type.STRING, enum: ['Not Started'] },
                            steps: { type: Type.ARRAY, items: { type: Type.STRING } }
                        },
                        required: ["id", "title", "category", "deadline", "status", "steps"]
                    }
                }
            }
        });
        return JSON.parse(response.text || '[]') as StrategicGoal[];
    } catch (e) {
        console.error(e);
        return [];
    }
};

export const analyzeResume = async (resumeText: string, industry: string): Promise<ResumeAnalysis | null> => {
    const ai = getClient();
    if (!ai) return null;

    const prompt = `
    Act as a Global Human Capital & Procurement Expert. Analyze the following document.
    It could be a CV/Resume OR a Company Capability Statement.
    Industry Context: ${industry}
    
    DOCUMENT CONTENT:
    "${resumeText.slice(0, 10000)}"
    
    TASK:
    1. Score the document (0-100) based on professional standards (ATS friendliness, clarity, impact).
    2. Write a professional Executive Summary (max 3 sentences).
    3. Identify 3 Key Strengths (or Core Competencies for companies).
    4. Identify 3 Specific Improvements.
    5. Suggest the Best Fit Role Title OR Business Category.
    
    Return JSON format only.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        score: { type: Type.INTEGER },
                        summary: { type: Type.STRING },
                        strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                        improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
                        roleFit: { type: Type.STRING }
                    },
                    required: ["score", "summary", "strengths", "improvements", "roleFit"]
                }
            }
        });
        return JSON.parse(response.text || '{}') as ResumeAnalysis;
    } catch (e) {
        console.error(e);
        return null;
    }
};

export const improveResumeText = async (text: string): Promise<string> => {
    const ai = getClient();
    if (!ai) return text;

    const prompt = `
    You are an Expert Editor. Your goal is to POLISH the language of the provided resume/profile to be more impactful and executive-level, while STRICTLY PRESERVING the facts.
    
    INPUT:
    ${text}
    
    STRICT RULES (DO NOT HALLUCINATE):
    1. **PRESERVE IDENTITY:** Do NOT change the Name, Phone Number, Email, Address, or LinkedIn links. Keep them exactly as they are at the top.
    2. **PRESERVE HISTORY:** Do NOT invent new Job Titles, Company Names, or Dates. Keep the work history structure exactly as provided.
    3. **NO NEW FACTS:** Do NOT add skills or achievements that are not implied in the source text. 
    4. **ENHANCEMENT ONLY:** You MAY rephrase bullet points to use strong action verbs (e.g., change "responsible for sales" to "Spearheaded sales operations driving 20% growth"). Fix grammar and formatting.
    5. **MARKDOWN FORMAT:** Output clean Markdown with H1 for Name, H2 for Sections, and H3 for Roles.
    
    OUTPUT:
    Return only the improved Markdown text.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });
        return response.text || text;
    } catch (error) {
        console.error("Resume improvement failed", error);
        return text;
    }
};

export const tailorResumeToJob = async (resume: string, jobTitle: string, jobDesc: string): Promise<string> => {
    const ai = getClient();
    if (!ai) return resume;

    const prompt = `
    TAILOR this document for a specific opportunity.
    
    OPPORTUNITY: ${jobTitle}
    REQUIREMENTS: ${jobDesc}
    
    CURRENT DOCUMENT:
    ${resume}
    
    INSTRUCTIONS:
    - Rewrite the Professional/Executive Summary to align specifically with the opportunity keywords.
    - Highlight relevant experience that matches the requirements.
    - Do not invent facts, but rephrase existing experience to highlight transferrable skills.
    - Keep it professional and concise.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });
        return response.text || resume;
    } catch (error) {
        console.error("Resume tailoring failed", error);
        return resume;
    }
};

export const generateCoverLetter = async (job: JobOpportunity, resumeSummary: string): Promise<string> => {
    const ai = getClient();
    if (!ai) return "Dear Hiring Manager,\n\nI am interested in this role.";

    const prompt = `
    Write a highly persuasive, professional cover letter (or bid proposal) for the following application.
    
    TARGET:
    Role/Tender: ${job.title}
    Organization: ${job.company}
    Details: ${job.description}
    Skills Required: ${job.skills.join(', ')}
    
    APPLICANT PROFILE:
    ${resumeSummary}
    
    INSTRUCTIONS:
    - Keep it under 200 words.
    - Be punchy and direct.
    - Specifically link the applicant's strengths to the requirements.
    - Use a confident, professional tone appropriate for the context (Job Application vs Business Tender).
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });
        return response.text || "";
    } catch (e) {
        return "Dear Hiring Manager...";
    }
};

export const findMatchedJobs = async (resume: ResumeAnalysis, location: string): Promise<JobOpportunity[]> => {
    const ai = getClient();
    if (!ai) return [];

    const prompt = `
    Based on this candidate profile, find 4 active HIGH-PROBABILITY job listings in ${location}.
    
    Candidate Role Fit: ${resume.roleFit}
    Key Strengths: ${resume.strengths.join(', ')}
    
    INSTRUCTIONS:
    - Search for roles where this specific profile would be a top 10% applicant.
    - Focus on 'Urgent Hiring' or recent posts.
    - Include a 'matchReason' explaining why they will get this job.
    - Include a 'probability' score (0-100).
    
    Return JSON array of JobOpportunity.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            title: { type: Type.STRING },
                            company: { type: Type.STRING },
                            type: { type: Type.STRING, enum: ['Full-time', 'Contract', 'Freelance', 'Tender'] },
                            budget: { type: Type.STRING },
                            description: { type: Type.STRING },
                            skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                            postedDate: { type: Type.STRING },
                            location: { type: Type.STRING },
                            matchReason: { type: Type.STRING },
                            probability: { type: Type.INTEGER },
                            isVerified: { type: Type.BOOLEAN }
                        },
                        required: ["title", "company", "matchReason", "probability"]
                    }
                }
            }
        });
        return JSON.parse(response.text || '[]') as JobOpportunity[];
    } catch (e) {
        console.error(e);
        return [];
    }
};

export const generateInterviewQuestion = async (role: string, context: string, previousAnswer?: string): Promise<string> => {
    const ai = getClient();
    if (!ai) return "Let's start the interview. Tell me about yourself.";

    let prompt = `You are a tough but fair Hiring Manager (or Procurement Officer) interviewing a candidate/vendor for a ${role} position.`;
    
    if (previousAnswer) {
        prompt += `
        The candidate just answered your previous question.
        Candidate's Answer: "${previousAnswer}"
        
        Task:
        1. Briefly acknowledge the answer (critique it if it was weak, praise if strong).
        2. Ask a follow-up question OR a new behavioral/technical question relevant to ${role}.
        Keep it conversational and under 2 sentences.
        `;
    } else {
        prompt += `
        Start the interview. Ask a relevant opening question (not just "tell me about yourself", make it specific to the industry context: ${context}).
        `;
    }

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt
        });
        return response.text || "Could you elaborate on your experience?";
    } catch (e) {
        return "Let's move on. What are your expectations?";
    }
};

export const generateQuiz = async (topic: string, difficulty: string = 'Intermediate'): Promise<QuizQuestion[]> => {
    const ai = getClient();
    if (!ai) return [];

    const prompt = `
    Create a 3-question 'Zero to One' style exam for: "${topic}".
    
    PHILOSOPHY:
    - Avoid rote memorization.
    - Focus on high-stakes judgment calls, application of secrets, and strategic intuition.
    - The correct answer should be contrarian or counter-intuitive but factually correct within the context of effective leadership.
    
    Format: JSON Array of QuizQuestion objects.
    Each object must have:
    - id (string)
    - question (string)
    - options (array of 4 strings)
    - correctAnswer (index of the correct option, 0-3)
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            question: { type: Type.STRING },
                            options: { 
                                type: Type.ARRAY, 
                                items: { type: Type.STRING } 
                            },
                            correctAnswer: { type: Type.INTEGER }
                        },
                        required: ["id", "question", "options", "correctAnswer"]
                    }
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as QuizQuestion[];
        }
        return [];
    } catch (e) {
        console.error("Quiz generation failed", e);
        return [];
    }
};

export const generateCourseFromTopic = async (topic: string, focus: string): Promise<Course | null> => {
    const ai = getClient();
    if (!ai) return null;

    const prompt = `
    Create a comprehensive professional course curriculum for the topic: "${topic}".
    Target Audience / Focus: "${focus}".
    
    The course should be structured for a professional learning platform (CareerOS).
    
    Requirements:
    - Title: Catchy and professional.
    - Description: Engaging summary.
    - Type: 'Technical' | 'Soft Skills' | 'LDP' (Leadership Development Program).
    - Target Audience: 'Executive' | 'Professional' | 'Starter' | 'Contractor'.
    - Duration: e.g. "3 Weeks".
    - Category: The general field (e.g. "Management", "Finance").
    - Skills Gained: 3-5 key skills.
    - Modules: 3-5 modules. Each module has a title, duration (e.g. "20 mins"), type ('Video' | 'Reading' | 'Audio' | 'Slides'), and a brief content summary.
    - Exam: 3 quiz questions.
    
    Return a JSON object matching the Course interface.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                        type: { type: Type.STRING, enum: ['Technical', 'Soft Skills', 'LDP'] },
                        targetAudience: { type: Type.STRING, enum: ['Executive', 'Professional', 'Starter', 'Contractor'] },
                        duration: { type: Type.STRING },
                        category: { type: Type.STRING },
                        skillsGained: { type: Type.ARRAY, items: { type: Type.STRING } },
                        modules: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    title: { type: Type.STRING },
                                    duration: { type: Type.STRING },
                                    type: { type: Type.STRING, enum: ['Video', 'Reading', 'Audio', 'Slides'] },
                                    contentSummary: { type: Type.STRING }
                                },
                                required: ["title", "duration", "type"]
                            }
                        },
                        exam: {
                            type: Type.ARRAY,
                            items: {
                                type: Type.OBJECT,
                                properties: {
                                    question: { type: Type.STRING },
                                    options: { type: Type.ARRAY, items: { type: Type.STRING } },
                                    correctAnswer: { type: Type.INTEGER }
                                },
                                required: ["question", "options", "correctAnswer"]
                            }
                        }
                    },
                    required: ["title", "description", "type", "targetAudience", "duration", "modules", "exam"]
                }
            }
        });

        if (response.text) {
            const data = JSON.parse(response.text);
            
            // Map to Course type
            const course: Course = {
                id: `gen-${Date.now()}`,
                title: data.title,
                type: data.type,
                targetAudience: data.targetAudience,
                duration: data.duration,
                price: 0,
                rating: 5.0, // Default rating for new course
                students: 0,
                imageColor: 'bg-indigo-900', // Default color
                isCertified: true,
                description: data.description,
                category: data.category || 'General',
                skillsGained: data.skillsGained || [],
                modules: data.modules.map((m: any, i: number) => ({
                    id: `mod-${i}`,
                    title: m.title,
                    duration: m.duration,
                    type: m.type,
                    isCompleted: false,
                    contentSummary: m.contentSummary,
                    content: `# ${m.title}\n\n${m.contentSummary || 'Module content pending generation.'}` // Placeholder content
                })),
                exam: data.exam.map((q: any, i: number) => ({
                    id: `q-${i}`,
                    question: q.question,
                    options: q.options,
                    correctAnswer: q.correctAnswer
                }))
            };
            return course;
        }
        return null;
    } catch (e) {
        console.error("Course generation failed", e);
        return null;
    }
};

export const getMarketCourseSuggestions = async (): Promise<{title: string, topic: string, audience: string, reason: string}[]> => {
    const ai = getClient();
    if (!ai) return [];

    const prompt = `
    Analyze current job market trends (Tech, Finance, Healthcare, Construction) for late 2025/2026.
    Identify 3 high-demand skill gaps where a professional course is needed.
    
    Return a JSON array of 3 suggestions.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: prompt,
            config: {
                tools: [{googleSearch: {}}],
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            title: { type: Type.STRING },
                            topic: { type: Type.STRING },
                            audience: { type: Type.STRING },
                            reason: { type: Type.STRING }
                        },
                        required: ["title", "topic", "audience", "reason"]
                    }
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text);
        }
        return [];
    } catch (e) {
        console.error("Market suggestions failed", e);
        return [];
    }
};
