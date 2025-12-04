/*
  game.js — VERSIÓN CORREGIDA
  ✅ Nivel final en HUD correctamente
  ✅ Limpia la respuesta anterior al entrar al nivel final
  ✅ Icono de música siempre visible + control de volumen
  ✅ HUD de puntos actualizado correctamente en la transición 8->9
*/

/* ============================================================
   CONFIG
============================================================ */
const REMOTE_PROBLEMS_URL = "./problems.json";
const STORAGE_KEY = "desafio_problems_v1";
const LEVELS = 9;
const LEVEL_TIME = 90;

/* ============================================================
   PERSONAJES
============================================================ */
const personajes = [
  { name: "Chasky Mensajero", intro: "¡Hijo del Qhapaq Ñan! Demuestra tu destreza.", portrait: "sprites/p1.png" },
  { name: "Tejedora Qeros", intro: "Como los hilos, las figuras se entrelazan. Calcula con cuidado.", portrait: "sprites/p2.png" },
  { name: "Constructor Sacsayhuaman", intro: "Piedra por piedra se construye la perfección.", portrait: "sprites/p3.png" },
  { name: "Amauta Sabio", intro: "La sabiduría ilumina. Resuelve con temple.", portrait: "sprites/p4.png" },
  { name: "Sacerdote del Sol", intro: "Inti observa tu cálculo… no falles.", portrait: "sprites/p5.png" },
  { name: "Arquera de la Niebla", intro: "Mi disparo es certero. Sé tan preciso como yo.", portrait: "sprites/p6.png" },
  { name: "Capitán Inca", intro: "La estrategia es tu mejor arma. Calcula sin prisa.", portrait: "sprites/p7.png" },
  { name: "Astrónomo del Coricancha", intro: "Las sombras revelan proporciones. Analiza bien.", portrait: "sprites/p8.png" },
  { name: "Gran Sapa Inca", intro: "Última prueba antes del templo sagrado. No falles.", portrait: "sprites/p9.png" }
];

/* ============================================================
   FONDOS
============================================================ */
const levelBackgrounds = {
  1: "backgrounds/bg1.jpg",
  2: "backgrounds/bg2.jpg",
  3: "backgrounds/bg3.jpg",
  4: "backgrounds/bg4.jpg",
  5: "backgrounds/bg5.jpg",
  6: "backgrounds/bg6.jpg",
  7: "backgrounds/bg7.jpg",
  8: "backgrounds/bg8.jpg",
  9: "backgrounds/bg9.jpg",
  final: "backgrounds/bg_final.jpg",
};

/* ============================================================
   PROBLEMAS POR DEFECTO
============================================================ */
function R(a, b) { return Math.floor(Math.random() * (b - a + 1)) + a; }
function genRect() { let a = R(3, 12), b = R(3, 12); return { q: `Área del rectángulo de lados ${a} y ${b}`, ans: String(a * b) } }
function genTri() { let base = R(3, 12), h = R(3, 12); if ((base * h) % 2 !== 0) h++; return { q: `Área del triángulo base ${base} y altura ${h}`, ans: String((base * h) / 2) } }
function genPerRect() { let a = R(2, 12), b = R(2, 12); return { q: `Perímetro del rectángulo (${a}+${b})×2`, ans: String(2 * (a + b)) } }
const fallbackGens = [genRect, genTri, genPerRect];

/* ============================================================
   VARIABLES
============================================================ */
let problemsDB = { easy: [], medium: [], hard: [], final: [] };
let problems = [];
let finalProblem = null;

let currentLevel = 1;
let totalPoints = 0;
let totalBonus = 0;
let levelResults = [];

let inputAnswer = "";
let timerId = null;
let startTime = 0;

/* ============================================================
   DOM ELEMENTS
============================================================ */
const mainMenu = document.getElementById("mainMenu");
const gameRoot = document.getElementById("gameRoot");
const finalScreen = document.getElementById("finalScreen");

const backgroundEl = document.getElementById("background");
const hudLevel = document.getElementById("hud-level");
const hudPoints = document.getElementById("hud-points");
const hudTimer = document.getElementById("hud-timer");

const dialogueUI = document.getElementById("dialogue");
const problemText = document.getElementById("problemText");
const answerValue = document.getElementById("answerValue");

const keyboardEl = document.getElementById("keyboard");
const bossPortrait = document.getElementById("bossPortrait");
const bossName = document.getElementById("bossName");

const resultsBody = document.getElementById("resultsBody");
const finalPointsUI = document.getElementById("finalPoints");
const finalBonusUI = document.getElementById("finalBonus");
const finalUnlock = document.getElementById("finalUnlock");
const finalTableContainer = document.getElementById("finalTableContainer");
const finalScroll = document.getElementById("finalScroll");

const playAgainBtn = document.getElementById("playAgainBtn");

const namePanel = document.getElementById("namePanel");
const nameInput = document.getElementById("playerNameInput");
const startJourneyBtn = document.getElementById("startJourneyBtn");

const menuMusic = document.getElementById("menuMusic");
const soundToggle = document.getElementById("soundToggle");
const volumeSlider = document.getElementById("volumeSlider");

/* ============================================================
   ALERTA INCA
============================================================ */
// function showIncaAlert(msg) {
// let panel = document.getElementById("incaPanel");
// if (!panel) {
// panel = document.createElement("div");
// panel.id = "incaPanel";
// panel.style.position = "fixed";
// panel.style.inset = "0";
// panel.style.display = "flex";
// panel.style.justifyContent = "center";
// panel.style.alignItems = "center";
// panel.style.background = "rgba(0,0,0,0.65)";
// panel.style.zIndex = "999999";
// 
// panel.innerHTML = `
// // <div style="background:#3a2b1f;padding:20px;border:4px solid #d4a02f;border-radius:12px;width:340px;text-align:left;color:#ffe7c0";max-height:80vh;overflow-y:auto;white-space:pre-wrap;font-size:15px;
// <p id="incaMsg"></p>
// // <button id="incaOK" style="margin-top:12px;padding:10px 20px;background:#d4a02f;color:#000;border-radius:8px;font-weight:bold">Aceptar</button>
// </div>
// `;
// document.body.appendChild(panel);
// document.getElementById("incaOK").onclick = () => panel.style.display = "none";
// }
// document.getElementById("incaMsg").textContent = msg;
// panel.style.display = "flex";
// }
// ************************************

function showIncaAlert(msg) {
  let panel = document.getElementById("incaPanel");
  if (!panel) {
    panel = document.createElement("div");
    panel.id = "incaPanel";
    panel.style.position = "fixed";
    panel.style.inset = "0";
    panel.style.display = "flex";
    panel.style.justifyContent = "center";
    panel.style.alignItems = "center";
    panel.style.background = "rgba(0,0,0,0.65)";
    panel.style.zIndex = "999999";

    panel.innerHTML = `
      <div style="
        background:#3a2b1f;
        padding:20px;
        border:4px solid #d4a02f;
        border-radius:12px;
        width:360px;
        max-height:80vh;
        overflow-y:auto;
        color:#ffe7c0;
        white-space:pre-wrap;   /* 👈 AQUÍ SE ACTIVAN LOS SALTOS DE LÍNEA */
        text-align:left;
        font-size:15px;
      ">
        <p id="incaMsg"></p>
        <button id="incaOK" style="
          margin-top:12px;
          padding:10px 20px;
          background:#d4a02f;
          color:#000;
          border-radius:8px;
          font-weight:bold;
        ">Cerrar</button>
      </div>
    `;
    document.body.appendChild(panel);
    document.getElementById("incaOK").onclick = () => panel.style.display = "none";
  }
  document.getElementById("incaMsg").textContent = msg;
  panel.style.display = "flex";
}

/* ============================================================
   CARGAR PROBLEMAS
============================================================ */
async function loadRemote() {
  if (!REMOTE_PROBLEMS_URL) return null;
  try {
    const r = await fetch(REMOTE_PROBLEMS_URL, { cache: "no-store" });
    if (!r.ok) return null;
    return await r.json();
  } catch (e) { return null; }
}

function loadLocal() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const json = JSON.parse(raw);
    json.easy = json.easy || [];
    json.medium = json.medium || [];
    json.hard = json.hard || [];
    json.final = json.final || [];
    return json;
  } catch (e) { return null; }
}

async function prepareProblemsDB() {
  const remote = await loadRemote();
  if (remote) { problemsDB = remote; return; }

  const local = loadLocal();
  if (local) { problemsDB = local; return; }

  problemsDB = {
    easy: [{ q: "2+2", ans: "4" }],
    medium: [{ q: "Área 6×7", ans: "42" }],
    hard: [{ q: "Si 3x+5=20, x=?", ans: "5" }],
    final: [{ q: "Área rectángulo 12×8", ans: "96" }],
  };
}

/* ============================================================
   ARMAR PROBLEMAS
============================================================ */
// function assembleProblems() {
// problems = [];
// function pick(arr, i) {
// if (arr.length > 0) return arr[Math.floor(Math.random() * arr.length)];
// return fallbackGens[i % fallbackGens.length]();
// }
// for (let i = 0; i < 3; i++) problems.push(pick(problemsDB.easy, 0));
// for (let i = 0; i < 3; i++) problems.push(pick(problemsDB.medium, 1));
// for (let i = 0; i < 3; i++) problems.push(pick(problemsDB.hard, 2));
// }

function assembleProblems() {
  problems = [];

  function pickUnique(arr, count, fallbackIndex) {
    // Si hay suficientes problemas → se mezclan y se toman sin repetir
    if (arr.length >= count) {
      const shuffled = [...arr].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, count);
    }

    // Si NO hay suficientes → usar todos y completar con generadores
    const needed = count - arr.length;
    const result = [...arr];

    for (let i = 0; i < needed; i++) {
      result.push(fallbackGens[fallbackIndex % fallbackGens.length]());
    }
    return result;
  }

  // 3 fáciles
  problems.push(...pickUnique(problemsDB.easy, 3, 0));

  // 3 intermedios
  problems.push(...pickUnique(problemsDB.medium, 3, 1));

  // 3 difíciles
  problems.push(...pickUnique(problemsDB.hard, 3, 2));
}

/* ============================================================
   FONDO
============================================================ */
function updateBackground(level) {
  const key = (level === "final") ? "final" : level;
  backgroundEl.style.background = `url('${levelBackgrounds[key]}') center/cover no-repeat`;
}

/* ============================================================
   TECLADO
============================================================ */
function buildKeyboard() {
  keyboardEl.innerHTML = "";
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];

  nums.forEach(n => {
    const b = document.createElement("button");
    b.className = "key";
    b.textContent = n;
    b.onclick = () => { inputAnswer += String(n); answerValue.textContent = inputAnswer; };
    keyboardEl.appendChild(b);
  });

  const back = document.createElement("button");
  back.className = "key";
  back.textContent = "⌫";
  back.onclick = () => { inputAnswer = inputAnswer.slice(0, -1); answerValue.textContent = inputAnswer; };
  keyboardEl.appendChild(back);

  const clear = document.createElement("button");
  clear.className = "key";
  clear.textContent = "C";
  clear.onclick = () => { inputAnswer = ""; answerValue.textContent = ""; };
  keyboardEl.appendChild(clear);
}

/* ============================================================
   HUD / TIMER
============================================================ */
function updateHUD_Level() {
  // seguridad: si estamos en modo final (currentLevel>LEVELS) no indexar personajes
  if (currentLevel > LEVELS) {
    hudLevel.textContent = `Nivel Final — INTI`;
  } else {
    hudLevel.textContent = `Nivel ${currentLevel} — ${personajes[currentLevel - 1].name}`;
  }
}
function updateHUD_Points() { hudPoints.textContent = `Puntos: ${totalPoints}`; }
function updateHUD_Timer(t) { hudTimer.textContent = `Tiempo: ${t}s`; }

function startTimer() {
  clearInterval(timerId);
  startTime = Date.now();
  timerId = setInterval(() => {
    const el = Math.floor((Date.now() - startTime) / 1000);
    const left = Math.max(0, LEVEL_TIME - el);
    updateHUD_Timer(left);
    if (left <= 0) { clearInterval(timerId); timerId = null; }
  }, 300);
}

function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null; } }

/* ============================================================
   START LEVEL
============================================================ */
function startLevel() {
  if (currentLevel > LEVELS) { checkFinalUnlock(); return; }

  // limpiar cualquier respuesta previa
  inputAnswer = "";
  answerValue.textContent = "";

  const ch = personajes[currentLevel - 1];
  bossName.textContent = ch.name;
  bossPortrait.style.backgroundImage = `url('${ch.portrait}')`;
  dialogueUI.textContent = ch.intro;

  const p = problems[currentLevel - 1];
  problemText.textContent = p.q;

  updateBackground(currentLevel);
  buildKeyboard();
  updateHUD_Level();
  updateHUD_Points();
  startTimer();
}

/* ============================================================
   SUBMIT
============================================================ */
// document.getElementById("submitBtn").onclick = () => {
// stopTimer();
// 
// if (currentLevel <= LEVELS) {
// const p = problems[currentLevel - 1];
// const your = inputAnswer.trim();
// const correct = (your === String(p.ans));
// const elapsed = Math.floor((Date.now() - startTime) / 1000);
// let bonus = 0;
// 
// if (correct) {
// if (elapsed <= 30) bonus = 30;
// else if (elapsed <= 60) bonus = 20;
// else bonus = 10;
// 
// totalPoints += 50;
// totalBonus += bonus;
// dialogueUI.textContent = `¡Correcto! +50 pts — Bonus +${bonus}`;
// } else { dialogueUI.textContent = `Incorrecto.`; }
// 
//actualiza inmediatamente el HUD de puntos
// updateHUD_Points();
// 
// // levelResults.push({ level: currentLevel, q: p.q, your: your || "(vacío)", correct, correctAns: p.ans, pts: correct ? 50 : 0, bonus });
// currentLevel++;
// 
// setTimeout(() => { currentLevel <= LEVELS ? startLevel() : checkFinalUnlock(); }, 800);
// }
// };
document.getElementById("submitBtn").onclick = () => {

  // VALIDACIÓN: no permite enviar vacío ni no-números
  const val = inputAnswer.trim();
  if (val === "" || isNaN(Number(val))) {
    dialogueUI.textContent = "⚠ Ingresa un número antes de enviar.";
    answerValue.style.color = "red";
    setTimeout(() => answerValue.style.color = "", 600);
    return;
  }

  // Si hay número válido, continúa normalmente
  stopTimer();

  if (currentLevel <= LEVELS) {
    const p = problems[currentLevel - 1];
    const your = val;
    const correct = (your === String(p.ans));
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    let bonus = 0;

    if (correct) {
      if (elapsed <= 30) bonus = 30;
      else if (elapsed <= 60) bonus = 20;
      else bonus = 10;

      totalPoints += 50;
      totalBonus += bonus;
      dialogueUI.textContent = `¡Correcto! + 50 pts — Bonus + ${bonus}`;
    } else { dialogueUI.textContent = `Incorrecto.`; }

    levelResults.push({ level: currentLevel, q: p.q, your: your || "(vacío)", correct, correctAns: p.ans, pts: correct ? 50 : 0, bonus });
    currentLevel++;

    setTimeout(() => { currentLevel <= LEVELS ? startLevel() : checkFinalUnlock(); }, 800);
  }

};

/* ============================================================
   FINAL
============================================================ */
function checkFinalUnlock() {
  const nineCorrect = levelResults.slice(0, 9).every(r => r.correct === true);
  const okBonus = totalBonus >= 50;

  updateBackground("final");

  const unlocked = nineCorrect && okBonus;

  if (unlocked) {
    // seleccionar problema final
    finalProblem = (problemsDB.final.length > 0) ? problemsDB.final[Math.floor(Math.random() * problemsDB.final.length)] : { q: "Área 12×8", ans: "96" };

    // ajustar HUD y retratos al INTI
    hudLevel.textContent = `Nivel Final — INTI`;   // <-- CORRECCIÓN: mostrar Nivel Final en el HUD
    updateHUD_Points();                            // <-- CORRECCIÓN: asegurar puntos en HUD (evita discrepancias)
    bossName.textContent = "INTI — Dios del Sol";
    bossPortrait.style.backgroundImage = "url('sprites/inti_big.png')";
    dialogueUI.textContent = "Has desbloqueado al INTI. Resuelve su desafío final.";

    // limpiar entrada para que no quede la respuesta anterior (evita "respuesta fantasmas")
    inputAnswer = "";
    answerValue.textContent = "";

    problemText.textContent = finalProblem.q;

    buildKeyboard();

    // cambiar el submit para el final
    document.getElementById("submitBtn").onclick = handleFinalSubmit;

  } else {
    // si no desbloqueó, mostrar resumen final
    showSummary();
  }
}

function handleFinalSubmit() {
  stopTimer();

  // limpiar o leer la respuesta actual
  const your = inputAnswer.trim();
  const correct = (your === String(finalProblem.ans));

  if (correct) {
    totalPoints += 50;
    dialogueUI.textContent = "INTI: ¡Has triunfado!";
  } else {
    dialogueUI.textContent = "INTI: No fue suficiente.";
  }

  // actualizar HUD puntos antes de mostrar resumen final
  updateHUD_Points();

  levelResults.push({ level: "Final", q: finalProblem.q, your: your || "(vacío)", correct, correctAns: finalProblem.ans, pts: correct ? 50 : 0, bonus: 0 });

  // limpiar entrada tras enviar
  inputAnswer = "";
  answerValue.textContent = "";

  setTimeout(showSummary, 900);
}

/* ============================================================
   SHOW SUMMARY
============================================================ */
function showSummary() {
  gameRoot.style.display = "none";
  finalScreen.classList.remove("hidden");
  finalScreen.style.display = "flex";

  finalPointsUI.textContent = `Puntaje Total: ${totalPoints}`;
  finalBonusUI.textContent = `Bonus Total: ${totalBonus}`;

  const unlocked = (levelResults.slice(0, 9).every(r => r.correct)) && totalBonus >= 50;
  finalUnlock.textContent = unlocked ? "✔ Nivel Final Desbloqueado" : "✘ Nivel Final NO desbloqueado";

  resultsBody.innerHTML = "";

  levelResults.forEach(r => {
    if (r.level === "Final" && !unlocked) return;

    const tr = document.createElement("tr");

    const tdLevel = document.createElement("td"); tdLevel.textContent = r.level; tdLevel.style.whiteSpace = "normal"; tdLevel.style.wordBreak = "break-word"; tr.appendChild(tdLevel);
    const tdQ = document.createElement("td"); tdQ.textContent = r.q; tdQ.style.whiteSpace = "normal"; tdQ.style.wordBreak = "break-word"; tr.appendChild(tdQ);
    const tdYour = document.createElement("td"); tdYour.textContent = r.your; tdYour.style.whiteSpace = "normal"; tdYour.style.wordBreak = "break-word"; tr.appendChild(tdYour);
    const tdCorrect = document.createElement("td"); tdCorrect.textContent = r.correctAns; tdCorrect.style.whiteSpace = "normal"; tdCorrect.style.wordBreak = "break-word"; tr.appendChild(tdCorrect);
    const tdPts = document.createElement("td"); tdPts.textContent = r.pts; tdPts.style.whiteSpace = "normal"; tdPts.style.wordBreak = "break-word"; tr.appendChild(tdPts);
    const tdBonus = document.createElement("td"); tdBonus.textContent = r.bonus; tdBonus.style.whiteSpace = "normal"; tdBonus.style.wordBreak = "break-word"; tr.appendChild(tdBonus);

    resultsBody.appendChild(tr);
  });

  // Scroll control
  finalTableContainer.scrollTop = 0;
  finalScroll.value = 0;
  finalScroll.oninput = () => { const max = finalTableContainer.scrollHeight - finalTableContainer.clientHeight; finalTableContainer.scrollTop = max * (finalScroll.value / 100); };
}

/* ============================================================
   BOTONES
============================================================ */
playAgainBtn.onclick = () => location.reload();

// sound toggle + volume control (persistente)
soundToggle.onclick = () => {
  if (menuMusic.paused) {
    menuMusic.play().then(() => soundToggle.textContent = "🔊").catch(() => soundToggle.textContent = "🔈");
  } else {
    menuMusic.pause();
    soundToggle.textContent = "🔈";
  }
};

// inicialización del slider (si existe en DOM)
if (volumeSlider) {
  // establecer volumen inicial (coincide con valor por defecto del slider)
  menuMusic.volume = Number(volumeSlider.value);
  volumeSlider.addEventListener("input", (e) => {
    menuMusic.volume = Number(e.target.value);
  });
}

/* ============================================================
   MENÚ HISTORIA
============================================================ */
document.getElementById("btnHistory").onclick = async () => {
  await prepareProblemsDB();
  assembleProblems();
  mainMenu.style.display = "none";
  namePanel.style.display = "flex";
};

/* ============================================================
   INICIAR PARTIDA LUEGO DEL NOMBRE
============================================================ */
startJourneyBtn.onclick = () => {
  if (nameInput.value.trim() === "") { showIncaAlert("Ingresa tu nombre antes de continuar."); return; }

  document.getElementById("playerName").textContent = nameInput.value.trim();
  document.getElementById("playerPortrait").style.backgroundImage = "url('sprites/player.png')";

  namePanel.style.display = "none";

  gameRoot.style.display = "flex";
  gameRoot.classList.remove("hidden");

  currentLevel = 1;
  totalPoints = 0;
  totalBonus = 0;
  levelResults = [];

  // Intentar reproducir música automáticamente (si el navegador lo permite).
  menuMusic.play().then(() => soundToggle.textContent = "🔊").catch(() => { /* autoplay bloqueado; usuario debe interactuar */ });

  startLevel();
};

/* ============================================================
   OTROS MODOS
============================================================ */
document.getElementById("btnTraining").onclick = () => showIncaAlert("Modo Entrenamiento pronto.");
// document.getElementById("btnRules").onclick = () => showIncaAlert(" 9 niveles + 1 nivel final desbloqueable (10). Dificultad creciente  Dificultad creciente:  nivel 1 al 3 (fácil) niveles 4 - 6(Intermedio) niveles 1 - 3(Difícil)")
document.getElementById("btnRules").onclick = () => showIncaAlert(`
REGLAS:

📌 Niveles
• 9 niveles + 1 nivel final desbloqueable (10).
• Dificultad creciente:
  - Nivel 1–3: Fácil
  - Nivel 4–6: Intermedio
  - Nivel 7–9: Difícil
• Nivel 10: problema del “Dios Sol”, desafío máximo.

📌 Problemas
• Problemas geométricos diferentes cada partida.
• Tiempo por nivel: 1 min 30 seg.
• Bonus por rapidez:
   0–30 seg → +30 pts
  31–60 seg → +20 pts
  61–90 seg → +10 pts
  +90 seg     →     0 pts

📌 Puntaje
• Respuesta correcta: +50 pts.
• Respuesta incorrecta: 0 pts.
• Bonus solo del nivel 1–9.
• Nivel final: sin temporizador ni bonus.
• Para desbloquear nivel final: completar niveles 1–9 + acumular 50 bonus.
`);

/* ============================================================
   ARRANQUE
============================================================ */
window.addEventListener("DOMContentLoaded", () => {
  mainMenu.style.display = "flex";
  namePanel.style.display = "none";
  gameRoot.classList.add("hidden");
  finalScreen.classList.add("hidden");

  // aseguremos el volumen del slider si existe
  if (volumeSlider) {
    menuMusic.volume = Number(volumeSlider.value);
  }
});
