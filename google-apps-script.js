// ============================================
// Google Apps Script for The Dog Log
// ============================================
// SETUP INSTRUCTIONS:
// 1. Open your Google Sheet
// 2. Go to Extensions > Apps Script
// 3. Delete any existing code and paste this entire file
// 4. Click Deploy > New Deployment
// 5. Select type: "Web app"
// 6. Set "Execute as": Me
// 7. Set "Who has access": Anyone
// 8. Click Deploy and authorize when prompted
// 9. Copy the Web App URL and paste it in The Dog Log app (📊 button)
// ============================================

const SHEET_NAMES = {
  dogs: 'Dogs',
  bills: 'Bills',
  donations: 'Donations',
  vetCosts: 'VetCosts',
  updates: 'Updates',
  medications: 'Medications',
  company: 'Company',
  activityLog: 'ActivityLog'
};

// Handle GET requests - Read all data from sheets
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const data = {};

    // Read Dogs
    data.dogs = readSheet(ss, SHEET_NAMES.dogs);

    // Read Bills
    data.bills = readSheet(ss, SHEET_NAMES.bills);

    // Read Donations
    data.donations = readSheet(ss, SHEET_NAMES.donations);

    // Read VetCosts
    data.vetCosts = readSheet(ss, SHEET_NAMES.vetCosts);

    // Read Updates (Mootoo update feed)
    data.updates = readSheet(ss, SHEET_NAMES.updates);

    // Read Medications
    data.medications = readSheet(ss, SHEET_NAMES.medications);

    // Read Company (single row)
    const companyRows = readSheet(ss, SHEET_NAMES.company);
    data.companyInfo = companyRows.length > 0 ? companyRows[0] : { name: '', address: '', email: '' };

    // Read ActivityLog
    data.activityLog = readSheet(ss, SHEET_NAMES.activityLog);

    // Transform data to match app format
    data.dogs = transformDogsFromSheet(data.dogs, data.medications);
    data.bills = transformBillsFromSheet(data.bills);
    data.donations = transformDonationsFromSheet(data.donations);
    data.vetCosts = transformVetCostsFromSheet(data.vetCosts);
    data.updates = transformUpdatesFromSheet(data.updates);
    data.medications = transformMedsFromSheet(data.medications);
    data.companyInfo = {
      name: data.companyInfo.Name || data.companyInfo.name || '',
      address: data.companyInfo.Address || data.companyInfo.address || '',
      email: data.companyInfo.Email || data.companyInfo.email || '',
      mootooVetCost: data.companyInfo.MootooVetCost || data.companyInfo.mootooVetCost || ''
    };
    data.activityLog = transformLogFromSheet(data.activityLog);

    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle POST requests - Write all data to sheets
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    writeAllData(ss, data);

    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Write the full app-format data object to all sheets (shared by doPost and restoreBackup)
function writeAllData(ss, data) {
  // Write Dogs
  if (data.dogs) {
    const dogsRows = transformDogsToSheet(data.dogs, data.medications || []);
    writeSheet(ss, SHEET_NAMES.dogs, dogsRows);
  }
  // Write Bills
  if (data.bills) {
    const billsRows = data.bills.map(b => ({
      ID: b.id,
      Description: b.description || '',
      Amount: b.amount || 0,
      DueDate: b.dueDate || '',
      Paid: b.paid ? 'Yes' : 'No'
    }));
    writeSheet(ss, SHEET_NAMES.bills, billsRows);
  }
  // Write Donations
  if (data.donations) {
    const donationsRows = data.donations.map(d => ({
      ID: d.id,
      Donor: d.donor || '',
      Amount: d.amount || 0,
      Date: d.date || ''
    }));
    writeSheet(ss, SHEET_NAMES.donations, donationsRows);
  }
  // Write VetCosts
  if (data.vetCosts) {
    const vetCostsRows = data.vetCosts.map(v => ({
      ID: v.id,
      Description: v.description || '',
      Amount: v.amount || 0,
      Date: v.date || ''
    }));
    writeSheet(ss, SHEET_NAMES.vetCosts, vetCostsRows);
  }
  // Write Updates (Mootoo update feed)
  if (data.updates) {
    const updatesRows = data.updates.map(u => ({
      ID: u.id,
      Date: u.date || '',
      Icon: u.icon || '🐾',
      Title: u.title || '',
      Note: u.note || '',
      Author: u.author || '',
      Status: u.status || 'recovering'
    }));
    writeSheet(ss, SHEET_NAMES.updates, updatesRows);
  }
  // Write Medications
  if (data.medications) {
    const medsRows = data.medications.map(m => ({
      ID: m.id,
      Name: m.name,
      Interval: m.interval,
      Icon: m.icon
    }));
    writeSheet(ss, SHEET_NAMES.medications, medsRows);
  }
  // Write Company
  if (data.companyInfo) {
    writeSheet(ss, SHEET_NAMES.company, [{
      Name: data.companyInfo.name || '',
      Address: data.companyInfo.address || '',
      Email: data.companyInfo.email || '',
      MootooVetCost: data.companyInfo.mootooVetCost || ''
    }]);
  }
  // Write ActivityLog (keep last 50 entries)
  if (data.activityLog) {
    const logRows = data.activityLog.slice(-50).map(l => ({
      User: l.user || '',
      Action: l.action || '',
      Details: l.details || '',
      Time: l.time || ''
    }));
    writeSheet(ss, SHEET_NAMES.activityLog, logRows);
  }
}

// Read all sheets into the app-format data object (same shape as doGet returns)
function collectAllData(ss) {
  const data = {};
  data.medications = transformMedsFromSheet(readSheet(ss, SHEET_NAMES.medications));
  data.dogs = transformDogsFromSheet(readSheet(ss, SHEET_NAMES.dogs), data.medications);
  data.bills = transformBillsFromSheet(readSheet(ss, SHEET_NAMES.bills));
  data.donations = transformDonationsFromSheet(readSheet(ss, SHEET_NAMES.donations));
  data.vetCosts = transformVetCostsFromSheet(readSheet(ss, SHEET_NAMES.vetCosts));
  data.updates = transformUpdatesFromSheet(readSheet(ss, SHEET_NAMES.updates));
  const companyRows = readSheet(ss, SHEET_NAMES.company);
  const c = companyRows.length > 0 ? companyRows[0] : {};
  data.companyInfo = {
    name: c.Name || c.name || '',
    address: c.Address || c.address || '',
    email: c.Email || c.email || '',
    mootooVetCost: c.MootooVetCost || c.mootooVetCost || ''
  };
  data.activityLog = transformLogFromSheet(readSheet(ss, SHEET_NAMES.activityLog));
  return data;
}

// ---- Automatic backups ----
// Set up a daily time-driven trigger for backupSnapshot():
//   Apps Script editor → Triggers (clock icon) → Add Trigger
//   → function: backupSnapshot, event source: Time-driven, Day timer, e.g. 2am-3am.
const BACKUP_SHEET = 'Backups';
const BACKUP_KEEP = 30; // keep the most recent N snapshots

// Append a dated JSON snapshot of all data to the Backups sheet. Skips empty data
// so a wiped state can never overwrite/prune good snapshots.
function backupSnapshot() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const data = collectAllData(ss);
  const total = data.dogs.length + data.bills.length + data.donations.length + data.vetCosts.length;
  if (total === 0) { Logger.log('backupSnapshot: no data — skipping'); return; }

  let sheet = ss.getSheetByName(BACKUP_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(BACKUP_SHEET);
    sheet.getRange(1, 1, 1, 3).setValues([['Timestamp', 'Summary', 'JSON']]);
  }
  const tz = ss.getSpreadsheetTimeZone();
  const ts = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd HH:mm:ss');
  const summary = 'dogs:' + data.dogs.length + ' bills:' + data.bills.length +
                  ' donations:' + data.donations.length + ' vetCosts:' + data.vetCosts.length;
  sheet.appendRow([ts, summary, JSON.stringify(data)]);

  // Prune to the most recent BACKUP_KEEP snapshots
  const dataRows = sheet.getLastRow() - 1; // minus header
  if (dataRows > BACKUP_KEEP) {
    sheet.deleteRows(2, dataRows - BACKUP_KEEP); // rows are oldest-first below the header
  }
  Logger.log('backupSnapshot: saved ' + ts + ' (' + summary + ')');
}

// Restore a snapshot back into the live sheets.
//   restoreBackup()            → restores the most recent snapshot
//   restoreBackup('2026-07-01 02:00:00') → restores the snapshot with that exact Timestamp
// Run manually from the Apps Script editor (Run button) when you need to recover.
function restoreBackup(timestamp) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(BACKUP_SHEET);
  if (!sheet || sheet.getLastRow() < 2) throw new Error('No backups found');
  const values = sheet.getDataRange().getValues();

  let json = null, chosen = null;
  if (!timestamp) {
    chosen = values[values.length - 1][0];
    json = values[values.length - 1][2];
  } else {
    for (let i = values.length - 1; i >= 1; i--) {
      if (String(values[i][0]) === String(timestamp)) { chosen = values[i][0]; json = values[i][2]; break; }
    }
  }
  if (!json) throw new Error('Backup not found for timestamp: ' + timestamp);

  const data = JSON.parse(json);
  writeAllData(ss, data);
  Logger.log('restoreBackup: restored snapshot from ' + chosen);
}

// ---- Helper Functions ----

function readSheet(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const headers = data[0].map(h => String(h).trim());
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = {};
    let hasData = false;
    headers.forEach((h, idx) => {
      const val = data[i][idx];
      // Convert Date objects to YYYY-MM-DD string
      if (val instanceof Date) {
        const y = val.getFullYear();
        const m = String(val.getMonth() + 1).padStart(2, '0');
        const d = String(val.getDate()).padStart(2, '0');
        row[h] = y + '-' + m + '-' + d;
      } else {
        row[h] = val !== undefined && val !== null ? String(val).trim() : '';
      }
      if (row[h]) hasData = true;
    });
    if (hasData) rows.push(row);
  }
  return rows;
}

function writeSheet(ss, sheetName, rows) {
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }

  // Clear existing content
  sheet.clear();

  if (rows.length === 0) return;

  // Write headers
  const headers = Object.keys(rows[0]);
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  // Write data (prefix date-like strings with ' to prevent auto-conversion)
  if (rows.length > 0) {
    const values = rows.map(row => headers.map(h => {
      const v = row[h] !== undefined ? row[h] : '';
      // Prefix YYYY-MM-DD dates with apostrophe to keep as text
      if (typeof v === 'string' && /^\d{4}-\d{2}-\d{2}/.test(v)) return "'" + v;
      return v;
    }));
    sheet.getRange(2, 1, values.length, headers.length).setValues(values);
  }
}

function getOrCreateSheet(ss, name) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  return sheet;
}

// Transform dogs from sheet format to app format
function transformDogsFromSheet(rows, medications) {
  return rows.filter(r => r.Name).map(r => {
    const dog = {
      id: parseInt(r.ID) || Date.now() + Math.random(),
      name: r.Name
    };
    // Dynamic medication columns
    Object.keys(r).forEach(key => {
      if (key.endsWith('_Last') && r[key]) {
        const medId = key.replace('_Last', '');
        dog[medId] = {
          lastGiven: r[key],
          givenBy: r[medId + '_By'] || ''
        };
      }
    });
    return dog;
  });
}

// Transform dogs from app format to sheet format
function transformDogsToSheet(dogs, medications) {
  return dogs.map(d => {
    const row = { ID: d.id, Name: d.name };
    medications.forEach(med => {
      row[med.id + '_Last'] = d[med.id]?.lastGiven || '';
      row[med.id + '_By'] = d[med.id]?.givenBy || '';
    });
    return row;
  });
}

function transformBillsFromSheet(rows) {
  return rows.filter(r => r.Description).map(r => ({
    id: parseInt(r.ID) || Date.now() + Math.random(),
    description: r.Description,
    amount: r.Amount || '0',
    dueDate: r.DueDate || '',
    paid: r.Paid === 'Yes' || r.Paid === 'TRUE' || r.Paid === 'true'
  }));
}

function transformDonationsFromSheet(rows) {
  return rows.filter(r => r.Donor || r.Amount).map(r => ({
    id: parseInt(r.ID) || Date.now() + Math.random(),
    donor: r.Donor || '',
    amount: r.Amount || '0',
    date: r.Date || ''
  }));
}

function transformVetCostsFromSheet(rows) {
  return rows.filter(r => r.Description || r.Amount).map(r => ({
    id: parseInt(r.ID) || Date.now() + Math.random(),
    description: r.Description || '',
    amount: r.Amount || '0',
    date: r.Date || ''
  }));
}

function transformUpdatesFromSheet(rows) {
  return rows.filter(r => r.Title || r.Note || r.Date).map(r => ({
    id: parseInt(r.ID) || Date.now() + Math.random(),
    date: r.Date || '',
    icon: r.Icon || '🐾',
    title: r.Title || '',
    note: r.Note || '',
    author: r.Author || '',
    status: r.Status || 'recovering'
  }));
}

function transformMedsFromSheet(rows) {
  return rows.filter(r => r.Name).map(r => ({
    id: r.ID || r.Name.toLowerCase().replace(/\s+/g, '_'),
    name: r.Name,
    interval: parseInt(r.Interval) || 30,
    icon: r.Icon || '💊'
  }));
}

function transformLogFromSheet(rows) {
  return rows.filter(r => r.User).map(r => ({
    user: r.User,
    action: r.Action || '',
    details: r.Details || '',
    time: r.Time || ''
  }));
}

// ---- One-time setup: Create sheets if they don't exist ----
function setupSheets() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  Object.values(SHEET_NAMES).forEach(name => {
    if (!ss.getSheetByName(name)) {
      ss.insertSheet(name);
      Logger.log('Created sheet: ' + name);
    }
  });
  Logger.log('Setup complete! All sheets created.');
}
