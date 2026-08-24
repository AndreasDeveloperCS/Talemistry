import { Injectable } from '@angular/core';
import { STAGES_NAMES } from '../../position-pipelines/models/default-pipeline-stages';

@Injectable({
  providedIn: 'root'
})
export class NotificationTemplatesService {

    generateScreeningStageNotification(
        candidateName: string,
        positionName: string,
        positionLink: string,
        companyName: string,
        prescreenLink: string
    ): string {
        return `EVRYKA - ${companyName} - ${positionName} - prescreen invitation

        Hello ${candidateName}

        Great news!
        You've reached the next stage of recruitment process for the position
        <a href="${positionLink}" target="_blank">${positionName}</a> in the ${companyName}

        This stage includes a short online assessment designed for preliminary evaluation of your skills, experience and approach to problem-solving.

        To continue, please <a href="${prescreenLink}" target="_blank">complete your prescreen stage</a>.

        Best of luck!
        EVRYKA
        The Recruitment Team`;
    }

  generateAssessmentStageNotification(
      candidateName: string,
      positionName: string,
      assessmentLink: string
      ): string {

      return `Hello ${candidateName},
          
          Great news! 🎉 
          You've reached the next stage in the selection process for the position <strong>${positionName}</strong>
          
          This stage includes a short online assessment designed to better understand your skills and approach to problem-solving.  
          You can start your assessment by following this <a href="${assessmentLink}" target="_blank">link</a>
          
          Best of luck!  
          The Recruitment Team
      `;
  }

  generateInterviewStageNotification(
        candidateName: string,
        positionName: string,
        positionLink: string,
        companyName: string,
        slotCalendarLink: string
    ): string {
        return `Time slot selection - Interview - ${companyName} - ${positionName}

        Hello ${candidateName}

        We're glad to inform you that you've been shortlisted for the role
        <a href="${positionLink}" target="_blank">${positionName}</a> from the company ${companyName}

        Please book a convenient time slot for your interview with our professional expert team using this link:
        <a href="${slotCalendarLink}" target="_blank">Select interview time</a>

        Best regards,
        EVRYKA
        The Recruitment Team`;
    }

    generateScheduledInterviewNotification(
        candidateName: string,
        positionName: string,
        positionLink: string,
        companyName: string,
        timeSlot: string,
        meetingLink: string
    ): string {
        return `Scheduled Interview - ${companyName} - ${positionName}

        Hello ${candidateName},

        We're glad to inform you that your interview for the position
        <a href="${positionLink}" target="_blank">${positionName}</a> from the company ${companyName}
        has been successfully scheduled.

        Please use this link to connect at ${timeSlot}:
        <a href="${meetingLink}" target="_blank">Join the interview</a>

        Best regards,
        EVRYKA
        The Recruitment Team`;
    }

    generateInterviewFeedbackNotification(
        candidateName: string,
        positionName: string,
        positionLink: string,
        companyName: string,
        feedbackLink: string
    ): string {
        return `Interview feedback - ${companyName} - ${positionName}

        Hello ${candidateName}

        We have already received feedback regarding your interview for the position
        <a href="${positionLink}" target="_blank">${positionName}</a> from the company ${companyName}.

        You can view the details using the link below:
        <a href="${feedbackLink}" target="_blank">View interview feedback</a>

        Best regards,
        EVRYKA
        The Recruitment Team`;
    }

    generateOfferStageNotification(
        candidateName: string,
        positionName: string,
        positionLink: string
        ): string {
        return `Hello ${candidateName},
            
            Congratulations! 🎉  
            We're excited to inform you that you've successfully passed all interview stages for the position <a href="${positionLink}" target="_blank">${positionName}</a>.
            
            Our team would like to extend you a job offer and discuss the details with you.  
            Please check your email for the official offer and next steps.
            
            We're truly impressed with your experience and enthusiasm — welcome to the final stage!
            
            Best regards,  
            The Recruitment Team
        `;
    }

    generateHiredStageNotification(
        candidateName: string,
        positionName: string,
        positionLink: string
        ): string {
        return `Hello ${candidateName},
            
            Fantastic news! 🎉  
            We're thrilled to welcome you to our team as a <a href="${positionLink}" target="_blank">${positionName}</a>.
            
            Thank you for your time, effort, and commitment throughout the hiring process.  
            We're excited to start this journey together and can't wait to see your impact!
            
            Welcome aboard,  
            The Recruitment Team
        `;
    }

    generateRejectionNotification(
        candidateName: string,
        positionName: string,
        positionLink: string,
        stageName: string,
        reason?: string,
        feedback?: string
        ): string {
        let stagePhrase = '';

        switch (stageName) {
            case STAGES_NAMES.APPLIED:
                stagePhrase = 'after reviewing your CV';
                break;
            case STAGES_NAMES.SCREENING:
                stagePhrase = 'after reviewing your prescreen responses';
                break;
            case STAGES_NAMES.ASSESSMENT:
                stagePhrase = 'after reviewing your assessment results';
                break;
            case STAGES_NAMES.INTERVIEW:
                stagePhrase = 'after your technical interview';
                break;
            case STAGES_NAMES.OFFER:
                stagePhrase = 'after the offer discussions';
                break;
            default:
            stagePhrase = 'after reviewing your application';
        }

        const reasonText = reason
            ? `Reason: ${reason}<br><br>`
            : '';

        const feedbackText = feedback
            ? `Our feedback: ${feedback}<br>`
            : '';

        return `Hello ${candidateName},
            
            Thank you for your time and effort throughout the process for the position <a href="${positionLink}" target="_blank">${positionName}</a>
            
            We've carefully considered your application ${stagePhrase}, and we've decided not to move forward at this time.<br>
            
            ${reasonText}${feedbackText}
            
            We truly appreciate your interest in joining our team and encourage you to apply for future opportunities that match your skills and goals.
            
            Wishing you all the best,  
            The Recruitment Team
        `;
    }
}