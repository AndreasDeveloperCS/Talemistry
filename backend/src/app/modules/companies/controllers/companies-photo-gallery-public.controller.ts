import { Controller, Get, Param, Req, Res, SetMetadata } from '@nestjs/common';
import { Request, Response } from 'express';
import { Company } from '../models/company';
import { CompanyVerifiedService } from '../services/company-verified.service';

@Controller('companies-photo-gallery-public')
@SetMetadata('entityModel', Company)
export class CompaniesPhotoGalleryPublicController {
    constructor(private readonly service: CompanyVerifiedService) { }

    @Get(':_id')
    async getVerifiedGallery(
        @Param('_id') _id: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);

        const company = await this.service.getByIdAsync(_id, []);
        if (!company?.isVerified) {
            return response.status(404).json({ message: 'Company not found' });
        }

        const items = (company.photoGallery ?? [])
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

        return response.status(200).json({ items });
    }
}
