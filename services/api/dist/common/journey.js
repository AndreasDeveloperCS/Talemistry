"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkStyleType = exports.JOURNEY_META = exports.JOURNEY_ORDER = exports.JourneyStage = void 0;
var JourneyStage;
(function (JourneyStage) {
    JourneyStage["Discover"] = "discover";
    JourneyStage["Attract"] = "attract";
    JourneyStage["Understand"] = "understand";
    JourneyStage["Match"] = "match";
    JourneyStage["Evaluate"] = "evaluate";
    JourneyStage["Decide"] = "decide";
    JourneyStage["Offer"] = "offer";
})(JourneyStage || (exports.JourneyStage = JourneyStage = {}));
exports.JOURNEY_ORDER = [
    JourneyStage.Discover,
    JourneyStage.Attract,
    JourneyStage.Understand,
    JourneyStage.Match,
    JourneyStage.Evaluate,
    JourneyStage.Decide,
    JourneyStage.Offer,
];
exports.JOURNEY_META = {
    [JourneyStage.Discover]: { label: 'Discover', promise: 'Understand the real need behind the role.' },
    [JourneyStage.Attract]: { label: 'Attract', promise: 'Reach the right people with an honest story.' },
    [JourneyStage.Understand]: { label: 'Understand', promise: 'See the whole person, not just the resume.' },
    [JourneyStage.Match]: { label: 'Match', promise: 'Reveal the chemistry between talent and team.' },
    [JourneyStage.Evaluate]: { label: 'Evaluate', promise: 'Assess fairly with structure and evidence.' },
    [JourneyStage.Decide]: { label: 'Decide', promise: 'Reach aligned decisions, together.' },
    [JourneyStage.Offer]: { label: 'Offer', promise: 'Close with clarity, dignity and speed.' },
};
var WorkStyleType;
(function (WorkStyleType) {
    WorkStyleType["Architect"] = "architect";
    WorkStyleType["Catalyst"] = "catalyst";
    WorkStyleType["Anchor"] = "anchor";
    WorkStyleType["Explorer"] = "explorer";
})(WorkStyleType || (exports.WorkStyleType = WorkStyleType = {}));
//# sourceMappingURL=journey.js.map