import { Request, Response, NextFunction } from 'express';
import { Headers } from '@nestjs/common';
import { Controller, HttpCode, Param, Get, Post, UseInterceptors, Req, Res, StreamableFile, HttpStatus, Header } from '@nestjs/common';
import { createReadStream, statSync } from 'fs';
import { join } from 'path';
import { VideoService } from '../services/video.service';
import { getBaseDir } from '../../../common/utils/path.helper';


const fs = require("fs");
const fsAsync = require("fs").promises;
const path = require("path");
const { resolve } = require("path");
const mime = require('mime-types');
const util = require('util');

@Controller(`videos`)
export class VideoController {

    views = {
        client: path.join(getBaseDir(`VideoController public/views/client.html`), 'public/views/client.html'),
        landing: path.join(getBaseDir(`VideoController public/views/landing.html`), 'public/views/landing.html'),
        newCall: path.join(getBaseDir(`VideoController public/views/newcall.html`), 'public/views/newcall.html'),
        notFound: path.join(getBaseDir(`VideoController public/views/404.html`), 'public/views/404.html'),
    };

    constructor(private videoService: VideoService) { }

    @Get('/test')
    async test(@Req() req: Request, @Res() res: Response) {
        console.debug('LANDING: ', this.views.landing);
        res.sendFile(this.views.client);
    }


    @Get()
    @HttpCode(200)
    async getVideoChatLanding(
        @Req() req: Request,
        @Res() res: Response) {

        const file = createReadStream(this.views.landing);
        res.set({
            'Content-Type': 'text/html',
            'Content-Disposition': 'attachment; filename="landing.html"',
        });

        const response = {
            data: new StreamableFile(file),
        };
        return res.sendFile(path.resolve(getBaseDir(), 'public/views/landing.html'))
        //return res.status(200).send(response);
    }

    //@Get('/getInterviewConnectedVideo')
    @Post('/getInterviewConnectedVideo/:interviewId')
    @HttpCode(204)
    async getVideos(@Param("interviewId") interviewId: string,
        @Req() req: Request,
        @Res() res: Response,
        next: NextFunction): Promise<any> {
        try {

            // const allInterviewVideo = await this.videoService.getInterviewConnectedVideoAsync(interviewId);
            // allInterviewVideo.forEach((result:any) => {
            //   result.id = result._id.toString();
            // });

            const range = req.headers.range;

            if (!range) {
                res.status(400).send("Requires Range header");
            }

            const videoPath = "Chris-Do.mp4";
            const videoSize = fs.statSync("Chris-Do.mp4").size;
            const CHUNK_SIZE = 10 ** 6;
            const start = Number(range.replace(/\D/g, ""));
            const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
            const contentLength = end - start + 1;
            const headers = {
                "Content-Range": `bytes ${start} - ${end} / ${videoSize}`,
                "Accept-Ranges": "bytes",
                "Content-Length": contentLength,
                "Content-Type": "video/mp4",
            };
            res.writeHead(206, headers);
            const videoStream = fs.createReadStream(videoPath, { start, end });
            videoStream.pipe(res);

            //res.set("Accept", "application/json; charset=utf-8");
            //res.status(200).json({ result: allInterviewVideo });
            // next();
            res.end();
        } catch (error) {
            console.error(`[get]Couldn't return collection of positions`);
            res.status(500).send({
                status: 'ERROR',
                message: `Could not retreive verified positions. ${1} 1`
            });
        }
    }

    @Get('stream/:id')
    @Header('Accept-Ranges', 'bytes')
    @Header('Content-Type', 'video/mp4')
    async getStreamVideo(@Param('id') id: string, @Headers() headers, @Res() res: Response) {

        const videoPath = `assets/${id}.mp4`;
        const { size } = statSync(videoPath);
        const videoRange = headers.range;

        if (videoRange) {

            const parts = videoRange.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : size - 1;
            const chunksize = (end - start) + 1;
            const readStreamfile = createReadStream(videoPath, { start, end, highWaterMark: 60 });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${size}`,
                'Content-Length': chunksize,
            };
            res.writeHead(HttpStatus.PARTIAL_CONTENT, head); //206
            readStreamfile.pipe(res);

        } else {

            const head = {
                'Content-Length': size,
            };
            res.writeHead(HttpStatus.OK, head);//200
            createReadStream(videoPath).pipe(res);

        }

    }

    @Get()
    findAll() {
        //return this.videoService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        //return this.videoService.findOne(+id);
    }
}
