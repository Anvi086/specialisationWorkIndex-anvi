// Final Instrument - Ripples + Loop + Pitch + Stars
// tapping a planet plays its note, sends ripples, and switches it on/off
// WHERE you tap on the planet changes the pitch (top = higher, bottom = lower)
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

// the notes

// a pentatonic scale, so any note a child picks sounds nice together
const scale = [
  "C2", "D2", "E2", "G2", "A2",
  "C3", "D3", "E3", "G3", "A3",
  "C4", "D4", "E4", "G4", "A4",
  "C5", "D5", "E5", "G5", "A5",
  "C6", "D6", "E6", "G6", "A6"
];

// each planet starts on a different step of the scale (low to high)
const planetBase = {
  mercury: 8,
  venus: 9,
  earth: 10,
  mars: 11,
  jupiter: 12,
  saturn: 13,
  uranus: 14,
  neptune: 15
};

const planetOrder = Object.keys(planetBase); // mercury ... neptune

// how many steps up or down each planet has been pushed (-2 to +2)
const planetOffset = {};
planetOrder.forEach((id) => (planetOffset[id] = 0));

// the pitch slider moves everything up or down in 5 steps (-2 ... +2)
let pitchStep = 0;

// work out the note a planet should play right now
function noteFor(id) {
  // each pitch step moves 3 notes along the scale, so it always stays in key
  let index = planetBase[id] + planetOffset[id] + pitchStep * 3;
  index = Math.max(0, Math.min(scale.length - 1, index));

  return scale[index];
}

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

  // the stars in the background join in
  flashStars(colour);
}

// the twinkling stars

const starsLayer = document.getElementById("stars");
const stars = [];

for (let i = 0; i < 70; i++) {
  const star = document.createElement("div");
  const size = 2 + Math.random() * 3;

  star.className = "star";
  star.style.width = size + "px";
  star.style.height = size + "px";
  star.style.left = Math.random() * 100 + "%";
  star.style.top = Math.random() * 100 + "%";
  star.style.animationDelay = Math.random() * 3 + "s";
  star.style.animationDuration = 2 + Math.random() * 3 + "s";

  // remove the flash once it has finished so it can flash again
  star.addEventListener("animationend", (event) => {
    if (event.animationName === "starFlash") {
      star.classList.remove("flash");
    }
  });

  starsLayer.appendChild(star);
  stars.push(star);
}

// flash a handful of random stars in the planet's colour
function flashStars(colour) {
  for (let i = 0; i < 6; i++) {
    const star = stars[Math.floor(Math.random() * stars.length)];

    star.style.setProperty("--star-colour", colour.trim());
    star.classList.remove("flash");
    void star.getBoundingClientRect(); // restart the animation
    star.classList.add("flash");
  }
}

// where on the planet did the tap land? 0 = very top, 1 = very bottom
function tapHeight(event, planet) {
  const sky = document.getElementById("sky");

  const point = sky.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;

  const svgPoint = point.matrixTransform(sky.getScreenCTM().inverse());

  const cy = Number(planet.getAttribute("cy"));
  const r = Number(planet.getAttribute("r"));

  const fraction = (svgPoint.y - (cy - r)) / (2 * r);
  return Math.max(0, Math.min(1, fraction));
}

// the pitch panel (Lower / Higher buttons + the 5-dot slider)

const pitchWords = ["Lowest", "Low", "Middle", "High", "Highest"];
const pitchStops = document.querySelectorAll(".pitch-stop");
const pitchWord = document.getElementById("pitchWord");
const pitchFill = document.getElementById("pitchFill");

// update the words and dots to match the current pitch
function showPitch() {
  const position = pitchStep + 2; // 0 ... 4

  pitchWord.textContent = pitchWords[position];
  pitchFill.style.width = (position / 4) * 100 + "%";

  pitchStops.forEach((stop, i) => {
    stop.classList.toggle("filled", i <= position);
    stop.classList.toggle("selected", i === position);
  });
}

async function setPitch(step) {
  await Tone.start();
  pitchStep = Math.max(-2, Math.min(2, step));
  showPitch();
  synth.triggerAttackRelease(noteFor("earth"), "8n"); // a quick preview
}

document.getElementById("lowerButton").addEventListener("click", () => setPitch(pitchStep - 1));
document.getElementById("higherButton").addEventListener("click", () => setPitch(pitchStep + 1));

pitchStops.forEach((stop) => {
  stop.addEventListener("click", () => setPitch(Number(stop.dataset.step)));
});

showPitch();

// loop state

const activePlanets = new Set(); // planets switched on
let step = 0;
let playing = false;

// tapping a planet: play note, ripple, and toggle it on/off for the loop

planetOrder.forEach((id) => {
  const planet = document.getElementById(id);

  planet.addEventListener("click", async (event) => {
    await Tone.start(); // safe to call every time

    // tap the top of the planet = higher, tap the bottom = lower
    const height = tapHeight(event, planet);
    planetOffset[id] = Math.round((0.5 - height) * 4); // -2 ... +2

    synth.triggerAttackRelease(noteFor(id), "8n");
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
    loopSynth.triggerAttackRelease(noteFor(id), "16n", time);

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