"use client"

import type React from "react"
import { createContext, useContext, useEffect, useMemo, useState } from "react"

type Lang = "en" | "hi"
type LanguageContextValue = {
  lang: Lang
  toggleLanguage: () => void
  t: (key: string, fallback?: string) => string
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

const DICTIONARY: Record<Lang, Record<string, string>> = {
  en: {
    appName: "LinkWork",
    // nav
    login: "Login",
    signup: "Sign up",
    logout: "Logout",
    gigs: "Gigs",
    clientDashboard: "Client Dashboard",
    freelancerDashboard: "Freelancer Dashboard",
    // common
    status: "Status",
    approve: "Approve",
    reject: "Reject",
    startChat: "Start Chat",
    proposals: "Proposals",
    local: "Vocal for Local",
    view: "View",
    cancel: "Cancel",
    projectNotFound: "Project not found.",
    closed: "closed",
    // home
    tagline: "A simple, local-first marketplace connecting clients and freelancers.",
    postProjects: "Post Projects",
    postProjects_desc: "Post projects with a transparent budget estimator.",
    smartFilters: "Smart Filters",
    smartFilters_desc: "Smart filters for local opportunities.",
    lightweightChat: "Lightweight Chat",
    lightweightChat_desc: "Lightweight chat for quick collaboration.",
    projectsLogoAlt: "Projects logo",
    filtersLogoAlt: "Smart Filters logo",
    chatLogoAlt: "Chat logo",
    // location filter
    state: "State",
    city: "City",
    selectState: "Select state",
    selectCity: "Select city",
    // project form
    createProject: "Create a Project",
    title: "Title",
    title_placeholder: "e.g., Logo for my coffee shop",
    description: "Description",
    description_placeholder: "Describe what you need...",
    generateWithAI: "✨ Generate with AI",
    category: "Category",
    selectCategory: "Select category",
    complexity: "Complexity",
    selectComplexity: "Select complexity",
    price: "Price (₹)",
    price_placeholder: "e.g., 5000",
    suggestedPrefix: "Suggested",
    requiredSkills: "Required Skills (comma separated)",
    requiredSkills_placeholder: "e.g., Design, Branding",
    location: "Location",
    postProject: "Post Project",
    // proposal form
    submitProposal: "Submit a Proposal",
    coverLetter: "Cover Letter",
    coverLetter_placeholder: "Explain why you're a great fit...",
    submit: "Submit",
    // chat
    chat: "Chat",
    attach: "Attach",
    typeMessage_placeholder: "Type a message...",
    send: "Send",
    seed_client_hi: "Hi! Thanks for the proposal.",
    seed_freelancer_reply: "Happy to help. Do you have style references?",
    // signup
    signUp: "Sign up",
    name: "Name",
    email: "Email",
    password: "Password",
    role: "Role",
    client: "Client",
    freelancer: "Freelancer",
    primarySkill: "Primary Skill",
    selectPrimarySkill: "Select your primary skill",
    useStarterKit: "Use Starter Kit",
    bio: "Bio",
    skills_comma: "Skills (comma separated)",
    createAccount: "Create account",
    creatingAccount: "Creating account...",
    signupFailed: "Signup failed",
    // login
    newUser: "New user?",
    signUpNow: "sign up now",
    loggingIn: "Logging in...",
    loginFailed: "Login failed",
    // freelancer dashboard
    findLocalWork: "Find Local Work",
    openProjects: "Open Projects",
    exploreGigs: "Explore Gigs",
    noProjectsForLocation: "No projects found for the selected location.",
    myProposals: "My Proposals",
    noProposalsYet: "You haven't submitted any proposals yet.",
    // client dashboard
    myProjects: "My Projects",
    noProposals: "No proposals yet.",
    // gigs
    submitProposalFor: "Submit a Proposal for",
    gigs_proposal_blurb:
      "Share a brief cover letter with your approach and availability. This is a demo flow and won’t affect project listings.",
    proposalSubmittedTitle: "Proposal submitted",
    proposalSubmittedDescPrefix: "Your proposal for",
    // categories/complexities labels (display only)
    category_Design: "Design",
    category_Writing: "Writing",
    category_Development: "Development",
    complexity_Basic: "Basic",
    complexity_Standard: "Standard",
    complexity_Premium: "Premium",
    // auth errors mapped as keys (shown in UI)
    "Invalid credentials": "Invalid credentials",
    "Email already exists": "Email already exists",
    "Signup failed": "Signup failed",
    "Login failed": "Login failed",
  },
  hi: {
    appName: "लिंकवर्क",
    // nav
    login: "लॉगिन",
    signup: "साइन अप",
    logout: "लॉगआउट",
    gigs: "गीग्स",
    clientDashboard: "क्लाइंट डैशबोर्ड",
    freelancerDashboard: "फ्रीलांसर डैशबोर्ड",
    // common
    status: "स्थिति",
    approve: "स्वीकार करें",
    reject: "अस्वीकार करें",
    startChat: "चैट शुरू करें",
    proposals: "प्रस्ताव",
    local: "वोकल फॉर लोकल",
    view: "देखें",
    cancel: "रद्द करें",
    projectNotFound: "प्रोजेक्ट नहीं मिला।",
    closed: "बंद",
    // home
    tagline: "एक सरल, लोकल-फर्स्ट मार्केटप्लेस जो क्लाइंट और फ्रीलांसर को जोड़ता है।",
    postProjects: "प्रोजेक्ट पोस्ट करें",
    postProjects_desc: "पारदर्शी बजट अनुमान के साथ प्रोजेक्ट पोस्ट करें।",
    smartFilters: "स्मार्ट फ़िल्टर",
    smartFilters_desc: "स्थानीय अवसरों के लिए स्मार्ट फ़िल्टर।",
    lightweightChat: "हल्की चैट",
    lightweightChat_desc: "त्वरित सहयोग के लिए हल्की चैट।",
    projectsLogoAlt: "प्रोजेक्ट्स लोगो",
    filtersLogoAlt: "स्मार्ट फ़िल्टर लोगो",
    chatLogoAlt: "चैट लोगो",
    // location filter
    state: "राज्य",
    city: "शहर",
    selectState: "राज्य चुनें",
    selectCity: "शहर चुनें",
    // project form
    createProject: "प्रोजेक्ट बनाएं",
    title: "शीर्षक",
    title_placeholder: "उदा., मेरे कॉफी शॉप के लिए लोगो",
    description: "विवरण",
    description_placeholder: "जो चाहिए उसका विस्तार से वर्णन करें...",
    generateWithAI: "✨ एआई से जनरेट करें",
    category: "श्रेणी",
    selectCategory: "श्रेणी चुनें",
    complexity: "जटिलता",
    selectComplexity: "जटिलता चुनें",
    price: "मूल्य (₹)",
    price_placeholder: "उदा., 5000",
    suggestedPrefix: "सुझाव",
    requiredSkills: "आवश्यक कौशल (कॉमा द्वारा अलग)",
    requiredSkills_placeholder: "उदा., डिज़ाइन, ब्रांडिंग",
    location: "स्थान",
    postProject: "प्रोजेक्ट पोस्ट करें",
    // proposal form
    submitProposal: "प्रस्ताव जमा करें",
    coverLetter: "कवर लेटर",
    coverLetter_placeholder: "बताएं आप इस काम के लिए क्यों उपयुक्त हैं...",
    submit: "जमा करें",
    // chat
    chat: "चैट",
    attach: "संलग्न करें",
    typeMessage_placeholder: "संदेश लिखें...",
    send: "भेजें",
    seed_client_hi: "नमस्ते! प्रस्ताव के लिए धन्यवाद।",
    seed_freelancer_reply: "खुशी होगी मदद करने में। क्या आपके पास शैली संदर्भ हैं?",
    // signup
    signUp: "साइन अप",
    name: "नाम",
    email: "ईमेल",
    password: "पासवर्ड",
    role: "भूमिका",
    client: "क्लाइंट",
    freelancer: "फ्रीलांसर",
    primarySkill: "मुख्य कौशल",
    selectPrimarySkill: "अपना मुख्य कौशल चुनें",
    useStarterKit: "स्टार्टर किट उपयोग करें",
    bio: "जीवनी",
    skills_comma: "कौशल (कॉमा द्वारा अलग)",
    createAccount: "खाता बनाएं",
    creatingAccount: "खाता बनाया जा रहा है...",
    signupFailed: "साइन अप विफल",
    // login
    newUser: "नए उपयोगकर्ता?",
    signUpNow: "अभी साइन अप करें",
    loggingIn: "लॉगिन हो रहा है...",
    loginFailed: "लॉगिन विफल",
    // freelancer dashboard
    findLocalWork: "स्थानीय काम खोजें",
    openProjects: "ओपन प्रोजेक्ट्स",
    exploreGigs: "गीग्स देखें",
    noProjectsForLocation: "चयनित स्थान के लिए कोई प्रोजेक्ट नहीं मिला।",
    myProposals: "मेरे प्रस्ताव",
    noProposalsYet: "आपने अभी तक कोई प्रस्ताव जमा नहीं किया है।",
    // client dashboard
    myProjects: "मेरे प्रोजेक्ट्स",
    noProposals: "अभी तक कोई प्रस्ताव नहीं।",
    // gigs
    submitProposalFor: "के लिए प्रस्ताव जमा करें",
    gigs_proposal_blurb:
      "अपने तरीके और उपलब्धता के साथ संक्षिप्त कवर लेटर साझा करें। यह डेमो फ्लो है और प्रोजेक्ट सूची को प्रभावित नहीं करेगा।",
    proposalSubmittedTitle: "प्रस्ताव जमा हुआ",
    proposalSubmittedDescPrefix: "आपका प्रस्ताव",
    // categories/complexities labels (display only)
    category_Design: "डिज़ाइन",
    category_Writing: "लेखन",
    category_Development: "डेवलपमेंट",
    complexity_Basic: "बेसिक",
    complexity_Standard: "स्टैण्डर्ड",
    complexity_Premium: "प्रीमियम",
    // auth errors mapped as keys
    "Invalid credentials": "अमान्य क्रेडेंशियल्स",
    "Email already exists": "ईमेल पहले से मौजूद है",
    "Signup failed": "साइन अप विफल",
    "Login failed": "लॉगिन विफल",
  },
}

const LANG_STORAGE_KEY = "linkwork_lang"

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en")

  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(LANG_STORAGE_KEY) : null
    if (saved === "en" || saved === "hi") setLang(saved)
  }, [])

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(LANG_STORAGE_KEY, lang)
  }, [lang])

  const toggleLanguage = () => setLang((l) => (l === "en" ? "hi" : "en"))

  const t = useMemo(() => {
    return (key: string, fallback?: string) => DICTIONARY[lang][key] ?? fallback ?? key
  }, [lang])

  const value: LanguageContextValue = { lang, toggleLanguage, t }

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider")
  return ctx
}
