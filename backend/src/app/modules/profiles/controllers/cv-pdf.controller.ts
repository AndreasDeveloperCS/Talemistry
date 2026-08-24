import { Controller, Get, Param, Query, Req, Res, StreamableFile } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Response } from 'express';
import { Readable } from 'stream';
import { UtilitiesService } from '../../core/services/utilities.service';
import { UsersService } from '../../users/services/user.service';
import { TemplateType } from '../models/cv-template-type.enum';
import { CvPdfService } from '../services/cv-pdf.service';
import { TalentProfileService } from '../services/talent-profile.service';
import { ProfilePhotoService } from '../services/profile-photo.service';
import { TemplateColor } from '../models/cv-template-color.enum';

@Controller('cv-pdf')
export class CvPdfController {
  constructor(
    private readonly cvPdfService: CvPdfService,
    private readonly profileService: TalentProfileService,
    private readonly profilePhotoService: ProfilePhotoService,
    private readonly userService: UsersService,
    protected moduleRef: ModuleRef,
    private utilityService: UtilitiesService
  ) { }

  @Get('download/:id')
  async downloadCV(
    @Param('id') id: string,
    @Query('template') template: TemplateType,
    @Query('color') color: TemplateColor,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response
  ): Promise<StreamableFile> {
    console.log('downloadCVPdf', id, template, color);

    // CORS is handled globally by NestJS enableCors() in main.ts.
    // Do NOT set manual CORS headers here — duplicates cause browsers to reject the response.

    try {
      const userId = this.profileService.getObjectId(id);
      let profile = await this.profileService.getByUserIdAsync(userId);
      if (!profile) {
        response.status(404).send({ message: `Talent profile for user ${id} not found` });
        return;
      }

      let persistedUser: any;
      try {
        persistedUser = await this.userService.getByIdAsync(id);
      } catch (userLookupError) {
        console.warn(`CV PDF fallback: could not load canonical user for ${id}`, userLookupError);
      }

      const requestUser = await this.utilityService.getUser(request);
      profile.user = {
        ...(persistedUser || {}),
        ...(profile.user || {}),
        ...(requestUser || {}),
      } as any;
      const photo = await this.profilePhotoService.getProfilePhotoById(id);
      profile.user.photo = photo?.Location || photo?.imagePath || null;
      const pdfBuffer = await this.cvPdfService
        .generateCV(profile, template || TemplateType.MinimalistSingleColumn, color || TemplateColor.Orange);
      const stream = Readable.from(pdfBuffer);

      response.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent('cv-' + id + '.pdf')}"`,
        'Cache-Control': 'no-store',
        'Content-Length': pdfBuffer.length,
      });

      return new StreamableFile(stream);
    } catch (error) {
      console.error('downloadCVPdf', error);
      const message = error instanceof Error ? error.message : 'CV PDF generation failed';
      response.status(500).send({ message });
    }
  }
}