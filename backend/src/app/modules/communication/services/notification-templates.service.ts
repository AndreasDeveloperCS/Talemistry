import { Injectable } from "@nestjs/common";
import { TemplateVariables } from "../models/chat-message";
import { NotificationTemplate } from "../enums/notification-templates.enum";
import { NotificationContent } from "../models/notification";

export enum AssessmentType {
  TEST = 'test',
  INTERVIEW = 'interview',
  LIVE_CODING = 'live-coding',
}

@Injectable()
export class NotificationTemplatesService {
    private readonly websiteLink = process.env.WEBSITE_LINK;
    private readonly positionBaseUrl: string = `${process.env.WEBSITE_LINK}${process.env.POSITION_BASE_URL}`;
    private readonly screeningBaseUrl: string = `${process.env.WEBSITE_LINK}${process.env.SCREENING_BASE_URL}`;
    private readonly calendarBaseUrl: string = `${process.env.WEBSITE_LINK}${process.env.CALENDAR_BASE_URL}`;
    private readonly codingSessionBaseUrl: string = `${process.env.WEBSITE_LINK}${process.env.LIVE_CODING_SESSION_BASE_URL}`;
    private readonly meetingBaseUrl: string = `${process.env.WEBSITE_LINK}${process.env.MEETING_BASE_URL}`;
    private readonly feedbackBaseUrl: string = `${process.env.WEBSITE_LINK}${process.env.FEEDBACK_BASE_URL}`;

    getMessageContent(
        candidateName: string,
        template: NotificationTemplate,
        variables?: TemplateVariables,
    ): NotificationContent {
        switch (template) {
            case NotificationTemplate.PRESCREEN_INVITATION_QUESTIONNAIRE:
                return this.prescreen(candidateName, variables);

            case NotificationTemplate.ASSESSMENT_INVITATION:
                return this.assessmentInvitation(candidateName, variables);

            case NotificationTemplate.INTERVIEW_SETUP:
                return this.interviewSetup(candidateName, variables);

            case NotificationTemplate.CONFIRMATION_INTERVIEW_SCHEDULED:
                return this.scheduledInterview(candidateName, variables);

            case NotificationTemplate.INTERVIEW_FEEDBACK:
                return this.interviewFeedback(candidateName, variables);

            case NotificationTemplate.NEW_CHAT_MESSAGE:
                return this.newChatMessage(candidateName);

            case NotificationTemplate.DIRECT_CALL_INVITE:
                return this.directCallInvite(candidateName, variables);

            case NotificationTemplate.DIRECT_CALL_MISSED:
                return this.directCallMissed(candidateName, variables);

            default:
                throw new Error(`Unsupported template: ${template}`);
        }
    }

    private prescreen(
        candidateName: string,
        v: TemplateVariables,
    ): NotificationContent {
        return {
            subject: `TALEMISTRY - ${v.companyName} - ${v.positionName} - prescreen invitation`,
            greeting: `Hello ${candidateName}`,
            body: [
                `Great news!`,
                `You've reached the next stage of the recruitment process for the position`,
                `${v.positionName} at ${v.companyName}.`,
                `This stage includes a short online assessment designed for preliminary evaluation of your skills and experience.`,
            ],
            cta: {
                text: 'Complete prescreen stage',
                url: `${this.screeningBaseUrl}${v.screeningLinkId}`,
            },
            signature: ['Best of luck!', 'TALEMISTRY', 'The Recruitment Team'],
        };
    }

    private assessmentInvitation(
        candidateName: string,
        v: TemplateVariables,
    ): NotificationContent {
        const assessmentContent = this.getAssessmentContent(v.assessmentType);

        return {
            subject: `TALEMISTRY - ${v.companyName} - ${v.positionName} - assessment invitation`,
            greeting: `Hello ${candidateName}`,
            body: [
                `Great news!`,
                `You've reached the next stage of the recruitment process for the position`,
                `${v.positionName} at ${v.companyName}.`,
                assessmentContent.description,,
            ],
            cta: {
                text: assessmentContent.ctaText,
                url: v.assessmentType === 'live-coding' ? `${this.codingSessionBaseUrl}${v.assessmentLinkId}` 
                : v.assessmentType === 'test' ? `${this.screeningBaseUrl}${v.assessmentLinkId}` 
                : `${this.meetingBaseUrl}${v.assessmentLinkId}`,
            },
            signature: ['Best of luck!', 'TALEMISTRY', 'The Recruitment Team'],
        };
    }

    private interviewSetup(
        candidateName: string,
        v: TemplateVariables,
    ): NotificationContent {
        return {
            subject: `Time slot selection - Interview - ${v.companyName} - ${v.positionName}`,
            greeting: `Hello ${candidateName}`,
            body: [
                `We're glad to inform you that you've been shortlisted for the role`,
                `${v.positionName} at ${v.companyName}.`,
                `Please book a convenient time slot for your interview.`,
            ],
            cta: {
                text: 'Select interview time',
                url: `${this.calendarBaseUrl}${v.calendarLinkId}`,
            },
            signature: ['Best regards,', 'TALEMISTRY', 'The Recruitment Team'],
        };
    }

    private scheduledInterview(
        candidateName: string,
        v: TemplateVariables,
    ): NotificationContent {
        return {
            subject: `Scheduled Interview - ${v.companyName} - ${v.positionName}`,
            greeting: `Hello ${candidateName}`,
            body: [
                `We're glad to inform you that your interview for the position`,
                `${v.positionName} at ${v.companyName}`,
                `has been successfully scheduled.`,
                `Please use the link below to connect at ${v.timeSlot}.`,
            ],
            cta: {
                text: 'Join the interview',
                url: `${this.meetingBaseUrl}${v.calendarLinkId}`,
            },
            signature: ['Best regards,', 'TALEMISTRY', 'The Recruitment Team'],
        };
    }

    private interviewFeedback(candidateName: string, v: TemplateVariables): NotificationContent {
        return {
            subject: `Interview feedback - ${v.companyName} - ${v.positionName}`,
            greeting: `Hello ${candidateName}`,
            body: [
                `We have already received feedback regarding your interview for the position`,
                `${v.positionName} at ${v.companyName}.`,
                `You can view the details using the link below.`,
            ],
            cta: {
                text: 'View interview feedback',
                url: `${this.feedbackBaseUrl}${v.feedbackLinkId}`,
            },
            signature: ['Best regards,', 'TALEMISTRY', 'The Recruitment Team'],
        };
    }

    private newChatMessage(receiverName: string): NotificationContent {
        return {
            subject: 'TALEMISTRY - New message regarding your application',
            greeting: `Hello ${receiverName}`,
            body: [
                'You have received a new message regarding your application.',
                'Please log in to your account using the link below to view and respond.',
            ],
            cta: {
                text: 'Open my account',
                url: this.websiteLink,
            },
            signature: ['Best regards,', 'TALEMISTRY', 'The Recruitment Team'],
        };
    }

    private directCallInvite(receiverName: string, variables?: TemplateVariables): NotificationContent {
        const callerName = String(variables?.callerName || 'A participant').trim();
        const callType = String(variables?.callType || 'video').trim();
        const roomName = String(variables?.roomName || `${callType} call`).trim();
        const directCallLink = String(variables?.directCallLink || this.websiteLink).trim();

        return {
            subject: `TALEMISTRY - ${callerName} started a ${callType} call`,
            greeting: `Hello ${receiverName}`,
            body: [
                `${callerName} started a ${callType} call with you.`,
                `Open ${roomName} using the link below to join the conversation.`,
            ],
            cta: {
                text: 'Join the call',
                url: directCallLink,
            },
            signature: ['Best regards,', 'TALEMISTRY', 'The Recruitment Team'],
        };
    }

    private directCallMissed(receiverName: string, variables?: TemplateVariables): NotificationContent {
        const callerName = String(variables?.callerName || 'A participant').trim();
        const callType = String(variables?.callType || 'video').trim();
        const roomName = String(variables?.roomName || `${callType} call`).trim();
        const directCallLink = String(variables?.directCallLink || this.websiteLink).trim();

        return {
            subject: `TALEMISTRY - Missed ${callType} call from ${callerName}`,
            greeting: `Hello ${receiverName}`,
            body: [
                `${callerName} tried to reach you in a ${callType} call.`,
                `Open ${roomName} using the link below if you want to rejoin the conversation.`,
            ],
            cta: {
                text: 'Open the call room',
                url: directCallLink,
            },
            signature: ['Best regards,', 'TALEMISTRY', 'The Recruitment Team'],
        };
    }

    private getAssessmentContent(type: string) {
        switch (type) {
            case AssessmentType.TEST:
            return {
                description: `This stage includes a test task designed to evaluate your practical skills and problem-solving abilities.`,
                ctaText: 'Start test task',
            };

            case AssessmentType.LIVE_CODING:
            return {
                description: `This stage includes a live coding session where you will solve problems in real time with our team.`,
                ctaText: 'Join live coding session',
            };

            case AssessmentType.INTERVIEW:
            return {
                description: `This stage includes an assessment interview where we will discuss your experience and evaluate your skills.`,
                ctaText: 'Join interview',
            };

            default:
            return {
                description: `This stage includes an assessment as part of the recruitment process.`,
                ctaText: 'Open invitation',
            };
        }
        }
}