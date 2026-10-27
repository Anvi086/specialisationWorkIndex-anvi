// Final Instrument - Ripples + Loop + Pitch + Stars
// tapping a planet plays its note, sends ripples, and switches it on/off
// WHERE you tap on the planet changes the pitch (top = higher, bottom = lower)
// tapping the sun starts/stops a loop that plays the planets that are on

// the intro pop-up modal

// grab the dialog and its button from the HTML by id
const introModal = document.getElementById("introDialog");

const introCloseButton = document.getElementById("introDialogCloseButton");

// Show popup when page opens
// (showModal also dims the page behind it, which is what the ::backdrop css styles)
introModal.showModal();

// Close popup when OK is clicked
introCloseButton.addEventListener("click", () => {
  introModal.close();
});

// the tone js synths

// the synth for anything the person taps by hand
const synth = new Tone.Synth().toDestination();

// a second synth just for the loop, so it can't clash with manual taps
// (one synth can only play one note at a time, so sharing would cut notes off)
const loopSynth = new Tone.Synth().toDestination();

// the notes

// a pentatonic scale, so any note a child picks sounds nice together
// (no semitone clashes in this scale, so there's no wrong note to hit)
const scale = [
  "C2", "D2", "E2", "G2", "A2",
  "C3", "D3", "E3", "G3", "A3",
  "C4", "D4", "E4", "G4", "A4",
  "C5", "D5", "E5", "G5", "A5",
  "C6", "D6", "E6", "G6", "A6"
];

// each planet starts on a different step of the scale (low to high)
// these numbers are positions in the scale array above, not note names
// (they start in the middle, 8 to 15, so there's room to go up or down)
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

// the ids in the order the loop visits them, using the keys above
const planetOrder = Object.keys(planetBase); // mercury ... neptune

// how many steps up or down each planet has been pushed (-2 to +2)
// every planet begins at 0, meaning "not pushed anywhere yet"
const planetOffset = {};
planetOrder.forEach((id) => (planetOffset[id] = 0));

// the pitch slider moves everything up or down in 5 steps (-2 ... +2)
let pitchStep = 0;

// work out the note a planet should play right now
function noteFor(id) {
  // each pitch step moves 3 notes along the scale, so it always stays in key
  // (base position + where it was tapped + the global pitch)
  let index = planetBase[id] + planetOffset[id] + pitchStep * 3;

  // clamp the index so we never run off either end of the array
  index = Math.max(0, Math.min(scale.length - 1, index));

  return scale[index];
}

// the ripple feedback

function ripplePlanet(planet) {
  const sky = document.getElementById("sky");

  // read this planet's colour from the CSS
  // (each planet sets its own --glow-halo variable in the stylesheet)
  const colour = getComputedStyle(planet).getPropertyValue("--glow-halo");

  // make 3 rings, each starting a little later than the last
  for (let i = 0; i < 3; i++) {
    // svg shapes need createElementNS, plain createElement won't draw them
    const ring = document.createElementNS("http://www.w3.org/2000/svg", "circle");

    // copy the planet's position and size so the ring starts right on top of it
    ring.setAttribute("cx", planet.getAttribute("cx"));
    ring.setAttribute("cy", planet.getAttribute("cy"));
    ring.setAttribute("r", planet.getAttribute("r"));
    ring.setAttribute("class", "ripple");

    ring.style.stroke = colour;
    ring.style.animationDelay = i * 0.25 + "s";

    // tidy up once the ring has faded out
    // (otherwise the svg slowly fills up with invisible circles)
    ring.addEventListener("animationend", () => ring.remove());

    sky.appendChild(ring);
  }

  // the stars in the background join in
  flashStars(colour);
}

// the twinkling stars

const starsLayer = document.getElementById("stars");
const stars = []; // kept in an array so flashStars can pick random ones later

// make 70 stars at random spots, sizes and speeds
for (let i = 0; i < 70; i++) {
  const star = document.createElement("div");
  const size = 2 + Math.random() * 3; // 2px to 5px

  star.className = "star";
  star.style.width = size + "px";
  star.style.height = size + "px";
  star.style.left = Math.random() * 100 + "%";
  star.style.top = Math.random() * 100 + "%";

  // random delay and duration so they don't all twinkle together
  star.style.animationDelay = Math.random() * 3 + "s";
  star.style.animationDuration = 2 + Math.random() * 3 + "s";

  // remove the flash once it has finished so it can flash again
  // (the name check stops the normal twinkle ending from triggering this)
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

    // the css reads this variable for the flash colour
    star.style.setProperty("--star-colour", colour.trim());

    // take the class off and put it back on to replay the animation
    star.classList.remove("flash");
    void star.getBoundingClientRect(); // restart the animation
    star.classList.add("flash");
  }
}

// where on the planet did the tap land? 0 = very top, 1 = very bottom
function tapHeight(event, planet) {
  const sky = document.getElementById("sky");

  // the click gives us screen pixels, but the planets are drawn in svg units,
  // so the point has to be converted from one to the other
  const point = sky.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;

  const svgPoint = point.matrixTransform(sky.getScreenCTM().inverse());

  const cy = Number(planet.getAttribute("cy"));
  const r = Number(planet.getAttribute("r"));

  // (cy - r) is the top edge of the planet and 2 * r is its full height
  const fraction = (svgPoint.y - (cy - r)) / (2 * r);

  // a tap on the very edge can land slightly outside, so keep it in 0 to 1
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

  // the word in the heading, and how far the blue bar is filled
  pitchWord.textContent = pitchWords[position];
  pitchFill.style.width = (position / 4) * 100 + "%";

  // every dot up to the current one is filled, only the current one is bigger
  pitchStops.forEach((stop, i) => {
    stop.classList.toggle("filled", i <= position);
    stop.classList.toggle("selected", i === position);
  });
}

async function setPitch(step) {
  await Tone.start();

  // keep the step between -2 and +2 so the buttons stop at each end
  pitchStep = Math.max(-2, Math.min(2, step));
  showPitch();
  synth.triggerAttackRelease(noteFor("earth"), "8n"); // a quick preview
}

// the Lower and Higher buttons nudge the pitch by one step
document.getElementById("lowerButton").addEventListener("click", () => setPitch(pitchStep - 1));
document.getElementById("higherButton").addEventListener("click", () => setPitch(pitchStep + 1));

// each dot jumps straight to its own step (the number lives in data-step in the html)
pitchStops.forEach((stop) => {
  stop.addEventListener("click", () => setPitch(Number(stop.dataset.step)));
});

// draw the starting state (Middle) when the page first loads
showPitch();

// loop state

const activePlanets = new Set(); // planets switched on
let step = 0; // which planet the loop is up to
let playing = false; // is the loop running right now?

// tapping a planet: play note, ripple, and toggle it on/off for the loop

planetOrder.forEach((id) => {
  const planet = document.getElementById(id);

  planet.addEventListener("click", async (event) => {
    // browsers won't let audio start until someone has tapped the page,
    // so this wakes it up on the first tap
    await Tone.start(); // safe to call every time

    // tap the top of the planet = higher, tap the bottom = lower
    const height = tapHeight(event, planet);

    // flips 0...1 (top to bottom) into +2...-2, then rounds to a whole step
    planetOffset[id] = Math.round((0.5 - height) * 4); // -2 ... +2

    synth.triggerAttackRelease(noteFor(id), "8n");
    ripplePlanet(planet);

    // tapping an on planet turns it off, tapping an off planet turns it on
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

// runs every eighth note while the transport is going
const loop = new Tone.Loop((time) => {
  // % wraps the step back to Mercury after Neptune
  const id = planetOrder[step % planetOrder.length];

  if (activePlanets.has(id)) {
    // "time" is the exact moment Tone wants the sound, which keeps the rhythm steady
    loopSynth.triggerAttackRelease(noteFor(id), "16n", time);

    // draw the ripple at the moment the sound plays
    // (audio is scheduled slightly early, so Draw lines the visuals up with it)
    Tone.Draw.schedule(() => {
      ripplePlanet(document.getElementById(id));
    }, time);
  }

  // moves on even if this planet is off, so the gaps stay as silent beats
  step++;
}, "8n");

// the loop is ready from the start but only makes sound once the transport starts
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

  // flip the flag, then let the css pulse the sun while it's playing
  playing = !playing;
  sun.classList.toggle("playing", playing);
  ripplePlanet(sun);
});