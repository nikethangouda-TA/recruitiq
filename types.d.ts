declare module "pdf-parse" {
    interface PDFData {
        numpages: number;
        numrender: number;
        info: Record<string, unknown>;
        metadata: Record<string, unknown>;
        version: string;
        text: string;
    }
    function pdf(dataBuffer: Buffer): Promise<PDFData>;
    export = pdf;
}

declare module "mammoth" {
    interface Result {
        value: string;
        messages: unknown[];
    }
    interface Options {
        buffer?: Buffer;
        path?: string;
    }
    export function extractRawText(options: Options): Promise<Result>;
    export function convertToHtml(options: Options): Promise<Result>;
}
