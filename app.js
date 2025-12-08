// ===================== MULTI-LANGUAGE + CATEGORIES + UNIFIED FILTER =====================

// Defaults
const DEFAULT_CATEGORIES = [
  "Uncategorized",
  "Animals",
  "Food",
  "Travel",
  "Work",
  "Family",
  "Numbers",
  "Verbs",
  "Adjectives",
  "Common Phrases",
];

// LocalStorage keys
const LS_KEY = "dictionaryByLang";
const LS_LANG_KEY = "selectedLang";
const LS_OLD_SINGLE = "dictionary"; // legacy single-language key (for migration)

// Global state
let dictionaryByLang = {};
let selectedLang = "de-bs"; // default language pair (source-target)
let editingIndex = null; // index in current language dictionary when editing, or null

// Unified filter state
let filterState = {
  category: "All",
  favoritesOnly: false,
  search: "",
};

// ===================== STORAGE HELPERS =====================
function loadAll() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    dictionaryByLang = raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn("Failed to parse dictionaryByLang. Resetting.", e);
    dictionaryByLang = {};
  }

  const savedLang = localStorage.getItem(LS_LANG_KEY);
  selectedLang = savedLang || selectedLang;

  // Migration from old single-language storage if present
  try {
    const old = localStorage.getItem(LS_OLD_SINGLE);
    if (old) {
      const arr = JSON.parse(old);
      if (Array.isArray(arr) && arr.length) {
        if (!dictionaryByLang[selectedLang]) dictionaryByLang[selectedLang] = [];
        // merge unique word+translation
        const existing = dictionaryByLang[selectedLang];
        arr.forEach((it) => {
          const exists = existing.some(
            (d) => d.word === it.word && d.translation === it.translation
          );
          if (!exists) existing.push({ ...it });
        });
      }
      // remove old key
      localStorage.removeItem(LS_OLD_SINGLE);
      saveAll();
    }
  } catch (e) {
    console.warn("Migration from old dictionary failed", e);
  }

  // Ensure current language exists
  if (!dictionaryByLang[selectedLang]) dictionaryByLang[selectedLang] = [];
}

function saveAll() {
  localStorage.setItem(LS_KEY, JSON.stringify(dictionaryByLang));
  localStorage.setItem(LS_LANG_KEY, selectedLang);
}

function getCurrentDictionary() {
  return dictionaryByLang[selectedLang] || [];
}

function setCurrentDictionary(arr) {
  dictionaryByLang[selectedLang] = Array.isArray(arr) ? arr : [];
  saveAll();
}

function pushWordToCurrent(item) {
  const arr = getCurrentDictionary().slice();
  arr.push(item);
  setCurrentDictionary(arr);
}

// ===================== CATEGORY HELPERS (per-language) =====================
function getAllCategories() {
  const fromData = Array.from(
    new Set(getCurrentDictionary().map((i) => i && i.category).filter(Boolean))
  );
  const merged = Array.from(new Set([...fromData, ...DEFAULT_CATEGORIES]));
  return merged.sort((a, b) => a.localeCompare(b));
}

function populateCategoryInput(selected = "") {
  const select = document.getElementById("categoryInput");
  if (!select) return;
  const cats = getAllCategories();
  select.innerHTML = "";
  cats.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    if (cat === selected) opt.selected = true;
    select.appendChild(opt);
  });
}

function populateCategoryFilter(selected = "All") {
  const select = document.getElementById("categoryFilter");
  if (!select) return;
  const cats = getAllCategories();
  select.innerHTML = "";
  const allOpt = document.createElement("option");
  allOpt.value = "All";
  allOpt.textContent = "All";
  if (selected === "All") allOpt.selected = true;
  select.appendChild(allOpt);
  cats.forEach((cat) => {
    const opt = document.createElement("option");
    opt.value = cat;
    opt.textContent = cat;
    if (cat === selected) opt.selected = true;
    select.appendChild(opt);
  });

  select.onchange = () => {
    filterState.category = select.value;
    renderFiltered();
  };
}

function refreshCategoryOptions() {
  const inputEl = document.getElementById("categoryInput");
  const filterEl = document.getElementById("categoryFilter");
  const currentInput = inputEl ? inputEl.value : "";
  const currentFilter = filterEl ? filterEl.value : filterState.category;
  populateCategoryInput(currentInput);
  populateCategoryFilter(currentFilter);
}

// ===================== LANGUAGE SELECT =====================
function populateLanguageSelect() {
  const select = document.getElementById("languageSelect");
  if (!select) return;

  // Combine a default list with any keys already in storage
  const DEFAULT_LANGS = ["de-bs", "en-bs", "tr-bs"];
  const keys = Object.keys(dictionaryByLang);
  const langs = Array.from(new Set([...(keys || []), ...DEFAULT_LANGS]));

  select.innerHTML = "";
  langs.forEach((l) => {
    const opt = document.createElement("option");
    opt.value = l;
    opt.textContent = l.toUpperCase();
    if (l === selectedLang) opt.selected = true;
    select.appendChild(opt);
  });

  select.onchange = () => {
    selectedLang = select.value;
    editingIndex = null; // cancel any ongoing edit on language switch
    saveAll();
    refreshCategoryOptions();
    renderFiltered();
  };
}

// ===================== FILTERING + RENDER =====================
function getFilteredList() {
  let list = getCurrentDictionary().slice();

  if (filterState.category && filterState.category !== "All") {
    list = list.filter(
      (i) => (i && (i.category || "Uncategorized")) === filterState.category
    );
  }
  if (filterState.favoritesOnly) {
    list = list.filter((i) => i && i.favorite === true);
  }
  if (filterState.search) {
    const q = filterState.search.toLowerCase();
    list = list.filter(
      (i) =>
        String(i.word || "").toLowerCase().includes(q) ||
        String(i.translation || "").toLowerCase().includes(q)
    );
  }
  return list;
}

function renderFiltered() {
  renderList(getFilteredList());
}

function renderList(list) {
  const listDiv = document.getElementById("wordList");
  listDiv.innerHTML = "";

  list.forEach((item) => {
    const row = document.createElement("div");
    row.className = "word-row";

    const text = document.createElement("span");
    text.className = "item-text";
    const cat = item.category ? ` (${item.category})` : "";
    text.textContent = `${item.word} — ${item.translation}${cat}`;

    const actions = document.createElement("div");
    actions.className = "item-actions";

    const starBtn = document.createElement("button");
    starBtn.className = "star-btn";
    starBtn.innerHTML = item.favorite ? "★" : "☆";
    starBtn.title = item.favorite ? "Remove from favorites" : "Add to favorites";
    starBtn.onclick = () => toggleFavorite(item);

    const editBtn = document.createElement("button");
    editBtn.className = "edit-btn";
    editBtn.innerHTML = "✎";
    editBtn.title = "Uredi";
    editBtn.onclick = () => editItem(item);

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.innerHTML = "X";
    deleteBtn.title = "Obriši";
    deleteBtn.onclick = () => deleteItem(item);

    actions.append(starBtn, editBtn, deleteBtn);
    row.append(text, actions);
    listDiv.appendChild(row);
  });
}

// ===================== ITEM ACTIONS =====================
function toggleFavorite(item) {
  const dict = getCurrentDictionary();
  const index = dict.indexOf(item);
  if (index === -1) return;

  const updated = dict.slice();
  updated[index] = { ...updated[index], favorite: !updated[index].favorite };
  setCurrentDictionary(updated);
  renderFiltered();
}

function editItem(item) {
  const dict = getCurrentDictionary();
  const idx = dict.indexOf(item);
  if (idx === -1) return;

  editingIndex = idx;
  document.getElementById("wordInput").value = String(item.word || "");
  document.getElementById("translationInput").value = String(item.translation || "");
  document.getElementById("wordInput").focus();

  document.getElementById("submitBtn").textContent = "Snimi izmjenu";
  document.getElementById("cancelEditBtn").hidden = false;

  populateCategoryInput(item.category);
}

function deleteItem(item) {
  const dict = getCurrentDictionary();
  const indexToRemove = dict.indexOf(item);
  if (indexToRemove === -1) return;

  const removedItem = dict[indexToRemove];
  const updated = dict.slice();
  updated.splice(indexToRemove, 1);

  // Toast with undo
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = `Deleted: ${removedItem.word} — ${removedItem.translation}`;

  const undoBtn = document.createElement("button");
  undoBtn.className = "toast-undo-btn";
  undoBtn.textContent = "Undo";
  undoBtn.onclick = () => {
    const restored = getCurrentDictionary().slice();
    restored.splice(indexToRemove, 0, removedItem);
    setCurrentDictionary(restored);
    refreshCategoryOptions();
    renderFiltered();
    toast.remove();
  };

  toast.appendChild(undoBtn);
  document.body.appendChild(toast);

  setCurrentDictionary(updated);
  refreshCategoryOptions();
  renderFiltered();
}

// ===================== ADD WORD =====================
document.getElementById("addWordForm").addEventListener("submit", (e) => {
  e.preventDefault();

  const word = document.getElementById("wordInput").value.trim();
  const translation = document
    .getElementById("translationInput")
    .value.trim();
  const category =
    (document.getElementById("categoryInput") &&
      document.getElementById("categoryInput").value) || "Uncategorized";

  if (!word || !translation) return;

  const dict = getCurrentDictionary();
  if (
    editingIndex !== null &&
    editingIndex >= 0 &&
    editingIndex < dict.length
  ) {
    const updated = dict.slice();
    const prevFav = !!updated[editingIndex].favorite;
    updated[editingIndex] = { word, translation, favorite: prevFav, category };
    setCurrentDictionary(updated);
    editingIndex = null;
    document.getElementById("submitBtn").textContent = "Dodaj riječ";
    document.getElementById("cancelEditBtn").hidden = true;
  } else {
    pushWordToCurrent({ word, translation, favorite: true, category });
  }

  document.getElementById("wordInput").value = "";
  document.getElementById("translationInput").value = "";

  refreshCategoryOptions();
  renderFiltered();
});

// cancel editing handler
document.getElementById("cancelEditBtn").addEventListener("click", () => {
  editingIndex = null;
  document.getElementById("wordInput").value = "";
  document.getElementById("translationInput").value = "";
  document.getElementById("submitBtn").textContent = "Dodaj riječ";
  document.getElementById("cancelEditBtn").hidden = true;
});

// ===================== SEARCH / FILTER =====================
document.getElementById("searchInput").addEventListener("input", function () {
  filterState.search = this.value.trim();
  renderFiltered();
});

const filterFavoritesBtn = document.getElementById("filterFavoritesBtn");
if (filterFavoritesBtn) {
  filterFavoritesBtn.addEventListener("click", () => {
    filterState.favoritesOnly = !filterState.favoritesOnly;
    filterFavoritesBtn.textContent = filterState.favoritesOnly
      ? "Show All Words"
      : "Show Favorites Only";
    renderFiltered();
  });
}

// ===================== DARK MODE =====================
const darkModeToggle = document.getElementById("darkModeToggle");

if (darkModeToggle) {
  darkModeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem(
      "darkMode",
      document.body.classList.contains("dark-mode") ? "enabled" : "disabled"
    );
    updateDarkModeButton();
  });
}

function updateDarkModeButton() {
  if (!darkModeToggle) return;
  darkModeToggle.textContent = document.body.classList.contains("dark-mode")
    ? "Light Mode"
    : "Dark Mode";
}

if (localStorage.getItem("darkMode") === "enabled") {
  document.body.classList.add("dark-mode");
}
updateDarkModeButton();

// ===================== PASTE FROM CLIPBOARD (inline icons) =====================
document.querySelectorAll(".paste-icon").forEach((btn) => {
  btn.addEventListener("click", async () => {
    const targetId = btn.dataset.target;
    const targetEl = document.getElementById(targetId);
    if (!targetEl) return;

    try {
      const text = await navigator.clipboard.readText();
      if (text.includes("—") || text.includes(":")) {
        const parts = text.includes("—") ? text.split("—") : text.split(":");
        if (targetId === "wordInput") {
          targetEl.value = (parts[0] || "").trim();
        } else {
          targetEl.value = (parts[1] || parts[0] || "").trim();
        }
      } else {
        targetEl.value = text.trim();
      }

      const previousHTML = btn.innerHTML;
      btn.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M20 6L9 17l-5-5" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      setTimeout(() => (btn.innerHTML = previousHTML), 900);
    } catch (err) {
      console.error("Clipboard read failed", err);
      const previousHTML = btn.innerHTML;
      btn.innerHTML =
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 9v4" stroke="#b91c1c" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 17h.01" stroke="#b91c1c" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="9" stroke="#b91c1c" stroke-width="1.2"/></svg>';
      setTimeout(() => (btn.innerHTML = previousHTML), 900);
      alert("Ne mogu dohvatiti clipboard.");
    }
  });
});

// ===================== EXPORT / IMPORT =====================
function downloadBlob(filename, content, type = "application/octet-stream") {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

document.getElementById("exportJsonBtn").addEventListener("click", () => {
  try {
    const json = JSON.stringify(getCurrentDictionary(), null, 2);
    downloadBlob(`dictionary-${selectedLang}.json`, json, "application/json;charset=utf-8");
    const s = document.getElementById("importStatus");
    if (s) s.textContent = `Exported JSON for ${selectedLang}.`;
  } catch (err) {
    console.error(err);
    alert("Export JSON failed.");
  }
});

document.getElementById("exportCsvBtn").addEventListener("click", () => {
  try {
    const rows = ['"word","translation"'];
    getCurrentDictionary().forEach((item) => {
      const w = String(item.word).replace(/"/g, '""');
      const t = String(item.translation).replace(/"/g, '""');
      rows.push(`"${w}","${t}"`);
    });
    const csv = "\uFEFF" + rows.join("\n");
    downloadBlob(`dictionary-${selectedLang}.csv`, csv, "text/csv;charset=utf-8");
    const s = document.getElementById("importStatus");
    if (s) s.textContent = `Exported CSV for ${selectedLang}.`;
  } catch (err) {
    console.error(err);
    alert("Export CSV failed.");
  }
});

const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
if (importBtn && importFile) {
  importBtn.addEventListener("click", () => importFile.click());
}

function parseCSV(text) {
  const lines = text
    .split(/\r?\n/)
    .filter((l) => l.trim() !== "");
  if (!lines.length) return [];

  function parseLine(line) {
    const cols = [];
    let cur = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        cols.push(cur);
        cur = "";
      } else {
        cur += ch;
      }
    }
    cols.push(cur);
    return cols.map((c) => c.trim());
  }

  const header = parseLine(lines[0]);
  let start = 0;
  let colWord = 0;
  let colTranslation = 1;

  const lowerHeader = header.map((h) => h.toLowerCase());
  if (
    lowerHeader.includes("word") ||
    lowerHeader.includes("translation")
  ) {
    start = 1;
    colWord = lowerHeader.findIndex((h) => h.includes("word"));
    colTranslation = lowerHeader.findIndex((h) => h.includes("translation"));
    if (colWord === -1) colWord = 0;
    if (colTranslation === -1) colTranslation = colWord === 0 ? 1 : 0;
  }

  const result = [];
  for (let i = start; i < lines.length; i++) {
    const cols = parseLine(lines[i]);
    const word = (cols[colWord] || "").trim();
    const translation = (cols[colTranslation] || "").trim();
    if (word) result.push({ word, translation });
  }
  return result;
}

if (importFile) {
  importFile.addEventListener("change", async function () {
    const statusEl = document.getElementById("importStatus");
    if (!this.files || !this.files.length) return;
    const file = this.files[0];
    const text = await file.text();

    let parsed = [];
    try {
      if (file.name.toLowerCase().endsWith(".json")) {
        const data = JSON.parse(text);
        if (!Array.isArray(data)) throw new Error("JSON must be an array");
        parsed = data.map((d) => ({
          word: String(d.word || "").trim(),
          translation: String(d.translation || "").trim(),
        }));
      } else if (file.name.toLowerCase().endsWith(".csv")) {
        parsed = parseCSV(text);
      } else {
        try {
          const data = JSON.parse(text);
          if (Array.isArray(data)) {
            parsed = data.map((d) => ({
              word: String(d.word || "").trim(),
              translation: String(d.translation || "").trim(),
            }));
          }
        } catch (e) {
          parsed = parseCSV(text);
        }
      }
    } catch (err) {
      console.error(err);
      if (statusEl) statusEl.textContent = "Invalid import file (parse error).";
      this.value = "";
      return;
    }

    parsed = parsed.filter((p) => p && p.word && typeof p.word === "string");
    if (!parsed.length) {
      if (statusEl) statusEl.textContent = "No valid rows found in file.";
      this.value = "";
      return;
    }

    const dict = getCurrentDictionary().slice();
    let added = 0;
    parsed.forEach((it) => {
      const exists = dict.some(
        (d) => d.word === it.word && d.translation === it.translation
      );
      if (!exists) {
        dict.push(it);
        added++;
      }
    });

    setCurrentDictionary(dict);
    refreshCategoryOptions();
    renderFiltered();

    if (statusEl)
      statusEl.textContent = added
        ? `Imported ${added} new item(s) for ${selectedLang}.`
        : `No new items imported for ${selectedLang}.`;
    this.value = "";
  });
}

// ===================== GOOGLE TRANSLATE (simple) =====================
document.getElementById("translateBtn").addEventListener("click", () => {
  const word = document.getElementById("wordInput").value.trim();
  if (!word) return alert("Unesi riječ.");

  const parts = (selectedLang || "de-bs").split("-");
  const tl = parts[1] || "bs";
  const url = `https://translate.google.com/?sl=auto&tl=${encodeURIComponent(
    tl
  )}&text=${encodeURIComponent(word)}&op=translate`;
  window.open(url, "_blank");
});

// ===================== URL ?word=xxx =====================
(function () {
  const word = new URLSearchParams(window.location.search).get("word");
  if (!word) return;

  document.getElementById("wordInput").value = word;
  document.getElementById("translationInput").focus();
})();

// ===================== SAVE WORD FROM BOOKMARKLET =====================
function saveWordToDictionary(word, translation = "") {
  word = String(word || "").trim();
  translation = String(translation || "").trim();
  if (!word) return;

  const dict = getCurrentDictionary();
  const exists = dict.some(
    (i) => i.word === word && i.translation === translation
  );
  if (!exists) {
    pushWordToCurrent({ word, translation });
    refreshCategoryOptions();
    renderFiltered();
  }
}

// ===================== INIT =====================
(function init() {
  loadAll();
  populateLanguageSelect();
  refreshCategoryOptions();
  renderFiltered();
})();
