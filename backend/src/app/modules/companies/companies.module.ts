import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getTypeOrmOptions } from '../../common/utils/db.helper';
import { MongodbConfigService } from '../../services/mongodb.config.service';
import { BaseModule } from '../base/base.module';
import { EmailModule } from '../email/email.module';
import { EmailService } from '../email/services/email.service';
import { PermissionGuard } from '../permissions/guards/permission-guard';
import { PermissionsModule } from '../permissions/permissions.module';
import { CompanyBenefitsController } from './controllers/company-benefits.controller';
import { CompanyValuesController } from './controllers/company-values.controller';
import { CompanyVerifiedController } from './controllers/company-verified.controller';
import { CompanyVersionsController } from './controllers/company-versions.controller';
import { CompaniesPhotoGalleryPublicController } from './controllers/companies-photo-gallery-public.controller';
import { CurrentCompanyController } from './controllers/current-company.controller';
import { IndustryDomainsController } from './controllers/industry-domain.controller';
import { IndustrySubGroupController } from './controllers/industry-subgroup.controller';
import { Company, CompanySchema } from './models/company';
import { CompanyBenefit, CompanyBenefitSchema } from './models/company-benefits';
import { CompanyValue, CompanyValueSchema } from './models/company-values';
import { CompanyVersion, CompanyVersionSchema } from './models/company-versions';
import { CurrentCompany, CurrentCompanySchema } from './models/current-company';
import { IndustryDomain, IndustryDomainSchema } from './models/industry';
import { IndustrySubGroup, IndustrySubGroupSchema } from './models/industry-subgroup';
import { CompanyBenefitsService } from './services/company-benefits.service';
import { CompanyValuesService } from './services/company-values.service';
import { CompanyVerifiedService } from './services/company-verified.service';
import { CompanyVersionService } from './services/company-versions.service';
import { CurrentCompanyService } from './services/current-company.service';
import { IndustryDomainsService } from './services/industry-domains.service';
import { IndustrySubGroupService } from './services/industry-subgroups.service';
import { CompanyLogo, CompanyLogoSchema } from './models/company-logos';
import { CompanyLogosService } from './services/company-logos.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Company,
      CompanyVersion,
      IndustryDomain,
      IndustrySubGroup,
      CurrentCompany,
      CompanyValue,
      CompanyBenefit,
      CompanyLogo,
    ]),
    MongooseModule.forFeature([
      {
        name: IndustrySubGroup.name, schema: IndustrySubGroupSchema
      },
      {
        name: CompanyVersion.name, schema: CompanyVersionSchema
      },
      {
        name: Company.name, schema: CompanySchema
      },
      {
        name: IndustryDomain.name, schema: IndustryDomainSchema
      },
      {
        name: CurrentCompany.name, schema: CurrentCompanySchema
      },
      {
        name: CompanyBenefit.name, schema: CompanyBenefitSchema
      },
      {
        name: CompanyValue.name, schema: CompanyValueSchema
      },
      {
        name: CompanyLogo.name, schema: CompanyLogoSchema
      },
    ]),
    BaseModule,
    EmailModule,
    PermissionsModule
  ],
  controllers: [
    CompanyVersionsController,
    IndustryDomainsController,
    IndustrySubGroupController,
    CompanyVerifiedController,
    CompaniesPhotoGalleryPublicController,
    CurrentCompanyController,
    CompanyValuesController,
    CompanyBenefitsController,
  ],
  providers: [
    CompanyVersionService,
    CompanyVerifiedService,
    IndustryDomainsService,
    IndustrySubGroupService,
    EmailService,
    CurrentCompanyService,
    PermissionGuard,
    CompanyValuesService,
    CompanyBenefitsService,
    CompanyLogosService,
  ],
  exports: [CurrentCompanyService],
})
export class CompaniesModule { }
