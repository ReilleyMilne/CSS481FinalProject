let petGender = "male";
let selectedTraits = [];
let currentStep = 1;

function showError(message) {
    const error = document.getElementById("create-error");

    error.textContent = message;
    error.classList.remove("hidden");

    setTimeout(() => {
        error.classList.add("hidden");
    }, 4000);
}

function showToast(message) {
    let toast = document.getElementById("pinder-toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "pinder-toast";
        toast.className = "toast";
        document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}

function changeStep(step) {
    if (currentStep === 1 && step === 2) {
        const name = document.getElementById("pet-name").value.trim();
        const species = document.getElementById("pet-species").value.trim();
        const weight = document.getElementById("pet-weight").value;
        const age = document.getElementById("pet-age").value;

        if (!name || !species || !weight || !age) {
            showError("Please fill out the required fields");
            return;
        }

        if (parseFloat(weight) <= 0) {
            showError("Weight must be greater than 0");
            return;
        }
        if (parseFloat(age) < 0) {
            showError("Age cannot be negative");
            return;
        }
    }

    currentStep = step;

    for (let i = 1; i <= 3; i++) {
        document.getElementById("step-" + i).classList.remove("active");
        document.getElementById("dot-" + i).classList.remove("active");
    }

    document.getElementById("step-" + step).classList.add("active");
    document.getElementById("dot-" + step).classList.add("active");

    if (step === 3) {
        updateSummary();
    }
}

function selectGender(button) {
    document.querySelectorAll("#gender-group .toggle-btn").forEach(btn => {
        btn.classList.remove("active");
    });

    button.classList.add("active");
    petGender = button.dataset.value;
}

function toggleTrait(button) {
    const trait = button.dataset.trait;

    if (button.classList.contains("selected")) {
        button.classList.remove("selected");

        selectedTraits = selectedTraits.filter(t => t !== trait);
    } else {
        if (selectedTraits.length >= 4) {
            showToast("Maximum 4 traits");
            return;
        }

        button.classList.add("selected");
        selectedTraits.push(trait);
    }
}

function updateSummary() {
    const name = document.getElementById("pet-name").value;
    const species = document.getElementById("pet-species").value;
    const breed = document.getElementById("pet-breed").value;
    const age = document.getElementById("pet-age").value;
    const weight = document.getElementById("pet-weight").value;

    document.getElementById("confirm-name").textContent = name;

    document.getElementById("confirm-meta").textContent =
        species +
        (breed ? " • " + breed : "") +
        " • " +
        age +
        " years" +
        " • " +
        weight +
        " lbs" +
        " • " +
        petGender;

    const traitsContainer = document.getElementById("confirm-traits");

    if (selectedTraits.length === 0) {
        traitsContainer.innerHTML = "No traits selected";
        return;
    }

    traitsContainer.innerHTML = "";

    selectedTraits.forEach(trait => {
        traitsContainer.innerHTML +=
            `<span class="confirm-trait">${trait}</span>`;
    });
}

async function savePetProfile() {
    const button = document.getElementById("save-btn");

    button.disabled = true;
    button.textContent = "Saving...";

    const petData = {
        name: document.getElementById("pet-name").value.trim(),
        species: document.getElementById("pet-species").value.trim(),
        breed: document.getElementById("pet-breed").value.trim() || null,
        gender: petGender,
        age: parseFloat(document.getElementById("pet-age").value),
        weight: parseFloat(document.getElementById("pet-weight").value),
        favorite_food: document.getElementById("pet-fav-food").value.trim() || null,
        favorite_activity: document.getElementById("pet-fav-activity").value.trim() || null,
        personality_trait: selectedTraits.join(", "),
        bio: document.getElementById("pet-bio").value.trim() || null
    };

    try {
        const pet = await createPet(petData);

        for (let trait of selectedTraits) {
            try {
                await addTagToPet(pet.id, trait);
            } catch (e) {
            }
        }

        const imageUrl =
            document.getElementById("pet-image-url").value.trim();

        if (imageUrl) {
            try {
                await addPetImage(pet.id, imageUrl);
            } catch (e) {
            }
        }

        saveActivePet(pet);
        showToast("Profile created");

        setTimeout(() => {
            window.location.href = "discover.html";
        }, 700);

    } catch (error) {
        showError(error.message || "Could not save pet");
    }

    button.disabled = false;
    button.textContent = "Create Profile";
}

function skipPetCreation() {
    window.location.href = "discover.html";
}

function setupCreatePetPage() {
    if (!getToken()) {
        window.location.href = "index.html";
        return;
    }

    document.body.classList.remove("auth-guard");
    document.getElementById("gender-group").addEventListener("click", e => {
        const button = e.target.closest(".toggle-btn");

        if (button) {
            selectGender(button);
        }
    });

    document.getElementById("trait-chips").addEventListener("click", e => {
        const button = e.target.closest(".chip");

        if (button) {
            toggleTrait(button);
        }
    });
}

setupCreatePetPage();