// Prototype 3 - Ripples
// tapping a planet plays its note AND sends ripples spreading out from it

// the intro pop-up modal

const introModal = document.getElementById("introDialog");

const introCloseButton = document.getElementById(
    "introDialogCloseButton"
);

// Show popup when page opens
introModal.showModal();

// Close popup when OK is clicked
introCloseButton.addEventListener("click", () => {
    introModal.close();
});

// the tone js synth for the planets

const synth = new Tone.Synth().toDestination();

// the ripple feedback

function ripplePlanet(planet) {
    const sky = document.getElementById("sky");

    // read this planet's colour from the CSS
    const colour = getComputedStyle(planet).getPropertyValue("--glow-halo");

    // make 3 rings, each starting a little later than the last
    for (let i = 0; i < 3; i++) {
        const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");

        ring.setAttribute("cx", planet.getAttribute("cx"));
        ring.setAttribute("cy", planet.getAttribute("cy"));
        ring.setAttribute("r", planet.getAttribute("r"));
        ring.setAttribute("class", "ripple");

        ring.style.stroke = colour;
        ring.style.animationDelay = i * 0.25 + "s";

        // tidy up once the ring has faded out
        ring.addEventListener("animationend", () => ring.remove());

        sky.appendChild(ring);
    }
}

// each planet plays a different note and ripples when clicked

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

    planet.addEventListener("click", async () => {
        await Tone.start(); // safe to call every time
        synth.triggerAttackRelease(note, "8n");
        ripplePlanet(planet);
    });
});

// the sun has no note, it just ripples
const sun = document.getElementById("sun");

sun.addEventListener("click", () => {
    ripplePlanet(sun);
});