import { InjectModel } from "@nestjs/mongoose";
import { BriefQuestion, BriefQuestionDocument } from "../models/brief-question";
import { Model } from "mongoose";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BaseService } from "../../base/services/base.service";
import { Injectable } from "@nestjs/common";

@Injectable()
export class BriefQuestionService extends BaseService<BriefQuestion> {

    constructor(
        @InjectModel(BriefQuestion.name)
        protected readonly model: Model<BriefQuestionDocument>,

        @InjectRepository(BriefQuestion)
        protected readonly repository: Repository<BriefQuestion>
    ) {
        super(model, repository);
    }

}