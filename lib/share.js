// Zaura Share Card — renders the cosmic signature to a shareable 1080x1350 PNG

export async function generateShareCard({ profile, summary }) {
  const W = 1080, H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  // background
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#0d0a2e');
  grad.addColorStop(0.5, '#070616');
  grad.addColorStop(1, '#160b2e');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  // nebula glows
  const glow = (x, y, r, color) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  glow(200, 250, 400, 'rgba(120,70,220,0.18)');
  glow(900, 500, 450, 'rgba(220,80,180,0.10)');
  glow(540, 1150, 500, 'rgba(240,190,110,0.08)');

  // stars
  for (let i = 0; i < 120; i++) {
    const x = (i * 337) % W, y = (i * 521) % H;
    ctx.fillStyle = `rgba(255,255,255,${0.15 + ((i * 17) % 50) / 100})`;
    ctx.beginPath();
    ctx.arc(x, y, i % 9 === 0 ? 2.2 : 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  const center = W / 2;
  ctx.textAlign = 'center';

  // header
  ctx.fillStyle = 'rgba(190,170,255,0.85)';
  ctx.font = '600 34px Georgia, serif';
  ctx.fillText('Z   A   U   R   A', center, 110);
  ctx.strokeStyle = 'rgba(140,110,220,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(center - 160, 138); ctx.lineTo(center + 160, 138); ctx.stroke();

  // sun glyph in ring
  ctx.strokeStyle = 'rgba(240,200,130,0.7)';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(center, 300, 95, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = 'rgba(167,139,250,0.35)';
  ctx.beginPath(); ctx.arc(center, 300, 112, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = '#f4dfae';
  ctx.font = '110px serif';
  ctx.fillText(summary.sunGlyph, center, 340);

  // name
  ctx.fillStyle = '#f0d9a8';
  ctx.font = 'italic 600 74px Georgia, serif';
  ctx.fillText(profile.fullName, center, 520);

  ctx.fillStyle = 'rgba(210,200,240,0.75)';
  ctx.font = '32px Georgia, serif';
  ctx.fillText(summary.headlines.western || '', center, 575);

  // signature rows
  const rows = [
    ['\u2600\ufe0f', summary.headlines.western],
    ['\ud83c\udf19', summary.headlines.moonPhase],
    ['\ud83d\udd22', summary.headlines.lifePath],
    ['\ud83c\udfee', summary.headlines.chinese],
    ['\u2699\ufe0f', summary.headlines.humanDesign],
    ['\ud83c\udccf', summary.headlines.tarot],
    ['\ud83e\udd85', summary.headlines.spiritAnimal],
  ].filter(([, t]) => t);

  const boxTop = 640, boxH = rows.length * 62 + 60;
  ctx.fillStyle = 'rgba(255,255,255,0.045)';
  ctx.strokeStyle = 'rgba(167,139,250,0.25)';
  ctx.lineWidth = 1.5;
  const r = 28, bx = 90, bw = W - 180;
  ctx.beginPath();
  ctx.moveTo(bx + r, boxTop);
  ctx.arcTo(bx + bw, boxTop, bx + bw, boxTop + boxH, r);
  ctx.arcTo(bx + bw, boxTop + boxH, bx, boxTop + boxH, r);
  ctx.arcTo(bx, boxTop + boxH, bx, boxTop, r);
  ctx.arcTo(bx, boxTop, bx + bw, boxTop, r);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  ctx.fillStyle = 'rgba(190,170,255,0.5)';
  ctx.font = '22px Georgia, serif';
  ctx.fillText('C O S M I C   S I G N A T U R E', center, boxTop + 48);

  rows.forEach(([icon, text], i) => {
    const y = boxTop + 105 + i * 62;
    ctx.font = '30px serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.fillText(icon, bx + 45, y);
    ctx.fillStyle = 'rgba(232,226,250,0.88)';
    ctx.font = '30px Georgia, serif';
    ctx.fillText(text, bx + 105, y);
    ctx.textAlign = 'center';
  });

  // trait quote
  ctx.fillStyle = 'rgba(240,210,150,0.75)';
  ctx.font = 'italic 27px Georgia, serif';
  const trait = `\u201C${summary.trait}\u201D`;
  // simple wrap
  const words = trait.split(' ');
  let line = '', lines = [];
  words.forEach((w) => {
    if (ctx.measureText(line + ' ' + w).width > W - 260) { lines.push(line.trim()); line = w; }
    else line += ' ' + w;
  });
  lines.push(line.trim());
  lines.forEach((l, i) => ctx.fillText(l, center, boxTop + boxH + 60 + i * 38));

  // footer
  ctx.fillStyle = 'rgba(170,155,215,0.5)';
  ctx.font = '24px Georgia, serif';
  ctx.fillText('\u2728 my cosmic self, revealed by Zaura \u2728', center, H - 60);

  const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
  const fileName = `Zaura-Cosmic-Card-${profile.fullName.split(' ')[0]}.png`;

  // try native share, fall back to download
  try {
    const file = new File([blob], fileName, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'My Zaura Cosmic Card' });
      return 'shared';
    }
  } catch (e) {
    if (e?.name === 'AbortError') return 'cancelled';
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = fileName;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return 'downloaded';
}

// ---------- Bond share card (1080x1350 PNG for couples) ----------
export async function generateBondShareCard({ report }) {
  const W = 1080, H = 1350;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d');

  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, '#160b2e');
  grad.addColorStop(0.5, '#070616');
  grad.addColorStop(1, '#2a0b26');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const glow = (x, y, r, color) => {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, color);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
  };
  glow(240, 300, 420, 'rgba(220,80,160,0.16)');
  glow(860, 260, 400, 'rgba(120,70,220,0.16)');
  glow(540, 1100, 520, 'rgba(240,190,110,0.07)');

  for (let i = 0; i < 110; i++) {
    const x = (i * 353) % W, y = (i * 487) % H;
    ctx.fillStyle = `rgba(255,255,255,${0.12 + ((i * 19) % 50) / 100})`;
    ctx.beginPath();
    ctx.arc(x, y, i % 8 === 0 ? 2.2 : 1.1, 0, Math.PI * 2);
    ctx.fill();
  }

  const center = W / 2;
  ctx.textAlign = 'center';

  ctx.fillStyle = 'rgba(190,170,255,0.85)';
  ctx.font = '600 32px Georgia, serif';
  ctx.fillText('Z   A   U   R   A', center, 100);
  ctx.fillStyle = 'rgba(170,155,215,0.55)';
  ctx.font = '22px Georgia, serif';
  ctx.fillText('C O M P A T I B I L I T Y   R E A D I N G', center, 140);
  ctx.strokeStyle = 'rgba(140,110,220,0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(center - 180, 164); ctx.lineTo(center + 180, 164); ctx.stroke();

  // two glyphs + names
  ctx.font = '92px serif';
  ctx.fillStyle = '#f4dfae';
  ctx.fillText(report.glyphA, 250, 330);
  ctx.fillText(report.glyphB, 830, 330);
  ctx.fillStyle = '#f0d9a8';
  ctx.font = 'italic 600 46px Georgia, serif';
  ctx.fillText(report.nameA, 250, 400);
  ctx.fillText(report.nameB, 830, 400);
  ctx.fillStyle = 'rgba(210,200,240,0.65)';
  ctx.font = '26px Georgia, serif';
  ctx.fillText(report.sunA, 250, 438);
  ctx.fillText(report.sunB, 830, 438);

  // heart between
  ctx.font = '54px serif';
  ctx.fillText('\uD83D\uDC9E', center, 360);

  // score ring
  const cy = 610, r = 105;
  ctx.strokeStyle = 'rgba(255,255,255,0.10)';
  ctx.lineWidth = 14;
  ctx.beginPath(); ctx.arc(center, cy, r, 0, Math.PI * 2); ctx.stroke();
  const ringGrad = ctx.createLinearGradient(center - r, cy - r, center + r, cy + r);
  ringGrad.addColorStop(0, '#a78bfa');
  ringGrad.addColorStop(1, '#f0d296');
  ctx.strokeStyle = ringGrad;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(center, cy, r, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * report.overall) / 100);
  ctx.stroke();
  ctx.fillStyle = '#f7e8c3';
  ctx.font = '600 84px Georgia, serif';
  ctx.fillText(String(report.overall), center, cy + 26);
  ctx.fillStyle = 'rgba(190,170,255,0.5)';
  ctx.font = '20px Georgia, serif';
  ctx.fillText('OF 100', center, cy + 60);

  // verdict
  ctx.fillStyle = '#e3b8f5';
  ctx.font = 'italic 600 52px Georgia, serif';
  ctx.fillText(report.verdict, center, 790);

  // aspects panel
  const boxTop = 840, rowH = 56, boxH = report.aspects.length * rowH + 55;
  ctx.fillStyle = 'rgba(255,255,255,0.045)';
  ctx.strokeStyle = 'rgba(220,120,200,0.22)';
  ctx.lineWidth = 1.5;
  const bx = 90, bw = W - 180, br = 28;
  ctx.beginPath();
  ctx.moveTo(bx + br, boxTop);
  ctx.arcTo(bx + bw, boxTop, bx + bw, boxTop + boxH, br);
  ctx.arcTo(bx + bw, boxTop + boxH, bx, boxTop + boxH, br);
  ctx.arcTo(bx, boxTop + boxH, bx, boxTop, br);
  ctx.arcTo(bx, boxTop, bx + bw, boxTop, br);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  report.aspects.forEach((a, i) => {
    const y = boxTop + 55 + i * rowH;
    ctx.textAlign = 'left';
    ctx.font = '28px serif';
    ctx.fillStyle = '#fff';
    ctx.fillText(a.icon, bx + 40, y);
    ctx.fillStyle = 'rgba(232,226,250,0.85)';
    ctx.font = '27px Georgia, serif';
    ctx.fillText(a.name, bx + 95, y);
    // mini bar
    const barX = bx + bw - 300, barW = 200;
    ctx.fillStyle = 'rgba(255,255,255,0.08)';
    ctx.fillRect(barX, y - 16, barW, 12);
    const bg = ctx.createLinearGradient(barX, 0, barX + barW, 0);
    bg.addColorStop(0, '#a78bfa'); bg.addColorStop(1, '#f0d296');
    ctx.fillStyle = bg;
    ctx.fillRect(barX, y - 16, barW * (a.score / 100), 12);
    ctx.fillStyle = '#f7e8c3';
    ctx.font = '600 26px Georgia, serif';
    ctx.fillText(String(a.score), barX + barW + 22, y);
    ctx.textAlign = 'center';
  });

  ctx.fillStyle = 'rgba(170,155,215,0.5)';
  ctx.font = '23px Georgia, serif';
  ctx.fillText('\u2728 our bond, read by Zaura \u2728', center, H - 55);

  const blob = await new Promise((res) => canvas.toBlob(res, 'image/png'));
  const fileName = `Zaura-Bond-${report.nameA}-and-${report.nameB}.png`;
  try {
    const file = new File([blob], fileName, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({ files: [file], title: 'Our Zaura Bond' });
      return 'shared';
    }
  } catch (e) {
    if (e?.name === 'AbortError') return 'cancelled';
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = fileName;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return 'downloaded';
}

// downscale an image File to max dimension, return raw base64 (no data: prefix)
export async function fileToBase64(file, maxDim = 1024) {
  const dataUrl = await new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result);
    r.onerror = rej;
    r.readAsDataURL(file);
  });
  const img = await new Promise((res, rej) => {
    const i = new Image();
    i.onload = () => res(i);
    i.onerror = rej;
    i.src = dataUrl;
  });
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.82).replace(/^data:image\/\w+;base64,/, '');
}
