// Use require with an any-typed binding to avoid missing type declarations
const pdfjsLib: any = require('pdfjs-dist/legacy/build/pdf.js');

(pdfjsLib as any).GlobalWorkerOptions.workerSrc = require('pdfjs-dist/build/pdf.worker.js');

async function extractWithPdfJs(buffer: Buffer) {

    const loadingTask = pdfjsLib.getDocument({ data: buffer });

    const doc = await loadingTask.promise;

    const pages: { page: number; items: { str: string; x: number; y: number }[] }[] = [];

    for (let p = 1; p <= doc.numPages; p++) {
        const page = await doc.getPage(p);
        const content = await page.getTextContent();
        const items = content.items.map((i: any) => ({
            str: i.str, x: i.transform[4], y: i.transform[5]
        }));
        pages.push({ page: p, items });
    }

    return pages;
}