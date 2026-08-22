// Zaura Keepsake PDF — dark, elegant, multi-page cosmic profile
// Uses jsPDF standard fonts (Latin-1), so all text is sanitized of emojis/glyphs.

const W = 595.28, H = 841.89, M = 56;
const BG = [13, 10, 36];        // deep midnight
const PANEL = [22, 17, 52];
const LAVENDER = [200, 192, 235];
const DIM = [140, 132, 180];
const AMBER = [240, 210, 150];
const VIOLET = [170, 140, 255];
const LINE = [70, 58, 120];

const clean = (s) =>
  String(s || '')
    .replace(/\u2019|\u2018/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u2014|\u2013/g, '-')
    .replace(/\u00b7/g, '-')
    .replace(/\u2248/g, '~')
    .replace(/[^\x20-\x7E\u00C0-\u00FF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

function paintBg(doc) {
  doc.setFillColor(...BG);
  doc.rect(0, 0, W, H, 'F');
  // subtle star dots
  doc.setFillColor(120, 110, 170);
  for (let i = 0; i < 40; i++) {
    const x = ((i * 137) % (W - 20)) + 10;
    const y = ((i * 211) % (H - 20)) + 10;
    doc.circle(x, y, i % 7 === 0 ? 1.1 : 0.55, 'F');
  }
}

export async function generateKeepsakePdf({ profile, modalities, summary, narrativeText, photoReadings }) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  let y = 0;

  const newPage = () => { doc.addPage(); paintBg(doc); y = M; };
  const ensure = (need) => { if (y + need > H - M) newPage(); };
  const hr = () => { doc.setDrawColor(...LINE); doc.setLineWidth(0.6); doc.line(M, y, W - M, y); y += 14; };

  // ---------- COVER ----------
  paintBg(doc);
  doc.setFont('times', 'normal');
  doc.setTextColor(...VIOLET);
  doc.setFontSize(13);
  doc.text('Z  A  U  R  A', W / 2, 180, { align: 'center' });
  doc.setDrawColor(...LINE); doc.setLineWidth(0.6);
  doc.line(W / 2 - 90, 196, W / 2 + 90, 196);

  doc.setFontSize(34);
  doc.setTextColor(...AMBER);
  doc.setFont('times', 'italic');
  doc.text(clean(profile.fullName), W / 2, 260, { align: 'center' });

  doc.setFont('times', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(...LAVENDER);
  const born = `Born ${new Date(profile.birthDate + 'T12:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}${profile.birthTime ? ' at ' + profile.birthTime : ''}${profile.birthCity ? ' - ' + clean(profile.birthCity) : ''}`;
  doc.text(born, W / 2, 288, { align: 'center' });

  // cosmic signature block
  const sig = [
    summary.headlines.western,
    summary.headlines.moonPhase,
    summary.headlines.lifePath,
    summary.headlines.chinese,
    summary.headlines.humanDesign,
    summary.headlines.tarot,
    summary.headlines.spiritAnimal,
    summary.headlines.soulAge,
  ].filter(Boolean);
  doc.setFillColor(...PANEL);
  const bh = sig.length * 22 + 56;
  doc.roundedRect(M + 40, 340, W - 2 * (M + 40), bh, 10, 10, 'F');
  doc.setFontSize(10);
  doc.setTextColor(...DIM);
  doc.text('C O S M I C   S I G N A T U R E', W / 2, 370, { align: 'center' });
  doc.setFontSize(12);
  doc.setTextColor(...LAVENDER);
  sig.forEach((s, i) => doc.text(clean(s), W / 2, 396 + i * 22, { align: 'center' }));

  doc.setFontSize(9);
  doc.setTextColor(...DIM);
  doc.text('Twenty ancient systems - one sacred moment', W / 2, H - 90, { align: 'center' });
  doc.text(`Woven by Zaura - ${new Date().toLocaleDateString()}`, W / 2, H - 74, { align: 'center' });

  // ---------- SOUL STORY ----------
  if (narrativeText) {
    newPage();
    const lines = narrativeText.split('\n').map((l) => l.trim()).filter(Boolean);
    const title = clean(lines[0].replace(/^[#*\s]+/, '').replace(/[*\s]+$/, ''));
    const paras = lines.slice(1).map((p) => clean(p.replace(/\*\*/g, '')));
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...DIM);
    doc.text('Y O U R   S O U L   S T O R Y', M, y); y += 24;
    doc.setFont('times', 'italic');
    doc.setFontSize(20);
    doc.setTextColor(...AMBER);
    doc.text(title, M, y); y += 26;
    hr();
    doc.setFont('times', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(...LAVENDER);
    paras.forEach((p) => {
      const wrapped = doc.splitTextToSize(p, W - 2 * M);
      ensure(wrapped.length * 15 + 10);
      doc.text(wrapped, M, y, { lineHeightFactor: 1.42 });
      y += wrapped.length * 15 + 12;
    });
  }

  // ---------- MODALITIES ----------
  newPage();
  doc.setFont('times', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...DIM);
  doc.text('T H E   T W E N T Y   R E A D I N G S', M, y); y += 26;

  modalities.forEach((m) => {
    ensure(120);
    doc.setFont('times', 'bold');
    doc.setFontSize(15);
    doc.setTextColor(...AMBER);
    doc.text(clean(m.name), M, y);
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...DIM);
    doc.text(clean(m.category).toUpperCase(), W - M, y, { align: 'right' });
    y += 17;
    doc.setFont('times', 'italic');
    doc.setFontSize(11.5);
    doc.setTextColor(...VIOLET);
    doc.text(clean(m.headline), M, y); y += 16;
    doc.setFont('times', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(...LAVENDER);
    const sw = doc.splitTextToSize(clean(m.summary), W - 2 * M);
    ensure(sw.length * 13 + 8);
    doc.text(sw, M, y, { lineHeightFactor: 1.35 });
    y += sw.length * 13 + 8;

    m.sections.forEach((s) => {
      const label = `${clean(s.label)}:  ${clean(s.value)}`;
      const body = clean(s.text || '');
      const bw = body ? doc.splitTextToSize(body, W - 2 * M - 14) : [];
      ensure(16 + bw.length * 12 + 8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(...AMBER);
      doc.text(label, M + 6, y); y += 13;
      if (bw.length) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.setTextColor(...DIM);
        doc.text(bw, M + 14, y, { lineHeightFactor: 1.35 });
        y += bw.length * 12 + 4;
      }
    });
    y += 10;
    ensure(24);
    hr();
  });

  // ---------- PHYSICAL READINGS (palm / handwriting / face) ----------
  if (photoReadings && photoReadings.length) {
    const NAMES = { palm: 'Palm Reading', handwriting: 'Handwriting Analysis', face: 'Face Reading' };
    newPage();
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...DIM);
    doc.text('T H E   P H Y S I C A L   R E A D I N G S', M, y); y += 26;
    photoReadings.forEach((r) => {
      const lines = (r.text || '').split('\n').map((l) => l.trim()).filter(Boolean);
      const rTitle = clean((lines[0] || '').replace(/^[#*\s]+/, '').replace(/[*\s]+$/, ''));
      const rParas = lines.slice(1).map((p) => clean(p.replace(/\*\*/g, '')));
      ensure(90);
      doc.setFont('times', 'bold');
      doc.setFontSize(15);
      doc.setTextColor(...AMBER);
      doc.text(NAMES[r.type] || clean(r.type), M, y);
      doc.setFont('times', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...DIM);
      doc.text(new Date(r.createdAt).toLocaleDateString(), W - M, y, { align: 'right' });
      y += 18;
      doc.setFont('times', 'italic');
      doc.setFontSize(12);
      doc.setTextColor(...VIOLET);
      doc.text(rTitle, M, y); y += 18;
      doc.setFont('times', 'normal');
      doc.setFontSize(9.5);
      doc.setTextColor(...LAVENDER);
      rParas.forEach((p) => {
        const wrapped = doc.splitTextToSize(p, W - 2 * M - 10);
        ensure(wrapped.length * 13 + 8);
        doc.text(wrapped, M + 5, y, { lineHeightFactor: 1.38 });
        y += wrapped.length * 13 + 8;
      });
      y += 8;
      ensure(24);
      hr();
    });
  }

  // footer page numbers
  const pages = doc.getNumberOfPages();
  for (let i = 2; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont('times', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...DIM);
    doc.text(`${clean(profile.fullName)} - Zaura Cosmic Profile - ${i - 1}`, W / 2, H - 30, { align: 'center' });
  }

  doc.save(`Zaura-Cosmic-Profile-${clean(profile.fullName).split(' ')[0] || 'Soul'}.pdf`);
}

// ---------- Compatibility keepsake ----------
export async function generateCompatibilityPdf({ report, storyText }) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  let y;
  const newPage = () => { doc.addPage(); paintBg(doc); y = M; };
  const ensure = (need) => { if (y + need > H - M) newPage(); };

  paintBg(doc);
  doc.setFont('times', 'normal');
  doc.setTextColor(...VIOLET);
  doc.setFontSize(12);
  doc.text('Z  A  U  R  A', W / 2, 96, { align: 'center' });
  doc.setFontSize(10);
  doc.setTextColor(...DIM);
  doc.text('C O M P A T I B I L I T Y   R E A D I N G', W / 2, 118, { align: 'center' });
  doc.setDrawColor(...LINE); doc.setLineWidth(0.6);
  doc.line(W / 2 - 110, 132, W / 2 + 110, 132);

  doc.setFont('times', 'italic');
  doc.setFontSize(26);
  doc.setTextColor(...AMBER);
  doc.text(`${clean(report.nameA)}  &  ${clean(report.nameB)}`, W / 2, 176, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...LAVENDER);
  doc.text(`${clean(report.sunA)} Sun  -  ${clean(report.sunB)} Sun`, W / 2, 198, { align: 'center' });

  // score circle
  doc.setDrawColor(...VIOLET); doc.setLineWidth(3);
  doc.circle(W / 2, 270, 44, 'S');
  doc.setFont('times', 'bold');
  doc.setFontSize(30);
  doc.setTextColor(...AMBER);
  doc.text(String(report.overall), W / 2, 278, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(...DIM);
  doc.text('OF 100', W / 2, 292, { align: 'center' });

  doc.setFont('times', 'italic');
  doc.setFontSize(19);
  doc.setTextColor(...VIOLET);
  doc.text(clean(report.verdict), W / 2, 348, { align: 'center' });
  doc.setFont('times', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(...LAVENDER);
  const vw = doc.splitTextToSize(clean(report.verdictText), W - 2 * M - 60);
  doc.text(vw, W / 2, 370, { align: 'center', lineHeightFactor: 1.45 });

  y = 370 + vw.length * 15 + 30;
  report.aspects.forEach((a) => {
    const bw = doc.splitTextToSize(clean(a.text), W - 2 * M - 14);
    ensure(52 + bw.length * 12);
    doc.setDrawColor(...LINE); doc.setLineWidth(0.6);
    doc.line(M, y, W - M, y); y += 18;
    doc.setFont('times', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...AMBER);
    doc.text(clean(a.name), M, y);
    doc.text(`${a.score} / 100`, W - M, y, { align: 'right' });
    y += 15;
    doc.setFont('times', 'italic');
    doc.setFontSize(10.5);
    doc.setTextColor(...VIOLET);
    doc.text(clean(a.headline), M, y); y += 15;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...LAVENDER);
    doc.text(bw, M + 6, y, { lineHeightFactor: 1.4 });
    y += bw.length * 12 + 10;
  });

  ensure(40);
  if (storyText) {
    const lines = storyText.split('\n').map((l) => l.trim()).filter(Boolean);
    const sTitle = clean(lines[0].replace(/^[#*\s]+/, '').replace(/[*\s]+$/, ''));
    const sParas = lines.slice(1).map((p) => clean(p.replace(/\*\*/g, '')));
    ensure(120);
    doc.setDrawColor(...LINE); doc.setLineWidth(0.6);
    doc.line(M, y, W - M, y); y += 24;
    doc.setFont('times', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...DIM);
    doc.text('Y O U R   B O N D   S T O R Y', W / 2, y, { align: 'center' }); y += 22;
    doc.setFont('times', 'italic');
    doc.setFontSize(17);
    doc.setTextColor(...AMBER);
    doc.text(sTitle, W / 2, y, { align: 'center' }); y += 24;
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...LAVENDER);
    sParas.forEach((p) => {
      const wrapped = doc.splitTextToSize(p, W - 2 * M - 20);
      ensure(wrapped.length * 14 + 10);
      doc.text(wrapped, M + 10, y, { lineHeightFactor: 1.4 });
      y += wrapped.length * 14 + 10;
    });
    ensure(30);
  }
  doc.setFont('times', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...DIM);
  doc.text(`Woven by Zaura - ${new Date().toLocaleDateString()} - for reflection, not prediction`, W / 2, H - 40, { align: 'center' });

  doc.save(`Zaura-Compatibility-${clean(report.nameA)}-and-${clean(report.nameB)}.pdf`);
}
