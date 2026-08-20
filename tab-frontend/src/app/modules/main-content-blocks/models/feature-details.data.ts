export interface FeatureDetail {
  id: string
  title: string
  subtitle: string
  description: string
  benefits: string[]
  features: string[]
  stats: { label: string; value: string; trend?: string }[]
  image: string
  demoImage?: string
}

export const FEATURE_DETAILS: FeatureDetail[] = [
  {
    id: "smart-matching",
    title: "Smart Matching",
    subtitle: "AI-Powered Talent Discovery",
    description:
      "Our advanced AI algorithms analyze thousands of data points to create perfect matches between candidates and opportunities. Using machine learning, natural language processing, and behavioral analysis, we ensure every connection has the highest probability of success.",
    benefits: [
      "Reduce time-to-hire by up to 70%",
      "Increase candidate satisfaction scores by 85%",
      "Improve retention rates through better cultural fit",
      "Eliminate unconscious bias in initial screening",
    ],
    features: [
      "Skills-based matching with 99.2% accuracy",
      "Cultural fit assessment using personality insights",
      "Career trajectory prediction modeling",
      "Real-time market demand analysis",
      "Automated candidate ranking and scoring",
    ],
    stats: [
      { label: "Match Accuracy", value: "99.2%", trend: "+12%" },
      { label: "Time Saved", value: "70%", trend: "+25%" },
      { label: "Successful Placements", value: "94%", trend: "+18%" },
    ],
    image: "assets/images/ai-job-network.png",
    demoImage: "assets/images/smart-matching-dashboard.png",
  },
  {
    id: "company-management",
    title: "Company Management",
    subtitle: "Comprehensive Recruitment Operations",
    description:
      "Streamline your entire recruitment workflow with our comprehensive company management suite. From job posting to candidate onboarding, manage every aspect of your hiring process in one unified platform.",
    benefits: [
      "Centralized recruitment operations",
      "Automated workflow management",
      "Real-time collaboration tools",
      "Compliance and audit trail tracking",
    ],
    features: [
      "Multi-location job posting management",
      "Team collaboration and role assignments",
      "Automated interview scheduling",
      "Candidate communication templates",
      "Integration with HRIS systems",
    ],
    stats: [
      { label: "Process Efficiency", value: "85%", trend: "+30%" },
      { label: "Team Productivity", value: "92%", trend: "+22%" },
      { label: "Compliance Score", value: "100%", trend: "stable" },
    ],
    image: "assets/images/modern-office-recruitment.png",
    demoImage: "assets/images/company-management-dashboard.png",
  },
  {
    id: "pipeline-tracking",
    title: "Pipeline Tracking",
    subtitle: "Advanced Analytics & Insights",
    description:
      "Gain unprecedented visibility into your recruitment pipeline with advanced analytics, predictive insights, and real-time reporting. Make data-driven decisions that optimize your hiring strategy.",
    benefits: [
      "Real-time pipeline visibility",
      "Predictive hiring analytics",
      "Bottleneck identification and resolution",
      "ROI tracking and optimization",
    ],
    features: [
      "Interactive pipeline visualization",
      "Predictive time-to-fill modeling",
      "Source effectiveness analysis",
      "Recruiter performance metrics",
      "Custom reporting and dashboards",
    ],
    stats: [
      { label: "Pipeline Visibility", value: "100%", trend: "+45%" },
      { label: "Prediction Accuracy", value: "91%", trend: "+15%" },
      { label: "Decision Speed", value: "3x", trend: "+200%" },
    ],
    image: "assets/images/recruitment-dashboard.png",
    demoImage: "assets/images/pipeline-analytics-dashboard.png",
  },
  {
    id: "cv-generation",
    title: "CV Generation",
    subtitle: "AI-Optimized Resume Creation",
    description:
      "Empower candidates with AI-powered CV generation that creates compelling, ATS-optimized resumes tailored to specific job opportunities. Our intelligent system ensures maximum impact and visibility.",
    benefits: [
      "ATS-optimized formatting",
      "Industry-specific customization",
      "Keyword optimization for better visibility",
      "Professional design templates",
    ],
    features: [
      "AI-powered content suggestions",
      "Multiple format exports (PDF, Word, HTML)",
      "Real-time ATS compatibility scoring",
      "Industry-specific templates",
      "Skills gap analysis and recommendations",
    ],
    stats: [
      { label: "ATS Pass Rate", value: "96%", trend: "+28%" },
      { label: "Interview Callbacks", value: "3.2x", trend: "+220%" },
      { label: "User Satisfaction", value: "98%", trend: "+12%" },
    ],
    image: "assets/images/ai-optimized-cv-template.png",
    demoImage: "assets/images/cv-generation-interface.png",
  },
  {
    id: "career-development",
    title: "Career Development",
    subtitle: "Personalized Growth Pathways",
    description:
      "Guide professionals through their career journey with personalized development plans, skill assessments, and curated learning opportunities that align with market demands and personal aspirations.",
    benefits: [
      "Personalized career roadmaps",
      "Skills gap identification",
      "Curated learning recommendations",
      "Industry trend insights",
    ],
    features: [
      "AI-powered career path modeling",
      "Skills assessment and benchmarking",
      "Learning resource recommendations",
      "Mentorship matching",
      "Progress tracking and milestones",
    ],
    stats: [
      { label: "Career Advancement", value: "78%", trend: "+35%" },
      { label: "Skill Development", value: "89%", trend: "+42%" },
      { label: "Goal Achievement", value: "84%", trend: "+28%" },
    ],
    image: "assets/images/career-growth-path.png",
    demoImage: "assets/images/career-development-dashboard.png",
  },
  {
    id: "ai-feedback",
    title: "AI Feedback",
    subtitle: "Intelligent Performance Insights",
    description:
      "Receive actionable, personalized feedback powered by advanced AI analysis. Our system provides continuous insights for both candidates and recruiters to improve performance and outcomes.",
    benefits: [
      "Personalized improvement recommendations",
      "Real-time performance insights",
      "Bias-free evaluation criteria",
      "Continuous learning optimization",
    ],
    features: [
      "Natural language feedback generation",
      "Performance trend analysis",
      "Behavioral pattern recognition",
      "Improvement action plans",
      "Success probability scoring",
    ],
    stats: [
      { label: "Feedback Accuracy", value: "94%", trend: "+18%" },
      { label: "Performance Improvement", value: "67%", trend: "+31%" },
      { label: "User Engagement", value: "91%", trend: "+24%" },
    ],
    image: "assets/images/ai-feedback-chatbot.png",
    demoImage: "assets/images/ai-feedback-dashboard.png",
  },
]
