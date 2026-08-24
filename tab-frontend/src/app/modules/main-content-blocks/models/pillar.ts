export interface Pillar {
    id: string
    type: "goal" | "mission" | "vision"
    title: string
    description: string
    imageUrl: string
    icon: string;
    text: string[];
}