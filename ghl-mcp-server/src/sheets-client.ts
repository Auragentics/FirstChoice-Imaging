import { google } from 'googleapis';
import path from 'path';

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

// Path to service account key — copied to VPS alongside the server
const KEY_FILE = process.env.GOOGLE_KEY_FILE || path.join(process.cwd(), 'service-account.json');
const SHEET_ID = process.env.GOOGLE_SHEET_ID || '';

function getAuth() {
  return new google.auth.GoogleAuth({
    keyFile: KEY_FILE,
    scopes: SCOPES,
  });
}

export interface UnitRow {
  unitNumber: string;
  size: string;       // e.g. "10x10"
  sqFt: number;
  monthlyRate: number;
  status: 'available' | 'occupied';
  tenantName: string;
  tenantContactId: string;
  notes: string;
}

export interface UnitUpdate {
  status?: 'available' | 'occupied' | 'reserved';
  tenantName?: string;
  tenantContactId?: string;
  notes?: string;
}

/**
 * Updates a single unit row by unit number.
 * Columns: Unit Number(A) | Size(B) | Sq Ft(C) | Monthly Rate(D) | Status(E) | Tenant Name(F) | GHL Contact ID(G) | Notes(H)
 */
export async function updateUnit(unitNumber: string, updates: UnitUpdate): Promise<boolean> {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  // Find the row for this unit number
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Sheet1!A2:H',
  });

  const rows = response.data.values || [];
  const rowIndex = rows.findIndex(
    (row) => String(row[0] || '').trim().toLowerCase() === unitNumber.trim().toLowerCase()
  );

  if (rowIndex === -1) return false;

  const sheetRow = rowIndex + 2; // +1 for header, +1 for 1-based index
  const currentRow = rows[rowIndex];

  // Build updated row — only overwrite specified fields
  const updatedRow = [
    currentRow[0] || '',                                              // A: Unit Number (never change)
    currentRow[1] || '',                                              // B: Size (never change)
    currentRow[2] || '',                                              // C: Sq Ft (never change)
    currentRow[3] || '',                                              // D: Monthly Rate (never change)
    updates.status !== undefined ? updates.status : (currentRow[4] || ''),   // E: Status
    updates.tenantName !== undefined ? updates.tenantName : (currentRow[5] || ''),    // F: Tenant Name
    updates.tenantContactId !== undefined ? updates.tenantContactId : (currentRow[6] || ''), // G: GHL Contact ID
    updates.notes !== undefined ? updates.notes : (currentRow[7] || ''),     // H: Notes
  ];

  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `Sheet1!A${sheetRow}:H${sheetRow}`,
    valueInputOption: 'RAW',
    requestBody: { values: [updatedRow] },
  });

  return true;
}

/**
 * Reads all rows from the "Units" sheet tab.
 * Expected columns (row 1 = headers):
 * Unit Number | Size | Sq Ft | Monthly Rate | Status | Tenant Name | GHL Contact ID | Notes
 */
export async function getUnits(): Promise<UnitRow[]> {
  const auth = getAuth();
  const sheets = google.sheets({ version: 'v4', auth });

  const response = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: 'Sheet1!A2:H', // skip header row
  });

  const rows = response.data.values || [];
  return rows
    .filter((row) => row[0]) // skip empty rows
    .map((row) => ({
      unitNumber: String(row[0] || '').trim(),
      size: String(row[1] || '').trim(),
      sqFt: Number(row[2]) || 0,
      monthlyRate: Number(String(row[3] || '0').replace(/[^0-9.]/g, '')),
      status: String(row[4] || '').toLowerCase().includes('avail') ? 'available' : 'occupied',
      tenantName: String(row[5] || '').trim(),
      tenantContactId: String(row[6] || '').trim(),
      notes: String(row[7] || '').trim(),
    }));
}
