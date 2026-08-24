import { Injectable } from "@angular/core";
import { STAGES_NAMES } from "../../position-pipelines/models/default-pipeline-stages";
import { EnrichedTalentPipelineProgress } from "../models/talent-pipeline-progress";
import { TemplateVariables } from "../../interviews/models/chat-message-payload";
import { NotificationTemplate } from "../../pipeline-board/enums/notification-templates.enum";

@Injectable({
  providedIn: 'root'
})
export class NotificationHelperService {
    getTemplateName(stage: EnrichedTalentPipelineProgress): NotificationTemplate {
        switch(stage.stageName) {
        case STAGES_NAMES.SCREENING:
            return NotificationTemplate.PRESCREEN_INVITATION_QUESTIONNAIRE;
        case STAGES_NAMES.ASSESSMENT:
            return NotificationTemplate.ASSESSMENT_INVITATION;
        case STAGES_NAMES.INTERVIEW: 
            return NotificationTemplate.INTERVIEW_SETUP;
        default:
            return NotificationTemplate.NEW_CHAT_MESSAGE;
        }
    }

    getMessageContent(stage: EnrichedTalentPipelineProgress): string {
        if(stage.stageName !== STAGES_NAMES.SCREENING && stage.stageName !== STAGES_NAMES.ASSESSMENT && stage.stageName !== STAGES_NAMES.INTERVIEW) {
            return `Your application for the position of ${stage.positionName} at ${stage.companyName} has progressed to the next stage: ${stage.stageName}. Please check your profile for more details.`;
        } 
        return '';
    }
  
    getTemplateVariables(stage: EnrichedTalentPipelineProgress): TemplateVariables | null {
        switch(stage.stageName) {
        case STAGES_NAMES.SCREENING:
            return {
                positionName: stage.positionName,
                positionId: stage.positionId,
                companyName: stage.companyName,
                companyId: stage.companyId,
                screeningLinkId: `${stage.positionId}`,
            };
        case STAGES_NAMES.ASSESSMENT:
            return {
                positionName: stage.positionName,
                positionId: stage.positionId,
                companyName: stage.companyName,
                companyId: stage.companyId,
                assessmentType: stage.assessmentType === 'test' ? 'test' : stage.assessmentType === 'live-coding' ? 'live-coding' : 'interview',    
                assessmentLinkId: stage.assessmentLinkId,
            };
        case STAGES_NAMES.INTERVIEW: 
            return {
                positionName: stage.positionName,
                positionId: stage.positionId,
                companyName: stage.companyName,
                companyId: stage.companyId,
                calendarLinkId: `${stage.bookingToken}`,
            };
        default:
            return null;
        }
    }
}