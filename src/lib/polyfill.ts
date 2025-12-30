import { Blob } from 'buffer';

// Polyfill for File class which is missing in Node 18 environments
// undici (used by Next.js fetch) references File, causing ReferenceError
if (typeof global !== 'undefined' && typeof global.File === 'undefined') {
    class FilePolyfill extends Blob {
        name: string;
        lastModified: number;

        constructor(fileBits: BlobPart[], fileName: string, options?: FilePropertyBag) {
            super(fileBits as any, options);
            this.name = fileName;
            this.lastModified = options?.lastModified || Date.now();
        }
    }

    (global as any).File = FilePolyfill;
    console.log('File polyfill installed for Node.js environment');
}

export { };
