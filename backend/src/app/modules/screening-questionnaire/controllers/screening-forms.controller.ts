import { Body, Controller, Delete, Get, HttpCode, Ip, Param, Patch, Post, Put, Query, Req, Res, SetMetadata } from '@nestjs/common';
import { Request, Response } from 'express';
import { PaginatedResource, Pagination, PaginationParams } from '../../../helpers/pagination';
import { BaseController } from '../../base/controllers/base.controller';
import { ModuleRef } from '@nestjs/core';
import { User } from '../../users/models/user';
import { ScreeningForm } from '../models/screening-form';
import { IScreeningForm, ScreeningFormsService } from '../services/screening-forms.service';
import { ObjectId } from 'bson';
import { ScreeningQuestion } from '../models/screening-question';
import { ScreeningQuestionsService } from '../services/screening-questions.service';
import { Filtering, CustomFilter, FilterRule } from '../../../helpers/filtering';
import { Sorting } from '../../../helpers/sorting';
import { ScreeningFormInfo } from '../interfaces/screening-form-position-info';
import { PositionsService } from '../../positions/services/positions.service';

@Controller('screening-forms')
@SetMetadata('entityModel', ScreeningForm)
export class ScreeningFormsController extends BaseController<ScreeningForm> {
    override className: string = this.constructor.name;

    constructor(protected service: ScreeningFormsService,
        protected questionService: ScreeningQuestionsService,
        protected readonly positionsService: PositionsService,
        protected moduleRef: ModuleRef) {
        super(service, moduleRef);
    }

    // @Get()
    // async getAllAsync(
    //     @PaginationParams() paginationParams: Pagination,
    //     @Query('sortParams') sortParams: string,
    //     @Query('filterParams') filterParams: string,
    //     @Req() request: Request,
    //     @Res() response: Response,
    //     @Ip() ip): Promise<any> {
    //     response.header('Access-Control-Allow-Origin', request.headers.origin);
    //     await super.getAllAsync(paginationParams, sortParams, filterParams, request, response, ip);
    // }

    @Get('form-position-info')
    async getAllFormPositionInfoAsync(
        @PaginationParams() paginationParams: Pagination,
        @Query('sortParams') sortParams: string,
        @Query('filterParams') filterParams: string,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip): Promise<any> {
            
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        try {

            const sorting: Sorting = sortParams ? JSON.parse(sortParams) : undefined;
            const filtering: Filtering = filterParams
                ? JSON.parse(filterParams)
                : undefined;

            const filter: CustomFilter = {
                property: 'isVerified',
                rule: FilterRule.EQUALS,
                value: true
            }

            if (!filtering.some(item => item.property == filter.property && item.value == filter.value)) {
                filtering.push(filter);
            }

            let paginationResult = await this.service.getAllAsync(
                paginationParams,
                sorting,
                filtering,
            );

            const forms = paginationResult.items;
            const positionIds = [...new Set(forms.map(f => f.positionId))];
            const positions = await this.positionsService.getByIds(positionIds);
            const positionMap = new Map(
                positions.map(p => [p._id.toString(), p.title])
            );
            const items: ScreeningFormInfo[] = forms.map(form => ({
                _id: form._id,
                userId: form.userId,
                positionId: form.positionId!,
                isVerified: form.isVerified,
                createdBy: form.createdBy,
                createdDate: form.createdDate,
                modifiedBy: form.modifiedBy,
                modifiedDate: form.modifiedDate,
                positionTitle: positionMap.get(form.positionId?.toString()) || 'Unknown'
            }));
            const result: PaginatedResource<ScreeningFormInfo> = {
                totalItems: paginationResult.totalItems,
                page: paginationResult.page,
                size: paginationResult.size,
                items: items
            };

            return response.status(200).json(result);
        } catch (error) {
            return response.status(500).json(error);
        }
    }

    @Get('position/:positionId')
    async getScreeningFormByPositionId(
        @Param('positionId') positionId: string,
        @Req() request: Request,
        @Res() response: Response,
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);
        console.log('getScreeningFormByPositionId', positionId);
        try {
            const requestingUser = this.utilitiesService.getUser(request);
            const screeningForm = await this.service.getScreeningFormByPositionId(positionId, requestingUser?._id);

            return response.status(200).json(screeningForm);
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Get(':_id')
    async getById(
        @Param('_id') _id: string,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip): Promise<any> {
        return await super.getByIdAsync(_id, request, response, ip);
    }

    @Post()
    @HttpCode(201)
    async post(
        @Body() body: IScreeningForm,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);

        try {
            console.log(`Screening Form Controller Insert request:`, body);

            const requestingUser: User = this.utilitiesService?.getUser(request);
            if (!requestingUser) {
                return response.status(401).json({ message: 'Unauthorized' });
            }

            let screeningForm: ScreeningForm = { 
                userId: new ObjectId(body.userId),
                positionId: new ObjectId(body.positionId),
                isVerified: true,
                createdBy: new ObjectId(requestingUser._id),
                createdDate: new Date()
            };

            console.log('ScreeningForm to create', screeningForm);

            const createdScreeningForm: ScreeningForm = await this.service.createAsync(screeningForm);
            console.log('Created Screening Form', createdScreeningForm);
            const formId = createdScreeningForm._id;

            const questions: ScreeningQuestion[] = body?.questions || [];

            const createdQuestions = await Promise.all(
                questions.map(q => {
                    const questionToCreate: ScreeningQuestion = {
                        ...q,
                        formId: new ObjectId(formId),
                        userId: new ObjectId(requestingUser._id),
                        createdDate: new Date(),
                        createdBy: new ObjectId(requestingUser._id),
                    };

                    return this.questionService.createAsync(questionToCreate);
                })
            );

            console.log('createdQuestions', createdQuestions);

            const clean = (obj: any) => JSON.parse(JSON.stringify(obj));

            const enrichedScreeningForm = {
                ...clean(createdScreeningForm),
                questions: createdQuestions.map(clean),
            };

            console.log('enrichedScreeningForm', enrichedScreeningForm);

            return response.status(200).send(enrichedScreeningForm);
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Put(':_id')
    @HttpCode(204)
    async put(
        @Param('_id') _id: string,
        @Body() body: IScreeningForm,
        @Req() request: Request,
        @Res() response: Response,
        @Ip() ip
    ): Promise<any> {
        response.header('Access-Control-Allow-Origin', request.headers.origin);

        try {
            console.log(`Screening Form Controller Update request:`, body);

            const requestingUser: User = this.utilitiesService?.getUser(request);
            if (!requestingUser) {
                return response.status(401).json({ message: 'Unauthorized' });
            }

            const existingQuestions = await this.questionService.getByFormIdAsync(new ObjectId(body._id));
            console.log('existingQuestions', existingQuestions);

            const incomingQuestions: ScreeningQuestion[] = body.questions || [];

            console.log('incomingQuestions', incomingQuestions); 

            const toCreate: ScreeningQuestion[] = [];
            const toUpdate: ScreeningQuestion[] = [];
            const toDelete: ScreeningQuestion[] = [];

            const incomingIds = new Set(incomingQuestions.map(q => q._id?.toString()));
            for (const existing of existingQuestions) {
                if (!incomingIds.has(existing._id.toString())) {
                    toDelete.push(existing);
                }
            }

            for (const incoming of incomingQuestions) {
                if (!incoming._id) {
                    // New question
                    toCreate.push({
                        ...incoming,
                        formId: new ObjectId(body._id),
                        userId: new ObjectId(body.userId),
                        createdBy: new ObjectId(requestingUser._id),
                        createdDate: new Date(),
                        isVerified: true,
                    });
                } else {
                    // Existing — compare with DB version
                    const existing = existingQuestions.find(q => q._id.toString() === incoming._id.toString());
                    console.log('existing question', existing, incoming._id);
                    if (existing && hasQuestionChanged(existing, incoming)) {
                        toUpdate.push({
                            ...existing,
                            ...incoming,
                            _id: new ObjectId(existing._id),
                            userId: new ObjectId(body.userId),
                            formId: new ObjectId(body._id),
                            modifiedBy: new ObjectId(requestingUser._id),
                            modifiedDate: new Date(),
                        });
                    }
                }
            }

            console.log('toCreate', toCreate, 'toUpdate', toUpdate, 'toDelete', toDelete);

            // --- 3️⃣ Execute ---
            await Promise.all([
                ...toCreate.map(q => this.questionService.createAsync(q)),
                ...toUpdate.map(q => this.questionService.updateAsync(q)),
                ...toDelete.map(q => this.questionService.deleteAsync(q._id)),
            ]);

            const updatedForm: ScreeningForm = {
                ...body,
                userId: new ObjectId(body.userId),
                positionId: new ObjectId(body.positionId),
                modifiedBy: new ObjectId(requestingUser._id),
                modifiedDate: new Date(),
            };
            console.log('Form before update', updatedForm);

            const savedForm = await this.service.updateAsync(updatedForm);
            console.log('Form after update', savedForm);

            const finalQuestions = await this.questionService.getByFormIdAsync(new ObjectId(body._id));

            const clean = (obj: any) => JSON.parse(JSON.stringify(obj));

            const enrichedForm = {
                ...clean(savedForm),
                questions: finalQuestions.map(clean),
            };
            console.log('enrichedForm', enrichedForm);

            return response.status(200).send(enrichedForm);
        } catch (error) {
            console.error(error);
            return response.status(500).json(error);
        }
    }

    @Patch(':_id')
    async patch(
        @Param('_id') _id: string,
        @Query('propertyName') propertyName: string,
        @Body() body: string,
        @Req() request: Request,
        @Res() response: Response
    ) {
        return await super.patchAsync(_id, propertyName, body, request, response);
    }

    @Delete(':id')
    @HttpCode(204)
    async delete(
        @Param('id') id: string,
        @Req() request: Request,
        @Res() response: Response
    ) {
        return await super.deleteAsync(id, request, response);
    }
}

function hasQuestionChanged(oldQ: ScreeningQuestion, newQ: ScreeningQuestion): boolean {
  const simpleFields: (keyof ScreeningQuestion)[] = ['text', 'type', 'required', 'order'];
  console.log('oldQ', oldQ, 'newQ', newQ);
  for (const field of simpleFields) {
    if (oldQ[field] !== newQ[field]) return true;
  }

  const oldOpts = oldQ.options || [];
  const newOpts = newQ.options || [];

  if (oldOpts.length !== newOpts.length) return true;

  for (let i = 0; i < oldOpts.length; i++) {
    const oldOpt = oldOpts[i];
    const newOpt = newOpts[i];
    if (!newOpt) return true;

    if (oldOpt.text !== newOpt.text || oldOpt.order !== newOpt.order) {
      return true;
    }
  }

  return false;
}