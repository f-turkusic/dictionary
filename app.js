let dictionary = JSON.parse(localStorage.getItem("dictionary")) || [];

function renderList() {
    const listDiv = document.getElementById("wordList");
    listDiv.innerHTML = "";

    dictionary.forEach(item => {
        const row = document.createElement("div");
        row.style.display = "flex";
        row.style.justifyContent = "space-between";
        row.style.marginBottom = "5px";

        const text = document.createElement("span");
        text.textContent = `${item.word} — ${item.translation}`;

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "X";
        deleteBtn.style.marginLeft = "10px";
        deleteBtn.style.color = "red";
        deleteBtn.style.cursor = "pointer";

        deleteBtn.addEventListener("click", function () {
            const index = dictionary.indexOf(item);
            dictionary.splice(index, 1);
            localStorage.setItem("dictionary", JSON.stringify(dictionary));
            renderList();
        });

        row.appendChild(text);
        row.appendChild(deleteBtn);
        listDiv.appendChild(row);
    });
}

// Render odmah po učitavanju
renderList();

// Dodavanje riječi
const form = document.getElementById("addWordForm");
form.addEventListener("submit", function(e) {
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
