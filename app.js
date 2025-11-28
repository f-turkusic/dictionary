// ===================== DATA & LOCALSTORAGE =====================
let dictionary = JSON.parse(localStorage.getItem("dictionary")) || [];

function saveDictionary() {
    localStorage.setItem("dictionary", JSON.stringify(dictionary));
}

// ===================== RENDER LIST =====================
function renderList(list = dictionary) {
    const listDiv = document.getElementById("wordList");
    listDiv.innerHTML = "";

    list.forEach(item => {
        const row = document.createElement("div");

        const text = document.createElement("span");
        text.textContent = `${item.word} — ${item.translation}`;

        const editBtn = document.createElement("button");
        editBtn.textContent = "✎";
        editBtn.onclick = () => editItem(item);

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "X";
        deleteBtn.onclick = () => deleteItem(item);

        row.append(text, editBtn, deleteBtn);
        listDiv.appendChild(row);
    });
}

function editItem(item) {
    const newWord = prompt("Uredi riječ:", item.word);
    const newTranslation = prompt("Uredi prijevod:", item.translation);

    if (!newWord || !newTranslation) return;

    item.word = newWord.trim();
    item.translation = newTranslation.trim();

    saveDictionary();
    renderList();
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

    dictionary.push({ word, translation });
    saveDictionary();

    document.getElementById("wordInput").value = "";
    document.getElementById("translationInput").value = "";

    renderList();
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

// ===================== PASTE FROM CLIPBOARD =====================
document.getElementById("pasteBtn").addEventListener("click", async () => {
    try {
        const text = await navigator.clipboard.readText();
        let [word, translation] = text.includes("—") ? text.split("—") : text.split(":");

        document.getElementById("wordInput").value = (word || "").trim();
        document.getElementById("translationInput").value = (translation || "").trim();

    } catch (err) {
        alert("Ne mogu dohvatiti clipboard.");
        console.error(err);
    }
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
