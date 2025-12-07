// At the top of app.js, create a list of predefined categories
const CATEGORIES = [
    "Uncategorized",  // default
    "Animals",
    "Food",
    "Travel",
    "Work",
    "Family",
    "Numbers",
    "Verbs",
    "Adjectives",
    "Common Phrases"
];

/**
 * Populate the single category <select> (id="categorySelect").
 * When `includeAll` is true, an "All" option is added as the first entry.
 * The `selected` argument marks the option that should be pre‑selected.
 */
function populateCategorySelect(selected = "", includeAll = false) {
    const select = document.getElementById('categorySelect');
    select.innerHTML = ""; // clear any previous options

    if (includeAll) {
        const allOpt = document.createElement('option');
        allOpt.value = "All";
        allOpt.textContent = "All";
        if (selected === "All") allOpt.selected = true;
        select.appendChild(allOpt);
    }

    CATEGORIES.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat;
        opt.textContent = cat;
        if (cat === selected) opt.selected = true;
        select.appendChild(opt);
    });
}

/**
 * Returns the dictionary filtered by the currently selected value of the
 * shared `categorySelect` element. "All" means no filtering.
 */
function getFilteredByCategory() {
    const chosen = document.getElementById('categorySelect').value;
    if (chosen === "All") {
        return dictionary;
    }
    return dictionary.filter(item => item.category === chosen);
}

// Apply filter when the button is pressed
document.getElementById('filterCategoryBtn').addEventListener('click', () => {
    renderList(getFilteredByCategory());
});

// Also filter automatically when the user changes the dropdown
document.getElementById('categorySelect').addEventListener('change', () => {
    renderList(getFilteredByCategory());
});

// Initial population – include the "All" option for filtering purposes
populateCategorySelect("All", true);

// ===================== DATA & LOCALSTORAGE =====================
let dictionary = JSON.parse(localStorage.getItem("dictionary")) || [];
let editingIndex = null; // index of item being edited, or null

// Create a global variable to track filter state
let favoritesFilterActive = false;

// Add event listener to the filter button
document.getElementById('filterFavoritesBtn').addEventListener('click', () => {
    // Toggle filter state
    favoritesFilterActive = !favoritesFilterActive;

    // Update button text
    const btn = document.getElementById('filterFavoritesBtn');
    btn.textContent = favoritesFilterActive
        ? 'Show All Words'
        : 'Show Favorites Only';

    // Render filtered or full list
    if (favoritesFilterActive) {
        const favorited = dictionary.filter(item => item.favorite === true);
        renderList(favorited);
    } else {
        renderList(dictionary);
    }
});


function saveDictionary() {
    localStorage.setItem("dictionary", JSON.stringify(dictionary));
}

// ===================== RENDER LIST =====================
function renderList(list = dictionary) {
    const listDiv = document.getElementById("wordList");
    listDiv.innerHTML = "";

    console.log('Rendering list with', list.length, 'items');
    console.log(list);

    list.forEach(item => {
        const row = document.createElement("div");
        row.className = 'word-row';

        // text area (allow wrapping but keep it from pushing controls out)
        const text = document.createElement("span");
        text.className = 'item-text';
        if (item) {
            const cat = item.category ? ` (${item.category})` : '';
            text.textContent = `${item.word} — ${item.translation}${cat}`;
        }

        // actions container to ensure icons are always aligned right
        const actions = document.createElement('div');
        actions.className = 'item-actions';

        // Create favorite star button
        const starBtn = document.createElement("button");
        starBtn.className = 'star-btn';
        starBtn.innerHTML = item.favorite ? '★' : '☆';
        starBtn.title = item.favorite ? 'Remove from favorites' : 'Add to favorites';

        // CLICK HANDLER: toggle favorite status
        starBtn.onclick = () => toggleFavorite(item);

        const editBtn = document.createElement("button");
        editBtn.className = 'edit-btn';
        editBtn.innerHTML = '✎';
        editBtn.title = 'Uredi';
        editBtn.onclick = () => editItem(item);

        const deleteBtn = document.createElement("button");
        deleteBtn.className = 'delete-btn';
        deleteBtn.innerHTML = 'X';
        deleteBtn.title = 'Obriši';
        deleteBtn.onclick = () => deleteItem(item);

        actions.append(starBtn, editBtn, deleteBtn);
        row.append(text, actions);
        listDiv.appendChild(row);
    });
}

function toggleFavorite(item) {

    // Find the item in dictionary
    const index = dictionary.indexOf(item);
    if (index === -1) return;

    // Toggle the favorite property
    dictionary[index].favorite = !dictionary[index].favorite;

    // Save to localStorage
    saveDictionary();

    // Re-render the list (this will show the new star state)
    // If favorites filter is active, apply it
    if (favoritesFilterActive) {
        renderList(dictionary.filter(item => item.favorite));
    } else {
        renderList();
    }
}


function editItem(item) {
    // Put the clicked item into the form so user can edit inline
    const idx = dictionary.indexOf(item);
    if (idx === -1) return;

    editingIndex = idx;
    document.getElementById('wordInput').value = (item && item.word !== null) ? item.word : '';
    document.getElementById('translationInput').value = (item && item.translation !== null) ? item.translation : '';
    document.getElementById('wordInput').focus();

    // change submit button text and show cancel button
    document.getElementById('submitBtn').textContent = 'Snimi izmjenu';
    document.getElementById('cancelEditBtn').hidden = false;

    // inside editItem()
    populateCategorySelect(item.category);
}

function deleteItem(item) {
    // keep a reference to the removed item if needed (avoid leaving stray text)
    const removedItem = item;

    let tempDeleted = [];

    // tempDeleted.push(removedItem);

    let indexToRemove = dictionary.indexOf(item);


    if (indexToRemove !== -1) {
        let removedItem = dictionary.splice(indexToRemove, 1)[0];
        tempDeleted.push(removedItem);
    }


    dictionary = dictionary.filter(i => i !== item);
    // Show toast notification
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = `Deleted: ${removedItem.word} — ${removedItem.translation}`;
    document.body.appendChild(toast);

    // Undo functionality
    const undoBtn = document.createElement('button');
    undoBtn.className = 'toast-undo-btn';
    undoBtn.textContent = 'Undo';
    undoBtn.onclick = () => {

        // Step 2: Undo removal
        if (tempDeleted.length > 0) {
            let lastDeleted = tempDeleted.pop(); // get last removed item
            dictionary.splice(indexToRemove, 0, lastDeleted); // insert back at same position
        }


        // dictionary.push(removedItem);
        saveDictionary();
        renderList();
        toast.remove();
    };

    toast.appendChild(undoBtn);

    // setTimeout(() => toast.remove(), 4000);

    saveDictionary();
    renderList();
}

// Initial render
renderList();

// ===================== ADD WORD =====================
document.getElementById("addWordForm").addEventListener("submit", e => {
    e.preventDefault();

    const word = document.getElementById("wordInput").value.trim();
    const translation = document.getElementById("translationInput").value.trim();
    if (!word || !translation) return;
    if (editingIndex !== null && editingIndex >= 0 && editingIndex < dictionary.length) {
        // save edits into existing item
        dictionary[editingIndex] = { word, translation, favorite: true, category: document.getElementById('categorySelect').value || 'Uncategorized' };
        editingIndex = null;
        // restore submit button text + hide cancel
        document.getElementById('submitBtn').textContent = 'Dodaj riječ';
        document.getElementById('cancelEditBtn').hidden = true;
    } else {
        dictionary.push({ word, translation, favorite: true, category: document.getElementById('categorySelect').value || 'Uncategorized' });
    }
    saveDictionary();

    document.getElementById("wordInput").value = "";
    document.getElementById("translationInput").value = "";
    // Reset selector but keep the "All" option so the filter dropdown remains functional
    // Reset selector to default (no pre‑selected category) but keep the "All" option
    populateCategorySelect("", true);


    renderList();
});

// cancel editing handler
document.getElementById('cancelEditBtn').addEventListener('click', () => {
    editingIndex = null;
    document.getElementById('wordInput').value = '';
    document.getElementById('translationInput').value = '';
    document.getElementById('submitBtn').textContent = 'Dodaj riječ';
    document.getElementById('cancelEditBtn').hidden = true;
});

// ===================== SEARCH / FILTER =====================
document.getElementById("searchInput").addEventListener("input", function () {
    const query = this.value.toLowerCase();
    const filtered = dictionary.filter(item =>
        item.word.toLowerCase().includes(query) ||
        item.translation.toLowerCase().includes(query)
    );
    renderList(filtered);
});


// ===================== DARK MODE =====================
const darkModeToggle = document.getElementById("darkModeToggle");

darkModeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode",
        document.body.classList.contains("dark-mode") ? "enabled" : "disabled"
    );
    updateDarkModeButton();
});

function updateDarkModeButton() {
    darkModeToggle.textContent =
        document.body.classList.contains("dark-mode") ? "Light Mode" : "Dark Mode";
}

if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark-mode");
}
updateDarkModeButton();

// ===================== PASTE FROM CLIPBOARD (inline icons) =====================
document.querySelectorAll('.paste-icon').forEach(btn => {
    btn.addEventListener('click', async () => {
        const targetId = btn.dataset.target;
        const targetEl = document.getElementById(targetId);
        if (!targetEl) return;

        try {
            const text = await navigator.clipboard.readText();
            // If clipboard contains a `—` or `:` split into two halves and prefer the first half
            if (text.includes('—') || text.includes(':')) {
                // guess: if user wants the word field, prefer the left side; for translation field, prefer the right side
                const parts = text.includes('—') ? text.split('—') : text.split(':');
                if (targetId === 'wordInput') {
                    targetEl.value = (parts[0] || '').trim();
                } else {
                    // translation input
                    targetEl.value = (parts[1] || parts[0] || '').trim();
                }
            } else {
                targetEl.value = text.trim();
            }

            const previousHTML = btn.innerHTML;
            // small inline checkmark SVG for feedback
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M20 6L9 17l-5-5" stroke="#16a34a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
            setTimeout(() => btn.innerHTML = previousHTML, 900);

        } catch (err) {
            console.error('Clipboard read failed', err);
            const previousHTML = btn.innerHTML;
            // small error mark
            btn.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 9v4" stroke="#b91c1c" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 17h.01" stroke="#b91c1c" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><circle cx="12" cy="12" r="9" stroke="#b91c1c" stroke-width="1.2"/></svg>';
            setTimeout(() => btn.innerHTML = previousHTML, 900);
            alert('Ne mogu dohvatiti clipboard.');
        }
    });
});

// ===================== EXPORT / IMPORT =====================
function downloadBlob(filename, content, type = 'application/octet-stream') {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
}

document.getElementById('exportJsonBtn').addEventListener('click', () => {
    try {
        const json = JSON.stringify(dictionary, null, 2);
        downloadBlob('dictionary.json', json, 'application/json;charset=utf-8');
        const s = document.getElementById('importStatus');
        if (s) s.textContent = 'Exported JSON.';
    } catch (err) {
        console.error(err);
        alert('Export JSON failed.');
    }
});

document.getElementById('exportCsvBtn').addEventListener('click', () => {
    try {
        // build CSV with header and quoted fields
        const rows = ['"word","translation"'];
        dictionary.forEach(item => {
            const w = String(item.word).replace(/"/g, '""');
            const t = String(item.translation).replace(/"/g, '""');
            rows.push(`"${w}","${t}"`);
        });
        // add BOM so Excel on Windows opens with utf-8
        const csv = '\uFEFF' + rows.join('\n');
        downloadBlob('dictionary.csv', csv, 'text/csv;charset=utf-8');
        const s = document.getElementById('importStatus');
        if (s) s.textContent = 'Exported CSV.';
    } catch (err) {
        console.error(err);
        alert('Export CSV failed.');
    }
});

// Import button clicks the hidden file input
const importBtn = document.getElementById('importBtn');
const importFile = document.getElementById('importFile');
if (importBtn && importFile) {
    importBtn.addEventListener('click', () => importFile.click());
}

function parseCSV(text) {
    // basic CSV parser supporting quoted fields and escaped "" inside quotes
    const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
    if (!lines.length) return [];

    function parseLine(line) {
        const cols = [];
        let cur = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    cur += '"';
                    i++; // skip escaped quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch === ',' && !inQuotes) {
                cols.push(cur);
                cur = '';
            } else {
                cur += ch;
            }
        }
        cols.push(cur);
        return cols.map(c => c.trim());
    }

    const header = parseLine(lines[0]);
    let start = 0;
    let colWord = 0;
    let colTranslation = 1;

    const lowerHeader = header.map(h => h.toLowerCase());
    if (lowerHeader.includes('word') || lowerHeader.includes('translation') || lowerHeader.includes('translation')) {
        // header row exists
        start = 1;
        colWord = lowerHeader.findIndex(h => h.includes('word'));
        colTranslation = lowerHeader.findIndex(h => h.includes('translation'));
        if (colWord === -1) colWord = 0;
        if (colTranslation === -1) colTranslation = (colWord === 0 ? 1 : 0);
    }

    const result = [];
    for (let i = start; i < lines.length; i++) {
        const cols = parseLine(lines[i]);
        const word = (cols[colWord] || '').trim();
        const translation = (cols[colTranslation] || '').trim();
        if (word) result.push({ word, translation });
    }
    return result;
}

importFile.addEventListener('change', async function () {
    const statusEl = document.getElementById('importStatus');
    if (!this.files || !this.files.length) return;
    const file = this.files[0];
    const text = await file.text();

    let parsed = [];
    try {
        if (file.name.toLowerCase().endsWith('.json')) {
            const data = JSON.parse(text);
            if (!Array.isArray(data)) throw new Error('JSON must be an array');
            parsed = data.map(d => ({ word: String(d.word || '').trim(), translation: String(d.translation || '').trim() }));
        } else if (file.name.toLowerCase().endsWith('.csv')) {
            parsed = parseCSV(text);
        } else {
            // try JSON first, then CSV
            try {
                const data = JSON.parse(text);
                if (Array.isArray(data)) {
                    parsed = data.map(d => ({ word: String(d.word || '').trim(), translation: String(d.translation || '').trim() }));
                }
            } catch (e) {
                parsed = parseCSV(text);
            }
        }
    } catch (err) {
        console.error(err);
        if (statusEl) statusEl.textContent = 'Invalid import file (parse error).';
        this.value = '';
        return;
    }

    // validate
    parsed = parsed.filter(p => p && p.word && typeof p.word === 'string');
    if (!parsed.length) {
        if (statusEl) statusEl.textContent = 'No valid rows found in file.';
        this.value = '';
        return;
    }

    // merge: add items that are not present (match exact word+translation)
    let added = 0;
    parsed.forEach(it => {
        const exists = dictionary.some(d => d.word === it.word && d.translation === it.translation);
        if (!exists) {
            dictionary.push(it);
            added++;
        }
    });

    saveDictionary();
    renderList();

    if (statusEl) statusEl.textContent = added ? `Imported ${added} new item(s).` : 'No new items imported.';
    // reset file input
    this.value = '';
});

// ===================== GOOGLE TRANSLATE (simple) =====================
document.getElementById("translateBtn").addEventListener("click", () => {
    const word = document.getElementById("wordInput").value.trim();
    if (!word) return alert("Unesi riječ.");

    const url = `https://translate.google.com/?sl=auto&tl=bs&text=${encodeURIComponent(word)}&op=translate`;
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
    word = word.trim();
    translation = translation.trim();

    if (!word) return;

    if (!dictionary.some(i => i.word === word && i.translation === translation)) {
        dictionary.push({ word, translation });
        saveDictionary();
        renderList();
    }
}

window.addEventListener("message", event => {
    if (event.data.type === "SET_WORD") {
        const word = event.data.word;

        document.getElementById("wordInput").value = word;
        document.getElementById("translationInput").value = "";
        document.getElementById("translationInput").focus();
    }
});
