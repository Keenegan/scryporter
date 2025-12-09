document.getElementById("searchBtn").addEventListener("click", async () => {
    const input = document.getElementById("userInput").value;
    const resultBox = document.getElementById("result");
    const copyBtn = document.getElementById("copyBtn");
    const resultsNumber = document.getElementById("resultsNumber");

    if (!input) {
        return;
    }

    try {
        let url = `https://api.scryfall.com/cards/search?q=${input}`;
        let cardCount = 0;
        resultsNumber.textContent = ""
        resultBox.textContent = ""
        let defaultWaitTime = 100;
        copyBtn.disabled = true;

        while (url) {
            const response = await fetch(url);
            const json = await response.json();

            if (json.object == "error") {
                resultBox.textContent = json.details;
                return;
            }

            const names = json.data.map(item => item.name);

            names.forEach(name => {
                resultBox.textContent += name + "\n";
            });
            await new Promise(resolve => setTimeout(resolve, defaultWaitTime));

            url = json.next_page;
            resultsNumber.textContent = (cardCount += names.length) + "/" + json.total_cards
            defaultWaitTime += 50;
        }
        copyBtn.disabled = false;


    } catch (err) {
        resultBox.textContent = "Erreur : " + err.message;
    }

});

document.getElementById("userInput").addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("searchBtn").click();
    }
});

document.getElementById("copyBtn").addEventListener("click", () => {
    const text = document.getElementById("result").textContent;

    navigator.clipboard.writeText(text)
        .catch(err => {
            alert("Copy error : " + err);
        });
});