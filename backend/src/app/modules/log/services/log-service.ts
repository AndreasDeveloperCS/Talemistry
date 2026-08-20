
import { Injectable } from '@nestjs/common';
import { isProd } from '../../../config';

const CircularJSON = require('circular-json');
const { parse, stringify } = require('flatted');

import * as fs from 'fs';
import * as path from 'path';
import { BaseService } from '../../base/services/base.service';
import { LogLevel, LogRecord, LogRecordDocument } from '../models/log-record';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { ObjectId } from 'bson';
import { getBaseDir } from '../../../common/utils/path.helper';


const logInfoStream = fs.createWriteStream(path.join(getBaseDir(),
  'info.log'
), { flags: 'a' });
const logErrorStream = fs.createWriteStream(path.join(getBaseDir(), 'errors.log'), { flags: 'a' });
const fileStream = require('fs');

@Injectable()
export class LogService extends BaseService<LogRecord> {

  constructor(
    @InjectModel(LogRecord.name)
    protected readonly model: Model<LogRecordDocument>,

    @InjectRepository(LogRecord)
    protected readonly repository: Repository<LogRecord>

  ) {
    super(model, repository);
  }

  public saveLog(
    level: LogLevel,
    srс: any,
    trace: any,
    content?: any,
    message?: string,
    info?: any
  ) {
    const date = this.getDate(new Date(Date.now()));
    const directoryPath = this.getBaseDir();
    const fileName = path?.join(`${directoryPath}`, `log-${date}.txt`);
    try {
      let convertedContent: string = this.tryParseContent(level, content);

      let definedSource: string = `${srс}`;
      let fullTrace: string = Object.getOwnPropertyNames(
        Object.getPrototypeOf(trace)
      )?.join(' * ');
      const record = this.getRecord(
        level,
        `${definedSource} <- ${fullTrace}`,
        convertedContent,
        message
      );

      this.writeToFile(fileName, this.getLoggingRecord(record));
    } catch (er) {
      this.writeToFile(
        fileName,
        `Issue in time of log of logging record \n ${er} \n ${er.message}  \n ${er.stack}`
      );
    }
  }

  public async getLogFile(body: any): Promise<string> {
    const directoryPath = this.getBaseDir();

    let targetFilePaths: any[];

    await this.getSortedFiles(directoryPath).then((result) => {
      targetFilePaths = result;
    });

    if (targetFilePaths.length > 0) {
      const fileName = targetFilePaths.pop();
      const directoryPath = this.getBaseDir();
      return `${directoryPath}${fileName}`;
    }
  }

  private async getSortedFiles(dir): Promise<any[]> {
    let sortedFiles: any[];
    await fileStream.promises
      .readdir(dir, (err, internalFiles) => {
        if (err) {
          console.error('Unable to scan directory: ', err);
          return;
        }
        return internalFiles.sort((a, b) => b - a);
      })
      .then((internalFiles) => {
        sortedFiles = internalFiles
          .map((fileName) => ({
            name: fileName,
            time: fs.statSync(`${dir}/${fileName}`).ctime.getTime(),
          }))
          .sort((a, b) => b.name - a.name)
          .map((internalFile) => internalFile.name);
      });
    return sortedFiles;
  }

  public async writeToFileAsync(data) {
    const date = this.getDate(new Date(data.datetime));
    const record = this.getLoggingRecord(data);
    const directoryPath = this.getBaseDir();
    //console.log(date, record, directoryPath);

    const fileName = `${directoryPath}log-${date}.txt`;

    if (!fileStream.existsSync(fileName)) {
      fileStream.createReadStream(fileName);
    }

    await fileStream.promises.appendFile(
      fileName,
      record,
      (err) => {
        // Checking for errors
        if (err) {
          console.error('Done writing', err);
          throw err;
        }
        return 'OK';
      },
      'utf-8'
    );
  }
  getLoggingRecord(data: any) {
    return `[${new Date(data.createdDate)}] [${data.source}] [${data.logLevel}] \n ${data.logData} \n ${data.additionalInfo} \n\n`;
  }

  public writeToFile(fileName: string, record: string) {
    if (!fileStream.existsSync(fileName)) {
      fileStream.writeFileSync(
        fileName,
        record,
        function (err, result) {
          if (err) {
            throw err;
          }
          // console.log('Done writing', result);
          return 'OK';
        },
        'utf-8'
      );
    } else {
      // console.log('existsSync', fileName);
      var logStream = fs.createWriteStream(fileName, { flags: 'a' });
      logStream.write('\n*****************************\n');
      logStream.write(record);
      logStream.end('\n*****************************\n');
    }
  }

  tryParseContent(level: LogLevel, content: any): string {
    try {
      switch (level) {
        case LogLevel.ERROR:
          return `${content.lineNumber} \n ${content.message} \n ${content.stack}`;
        case LogLevel.INFO:
          return `${stringify(content)}`;
        case LogLevel.WARNING:
          return `${content} \n ${content?.stack}`;
      }
    } catch (ex) {
      return content;
    }
  }

  getRecord(
    level: LogLevel,
    srс: any,
    content: any,
    info?: string
  ): LogRecord {
    // console.log(srс);
    const record: LogRecord = {
      createdDate: new Date(Date.now()),
      logLevel: level,
      source: srс,
      logData: content,
      additionalInfo: info ?? '',
      createdBy: new ObjectId('0000000000000000000000'), // Replace with actual user ID
    };

    return record;
  }

  objToString(obj) {
    var str = '';
    for (var p in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, p)) {
        str += p + '::' + obj[p] + '\n';
      }
    }

    return str;
  }

  private getDate(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }


  private getBaseDir(): string {
    const prefix = isProd ? 'prod' : '';
    const dirName = `./logs`;
    if (!fs.existsSync(dirName)) {
      fs.mkdirSync(dirName);
    }
    const subDirName = `./logs/${prefix}`;
    if (!fs.existsSync(subDirName)) {
      fs.mkdirSync(subDirName);
    }
    return `${subDirName}/`;
  }

  censor(censor) {
    var i = 0;

    return function (key, value) {
      if (
        i !== 0 &&
        typeof censor === 'object' &&
        typeof value == 'object' &&
        censor == value
      )
        return '[Circular]';

      if (i >= 29)
        // seems to be a harded maximum of 30 serialized objects?
        return '[Unknown]';

      ++i; // so we know we aren't using the original object anymore

      return value;
    };
  }
}

function getCallerInfo(): { className?: string; methodName?: string } {
  const stack = new Error().stack;
  if (!stack) return {};

  const stackLines = stack.split('\n');

  // The 3rd or 4th line usually contains the caller (depends on call depth)
  const callerLine = stackLines[3] || stackLines[2];

  const match = callerLine?.match(/at (.+?) \((.+?):\d+:\d+\)/) || callerLine?.match(/at (.+?) \s?\((.+)\)/);

  if (match) {
    const fullName = match[1];
    // Optional: split class.method
    const parts = fullName.split('.');
    const methodName = parts.pop();
    const className = parts.pop();
    return { className, methodName };
  }

  return {};
}

export const writeInfoLog = function (...args: any[]) {
  try {
    const { className, methodName } = getCallerInfo();
    const content = `${new Date()} [${className}:${methodName}]: ${args.map(arg => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join('\r')} \n`
    process.stdout.write(content);
    logInfoStream.write(content);
  } catch (ex) {
    console.error('Error in writelog', ex);
    logErrorStream.write(`Error during log recording: ${ex} \n`);
  }
};

export const writeErrorLog = function (...args: any[]) {
  try {
    const { className, methodName } = getCallerInfo();
    const content = `${new Date()} [${className}:${methodName}]: ${args.map(arg => (typeof arg === 'string' ? arg : JSON.stringify(arg))).join('\r')} \n`
    logErrorStream.write(content);

    process.stdout.write(`${new Date()} \nCLASS: ${className}  \nMETHOD: ${methodName} : ${args.join('\r')} \n\n`);
  } catch (ex) {
    console.error('Error in writelog', ex);
    logErrorStream.write(`Error during log recording: ${ex} \n`);
  }
};
