// spike/js/storage.mjs — saved-history persistence. Browser-only.
//
// localStorage keeps a named list of growth histories; export/import moves
// them as JSON files (save format, from the plan: {name, seed, gridSize,
// segments[]}). Everything that enters through here is validated by
// history.mjs before it is trusted.

import { validateHistory, cloneHistory } from './history.mjs';

const STORAGE_KEY = 'vcc-spike-histories-v1';

// The store maps history names to histories. Names are user input, and on an
// ordinary object special keys collide with Object.prototype — a history
// named "__proto__" would hit the prototype setter, "save" without
// persisting, and never list (maker-found defect). A null-prototype object
// has no such keys: every name is an honest own property.
function readStore() {
  const store = Object.create(null);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return store;
    const parsed = JSON.parse(raw);
    if (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed)) {
      // JSON.parse creates plain own properties (no setter calls), so this
      // copy carries "__proto__" and friends across faithfully.
      for (const key of Object.keys(parsed)) store[key] = parsed[key];
    }
  } catch {
    // Corrupt JSON: start fresh rather than crash the page.
  }
  return store;
}

function writeStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

/** All saved histories, validated, sorted by name. Silently skips corrupt entries. */
export function listSaved() {
  const store = readStore();
  const result = [];
  for (const name of Object.keys(store).sort()) {
    try {
      result.push(validateHistory(store[name]));
    } catch {
      // Corrupt entry: leave it in storage (harmless) but do not surface it.
    }
  }
  return result;
}

export function saveHistory(history) {
  const valid = validateHistory(history);
  const store = readStore();
  store[valid.name] = valid;
  writeStore(store);
  return valid;
}

export function deleteHistory(name) {
  const store = readStore();
  delete store[name];
  writeStore(store);
}

export function getSaved(name) {
  const store = readStore();
  if (!(name in store)) return null;
  return validateHistory(store[name]);
}

/** Download a history as a JSON file. */
export function exportHistory(history) {
  const valid = validateHistory(cloneHistory(history));
  const blob = new Blob([JSON.stringify(valid, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  const slug = valid.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'history';
  anchor.download = `${slug}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** Read + validate a history from a File. Rejects with a readable error. */
export function importHistoryFile(file) {
  return file.text().then((text) => validateHistory(JSON.parse(text)));
}
