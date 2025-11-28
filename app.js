// ====== PODACI I LOCALSTORAGE ======
let dictionary = JSON.parse(localStorage.getItem("dictionary")) || [];

// ====== RENDER LISTE ======
function renderList(list = dictionary) {
    const listDiv = document.getElementById("wordList");
    listDiv.innerHTML = "";

    list.forEach(item => {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.justifyContent = "space-between";
        row.style.alignItems = "center";
        row.style.marginBottom = "5px";
        row.style.padding = "10px 15px";
        row.style.background = "white";
        row.style.borderRadius = "8px";
        row.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";

        const text = document.createElement("span");
        text.textContent = `${item.word} — ${item.translation}`;

        // EDIT dugme
        const editBtn = document.createElement("button");
        editBtn.textContent = "✎";
        editBtn.style.marginRight = "10px";
        editBtn.style.cursor = "pointer";

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
        deleteBtn.style.color = "red";
        deleteBtn.style.cursor = "pointer";

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

// Update teksta dugmeta
function updateToggleText() {
    if (document.body.classList.contains("dark-mode")) {
        darkModeToggle.textContent = "Light Mode";
    } else {
        darkModeToggle.textContent = "Dark Mode";
    }
}

darkModeToggle.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
        localStorage.setItem("darkMode", "enabled");
    } else {
        localStorage.setItem("darkMode", "disabled");
    }

    updateToggleText();
});

// Provjera pri učitavanju stranice
if (localStorage.getItem("darkMode") === "enabled") {
    document.body.classList.add("dark-mode");
}

// Početni tekst dugmeta
updateToggleText();
