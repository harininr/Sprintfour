import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fs from 'fs';

async function run() {
  const doc = await PDFDocument.create();
  const page = doc.addPage();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  
  const text = "This is a long text that needs to be wrapped. ".repeat(20);
  const words = text.split(' ');
  
  let x = 50;
  let y = page.getHeight() - 50;
  const maxWidth = page.getWidth() - 100;
  const size = 12;
  
  for (const word of words) {
    const w = font.widthOfTextAtSize(word + ' ', size);
    if (x + w > maxWidth) {
      x = 50;
      y -= 15;
    }
    page.drawText(word + ' ', { x, y, size, font });
    x += w;
  }
  
  const bytes = await doc.save();
  fs.writeFileSync('wrapped.pdf', bytes);
}
run();
