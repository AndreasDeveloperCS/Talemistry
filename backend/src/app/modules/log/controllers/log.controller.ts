import { Request, Response, NextFunction } from 'express';
import { LogService } from '../services/log-service';
import { Controller, HttpCode, Post, UseInterceptors, Req, Res, Get } from '@nestjs/common';

const fs = require("fs");
const fsAsync = require("fs").promises;
const path = require("path")
const { resolve } = require("path");
const mime = require('mime-types');
const util = require('util');

// TODO: Investigate an opportunity 
// 1. to save data to 3 file with errors, warching and info, send it to the email and delete after it from the server
// 2. to save logs to the Elastic Search Kibana or appropriate alternatives 
@Controller(`/logs`)
export class LogController {

  constructor(private logService: LogService) {
  }

  @Post()
  @HttpCode(201)
  async post(@Req() req: Request, @Res() res: Response,) {
    try {
      const result = await this.logService.writeToFileAsync(req.body);
      return this.sendResponse('OK', res);
    } catch (error) {
      console.error(error);
      res.status(500).send({ status: 'ERROR', message: 'Could not write log.' });
    }
  }

  @Get()
  @HttpCode(204)
  async get(@Req() req: Request, @Res() res: Response,): Promise<any> {
    try {
      const name = req.query.name || 'World';
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify({ greeting: `Hello ${name}!` }));
    } catch (error) {
      console.error(error);
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
    catch (error) {

      result.message = "A critical error occurred"
      res.status(500);
      console.error(error);
      return result;
    }
  }
}

