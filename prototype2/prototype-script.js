console.log("Prototype 2 JS loaded");

document.addEventListener("DOMContentLoaded", () => {

    // INTRO POPUP
    const introModal = document.getElementById("introDialog");
    const introCloseButton = document.getElementById("introDialogCloseButton");

    introModal.showModal();

    // attached first so the OK button still works if Tone.js fails to load
    introCloseButton.addEventListener("click", async () => {
        try {
            await Tone.start();
        } catch (error) {
            console.error("Audio could not start:", error);
        }
        introModal.close();
    });

    // TONE.JS SYNTH
    const synth = new Tone.Synth().toDestination();

    // Close popup and start audio
    introCloseButton.addEventListener("click", async () => {

        await Tone.start();

        console.log("Audio state:", Tone.context.state);

        introModal.close();
    });


    // GLOW FUNCTION
    function glowPlanet(planet) {
        planet.classList.remove("glow");

        void planet.getBoundingClientRect();

        planet.classList.add("glow");
    }


    // REMOVE GLOW AFTER ANIMATION
    document.querySelectorAll("#sky circle").forEach((planet) => {

        planet.addEventListener("animationend", () => {
            planet.classList.remove("glow");
        });

    });


    // PLANET NOTES
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


    // PLANET CLICK
    Object.entries(planetNotes).forEach(([id, note]) => {

        const planet = document.getElementById(id);

        planet.addEventListener("click", async () => {

            await Tone.start();

            synth.triggerAttackRelease(note, "8n");

            glowPlanet(planet);
        });

    });


    // SUN
    const sun = document.getElementById("sun");

    sun.addEventListener("click", () => {
        glowPlanet(sun);
    });

});