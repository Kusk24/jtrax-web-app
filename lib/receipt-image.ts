/**
 * A payment receipt drawn as a picture — a voucher a parent can save to their
 * phone or forward, rather than a web page that needs a printer.
 *
 * Drawn on a canvas, not captured from the DOM: what is on screen and what is
 * saved are the same pixels, with no library in between.
 */

export type ReceiptLine = { label: string; value: string };

export type ReceiptDrawing = {
  school: string;
  title: string;
  /** Two-up details under the header: date, received from, student, method… */
  details: ReceiptLine[];
  itemHeader: string;
  amountHeader: string;
  item: string;
  itemSub: string;
  itemAmount: string;
  /** Subtotal and discount, when there was a discount. */
  adjustments: ReceiptLine[];
  totalLabel: string;
  total: string;
  status: string;
  statusTone: "paid" | "pending" | "refunded";
  thanks: string;
  footnote: string;
};

const W = 720;
const PAD = 40;
const MARGIN = 28;
const SCALE = 2;

const C = {
  page: "#EEF2F8",
  paper: "#FFFFFF",
  navy: "#234A9F",
  navyDeep: "#1E3A70",
  ink: "#1F2A44",
  muted: "#6B7690",
  faint: "#A3ACBF",
  line: "#E3E8F1",
  band: "#F5F7FB",
};

const STAMP = { paid: "#17924A", pending: "#C98A0B", refunded: "#C8322B" };

/** Cut text to fit a width, with an ellipsis. */
function fit(ctx: CanvasRenderingContext2D, text: string, max: number): string {
  if (ctx.measureText(text).width <= max) return text;
  let s = text;
  while (s.length > 1 && ctx.measureText(`${s}…`).width > max) s = s.slice(0, -1);
  return `${s}…`;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Draws the receipt and returns the canvas. `logo` is the school badge, already loaded. */
export function drawReceipt(d: ReceiptDrawing, logo: HTMLImageElement | null, font: string): HTMLCanvasElement {
  const detailRows = Math.ceil(d.details.length / 2);
  const headerH = 168;
  const detailsH = detailRows * 62 + 12;
  const tableH = 44 + 78 + d.adjustments.length * 34 + 16;
  const totalH = 84;
  const footerH = 118;
  const paperH = headerH + 28 + detailsH + 20 + tableH + totalH + footerH;
  const H = paperH + MARGIN * 2;

  const canvas = document.createElement("canvas");
  canvas.width = W * SCALE;
  canvas.height = H * SCALE;
  const ctx = canvas.getContext("2d")!;
  ctx.scale(SCALE, SCALE);
  ctx.textBaseline = "alphabetic";
  const f = (weight: number, size: number) => `${weight} ${size}px ${font}`;

  ctx.fillStyle = C.page;
  ctx.fillRect(0, 0, W, H);

  const px = MARGIN;
  const pw = W - MARGIN * 2;
  const top = MARGIN;
  const bottom = top + paperH;

  /* The paper: rounded top, a torn zigzag edge at the bottom. */
  ctx.save();
  ctx.shadowColor = "rgba(31,42,68,.12)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 8;
  ctx.beginPath();
  ctx.moveTo(px + 18, top);
  ctx.lineTo(px + pw - 18, top);
  ctx.arcTo(px + pw, top, px + pw, top + 18, 18);
  ctx.lineTo(px + pw, bottom - 10);
  const teeth = 28;
  const tw = pw / teeth;
  for (let i = teeth; i > 0; i--) {
    ctx.lineTo(px + (i - 0.5) * tw, bottom);
    ctx.lineTo(px + (i - 1) * tw, bottom - 10);
  }
  ctx.lineTo(px, top + 18);
  ctx.arcTo(px, top, px + 18, top, 18);
  ctx.closePath();
  ctx.fillStyle = C.paper;
  ctx.fill();
  ctx.restore();

  /* Header band in the app's navy. */
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(px + 18, top);
  ctx.lineTo(px + pw - 18, top);
  ctx.arcTo(px + pw, top, px + pw, top + 18, 18);
  ctx.lineTo(px + pw, top + headerH);
  ctx.lineTo(px, top + headerH);
  ctx.lineTo(px, top + 18);
  ctx.arcTo(px, top, px + 18, top, 18);
  ctx.closePath();
  const g = ctx.createLinearGradient(px, top, px + pw, top + headerH);
  g.addColorStop(0, C.navy);
  g.addColorStop(1, C.navyDeep);
  ctx.fillStyle = g;
  ctx.fill();
  ctx.clip();
  /* A faint ring pattern behind the text, like a printed voucher's guilloche. */
  ctx.strokeStyle = "rgba(255,255,255,.08)";
  ctx.lineWidth = 1.5;
  for (let r = 40; r < 320; r += 16) {
    ctx.beginPath();
    ctx.arc(px + pw - 40, top + headerH / 2, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  const logoSize = 104;
  const lx = px + PAD - 8;
  const ly = top + (headerH - logoSize) / 2;
  ctx.beginPath();
  ctx.arc(lx + logoSize / 2, ly + logoSize / 2, logoSize / 2 + 4, 0, Math.PI * 2);
  ctx.fillStyle = "#FFFFFF";
  ctx.fill();
  if (logo) ctx.drawImage(logo, lx, ly, logoSize, logoSize);

  const tx = lx + logoSize + 22;
  const rightX = px + pw - PAD;
  ctx.fillStyle = "#FFFFFF";
  ctx.font = f(700, 25);
  ctx.fillText(fit(ctx, d.school, rightX - tx - 150), tx, top + 76);
  ctx.fillStyle = "rgba(255,255,255,.85)";
  ctx.font = f(500, 15);
  ctx.fillText(fit(ctx, d.title, rightX - tx), tx, top + 102);

  /* Details, two to a row. */
  let y = top + headerH + 28;
  const colW = (pw - PAD * 2) / 2;
  d.details.forEach((line, i) => {
    const cx = px + PAD + (i % 2) * colW;
    const cy = y + Math.floor(i / 2) * 62;
    ctx.fillStyle = C.faint;
    ctx.font = f(700, 11);
    ctx.fillText(line.label.toUpperCase(), cx, cy + 14);
    ctx.fillStyle = C.ink;
    ctx.font = f(600, 16);
    ctx.fillText(fit(ctx, line.value, colW - 20), cx, cy + 38);
  });
  y += detailsH;

  /* The status stamp, tilted over the details like an office's rubber stamp. */
  ctx.save();
  const stamp = STAMP[d.statusTone];
  ctx.translate(px + pw - PAD - 70, top + headerH + 70);
  ctx.rotate(-0.2);
  ctx.globalAlpha = 0.85;
  ctx.font = f(800, 22);
  const sw = ctx.measureText(d.status.toUpperCase()).width + 36;
  ctx.strokeStyle = stamp;
  ctx.lineWidth = 3;
  roundRect(ctx, -sw / 2, -22, sw, 44, 8);
  ctx.stroke();
  ctx.lineWidth = 1.2;
  roundRect(ctx, -sw / 2 + 5, -17, sw - 10, 34, 5);
  ctx.stroke();
  ctx.fillStyle = stamp;
  ctx.textAlign = "center";
  ctx.fillText(d.status.toUpperCase(), 0, 8);
  ctx.restore();

  /* Dashed tear line with notches either side. */
  y += 4;
  ctx.setLineDash([6, 6]);
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(px + 20, y);
  ctx.lineTo(px + pw - 20, y);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = C.page;
  for (const nx of [px, px + pw]) {
    ctx.beginPath();
    ctx.arc(nx, y, 12, 0, Math.PI * 2);
    ctx.fill();
  }
  y += 20;

  /* Item table. */
  const tl = px + PAD;
  const tr = px + pw - PAD;
  ctx.fillStyle = C.band;
  roundRect(ctx, tl - 12, y, tr - tl + 24, 36, 8);
  ctx.fill();
  ctx.fillStyle = C.muted;
  ctx.font = f(700, 11);
  ctx.fillText(d.itemHeader.toUpperCase(), tl, y + 23);
  ctx.textAlign = "right";
  ctx.fillText(d.amountHeader.toUpperCase(), tr, y + 23);
  ctx.textAlign = "left";
  y += 44;

  ctx.fillStyle = C.ink;
  ctx.font = f(600, 17);
  ctx.textAlign = "right";
  ctx.fillText(d.itemAmount, tr, y + 26);
  const amountW = ctx.measureText(d.itemAmount).width;
  ctx.textAlign = "left";
  ctx.fillText(fit(ctx, d.item, tr - tl - amountW - 24), tl, y + 26);
  ctx.fillStyle = C.muted;
  ctx.font = f(500, 13);
  ctx.fillText(fit(ctx, d.itemSub, tr - tl - amountW - 24), tl, y + 50);
  y += 78;

  for (const a of d.adjustments) {
    ctx.fillStyle = C.muted;
    ctx.font = f(500, 14);
    ctx.fillText(a.label, tl, y + 18);
    ctx.textAlign = "right";
    ctx.fillStyle = C.ink;
    ctx.font = f(600, 14);
    ctx.fillText(a.value, tr, y + 18);
    ctx.textAlign = "left";
    y += 34;
  }
  y += 16;

  /* Total. */
  ctx.strokeStyle = C.ink;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(tl, y);
  ctx.lineTo(tr, y);
  ctx.stroke();
  ctx.fillStyle = C.ink;
  ctx.font = f(700, 14);
  ctx.fillText(d.totalLabel.toUpperCase(), tl, y + 48);
  ctx.textAlign = "right";
  ctx.fillStyle = C.navyDeep;
  ctx.font = f(800, 32);
  ctx.fillText(d.total, tr, y + 52);
  ctx.textAlign = "left";
  y += totalH;

  /* Footer. */
  ctx.strokeStyle = C.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(tl, y);
  ctx.lineTo(tr, y);
  ctx.stroke();
  ctx.textAlign = "center";
  ctx.fillStyle = C.ink;
  ctx.font = f(600, 15);
  ctx.fillText(d.thanks, px + pw / 2, y + 40);
  ctx.fillStyle = C.faint;
  ctx.font = f(500, 12);
  ctx.fillText(d.footnote, px + pw / 2, y + 64);
  ctx.textAlign = "left";

  return canvas;
}

/** The school badge, loaded once. Null if it cannot load — the receipt still draws. */
export function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}
