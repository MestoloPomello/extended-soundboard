function playSound(audioName) {
    const urlParams = new URLSearchParams(window.location.search);
    const guildId = urlParams.get('guildId');
    $.get(`/api/play/?guildId=${guildId}&name=${audioName}`, function (response) {
        if (response.status != 200) {
            console.error("[PlaySound] Errore: " + response.message);
        }
    });
}

const catalogData = document.getElementById("audio-catalog-data");
const catalogRoot = document.getElementById("audio-catalog");
const catalogStatus = document.getElementById("catalog-status");
const catalog = catalogData ? JSON.parse(catalogData.textContent) : [];
const groupedCatalog = catalogRoot?.dataset.grouped === "true";
const PAGE_SIZE = 100;
let visibleCatalog = catalog;
let renderedCount = 0;
let sectionElements = new Map();

function createAudioButton(audio) {
    const button = document.createElement("button");
    button.className = "audio-item";
    button.type = "button";
    button.style.backgroundColor = getRandomColor();
    button.style.color = isLightColor(button.style.backgroundColor) ? "#000000" : "#ffffff";
    button.addEventListener("click", () => playSound(audio.name));

    const label = document.createElement("span");
    label.className = "audio-name";
    label.textContent = audio.displayName || audio.formattedName || audio.fullName;
    button.append(getRandomEmoji(), label);
    return button;
}

function createSection(author, total) {
    const section = document.createElement("div");
    section.className = "author-section collapsed";
    const header = document.createElement("div");
    header.className = "author-header";
    header.addEventListener("click", () => section.classList.toggle("collapsed"));
    const title = document.createElement("h2");
    title.className = "author-name";
    title.append(document.createTextNode(author + " "));
    const count = document.createElement("span");
    count.className = "author-count";
    count.textContent = `(${total})`;
    title.append(count);
    const icon = document.createElement("i");
    icon.className = "fas fa-chevron-up collapse-icon";
    header.append(title, icon);
    const content = document.createElement("div");
    content.className = "section-content";
    const list = document.createElement("div");
    list.className = "audio-list";
    content.append(list);
    section.append(header, content);
    catalogRoot.append(section);
    sectionElements.set(author, list);
    return list;
}

function renderNextPage() {
    const page = visibleCatalog.slice(renderedCount, renderedCount + PAGE_SIZE);
    for (const audio of page) {
        if (groupedCatalog) {
            let list = sectionElements.get(audio.sectionAuthor);
            if (!list) {
                const total = visibleCatalog.filter(item => item.sectionAuthor === audio.sectionAuthor).length;
                list = createSection(audio.sectionAuthor, total);
            }
            list.append(createAudioButton(audio));
        } else {
            let list = catalogRoot.querySelector(".audio-list");
            if (!list) {
                list = document.createElement("div");
                list.className = "audio-list";
                catalogRoot.append(list);
            }
            list.append(createAudioButton(audio));
        }
    }
    renderedCount += page.length;

    let moreButton = document.getElementById("load-more-audio");
    if (renderedCount < visibleCatalog.length) {
        if (!moreButton) {
            moreButton = document.createElement("button");
            moreButton.id = "load-more-audio";
            moreButton.className = "load-more-audio";
            moreButton.type = "button";
            moreButton.textContent = "Carica altri audio";
            moreButton.addEventListener("click", renderNextPage);
            catalogRoot.after(moreButton);
        }
        moreButton.hidden = false;
    } else if (moreButton) {
        moreButton.hidden = true;
    }
    catalogStatus.textContent = visibleCatalog.length
        ? `Mostrati ${renderedCount} di ${visibleCatalog.length} audio`
        : "Nessun audio trovato";
}

function showCatalog(items) {
    visibleCatalog = items;
    renderedCount = 0;
    sectionElements = new Map();
    catalogRoot.replaceChildren();
    renderNextPage();
}

showCatalog(catalog);

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

document.querySelector("#search input")?.addEventListener("input", event => {
    const query = event.target.value.trim().toLocaleLowerCase();
    showCatalog(query ? catalog.filter(audio => audio.searchText.includes(query)) : catalog);
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

function goToAdmin(event) {
    event.preventDefault();
    const urlParams = new URLSearchParams(window.location.search);
    const guildId = urlParams.get('guildId') || '';
    window.location.href = `/admin?guildId=${guildId}`;
}
