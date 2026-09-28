console.log(Tone);

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

// i added event listeners to each planet to play a different note when clicked

document.getElementById("mercury").addEventListener("click", () => {
    synth.triggerAttackRelease("C4", "8n");
});

document.getElementById("venus").addEventListener("click", () => {
    synth.triggerAttackRelease("D4", "8n");
});

document.getElementById("earth").addEventListener("click", () => {
    synth.triggerAttackRelease("E4", "8n");
});

document.getElementById("mars").addEventListener("click", () => {
    synth.triggerAttackRelease("F4", "8n");
});

document.getElementById("jupiter").addEventListener("click", () =>{
    synth.triggerAttackRelease("G4", "8n");
});

document.getElementById("saturn").addEventListener("click", () => {
    synth.triggerAttackRelease("A4", "8n");
});

document.getElementById("uranus").addEventListener("click", () => {
    synth.triggerAttackRelease("B4", "8n");
});

document.getElementById("neptune").addEventListener("click", () => {
    synth.triggerAttackRelease("C5", "8n");
});

