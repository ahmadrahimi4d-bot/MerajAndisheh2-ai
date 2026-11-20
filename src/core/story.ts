import { withBasePath } from "@/core/assets";
import type { StoryTheme } from "@/core/types";

export interface StoryOptions {
  theme: StoryTheme;
  title: string;
  summary: string;
  source: string;
  image: string;
  watermark: string;
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number, maxLines: number) {
  const words = text.replace(/\s+/g, " ").trim().split(" ");
  let line = "";
  let lines = 0;
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (ctx.measureText(candidate).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      y += lineHeight;
      lines += 1;
      line = word;
      if (lines >= maxLines - 1) break;
    } else line = candidate;
  }
  if (line && lines < maxLines) {
    const clipped = ctx.measureText(line).width > maxWidth ? `${line.slice(0, 45)}…` : line;
    ctx.fillText(clipped, x, y);
    y += lineHeight;
  }
  return y;
}

function drawPattern(ctx: CanvasRenderingContext2D, theme: StoryTheme) {
  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = theme.accent;
  ctx.lineWidth = 3;
  if (theme.pattern === "grid") {
    for (let i = -100; i < 2100; i += 120) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + 1920, 1920); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(i + 1920, 0); ctx.lineTo(i, 1920); ctx.stroke();
    }
  } else if (theme.pattern === "arabesque") {
    for (let y = 0; y < 1920; y += 220) for (let x = 0; x < 1080; x += 220) {
      ctx.beginPath(); ctx.arc(x + 110, y + 110, 82, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(x + 110, y + 110, 48, 0, Math.PI * 2); ctx.stroke();
    }
  } else {
    for (let y = -100; y < 2000; y += 180) for (let x = -100; x < 1200; x += 180) {
      ctx.beginPath();
      ctx.moveTo(x, y + 90); ctx.lineTo(x + 90, y); ctx.lineTo(x + 180, y + 90); ctx.lineTo(x + 90, y + 180); ctx.closePath(); ctx.stroke();
    }
  }
  ctx.restore();
}

/** Renders a true 1080×1920 PNG story entirely in the browser. */
export async function generateStory(options: StoryOptions): Promise<string> {
  if (typeof document === "undefined") throw new Error("Story generation requires a browser");
  if (document.fonts?.ready) await document.fonts.ready;
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1920;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported");
  const { theme } = options;
  const gradient = ctx.createLinearGradient(0, 0, 1080, 1920);
  gradient.addColorStop(0, theme.background);
  gradient.addColorStop(1, "#071827");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1080, 1920);
  drawPattern(ctx, theme);

  ctx.fillStyle = theme.accent;
  roundRect(ctx, 72, 72, 936, 12, 6); ctx.fill();

  const image = await loadImage(withBasePath(options.image));
  ctx.save();
  roundRect(ctx, 72, 150, 936, 700, 36); ctx.clip();
  ctx.fillStyle = "rgba(255,255,255,.08)"; ctx.fillRect(72, 150, 936, 700);
  if (image) {
    const scale = Math.max(936 / image.width, 700 / image.height);
    const w = image.width * scale, h = image.height * scale;
    ctx.drawImage(image, 72 + (936 - w) / 2, 150 + (700 - h) / 2, w, h);
  }
  const overlay = ctx.createLinearGradient(0, 520, 0, 850);
  overlay.addColorStop(0, "rgba(0,0,0,0)"); overlay.addColorStop(1, "rgba(4,15,28,.86)");
  ctx.fillStyle = overlay; ctx.fillRect(72, 150, 936, 700);
  ctx.restore();

  ctx.fillStyle = theme.accent;
  roundRect(ctx, 72, 910, 936, 86, 43); ctx.fill();
  ctx.fillStyle = theme.background;
  ctx.font = "700 34px Vazirmatn, Tahoma, sans-serif";
  ctx.direction = "rtl"; ctx.textAlign = "right";
  ctx.fillText("منبع معتبر و مستند", 960, 967);

  ctx.fillStyle = theme.text;
  ctx.textAlign = "right"; ctx.direction = "rtl";
  ctx.font = "800 62px Vazirmatn, Tahoma, sans-serif";
  let y = wrapText(ctx, options.title, 1000, 1080, 880, 88, 3);
  ctx.font = "400 36px Vazirmatn, Tahoma, sans-serif";
  ctx.globalAlpha = 0.88;
  y = wrapText(ctx, options.summary, 1000, Math.max(y + 30, 1260), 880, 58, 5);
  ctx.globalAlpha = 1;

  ctx.fillStyle = "rgba(255,255,255,.14)";
  roundRect(ctx, 72, 1510, 936, 180, 28); ctx.fill();
  ctx.fillStyle = theme.text;
  ctx.font = "700 32px Vazirmatn, Tahoma, sans-serif";
  wrapText(ctx, `منبع: ${options.source || "استودیو معراج اندیشه"}`, 960, 1575, 860, 48, 2);

  ctx.fillStyle = theme.accent;
  ctx.font = "800 48px Vazirmatn, Tahoma, sans-serif";
  ctx.fillText(options.watermark || "استودیو معراج اندیشه", 1000, 1800);
  ctx.fillStyle = "rgba(255,255,255,.65)";
  ctx.font = "500 26px Inter, Tahoma, sans-serif";
  ctx.textAlign = "left"; ctx.direction = "ltr";
  ctx.fillText("1080 × 1920  |  CONTENT BANK", 72, 1800);
  ctx.fillStyle = theme.accent;
  roundRect(ctx, 72, 1850, 936, 8, 4); ctx.fill();
  return canvas.toDataURL("image/png");
}
