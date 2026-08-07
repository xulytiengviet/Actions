import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';

const encoded = (await readFile(new URL('../assets/cvnss_converter.js.gz.b64', import.meta.url), 'utf8')).trim();
const source = gunzipSync(Buffer.from(encoded, 'base64'));
await mkdir(new URL('../src/', import.meta.url), { recursive: true });
await writeFile(new URL('../src/cvnss_converter.js', import.meta.url), source);
console.log(`Assembled src/cvnss_converter.js (${source.length} bytes)`);
