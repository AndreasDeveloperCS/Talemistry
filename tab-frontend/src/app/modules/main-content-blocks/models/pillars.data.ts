import type { Pillar } from "../models/pillar"

export const PILLARS: Pillar[] = [
    {
        id: "goal",
        type: "goal",
        title: "Goal",
        description:
            "Creating meaningful connections between companies and candidates, ensuring that every match benefits both sides. Driving success through well-aligned skills, values, and ambitions that support sustainable growth for individuals and organizations.",
        imageUrl: "/assets/images/company-handshake-partnership.png",
        icon: "🎯",
        text: [
            'Creating meaningful connections between companies and candidates, ensuring that every match benefits both sides.',
            'Driving success through well-aligned skills, values, and ambitions that support sustainable growth for individuals and organizations.'
        ]
    },
    {
        id: "mission",
        type: "mission",
        title: "Mission",
        description:
            "We accelerate decent work and inclusive growth by connecting people to fair opportunities through an open, AI-powered talent infrastructure, and by forging cross-sector partnerships that make hiring transparent, skills-based, and resilient.",
        imageUrl: "/assets/images/mission-team-collaboration.png",
        icon: "🚀",
        text: [
            'We accelerate decent work and inclusive growth by connecting people to fair opportunities through an open, AI-powered talent infrastructure, and by forging cross-sector partnerships that make hiring transparent, skills-based, and resilient.',
            //'Delivering a seamless hiring and career development experience through innovation, efficiency, and continuous improvement.'
        ]
    },
    {
        id: "vision",
        type: "vision",
        title: "Vision",
        description:
            "Becoming the most trusted global space where talent and opportunity meet in harmony. Shaping the future of recruitment by fostering a world in which every career path and hiring decision is guided by fairness, precision, and mutual benefit.",
        imageUrl: "/assets/images/vision-future-workplace.png",
        icon: "👁️",
        text: [
            'Becoming the most trusted global space where talent and opportunity meet in harmony.',
            'Shaping the future of recruitment by fostering a world in which every career path and hiring decision is guided by fairness, precision, and mutual benefit.'
        ]
    },
]
