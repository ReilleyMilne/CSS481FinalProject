let activePet = null;
let activeMatchId = null;
let allMatches = [];
let matchedPets = {};

function notify(msg) {
    let el = document.getElementById("app-notification");

    if (!el) {
        el = document.createElement("div");
        el.id = "app-notification";
        el.className = "notification";
        document.body.appendChild(el);
    }

    el.textContent = msg;
    el.classList.add("show");

    setTimeout(() => el.classList.remove("show"), 2600);
}

function speciesIcon(species) {
    return (species || "Pet").charAt(0).toUpperCase();
}

function formatTime(dateStr) {
    return new Date(dateStr).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime();

    if (diff < 60000) return "just now";
    if (diff < 3600000) return Math.floor(diff / 60000) + "m ago";
    if (diff < 86400000) return Math.floor(diff / 3600000) + "h ago";

    return Math.floor(diff / 86400000) + "d ago";
}

async function loadMatches() {
    if (!activePet) {
        refreshMatches([]);
        return;
    }

    document.getElementById("matches-list").innerHTML =
        '<div style="text-align:center;padding:32px;color:var(--text-muted)"><div class="loading-spinner" style="margin:0 auto 12px"></div>Loading matches…</div>';

    try {
        allMatches = await getPetMatches(activePet.id) || [];

        for (const match of allMatches) {
            const otherId = match.pet_a_id === activePet.id ? match.pet_b_id : match.pet_a_id;

            try {
                matchedPets[match.id] = await getPet(otherId);
            } catch (e) {
                matchedPets[match.id] = { id: otherId, name: "Unknown", species: "", breed: "" };
            }
        }

        refreshMatches(allMatches);
    } catch (err) {
        document.getElementById("matches-list").innerHTML =
            `<div style="text-align:center;padding:32px;color:var(--terracotta)"> ${err.message}</div>`;
    }
}

function refreshMatches(matches) {
    const list = document.getElementById("matches-list");
    const empty = document.getElementById("empty-matches");
    const countEl = document.getElementById("match-count");

    countEl.textContent = `${matches.length} match${matches.length !== 1 ? "es" : ""}`;

    if (matches.length === 0) {
        list.innerHTML = "";
        empty.classList.remove("hidden");
        return;
    }

    empty.classList.add("hidden");

    list.innerHTML = "";

    matches.forEach(match => {
        const other = matchedPets[match.id] || {};
        const emoji = speciesIcon(other.species);

        const item = document.createElement("div");
        item.className = "match-item";
        item.addEventListener("click", () => openChat(match.id));

        const avatar = document.createElement("div");
        avatar.className = "match-item-avatar";
        avatar.textContent = emoji;

        const info = document.createElement("div");
        info.className = "match-item-info";

        const name = document.createElement("div");
        name.className = "match-item-name";
        name.textContent = other.name || "Unknown";

        const preview = document.createElement("div");
        preview.className = "match-item-preview";
        preview.textContent = (other.species || "") + (other.breed ? " · " + other.breed : "");

        const meta = document.createElement("div");
        meta.className = "match-item-meta";
        meta.textContent = timeAgo(match.created_at);

        info.appendChild(name);
        info.appendChild(preview);
        item.appendChild(avatar);
        item.appendChild(info);
        item.appendChild(meta);
        list.appendChild(item);
    });
}

async function openChat(matchId) {
    activeMatchId = matchId;

    const other = matchedPets[matchId] || {};

    document.getElementById("chat-header-avatar").textContent = speciesIcon(other.species);
    document.getElementById("chat-header-name").textContent = other.name || "Unknown";
    document.getElementById("chat-header-sub").textContent =
        `${other.species || ""}${other.breed ? " · " + other.breed : ""}`;

    document.querySelectorAll(".view-panel").forEach(p => p.classList.remove("active"));
    document.getElementById("view-chat").classList.add("active");

    await loadMessages(matchId);
}

async function loadMessages(matchId) {
    const container = document.getElementById("chat-messages");

    container.innerHTML = '<div style="text-align:center;padding:16px;color:var(--text-muted)">Loading messages…</div>';

    try {
        const msgs = await getMessages(matchId, 50);
        refreshMessages(msgs);
    } catch (err) {
        container.innerHTML = `<div style="text-align:center;padding:16px;color:var(--terracotta)"> ${err.message}</div>`;
    }
}

function refreshMessages(msgs) {
    const container = document.getElementById("chat-messages");

    container.innerHTML = "";

    if (!msgs || msgs.length === 0) {
        container.innerHTML = '<div class="chat-no-messages">No messages yet. Say hello!</div>';
        return;
    }

    msgs.forEach(msg => {
        const isMe = activePet && msg.sender_pet_id === activePet.id;

        const bubble = document.createElement("div");
        bubble.className = `message-bubble ${isMe ? "outgoing" : "incoming"}`;
        const text = document.createElement("span");
        text.textContent = msg.content;
        const time = document.createElement("div");
        time.className = "message-time";
        time.textContent = formatTime(msg.created_at);
        bubble.appendChild(text);
        bubble.appendChild(time);

        container.appendChild(bubble);
    });

    container.scrollTop = container.scrollHeight;
}

async function submitMessage() {
    const input = document.getElementById("chat-input");
    const text = input.value.trim();

    if (!text || !activeMatchId || !activePet) return;

    input.value = "";

    try {
        await sendMessage(activeMatchId, activePet.id, text);
        await loadMessages(activeMatchId);
    } catch (err) {
        notify("Could not send: " + err.message);
        input.value = text;
    }
}

function onChatKey(e) {
    if (e.key === "Enter") submitMessage();
}

function showMatchList() {
    activeMatchId = null;

    document.querySelectorAll(".view-panel").forEach(p => p.classList.remove("active"));
    document.getElementById("view-matches").classList.add("active");
}

function goDiscover() {
    window.location.href = "discover.html";
}

async function init() {
    if (!getToken()) {
        window.location.href = "index.html";
        return;
    }

    document.body.classList.remove("auth-guard");
    activePet = getSavedPet();

    if (!activePet) {
        window.location.href = "create-pet.html";
        return;
    }

    try {
        await loadMatches();
    } catch (e) {
        sessionStorage.removeItem("pinder_open_chat");
    }

    const chatId = sessionStorage.getItem("pinder_open_chat");

    if (chatId) {
        sessionStorage.removeItem("pinder_open_chat");

        const match = allMatches.find(m => String(m.id) === String(chatId));

        if (match) {
            openChat(chatId);
            return;
        }
    }

    document.querySelectorAll(".view-panel").forEach(p => p.classList.remove("active"));
    document.getElementById("view-matches").classList.add("active");
}

init();