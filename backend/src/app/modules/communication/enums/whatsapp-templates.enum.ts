import { NotificationTemplate } from "./notification-templates.enum";

export type WhatsAppTemplateVariables = {
  [NotificationTemplate.NEW_CHAT_MESSAGE]: {};

  [NotificationTemplate.DIRECT_CALL_INVITE]: {
    candidate_name: string;
    caller_name: string;
    call_type: string;
    room_name: string;
    direct_call_link: string;
  };

  [NotificationTemplate.INTERVIEW_SETUP]: {
    candidate_name: string;
    position_name: string;
    company_name: string;
    slot_calendar_link: string;   

    position_link: string;  
    book_slot_link: string;      
  };

  [NotificationTemplate.INTERVIEW_FEEDBACK]: {
    candidate_name: string;
    position_name: string;
    company_name: string;

    position_link: string;        
    feedback_link: string;        
  };

  [NotificationTemplate.PRESCREEN_INVITATION_QUESTIONNAIRE]: {
    candidate_name: string;
    position_name: string;
    company_name: string;
    assessment_link: string;

    position_link: string;        
    screening_link: string;      
  };

  [NotificationTemplate.INTERVIEW_SCHEDULED_CONFIRMATION]: {
    candidate_name: string;
    position_name: string;
    company_name: string;
    time_slot: string;
    meeting_link: string;

    position_link: string;        
    join_interview_link: string;         
  };

  [NotificationTemplate.CONFIRMATION_INTERVIEW_SCHEDULED]: {
    candidate_name: string;
    position_name: string;
    company_name: string;
    time_slot: string;
    meeting_link: string;

    position_link: string;        
    join_interview_link: string;         
  };

  [NotificationTemplate.DIRECT_CALL_MISSED]: {};

  [NotificationTemplate.ASSESSMENT_INVITATION]: {};
};

export type WhatsAppTemplate<K extends NotificationTemplate> = {
  name: string;
  language: string;
  headerVariables: string[],
  variables: readonly (keyof WhatsAppTemplateVariables[K] & string)[];
};

export const WhatsAppTemplates = {

  [NotificationTemplate.NEW_CHAT_MESSAGE]: {
    name: 'new_chat_message',
    language: 'en_US',
    headerVariables: [],
    variables: [] as const,
  },

  [NotificationTemplate.DIRECT_CALL_INVITE]: {
    name: 'direct_call_invite',
    language: 'en_US',
    headerVariables: [],
    variables: [
      'candidate_name',
      'caller_name',
      'call_type',
      'room_name',
    ] as const,
  },

  [NotificationTemplate.INTERVIEW_SETUP]: {
    name: 'n_interview_setup',
    language: 'en',
    headerVariables: [],
    variables: [
      'candidate_name',
      'position_name',
      'company_name',
      'slot_calendar_link'
    ],
  },

  [NotificationTemplate.INTERVIEW_FEEDBACK]: {
    name: 'n_interview_feedback',
    language: 'en',
    headerVariables: [],
    variables: [
      'candidate_name',
      'position_name',
      'company_name',
    ],
  },

  [NotificationTemplate.PRESCREEN_INVITATION_QUESTIONNAIRE]: {
    name: 'n_prescreen_invitation_questionnaire',
    language: 'en',
    headerVariables: [],
    variables: [
      'candidate_name',
      'position_name',
      'company_name',
      'assessment_link'
    ],
  },

  [NotificationTemplate.INTERVIEW_SCHEDULED_CONFIRMATION]: {
    name: 'n_interview_scheduled_confirmation',
    language: 'en',
    headerVariables: [],
    variables: [
      'candidate_name',
      'position_name',
      'company_name',
      'time_slot',
      'meeting_link'
    ],
  },

  [NotificationTemplate.CONFIRMATION_INTERVIEW_SCHEDULED]: {
    name: 'n_confirmation_interview_scheduled',
    language: 'en',
    headerVariables: [],
    variables: [
      'candidate_name',
      'position_name',
      'company_name',
      'time_slot',
      'meeting_link'
    ],
  },

  [NotificationTemplate.DIRECT_CALL_MISSED]: {
    name: 'direct_call_missed',
    language: 'en_US',
    headerVariables: [],
    variables: [] as const,
  },

  [NotificationTemplate.ASSESSMENT_INVITATION]: {
    name: 'assessment_invitation',
    language: 'en_US',
    headerVariables: [],
    variables: [] as const,
  },
} satisfies {
  [K in NotificationTemplate]: WhatsAppTemplate<K>;
};

type WhatsAppButton =
  | { type: 'url'; text: string; variable: keyof any }
  | { type: 'quick_reply'; text: string };

export type WhatsAppTemplateButtons<K extends NotificationTemplate> =
  readonly {
    index: number;
    type: 'url';
    text: string;
    variable: keyof WhatsAppTemplateVariables[K] & string;
  }[];

export const WhatsAppTemplateButtons = {
  [NotificationTemplate.INTERVIEW_SETUP]: [
    {
      index: 0,
      text: 'Position',
      variable: 'position_link',
    },
    {
      index: 1,
      text: 'Book Time Slot',
      variable: 'book_slot_link',
    },
  ],

  [NotificationTemplate.INTERVIEW_FEEDBACK]: [
    {
      index: 0,
      text: 'Position',
      variable: 'position_link',
    },
    {
      index: 1,
      text: 'Feedback',
      variable: 'feedback_link',
    },
  ],

  [NotificationTemplate.PRESCREEN_INVITATION_QUESTIONNAIRE]: [
    {
      index: 0,
      text: 'Position',
      variable: 'position_link',
    },
    {
      index: 1,
      text: 'Screening session',
      variable: 'assessment_link',
    },
  ],

  [NotificationTemplate.INTERVIEW_SCHEDULED_CONFIRMATION]: [
    {
      index: 0,
      text: 'Position',
      variable: 'position_link',
    },
    {
      index: 1,
      text: 'Join Interview',
      variable: 'join_interview_link',
    },
  ],

  [NotificationTemplate.CONFIRMATION_INTERVIEW_SCHEDULED]: [
    {
      index: 0,
      text: 'Position',
      variable: 'position_link',
    },
    {
      index: 1,
      text: 'Join Interview',
      variable: 'join_interview_link',
    },
  ],

  [NotificationTemplate.NEW_CHAT_MESSAGE]: [],

  [NotificationTemplate.DIRECT_CALL_INVITE]: [
    {
      index: 0,
      text: 'Join call',
      variable: 'direct_call_link',
    },
  ],
  
  [NotificationTemplate.DIRECT_CALL_MISSED]: [],
  [NotificationTemplate.ASSESSMENT_INVITATION]: [],
} satisfies {
  [K in NotificationTemplate]: readonly {
    index: number;
    text: string;
    variable: keyof WhatsAppTemplateVariables[K];
  }[];
};

/*
n_confirmation_interview_scheduled

{
  "param_name": "candidate_name",
  "example": "Andreas"
},
{
  "param_name": "position_name",
  "example": "Technical Delivery Manager"
},
{
  "param_name": "company_name",
  "example": "Generali"
},
{
  "param_name": "time_slot",
  "example": "22, January 2026, Thursday, 15.00 EST (Athens time, +2)"
},
{
  "param_name": "meeting_link",
  "example": "https://tap.evryka.org/recruitment/communication/video-chat/693952a5c331d0b0bedcf01e"
}
{
  "type": "BUTTONS",
  "buttons": [
    {
      "type": "URL",
      "text": "Position",
      "url": "https://tap.evryka.org/career/positions/{{1}}",
      "example": [
        "https://tap.evryka.org/career/positions/6929ea2ed17bcb54ad3665eb"
      ]
    },
    {
      "type": "URL",
      "text": "Join Interview",
      "url": "https://tap.evryka.org/recruitment/communication/video-chat/{{1}}",
      "example": [
        "https://tap.evryka.org/recruitment/communication/video-chat/693952a5c331d0b0bedcf01e"   
      ]
    }
  ]
}
*/