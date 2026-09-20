import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import "./style.css";

type Face = "R" | "U" | "F";
type Move = { face: Face; turns: number; label: string };

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) throw new Error("The app root could not be found.");

app.innerHTML = `
  <main class="lab">
    <header class="topbar"><a class="wordmark" href="/">Rubik's Search Lab</a><span class="mode">2×2 Viewer</span></header>
    <section class="workspace" aria-label="Rubik's Cube viewer">
      <div class="scene-wrap"><canvas class="cube-canvas" aria-label="Interactive 3D 2 by 2 Rubik's Cube"></canvas><p class="gesture-hint">Drag to explore</p></div>
      <div class="control-panel">
        <div class="eyebrow">Search playback</div><label class="scramble-label" for="scramble">Scramble</label>
        <div class="scramble-row"><input id="scramble" value="R U F" spellcheck="false" autocomplete="off" aria-describedby="move-help" /><button id="solve" class="solve-button" type="button">Set</button></div>
        <p id="move-help" class="help">Use R, U, F, primes, and 2-turns.</p>
        <div class="solution" aria-live="polite"><div class="solution-topline"><span>Solution</span><span id="step-count">0 / 3</span></div><div id="move-list" class="move-list"></div></div>
        <div class="playback" aria-label="Playback controls"><button id="previous" class="icon-button" type="button" aria-label="Previous move">‹</button><button id="next" class="primary-button" type="button">Next <span aria-hidden="true">›</span></button><button id="auto" class="icon-button wide" type="button">Auto</button></div>
        <p id="status" class="status">Preview path · 3 moves</p>
      </div>
    </section>
  </main>`;

const required = <T extends Element>(selector: string) => { const element = document.querySelector<T>(selector); if (!element) throw new Error(`Missing ${selector}`); return element; };
const canvas = required<HTMLCanvasElement>(".cube-canvas");
const scrambleInput = required<HTMLInputElement>("#scramble");
const solveButton = required<HTMLButtonElement>("#solve");
const previousButton = required<HTMLButtonElement>("#previous");
const nextButton = required<HTMLButtonElement>("#next");
const autoButton = required<HTMLButtonElement>("#auto");
const moveList = required<HTMLDivElement>("#move-list");
const stepCount = required<HTMLSpanElement>("#step-count");
const status = required<HTMLParagraphElement>("#status");

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
camera.position.set(5.3, 4.8, 7.1);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true; controls.dampingFactor = 0.06; controls.enablePan = false; controls.minDistance = 6; controls.maxDistance = 12;
scene.add(new THREE.HemisphereLight(0xffffff, 0x141416, 2.3));
const key = new THREE.DirectionalLight(0xffffff, 2.8); key.position.set(4, 7, 6); key.castShadow = true; scene.add(key);
const fill = new THREE.DirectionalLight(0xaab5c8, 1.2); fill.position.set(-5, 2, -4); scene.add(fill);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.22 }));
floor.rotation.x = -Math.PI / 2; floor.position.y = -1.72; floor.receiveShadow = true; scene.add(floor);

const cube = new THREE.Group(); scene.add(cube);
const cubies: THREE.Group[] = [];
const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x151517, roughness: 0.33, metalness: 0.03 });
const colors = [0xd7423b, 0xef8b2d, 0xf2f0e9, 0xf3d343, 0x3c9b5f, 0x3379c2].map((color) => new THREE.MeshStandardMaterial({ color, roughness: 0.4 }));
const addSticker = (cubie: THREE.Group, material: THREE.Material, position: THREE.Vector3, rotation: THREE.Euler) => { const sticker = new THREE.Mesh(new THREE.PlaneGeometry(1.22, 1.22), material); sticker.position.copy(position); sticker.rotation.copy(rotation); cubie.add(sticker); };
for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
  const cubie = new THREE.Group(); cubie.position.set(x * 0.79, y * 0.79, z * 0.79);
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.52, 1.52, 1.52), bodyMaterial); body.castShadow = true; body.receiveShadow = true; cubie.add(body);
  addSticker(cubie, colors[x > 0 ? 0 : 1], new THREE.Vector3(x * 0.772, 0, 0), new THREE.Euler(0, x > 0 ? Math.PI / 2 : -Math.PI / 2, 0));
  addSticker(cubie, colors[y > 0 ? 2 : 3], new THREE.Vector3(0, y * 0.772, 0), new THREE.Euler(y > 0 ? -Math.PI / 2 : Math.PI / 2, 0, 0));
  addSticker(cubie, colors[z > 0 ? 4 : 5], new THREE.Vector3(0, 0, z * 0.772), new THREE.Euler(0, z > 0 ? 0 : Math.PI, 0));
  cube.add(cubie); cubies.push(cubie);
}

let scrambleMoves: Move[] = []; let solution: Move[] = []; let applied: Move[] = []; let turning = false; let autoTimer: number | undefined;
const parseMoves = (value: string) => value.trim().toUpperCase().split(/\s+/).filter(Boolean).map((token) => { const match = token.match(/^([RUF])(['2])?$/); if (!match) throw new Error(`“${token}” is not supported.`); const suffix = match[2] ?? ""; return { face: match[1] as Face, turns: suffix === "'" ? -1 : suffix === "2" ? 2 : 1, label: `${match[1]}${suffix}` }; });
const inverse = (move: Move): Move => { const turns = move.turns === 2 ? 2 : -move.turns; return { face: move.face, turns, label: `${move.face}${turns === -1 ? "'" : turns === 2 ? "2" : ""}` }; };
function renderSolution() { moveList.innerHTML = solution.map((move, index) => `<span class="move ${index < applied.length ? "done" : ""} ${index === applied.length ? "current" : ""}">${move.label}</span>`).join(""); stepCount.textContent = `${applied.length} / ${solution.length}`; previousButton.disabled = turning || applied.length === 0; nextButton.disabled = turning || applied.length === solution.length; autoButton.disabled = turning || solution.length === 0; }
function rotate(move: Move) { turning = true; renderSolution(); const pivot = new THREE.Group(); cube.add(pivot); const axis = move.face === "R" ? "x" : move.face === "U" ? "y" : "z"; const selected = cubies.filter((cubie) => cubie.getWorldPosition(new THREE.Vector3())[axis] > 0); selected.forEach((cubie) => pivot.attach(cubie)); const target = -move.turns * Math.PI / 2; const start = performance.now(); const duration = move.turns === 2 ? 440 : 300; return new Promise<void>((resolve) => { const frame = (now: number) => { const progress = Math.min((now - start) / duration, 1); pivot.rotation[axis] = target * (1 - Math.pow(1 - progress, 4)); if (progress < 1) { requestAnimationFrame(frame); return; } pivot.updateMatrixWorld(true); selected.forEach((cubie) => cube.attach(cubie)); cube.remove(pivot); turning = false; renderSolution(); resolve(); }; requestAnimationFrame(frame); }); }
async function forward() { if (turning || applied.length >= solution.length) return; const move = solution[applied.length]; await rotate(move); applied.push(move); renderSolution(); }
async function backward() { if (turning || applied.length === 0) return; const move = applied[applied.length - 1]; await rotate(inverse(move)); applied.pop(); renderSolution(); }
function clearAuto() { if (autoTimer !== undefined) window.clearTimeout(autoTimer); autoTimer = undefined; autoButton.textContent = "Auto"; }
async function playAuto() { if (autoTimer !== undefined) { clearAuto(); return; } autoButton.textContent = "Pause"; const play = async () => { if (applied.length >= solution.length) { clearAuto(); return; } await forward(); autoTimer = window.setTimeout(play, 440); }; await play(); }
async function setScramble() { clearAuto(); solveButton.disabled = true; try { const nextScramble = parseMoves(scrambleInput.value); while (applied.length) await backward(); for (const move of [...scrambleMoves].reverse().map(inverse)) await rotate(move); for (const move of nextScramble) await rotate(move); scrambleMoves = nextScramble; solution = [...nextScramble].reverse().map(inverse); applied = []; status.textContent = solution.length ? `Preview path · ${solution.length} moves` : "Solved state"; renderSolution(); } catch (error) { status.textContent = error instanceof Error ? error.message : "Could not read that scramble."; } finally { solveButton.disabled = false; } }
solveButton.addEventListener("click", () => void setScramble()); nextButton.addEventListener("click", () => void forward()); previousButton.addEventListener("click", () => void backward()); autoButton.addEventListener("click", () => void playAuto());
function resize() { const { width, height } = canvas.getBoundingClientRect(); renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix(); }
new ResizeObserver(resize).observe(canvas); resize();
function animate() { requestAnimationFrame(animate); controls.update(); renderer.render(scene, camera); }
void setScramble(); animate();
