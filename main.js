console.log("SCRIPT ESEGUITO");

/*
  main.js aggiornato:
  - Timer visibile solo durante la modalità Esame (element presente ma hidden fino all'avvio esame)
  - Training: feedback immediato, evidenzia corretta in verde, non permette tornare indietro
  - Exam: timer 10 minuti, nessun feedback immediato, possibilità di cambiare risposta e tornare indietro
  - Stop button: "Stop" in training, "Consegna Esame" in exam
  - Riepilogo training: considera solo le domande a cui l'utente ha risposto prima di premere Stop
  - Riepilogo esame: mostra conteggio per materia e lista dettagliata delle domande con risposta corretta e risposta utente
  - EXAM_SPEC: legislazione 14, zoologia 7, agricoltura 4, armi 4, pronto soccorso 1
*/

let allQuestions = [];
let sessionQuestions = [];
let selectedAnswers = [];
let currentIndex = 0;
let currentMode = "training";

let examTimeLeft = 600;
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

window.addEventListener("load", () => {
  fetch("questions.json")
    .then(r => {
      if (!r.ok) throw new Error("Impossibile caricare questions.json");
      return r.json();
    })
    .then(data => {
      allQuestions = data;
    })
    .catch(err => {
      console.error("Errore caricamento questions.json:", err);
      alert("Errore caricamento domande. Controlla questions.json.");
    });
});

/* TIMER */
function startExamTimer() {
  examTimeLeft = 600;
  updateTimerDisplay();

  if (examTimerInterval) clearInterval(examTimerInterval);
  examTimerInterval = setInterval(() => {
    examTimeLeft--;
    updateTimerDisplay();
    if (examTimeLeft <= 0) {
      clearInterval(examTimerInterval);
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

/* SESSIONE */
function startSession() {
  if (!allQuestions.length) {
    alert("Nessuna domanda disponibile.");
    return;
  }

  currentMode = document.querySelector('input[name="mode"]:checked').value;
  selectedAnswers = [];

  // set stop button label depending on mode
  stopBtn.textContent = currentMode === "exam" ? "Consegna Esame" : "Stop";

  if (currentMode === "training") {
    // Training: immediate feedback, use all questions shuffled
    if (examTimerInterval) {
      clearInterval(examTimerInterval);
      examTimerInterval = null;
    }
    examTimer.classList.add("hidden");

    sessionQuestions = shuffle(allQuestions.slice());
    progressTotal.textContent = sessionQuestions.length;

  } else {
    // Exam: build sessionQuestions according to EXAM_SPEC
    examTimer.classList.remove("hidden");
    startExamTimer();

    const grouped = {};
    allQuestions.forEach(q => {
      if (!grouped[q.subject]) grouped[q.subject] = [];
      grouped[q.subject].push(q);
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

  setup.classList.add("hidden");
  summary.classList.add("hidden");
  quiz.classList.remove("hidden");

  currentIndex = 0;
  showQuestion();
}

/* SHOW QUESTION */
function showQuestion() {
  const q = sessionQuestions[currentIndex];
  progressCurrent.textContent = currentIndex + 1;
  progressTotal.textContent = sessionQuestions.length;
  subjectTag.textContent = q.subject || "";
  questionBox.textContent = q.question;
  optionsBox.innerHTML = "";

  // ensure selectedAnswers array has slot
  if (selectedAnswers.length < sessionQuestions.length) {
    selectedAnswers.length = sessionQuestions.length;
  }

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

/* NAVIGATION */
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

/* END SESSION: show per-subject correct counts
   - Training: consider only questions the user answered (selectedAnswers[i] != null)
   - Exam: consider all sessionQuestions (unanswered count as incorrect)
   - Exam: additionally show detailed list of questions with correct answer and user's answer
*/
function endSession() {
  if (examTimerInterval) {
    clearInterval(examTimerInterval);
    examTimerInterval = null;
  }

  const perSubject = {};
  sessionQuestions.forEach((q, i) => {
    const subj = q.subject || "altro";
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
    out += `${s}: ${perSubject[s].correct} / ${perSubject[s].totalAnswered} corrette\n`;
  });

  // overall totals
  const totalAnswered = sessionQuestions.reduce((acc, q, i) => {
    if (currentMode === "training") return acc + (selectedAnswers[i] != null ? 1 : 0);
    return acc + 1;
  }, 0);
  const totalCorrect = sessionQuestions.reduce((acc, q, i) => acc + (selectedAnswers[i] === q.correct ? 1 : 0), 0);

  out += `\nTotale corrette: ${totalCorrect} / ${totalAnswered}\n`;

  // If exam mode, append detailed list of questions with correct answer and user's answer
  if (currentMode === "exam") {
    // build HTML for detailed list
    let html = `<div class="exam-list">`;
    sessionQuestions.forEach((q, i) => {
      const userIdx = selectedAnswers[i];
      const userText = userIdx == null ? "<em>Non risposta</em>" : escapeHtml(q.options[userIdx]);
      const correctText = escapeHtml(q.options[q.correct]);
      const isCorrect = userIdx === q.correct;
      const itemClass = isCorrect ? "ans correct" : "ans incorrect";

      html += `<div class="exam-item">`;
      html += `<div class="q">${escapeHtml(q.question)}</div>`;
      html += `<div class="meta">Materia: ${escapeHtml(q.subject || "altro")}</div>`;
      html += `<div class="${itemClass}"><strong>Risposta corretta:</strong> ${correctText}</div>`;
      html += `<div class="${isCorrect ? "ans correct" : "ans incorrect"}"><strong>Tua risposta:</strong> ${userText}</div>`;
      html += `</div>`;
    });
    html += `</div>`;

    // combine textual summary and detailed HTML
    summaryText.innerHTML = `<pre style="white-space:pre-wrap;font-family:monospace;">${escapeHtml(out)}</pre>` + html;
  } else {
    // training: plain text summary (counts only answered)
    summaryText.textContent = out;
  }

  quiz.classList.add("hidden");
  summary.classList.remove("hidden");
}

/* UTIL */
function shuffle(arr) {
  // Fisher-Yates
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
