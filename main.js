console.log("SCRIPT ESEGUITO");

let allQuestions = [];
let sessionQuestions = [];
let selectedAnswers = [];
let currentIndex = 0;
let currentMode = "training";

let examTimeLeft = 600;
let examTimerInterval = null;

const EXAM_SPEC = {
  "agricoltura": 5,
  "pronto soccorso": 5,
  "legislazione": 5
};

const setup = document.getElementById("setup");
const quiz = document.getElementById("quiz");
const summary = document.getElementById("summary");

const questionBox = document.getElementById("questionBox");
const optionsBox = document.getElementById("options");
const progressCurrent = document.getElementById("currentNum");
const progressTotal = document.getElementById("totalNum");

const examTimer = document.getElementById("examTimer");
const timerValue = document.getElementById("timerValue");

document.getElementById("startBtn").addEventListener("click", startSession);
document.getElementById("nextBtn").addEventListener("click", nextQuestion);
document.getElementById("prevBtn").addEventListener("click", prevQuestion);
document.getElementById("stopBtn").addEventListener("click", endSession);
document.getElementById("restartBtn").addEventListener("click", () => location.reload());

window.addEventListener("load", () => {
  fetch("questions.json")
    .then(r => r.json())
    .then(data => {
      allQuestions = data;
    });
});

function startExamTimer() {
  examTimeLeft = 600;
  updateTimerDisplay();

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

function startSession() {
  if (!allQuestions.length) {
    alert("Nessuna domanda disponibile.");
    return;
  }

  currentMode = document.querySelector('input[name="mode"]:checked').value;
  selectedAnswers = [];

  if (currentMode === "training") {
    examTimer.classList.add("hidden");
    clearInterval(examTimerInterval);

    sessionQuestions = shuffle(allQuestions.slice());
    progressTotal.textContent = sessionQuestions.length;

  } else {
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
      alert(msg);
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

function showQuestion() {
  const q = sessionQuestions[currentIndex];
  progressCurrent.textContent = currentIndex + 1;

  questionBox.textContent = q.question;
  optionsBox.innerHTML = "";

  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.textContent = opt;

    if (selectedAnswers[currentIndex] === i) {
      btn.classList.add("selected");
    }

    btn.addEventListener("click", () => {
      selectedAnswers[currentIndex] = i;
      showQuestion();
      document.getElementById("nextBtn").disabled = false;
    });

    optionsBox.appendChild(btn);
  });

  document.getElementById("prevBtn").disabled = currentIndex === 0;
  document.getElementById("nextBtn").disabled = selectedAnswers[currentIndex] == null;
}

function nextQuestion() {
  if (currentIndex < sessionQuestions.length - 1) {
    currentIndex++;
    showQuestion();
  }
}

function prevQuestion() {
  if (currentIndex > 0) {
    currentIndex--;
    showQuestion();
  }
}

function endSession() {
  clearInterval(examTimerInterval);

  let correct = 0;
  sessionQuestions.forEach((q, i) => {
    if (selectedAnswers[i] === q.correct) correct++;
  });

  const total = sessionQuestions.length;
  const score = Math.round((correct / total) * 100);

  summaryText.textContent =
    `Hai risposto correttamente a ${correct} domande su ${total}.\nPunteggio: ${score}%`;

  quiz.classList.add("hidden");
  summary.classList.remove("hidden");
}

function shuffle(arr) {
  return arr.sort(() => Math.random() - 0.5);
}
