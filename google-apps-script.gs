/**
 * Stingers Hockey — Google Apps Script untuk terima borang ke Google Sheet.
 *
 * Mengendalikan DUA borang melalui satu Web App URL:
 *   1. Pendaftaran Pencarian Bakat  → sheet pertama (default).
 *   2. Tempahan Hustle Gear         → sheet "Tempahan Hustle Gear"
 *      (dicipta automatik), dipilih bila data.formType === "hustle-gear".
 *
 * SETUP (lihat juga README.md §4):
 *  1. Cipta Google Sheet baharu (contoh nama: "Stingers 2026").
 *  2. Menu: Extensions → Apps Script.
 *  3. Padam kod sedia ada, paste SEMUA kod ini, klik Save (ikon disket).
 *  4. Klik Deploy → New deployment → jenis "Web app".
 *       - Execute as: Me
 *       - Who has access: Anyone
 *     Klik Deploy, benarkan keizinan (Authorize).
 *  5. Salin "Web app URL" (berakhir dengan /exec).
 *  6. Letak URL itu sebagai env var SHEETS_WEBHOOK_URL:
 *       - Local : fail .env.local  →  SHEETS_WEBHOOK_URL=...
 *       - Vercel: Project → Settings → Environment Variables
 *  7. Redeploy di Vercel (atau git push) supaya env var dibaca.
 *
 * PENTING: jika anda sudah deploy versi lama, selepas paste kod ini anda mesti
 * Deploy → Manage deployments → Edit → Version: New version, supaya perubahan
 * (sheet tempahan) berkuat kuasa. URL kekal sama.
 *
 * Baris pertama (header) setiap sheet dicipta automatik pada hantaran pertama.
 */

// ── Borang pendaftaran (Pencarian Bakat) ────────────────────────────────
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

// ── Borang tempahan (Hustle Gear) ───────────────────────────────────────
var ORDER_SHEET_NAME = "Tempahan Hustle Gear";

var ORDER_FIELDS = [
  "submittedAt",
  "fullName",
  "phone",
  "email",
  "size",
  "quantity",
  "unitPrice",
  "total",
  "notes",
  "consent",
];

var ORDER_HEADERS = [
  "Masa Hantar",
  "Nama Penuh",
  "No. Telefon",
  "Email",
  "Saiz",
  "Kuantiti",
  "Harga Seunit (RM)",
  "Jumlah (RM)",
  "Catatan",
  "Pengesahan",
];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    var sheet, fields, headers;
    if (data.formType === "hustle-gear") {
      sheet =
        ss.getSheetByName(ORDER_SHEET_NAME) || ss.insertSheet(ORDER_SHEET_NAME);
      fields = ORDER_FIELDS;
      headers = ORDER_HEADERS;
    } else {
      sheet = ss.getSheets()[0];
      fields = FIELDS;
      headers = HEADERS;
    }

    // Cipta header jika sheet kosong
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
      sheet.setFrozenRows(1);
    }

    var row = fields.map(function (key) {
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
