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
    const r = parseInt(color.substr(1, 2), 16);
    const g = parseInt(color.substr(3, 2), 16);
    const b = parseInt(color.substr(5, 2), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
}

$(function () {
    $(".audio-item").matchHeight({ byRow: false });
});

$("#search input").on("input", function () {
    const query = $(this).val().toLowerCase();
    
    if (query) {
        // Reset: nascondi tutto prima di riapplicare la ricerca
        $(".author-section").hide();
        $(".audio-item").hide();
        
        $(".author-section").each(function() {
            const sectionAuthor = $(this).attr("data-author");
            const matchesAuthor = sectionAuthor && sectionAuthor.toLowerCase().includes(query);
            
            if (matchesAuthor) {
                // Se l'autore corrisponde, mostra tutti gli audio della sezione
                $(this).find(".audio-item").show();
                $(this).show();
            } else {
                // Altrimenti, cerca nei singoli audio
                let hasVisibleAudio = false;
                $(this).find(".audio-item").each(function() {
                    const searchText = $(this).attr("data-search");
                    const authorsText = $(this).attr("data-authors") || "";
                    if ((searchText && searchText.includes(query)) || 
                        (authorsText && authorsText.toLowerCase().includes(query))) {
                        $(this).show();
                        hasVisibleAudio = true;
                    }
                });
                
                // Mostra la sezione solo se ha almeno un audio visibile
                if (hasVisibleAudio) {
                    $(this).show();
                }
            }
        });
        
        // Gestisci gli audio senza sezioni (modalità non raggruppata)
        $(".audio-item").each(function() {
            if (!$(this).closest(".author-section").length) {
                const searchText = $(this).attr("data-search");
                if (searchText && searchText.includes(query)) {
                    $(this).show();
                }
            }
        });
    } else {
        // Se la query è vuota, mostra tutto
        $(".audio-item").show();
        $(".author-section").show();
    }
});

function changeSortOrder(sortBy) {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('sort', sortBy);
    window.location.search = urlParams.toString();
}

function toggleGrouping(isGrouped) {
    const urlParams = new URLSearchParams(window.location.search);
    if (isGrouped) {
        urlParams.set('group', 'true');
    } else {
        urlParams.delete('group');
    }
    window.location.search = urlParams.toString();
}

function toggleSection(headerElement) {
    const section = headerElement.closest('.author-section');
    section.classList.toggle('collapsed');
}
