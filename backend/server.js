// backend/server.js
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const cors = require('cors');
const shortid = require('shortid');
const Database = require('better-sqlite3');

// SQLite setup - No password needed!
const db = new Database('invoices.db');

function initDB() {
  try {
    db.exec(`
      CREATE TABLE IF NOT EXISTS invoices (
        id TEXT PRIMARY KEY,
        created_at TEXT NOT NULL,
        seller TEXT NOT NULL,
        client TEXT NOT NULL,
        items TEXT NOT NULL,
        tax_percent REAL DEFAULT 0,
        discount REAL DEFAULT 0,
        notes TEXT,
        subtotal REAL NOT NULL,
        tax REAL NOT NULL,
        total REAL NOT NULL
      )
    `);

    db.exec(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        barcode TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        unit_price REAL NOT NULL,
        weight TEXT,
        category TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('SQLite Database initialized successfully - No password needed!');
  } catch (err) {
    console.error('Database initialization error:', err);
  }
}
initDB();

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '5mb' }));

// Helper: calculate totals
function calculateTotals(items, taxPercent = 0, discount = 0) {
  const subtotal = items.reduce((s, it) => s + Number(it.quantity) * Number(it.unitPrice), 0);
  const tax = (subtotal * (Number(taxPercent) || 0)) / 100;
  const total = subtotal + tax - (Number(discount) || 0);
  return { subtotal, tax, total };
}

// POST /api/invoices -> create invoice (store metadata) and return invoice id + PDF stream link
app.post('/api/invoices', async (req, res) => {
  // expected body: { seller, client, items: [{desc, quantity, unitPrice}], taxPercent, discount, notes }
  const payload = req.body;
  const id = shortid.generate();
  const createdAt = new Date().toISOString();

  // calculate totals:
  const { subtotal, tax, total } = calculateTotals(payload.items || [], payload.taxPercent, payload.discount);

  const invoice = {
    id,
    createdAt,
    seller: payload.seller || {},
    client: payload.client || {},
    items: payload.items || [],
    taxPercent: payload.taxPercent || 0,
    discount: payload.discount || 0,
    notes: payload.notes || '',
    subtotal,
    tax,
    total
  };

  // save to db
  const stmt = db.prepare(`
    INSERT INTO invoices (id, created_at, seller, client, items, tax_percent, discount, notes, subtotal, tax, total)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    invoice.id,
    invoice.createdAt,
    JSON.stringify(invoice.seller),
    JSON.stringify(invoice.client),
    JSON.stringify(invoice.items),
    invoice.taxPercent,
    invoice.discount,
    invoice.notes,
    invoice.subtotal,
    invoice.tax,
    invoice.total
  );

  // generate PDF to file
  const pdfPath = `invoice_${id}.pdf`;
  await new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' });
    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    const primaryColor = '#1e40af';
    const borderColor = '#9ca3af';
    const lightBg = '#f9fafb';

    // Header with blue background
    doc.rect(0, 0, 595, 100).fill(primaryColor);

    // Company info
    doc.fillColor('#ffffff').fontSize(22).font('Helvetica-Bold')
      .text(invoice.seller.name || 'Company Name', 40, 28);

    doc.fontSize(9).font('Helvetica');
    let headerY = 56;
    if (invoice.seller.address) {
      doc.text(invoice.seller.address, 40, headerY);
      headerY += 14;
    }
    if (invoice.seller.email) {
      doc.text(invoice.seller.email, 40, headerY);
    }

    // Invoice title and info
    doc.fontSize(26).font('Helvetica-Bold')
      .text('INVOICE', 400, 28, { width: 155, align: 'right' });

    doc.fontSize(9).font('Helvetica')
      .text(`Invoice #: ${invoice.id}`, 400, 60, { width: 155, align: 'right' })
      .text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 400, 74, { width: 155, align: 'right' });

    // Bill To section
    let yPos = 125;
    doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold')
      .text('BILL TO:', 40, yPos);

    yPos += 18;
    doc.fillColor('#000000').fontSize(10).font('Helvetica')
      .text(invoice.client.name || 'Client Name', 40, yPos);

    if (invoice.client.address) {
      yPos += 14;
      doc.text(invoice.client.address, 40, yPos);
    }
    if (invoice.client.email) {
      yPos += 14;
      doc.text(invoice.client.email, 40, yPos);
    }

    // Items table
    yPos += 35;
    const tableTop = yPos;
    const startX = 40;
    const descWidth = 280;
    const qtyWidth = 60;
    const priceWidth = 95;
    const amountWidth = 80;
    const tableWidth = descWidth + qtyWidth + priceWidth + amountWidth;
    const rowHeight = 26;

    // Table header
    doc.rect(startX, tableTop, tableWidth, rowHeight).fillAndStroke(primaryColor, primaryColor);

    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold');
    doc.text('DESCRIPTION', startX + 8, tableTop + 8, { width: descWidth - 16, align: 'left', lineBreak: false });
    doc.text('QTY', startX + descWidth + 8, tableTop + 8, { width: qtyWidth - 16, align: 'center', lineBreak: false });
    doc.text('UNIT PRICE', startX + descWidth + qtyWidth + 8, tableTop + 8, { width: priceWidth - 16, align: 'right', lineBreak: false });
    doc.text('AMOUNT', startX + descWidth + qtyWidth + priceWidth + 8, tableTop + 8, { width: amountWidth - 16, align: 'right', lineBreak: false });

    // Table rows
    let currentY = tableTop + rowHeight;
    doc.font('Helvetica').fontSize(9);

    invoice.items.forEach((it, index) => {
      const amount = Number(it.quantity) * Number(it.unitPrice);

      // Row background
      const rowColor = index % 2 === 0 ? lightBg : '#ffffff';
      doc.rect(startX, currentY, tableWidth, rowHeight).fillAndStroke(rowColor, rowColor);

      doc.fillColor('#000000');

      // Save Y position to prevent text from moving cursor
      const textY = currentY + 8;

      doc.text(it.description, startX + 8, textY, { width: descWidth - 16, align: 'left', lineBreak: false });
      doc.text(it.quantity.toString(), startX + descWidth + 8, textY, { width: qtyWidth - 16, align: 'center', lineBreak: false });
      doc.text(`$${Number(it.unitPrice).toFixed(2)}`, startX + descWidth + qtyWidth + 8, textY, { width: priceWidth - 16, align: 'right', lineBreak: false });
      doc.text(`$${amount.toFixed(2)}`, startX + descWidth + qtyWidth + priceWidth + 8, textY, { width: amountWidth - 16, align: 'right', lineBreak: false });

      currentY += rowHeight;
    });

    // Draw table borders
    doc.strokeColor(borderColor).lineWidth(0.5);

    // Outer border
    const tableHeight = (invoice.items.length + 1) * rowHeight;
    doc.rect(startX, tableTop, tableWidth, tableHeight).stroke();

    // Vertical lines
    doc.moveTo(startX + descWidth, tableTop).lineTo(startX + descWidth, tableTop + tableHeight).stroke();
    doc.moveTo(startX + descWidth + qtyWidth, tableTop).lineTo(startX + descWidth + qtyWidth, tableTop + tableHeight).stroke();
    doc.moveTo(startX + descWidth + qtyWidth + priceWidth, tableTop).lineTo(startX + descWidth + qtyWidth + priceWidth, tableTop + tableHeight).stroke();

    // Horizontal lines
    let lineY = tableTop + rowHeight;
    for (let i = 0; i < invoice.items.length; i++) {
      doc.moveTo(startX, lineY).lineTo(startX + tableWidth, lineY).stroke();
      lineY += rowHeight;
    }

    // Summary section
    yPos = currentY + 25;
    const summaryX = 360;

    doc.fillColor('#000000').fontSize(10).font('Helvetica');

    // Subtotal
    doc.text('Subtotal:', summaryX, yPos);
    doc.text(`$${invoice.subtotal.toFixed(2)}`, summaryX + 100, yPos, { width: 95, align: 'right' });
    yPos += 18;

    // Tax
    doc.text(`Tax (${invoice.taxPercent}%):`, summaryX, yPos);
    doc.text(`$${invoice.tax.toFixed(2)}`, summaryX + 100, yPos, { width: 95, align: 'right' });
    yPos += 18;

    // Discount
    if (invoice.discount && Number(invoice.discount) > 0) {
      doc.text('Discount:', summaryX, yPos);
      doc.text(`-$${Number(invoice.discount).toFixed(2)}`, summaryX + 100, yPos, { width: 95, align: 'right' });
      yPos += 18;
    }

    // Total with background
    doc.rect(summaryX - 5, yPos - 3, 200, 26).fillAndStroke(primaryColor, primaryColor);
    doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold');
    doc.text('TOTAL:', summaryX, yPos + 3);
    doc.text(`$${invoice.total.toFixed(2)}`, summaryX + 100, yPos + 3, { width: 95, align: 'right' });

    // Notes section
    yPos += 45;
    if (invoice.notes) {
      doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold')
        .text('Notes:', 40, yPos);

      yPos += 18;
      doc.fillColor('#000000').fontSize(9).font('Helvetica')
        .text(invoice.notes, 40, yPos, { width: 515 });
    }

    // Footer
    doc.fillColor('#6b7280').fontSize(9).font('Helvetica')
      .text('Thank you for your business!', 40, 750, { width: 515, align: 'center' });

    doc.end();
    stream.on('finish', resolve);
    stream.on('error', reject);
  });

  res.json({ success: true, id, pdfPath: `/api/invoices/${id}/pdf` });
});

// GET /api/invoices -> list invoice metadata
app.get('/api/invoices', (req, res) => {
  try {
    const stmt = db.prepare('SELECT * FROM invoices ORDER BY created_at DESC');
    const rows = stmt.all();
    const invoices = rows.map(row => ({
      id: row.id,
      createdAt: row.created_at,
      seller: JSON.parse(row.seller),
      client: JSON.parse(row.client),
      items: JSON.parse(row.items),
      taxPercent: parseFloat(row.tax_percent),
      discount: parseFloat(row.discount),
      notes: row.notes,
      subtotal: parseFloat(row.subtotal),
      tax: parseFloat(row.tax),
      total: parseFloat(row.total)
    }));
    res.json(invoices);
  } catch (err) {
    console.error('Error fetching invoices:', err);
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// GET /api/invoices/:id/pdf -> send PDF file
app.get('/api/invoices/:id/pdf', async (req, res) => {
  const id = req.params.id;
  const pdfPath = `invoice_${id}.pdf`;
  if (fs.existsSync(pdfPath)) {
    res.setHeader('Content-Disposition', `attachment; filename=invoice_${id}.pdf`);
    res.setHeader('Content-Type', 'application/pdf');
    fs.createReadStream(pdfPath).pipe(res);
  } else {
    res.status(404).json({ error: 'PDF not found' });
  }
});

// start server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Invoice backend running on http://localhost:${PORT}`);
});
