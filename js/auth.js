let onLoginView = true;

function showError(message) {
    const error = document.getElementById("auth-error");
    error.textContent = message;
    error.classList.remove("hidden");
}

function clearError() {
    document.getElementById("auth-error").classList.add("hidden");
}

function showRegister() {
    clearError();

    document.getElementById("login-form").classList.add("hidden");
    document.getElementById("register-form").classList.remove("hidden");

    onLoginView = false;
}

function showLogin() {
    clearError();

    document.getElementById("register-form").classList.add("hidden");
    document.getElementById("login-form").classList.remove("hidden");

    onLoginView = true;
}

async function submitLogin() {
    clearError();

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;

    if (!email || !password) {
        showError("Please fill in all fields");
        return;
    }

    const button = document.getElementById("login-btn");

    button.disabled = true;
    button.textContent = "Loading...";

    try {
        await login(email, password);

        const user = await getMe();
        saveUser(user);

        const pets = await getMyPets();

        if (pets && pets.length > 0) {
            savePet(pets[0]);
            window.location.href = "discover.html";
        } else {
            window.location.href = "create-pet.html";
        }

    } catch (error) {
        showError(error.message || "Login failed");
        button.disabled = false;
        button.textContent = "Sign In";
    }
}

async function submitRegister() {
    clearError();

    const firstName = document.getElementById("reg-firstname").value.trim();
    const lastName = document.getElementById("reg-lastname").value.trim();
    const email = document.getElementById("reg-email").value.trim();
    const password = document.getElementById("reg-password").value;

    if (!firstName || !lastName || !email || !password) {
        showError("Please fill in all fields");
        return;
    }

    const button = document.getElementById("register-btn");

    button.disabled = true;
    button.textContent = "Loading...";

    try {
        await register(email, password, firstName, lastName);

        await login(email, password);

        const user = await getMe();

        saveUser(user);

        window.location.href = "create-pet.html";

    } catch (error) {
        showError(error.message || "Registration failed");
        button.disabled = false;
        button.textContent = "Create Account";
    }
}

async function init() {
    if (getToken()) {
        try {
            await getMe();
            window.location.href = getSavedPet() ? "discover.html" : "create-pet.html";
        } catch (e) {
            clearToken();
            clearStorage();
        }
    }
}

init();