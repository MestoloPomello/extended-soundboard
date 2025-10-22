function playSound(audioName) {
    const urlParams = new URLSearchParams(window.location.search);
    const guildId = urlParams.get('guildId');
    $.get(`/api/play/?guildId=${guildId}&name=${audioName}`, function (response) {
        if (response.status != 200) {
            console.error("[PlaySound] Errore: " + response.message);
        }
    });
}

const audioItems = document.querySelectorAll(".audio-item");

audioItems.forEach((item) => {
    const randomEmoji = getRandomEmoji();
    item.innerHTML =
        randomEmoji +
        '<span class="audio-name">' +
        item.textContent.trim() +
        "</span>";
    const randomColor = getRandomColor();
    item.style.backgroundColor = randomColor;
    item.style.color = isLightColor(randomColor) ? "#000000" : "#ffffff";
});

function getRandomEmoji() {
    const minCodePoint = 0x1f600;
    const maxCodePoint = 0x1f64f;
    const codePoint =
        Math.floor(Math.random() * (maxCodePoint - minCodePoint + 1)) +
        minCodePoint;
    return String.fromCodePoint(codePoint);
}

function getRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function isLightColor(color) {
    // Convert hex to RGB
    const r = parseInt(color.substr(1, 2), 16);
    const g = parseInt(color.substr(3, 2), 16);
    const b = parseInt(color.substr(5, 2), 16);
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5; // Return true if light, false if dark
}

$(function () {
    $(".audio-item").matchHeight({ byRow: false });
});

// On typing inside #search input
$("#search input").on("input", function () {
    const query = $(this).val().toLowerCase();
    if (query) {
        $(".audio-item").hide();
        $(".audio-item[data-search*='" + query + "']").show();
    } else {
        $(".audio-item").show();
    }
});
