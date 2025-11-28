// ===================== DATA & LOCALSTORAGE =====================
let dictionary = JSON.parse(localStorage.getItem("dictionary")) || [];
let editingIndex = null; // index of item being edited, or null

function saveDictionary() {
    localStorage.setItem("dictionary", JSON.stringify(dictionary));
}

// ===================== RENDER LIST =====================
function renderList(list = dictionary) {
    const listDiv = document.getElementById("wordList");
    listDiv.innerHTML = "";

    list.forEach(item => {
        const row = document.createElement("div");
        row.className = 'word-row';

        // text area (allow wrapping but keep it from pushing controls out)
        const text = document.createElement("span");
        text.className = 'item-text';
        text.textContent = `${item.word} — ${item.translation}`;

        // actions container to ensure icons are always aligned right
        const actions = document.createElement('div');
        actions.className = 'item-actions';

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

        actions.append(editBtn, deleteBtn);
        row.append(text, actions);
        listDiv.appendChild(row);
    });
}

function editItem(item) {
    // Put the clicked item into the form so user can edit inline
    const idx = dictionary.indexOf(item);
    if (idx === -1) return;

    editingIndex = idx;
    document.getElementById('wordInput').value = item.word;
    document.getElementById('translationInput').value = item.translation;
    document.getElementById('wordInput').focus();

    // change submit button text and show cancel button
    document.getElementById('submitBtn').textContent = 'Snimi izmjenu';
    document.getElementById('cancelEditBtn').hidden = false;
}

function deleteItem(item) {
    dictionary = dictionary.filter(i => i !== item);
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
        dictionary[editingIndex] = { word, translation };
        editingIndex = null;
        // restore submit button text + hide cancel
        document.getElementById('submitBtn').textContent = 'Dodaj riječ';
        document.getElementById('cancelEditBtn').hidden = true;
    } else {
        dictionary.push({ word, translation });
    }
    saveDictionary();

    document.getElementById("wordInput").value = "";
    document.getElementById("translationInput").value = "";

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

// ===================== GOOGLE TRANSLATE (simple) =====================
document.getElementById("translateBtn").addEventListener("click", () => {
    const word = document.getElementById("wordInput").value.trim();
    if (!word) return alert("Unesi riječ.");

    const url = `https://translate.google.com/?sl=auto&tl=bs&text=${encodeURIComponent(word)}&op=translate`;
    window.open(url, "_blank");
});

// ===================== URL ?word=xxx =====================
(function() {
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
