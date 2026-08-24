import { Injectable, signal } from "@angular/core"
import { Meeting, TimeSlot } from "../models/scheduled-meeting"

@Injectable({
    providedIn: "root",
})
export class MeetingsService {
    // Sample data for demonstration
    private meetingsSignal = signal<Meeting[]>([
        {
            id: "1",
            title: "Frontend Developer Interview",
            description: "Technical interview for senior frontend position",
            startTime: new Date(2024, 11, 15, 10, 0),
            endTime: new Date(2024, 11, 15, 11, 0),
            attendees: ["john.doe@company.com", "jane.smith@company.com"],
            type: "interview",
            candidate: "Alex Johnson",
            position: "Senior Frontend Developer",
            interviewer: "John Doe",
            isVirtual: true,
            meetingLink: "https://meet.google.com/abc-defg-hij",
        },
        {
            id: "2",
            title: "HR Screening Call",
            description: "Initial screening for backend developer role",
            startTime: new Date(2024, 11, 16, 14, 30),
            endTime: new Date(2024, 11, 16, 15, 30),
            attendees: ["hr@company.com"],
            type: "screening",
            candidate: "Sarah Wilson",
            position: "Backend Developer",
            interviewer: "HR Team",
            isVirtual: true,
            meetingLink: "https://zoom.us/j/123456789",
        },
        {
            id: "3",
            title: "Team Sync Meeting",
            description: "Weekly team synchronization",
            startTime: new Date(2024, 11, 18, 9, 0),
            endTime: new Date(2024, 11, 18, 10, 0),
            attendees: ["team@company.com"],
            type: "team-meeting",
            interviewer: "Team Lead",
            isVirtual: false,
            location: "Conference Room A",
        },
    ])

    get meetings() {
        return this.meetingsSignal()
    }

    addMeeting(meeting: Omit<Meeting, "id">) {
        const newMeeting: Meeting = {
            ...meeting,
            id: Date.now().toString(),
        }
        this.meetingsSignal.update((meetings) => [...meetings, newMeeting])
        return newMeeting
    }

    updateMeeting(id: string, updates: Partial<Meeting>) {
        this.meetingsSignal.update((meetings) =>
            meetings.map((meeting) => (meeting.id === id ? { ...meeting, ...updates } : meeting)),
        )
    }

    deleteMeeting(id: string) {
        this.meetingsSignal.update((meetings) => meetings.filter((meeting) => meeting.id !== id))
    }

    getMeetingsForDate(date: Date): Meeting[] {
        return this.meetings.filter((meeting) => {
            const meetingDate = new Date(meeting.startTime)
            return meetingDate.toDateString() === date.toDateString()
        })
    }

    generateTimeSlots(date: Date): TimeSlot[] | any[] {
        const dayMeetings = this.getMeetingsForDate(date)

        return Array.from({ length: 24 }, (_, i) => {
            const hour = i
            const time = `${hour.toString().padStart(2, "0")}:00`
            const label = new Date(0, 0, 0, hour).toLocaleTimeString("en-US", {
                hour: "numeric",
                hour12: true,
            })

            // Check if this time slot has any meetings
            const slotMeetings = dayMeetings.filter((meeting) => {
                const meetingStart = new Date(meeting.startTime)
                const meetingEnd = new Date(meeting.endTime)
                const slotTime = new Date(date)
                slotTime.setHours(hour, 0, 0, 0)

                // Check if the slot time falls within any meeting duration
                return slotTime >= meetingStart && slotTime < meetingEnd
            })

            return {
                time,
                label,
                isAvailable: slotMeetings.length === 0,
                meetings: slotMeetings,
            }
        })
    }

    isTimeSlotAvailable(date: Date, time: string): boolean {
        const [hours, minutes] = time.split(":").map(Number)
        const slotTime = new Date(date)
        slotTime.setHours(hours, minutes, 0, 0)

        return !this.meetings.some((meeting) => {
            const meetingStart = new Date(meeting.startTime)
            const meetingEnd = new Date(meeting.endTime)

            // Check if the slot time falls within any meeting duration
            return slotTime >= meetingStart && slotTime < meetingEnd
        })
    }

    checkTimeConflict(startTime: Date, endTime: Date, excludeMeetingId?: string): Meeting[] {
        return this.meetings.filter((meeting) => {
            if (excludeMeetingId && meeting.id === excludeMeetingId) {
                return false
            }

            const meetingStart = new Date(meeting.startTime)
            const meetingEnd = new Date(meeting.endTime)

            // Check for overlap
            return (
                (startTime >= meetingStart && startTime < meetingEnd) ||
                (endTime > meetingStart && endTime <= meetingEnd) ||
                (startTime <= meetingStart && endTime >= meetingEnd)
            )
        })
    }
}
