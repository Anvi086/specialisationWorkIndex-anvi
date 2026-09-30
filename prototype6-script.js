// Prototype 6 - Ripples + Loop
// tapping a planet plays its note, sends ripples, and switches it on/off
// tapping the sun starts/stops a loop that plays the planets that are on

// the intro pop-up modal

const introModal = document.getElementById("introDialog");

const introCloseButton = document.getElementById("introDialogCloseButton");

// Show popup when page opens
introModal.showModal();

// Close popup when OK is clicked
introCloseButton.addEventListener("click", () => {
  introModal.close();
});

// the tone js synths

const synth = new Tone.Synth().toDestination();

// a second synth just for the loop, so it can't clash with manual taps
const loopSynth = new Tone.Synth().toDestination();

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

// each planet plays a different note

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

// loop state

const planetOrder = Object.keys(planetNotes); // mercury ... neptune
const activePlanets = new Set();              // planets switched on
let step = 0;
let playing = false;

// tapping a planet: play note, ripple, and toggle it on/off for the loop

Object.entries(planetNotes).forEach(([id, note]) => {
  const planet = document.getElementById(id);

  planet.addEventListener("click", async () => {
    await Tone.start(); // safe to call every time
    synth.triggerAttackRelease(note, "8n");
    ripplePlanet(planet);

    if (activePlanets.has(id)) {
      activePlanets.delete(id);
      planet.classList.remove("on");
    } else {
      activePlanets.add(id);
      planet.classList.add("on");
    }
  });
});

// the loop: one planet per step, plays it only if it is switched on

const loop = new Tone.Loop((time) => {
  const id = planetOrder[step % planetOrder.length];

  if (activePlanets.has(id)) {
    loopSynth.triggerAttackRelease(planetNotes[id], "16n", time);

    // draw the ripple at the moment the sound plays
    Tone.Draw.schedule(() => {
      ripplePlanet(document.getElementById(id));
    }, time);
  }

  step++;
}, "8n");

loop.start(0);

// the sun is the start/stop button

const sun = document.getElementById("sun");

sun.addEventListener("click", async () => {
  await Tone.start();

  if (!playing) {
    Tone.Transport.start();
  } else {
    Tone.Transport.stop();
    step = 0; // start from Mercury next time
  }

  playing = !playing;
  sun.classList.toggle("playing", playing);
  ripplePlanet(sun);
});