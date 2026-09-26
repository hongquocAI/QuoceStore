// Script chinh: lap rap toan bo bao cao thanh 1 file .docx hoan chinh.
// Chay: node build-report.js
const fs = require('fs');
const path = require('path');
const L = require('./lib');
const {
  Document, Packer, Paragraph, TextRun, AlignmentType,
  Header, Footer, PageNumber, LevelFormat,
} = L;

const { coverPage, acknowledgement, tocPages, abbreviations } = require('./content/front-matter');
const { chapter1 } = require('./content/ch1');
const { chapter2 } = require('./content/ch2');
const { chapter3 } = require('./content/ch3');
const { chapter4 } = require('./content/ch4');
const { chapter5 } = require('./content/ch5');
const { chapter6 } = require('./content/ch6');
const { references, appendixA } = require('./content/appendix');

const CM = 566.929; // 1cm in twips

const footerDefault = new Footer({
  children: [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ children: [PageNumber.CURRENT], font: L.FONT, size: 22 })],
    }),
  ],
});
const footerFirst = new Footer({ children: [new Paragraph({ children: [] })] });

const doc = new Document({
  numbering: {
    config: [
      {
        reference: 'bullet-list',
        levels: [
          {
            level: 0,
            format: LevelFormat.BULLET,
            text: '•',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
      {
        reference: 'decimal-list',
        levels: [
          {
            level: 0,
            format: LevelFormat.DECIMAL,
            text: '%1.',
            alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } },
          },
        ],
      },
    ],
  },
  styles: {
    default: {
      document: {
        run: { font: L.FONT, size: L.SZ },
        paragraph: { spacing: { line: L.LINE, lineRule: 'auto' } },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 11906, height: 16838 }, // A4
          margin: {
            top: Math.round(2 * CM),
            bottom: Math.round(2 * CM),
            left: Math.round(3 * CM),
            right: Math.round(2 * CM),
            header: Math.round(1 * CM),
            footer: Math.round(1 * CM),
          },
        },
        titlePage: true,
      },
      footers: { default: footerDefault, first: footerFirst },
      children: [
        ...coverPage(),
        ...acknowledgement(),
        ...tocPages(),
        ...abbreviations(),
        ...chapter1(),
        ...chapter2(),
        ...chapter3(),
        ...chapter4(),
        ...chapter5(),
        ...chapter6(),
        ...references(),
        ...appendixA(),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  const out = path.join(__dirname, '..', 'QuoceStore_BaoCaoDoAn.docx');
  fs.writeFileSync(out, buf);
  console.log('Da ghi file:', out, `(${(buf.length / 1024).toFixed(0)} KB)`);
});
