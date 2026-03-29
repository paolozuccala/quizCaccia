quizCaccia — Descrizione

quizCaccia è un’applicazione web per esercitarsi alle domande dell’esame venatorio. Funziona interamente lato client: basta un browser moderno, non richiede installazioni o database. Offre modalità Training (con feedback immediato) e Esame (simulazione fedele all'ufficiale).

Funzionalità principali
- Modalità Training: feedback immediato, evidenzia la risposta corretta, non permette di modificare risposte già date. Ci si ferma quando si vuole con tasto Stop.
- Training per materia: possibilità di esercitarsi su una singola materia selezionabile prima di avviare la sessione.
- Modalità Esame: timer di 30 minuti, nessun feedback immediato, navigazione avanti/indietro, distribuzione domande conforme alla specifica ufficiale (30 domande di cui 14 di legislazione, 7 di agricoltura, 4 di zoologia, 4 di armi e 1 di pronto soccorso. Si viene bocciati >=4 errori totali o con >=2 errori in qualsiasi materia).
- Riepilogo: in Training mostra quante risposte corrette per materia, oltre che le totali corrette sulle totali provate; in Esame oltre a ciò, mostra anche tutte e 30 le domande con risposta data e risposta corretta (oltre che PROMOSSO/BOCCIATO).
- Zero dipendenze server: il progetto è composto da file statici (index.html, styles.css, main.js, questions.json).

Struttura del progetto
File principali
- index.html — interfaccia utente.
- styles.css — stili dell’app.
- main.js — logica dell’applicazione.
- questions.json — archivio delle domande.

Formato domanda (questions.json)
Ogni domanda è un oggetto con i campi: id, question, options, correct, subject.

Esempio:
  {
    "id": "Agricoltura - 3",
    "question": "Quale tipo di coltura è preferita come pastura dal colombaccio?",
    "options": [
      "La soia",
      "La barbabietola da zucchero",
      "Il mais"
    ],
    "correct": 2,
    "subject": "agricoltura"
  }

Autore: Paolo Zuccala' Maganzini, con l'aiuto di Microsoft Copilot.
