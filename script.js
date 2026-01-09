const userInput = document.getElementById("userInput");
const searchBtn = document.getElementById("searchBtn");
const clearBtn = document.getElementById("clearBtn");
const resultBox = document.getElementById("result");
const copyBtn = document.getElementById("copyBtn");
const resultsNumber = document.getElementById("resultsNumber");
const emptyState = document.getElementById("emptyState");
const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");
const toast = document.getElementById("toast");

let isSearching = false;

function showToast(message, type = "success") {
    toast.textContent = message;
    toast.className = "toast " + type;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

function setLoading(loading) {
    isSearching = loading;
    searchBtn.disabled = loading;
    searchBtn.classList.toggle("loading", loading);
    userInput.disabled = loading;
    progressContainer.classList.toggle("active", loading);
}

function updateProgress(current, total) {
    const percent = Math.round((current / total) * 100);
    progressBar.style.width = percent + "%";
}

searchBtn.addEventListener("click", async () => {
    let input = userInput.value.trim();
    if (!input || isSearching) return;

    const scryfallUrlPattern = /https?:\/\/scryfall\.com\/search\?q=(.+)/i;
    const match = input.match(scryfallUrlPattern);
    if (match) {
        input = decodeURIComponent(match[1]);
    } else {
        input = encodeURIComponent(input);
    }

    resultBox.value = "";
    resultBox.classList.remove("error");
    resultsNumber.textContent = "";
    copyBtn.disabled = true;
    emptyState.classList.add("hidden");
    progressBar.style.width = "0%";
    setLoading(true);

    try {
        let url = `https://api.scryfall.com/cards/search?q=${input}`;
        let cardCount = 0;
        let totalCards = 0;
        let waitTime = 100;

        while (url) {
            const response = await fetch(url);
            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error("No cards found matching your query");
                }
                throw new Error("HTTP " + response.status);
            }
            const json = await response.json();

            if (json.object === "error") {
                throw new Error(json.details || "Unknown error");
            }

            totalCards = json.total_cards;
            const names = json.data.map(item => item.name);

            resultBox.value += names.join("\n") + "\n";
            resultBox.scrollTop = resultBox.scrollHeight;

            cardCount += names.length;
            resultsNumber.textContent = `${cardCount}/${totalCards}`;
            updateProgress(cardCount, totalCards);

            await new Promise(r => setTimeout(r, waitTime));
            waitTime += 50;

            url = json.next_page;
        }

        showToast(`${cardCount} cards loaded`, "success");

    } catch (err) {
        resultBox.value = err.message;
        resultBox.classList.add("error");
        emptyState.classList.remove("hidden");
        showToast(err.message, "error");
    } finally {
        setLoading(false);
        progressBar.style.width = "100%";
        setTimeout(() => {
            progressContainer.classList.remove("active");
        }, 500);
        if (resultBox.value && !resultBox.classList.contains("error")) {
            copyBtn.disabled = false;
        }
    }
});

userInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !isSearching) {
        event.preventDefault();
        searchBtn.click();
    }
});

clearBtn.addEventListener("click", () => {
    userInput.value = "";
    userInput.focus();
});

copyBtn.addEventListener("click", () => {
    if (copyBtn.disabled) return;

    navigator.clipboard.writeText(resultBox.value)
        .then(() => {
            copyBtn.classList.add("copied");
            showToast("Copied to clipboard!", "success");
            setTimeout(() => {
                copyBtn.classList.remove("copied");
            }, 1500);
        })
        .catch(err => {
            showToast("Failed to copy: " + err.message, "error");
        });
});

userInput.addEventListener("input", () => {
    if (userInput.value.trim() === "" && resultBox.value === "") {
        emptyState.classList.remove("hidden");
    }
});
