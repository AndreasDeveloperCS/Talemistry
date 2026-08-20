import { Controller, SetMetadata } from "@nestjs/common";
import { BaseController } from "../../base/controllers/base.controller";
import { UserRecruitmentPlatform } from "../models/user-recruitment-platform";
import { UserRecruitmentPlatformService } from "../services/user-recruitment-platform.service";
import { ModuleRef } from "@nestjs/core";

@Controller('user-recruitment-platforms')
@SetMetadata('entityModel', UserRecruitmentPlatform)
export class UserRecruitmentPlatformController extends BaseController<UserRecruitmentPlatform> {

  constructor(protected service: UserRecruitmentPlatformService, protected moduleRef: ModuleRef) {
    super(service, moduleRef)
  }

}
