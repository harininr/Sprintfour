const PDFDocument = require('pdfkit');
const fs = require('fs');

const doc = new PDFDocument();
doc.pipe(fs.createWriteStream('test.pdf'));
doc.text('This is a test of ', { continued: true });
const x = doc.x;
const y = doc.y;
const width = doc.widthOfString('redacted');
const height = doc.currentLineHeight();
doc.rect(x, y, width, height).fill('black');
doc.text('redacted', { continued: true });
doc.fillColor('black').text(' text.');
doc.end();
