export declare enum JourneyStage {
    Discover = "discover",
    Attract = "attract",
    Understand = "understand",
    Match = "match",
    Evaluate = "evaluate",
    Decide = "decide",
    Offer = "offer"
}
export declare const JOURNEY_ORDER: JourneyStage[];
export declare const JOURNEY_META: Record<JourneyStage, {
    label: string;
    promise: string;
}>;
export declare enum WorkStyleType {
    Architect = "architect",
    Catalyst = "catalyst",
    Anchor = "anchor",
    Explorer = "explorer"
}
