import { Injectable } from "@nestjs/common";
import { UtilitiesService } from "../../core/services/utilities.service";
import { BaseService } from "../../base/services/base.service";
import { Repository } from "typeorm";
import { InjectModel } from "@nestjs/mongoose";
import { InjectRepository } from "@nestjs/typeorm";
import { Model } from "mongoose";
import { CalendarInvitation, CalendarInvitationDocument } from "../model/calendar-invitation";

const ical = require('ical-generator');

@Injectable()
export class CalendarInvitationService extends BaseService<CalendarInvitation> {

  collectionName = 'calendar-invitations';

  constructor(
    @InjectModel(CalendarInvitation.name)
    protected readonly model: Model<CalendarInvitationDocument>,

    @InjectRepository(CalendarInvitation)
    protected readonly repository: Repository<CalendarInvitation>,
    private utilitiesService: UtilitiesService
  ) {
    super(model, repository);
  }

  getIcalObjectInstance(starttime, endtime, summary, description, location, url, name, email) {
    const cal = ical({ domain: "evryka.org", name: `Interview Invitation` });
    cal.domain("evryka.org");
    cal.createEvent({
      start: starttime,
      end: endtime,
      summary: summary,         // 'Summary of your event'
      description: description, // 'More description'
      location: location,       // 'Delhi'
      url: url,                 // 'event url'
      organizer: {              // 'organizer details'
        name: name,
        email: email
      },
    });
    // console.log(`calendar invitation`, cal);

    return cal;
  }
}
