// Prototype 4 - Glow
// tapping a planet plays its note AND makes it glow (visual feedback)

// the intro pop-up modal

const introModal = document.getElementById("introDialog");

const introCloseButton = document.getElementById(
    "introDialogCloseButton"
);

// Show popup when page opens
introModal.showModal();

// Close popup when OK is clicked
introCloseButton.addEventListener("click", async () => {
    await Tone.start(); // browsers need a click before audio can play
    introModal.close();
});

// the tone js synth for the planets

const synth = new Tone.Synth().toDestination();

// the glow feedback

function glowPlanet(planet) {
    // restart the animation if the planet is tapped again quickly
    planet.classList.remove("glow");
    void planet.getBoundingClientRect();
    planet.classList.add("glow");
}

// remove the glow class once the animation has finished
document.querySelectorAll("#sky circle").forEach((planet) => {
    planet.addEventListener("animationend", () => {
        planet.classList.remove("glow");
    });
});

// each planet plays a different note and glows when clicked

const planetNotes = {
    mercury: "C4",
    venus: "D4",
    earth: "E4",
    mars: "F4",
    jupiter: "G4",
    saturn: "A4",
    uranus: "B4",
    neptune: "C5"
};

Object.entries(planetNotes).forEach(([id, note]) => {
    const planet = document.getElementById(id);

    planet.addEventListener("click", () => {
        synth.triggerAttackRelease(note, "8n");
        glowPlanet(planet);
    });
});

// the sun has no note, it just glows
const sun = document.getElementById("sun");

sun.addEventListener("click", () => {
    glowPlanet(sun);
});