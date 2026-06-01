const USER_KEY = "pinder_user";
const PET_KEY = "pinder_activePet";

function saveUser(user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function getUser() {
    const user = localStorage.getItem(USER_KEY);

    if (!user) {
        return null;
    }

    return JSON.parse(user);
}

function saveActivePet(pet) {
    localStorage.setItem(PET_KEY, JSON.stringify(pet));
}

function getActivePet() {
    const pet = localStorage.getItem(PET_KEY);

    if (!pet) {
        return null;
    }

    return JSON.parse(pet);
}

function removeActivePet() {
    localStorage.removeItem(PET_KEY);
}

function clearStorage() {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(PET_KEY);
}