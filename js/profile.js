let activePet = null;
let petImages = [];
let petTags = [];
let pendingTagsToRemove = [];
let pendingImagesToRemove = [];
let hasUnsavedChanges = false;

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
    setTimeout(() => el.classList.remove("show"), 2800);
}

function showError(msg) {
    const el = document.getElementById("profile-error");
    if (!el) return;
    el.textContent = msg;
    el.classList.remove("hidden");
    setTimeout(() => el.classList.add("hidden"), 4000);
}

function markDirty(fieldId) {
    if (fieldId) document.getElementById(fieldId).classList.remove("inline-field--invalid");
    if (!hasUnsavedChanges) {
        hasUnsavedChanges = true;
        document.getElementById("save-btn").classList.remove("hidden");
    }
}

function onFieldChange(fieldId) { markDirty(fieldId); }

function resetSaveState() {
    hasUnsavedChanges = false;
    pendingTagsToRemove = [];
    pendingImagesToRemove = [];
    document.getElementById("save-btn").classList.add("hidden");
}

function speciesIcon(species) {
    return (species || "Pet").charAt(0).toUpperCase();
}

function refreshTagsAndPhotos() {
    const tagsEl = document.getElementById("profile-tags");
    if (petTags.length > 0) {
        tagsEl.innerHTML = "";
        petTags.forEach(t => {
            const pendingStyle = t._pending ? ' style="opacity:0.6"' : '';
            tagsEl.innerHTML += `<span class="pet-tag-badge"${pendingStyle}>${t.title} <button onclick="removeTag('${t.id}')" style="background:none;border:none;cursor:pointer;margin-left:4px;color:var(--text-muted)">✕</button></span>`;
        });
    } else {
        tagsEl.innerHTML = '<span style="color:var(--text-muted);font-size:13px">No tags yet</span>';
    }

    const atLimit = petTags.length >= TAG_LIMIT;
    const tagInput = document.getElementById("new-tag-input");
    const tagAddBtn = tagInput && tagInput.closest(".add-row") && tagInput.closest(".add-row").querySelector(".btn-secondary");
    if (tagInput)  { tagInput.disabled = atLimit; tagInput.placeholder = atLimit ? `Limit of ${TAG_LIMIT} tags reached` : "Add a tag..."; }
    if (tagAddBtn) { tagAddBtn.disabled = atLimit; }

    const imgEl = document.getElementById("profile-images");
    if (petImages.length > 0) {
        imgEl.innerHTML = "";
        petImages.forEach(img => {
            const pendingStyle = img._pending ? ' style="opacity:0.6"' : '';
            imgEl.innerHTML += `
                <div class="profile-image-item"${pendingStyle}>
                    <img src="${img.url}" alt="Pet photo" />
                    <button class="img-delete-btn" onclick="removeImage('${img.id}')" title="Remove photo">✕</button>
                </div>`;
        });
    } else {
        imgEl.innerHTML = '<p style="color:var(--text-muted);font-size:13px">No photos yet.</p>';
    }
}

function refreshProfile() {
    if (!activePet) return;

    document.getElementById("profile-emoji").textContent = speciesIcon(activePet.species);
    document.getElementById("profile-name").textContent = activePet.name;
    document.getElementById("profile-breed").textContent =
        `${activePet.species}${activePet.breed ? " · " + activePet.breed : ""}`;

    document.getElementById("edit-name").value     = activePet.name || "";
    document.getElementById("edit-species").value  = activePet.species || "";
    document.getElementById("edit-breed").value    = activePet.breed || "";
    document.getElementById("edit-age").value      = activePet.age ?? "";
    document.getElementById("edit-weight").value   = activePet.weight ?? "";
    document.getElementById("edit-gender").value   = activePet.gender || "male";
    document.getElementById("edit-activity").value = activePet.favorite_activity || "";
    document.getElementById("edit-food").value     = activePet.favorite_food || "";
    document.getElementById("edit-trait").value    = activePet.personality_trait || "";
    document.getElementById("edit-bio").value      = activePet.bio || "";

    refreshTagsAndPhotos();
    resetSaveState();
}

function markFieldError(id, invalid) {
    document.getElementById(id).classList.toggle("inline-field--invalid", invalid);
}

function validate() {
    const name    = document.getElementById("edit-name").value.trim();
    const species = document.getElementById("edit-species").value.trim();
    const ageRaw  = document.getElementById("edit-age").value;
    const wtRaw   = document.getElementById("edit-weight").value;
    const age     = ageRaw !== "" ? parseFloat(ageRaw) : null;
    const weight  = wtRaw  !== "" ? parseFloat(wtRaw)  : null;

    const nameInvalid    = name.length === 0;
    const speciesInvalid = species.length === 0;
    const ageInvalid     = age !== null && (isNaN(age) || age < 0);
    const weightInvalid  = weight !== null && (isNaN(weight) || weight <= 0);

    markFieldError("edit-name",    nameInvalid);
    markFieldError("edit-species", speciesInvalid);
    markFieldError("edit-age",     ageInvalid);
    markFieldError("edit-weight",  weightInvalid);

    const errors = [];
    if (nameInvalid || speciesInvalid) errors.push("Please fill out the required fields");
    if (ageInvalid)     errors.push("Age cannot be negative");
    if (weightInvalid)  errors.push("Weight must be greater than 0");

    return errors;
}

function setSaving(isSaving) {
    const btn = document.getElementById("save-btn");
    if (!btn) return;
    btn.disabled = isSaving;
    btn.classList.toggle("btn--saving", isSaving);
}

async function save(ev) {
    if (ev) ev.preventDefault();
    const errors = validate();
    if (errors.length > 0) {
        showError(errors[0]);
        return;
    }

    setSaving(true);

    try {
        const updates = {
            name:               document.getElementById("edit-name").value.trim(),
            species:            document.getElementById("edit-species").value.trim(),
            breed:              document.getElementById("edit-breed").value.trim() || null,
            age:                document.getElementById("edit-age").value !== "" ? parseFloat(document.getElementById("edit-age").value) : null,
            weight:             document.getElementById("edit-weight").value !== "" ? parseFloat(document.getElementById("edit-weight").value) : null,
            gender:             document.getElementById("edit-gender").value || null,
            bio:                document.getElementById("edit-bio").value.trim() || null,
            favorite_activity:  document.getElementById("edit-activity").value.trim() || null,
            favorite_food:      document.getElementById("edit-food").value.trim() || null,
            personality_trait:  document.getElementById("edit-trait").value.trim() || null,
        };
        Object.keys(updates).forEach(k => { if (updates[k] === null) delete updates[k]; });
        activePet = await updatePet(activePet.id, updates);
        savePet(activePet);

        for (const tagId of pendingTagsToRemove) {
            try { await removeTagFromPet(activePet.id, tagId); } catch (_) {}
        }

        const savedTags = [];
        for (const tag of petTags) {
            if (tag._pending) {
                try {
                    const saved = await addTagToPet(activePet.id, tag.title);
                    savedTags.push(saved);
                } catch (_) {
                    savedTags.push(tag);
                }
            } else {
                savedTags.push(tag);
            }
        }
        petTags = savedTags;

        for (const imageId of pendingImagesToRemove) {
            try { await deletePetImage(activePet.id, imageId); } catch (_) {}
        }

        const savedImages = [];
        for (const img of petImages) {
            if (img._pending && img._file) {
                try {
                    const saved = await addPetImage(activePet.id, img._file);
                    URL.revokeObjectURL(img.url);
                    savedImages.push(saved);
                } catch (_) {
                    savedImages.push(img);
                }
            } else {
                savedImages.push(img);
            }
        }
        petImages = savedImages;

        setSaving(false);
        refreshProfile();
        notify("Saved!");
    } catch (err) {
        setSaving(false);
        showError(err.message || "Could not save changes.");
    }
}

function onPhotoAdded(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { notify("Please select an image file."); return; }

    const localUrl = URL.createObjectURL(file);
    const tempId = "pending_" + Date.now();
    petImages.push({ id: tempId, url: localUrl, _pending: true, _file: file });

    document.getElementById("new-image-file").value = "";
    refreshTagsAndPhotos();
    markDirty(null);
}

function removeImage(imageId) {
    const img = petImages.find(i => i.id === imageId);
    if (!img) return;

    if (!img._pending) {
        pendingImagesToRemove.push(imageId);
    } else {
        URL.revokeObjectURL(img.url);
    }

    petImages = petImages.filter(i => i.id !== imageId);
    refreshTagsAndPhotos();
    markDirty(null);
}

const TAG_LIMIT = 4;

function addTag() {
    const input = document.getElementById("new-tag-input");
    const title = input.value.trim();
    if (!title) { notify("Enter a tag name."); return; }

    if (petTags.length >= TAG_LIMIT) {
        notify(`Maximum ${TAG_LIMIT} tags.`);
        return;
    }

    const duplicate = petTags.some(t => t.title.toLowerCase() === title.toLowerCase());
    if (duplicate) { notify("Tag already added."); return; }

    const tempId = "pending_" + Date.now();
    petTags.push({ id: tempId, title, _pending: true });

    input.value = "";
    refreshTagsAndPhotos();
    markDirty(null);
}

function removeTag(tagId) {
    const tag = petTags.find(t => t.id === tagId);
    if (!tag) return;

    if (!tag._pending) {
        pendingTagsToRemove.push(tagId);
    }

    petTags = petTags.filter(t => t.id !== tagId);
    refreshTagsAndPhotos();
    markDirty(null);
}

async function signOut() {
    await logout();
    clearStorage();
    window.location.href = "index.html";
}

function goDiscover() { window.location.href = "discover.html"; }
function goMatches()  { window.location.href = "matches.html"; }

async function init() {
    if (!getToken()) { window.location.href = "index.html"; return; }

    document.body.classList.remove("auth-guard");
    activePet = getSavedPet();

    if (!activePet) { window.location.href = "create-pet.html"; return; }

    try {
        const [petData, imgData, tagData] = await Promise.all([
            getPet(activePet.id),
            getPetImages(activePet.id),
            getPetTags(activePet.id),
        ]);
        activePet  = petData;
        petImages  = imgData;
        petTags    = tagData;
        savePet(activePet);
    } catch (_) {}

    refreshProfile();

    const editFieldIds = [
        "edit-name", "edit-species", "edit-breed", "edit-age",
        "edit-weight", "edit-gender", "edit-activity", "edit-food",
        "edit-trait", "edit-bio"
    ];
    editFieldIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener("input", () => markDirty(id));
        if (el && el.tagName === "SELECT") el.addEventListener("change", () => markDirty(id));
    });

    const saveBtn = document.getElementById("save-btn");
    if (saveBtn) {
        saveBtn.addEventListener("click", save);
        saveBtn.type = "button";
    }
    const profileForm = saveBtn && saveBtn.closest("form");
    if (profileForm) {
        profileForm.addEventListener("submit", ev => { ev.preventDefault(); save(ev); });
    }
}

init();