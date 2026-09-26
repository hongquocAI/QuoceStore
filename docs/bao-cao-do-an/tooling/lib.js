// Script noi bo (KHONG phai code san pham) de sinh bao cao do an QuoceStore
// dang .docx. Doc file nay + cac file content/*.js de biet toan bo noi dung.
const fs = require('fs');
const path = require('path');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  TableOfContents, SequentialIdentifier, PageBreak, ImageRun,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  Header, Footer, PageNumber, VerticalAlign, LevelFormat, convertInchesToTwip,
} = require('docx');

const DIAGRAMS = path.join(__dirname, '..', 'diagrams');
const SCREENSHOTS = path.join(__dirname, '..', 'screenshots');

const FONT = 'Times New Roman';
const SZ = 26;      // 13pt body
const SZ_SMALL = 20; // 10pt (captions, table text, code)
const SZ_H1 = 34;   // 17pt
const SZ_H2 = 30;   // 15pt
const SZ_H3 = 27;   // 13.5pt -> round to 28
const LINE = 360;   // 1.5 line spacing

function pngDim(relPath) {
  const buf = fs.readFileSync(relPath);
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function fitImage(naturalW, naturalH, maxW = 580, maxH = 860) {
  let w = maxW, h = naturalH * (maxW / naturalW);
  if (h > maxH) { h = maxH; w = naturalW * (maxH / naturalH); }
  return { width: Math.round(w), height: Math.round(h) };
}

// ---------- Helper builders ----------
function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 240, after: 240 },
    children: [new TextRun({ text, bold: true, size: SZ_H1, font: FONT })],
  });
}
function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 160 },
    children: [new TextRun({ text, bold: true, size: SZ_H2, font: FONT })],
  });
}
function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 120 },
    children: [new TextRun({ text, bold: true, size: SZ_H3, font: FONT })],
  });
}
function p(text, opts = {}) {
  return new Paragraph({
    alignment: opts.align || AlignmentType.JUSTIFIED,
    spacing: { line: LINE, lineRule: 'auto', after: opts.after ?? 160 },
    indent: opts.indent,
    children: Array.isArray(text)
      ? text
      : [new TextRun({ text, font: FONT, size: SZ, bold: opts.bold, italics: opts.italics })],
  });
}
function run(text, opts = {}) {
  return new TextRun({ text, font: FONT, size: SZ, ...opts });
}
function bullet(text, opts = {}) {
  return new Paragraph({
    numbering: { reference: 'bullet-list', level: opts.level || 0 },
    spacing: { line: LINE, lineRule: 'auto', after: 80 },
    children: Array.isArray(text) ? text : [run(text)],
  });
}
function numbered(text, opts = {}) {
  return new Paragraph({
    numbering: { reference: 'decimal-list', level: opts.level || 0 },
    spacing: { line: LINE, lineRule: 'auto', after: 80 },
    children: Array.isArray(text) ? text : [run(text)],
  });
}
function figure(dir, filename, caption, opts = {}) {
  const full = path.join(dir, filename);
  const { w, h } = pngDim(full);
  const { width, height } = fitImage(w, h, opts.maxW, opts.maxH);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 200, after: 60 },
      children: [
        new ImageRun({
          type: 'png',
          data: fs.readFileSync(full),
          transformation: { width, height },
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 220 },
      children: [
        new TextRun({ text: 'Hình ', bold: true, italics: true, size: SZ_SMALL, font: FONT }),
        new SequentialIdentifier('Hinh'),
        new TextRun({ text: `. ${caption}`, italics: true, size: SZ_SMALL, font: FONT }),
      ],
    }),
  ];
}
function tableCaption(text) {
  return new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 160, after: 60 },
    children: [
      new TextRun({ text: 'Bảng ', bold: true, italics: true, size: SZ_SMALL, font: FONT }),
      new SequentialIdentifier('Bang'),
      new TextRun({ text: `. ${text}`, italics: true, size: SZ_SMALL, font: FONT }),
    ],
  });
}
function cell(text, opts = {}) {
  return new TableCell({
    width: opts.width ? { size: opts.width, type: WidthType.DXA } : undefined,
    verticalAlign: VerticalAlign.CENTER,
    shading: opts.header ? { type: ShadingType.CLEAR, fill: 'D9D9D9' } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [
      new Paragraph({
        alignment: opts.align || AlignmentType.LEFT,
        children: [new TextRun({ text: String(text), font: FONT, size: SZ_SMALL, bold: !!opts.header })],
      }),
    ],
  });
}
function dataTable(headers, rows, colWidths) {
  const total = colWidths.reduce((a, b) => a + b, 0);
  return new Table({
    width: { size: total, type: WidthType.DXA },
    columnWidths: colWidths,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: '999999' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: '999999' },
      left: { style: BorderStyle.SINGLE, size: 4, color: '999999' },
      right: { style: BorderStyle.SINGLE, size: 4, color: '999999' },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
      insideVertical: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
    },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map((htext, i) => cell(htext, { header: true, width: colWidths[i], align: AlignmentType.CENTER })),
      }),
      ...rows.map((r) => new TableRow({ children: r.map((c, i) => cell(c, { width: colWidths[i] })) })),
    ],
  });
}
function codeBlock(code) {
  const lines = code.replace(/\t/g, '  ').split('\n');
  return new Table({
    width: { size: 9350, type: WidthType.DXA },
    columnWidths: [9350],
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' },
      left: { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' },
      right: { style: BorderStyle.SINGLE, size: 4, color: 'BFBFBF' },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 9350, type: WidthType.DXA },
            shading: { type: ShadingType.CLEAR, fill: 'F2F2F2' },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: lines.map((line) => new Paragraph({
              spacing: { after: 0, line: 260, lineRule: 'auto' },
              children: [new TextRun({ text: line.length ? line : ' ', font: 'Consolas', size: 18 })],
            })),
          }),
        ],
      }),
    ],
  });
}
function codeCaption(text) {
  return new Paragraph({
    spacing: { before: 80, after: 220 },
    children: [new TextRun({ text, italics: true, size: SZ_SMALL, font: FONT })],
  });
}

module.exports = {
  DIAGRAMS, SCREENSHOTS, FONT, SZ, SZ_SMALL, SZ_H1, SZ_H2, SZ_H3, LINE,
  h1, h2, h3, p, run, bullet, numbered, figure, tableCaption, dataTable, cell,
  codeBlock, codeCaption,
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  TableOfContents, SequentialIdentifier, PageBreak, ImageRun,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  Header, Footer, PageNumber, VerticalAlign, LevelFormat, convertInchesToTwip,
};
