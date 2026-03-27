quizCaccia — Descrizione

quizCaccia è un’applicazione web per esercitarsi alle domande dell’esame venatorio. Funziona interamente lato client: basta un browser moderno, non richiede installazioni o database. Offre modalità Training (con feedback immediato) e Esame (simulazione fedele all'ufficiale).

Funzionalità principali
- Modalità Training: feedback immediato, evidenzia la risposta corretta, non permette di modificare risposte già date.
- Training per materia: possibilità di esercitarsi su una singola materia selezionabile prima di avviare la sessione.
- Modalità Esame: timer di 30 minuti, nessun feedback immediato, navigazione avanti/indietro, distribuzione domande conforme alla specifica ufficiale (30 domande di cui 14 di legislazione, 7 di agricoltura, 4 di zoologia, 4 di armi e 1 di pronto soccorso. Si viene bocciati 5 errori totali e con 4 errori in legislazione).
- Riepilogo: in Training mostra solo le domande a cui hai risposto; in Esame mostra conteggi per materia e lista dettagliata con risposte corrette e risposte date.
- Zero dipendenze server: il progetto è composto da file statici (index.html, styles.css, main.js, questions.json).

Struttura del progetto
File principali
- index.html — interfaccia utente.
- styles.css — stili dell’app.
- main.js — logica dell’applicazione.
- questions.json — archivio delle domande (array di oggetti).
Formato domanda (questions.json)
Ogni domanda è un oggetto con i campi: id, question, options (array di 3), correct (0/1/2), subject (materia normalizzata).

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

Autore: Paolo Zuccala' Maganzini
