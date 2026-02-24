REMINDER: inserire "training" per materia!!!

QUIZ CACCIA – README
DESCRIZIONE DEL PROGETTO
Quiz Caccia è un’applicazione web progettata per esercitarsi alle domande dell’esame venatorio.
L’obiettivo è offrire un ambiente semplice, veloce e realistico per allenarsi sia in modalità Training sia in modalità Esame, con un’interfaccia pulita e un comportamento fedele alla prova ufficiale.
L’app funziona completamente lato client: nessun backend, nessuna installazione, nessun database.
È sufficiente un browser moderno.

FUNZIONALITÀ PRINCIPALI
MODALITÀ TRAINING
- Mostra subito se la risposta è corretta o sbagliata.
- Evidenzia la risposta corretta in verde.
- Non permette di tornare indietro a modificare risposte già date.
- Il riepilogo finale mostra:
• quante risposte corrette hai dato per materia
• solo sulle domande a cui hai effettivamente risposto
• totale corrette / totale risposte date
MODALITÀ ESAME
- Timer di 10 minuti, visibile solo durante l’esame.
- Nessun feedback immediato: puoi cambiare risposta liberamente.
- Puoi tornare avanti e indietro tra le domande.
- Distribuzione delle domande secondo la specifica ufficiale:
• 14 Legislazione
• 7 Zoologia
• 4 Agricoltura
• 4 Armi
• 1 Pronto soccorso
Totale: 30 domande
- Riepilogo finale con:
• corrette per materia
• elenco dettagliato di tutte le domande con risposta corretta e risposta data

STRUTTURA DEL PROGETTO
quizCaccia/
index.html        – Interfaccia principale
styles.css        – Stile dell’app
main.js           – Logica dell’applicazione
questions.json    – Archivio delle domande

FORMATO DEL FILE questions.json
Ogni domanda è un oggetto con questa struttura:
{ "id": 1, "question": "Testo della domanda", "options": ["Risposta A", "Risposta B", "Risposta C"], "correct": 1, "subject": "legislazione" }
Campi:
- id: numero univoco della domanda
- question: testo della domanda
- options: array di 3 risposte
- correct: indice (0, 1 o 2) della risposta corretta
- subject: materia (es. legislazione, zoologia, ecc.)

COME AGGIUNGERE O MODIFICARE DOMANDE
- Apri il file questions.json
- Aggiungi o modifica gli oggetti seguendo il formato indicato
- Mantieni la coerenza dei campi
- Assicurati che ogni domanda abbia una materia valida
L’app carica automaticamente il file all’avvio.

DEPLOY SU GITHUB PAGES
Il progetto è pensato per funzionare perfettamente su GitHub Pages.
Per pubblicarlo:
- Vai su Settings → Pages
- Seleziona il branch “main”
- Directory “/root”
- Salva
Il sito sarà disponibile all’indirizzo:
https://<tuo-username>.github.io/quizCaccia/

TEST E SVILUPPO LOCALE
Per evitare problemi di CORS con questions.json, usa un piccolo server locale:
python3 -m http.server
Poi apri nel browser:
http://localhost:8000

LICENZA
Progetto personale, libero da utilizzare e modificare.

AUTORE
Sviluppato da Paolo Zuccala' Maganzini, con l’assistenza tecnica e creativa di Microsoft Copilot.
