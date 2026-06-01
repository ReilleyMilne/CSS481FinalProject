let activePet = null;
let petImages = [];
let petTags = [];
let editMode = false;

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

    setTimeout(() => el.classList.remove("show"), 2800);
}

function showError(msg) {
    const el = document.getElementById("profile-error");

    if (!el) return;

    el.textContent = msg;
    el.classList.remove("hidden");

    setTimeout(() => el.classList.add("hidden"), 4000);
}

function getSpeciesEmoji(species) {
    return (species || "Pet").charAt(0).toUpperCase();
}

function renderProfile() {
    if (!activePet) return;

    document.getElementById("profile-emoji").textContent = getSpeciesEmoji(activePet.species);
    document.getElementById("profile-name").textContent = activePet.name;
    document.getElementById("profile-breed").textContent =
        `${activePet.species}${activePet.breed ? " · " + activePet.breed : ""}`;
    document.getElementById("profile-meta").textContent =
        `${activePet.age ? activePet.age + " yrs · " : ""}${activePet.weight} lbs · ${activePet.gender}`;
    document.getElementById("profile-bio").textContent = activePet.bio || "No bio yet.";

    const tagsEl = document.getElementById("profile-tags");

    if (petTags.length > 0) {
        tagsEl.innerHTML = "";

        petTags.forEach(t => {
            tagsEl.innerHTML += `<span class="pet-tag-badge">${t.title}</span>`;
        });
    } else {
        tagsEl.innerHTML = '<span style="color:var(--text-muted);font-size:13px">No tags yet</span>';
    }

    document.getElementById("profile-activity").textContent = activePet.favorite_activity || "-";
    document.getElementById("profile-food").textContent = activePet.favorite_food || "-";
    document.getElementById("profile-trait").textContent = activePet.personality_trait || "-";

    const imgEl = document.getElementById("profile-images");

    if (petImages.length > 0) {
        imgEl.innerHTML = "";

        petImages.forEach(img => {
            imgEl.innerHTML += `
                <div class="profile-image-item">
                    <img src="${img.url}" alt="Pet photo" />
                    <button class="img-delete-btn" onclick="deleteImage('${img.id}')" title="Remove photo">✕</button>
                </div>
            `;
        });
    } else {
        imgEl.innerHTML = '<p style="color:var(--text-muted);font-size:13px">No photos yet.</p>';
    }
}

function toggleEdit() {
    editMode = !editMode;

    document.getElementById("view-mode").classList.toggle("hidden", editMode);
    document.getElementById("edit-mode").classList.toggle("hidden", !editMode);

    if (editMode) {
        document.getElementById("edit-name").value = activePet.name || "";
        document.getElementById("edit-species").value = activePet.species || "";
        document.getElementById("edit-breed").value = activePet.breed || "";
        document.getElementById("edit-age").value = activePet.age || "";
        document.getElementById("edit-weight").value = activePet.weight || "";
        document.getElementById("edit-gender").value = activePet.gender || "";
        document.getElementById("edit-bio").value = activePet.bio || "";
        document.getElementById("edit-activity").value = activePet.favorite_activity || "";
        document.getElementById("edit-food").value = activePet.favorite_food || "";
        document.getElementById("edit-trait").value = activePet.personality_trait || "";
    }
}

async function saveEdit() {
    const btn = document.getElementById("save-edit-btn");

    btn.disabled = true;
    btn.textContent = "Saving…";

    const updates = {
        name: document.getElementById("edit-name").value.trim() || null,
        species: document.getElementById("edit-species").value.trim() || null,
        breed: document.getElementById("edit-breed").value.trim() || null,
        age: document.getElementById("edit-age").value || null,
        weight: document.getElementById("edit-weight").value || null,
        gender: document.getElementById("edit-gender").value || null,
        bio: document.getElementById("edit-bio").value.trim() || null,
        favorite_activity: document.getElementById("edit-activity").value.trim() || null,
        favorite_food: document.getElementById("edit-food").value.trim() || null,
        personality_trait: document.getElementById("edit-trait").value.trim() || null,
    };

    // remove nulls
    Object.keys(updates).forEach(k => {
        if (updates[k] === null) delete updates[k];
    });

    try {
        activePet = await updatePet(activePet.id, updates);
        saveActivePet(activePet);
        renderProfile();
        toggleEdit();
        showToast("Profile updated!");
    } catch (err) {
        showError(err.message || "Could not save changes.");
    }

    btn.disabled = false;
    btn.textContent = "Save Changes";
}

async function addImage() {
    const url = document.getElementById("new-image-url").value.trim();

    if (!url) {
        showToast("Enter an image URL first.");
        return;
    }

    try {
        const img = await addPetImage(activePet.id, url);
        petImages.push(img);
        document.getElementById("new-image-url").value = "";
        renderProfile();
        showToast("Photo added!");
    } catch (err) {
        showError(err.message || "Could not add image.");
    }
}

async function deleteImage(imageId) {
    try {
        await deletePetImage(activePet.id, imageId);
        petImages = petImages.filter(i => i.id !== imageId);
        renderProfile();
        showToast("Photo removed.");
    } catch (err) {
        showError(err.message || "Could not remove image.");
    }
}

async function addTag() {
    const input = document.getElementById("new-tag-input");
    const title = input.value.trim();

    if (!title) {
        showToast("Enter a tag name.");
        return;
    }

    try {
        const tag = await addTagToPet(activePet.id, title);
        petTags.push(tag);
        input.value = "";
        renderProfile();
        showToast("Tag added!");
    } catch (err) {
        showError(err.message || "Could not add tag.");
    }
}

async function removeTag(tagId) {
    try {
        await removeTagFromPet(activePet.id, tagId);
        petTags = petTags.filter(t => t.id !== tagId);
        renderProfile();
        showToast("Tag removed.");
    } catch (err) {
        showError(err.message || "Could not remove tag.");
    }
}

async function logoutUser() {
    await logout();
    clearStorage();
    window.location.href = "index.html";
}

function goDiscover() {
    window.location.href = "discover.html";
}

function goMatches() {
    window.location.href = "matches.html";
}

async function setupProfilePage() {
    if (!getToken()) {
        window.location.href = "index.html";
        return;
    }

    document.body.classList.remove("auth-guard");
    activePet = getActivePet();

    if (!activePet) {
        window.location.href = "create-pet.html";
        return;
    }

    try {
        const petData = await getPet(activePet.id);
        const imgData = await getPetImages(activePet.id);
        const tagData = await getPetTags(activePet.id);

        activePet = petData;
        petImages = imgData;
        petTags = tagData;

        saveActivePet(activePet);
    } catch (e) {}

    renderProfile();
}

setupProfilePage();