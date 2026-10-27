// Khuloud Stall → Google Sheet
// Paste this into the Sheet: Extensions → Apps Script. Then Deploy → New deployment →
// Web app, "Execute as: Me", "Who has access: Anyone". Copy the /exec link into the app's Setup.
//
// Optional: set KEY below to a secret word and add ?k=<that word> to the end of the /exec link
// in the app. Then nobody without the link+word can write to your Sheet.
const KEY = '';
const TAB = 'Sales';
const HEADERS = ['Order', 'Date', 'Time', 'Event', 'Staff', 'Items', 'Item count', 'Amount (₹)', 'Paid by', 'Status', 'Phone code', 'Saved at'];

function doGet(e) {
  if (KEY && e.parameter.k !== KEY) return out({ ok: false, error: 'wrong key' });
  return out({ ok: true });
}

function doPost(e) {
  if (KEY && e.parameter.k !== KEY) return out({ ok: false, error: 'wrong key' });
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const orders = JSON.parse(e.postData.contents).orders || [];
    const sh = sheet();
    const last = sh.getLastRow();
    const ids = last > 1 ? sh.getRange(2, 1, last - 1, 1).getValues().map(r => String(r[0])) : [];
    orders.forEach(o => {
      const vals = [o.id, o.date, o.time, o.event, o.staff, o.items, o.count, o.amount, o.pay, o.status, o.device, new Date()];
      const i = ids.indexOf(String(o.id));
      if (i >= 0) sh.getRange(i + 2, 1, 1, vals.length).setValues([vals]);   // same order again (e.g. cancelled): update it
      else { sh.appendRow(vals); ids.push(String(o.id)); }
    });
    return out({ ok: true, saved: orders.length });
  } catch (err) {
    return out({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function sheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(TAB);
  if (!sh) sh = ss.insertSheet(TAB);
  if (sh.getLastRow() === 0) {
    sh.appendRow(HEADERS);
    sh.setFrozenRows(1);
    sh.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold').setBackground('#4B2451').setFontColor('#F0D48A');
    sh.getRange('A:A').setNumberFormat('@');
    sh.getRange('B:C').setNumberFormat('@');
  }
  return sh;
}

function out(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
