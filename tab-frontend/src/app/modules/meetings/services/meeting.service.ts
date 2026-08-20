import { HttpClient, HttpParams } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { BehaviorSubject, Observable } from "rxjs";
import { environment } from "../../../../environments/environment";
import { TimeSpan } from "../../general/models/time-span";
import { CRUDService } from "../../general/services/crud.service";
import { Meeting } from "../models/meeting";
import { SlotPeriod, TimeSlot } from "../models/schedule";

@Injectable({
  providedIn: 'root'
})
export class MeetingService extends CRUDService<Meeting> {

  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.meetings}`;

  private skillsSubject = new BehaviorSubject<Meeting[]>([]);

  meetingScheduleSubject$: Observable<Meeting[]> = this.skillsSubject.asObservable();

  model: Meeting = new Meeting();

  private validitySubject = new BehaviorSubject<boolean>(false);
  validity$ = this.validitySubject.asObservable();

  constructor(http: HttpClient) {
    super(http);
    this.validateAndEmit();
  }

  isMeetingValid(): boolean {
    const m = this.model;
    if (!m) {
      return false;
    }
    const isValid = !!(
      m.topic?.trim() && m.agenda?.trim() && m.date &&
      m.startTime && m.endTime && m.duration &&
      m.timeSlot && m.selectedSlotPeriod &&
      m.participants?.length &&
      m.participants.every(p => p.firstname?.trim() && p.lastname?.trim() && p.email?.trim()) &&
      (m.meetingLinkEvryka || m.meetingLinkGoogleMeets.hangoutLink || m.meetingLinkTeams.joinUrl || m.meetingLinkZoom.join_url)
    );
    console.log('isMeetingValid', isValid, m);
    return isValid;
  }

  validateAndEmit() {
    const isValid = this.isMeetingValid();
    this.validitySubject.next(isValid);
  }

  getTimeSlot(startTime: Date, selectedSlotPeriod: SlotPeriod) {
    const timeSlot: TimeSlot = new TimeSlot();
    timeSlot.duration = this.getTimeSpan(selectedSlotPeriod);
    timeSlot.startTime = startTime;
    timeSlot.endTime = new Date(startTime.getTime() + timeSlot.duration.totalMiliseconds);
    timeSlot.selectedSlotPeriod = selectedSlotPeriod;
    timeSlot.isSelected = true;
    return timeSlot;
  }
  
  getTimeSpan(selectedSlotPeriod: SlotPeriod): TimeSpan {
    switch (selectedSlotPeriod) {
      case SlotPeriod.quater:
        return new TimeSpan(15 * 60 * 1000);
      case SlotPeriod.half:
        return new TimeSpan(30 * 60 * 1000);
      case SlotPeriod.threeQauters:
        return new TimeSpan(45 * 60 * 1000);
      case SlotPeriod.hour:
        return new TimeSpan(60 * 60 * 1000);
      case SlotPeriod.twoHour:
        return new TimeSpan(120 * 60 * 1000);
      default:
        return new TimeSpan(15 * 60 * 1000);
    }
  }

  getMeetingsByRangeAsync(startDate: Date, endDate: Date, isProtected: boolean = true): Observable<Meeting[]> {
      const params = new HttpParams().set('startDate', startDate.toISOString()).set('endDate', endDate.toISOString());

    return this.http.get<Meeting[]>(
      `${this.tartgetUrl}/by-range`,
      {
        headers: this.getHttpHeaders(isProtected),
        withCredentials: isProtected,
        params
      }
    );
  }

  getSelectedDateMeetingsAsync(date: Date, isProtected: boolean = true): Observable<Meeting[]> {
    const params = new HttpParams().set('selectedDate', date.toISOString());
    return this.http.get<Meeting[]>(`${this.tartgetUrl}/selected-date`, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected,
      params
    });
  }

  getUpcomingMeetingsAsync(date: Date, isProtected: boolean = true): Observable<Meeting[]> {
    return this.http.get<Meeting[]>(`${this.tartgetUrl}/date/${date}`, {
      headers: this.getHttpHeaders(isProtected),
      withCredentials: isProtected
    });
  }
}
