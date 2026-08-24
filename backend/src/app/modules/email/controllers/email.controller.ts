
import { Request, Response, NextFunction } from 'express';
import { EmailService } from '../services/email.service';
import { Controller, Post, Req, Res, Get, SetMetadata, Body, Ip, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { BaseController } from '../../base/controllers/base.controller';
import { EmailMessage, MessageAttachment } from '../models/message';
import { FilesInterceptor } from '@nestjs/platform-express';
import multer = require('multer');
import { AWSFileShareService } from '../../base/services/aws-fileshare.service';
import { ModuleRef } from '@nestjs/core';

const fs = require("fs");
const fsAsync = require("fs").promises;
const path = require("path")
const { resolve } = require("path");
const mime = require('mime-types');
const util = require('util');

@Controller(`emails`)
@SetMetadata('entityModel', EmailMessage)
export class EmailController extends BaseController<EmailMessage> {

  constructor(private emailService: EmailService,
    private AWSFileShareService: AWSFileShareService,
    protected moduleRef: ModuleRef) {
    super(emailService, moduleRef);
  }

  @Post()
  @UseInterceptors(FilesInterceptor('files[]', 100, { storage: multer.memoryStorage() }))
  async sendAsync(
    @UploadedFiles(
      //   'files[]', 
      //   new ParseFilePipe({
      //   validators: [
      //     //new FileTypeValidator({ fileType: '.(pdf|doc|docx|rtf)' }),
      //     new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 1024 * 1024 * 128 }),
      //   ]
      // })
    ) files: Array<Express.Multer.File>,
    @Body() body: any,
    @Req() request: Request,
    @Res() response: Response,
    @Ip() ip,
    next: NextFunction) {
    response.header('Access-Control-Allow-Origin', request.headers.origin);
    try {
      const message: any = JSON.parse(body.info);
      try {
        this.emailService.sendAttachmentsFromStream(files, message.info);
      } catch (ex) {
        console.error(ex);
        return response.status(500).json(ex);
      }

      if (files.length > 0) {
        try {
          files.forEach(async file => {
            const awsResult = await this.AWSFileShareService.uploadFile('messages-attachments', files[0], message.email, files[0].originalname);
            var messageAttachment = new MessageAttachment();

            messageAttachment.fileName = file.originalname;
            messageAttachment.fileType = mime.lookup(file.originalname);
            messageAttachment.fileSize = file.size;
            messageAttachment.filePath = awsResult.Key;

            message.attachments.push(messageAttachment);
          });
          // save as message attachment

        } catch (ex) {
          console.error(ex);
          return response.status(500).json(ex);
        }
      }
      var result = await this.emailService.createAsync(message);

      return response.status(200).json(result);
    } catch (ex) {
      console.error(ex);
      return response.status(500).json(ex);
    }
  }

  @Post('send')
  async post(@Req() req: Request, @Res() res: Response, next: NextFunction) {
    try {
      res.setHeader('Content-Type', 'application/json');
      const emailSendingResult = this.emailService.sendEmail(req.body);
      res.json({
        requestBody: req.body,
        emailSendingResult: emailSendingResult
      })
      this.sendResponse(req.body, res);
      //next();
    } catch (error) {
      console.error(`[post]Could not send e-mail`, error);
      const response = {
        status: 'ERROR',
        message: 'Could not send e-mail',
        error: error,
        input: req.body
      };
      res.status(500).send(response);
      this.sendResponse(response, res);
    }
  }

  @Get()
  async get(@Req() req: Request, @Res() res: Response, next: NextFunction): Promise<any> {
    try {
      const name = req.query.name || 'World';
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ greeting: `Hello ${name}!` }));


    } catch (error) {
      console.error(`[get]Couldn't read log file.`);
      res.status(500).send({ status: 'ERROR', message: `Could not read log. ${1} 1` });
    }
  }

  public sendResponse(data: Object, res: Response): any {
    const result = { message: "", result: undefined };
    try {
      if (data == null) {
        result.message = "Some Error Message..."
        res.status(500);
        return;
      }

      result.result = data;;
      res.status(200);
      return result;
    }
    catch (err) {

      result.message = "A critical error occurred"
      res.status(500);
      console.error(err);
      return result;
    }
  }
}

