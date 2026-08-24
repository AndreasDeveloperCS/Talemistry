import { QuestionType, ScreeningQuestion } from "../models/screening-question";

export const TEMPLATE_QUESTIONS: ScreeningQuestion[] = [
  {
    text: "What is your current location?",
    type: QuestionType.Text,
    required: true,
    order: 0,
    userId: '',
    createdBy: '',
    createdDate: new Date(),
  },
  {
    text: "What are your salary expectations?",
    type: QuestionType.Text,
    required: true,
    order: 0,
    userId: '',
    createdBy: '',
    createdDate: new Date(),
  },
  {
    text: "Are you legally authorized to work in this country?",
    type: QuestionType.Select,
    required: true,
    order: 0,
    options: [
      {
        text: "Yes", order: 0,
      },
      {
        text: "No", order: 1,
      },
      {
        text: "Require sponsorship", order: 2,
      },
    ],
    userId: '',
    createdBy: '',
    createdDate: new Date(),
  },
  {
    text: "What is your notice period?",
    type: QuestionType.Select,
    required: true,
    order: 0,
    options: [
      {
        text: "Immediate", order: 0,
      },
      {
        text: "2 weeks", order: 1,
      },
      {
        text: "1 month", order: 2,
      },
      {
        text: "2 months", order: 3,
      },
      {
        text: "3+ months", order: 4,
      },
    ],
    userId: '',
    createdBy: '',
    createdDate: new Date(),
  },
  {
    text: "Why are you interested in this position?",
    type: QuestionType.Textarea,
    required: true,
    order: 0,
    userId: '',
    createdBy: '',
    createdDate: new Date(),
  },
  {
    text: "What are your key technical skills?",
    type: QuestionType.Multiselect,
    required: false,
    order: 0,
    options: [
      {
        text: "JavaScript", order: 0,
      },
      {
        text: "TypeScript", order: 1,
      },
      {
        text: "React", order: 2,
      },
      {
        text: "Node.js", order: 3,
      },
      {
        text: "Python", order: 4,
      },
      {
        text: "Java", order: 5,
      },
      {
        text: "Other", order: 6,
      },
    ],
    userId: '',
    createdBy: '',
    createdDate: new Date(),
  },
  {
    text: "How many years of relevant experience do you have?",
    type: QuestionType.Select,
    required: true,
    options: [
      {
        text: "Less than 1 year", order: 0,
      },
      {
        text: "1-2 years", order: 1,
      },
      {
        text: "3-5 years", order: 2,
      },
      {
        text: "5-10 years", order: 3,
      },
      {
        text: "10+ years", order: 4,
      },
    ],
    order: 0,
    userId: '',
    createdBy: '',
    createdDate: new Date(),
  },
  {
    text: "Are you open to remote work?",
    type: QuestionType.Select,
    required: false,
    options: [
      {
        text: "Yes, remote only", order: 0,
      },
      {
        text: "Yes, hybrid", order: 1,
      },
      {
        text: "No, office only", order: 2,
      },
      {
        text: "Flexible", order: 3,
      },
    ],
    order: 0,
    userId: '',
    createdBy: '',
    createdDate: new Date(),
  },
]