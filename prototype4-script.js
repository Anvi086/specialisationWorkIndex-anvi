// ---------- Intro popup ----------
const introDialog = document.getElementById('introDialog');
const closeButton = document.getElementById('introDialogCloseButton');

introDialog.showModal();

closeButton.addEventListener('click', async () => {
    await Tone.start();          // browsers need a click before audio can play
    introDialog.close();
});


// ---------- Setup ----------
const svg = document.getElementById('sky');
const trail = document.getElementById('trail');
const lanes = document.getElementById('lanes');
const SVG_NS = 'http://www.w3.org/2000/svg';

// A pentatonic scale: every note sounds nice together, so nothing can sound wrong
const notes = [
    'C3', 'D3', 'E3', 'G3', 'A3',
    'C4', 'D4', 'E4', 'G4', 'A4',
    'C5', 'D5', 'E5', 'G5', 'A5'
];

// Each planet has a dot colour and a soft wave shape, so each one sounds different
const planets = {
    mercury: { color: '#9e9c98', wave: 'sine' },
    venus:   { color: '#e8c27a', wave: 'triangle' },
    earth:   { color: '#328bd0', wave: 'fatsine' },
    mars:    { color: '#d96548', wave: 'fattriangle' },
    jupiter: { color: '#d9a66f', wave: 'sine2' },
    saturn:  { color: '#e5cc91', wave: 'triangle2' },
    uranus:  { color: '#9de5e5', wave: 'sine3' },
    neptune: { color: '#4668d6', wave: 'amsine' }
};

// Make one synth per planet
Object.values(planets).forEach(planet => {
    planet.synth = new Tone.Synth({
        oscillator: { type: planet.wave },
        envelope: { attack: 0.05, decay: 0.1, sustain: 0.8, release: 0.5 },
        portamento: 0.08          // this is the smooth slide between notes
    }).toDestination();
    planet.synth.volume.value = -10;   // keep it gentle
});


// ---------- Pitch lines ----------
notes.forEach((note, i) => {
    const y = 500 * (1 - (i + 0.5) / notes.length);
    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', 120);
    line.setAttribute('x2', 800);
    line.setAttribute('y1', y);
    line.setAttribute('y2', y);
    line.setAttribute('class', 'lane');
    lanes.appendChild(line);
});


// ---------- Helpers ----------

// Turn a mouse/finger position into SVG coordinates (works at any screen size)
function toSvgPoint(event) {
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    return point.matrixTransform(svg.getScreenCTM().inverse());
}

// Height on screen -> a note (top = high, bottom = low)
function noteForY(y) {
    const t = 1 - y / 500;
    const index = Math.floor(t * notes.length);
    return notes[Math.max(0, Math.min(notes.length - 1, index))];
}

// Leave a dot behind, it fades into a ring, then disappears
function addDot(x, y, color) {
    const dot = document.createElementNS(SVG_NS, 'circle');
    dot.setAttribute('cx', x);
    dot.setAttribute('cy', y);
    dot.setAttribute('r', 5 + Math.random() * 8);
    dot.setAttribute('fill', color);
    dot.setAttribute('stroke', color);
    dot.setAttribute('class', 'dot');
    dot.addEventListener('animationend', () => dot.remove());
    trail.appendChild(dot);
}


// ---------- Playing ----------
let active = null;        // the planet being held
let activeElement = null;
let currentNote = null;
let lastDot = { x: 0, y: 0 };

document.querySelectorAll('.planet').forEach(element => {
    element.addEventListener('pointerdown', event => {
        active = planets[element.id];
        activeElement = element;

        const point = toSvgPoint(event);
        currentNote = noteForY(point.y);

        element.classList.add('active');
        active.synth.triggerAttack(currentNote);
        lastDot = { x: point.x, y: point.y };
    });
});

window.addEventListener('pointermove', event => {
    if (!active) return;

    const point = toSvgPoint(event);

    // Change pitch only when the note changes, the synth glides to it
    const note = noteForY(point.y);
    if (note !== currentNote) {
        currentNote = note;
        active.synth.setNote(note);
    }

    // Only drop a dot after moving a little, so it isn't crowded
    const distance = Math.hypot(point.x - lastDot.x, point.y - lastDot.y);
    if (distance > 10) {
        addDot(point.x, point.y, active.color);
        lastDot = { x: point.x, y: point.y };
    }
});

function stopPlaying() {
    if (!active) return;
    active.synth.triggerRelease();
    activeElement.classList.remove('active');
    active = null;
    activeElement = null;
    currentNote = null;
}

window.addEventListener('pointerup', stopPlaying);
window.addEventListener('pointercancel', stopPlaying);