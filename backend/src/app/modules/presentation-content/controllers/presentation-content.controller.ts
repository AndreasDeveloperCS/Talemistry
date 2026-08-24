import {
    Controller, Get, Header, HttpCode, HttpStatus, StreamableFile, Headers,
    Param,
    Res,
    HttpException
} from '@nestjs/common';
import { createReadStream } from 'fs';
import { join } from 'path';

import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { getBaseDir } from '../../../common/utils/path.helper';

@Controller('presentation-content')
export class PresentationContentController {

    private streamMp4(
        filePath: string,
        range: string | undefined,
        res: Response,
    ) {
        if (!fs.existsSync(filePath)) {
            throw new HttpException('Video not found', HttpStatus.NOT_FOUND);
        }

        const stat = fs.statSync(filePath);
        const fileSize = stat.size;
        const contentType = 'video/mp4';

        // If the browser does not request a byte range, send the whole file with 200.
        // Returning 206 + a tiny chunk here can prevent <video> from ever reaching "canplay".
        if (!range) {
            res.writeHead(200, {
                'Accept-Ranges': 'bytes',
                'Content-Length': `${fileSize}`,
                'Content-Type': contentType,
                'Cache-Control': 'no-store',
            });
            (fs.createReadStream(filePath) as any).pipe(res as any);
            return;
        }

        // Parse the Range header: e.g. "bytes=START-END", "bytes=START-", "bytes=-SUFFIX"
        const normalized = range.replace(/bytes=/, '').trim();
        const [startStr, endStr] = normalized.split('-');

        let start: number;
        let end: number;

        if (startStr === '' && endStr) {
            // Suffix-byte-range-spec, e.g. "bytes=-500" (last 500 bytes)
            const suffixLength = parseInt(endStr, 10);
            if (isNaN(suffixLength) || suffixLength <= 0) {
                res.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE).set({
                    'Content-Range': `bytes */${fileSize}`,
                });
                return res.send();
            }
            end = fileSize - 1;
            start = Math.max(0, fileSize - suffixLength);
        } else {
            start = parseInt(startStr, 10);
            // If end is omitted ("bytes=0-"), serve to EOF.
            end = endStr ? parseInt(endStr, 10) : fileSize - 1;
        }

        // Validate
        if (isNaN(start) || isNaN(end) || start > end || start < 0 || end >= fileSize) {
            res.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE).set({
                'Content-Range': `bytes */${fileSize}`,
            });
            return res.send();
        }

        const contentLength = end - start + 1;

        res.writeHead(206, {
            'Content-Range': `bytes ${start}-${end}/${fileSize}`,
            'Accept-Ranges': 'bytes',
            'Content-Length': `${contentLength}`,
            'Content-Type': contentType,
            'Cache-Control': 'no-store',
        });

        (fs.createReadStream(filePath, { start, end }) as any).pipe(res as any);
    }

    @Get('pdf')
    @HttpCode(HttpStatus.OK)
    @Header('Content-Type', 'application/pdf')
    @Header('Content-Disposition', 'attachment; filename=EVRYKA - Digital Innovative Solutions.pdf')
    async getPdf() {
        // return createReadStream('./content/Evryka-call-centers-ai-analysis-tool-presentation.pdf');
        const filePath = join(getBaseDir(), 'content', 'EVRYKA - Digital Innovative Solutions.pdf');
        const file = createReadStream(filePath);
        return new StreamableFile(file)
    }

    @Get('video-promo-background')
    @Header('Accept-Ranges', 'bytes')
    async streamVideoBackground(
        @Headers('range') range: string | undefined,
        @Res() res: Response,
    ) {
        const videoDir = path.resolve(getBaseDir(), 'content');
        const filePath = path.join(videoDir, 'video-promo-background.mp4');
        this.streamMp4(filePath, range, res);
    }

    @Get('video-promo-comp')
    @Header('Accept-Ranges', 'bytes')
    async streamVideo(
        @Headers('range') range: string | undefined,
        @Res() res: Response,
    ) {
        const videoDir = path.resolve(getBaseDir(), 'content');
        const filePath = path.join(videoDir, 'video-promo-comp.mp4');
        this.streamMp4(filePath, range, res);
    }
}
