/**
 * Talemistry full-cycle talent journey.
 * Single source of truth for pipeline stages shared across modules.
 * Mirrors the Next.js + Angular front-ends so all three stay in lock-step.
 */
export enum JourneyStage {
  Discover = 'discover',
  Attract = 'attract',
  Understand = 'understand',
  Match = 'match',
  Evaluate = 'evaluate',
  Decide = 'decide',
  Offer = 'offer',
}

export const JOURNEY_ORDER: JourneyStage[] = [
  JourneyStage.Discover,
  JourneyStage.Attract,
  JourneyStage.Understand,
  JourneyStage.Match,
  JourneyStage.Evaluate,
  JourneyStage.Decide,
  JourneyStage.Offer,
]

export const JOURNEY_META: Record<
  JourneyStage,
  { label: string; promise: string }
> = {
  [JourneyStage.Discover]: { label: 'Discover', promise: 'Understand the real need behind the role.' },
  [JourneyStage.Attract]: { label: 'Attract', promise: 'Reach the right people with an honest story.' },
  [JourneyStage.Understand]: { label: 'Understand', promise: 'See the whole person, not just the resume.' },
  [JourneyStage.Match]: { label: 'Match', promise: 'Reveal the chemistry between talent and team.' },
  [JourneyStage.Evaluate]: { label: 'Evaluate', promise: 'Assess fairly with structure and evidence.' },
  [JourneyStage.Decide]: { label: 'Decide', promise: 'Reach aligned decisions, together.' },
  [JourneyStage.Offer]: { label: 'Offer', promise: 'Close with clarity, dignity and speed.' },
}

export enum WorkStyleType {
  Architect = 'architect',
  Catalyst = 'catalyst',
  Anchor = 'anchor',
  Explorer = 'explorer',
}
