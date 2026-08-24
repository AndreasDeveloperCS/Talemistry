import type { Feature } from "./feature.ts"

export const FEATURES: Feature[] = [
    {
        icon: 'connect_without_contact',
        title: "Smart Matching",
        description:
            "AI-powered algorithms match candidates with perfect job opportunities based on skills, experience, and preferences.",
        image: "/assets/images/ai-job-network.png",
        badge: "AI-Powered",
    },
    {
        icon: 'business',
        title: "Company Management",
        description: "Tools for recruiters to manage companies, post positions, and track hiring pipelines.",
        image: "assets/images/modern-office-recruitment.png",
        badge: "Management",
    },
    {
        icon: 'sync_alt',
        title: "Pipeline Tracking",
        description: "Analytics and tracking tools to monitor recruitment progress and optimize processes.",
        image: "assets/images/recruitment-dashboard.png",
        badge: "Analytics",
    },
    {
        icon: 'feed',
        title: "CV Generation",
        description: "CV generation with AI optimization and PDF export capabilities for applications.",
        image: "/assets/images/ai-optimized-cv-template.png",
        badge: "AI-Enhanced",
    },
    {
        icon: 'trending_up',
        title: "Career Development",
        description: "Career path recommendations with links to courses and certification programs.",
        image: "/assets/images/career-growth-path.png",
        badge: "Growth",
    },
    {
        icon: 'smart_toy',
        title: "AI Feedback",
        description: "Actionable feedback for both candidates and recruiters powered by AI.",
        image: "/assets/images/ai-feedback-chatbot.png",
        badge: "Intelligent",
    },
]
