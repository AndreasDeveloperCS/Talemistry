export interface PricingFeature {
  name: string;
  included: boolean;
  description?: string;
}

export interface PricingPlan {
  id: string;
  name: string;
  icon: string;
  monthlyPrice?: number;
  yearlyPrice?: number;
  description: string;
  features: PricingFeature[];
  isPopular: boolean;
  buttonText: string;
  maxUsers?: number;
  support: string;
  priceCaption?: string;
  enterpriseLabel?: string;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: "freemium",
    name: "Freemium",
    icon: "volunteer_activism", 
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Get started for free with essential features",
    isPopular: false,
    buttonText: "Sign Up Free",
    maxUsers: 1,
    support: "Community Support",
    features: [
      { name: "1 active job posting", included: true },
      { name: "Basic candidate search", included: true },
      { name: "Email notifications", included: true },
      { name: "Standard reporting", included: false },
      { name: "API access", included: false },
      { name: "Advanced analytics", included: false },
      { name: "Custom branding", included: false },
      { name: "Priority support", included: false },
    ],
  },
  {
    id: "starter",
    name: "Starter",
    icon: "rocket_launch",
    monthlyPrice: 29,
    yearlyPrice: 290,
    description: "Perfect for small recruiting teams getting started",
    isPopular: false,
    buttonText: "Start Free Trial",
    maxUsers: 5,
    support: "Email Support",
    priceCaption: "2 months free with annual billing",
    features: [
      { name: "Up to 5 active job postings", included: true },
      { name: "Basic candidate matching", included: true },
      { name: "Email notifications", included: true },
      { name: "Standard reporting", included: true },
      { name: "API access", included: false },
      { name: "Advanced analytics", included: false },
      { name: "Custom branding", included: false },
      { name: "Priority support", included: false },
    ],
  },
  {
    id: "professional",
    name: "Professional",
    icon: "workspace_premium",
    monthlyPrice: 79,
    yearlyPrice: 790,
    description: "Ideal for growing companies with advanced recruiting needs",
    isPopular: true,
    buttonText: "Get Started",
    maxUsers: 25,
    support: "Priority Support",
    priceCaption: "Best value for scaling teams",
    features: [
      { name: "Up to 25 active job postings", included: true },
      { name: "Advanced AI-powered matching", included: true },
      { name: "Real-time notifications", included: true },
      { name: "Advanced reporting & analytics", included: true },
      { name: "API access", included: true },
      { name: "Custom workflows", included: true },
      { name: "Custom branding", included: false },
      { name: "Dedicated account manager", included: false },
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    icon: "business",
    description: "Flexible, high-touch rollout built around your volume, workflows, and compliance needs",
    isPopular: false,
    buttonText: "Contact Sales",
    support: "Dedicated Support",
    enterpriseLabel: "Custom pricing",
    priceCaption: "Annual commitments, onboarding, and SLAs tailored to your team",
    features: [
      { name: "Unlimited job postings", included: true },
      { name: "AI-powered matching & insights", included: true },
      { name: "Multi-channel notifications", included: true },
      { name: "Custom reporting & dashboards", included: true },
      { name: "Full API access", included: true },
      { name: "Advanced workflow automation", included: true },
      { name: "White-label branding", included: true },
      { name: "Dedicated account manager", included: true },
    ],
  },
];