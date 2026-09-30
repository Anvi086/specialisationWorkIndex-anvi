// ---------- Intro popup ----------
const introDialog = document.getElementById('introDialog');
const closeButton = document.getElementById('introDialogCloseButton');

introDialog.showModal();

closeButton.addEventListener('click', async () => {
    await Tone.start();          // browsers need a click before audio can play
    introDialog.close();
});


// ---------- Sound ----------
// PolySynth so a preview click and the loop can sound at the same time
const synth = new Tone.PolySynth(Tone.Synth).toDestination();
synth.volume.value = -10;

Tone.Transport.bpm.value = 100;


// ---------- Planets ----------
// One planet = one step of the loop = one note of do re mi fa sol la ti do
const planets = [
    { name: 'mercury', note: 'C4', size: 14 },
    { name: 'venus',   note: 'D4', size: 20 },
    { name: 'earth',   note: 'E4', size: 22 },
    { name: 'mars',    note: 'F4', size: 16 },
    { name: 'jupiter', note: 'G4', size: 34 },
    { name: 'saturn',  note: 'A4', size: 30 },
    { name: 'uranus',  note: 'B4', size: 24 },
    { name: 'neptune', note: 'C5', size: 24 }
];

const svg = document.getElementById('sky');
const rings = document.getElementById('rings');
const NS = 'http://www.w3.org/2000/svg';


// ---------- Draw the orbits and planets ----------
planets.forEach((planet, i) => {
    const rx = 95 + i * 36;        // each ring is wider than the last
    const ry = rx * 0.55;          // squashed into an ellipse

    // the orbit ring
    const ring = document.createElementNS(NS, 'ellipse');
    ring.setAttribute('cx', 400);
    ring.setAttribute('cy', 250);
    ring.setAttribute('rx', rx);
    ring.setAttribute('ry', ry);
    ring.setAttribute('class', 'ring');
    rings.appendChild(ring);

    // the planet, sitting somewhere on its ring
    const angle = i * 2.4;         // spreads planets around so they don't line up
    const element = document.createElementNS(NS, 'circle');
    element.setAttribute('cx', 400 + rx * Math.cos(angle));
    element.setAttribute('cy', 250 + ry * Math.sin(angle));
    element.setAttribute('r', planet.size);
    element.setAttribute('fill', `url(#${planet.name}Gradient)`);
    element.setAttribute('class', 'planet');
    svg.appendChild(element);

    planet.element = element;
    planet.on = false;

    // tap to switch on / off
    element.addEventListener('click', () => {
        planet.on = !planet.on;
        element.classList.toggle('on', planet.on);

        // play the note once so you hear what you switched on
        if (planet.on) {
            synth.triggerAttackRelease(planet.note, '8n');
        }
    });
});


// ---------- The loop ----------
let step = 0;

new Tone.Loop(time => {
    const planet = planets[step];

    // only play planets that are switched on
    if (planet.on) {
        synth.triggerAttackRelease(planet.note, '8n', time);
    }

    // light up the current planet, timed to match the sound
    Tone.Draw.schedule(() => {
        planets.forEach(p => p.element.classList.remove('playing'));
        planet.element.classList.add('playing');
    }, time);

    step = (step + 1) % planets.length;     // back to Mercury after Neptune
}, '8n').start(0);


// ---------- The sun = start / stop ----------
const sun = document.getElementById('sun');
let isPlaying = false;

sun.addEventListener('click', () => {
    if (isPlaying) {
        Tone.Transport.stop();
        step = 0;
        planets.forEach(p => p.element.classList.remove('playing'));
        sun.classList.remove('playing');
    } else {
        Tone.Transport.start();
        sun.classList.add('playing');
    }
    isPlaying = !isPlaying;
});