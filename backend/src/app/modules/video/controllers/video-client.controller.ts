import { Controller, Get, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
const fs = require("fs");

//Repkace with logic through Video Gateway
@Controller('video-client')
export class VideoClientController {

    @Get('/')
    index(@Req() req: Request, @Res() res: Response) {
        res.sendFile('views/landing.html', { root: 'public' });
    }

    @Get('/public')
    public(@Req() req: Request, @Res() res: Response) {
        res.sendFile('views/landing.html', { root: 'public' });
    }

    @Get('/join/*')
    joinWithPath(@Req() req: Request, @Res() res: Response) {
        res.sendFile('views/client.html', { root: 'public' });
    }

    @Get('/join')
    joinWithParam(@Req() req: Request, @Res() res: Response) {
        res.sendFile('views/client.html', { root: 'public' });
    }

    @Get('/video')
    videoExchange(@Req() req: Request, @Res() res: Response) {

        const path = 'assets/sample.mp4'
        const stat = fs.statSync(path);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, "").split("-");
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

            const chunksize = (end - start) + 1
            const file = fs.createReadStream(path, { start, end });
            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
            }

            res.writeHead(206, head);
            file.pipe(res);
        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            };
            res.writeHead(200, head);
            fs.createReadStream(path).pipe(res);
        }
    }

    @Get('/video-exchange')
    playVideoExchange(@Req() req: Request, @Res() res: Response) {

        const path = 'assets/sample.mp4'
        const stat = fs.statSync(path);
        const fileSize = stat.size;
        const range = req.headers.range;

        if (range) {

            const parts = range.replace(/bytes=/, "").split("-");

            const start = parseInt(parts[0], 10);

            const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

            const chunksize = (end - start) + 1;

            const file = fs.createReadStream(path, { start, end });

            const head = {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': 'video/mp4',
            }

            res.writeHead(206, head);

            file.pipe(res);

        } else {
            const head = {
                'Content-Length': fileSize,
                'Content-Type': 'video/mp4',
            };
            res.writeHead(200, head);
            fs.createReadStream(path).pipe(res);
        }
    }
}
