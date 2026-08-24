const nodemailer = require('nodemailer');
import { ContactData } from '../../../common/interfaces/contact-data';
import { User } from '../../users/models/user';
import { baseUrl } from '../../../config';
import { VerificationRequest } from '../../users/models/user-verification';
import { Injectable } from '@nestjs/common';
import { CandidateInfoData } from '../../cvs/models/cv-info-envelope';
import * as path from 'path';
import { Meeting, ParticipantInfo } from '../../meetings/model/meeting';
import { Lead } from '../../briefs/models/lead';
import { ObjectId } from 'bson';
import { BaseService } from '../../base/services/base.service';
import { InjectModel } from '@nestjs/mongoose';
import { InjectRepository } from '@nestjs/typeorm';
import { EmailMessage, EmailMessageDocument } from '../models/message';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { CustomerBrief } from '../../briefs/models/customer-brief';
import { format, sub } from 'date-fns';
import { getTimezoneOffset, toZonedTime } from 'date-fns-tz';
import { OpenPosition } from '../../positions/models/open-position';
import { from } from 'rxjs';

@Injectable()
export class EmailService extends BaseService<EmailMessage> {

  constructor(
    @InjectModel(EmailMessage.name)
    protected readonly model: Model<EmailMessageDocument>,

    @InjectRepository(EmailMessage)
    protected readonly repository: Repository<EmailMessage>
  ) {
    super(model, repository);
  }

  briefFillingDelegationInvitation(lead: any, brief: CustomerBrief) {
    return this.leadEmailInvitation(lead, brief)
  }

  briefFillingInvitation(lead: Lead, brief: CustomerBrief) {
    return this.leadEmailInvitation(lead, brief)
  }

  leadEmailInvitation(lead: Lead, brief: CustomerBrief) {
    const brieflContent = `
    <div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">
      <h2>Hello,</h2>
      <p><strong>${lead.firstname} ${lead.lastname}</strong> invited you to complete a brief.</p>
      <p>Please follow the link below to view and fill out the brief:</p>
      <p>
        <a href="https://localhost:3000/briefs/${brief._id}" 
        style="background-color: #FF6B1A;
          color: #FFFFFF;
          padding: 12px 24px;
          border-radius: 8px;
          transition: all 0.3s ease;
          cursor: pointer;
          display: inline-flex;
          justify-content: center;
          align-items: center;
          gap: 8px;
          text-align: center;
          border: 2px solid #FF6B1A;
          font-size: 18px;
          font-weight: 600;
          text-decoration: none;">
          View the Brief
        </a>
      </p>
      <p>If you have any questions, feel free to reply to this email.</p>
      <br>
      <p>Best regards,<br>The Team</p>
    </div>
  `;

    const message = {
      from: this.sourceEmailAddress,
      to: brief.sharedEditEmails.length > 0 ? brief.sharedEditEmails[0] : lead.email,
      cc: lead.email,
      subject: `Invitation from ${lead.firstname} ${lead.lastname} to fullfil the brief`,
      html: brieflContent
    };
    return message;
  }

  //sourceEmailAddress = 'customers_services@talemistry.com';
  sourceEmailAddress = 'noreply@talemistry.com';
  targetEmailAddress = 'aandreaspetrov@gmail.com';


  sendAttachment(file: any, info: any) {
    let result: any;

    try {
      const message = this.getMessageWithAttachment(file, info);
      result = {
        message: message,
      };
      this.sendMessage(message);
    } catch (ex) {
      console.error(`Could not send e - mail with attachment`, ex);
    }
    return result;
  }

  sendAttachmentsFromStream(files: Array<Express.Multer.File>, info: CandidateInfoData, subject: string = undefined) {
    // console.log('sendAttachmentsFromStream', info);
    let message: any;

    try {
      message = this.getMessageWithAttachmentsFromStream(files, info, subject);
      this.sendMessage(message);
    } catch (ex) {
      console.error(`Could not send e - mail with attachment`, ex);
    }

    return message;
  }

  getMessageWithAttachmentsFromStream(files: Array<Express.Multer.File>, info: CandidateInfoData, subject: string = undefined) {
    // console.log(info);

    const attachments = files.map((file) => ({
      filename: file.originalname,
      content: file.buffer,
    }));

    const message = {
      from: this.sourceEmailAddress,
      to: this.targetEmailAddress,
      subject: subject ?? `Notification - New CV has been added`,
      text: `Message from: ${info?.email} \n${info?.firstname} \n${info?.lastname}
      \n${info?.phone} \n\n${info?.coverLetterText} `,
      attachments: attachments
    }
    return message;
  }

  sendMeetingInvite(meeting: Meeting): any {
    let result: any;
    try {
      // const mainParticipant: ParticipantInfo = {
      //   email: 'aandreaspetrov@gmail.com',
      //   firstname: 'Andreas',
      //   lastname: 'Petrov',
      // }
      const mainParticipant: ParticipantInfo = {
        email: 'ilonka7011@gmail.com',
        firstname: 'Ilona',
        lastname: 'Ivanova',
      }
      const message = this.getMeetingInvitationMessage(meeting, mainParticipant);

      this.sendMessage(message);

      console.log('participants', meeting.participants);

      meeting.participants.forEach((participant: ParticipantInfo) => {
        const message = this.getMeetingInvitationMessage(meeting, participant);
        this.sendMessage(message);
      });

    } catch (ex) {
      console.error(ex);
    }
    return result;
  }

  getMeetingInvitationMessage(meeting: Meeting, participant: ParticipantInfo) {
    const formattedParticipants = meeting.participants
      ?.map(p => `${p.firstname} ${p.lastname} (${p.email})`)
      .join('\n') || 'No participants listed';

    const meetingLinks = [
      { label: '📍 Talemistry:', url: meeting?.meetingLinkEvryka },
      { label: '📍 Google Meet:', url: meeting?.meetingLinkGoogleMeets?.hangoutLink },
      { label: '📍 Microsoft Teams:', url: meeting?.meetingLinkTeams?.joinUrl },
      { label: '📍 Zoom:', url: meeting?.meetingLinkZoom?.join_url },
    ];

    const meetingLinkRows = meetingLinks
      .filter(link => !!link.url)
      .map(link => {
        if (link.label.includes('Zoom')) {
          return `
            <tr>
              <td style="white-space: nowrap; vertical-align: top;"><strong>${link.label}</strong></td>
              <td>
                <span><strong>🔗 Link:</strong> <a href="${link.url}">${link.url}</a></span><br/>
                <span><strong>🆔 Meeting ID:</strong> ${meeting.meetingLinkZoom.id ?? 'N/A'}</span><br/>
                <span><strong>🔐 Passcode:</strong> ${meeting.meetingLinkZoom.password ?? 'N/A'}</span>
              </td>
            </tr>
          `;
        } else if (link.label.includes('Teams')) {
          return `
            <tr>
              <td style="white-space: nowrap; vertical-align: top;"><strong>${link.label}</strong></td>
              <td>
                <span><strong>🔗 Link:</strong> <a href="${meeting.meetingLinkTeams.joinUrl}">${meeting.meetingLinkTeams.joinUrl}</a></span><br/>
                <span><strong>🔐 Meeting Code:</strong> ${meeting.meetingLinkTeams.meetingCode ?? 'N/A'}</span>
              </td>
            </tr>
          `;
        } else if (link.label.includes('Talemistry')) {
          return `
            <tr>
              <td style="white-space: nowrap; vertical-align: top;"><strong>${link.label}</strong></td>
              <td>
                <span><strong>🔗 Link:</strong> <a href="${link.url}">${link.url}</a></span><br/>
              </td>
            </tr>
          `;
        } else if (link.label.includes('Google Meet')) {
          return `
            <tr>
              <td style="white-space: nowrap; vertical-align: top;"><strong>${link.label}</strong></td>
              <td>
                <span><strong>🔗 Link:</strong> <a href="${meeting.meetingLinkGoogleMeets.hangoutLink}">${meeting.meetingLinkGoogleMeets.hangoutLink}</a></td></span><br/>
            </tr>
          `;
        }
      })
      .join('');

    const meetingTz = meeting.timeZone;

    // 1️⃣ convert UTC → meeting timezone (for display only)
    const startInTz = toZonedTime(meeting.startTime, meetingTz);
    const endInTz = toZonedTime(meeting.endTime, meetingTz);

    // 2️⃣ format date & time
    const formattedStartTime = format(startInTz, 'MMMM d, yyyy, HH:mm');
    const formattedEndTime = format(endInTz, 'MMMM d, yyyy, HH:mm');

    // 3️⃣ compute GMT offset (⚠️ use UTC date!)
    const gmtLabel = getGmtLabel(meetingTz, meeting.startTime);

    // 4️⃣ final labels
    const startLabel = `${formattedStartTime} (${meetingTz}, ${gmtLabel})`;
    const endLabel = `${formattedEndTime} (${meetingTz}, ${gmtLabel})`;

    const durationMinutes = this.getDuration(meeting);

    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    const formattedDuration = `${hours ? hours + 'h' : ''}${hours && minutes ? ' ' : ''}${minutes ? minutes + 'min' : ''}` || '0m';

    const emailContent = `
      <div style="font-family: Arial, sans-serif; color: #333; padding: 20px;">
        <h2 style="color: #023859;">📩 You've received a meeting invitation!</h2>
        <br/>
        <table style="font-size: 16px; border-spacing: 5px;">
          <tr>
            <td style="white-space: nowrap; vertical-align: top;"><strong>📌 Title:</strong></td>
            <td><strong>${meeting.topic}</strong></td>
          </tr>
          <tr>
            <td style="white-space: nowrap; vertical-align: top;"><strong>📝 Description:</strong></td>
            <td>${meeting.agenda}</td>
          </tr>
          <tr>
            <td style="white-space: nowrap; vertical-align: top;"><strong>⏱️ Duration:</strong></td>
            <td>${formattedDuration}</td>
          </tr>
          <tr>
            <td style="white-space: nowrap; vertical-align: top;"><strong>🕒 Start:</strong></td>
            <td>${startLabel}</td>
          </tr>
          <tr>
            <td style="white-space: nowrap; vertical-align: top;"><strong>⏳ End:</strong></td>
            <td>${endLabel}</td>
          </tr>
          <tr>
            <td style="white-space: nowrap; vertical-align: top;"><strong>👥 Participants:</strong></td>
            <td style="white-space: pre-wrap;">${formattedParticipants}</td>
          </tr>
          ${meetingLinkRows}
        </table><br>
        <h3 style="margin-top: 30px; color: #023859;">📅 Add to Your Calendar</h3>
        <div style="display: flex; flex-direction: row; flex-wrap: wrap; gap: 20px; margin-top: 10px;">
          <a href="${meeting.meetingLinks.google}" target="_blank" 
            style="background: #4285F4; color: #fff; padding: 10px 15px; text-decoration: none; 
            border-radius: 10px 4px; font-size: 14px; margin: 5px 2.5px;">
            Google Calendar
          </a>
          <a href="${meeting.meetingLinks.outlook}" target="_blank" 
            style="background: #0078D4; color: #fff; padding: 10px 15px; text-decoration: none; 
            border-radius: 10px 4px; font-size: 14px; margin: 5px 2.5px;">
            Outlook
          </a>
          <a href="${meeting.meetingLinks.office365}" target="_blank" 
            style="background: #2F2F2F; color: #fff; padding: 10px 15px; text-decoration: none; 
            border-radius: 10px 4px; font-size: 14px; margin: 5px 2.5px;">
            Office 365
          </a>
          <a href="${meeting.meetingLinks.ics}" target="_blank" 
            style="background: #888; color: #fff; padding: 10px 15px; text-decoration: none; 
            border-radius: 10px 4px; font-size: 14px; margin: 5px 2.5px;">
            Download ICS
          </a>
          <a href="${meeting.meetingLinks.yahoo}" target="_blank" 
            style="background: #6001D2; color: #fff; padding: 10px 15px; text-decoration: none; 
            border-radius: 10px 4px; font-size: 14px; margin: 5px 2.5px;">
            Yahoo Calendar
          </a>
        </div>
        <p style="margin-top: 30px; font-size: 14px; color: #777;">Looking forward to your participation! 🤝</p>
      </div>
    `;

    const message = {
      from: `TALEMISTRY ${this.sourceEmailAddress}`,
      to: participant.email,
      subject: `Meeting Invitation - ${meeting.topic} `,
      html: emailContent
    };
    return message;
  }

  private getDuration(meeting: Meeting) {
    try {
      const start = new Date(meeting.timeSlot.startTime);
      const end = new Date(meeting.timeSlot.endTime);
      return meeting.duration?.minutes
        || Math.floor((end.getTime() - start.getTime()) / 60000);
    } catch (ex) {
      console.error('get Duration', ex);
      return meeting.duration.minutes
    }
  }

  leadNotification(body: ContactData): any {
    let result: any;

    try {
      const message = this.getMessage(body);
      result = {
        message: message,
      };
      this.sendMessage(message);

    } catch (ex) {
      console.error(ex);
    }
    return result;
  }

  sendEmail(body: ContactData): any {
    let result: any;

    try {
      const message = this.getMessage(body);
      result = {
        message: message,
      };
      this.sendMessage(message);

    } catch (ex) {
      console.error(ex);
    }
    return result;
  }

  public async sendMessage(message: any) {
    const transporter = this.getTransporter();

    return new Promise((resolve, reject) => {
      transporter.sendMail(message, (err, info) => {
        if (err) {
          console.error('Email error', err);
          reject(err);
        } else {
          resolve(info);
        }
      });
    });
  }

  // public sendMessage(message: any) {
  //   try {
  //     const transporter = this.getTransporter();
  //     transporter.sendMail(message, function (err, info) {
  //       if (err) {
  //         console.error('err', err);
  //         return err;
  //       } else {
  //         return info;
  //       }
  //     });
  //   } catch (ex) {
  //     console.error(ex);
  //   }
  // }

  // public getNewMessageNotification(email: string, messageText: string) {
  //   const message = {
  //     from: this.sourceEmailAddress,
  //     to: email,
  //     subject: `TALEMISTRY - New Message Notification`,
  //     html: messageText
  //   };
  //   return message;
  // }

  public getNewMessageNotification(
    email: string,
    html: string,
    subject?: string,
  ) {
    return {
      from: this.sourceEmailAddress,
      to: email,
      subject: subject ?? `TALEMISTRY - New Message Notification`,
      html,
    };
  }

  public getUserEmailValidationRequest(user: User, verificationCode: VerificationRequest) {
    const message = {
      from: this.sourceEmailAddress,
      to: user.email,
      subject: `Email Verification`,
      html: `
      Dear, ${user.firstname} !<br>
        Welcome to Talemistry.<br>
      Please, verify your account.<br><a href = "${baseUrl}/auth/${verificationCode.userId}/verification-id/${verificationCode._id}?code=${verificationCode.generatedOtp}" target="_blank"> Verify Email </a><br>
      Verification code: ${verificationCode.generatedOtp} `
    };

    console.log('getUserEmailValidationRequest', message);

    return message;
  }

  public getInternalNotificationMessageWithAttachment(file: any, info: any, subject: string) {
    const attachments = file ? [
      {
        filename: path.parse(file?.filename)?.base,
        path: file?.path,
      }] : [];
    const message = {
      from: this.sourceEmailAddress,
      to: 'aandreaspetrov@gmail.com',
      subject: subject ?? `Notification - New Entity has been added`,
      text: `Message regarding : ${JSON.stringify(info)}`,
      attachments: attachments,
    };
    return message;
  }

  public getNotificationMessageAboutNewOpenPosition(info: any) {
    const message = {
      from: this.sourceEmailAddress,
      to: 'aandreaspetrov@gmail.com',
      subject: `Notification - New Position has been added`,
      html: info,
    };
    return message;
  }

  private getMessageWithAttachment(file: any, info: any) {
    const attachments = file ? [
      {
        filename: path.parse(file?.filename)?.base,
        path: file?.path,
      }] : [];
    const message = {
      from: this.sourceEmailAddress,
      to: 'aandreaspetrov@gmail.com',
      subject: `Notification - New CV has been added`,
      text: `Message from: ${info.email} \n${info.firstname} \n${info.lastname}
      \n${info.phone} \n${info?.coverLetterText} `,
      attachments: attachments,
    };
    return message;
  }

  private getMessage(body: any) {
    const message = {
      from: this.sourceEmailAddress,
      to: 'aandreaspetrov@gmail.com',
      subject: `Notification - Input message from: ${body.email} `,
      text: `Message from: ${body.email} \n\n${body.message}
      \n\n${body.contactName} \n${body.company} \n${body.phone} `,
    };
    return message;
  }

  leadEmailNotification(body: Lead) {
    const message = {
      from: this.sourceEmailAddress,
      to: 'aandreaspetrov@gmail.com',
      subject: `Notification - New Lead:  ${body.firstname} ${body.lastname} ${body.email} `,
      html: `Brief Form Request from: ${body.firstname} ${body.lastname} <br><strong>${body.positionRole} </strong> of <strong>${body.companyName}</strong> <br><br>${body.email} <br>${body.phone} `,
    };
    return message;
  }

  private getTransporter() {
    if (!process.env.SMTP_HOST || !process.env.SMTP_PASS) {
      throw new Error('SMTP_HOST and SMTP_PASS must be set');
    }
    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || this.sourceEmailAddress,
        pass: process.env.SMTP_PASS,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    return transporter;
  }

  buildNewPositionHtml(entity: OpenPosition): string {
    const skills = entity.positionDetails?.requirements?.positionSkills
      ?.slice(0, 5)
      .map(s => s.skillName)
      .join(', ') ?? '—';

    return `
      <h2>New position created</h2>
      <p>A new position has been added to the Talent Pipeline.</p>

      <table>
        <tr><td><strong>Title:</strong></td><td>${entity.title}</td></tr>
        <tr><td><strong>Company:</strong></td><td>${entity.positionDetails.company.data.companyName}</td></tr>
        <tr><td><strong>Workplace:</strong></td><td>${entity.positionDetails?.general?.workPlace ?? '—'}</td></tr>
        <tr><td><strong>Key skills:</strong></td><td>${skills}</td></tr>
      </table>

      <p>
        <a href="https://talemistry.com/career/positions/${entity._id}">
          View position
        </a>
      </p>
    `;
  }
}

export function getGmtLabel(timeZone: string, utcDate: Date): string {
  const offsetMs = getTimezoneOffset(timeZone, utcDate);

  // convert ms → hours AND invert sign ONCE
  const offsetHours = -offsetMs / 3600000;

  const sign = offsetHours <= 0 ? '+' : '-';
  const abs = Math.abs(offsetHours);

  return `GMT${sign}${abs}`;
}