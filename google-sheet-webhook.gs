const SHEET_NAME = 'Sheet1';
const WEBHOOK_SECRET = 'CHANGE_THIS_TO_MATCH_VERCEL_SECRET';
const HEADERS = [
  'Submitted At',
  'Name',
  'Phone',
  'Loan Amount',
  'State',
  'Source URL',
  'Event ID',
  'Meta Status',
  'Email Status'
];

function setupLeadSheet() {
  const sheet = getLeadSheet_();
  sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
}

function doPost(e) {
  try {
    const secret = e.parameter.secret || '';
    if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) {
      return json_({ ok: false, message: 'Unauthorized.' }, 401);
    }

    const data = JSON.parse(e.postData.contents || '{}');
    const sheet = getLeadSheet_();
    ensureHeaders_(sheet);
    sheet.appendRow([
      formatMalaysiaTime_(data.submittedAt),
      data.fullName || '',
      data.phone || '',
      data.loanAmount || '',
      data.state || '',
      data.eventSourceUrl || '',
      data.eventId || '',
      data.metaStatus || '',
      data.emailStatus || ''
    ]);

    return json_({ ok: true });
  } catch (error) {
    return json_({ ok: false, message: error.message }, 500);
  }
}

function getLeadSheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME)
    || SpreadsheetApp.getActiveSpreadsheet().insertSheet(SHEET_NAME);
}

function ensureHeaders_(sheet) {
  const existing = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  const needsHeaders = existing.every((value) => !value);
  if (needsHeaders) setupLeadSheet();
}

function formatMalaysiaTime_(value) {
  const date = value ? new Date(value) : new Date();
  return Utilities.formatDate(date, 'Asia/Kuala_Lumpur', 'yyyy-MM-dd HH:mm:ss');
}

function json_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}
