import { AbstractControl } from "@angular/forms";

export class MeetingBookingRequestForm
{
        participants?: AbstractControl<any, any>;

        topic?: AbstractControl<any, any>;
        agenda?: AbstractControl<any, any>;

        date?: AbstractControl<any, any>;
        startTime?: AbstractControl<any, any>;
        duration?: AbstractControl<any, any>;
        endTime?: AbstractControl<any, any>;
        timeZone?: AbstractControl<any, any>;
    
        meetingLinkEvryka?: AbstractControl<any, any>;
    
        meetingLinkGoogleMeets?: AbstractControl<any, any>;
        meetingLinkTeams?: AbstractControl<any, any>;
        meetingLinkZoom?: AbstractControl<any, any>;
}

export class MeetingParticipantForm {
    firstname?: AbstractControl<any, any>;
    lastname?: AbstractControl<any, any>;
    email?: AbstractControl<any, any>;
}
