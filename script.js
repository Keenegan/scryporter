const userInput = document.getElementById("userInput");
const searchBtn = document.getElementById("searchBtn");
const resultBox = document.getElementById("result");
const copyBtn = document.getElementById("copyBtn");
const resultsNumber = document.getElementById("resultsNumber");

searchBtn.addEventListener("click", async () => {
    let input = userInput.value.trim();
    if (!input) return;

    const scryfallUrlPattern = /https?:\/\/scryfall\.com\/search\?q=(.+)/i;
    const match = input.match(scryfallUrlPattern);
    if (match) {
        input = decodeURIComponent(match[1]);
    }

    resultBox.value = "";
    resultsNumber.textContent = "";
    copyBtn.disabled = true;

    try {
        let url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(input)}`;
        let cardCount = 0;
        let waitTime = 100;

        while (url) {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("HTTP " + response.status);
            }
            const json = await response.json();

            if (json.object === "error") {
                resultBox.value = json.details;
                return;
            }

            const names = json.data.map(item => item.name);

            resultBox.value += names.join("\n") + "\n";

            cardCount += names.length;
            resultsNumber.textContent = `${cardCount}/${json.total_cards}`;

            await new Promise(r => setTimeout(r, waitTime));
            waitTime += 50;

            url = json.next_page;
        }

    } catch (err) {
        resultBox.textContent = "Erreur : " + err.message;
    } finally {
        copyBtn.disabled = false;
    }

});

userInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        searchBtn.click();
    }
});

copyBtn.addEventListener("click", () => {
    navigator.clipboard.writeText(resultBox.value)
        .catch(err => {
            alert("Copy error : " + err);
        });
});