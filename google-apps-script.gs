/**
 * Stingers Hockey — Google Apps Script untuk terima pendaftaran ke Google Sheet.
 *
 * SETUP (lihat juga README.md §4):
 *  1. Cipta Google Sheet baharu (contoh nama: "Pendaftaran Stingers 2026").
 *  2. Menu: Extensions → Apps Script.
 *  3. Padam kod sedia ada, paste SEMUA kod ini, klik Save (ikon disket).
 *  4. Klik Deploy → New deployment → jenis "Web app".
 *       - Description: Stingers register
 *       - Execute as: Me
 *       - Who has access: Anyone
 *     Klik Deploy, benarkan keizinan (Authorize).
 *  5. Salin "Web app URL" (berakhir dengan /exec).
 *  6. Letak URL itu sebagai env var SHEETS_WEBHOOK_URL:
 *       - Local : fail .env.local  →  SHEETS_WEBHOOK_URL=...
 *       - Vercel: Project → Settings → Environment Variables
 *  7. Redeploy di Vercel (atau git push) supaya env var dibaca.
 *
 * Baris pertama (header) akan dicipta automatik pada pendaftaran pertama.
 */

// Susunan lajur dalam Sheet (kekalkan selari dengan borang).
var FIELDS = [
  "submittedAt",
  "fullName",
  "dateOfBirth",
  "gender",
  "icNumber",
  "school",
  "schoolRegNo",
  "year",
  "className",
  "playerPhone",
  "guardianPhone",
  "guardianEmail",
  "experience",
  "position",
  "notes",
  "consent",
];

var HEADERS = [
  "Masa Hantar",
  "Nama Penuh",
  "Tarikh Lahir",
  "Jantina",
  "No. KP",
  "Sekolah",
  "No. Pendaftaran Sekolah",
  "Tahun",
  "Kelas",
  "Tel. Pemain",
  "Tel. Penjaga",
  "Email Penjaga",
  "Pengalaman",
  "Posisi",
  "Catatan",
  "Pengesahan",
];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    // Cipta header jika sheet kosong
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    var row = FIELDS.map(function (key) {
      var v = data[key];
      if (v === true) return "Ya";
      if (v === false || v === undefined || v === null) return "";
      return v;
    });
    sheet.appendRow(row);

    return ContentService.createTextOutput(
      JSON.stringify({ ok: true })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}
