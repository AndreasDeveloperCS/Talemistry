import { Controller, Get, Param, Query, Req, Res, StreamableFile } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { Response } from 'express';
import { Readable } from 'stream';
import { UtilitiesService } from '../../core/services/utilities.service';
import { TalentProfileService } from '../services/talent-profile.service';
import { ProfilePhotoService } from '../services/profile-photo.service';
import { TemplateColor } from '../models/cv-template-color.enum';
import { VisitCardPdfService } from '../services/visit-card-pdf.service';
import { UsersService } from '../../users/services/user.service';
import { TalentProfile } from '../models/talent-profile';

@Controller('visit-cards-pdf')
export class VisitCardPdfController {
  constructor(
    private readonly visitCardPdfService: VisitCardPdfService,
    private readonly profileService: TalentProfileService,
    protected moduleRef: ModuleRef,
    private utilityService: UtilitiesService,
    protected userService: UsersService
  ) { }

    @Get('download-visit-cards/:id')
    async downloadVisitCards(
        @Param('id') id: string,
        @Query('color') color: TemplateColor,
        @Req() request: Request,
        @Res({ passthrough: true }) response: Response
        ): Promise<StreamableFile> {
        console.log('Visit Cards Controller', id, color);
        try {
            const userId = this.profileService.getObjectId(id);
            let profile = await this.profileService.getByUserIdAsync(userId);
            if(!profile) {
                profile = new TalentProfile();
            }
            profile.user = await this.userService.getByIdAsync(id);
            const qrCodeUrl = `https://tap.evryka.org/public-profile/${id}`;
            const pdfBuffer = await this.visitCardPdfService.generateVisitCards(
                {
                    firstName: profile?.user.firstname,
                    lastName: profile?.user.lastname,
                    email: profile?.user.email,
                    phone: profile?.user.phone,
                    pseudonym: profile.pseudonym,
                    targetPosition: profile.targetPosition,
                    qrCodeUrl,
                },
                color || TemplateColor.Orange
            );

            const stream = Readable.from(pdfBuffer);
            response.header('Access-Control-Allow-Origin', request.headers['origin'] as string);
            response.set({
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="visit-cards-${id}.pdf"`,
                'Cache-Control': 'no-store',
                'Content-Length': pdfBuffer.length,
            });

            return new StreamableFile(stream);
        } catch (error) {
            console.error('downloadVisitCards', error);
            response.status(500).send(error);
        }
    }
}