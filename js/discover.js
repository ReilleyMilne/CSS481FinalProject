let discoverQueue = [];
let petImages = {};
let petTags = {};
let activePet = null;

function showToast(msg) {
    let el = document.getElementById("pinder-toast");

    if (!el) {
        el = document.createElement("div");
        el.id = "pinder-toast";
        el.className = "toast";
        document.body.appendChild(el);
    }

    el.textContent = msg;
    el.classList.add("show");

    setTimeout(() => el.classList.remove("show"), 2600);
}

function getSpeciesEmoji(species) {
    return (species || "Pet").charAt(0).toUpperCase();
}

async function loadDiscoverQueue() {
    const stack = document.getElementById("swipe-stack");

    stack.innerHTML = '<div class="loading-card"><div class="loading-spinner"></div><p>Finding pets near you…</p></div>';
    document.getElementById("empty-discover").classList.add("hidden");
    document.querySelector(".swipe-actions").style.display = "none";

    try {
        const pets = await discoverPets(20);
        discoverQueue = pets || [];

        const first3 = discoverQueue.slice(0, 3);

        for (const pet of first3) {
            try {
                const imgs = await getPetImages(pet.id);
                petImages[pet.id] = imgs.map(i => i.url);
            } catch (e) {
                petImages[pet.id] = [];
            }

            try {
                const tags = await getPetTags(pet.id);
                petTags[pet.id] = tags.map(t => t.title);
            } catch (e) {
                petTags[pet.id] = [];
            }
        }

        renderDiscoverStack();
    } catch (err) {
        stack.innerHTML = `<div class="loading-card"><p style="color:var(--terracotta)"> ${err.message}</p><button class="btn-primary" style="margin-top:16px;width:auto;padding:10px 24px" onclick="loadDiscoverQueue()">Try Again</button></div>`;
    }
}

function renderDiscoverStack() {
    const stack = document.getElementById("swipe-stack");
    const empty = document.getElementById("empty-discover");
    const actions = document.querySelector(".swipe-actions");

    stack.innerHTML = "";

    const visible = discoverQueue.slice(0, 3);

    if (visible.length === 0) {
        empty.classList.remove("hidden");
        actions.style.display = "none";
        return;
    }

    empty.classList.add("hidden");
    actions.style.display = "";

    [...visible].reverse().forEach(pet => {
        stack.appendChild(buildPetCard(pet));
    });

    attachSwipeGesture(stack.lastElementChild, visible[0]);
}

function buildPetCard(pet) {
    const card = document.createElement("div");
    card.className = "pet-card";
    card.dataset.petId = pet.id;

    const emoji = getSpeciesEmoji(pet.species);
    const images = petImages[pet.id] || [];
    const tags = petTags[pet.id] || [];
    const bgImg = images[0]
        ? `background-image:url('${images[0]}');background-size:cover;background-position:center;`
        : "";

    let tagHtml = "";
    tags.slice(0, 4).forEach(t => {
        tagHtml += `<span class="pet-tag">${t}</span>`;
    });

    card.innerHTML = `
      <div class="pet-card-bg" style="${bgImg}">
        ${!images[0] ? `<span class="pet-card-emoji">${emoji}</span>` : ""}
      </div>
      <div class="pet-card-gradient"></div>
      <div class="swipe-indicator like">LIKE</div>
      <div class="swipe-indicator nope">NOPE</div>
      <div class="pet-card-info">
        <div class="pet-card-name">
          <span>${pet.name}</span>
          ${pet.age ? `<span class="pet-card-age">${pet.age}</span>` : ""}
        </div>
        <div class="pet-card-breed">${pet.species}${pet.breed ? " · " + pet.breed : ""} · ${pet.gender}</div>
        ${tagHtml ? `<div class="pet-card-tags">${tagHtml}</div>` : ""}
        ${pet.bio ? `<div class="pet-card-bio">${pet.bio}</div>` : ""}
      </div>
    `;

    return card;
}

function attachSwipeGesture(card, pet) {
    let startX = 0;
    let curX = 0;
    let dragging = false;

    const ac = new AbortController();
    const sig = { signal: ac.signal };

    card.addEventListener("mousedown", e => {
        dragging = true;
        startX = e.clientX;
        card.style.transition = "none";
    }, sig);

    card.addEventListener("touchstart", e => {
        dragging = true;
        startX = e.touches[0].clientX;
        card.style.transition = "none";
    }, { passive: true, signal: ac.signal });

    window.addEventListener("mousemove", e => {
        if (!dragging) return;
        curX = e.clientX - startX;
        card.style.transform = `translateX(${curX}px) rotate(${curX * 0.07}deg)`;
        const likeEl = card.querySelector(".swipe-indicator.like");
        const nopeEl = card.querySelector(".swipe-indicator.nope");
        const ratio = Math.abs(curX) / 100;
        if (curX > 20) { likeEl.style.opacity = Math.min(ratio, 1); nopeEl.style.opacity = 0; }
        else if (curX < -20) { nopeEl.style.opacity = Math.min(ratio, 1); likeEl.style.opacity = 0; }
        else { likeEl.style.opacity = 0; nopeEl.style.opacity = 0; }
    }, sig);

    window.addEventListener("touchmove", e => {
        if (!dragging) return;
        curX = e.touches[0].clientX - startX;
        card.style.transform = `translateX(${curX}px) rotate(${curX * 0.07}deg)`;
        const likeEl = card.querySelector(".swipe-indicator.like");
        const nopeEl = card.querySelector(".swipe-indicator.nope");
        const ratio = Math.abs(curX) / 100;
        if (curX > 20) { likeEl.style.opacity = Math.min(ratio, 1); nopeEl.style.opacity = 0; }
        else if (curX < -20) { nopeEl.style.opacity = Math.min(ratio, 1); likeEl.style.opacity = 0; }
        else { likeEl.style.opacity = 0; nopeEl.style.opacity = 0; }
    }, { passive: true, signal: ac.signal });

    const finishSwipe = () => {
        if (!dragging) return;
        dragging = false;
        card.style.transition = "";
        ac.abort(); // remove all listeners
        if (curX > 80) doSwipeRight(card, pet);
        else if (curX < -80) doSwipeLeft(card);
        else {
            card.style.transform = "";
            card.querySelectorAll(".swipe-indicator").forEach(i => i.style.opacity = 0);
        }
        curX = 0;
    };

    window.addEventListener("mouseup", finishSwipe, sig);
    window.addEventListener("touchend", finishSwipe, sig);
}

async function doSwipeRight(card, pet) {
    card.classList.add("fly-right");

    setTimeout(async () => {
        removeTopCard();

        if (activePet) {
            try {
                const result = await likePet(activePet.id, pet.id);

                if (result && result.matched) {
                    showMatchPopup(pet, result.match.id);
                }
            } catch (err) {
                console.warn("like failed:", err.message);
            }
        }
    }, 380);
}

function doSwipeLeft(card) {
    card.classList.add("fly-left");
    setTimeout(() => removeTopCard(), 380);
}

function removeTopCard() {
    discoverQueue.shift();

    const next = discoverQueue[2];

    if (next && !petImages[next.id]) {
        getPetImages(next.id).then(imgs => {
            petImages[next.id] = imgs.map(i => i.url);
        }).catch(() => {});

        getPetTags(next.id).then(tags => {
            petTags[next.id] = tags.map(t => t.title);
        }).catch(() => {});
    }

    renderDiscoverStack();
}

function swipeLeft() {
    const stack = document.getElementById("swipe-stack");
    const top = stack.lastElementChild;

    if (!top || !top.classList.contains("pet-card")) return;

    doSwipeLeft(top);
}

function swipeRight() {
    const stack = document.getElementById("swipe-stack");
    const top = stack.lastElementChild;

    if (!top || !top.classList.contains("pet-card")) return;

    doSwipeRight(top, discoverQueue[0]);
}

function superLike() {
    showToast("Super liked!");
    swipeRight();
}

function showMatchPopup(matchedPet, matchId) {
    const popup = document.getElementById("match-popup");

    document.getElementById("match-popup-text").textContent =
        `${activePet?.name || "Your pet"} and ${matchedPet.name} both liked each other!`;

    document.getElementById("popup-avatar-1").textContent = getSpeciesEmoji(activePet?.species || "");
    document.getElementById("popup-avatar-2").textContent = getSpeciesEmoji(matchedPet.species);

    sessionStorage.setItem("pinder_open_chat", matchId);

    popup.classList.remove("hidden");
}

function closeMatchPopup() {
    document.getElementById("match-popup").classList.add("hidden");
    sessionStorage.removeItem("pinder_open_chat");
}

function openMatchChat() {
    window.location.href = "matches.html";
}

function goMatches() {
    window.location.href = "matches.html";
}

function goProfile() {
    window.location.href = "profile.html";
}

async function setupDiscoverPage() {
    if (!getToken()) {
        window.location.href = "index.html";
        return;
    }

    document.body.classList.remove("auth-guard");
    activePet = getActivePet();

    if (activePet) {
        try {
            activePet = await getPet(activePet.id);
            saveActivePet(activePet);
        } catch (e) {}
    }

    await loadDiscoverQueue();
}

setupDiscoverPage();