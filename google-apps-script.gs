/**
 * Stingers Hockey — Google Apps Script.
 * Mengendalikan 4 borang + muat naik gambar ke Drive melalui satu Web App URL,
 * ikut data.formType / data.type:
 *   (default)        → "Pendaftaran"
 *   "hustle-gear"    → "Hustle Gear"
 *   "penilaian"      → "Penilaian Pemain"
 *   "kecergasan"     → "Ujian Kecergasan"
 *   type:"drive-upload" → simpan gambar ke folder Drive (bukti tempahan/tugasan)
 *
 * PENTING: selepas edit, Deploy → Manage deployments → Edit → Version: New
 * version (URL kekal sama). Kali pertama jalan fungsi Drive, Authorize keizinan.
 */

var REGISTER_SHEET_NAME = "Pendaftaran";
var ORDER_SHEET_NAME = "Hustle Gear";
var ASSESS_SHEET_NAME = "Penilaian Pemain";
var FITNESS_SHEET_NAME = "Ujian Kecergasan";

// ── Folder Google Drive untuk simpan gambar (dicipta automatik jika tiada) ──
var DRIVE_FOLDER_TEMPAHAN = "Stingers - Bukti Tempahan";
var DRIVE_FOLDER_TUGASAN = "Stingers - Bukti Tugasan";

var FIELDS = [
  "submittedAt","fullName","dateOfBirth","gender","icNumber","school",
  "schoolRegNo","year","className","playerPhone","guardianPhone",
  "guardianEmail","experience","position","notes","consent",
];
var HEADERS = [
  "Masa Hantar","Nama Penuh","Tarikh Lahir","Jantina","No. KP","Sekolah",
  "No. Pendaftaran Sekolah","Tahun","Kelas","Tel. Pemain","Tel. Penjaga",
  "Email Penjaga","Pengalaman","Posisi","Catatan","Pengesahan",
];

var ORDER_FIELDS = [
  "submittedAt","fullName","phone","email","size","quantity",
  "unitPrice","total","notes","consent",
];
var ORDER_HEADERS = [
  "Masa Hantar","Nama Penuh","No. Telefon","Email","Saiz","Kuantiti",
  "Harga Seunit (RM)","Jumlah (RM)","Catatan","Pengesahan",
];

// ── Penilaian Pemain ──
var ASSESS_FIELDS = [
  "submittedAt","assessedOn","playerName","typeLabel","average","details","note",
];
var ASSESS_HEADERS = [
  "Masa Hantar","Tarikh Dinilai","Pemain","Jenis","Purata","Butiran","Nota",
];

// ── Ujian Kecergasan ──
var FITNESS_FIELDS = [
  "submittedAt","testedOn","playerName","occasion",
  "sprint_20m","sprint_40m","illinois","beep_test",
  "vertical_jump","push_up","sit_up","plank",
];
var FITNESS_HEADERS = [
  "Masa Hantar","Tarikh","Pemain","Sesi",
  "Sprint 20m (s)","Sprint 40m (s)","Illinois (s)","Beep Test (lvl)",
  "Vertical Jump (cm)","Push-up","Sit-up","Plank (s)",
];

// ── Pembantu Drive ────────────────────────────────────────────────────────

// Dapatkan folder ikut nama di root Drive; cipta jika belum ada.
function getOrCreateFolder(name) {
  var it = DriveApp.getFoldersByName(name);
  return it.hasNext() ? it.next() : DriveApp.createFolder(name);
}

// Tentukan sambungan fail daripada jenis MIME blob.
function extFromMime(mime) {
  var map = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "image/heic": ".heic",
    "video/mp4": ".mp4",
    "video/quicktime": ".mov",
    "video/webm": ".webm",
  };
  return map[mime] || "";
}

// Muat naik gambar ke Drive. Server hantar:
//   { type:"drive-upload", target:"tempahan"|"tugasan",
//     imageUrl:<URL awam Supabase>, fileName:<nama tanpa ext> }
function handleDriveUpload(data) {
  try {
    if (!data.imageUrl || !data.fileName) {
      throw new Error("imageUrl & fileName diperlukan");
    }
    var folderName =
      data.target === "tugasan" ? DRIVE_FOLDER_TUGASAN : DRIVE_FOLDER_TEMPAHAN;
    var folder = getOrCreateFolder(folderName);

    var resp = UrlFetchApp.fetch(data.imageUrl, { muteHttpExceptions: true });
    if (resp.getResponseCode() !== 200) {
      throw new Error("Gagal ambil gambar: HTTP " + resp.getResponseCode());
    }
    var blob = resp.getBlob();
    var ext = extFromMime(blob.getContentType());
    var safe = String(data.fileName).replace(/[\\/:*?"<>|]/g, " ").trim();
    blob.setName(safe + ext);

    var file = folder.createFile(blob);
    return ContentService.createTextOutput(
      JSON.stringify({ ok: true, fileId: file.getId(), fileUrl: file.getUrl() })
    ).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(
      JSON.stringify({ ok: false, error: String(err) })
    ).setMimeType(ContentService.MimeType.JSON);
  }
}

// Jalankan fungsi ini SEKALI dalam editor (butang Run) untuk cetuskan skrin
// keizinan Drive + capaian luar. Ia juga cipta kedua-dua folder serta-merta.
function authorizeAndTest() {
  getOrCreateFolder(DRIVE_FOLDER_TEMPAHAN);
  getOrCreateFolder(DRIVE_FOLDER_TUGASAN);
  UrlFetchApp.fetch("https://www.google.com", { muteHttpExceptions: true });
  Logger.log("OK — folder dicipta & keizinan diberi.");
}

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);

    // Muat naik gambar ke Drive (admin "Sah" tempahan / coach "Disemak" tugasan).
    if (data.type === "drive-upload") {
      return handleDriveUpload(data);
    }

    var ss = SpreadsheetApp.getActiveSpreadsheet();

    var sheetName, fields, headers;
    if (data.formType === "hustle-gear") {
      sheetName = ORDER_SHEET_NAME; fields = ORDER_FIELDS; headers = ORDER_HEADERS;
    } else if (data.formType === "penilaian") {
      sheetName = ASSESS_SHEET_NAME; fields = ASSESS_FIELDS; headers = ASSESS_HEADERS;
    } else if (data.formType === "kecergasan") {
      sheetName = FITNESS_SHEET_NAME; fields = FITNESS_FIELDS; headers = FITNESS_HEADERS;
    } else {
      sheetName = REGISTER_SHEET_NAME; fields = FIELDS; headers = HEADERS;
    }

    var sheet = ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
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

    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
