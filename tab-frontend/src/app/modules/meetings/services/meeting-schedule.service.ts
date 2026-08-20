import { HttpClient } from "@angular/common/http";
import { EventEmitter, Injectable, Output } from "@angular/core";
import { CRUDService } from "../../general/services/crud.service";
import { AvailableSchedule, TimeSlot } from "../models/schedule";
import { environment } from "../../../../environments/environment";

@Injectable({
  providedIn: 'root'
})
export class MeetingScheduleService extends CRUDService<AvailableSchedule> {  
  override inheritedClassName: string = this.constructor.name;
  public override tartgetUrl: string = `${environment.apiUrl}${environment.serverPaths.schedule}`;

  @Output() dateSelected = new EventEmitter<Date>();
  @Output() timeSlotSelected = new EventEmitter<TimeSlot>();

  constructor(http: HttpClient) {
    super(http)
  }
}
