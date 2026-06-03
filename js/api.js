const API_URL = "https://481-backend-production.up.railway.app";

function getToken() {
    return localStorage.getItem("pinder_token");
}

function setToken(token) {
    localStorage.setItem("pinder_token", token);
}

function clearToken() {
    localStorage.removeItem("pinder_token");
}

async function apiFetch(path, options = {}) {
    const token = getToken();
    const headers = { ...(options.headers || {}) };
    if (token) headers["Authorization"] = "Bearer " + token;

    const response = await fetch(API_URL + path, { ...options, headers });

    if (response.status === 401) {
        clearToken();
        clearStorage();
        window.location.href = "index.html";
        throw new Error("Session expired. Please sign in again.");
    }

    return response;
}

async function register(email, password, firstName, lastName) {
    const response = await fetch(API_URL + "/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, first_name: firstName, last_name: lastName })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Register failed");
    return data;
}

async function login(email, password) {
    const response = await fetch(API_URL + "/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Login failed");
    setToken(data.access_token);
    return data;
}

async function logout() {
    try {
        await apiFetch("/auth/logout", { method: "POST" });
    } catch (e) {}
    clearToken();
}

async function getMe() {
    const response = await apiFetch("/users/me");
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Could not fetch user");
    return data;
}

async function discoverPets(limit = 20) {
    const response = await apiFetch("/pets/discover?limit=" + limit);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Could not fetch pets");
    return data;
}

async function getMyPets() {
    const response = await apiFetch("/pets/mine");
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Could not fetch your pets");
    return data;
}

async function createPet(petData) {
    const response = await apiFetch("/pets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(petData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Could not create pet");
    return data;
}

async function updatePet(petId, petData) {
    const response = await apiFetch("/pets/" + petId, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(petData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Could not update pet");
    return data;
}

async function deletePet(petId) {
    await apiFetch("/pets/" + petId, { method: "DELETE" });
}

async function getPet(petId) {
    const response = await apiFetch("/pets/" + petId);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Could not fetch pet");
    return data;
}

async function addPetImage(petId, fileOrDataUrl) {
    let file;
    if (typeof fileOrDataUrl === "string") {
        const res = await fetch(fileOrDataUrl);
        const blob = await res.blob();
        file = new File([blob], "photo.jpg", { type: blob.type || "image/jpeg" });
    } else {
        file = fileOrDataUrl;
    }

    const formData = new FormData();
    formData.append("file", file);

    const response = await apiFetch("/pets/" + petId + "/images", {
        method: "POST",
        body: formData
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Could not add image");
    return data;
}

async function deletePetImage(petId, imageId) {
    await apiFetch("/pets/" + petId + "/images/" + imageId, { method: "DELETE" });
}

async function getPetImages(petId) {
    const response = await apiFetch("/pets/" + petId + "/images");
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Could not fetch images");
    return data;
}

async function listTags() {
    const response = await apiFetch("/tags");
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Could not fetch tags");
    return data;
}

async function getPetTags(petId) {
    const response = await apiFetch("/pets/" + petId + "/tags");
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Could not fetch tags");
    return data;
}

async function addTagToPet(petId, title) {
    const response = await apiFetch("/pets/" + petId + "/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Could not add tag");
    return data;
}

async function removeTagFromPet(petId, tagId) {
    await apiFetch("/pets/" + petId + "/tags/" + tagId, { method: "DELETE" });
}

async function likePet(likerPetId, likedPetId) {
    const response = await apiFetch("/pets/" + likerPetId + "/like/" + likedPetId, {
        method: "POST"
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Could not like pet");
    return data;
}

async function unlikePet(likerPetId, likedPetId) {
    await apiFetch("/pets/" + likerPetId + "/like/" + likedPetId, { method: "DELETE" });
}

async function getPetMatches(petId) {
    const response = await apiFetch("/matches/pets/" + petId);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Could not fetch matches");
    return data;
}

async function getMatch(matchId) {
    const response = await apiFetch("/matches/" + matchId);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Could not fetch match");
    return data;
}

async function getMessages(matchId, limit = 50) {
    const response = await apiFetch("/matches/" + matchId + "/messages?limit=" + limit);
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Could not fetch messages");
    return data;
}

async function sendMessage(matchId, senderPetId, content) {
    const response = await apiFetch("/matches/" + matchId + "/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, sender_pet_id: senderPetId })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Could not send message");
    return data;
}