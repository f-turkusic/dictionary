// ====== PODACI I LOCALSTORAGE ======
let dictionary = JSON.parse(localStorage.getItem("dictionary")) || [];

// ====== RENDER LISTE ======
function renderList(list = dictionary) {
    const listDiv = document.getElementById("wordList");
    listDiv.innerHTML = "";

    list.forEach(item => {
        const row = document.createElement("div");

        const text = document.createElement("span");
        text.textContent = `${item.word} — ${item.translation}`;

        // EDIT dugme
        const editBtn = document.createElement("button");
        editBtn.textContent = "✎";
        editBtn.addEventListener("click", function () {
            const newWord = prompt("Uredi riječ:", item.word);
            const newTranslation = prompt("Uredi prijevod:", item.translation);

            if (newWord && newTranslation) {
                item.word = newWord.trim();
                item.translation = newTranslation.trim();
                localStorage.setItem("dictionary", JSON.stringify(dictionary));
                renderList();
            }
        });

        // DELETE dugme
        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "X";
        deleteBtn.addEventListener("click", function () {
            const index = dictionary.indexOf(item);
            dictionary.splice(index, 1);
            localStorage.setItem("dictionary", JSON.stringify(dictionary));
            renderList();
        });

        row.appendChild(text);
        row.appendChild(editBtn);
        row.appendChild(deleteBtn);
        listDiv.appendChild(row);
    });
}

// ====== INICIJALNI RENDER ======
renderList();

// ====== DODAVANJE RIJEČI ======
const form = document.getElementById("addWordForm");
form.addEventListener("submit", function (e) {
    e.preventDefault();

    const word = document.getElementById("wordInput").value.trim();
    const translation = document.getElementById("translationInput").value.trim();

    if (!word || !translation) return;

    dictionary.push({ word, translation });
    localStorage.setItem("dictionary", JSON.stringify(dictionary));

    document.getElementById("wordInput").value = "";
    document.getElementById("translationInput").value = "";

    renderList();
});

// ====== FILTER / PRETRAGA ======
const searchInput = document.getElementById("searchInput");
searchInput.addEventListener("input", function () {
    const query = this.value.toLowerCase();

    const filtered = dictionary.filter(item =>
        item.word.toLowerCase().includes(query) ||
        item.translation.toLowerCase().includes(query)
    );

    renderList(filtered);
});

// ====== DARK / LIGHT MODE ======
const darkModeToggle = document.getElementById("darkModeToggle");

function updateToggleText() {
    darkModeToggle.textContent = document.body.classList.contains("dark-mode") ? "Light Mode" : "Dark Mode";
}

darkModeToggle.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode") ? "enabled" : "disabled");
    updateToggleText();
});

if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark-mode");
}

updateToggleText();

// ====== PASTE FROM CLIPBOARD ======
const pasteBtn = document.getElementById("pasteBtn");
pasteBtn.addEventListener("click", async () => {
    try {
        const text = await navigator.clipboard.readText();
        let [word, translation] = text.includes("—") ? text.split("—") : text.split(":");
        word = word ? word.trim() : "";
        translation = translation ? translation.trim() : "";

        if(word) document.getElementById("wordInput").value = word;
        if(translation) document.getElementById("translationInput").value = translation;

    } catch(err) {
        alert("Ne mogu dohvatiti clipboard. Provjeri dozvole.");
        console.error(err);
    }
});

// ====== OPEN GOOGLE TRANSLATE ======
const translateBtn = document.getElementById("translateBtn");
translateBtn.addEventListener("click", () => {
    const word = document.getElementById("wordInput").value.trim();
    if(!word) {
        alert("Unesi riječ koju želiš prevesti.");
        return;
    }
    const url = `https://translate.google.com/?sl=auto&tl=bs&text=${encodeURIComponent(word)}&op=translate`;
    window.open(url, "_blank");
});
