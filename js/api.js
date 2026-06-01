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

async function register(email, password, firstName, lastName) {
    const response = await fetch(API_URL + "/auth/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email,
            password: password,
            first_name: firstName,
            last_name: lastName
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "Register failed");
    }

    return data;
}

async function login(email, password) {
    const response = await fetch(API_URL + "/auth/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            email: email,
            password: password
        })
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "Login failed");
    }

    setToken(data.access_token);

    return data;
}

async function logout() {
    try {
        await fetch(API_URL + "/auth/logout", {
            method: "POST",
            headers: {
                Authorization: "Bearer " + getToken()
            }
        });
    } catch (e) {
    }

    clearToken();
}

async function getMe() {
    const token = getToken();

    const response = await fetch(API_URL + "/users/me", {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    const text = await response.text();
    return JSON.parse(text);
}

async function discoverPets(limit = 20) {
    const token = getToken();
    const response = await fetch(API_URL + "/pets/discover?limit=" + limit, {
        method: "GET",
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    return await response.json();
}

async function getMyPets() {
    const response = await fetch(API_URL + "/pets/mine", {
        headers: {
            Authorization: "Bearer " + getToken()
        }
    });

    return await response.json();
}

async function createPet(petData) {
    const token = getToken();
    const response = await fetch(API_URL + "/pets", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(petData)
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.detail || "Could not create pet");
    }

    return data;
}

async function updatePet(petId, petData) {
    const response = await fetch(API_URL + "/pets/" + petId, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + getToken()
        },
        body: JSON.stringify(petData)
    });

    return await response.json();
}

async function deletePet(petId) {
    await fetch(API_URL + "/pets/" + petId, {
        method: "DELETE",
        headers: {
            Authorization: "Bearer " + getToken()
        }
    });
}

async function getPet(petId) {
    const response = await fetch(API_URL + "/pets/" + petId, {
        headers: {
            Authorization: "Bearer " + getToken()
        }
    });

    return await response.json();
}

async function addPetImage(petId, url) {
    const response = await fetch(API_URL + "/pets/" + petId + "/images", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + getToken()
        },
        body: JSON.stringify({
            url: url
        })
    });

    return await response.json();
}

async function deletePetImage(petId, imageId) {
    await fetch(API_URL + "/pets/" + petId + "/images/" + imageId, {
        method: "DELETE",
        headers: {
            Authorization: "Bearer " + getToken()
        }
    });
}

async function getPetImages(petId) {
    const response = await fetch(API_URL + "/pets/" + petId + "/images", {
        headers: {
            Authorization: "Bearer " + getToken()
        }
    });

    return await response.json();
}

async function listTags() {
    const response = await fetch(API_URL + "/tags", {
        headers: {
            Authorization: "Bearer " + getToken()
        }
    });

    return await response.json();
}

async function getPetTags(petId) {
    const response = await fetch(API_URL + "/pets/" + petId + "/tags", {
        headers: {
            Authorization: "Bearer " + getToken()
        }
    });

    return await response.json();
}

async function addTagToPet(petId, title) {
    const response = await fetch(API_URL + "/pets/" + petId + "/tags", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + getToken()
        },
        body: JSON.stringify({
            title: title
        })
    });

    return await response.json();
}

async function removeTagFromPet(petId, tagId) {
    await fetch(API_URL + "/pets/" + petId + "/tags/" + tagId, {
        method: "DELETE",
        headers: {
            Authorization: "Bearer " + getToken()
        }
    });
}

async function likePet(likerPetId, likedPetId) {
    const response = await fetch(API_URL + "/pets/" + likerPetId + "/like/" + likedPetId, {
        method: "POST",
        headers: {
            Authorization: "Bearer " + getToken()
        }
    });

    return await response.json();
}

async function unlikePet(likerPetId, likedPetId) {
    await fetch(API_URL + "/pets/" + likerPetId + "/like/" + likedPetId, {
        method: "DELETE",
        headers: {
            Authorization: "Bearer " + getToken()
        }
    });
}

async function getPetMatches(petId) {
    const response = await fetch(API_URL + "/matches/pets/" + petId, {
        headers: {
            Authorization: "Bearer " + getToken()
        }
    });

    return await response.json();
}

async function getMatch(matchId) {
    const response = await fetch(API_URL + "/matches/" + matchId, {
        headers: {
            Authorization: "Bearer " + getToken()
        }
    });

    return await response.json();
}

async function getMessages(matchId, limit = 50) {
    const response = await fetch(API_URL + "/matches/" + matchId + "/messages?limit=" + limit, {
        headers: {
            Authorization: "Bearer " + getToken()
        }
    });

    return await response.json();
}

async function sendMessage(matchId, senderPetId, content) {
    const response = await fetch(API_URL + "/matches/" + matchId + "/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + getToken()
        },
        body: JSON.stringify({
            content: content,
            sender_pet_id: senderPetId
        })
    });

    return await response.json();
}