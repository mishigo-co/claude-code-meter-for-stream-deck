import { deflateRawSync } from "node:zlib";
import { readFileSync } from "node:fs";
import { join } from "node:path";
// @ts-ignore — no types for omggif
import { GifReader } from "omggif";

export interface FrameSet {
  frames: string[];  // data:image/png;base64,... per frame
  delays: number[];  // ms per frame
}

// ── minimal PNG encoder ───────────────────────────────────────────────────────

function crc32(buf: Buffer): number {
  let c = 0xFFFFFFFF;
  for (const b of buf) {
    let x = (c ^ b) & 0xFF;
    for (let k = 0; k < 8; k++) x = x & 1 ? 0xEDB88320 ^ (x >>> 1) : x >>> 1;
    c = x ^ (c >>> 8);
  }
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.allocUnsafe(4); len.writeUInt32BE(data.length);
  const crcBuf = Buffer.allocUnsafe(4); crcBuf.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crcBuf]);
}

function rgbaToPng(w: number, h: number, rgba: Buffer): Buffer {
  const ihdrData = Buffer.allocUnsafe(13);
  ihdrData.writeUInt32BE(w, 0); ihdrData.writeUInt32BE(h, 4);
  ihdrData[8] = 8; ihdrData[9] = 6; ihdrData[10] = 0; ihdrData[11] = 0; ihdrData[12] = 0;

  const scanlines = Buffer.allocUnsafe(h * (1 + w * 4));
  for (let y = 0; y < h; y++) {
    scanlines[y * (1 + w * 4)] = 0; // no filter
    rgba.copy(scanlines, y * (1 + w * 4) + 1, y * w * 4, (y + 1) * w * 4);
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk("IHDR", ihdrData),
    pngChunk("IDAT", deflateRawSync(scanlines)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

// ── GIF → FrameSet ────────────────────────────────────────────────────────────

export function loadGifFrames(path: string): FrameSet {
  const data = readFileSync(path);
  const reader = new GifReader(new Uint8Array(data)) as {
    width: number; height: number;
    numFrames(): number;
    frameInfo(i: number): { delay: number };
    decodeAndBlitFrameRGBA(i: number, buf: Buffer): void;
  };

  const w = reader.width, h = reader.height;
  const canvas = Buffer.alloc(w * h * 4);
  const frames: string[] = [];
  const delays: number[] = [];

  for (let i = 0; i < reader.numFrames(); i++) {
    const info = reader.frameInfo(i);
    reader.decodeAndBlitFrameRGBA(i, canvas);
    const png = rgbaToPng(w, h, Buffer.from(canvas));
    frames.push(`data:image/png;base64,${png.toString("base64")}`);
    delays.push(Math.max(info.delay, 2) * 10);
  }

  return { frames, delays };
}

export function gifPath(name: string): string {
  return join(process.cwd(), "icons", name);
}
