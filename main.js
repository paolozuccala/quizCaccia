// script.js - Quiz Caccia con modalità Esame e Training senza ripetizioni
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

function loadQuestionsFromFetched(data){
  if(Array.isArray(data) && data.length){
    const ok = data.every(q => q.question && Array.isArray(q.options) && typeof q.correct === 'number' && q.subject);
    if(ok){
      allQuestions = data.map(q => ({...q, subject: q.subject.trim().toLowerCase()}));
      return true;
    }
  }
  return false;
}

console.log("SCRIPT ESEGUITO");

window.addEventListener('load', () => {
  // prova a caricare questions.json dalla root (quando ospitato)
  fetch('questions.json').then(r => {
    if(r.ok) return r.json();
    throw new Error('no file');
  }).then(data => {
    if(!loadQuestionsFromFetched(data)) throw new Error('invalid');
  }).catch(()=> {
    // fallback a sample
    allQuestions = SAMPLE_QUESTIONS.slice();
  });
});

// utility shuffle
function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]] } return a; }

startBtn.addEventListener('click', startSession);
nextBtn.addEventListener('click', nextQuestion);
stopBtn.addEventListener('click', showSummary);
restartBtn.addEventListener('click', resetToSetup);

// start session: training o exam
function startSession(){
  if(!allQuestions.length){ alert('Nessuna domanda disponibile.'); return; }
  resetSubjectStats();
  currentIndex = -1;
  correctCount = 0;
  askedCount = 0;
  legislationErrors = 0;

  const mode = document.querySelector('input[name="mode"]:checked').value;
  if(mode === 'training'){
    // Training senza ripetizioni: usa tutte le domande mescolate una sola volta
    sessionQuestions = shuffle(allQuestions.slice());
    progressTotal.textContent = sessionQuestions.length;
  } else {
    // Exam mode: selezione per materia secondo EXAM_SPEC
    const grouped = {};
    allQuestions.forEach(q => {
  if (!grouped[q.subject]) grouped[q.subject] = [];
  grouped[q.subject].push(q);
});
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
    progressTotal.textContent = sessionQuestions.length;
  }

  setup.classList.add('hidden');
  summary.classList.add('hidden');
  quiz.classList.remove('hidden');
  nextQuestion();
}

// render domanda corrente
function renderQuestion(q){
  // mostra soggetto con prima lettera maiuscola
  subjectTag.textContent = q.subject ? (q.subject.charAt(0).toUpperCase() + q.subject.slice(1)) : '';
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

// gestione selezione
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

// prossima domanda
function nextQuestion(){
  currentIndex++;
  const mode = document.querySelector('input[name="mode"]:checked').value;
  // se supero l'ultima domanda
  if(currentIndex >= sessionQuestions.length){
    // in Training non ricomincio: termino e mostro riepilogo
    showSummary();
    return;
  }
  renderQuestion(sessionQuestions[currentIndex]);
}

// riepilogo
function showSummary(){
  quiz.classList.add('hidden');
  summary.classList.remove('hidden');
  const mode = document.querySelector('input[name="mode"]:checked').value;
  const total = (mode === 'training') ? askedCount : sessionQuestions.length;
  const errors = total - correctCount;
  let text = `Hai risposto correttamente a ${correctCount} domande su ${total}.\nErrori totali: ${errors}\n\nDettaglio per materia:\n`;
  for(const [subj, stats] of Object.entries(perSubjectStats)){
    text += `- ${subj}: corrette ${stats.correct || 0} / ${stats.asked || 0}; errori ${stats.errors || 0}\n`;
  }
  if(mode === 'exam'){
    let passed = true;
    const reasons = [];
    if(errors > MAX_TOTAL_ERRORS){ passed = false; reasons.push(`Troppi errori totali (${errors} > ${MAX_TOTAL_ERRORS})`); }
    if(legislationErrors > MAX_LEGISLATION_ERRORS){ passed = false; reasons.push(`Troppi errori in legislazione (${legislationErrors} > ${MAX_LEGISLATION_ERRORS})`); }
    text += '\nRisultato: ' + (passed ? 'PROMOSSO ✅' : 'NON PROMOSSO ❌') + '\n';
    if(!passed){ text += 'Motivi:\n' + reasons.map(r => '- ' + r).join('\n') + '\n'; }
  } else {
    // Training: mostra solo errori su totale (nessuna percentuale)
    text += `\nRiepilogo Training: errori ${errors} su ${total} domande.`;
  }
  summaryText.textContent = text;
}

// reset
function resetToSetup(){
  summary.classList.add('hidden');
  quiz.classList.add('hidden');
  setup.classList.remove('hidden');
}


