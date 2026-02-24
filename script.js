// script.js - Quiz Caccia con modalità Esame
const EXAM_SPEC = {
  "legislazione": 14,
  "zoologia": 7,
  "agricoltura": 4,
  "armi": 4,
  "pronto soccorso": 1
};
const MAX_TOTAL_ERRORS = 4;
const MAX_LEGISLATION_ERRORS = 3;

let allQuestions = [];
let sessionQuestions = [];
let currentIndex = -1;
let correctCount = 0;
let askedCount = 0;
let legislationErrors = 0;
let perSubjectStats = {};

const startBtn = document.getElementById('startBtn');
const numInput = document.getElementById('numQuestions');
const fileInput = document.getElementById('fileInput');
const setup = document.getElementById('setup');
const quiz = document.getElementById('quiz');
const questionBox = document.getElementById('questionBox');
const optionsDiv = document.getElementById('options');
const nextBtn = document.getElementById('nextBtn');
const stopBtn = document.getElementById('stopBtn');
const progressCurrent = document.getElementById('currentNum');
const progressTotal = document.getElementById('totalNum');
const summary = document.getElementById('summary');
const summaryText = document.getElementById('summaryText');
const restartBtn = document.getElementById('restartBtn');
const subjectTag = document.getElementById('subjectTag');
const trainingControls = document.getElementById('trainingControls');

const SAMPLE_QUESTIONS = [
  {"id":1,"question":"Qual è la stagione di caccia consentita per la specie X?","options":["Dal 1 gennaio","Dal 15 marzo","Dal 1 settembre"],"correct":2,"subject":"legislazione"},
  {"id":2,"question":"Quale cartuccia è consigliata per la caccia a palla?","options":["12/70","20/70","9mm"],"correct":0,"subject":"armi"},
  {"id":3,"question":"Quale dispositivo è obbligatorio per la sicurezza?","options":["Giubbotto arancione","Cappello blu","Guanti neri"],"correct":0,"subject":"legislazione"},
  {"id":4,"question":"Qual è la distanza minima di sicurezza?","options":["10 m","50 m","100 m"],"correct":1,"subject":"legislazione"},
  {"id":5,"question":"Quale segnale indica pericolo?","options":["Fischio lungo","Luce verde","Mano alzata"],"correct":0,"subject":"zoologia"},
  {"id":6,"question":"Quale animale è ungulato?","options":["Volpe","Cervo","Gabbiano"],"correct":1,"subject":"zoologia"},
  {"id":7,"question":"Cosa fare in caso di ferita grave?","options":["Applicare pressione","Ignorare","Lavare con acqua fredda"],"correct":0,"subject":"pronto soccorso"},
  {"id":8,"question":"Quale coltura è tipica della rotazione agricola?","options":["Mais","Pesce","Acciaio"],"correct":0,"subject":"agricoltura"},
  {"id":9,"question":"Come si conserva un'arma scarica?","options":["Smontata e pulita","Carica","In tasca"],"correct":0,"subject":"armi"},
  {"id":10,"question":"Quale legge regola la caccia nella regione?","options":["Legge A","Legge B","Legge C"],"correct":0,"subject":"legislazione"}
];

function resetSubjectStats(){
  perSubjectStats = {};
  Object.keys(EXAM_SPEC).forEach(s => perSubjectStats[s] = {asked:0, correct:0, errors:0});
}

function loadQuestionsFromFileObject(obj){
  if(Array.isArray(obj) && obj.length){
    // basic validation
    const ok = obj.every(q => q.question && Array.isArray(q.options) && typeof q.correct === 'number' && q.subject);
    if(ok) {
      allQuestions = obj.map(q => ({...q, subject: q.subject.trim().toLowerCase()}));
      return true;
    }
  }
  return false;
}

function readLocalQuestionsFile(file){
  const reader = new FileReader();
  reader.onload = e => {
    try{
      const data = JSON.parse(e.target.result);
      if(loadQuestionsFromFileObject(data)){
        alert(`Caricate ${data.length} domande dal file.`);
      } else {
        alert('Formato JSON non valido. Ogni domanda deve avere question, options, correct, subject.');
      }
    }catch(err){
      alert('Errore parsing JSON: ' + err.message);
    }
  };
  reader.readAsText(file, 'utf-8');
}

fileInput.addEventListener('change', (ev) => {
  const f = ev.target.files[0];
  if(f) readLocalQuestionsFile(f);
});

// mode radio handling
document.querySelectorAll('input[name="mode"]').forEach(r => {
  r.addEventListener('change', () => {
    const mode = document.querySelector('input[name="mode"]:checked').value;
    trainingControls.style.display = mode === 'training' ? 'block' : 'none';
  });
});

// start
startBtn.addEventListener('click', startSession);
nextBtn.addEventListener('click', nextQuestion);
stopBtn.addEventListener('click', showSummary);
restartBtn.addEventListener('click', resetToSetup);

window.addEventListener('load', () => {
  // try to fetch questions.json from same folder (useful when hosted)
  fetch('questions.json').then(r => {
    if(r.ok) return r.json();
    throw new Error('no file');
  }).then(data => {
    if(!loadQuestionsFromFileObject(data)) throw new Error('invalid');
  }).catch(()=> {
    // fallback to sample
    allQuestions = SAMPLE_QUESTIONS.slice();
  });
});

function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a; }

function startSession(){
  if(!allQuestions.length){ alert('Nessuna domanda disponibile.'); return; }
  resetSubjectStats();
  currentIndex = -1;
  correctCount = 0;
  askedCount = 0;
  legislationErrors = 0;

  const mode = document.querySelector('input[name="mode"]:checked').value;
  if(mode === 'training'){
    let n = Math.max(1, Math.min(allQuestions.length, parseInt(numInput.value) || 1));
    sessionQuestions = shuffle(allQuestions.slice()).slice(0, n);
  } else {
    // exam mode: group by subject and sample per EXAM_SPEC
    const grouped = {};
    allQuestions.forEach(q => grouped[q.subject] = grouped[q.subject] || [] , grouped[q.subject].push(q));
    const missing = [];
    for(const [subj, need] of Object.entries(EXAM_SPEC)){
      const avail = (grouped[subj] || []).length;
      if(avail < need) missing.push({subj, need, avail});
    }
    if(missing.length){
      let msg = 'Non ci sono abbastanza domande per la modalità Esame:\n';
      missing.forEach(m => msg += `- ${m.subj}: richieste ${m.need}, disponibili ${m.avail}\n`);
      msg += 'Carica più domande o usa Training.';
      alert(msg);
      return;
    }
    sessionQuestions = [];
    for(const [subj, need] of Object.entries(EXAM_SPEC)){
      const pool = grouped[subj].slice();
      sessionQuestions = sessionQuestions.concat(shuffle(pool).slice(0, need));
    }
    sessionQuestions = shuffle(sessionQuestions);
  }

  progressTotal.textContent = sessionQuestions.length;
  setup.classList.add('hidden');
  summary.classList.add('hidden');
  quiz.classList.remove('hidden');
  nextQuestion();
}

function renderQuestion(q){
  subjectTag.textContent = q.subject ? q.subject.toUpperCase() : '';
  questionBox.textContent = q.question;
  optionsDiv.innerHTML = '';
  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'option';
    btn.textContent = opt;
    btn.dataset.index = idx;
    btn.addEventListener('click', () => selectOption(idx, q.correct, btn));
    optionsDiv.appendChild(btn);
  });
  nextBtn.disabled = true;
  progressCurrent.textContent = askedCount + 1;
}

function selectOption(selectedIdx, correctIdx, btn){
  Array.from(optionsDiv.children).forEach(el => {
    el.classList.add('disabled');
    const i = parseInt(el.dataset.index, 10);
    if(i === correctIdx) el.classList.add('correct');
    if(i === selectedIdx && i !== correctIdx) el.classList.add('incorrect');
  });
  const q = sessionQuestions[currentIndex];
  const subj = (q.subject || '').toLowerCase();
  askedCount++;
  perSubjectStats[subj] = perSubjectStats[subj] || {asked:0, correct:0, errors:0};
  perSubjectStats[subj].asked++;
  if(selectedIdx === correctIdx){
    correctCount++;
    perSubjectStats[subj].correct++;
  } else {
    perSubjectStats[subj].errors++;
    if(subj === 'legislazione') legislationErrors++;
  }
  nextBtn.disabled = false;
  progressCurrent.textContent = askedCount;
}

function nextQuestion(){
  currentIndex++;
  if(currentIndex >= sessionQuestions.length){
    showSummary();
    return;
  }
  renderQuestion(sessionQuestions[currentIndex]);
}

function showSummary(){
  quiz.classList.add('hidden');
  summary.classList.remove('hidden');
  const total = sessionQuestions.length;
  const errors = total - correctCount;
  let text = `Hai risposto correttamente a ${correctCount} domande su ${total}.\nErrori totali: ${errors}\n\nDettaglio per materia:\n`;
  for(const [subj, stats] of Object.entries(perSubjectStats)){
    text += `- ${subj}: corrette ${stats.correct || 0} / ${stats.asked || 0}; errori ${stats.errors || 0}\n`;
  }
  if(document.querySelector('input[name="mode"]:checked').value === 'exam'){
    let passed = true;
    const reasons = [];
    if(errors > MAX_TOTAL_ERRORS){ passed = false; reasons.push(`Troppi errori totali (${errors} > ${MAX_TOTAL_ERRORS})`); }
    if(legislationErrors > MAX_LEGISLATION_ERRORS){ passed = false; reasons.push(`Troppi errori in legislazione (${legislationErrors} > ${MAX_LEGISLATION_ERRORS})`); }
    text += '\nRisultato: ' + (passed ? 'PROMOSSO ✅' : 'NON PROMOSSO ❌') + '\n';
    if(!passed){ text += 'Motivi:\n' + reasons.map(r => '- ' + r).join('\n') + '\n'; }
  } else {
    const pct = total > 0 ? (correctCount / total) * 100 : 0;
    text += `\nPercentuale di risposte corrette: ${pct.toFixed(1)}%`;
  }
  summaryText.textContent = text;
}

function resetToSetup(){
  summary.classList.add('hidden');
  quiz.classList.add('hidden');
  setup.classList.remove('hidden');
  // reset file input
  fileInput.value = '';
}