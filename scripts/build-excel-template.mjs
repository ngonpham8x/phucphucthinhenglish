// Rebuild the embedded VBA from reviewed source without changing Office trust settings.
// MS-OVBA 2.3.4: omit compiled caches and write interoperable module source.
import fs from 'node:fs/promises';
import CFB from 'cfb';
import JSZip from 'jszip';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

export function decompressVba(input) {
  const bytes = Buffer.from(input);
  if (bytes[0] !== 1) throw new Error('Invalid VBA compressed container');
  const output = [];
  let cursor = 1;
  while (cursor < bytes.length) {
    const start = cursor;
    const header = bytes.readUInt16LE(cursor); cursor += 2;
    const end = Math.min(start + (header & 0x0fff) + 3, bytes.length);
    const chunkStart = output.length;
    if ((header & 0x7000) !== 0x3000) throw new Error('Invalid VBA chunk signature');
    if (!(header & 0x8000)) {
      while (cursor < end) output.push(bytes[cursor++]);
      continue;
    }
    while (cursor < end) {
      const flags = bytes[cursor++];
      for (let bit = 0; bit < 8 && cursor < end; bit++) {
        if (!(flags & (1 << bit))) { output.push(bytes[cursor++]); continue; }
        const token = bytes.readUInt16LE(cursor); cursor += 2;
        const offsetBits = Math.max(4, Math.ceil(Math.log2(output.length - chunkStart)));
        const lengthBits = 16 - offsetBits;
        const length = (token & ((1 << lengthBits) - 1)) + 3;
        const offset = (token >> lengthBits) + 1;
        if (offset > output.length - chunkStart) throw new Error('Invalid VBA copy token');
        for (let index = 0; index < length; index++) output.push(output[output.length - offset]);
      }
    }
  }
  return Buffer.from(output);
}

export function compressVba(input) {
  const bytes = Buffer.from(input);
  const chunks = [Buffer.from([1])];
  // Literal-only compressed chunks are intentionally simple and portable.
  for (let start = 0; start < bytes.length; start += 3600) {
    const raw = bytes.subarray(start, start + 3600);
    const payload = [];
    for (let index = 0; index < raw.length; index += 8) {
      payload.push(0, ...raw.subarray(index, index + 8));
    }
    const header = Buffer.alloc(2);
    header.writeUInt16LE(0xb000 | (payload.length - 1));
    chunks.push(header, Buffer.from(payload));
  }
  return Buffer.concat(chunks);
}

export async function rebuildTemplate() {
  const templatePath = new URL('../public/excel/PhucPhucThinhSyncTemplate.xlsm', import.meta.url);
  const input = process.argv.includes('--from-head')
    ? execFileSync('git',['show','HEAD:public/excel/PhucPhucThinhSyncTemplate.xlsm'],{maxBuffer:10*1024*1024})
    : await fs.readFile(templatePath);
  const zip = await JSZip.loadAsync(input);
  const project = CFB.read(await zip.file('xl/vbaProject.bin').async('nodebuffer'), {type:'buffer'});
  const rebuilt = CFB.utils.cfb_new();
  const streams = new Map(project.FullPaths.flatMap((path,index) => project.FileIndex[index]?.type === 2 && !/\/__SRP_/.test(path)
    ? [[path.replace(/^[^/]+\//,''),Buffer.from(project.FileIndex[index].content)]] : []));
  const entry = name => project.FileIndex[project.FullPaths.findIndex(path => path.endsWith('/VBA/' + name))];
  const directory = decompressVba(entry('dir').content);
  const moduleOffsetHeader = Buffer.from([0x31, 0, 4, 0, 0, 0]);
  const sourceNames = new Map([['SyncEngine','SyncEngine.bas'], ['ThisWorkbook','ThisWorkbook.cls']]);
  for (const path of [...project.FullPaths]) {
    const name = path.split('/').at(-1);
    if (!path.includes('/VBA/') || !name || ['dir','_VBA_PROJECT'].includes(name) || name.startsWith('__SRP_')) continue;
    const module = entry(name);
    if (module?.type !== 2) continue;
    const encodedName = Buffer.from(name, 'latin1');
    const streamRecord = Buffer.alloc(6); streamRecord.writeUInt16LE(0x1a); streamRecord.writeUInt32LE(encodedName.length,2);
    const streamPosition = directory.indexOf(Buffer.concat([streamRecord,encodedName]));
    if (streamPosition < 0) throw new Error('Missing module directory record: ' + name);
    const offsetPosition = directory.indexOf(moduleOffsetHeader,streamPosition);
    if (offsetPosition < 0) throw new Error('Missing module source offset: ' + name);
    const offset = directory.readUInt32LE(offsetPosition + 6);
    let source = decompressVba(module.content.subarray(offset));
    if (sourceNames.has(name)) {
      const attributes = source.toString('latin1').split(/\r?\n/).filter(line => line.startsWith('Attribute ')).join('\r\n');
      const code = await fs.readFile(new URL('../excel-macros/' + sourceNames.get(name), import.meta.url),'utf8');
      if (/[^\x00-\x7f]/.test(code)) throw new Error('VBA source must use ChrW$ for Unicode labels: ' + name);
      source = Buffer.from(attributes + '\r\n' + code.replace(/\r?\n/g,'\r\n'),'latin1');
    }
    directory.writeUInt32LE(0,offsetPosition + 6);
    streams.set(path.replace(/^[^/]+\//,''),compressVba(source));
  }
  streams.set('VBA/dir',compressVba(directory));
  streams.set('VBA/_VBA_PROJECT',Buffer.from([0xcc,0x61,0xff,0xff,0,1,0]));
  for (const [path,content] of streams) CFB.utils.cfb_add(rebuilt,path,content);
  const binary = CFB.write(rebuilt,{type:'buffer',fileType:'cfb'});
  CFB.read(binary,{type:'buffer'}); // Validate before replacing the known-good template.
  zip.file('xl/vbaProject.bin',binary);
  await fs.writeFile(templatePath,await zip.generateAsync({type:'nodebuffer',compression:'DEFLATE'}));
  console.log('Rebuilt Excel VBA template from source; Office security settings unchanged.');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) await rebuildTemplate();
