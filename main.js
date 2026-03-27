console.log("SCRIPT ESEGUITO");

/*
  main.js aggiornato:
  - Timer Esame impostato a 30 minuti
  - Regole di superamento applicate solo in modalità Esame:
    * Bocciato se >= 4 errori totali
    * Bocciato se >= 2 errori in qualsiasi materia
  - Include modalità "Training per materia" (select popolato da questions.json)
  - Normalizzazione subject per matching coerente
  - Training: feedback immediato, evidenzia corretta in verde, non permette tornare indietro
  - Exam: timer 30 minuti, nessun feedback immediato, possibilità di cambiare risposta e tornare indietro
  - Riepilogo training: considera solo le domande a cui l'utente ha risposto
  - Riepilogo esame: mostra conteggio per materia e lista dettagliata delle domande con risposta corretta e risposta utente
  - EXAM_SPEC: legislazione 14, zoologia 7, agricoltura 4, armi 4, pronto soccorso 1
*/

let allQuestions = [];
let sessionQuestions = [];
let selectedAnswers = [];
let currentIndex = 0;
let currentMode = "training";

let examTimeLeft = 1800; // 30 minuti in secondi
let examTimerInterval = null;

const EXAM_SPEC = {
  "legislazione": 14,
  "zoologia": 7,
  "agricoltura": 4,
  "armi": 4,
  "pronto soccorso": 1
};

const setup = document.getElementById("setup");
const quiz = document.getElementById("quiz");
const summary = document.getElementById("summary");

const questionBox = document.getElementById("questionBox");
const optionsBox = document.getElementById("options");
const progressCurrent = document.getElementById("currentNum");
const progressTotal = document.getElementById("totalNum");
const subjectTag = document.getElementById("subjectTag");

const examTimer = document.getElementById("examTimer");
const timerValue = document.getElementById("timerValue");

const startBtn = document.getElementById("startBtn");
const nextBtn = document.getElementById("nextBtn");
const prevBtn = document.getElementById("prevBtn");
const stopBtn = document.getElementById("stopBtn");
const restartBtn = document.getElementById("restartBtn");
const summaryText = document.getElementById("summaryText");

// ----------------- Utility: subject normalization & select population -----------------
function normalizeSubject(s) {
  if (!s) return "";
  return String(s).trim().toLowerCase();
}
function prettySubject(s) {
  if (!s) return "";
  const n = normalizeSubject(s);
  return n.charAt(0).toUpperCase() + n.slice(1);
}
function populateSubjectSelect(questions) {
  const select = document.getElementById('subjectSelect');
  if (!select) return;
  const subjects = Array.from(new Set(questions.map(q => normalizeSubject(q.subject)).filter(Boolean)));
  subjects.sort();
  while (select.options.length > 1) select.remove(1);
  subjects.forEach(sub => {
    const opt = document.createElement('option');
    opt.value = sub;
    opt.textContent = prettySubject(sub);
    select.appendChild(opt);
  });
}
function updateSubjectRowVisibility() {
  const row = document.getElementById('subjectRow');
  const mode = document.querySelector('input[name="mode"]:checked').value;
  if (mode === 'training') {
    row.classList.remove('hidden');
  } else {
    row.classList.add('hidden');
    const sel = document.getElementById('subjectSelect');
    if (sel) sel.value = '';
  }

  // Nascondi il riquadro timer in tutte le modalità diverse da "exam"
  if (mode !== 'exam') {
    examTimer.classList.add('hidden');
  }
}
function filterQuestionsBySubject(allQuestions) {
  const sel = document.getElementById('subjectSelect');
  if (!sel) return allQuestions.slice();
  const selected = sel.value;
  if (!selected) return allQuestions.slice();
  return allQuestions.filter(q => normalizeSubject(q.subject) === selected);
}

// ----------------- Event wiring -----------------
startBtn.addEventListener("click", startSession);
nextBtn.addEventListener("click", nextQuestion);
prevBtn.addEventListener("click", prevQuestion);
stopBtn.addEventListener("click", () => {
  if (currentMode === "exam") {
    if (!confirm("Sei sicuro di voler consegnare l'esame?")) return;
  } else {
    if (!confirm("Vuoi interrompere la sessione di training?")) return;
  }
  endSession();
});
restartBtn.addEventListener("click", () => location.reload());

// ----------------- Fetch questions and initialize select -----------------
window.addEventListener("load", () => {
  fetch("questions.json")
    .then(r => {
      if (!r.ok) throw new Error("Impossibile caricare questions.json");
      return r.json();
    })
    .then(data => {
      // normalizza subject in memoria
      allQuestions = data.map(q => ({
        ...q,
        subject: q.subject ? String(q.subject).trim() : ""
      }));

      populateSubjectSelect(allQuestions);
      updateSubjectRowVisibility();

      // assicurati che il timer sia nascosto all'avvio (visibile solo quando parte l'esame)
      examTimer.classList.add('hidden');

      document.querySelectorAll('input[name="mode"]').forEach(radio => {
        radio.addEventListener('change', updateSubjectRowVisibility);
      });

      // salva per debug
      window._allQuestions = allQuestions;
    })
    .catch(err => {
      console.error("Errore caricamento questions.json:", err);
      alert("Errore caricamento domande. Controlla questions.json.");
    });
});

// ----------------- TIMER -----------------
function startExamTimer() {
  examTimeLeft = 1800; // 30 minuti
  updateTimerDisplay();

  if (examTimerInterval) clearInterval(examTimerInterval);
  examTimerInterval = setInterval(() => {
    examTimeLeft--;
    updateTimerDisplay();
    if (examTimeLeft <= 0) {
      clearInterval(examTimerInterval);
      examTimerInterval = null;
      alert("Tempo scaduto! L'esame è stato consegnato.");
      endSession();
    }
  }, 1000);
}

function updateTimerDisplay() {
  const m = Math.floor(examTimeLeft / 60);
  const s = examTimeLeft % 60;
  timerValue.textContent = `${m}:${s.toString().padStart(2, "0")}`;
}

// ----------------- SESSIONE -----------------
function startSession() {
  if (!allQuestions.length) {
    alert("Nessuna domanda disponibile.");
    return;
  }

  currentMode = document.querySelector('input[name="mode"]:checked').value;
  selectedAnswers = [];

  // set stop button label depending on mode
  stopBtn.textContent = currentMode === "exam" ? "Consegna Esame" : "Stop";

  // disable start to avoid doppio click
  startBtn.disabled = true;

  if (currentMode === "training") {
    // Training: immediate feedback, use all questions shuffled (o filtrate per materia)
    if (examTimerInterval) {
      clearInterval(examTimerInterval);
      examTimerInterval = null;
    }
    examTimer.classList.add("hidden");

    const filtered = filterQuestionsBySubject(allQuestions);
    if (!filtered.length) {
      alert("Non ci sono domande per la materia selezionata. Seleziona un'altra materia o usa Tutte le materie.");
      startBtn.disabled = false;
      return;
    }

    sessionQuestions = shuffle(filtered.slice());
    progressTotal.textContent = sessionQuestions.length;

  } else {
    // Exam: build sessionQuestions according to EXAM_SPEC
    examTimer.classList.remove("hidden");
    startExamTimer();

    const grouped = {};
    allQuestions.forEach(q => {
      const subj = normalizeSubject(q.subject);
      if (!grouped[subj]) grouped[subj] = [];
      grouped[subj].push(q);
    });

    const missing = [];
    for (const [subj, need] of Object.entries(EXAM_SPEC)) {
      const avail = (grouped[subj] || []).length;
      if (avail < need) missing.push({ subj, need, avail });
    }
    if (missing.length) {
      let msg = "Non ci sono abbastanza domande per la modalità Esame:\n";
      missing.forEach(m => msg += `- ${m.subj}: richieste ${m.need}, disponibili ${m.avail}\n`);
      msg += "Carica più domande o usa Training.";
      alert(msg);
      examTimer.classList.add("hidden");
      clearInterval(examTimerInterval);
      startBtn.disabled = false;
      return;
    }

    sessionQuestions = [];
    for (const [subj, need] of Object.entries(EXAM_SPEC)) {
      const pool = grouped[subj].slice();
      sessionQuestions = sessionQuestions.concat(shuffle(pool).slice(0, need));
    }
    sessionQuestions = shuffle(sessionQuestions);
    progressTotal.textContent = sessionQuestions.length;
  }

  // initialize selectedAnswers array with nulls
  selectedAnswers = new Array(sessionQuestions.length).fill(null);

  setup.classList.add("hidden");
  summary.classList.add("hidden");
  quiz.classList.remove("hidden");

  currentIndex = 0;
  showQuestion();
}

// ----------------- SHOW QUESTION -----------------
function showQuestion() {
  const q = sessionQuestions[currentIndex];
  progressCurrent.textContent = currentIndex + 1;
  progressTotal.textContent = sessionQuestions.length;
  subjectTag.textContent = prettySubject(q.subject || "");
  questionBox.textContent = q.question;
  optionsBox.innerHTML = "";

  // render options
  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = opt;
    btn.className = "";

    // Training mode: if answered, show immediate feedback (correct/incorrect)
    if (currentMode === "training") {
      if (selectedAnswers[currentIndex] != null) {
        // disable all and show correct/incorrect
        if (i === q.correct) btn.classList.add("correct");
        if (selectedAnswers[currentIndex] === i && i !== q.correct) btn.classList.add("incorrect");
        btn.disabled = true;
      }
    } else {
      // Exam mode: highlight selected only (no feedback)
      if (selectedAnswers[currentIndex] === i) btn.classList.add("selected");
    }

    btn.addEventListener("click", () => {
      if (currentMode === "training") {
        // immediate feedback: lock selection, highlight correct and incorrect
        selectedAnswers[currentIndex] = i;
        // mark buttons accordingly by re-rendering
        showQuestion();
        // enable next
        nextBtn.disabled = false;
      } else {
        // exam: allow changing answer, no immediate feedback
        selectedAnswers[currentIndex] = i;
        // re-render to show selected state
        showQuestion();
        nextBtn.disabled = false;
      }
    });

    optionsBox.appendChild(btn);
  });

  // Controls behavior:
  if (currentMode === "training") {
    // In training: no going back to change previous answers
    prevBtn.disabled = true;
    // Next enabled only after answering current
    nextBtn.disabled = selectedAnswers[currentIndex] == null;
  } else {
    // In exam: allow prev/next navigation
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex >= sessionQuestions.length - 1 || selectedAnswers[currentIndex] == null;
  }
}

// ----------------- NAVIGATION -----------------
function nextQuestion() {
  if (currentIndex < sessionQuestions.length - 1) {
    currentIndex++;
    showQuestion();
  }
}

function prevQuestion() {
  if (currentMode === "exam" && currentIndex > 0) {
    currentIndex--;
    showQuestion();
  }
}

// ----------------- END SESSION -----------------
function endSession() {
  if (examTimerInterval) {
    clearInterval(examTimerInterval);
    examTimerInterval = null;
  }

  const perSubject = {};
  sessionQuestions.forEach((q, i) => {
    const subj = q.subject ? normalizeSubject(q.subject) : "altro";
    if (!perSubject[subj]) perSubject[subj] = { correct: 0, totalAnswered: 0 };
    if (currentMode === "training") {
      if (selectedAnswers[i] != null) {
        perSubject[subj].totalAnswered++;
        if (selectedAnswers[i] === q.correct) perSubject[subj].correct++;
      }
    } else {
      perSubject[subj].totalAnswered++;
      if (selectedAnswers[i] === q.correct) perSubject[subj].correct++;
    }
  });

  // build summary text: show counts per subject (correct / answered or total)
  let out = "";
  const subjectsSorted = Object.keys(perSubject).sort();
  subjectsSorted.forEach(s => {
    out += `${prettySubject(s)}: ${perSubject[s].correct} / ${perSubject[s].totalAnswered} corrette\n`;
  });

  // overall totals e calcolo errori
  const totalAnswered = sessionQuestions.reduce((acc, q, i) => {
    if (currentMode === "training") return acc + (selectedAnswers[i] != null ? 1 : 0);
    return acc + 1;
  }, 0);

  const totalCorrect = sessionQuestions.reduce((acc, q, i) => acc + (selectedAnswers[i] === q.correct ? 1 : 0), 0);
  const totalErrors = totalAnswered - totalCorrect;

  out += `\nTotale corrette: ${totalCorrect} / ${totalAnswered}\n`;
  out += `Totale errori: ${totalErrors}\n`;

  // calcolo errori per materia (già abbiamo perSubject con correct e totalAnswered)
  const subjectErrors = {};
  Object.keys(perSubject).forEach(s => {
    const info = perSubject[s];
    const errs = info.totalAnswered - info.correct;
    subjectErrors[s] = errs;
  });

  // Regole di superamento applicate SOLO in modalità Esame
  let failed = false;
  let failReasons = [];

  if (currentMode === "exam") {
    // Regola 1: 4 o più errori totali => bocciato
    if (totalErrors >= 4) {
      failed = true;
      failReasons.push(`Errore: ${totalErrors} errori totali (soglia 4)`);
    }

    // Regola 2: 2 o più errori in qualsiasi materia => bocciato
    for (const [s, errs] of Object.entries(subjectErrors)) {
      if (errs >= 2) {
        failed = true;
        failReasons.push(`Errore: ${prettySubject(s)} ha ${errs} errori (soglia 2)`);
      }
    }
  }

  // Aggiungi esito al riepilogo
  if (currentMode === "exam") {
    if (failed) {
      out += `\nESITO: BOCCIATO\n`;
      out += failReasons.map(r => `- ${r}`).join("\n") + "\n";
    } else {
      out += `\nESITO: PROMOSSO\n`;
    }
  } else {
    out += `\nESITO: (valutazione disponibile solo in modalità Esame)\n`;
  }

  // If exam mode, append detailed list of questions with correct answer and user's answer
  if (currentMode === "exam") {
    let html = `<div class="exam-list">`;
    sessionQuestions.forEach((q, i) => {
      const userIdx = selectedAnswers[i];
      const userText = userIdx == null ? "<em>Non risposta</em>" : escapeHtml(q.options[userIdx]);
      const correctText = escapeHtml(q.options[q.correct]);
      const isCorrect = userIdx === q.correct;
      const itemClass = isCorrect ? "ans correct" : "ans incorrect";

      html += `<div class="exam-item">`;
      html += `<div class="q">${escapeHtml(q.question)}</div>`;
      html += `<div class="meta">Materia: ${escapeHtml(prettySubject(q.subject || "altro"))}</div>`;
      html += `<div class="${itemClass}"><strong>Risposta corretta:</strong> ${correctText}</div>`;
      html += `<div class="${isCorrect ? "ans correct" : "ans incorrect"}"><strong>Tua risposta:</strong> ${userText}</div>`;
      html += `</div>`;
    });
    html += `</div>`;

    summaryText.innerHTML = `<pre style="white-space:pre-wrap;font-family:monospace;">${escapeHtml(out)}</pre>` + html;
  } else {
    // training: plain text summary (counts only answered)
    summaryText.textContent = out;
  }

  quiz.classList.add("hidden");
  summary.classList.remove("hidden");

  // re-enable start button for a new session
  startBtn.disabled = false;
}

// ----------------- UTIL -----------------
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function escapeHtml(str) {
  if (str == null) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
