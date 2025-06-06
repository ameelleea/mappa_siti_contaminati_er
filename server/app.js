// Init everything
/*
// Creates an Express application.
const express = require("express");
// The app object conventionally denotes the Express application. Create it by calling the top-level express() function exported by the Express module
const app = express();

// This module is needed to receive data in JSON format from the body of the HTTP request, in request.body
const bodyParser = require('body-parser');
app.use(bodyParser.json());

const fs = require('fs');
const parse = require('csv-parse').parse

// ---------- Using Graphic Interface in Glitch ----------
// view engine setup
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.set('src', __dirname);

app.get('/strutture', (req, res) => {
  res.render(__dirname + '/src/strutturemarche.html');
});

app.get('/strutturecsv', (req, res) => {
  console.log("Carico Strutture Marche")
  res.type('text/csv').sendFile(__dirname + '/src/strutture.csv');
 });
*/

const express = require("express");
const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");
const { json } = require("body-parser");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const jsonFilePath = path.join(__dirname, "data/Regione-Emilia-Romagna---Siti-contaminati.json");

// Dati in memoria
let sites = [];

// Caricamento dati dal CSV
function loadSitesFromJSON() {
  const jsonData = fs.readFileSync(jsonFilePath, "utf-8");
  
  return JSON.parse(jsonData).map((r) => ({
    codice: r.Codice,
    comune : r.Comune,
    provincia: r.Provincia,
    indirizzo: r.Indirizzo,
    attività: r.Attività,
    messa_sicurezza_emergenza: r["Messa in sicurezza d'emergenza"],
    messa_sicurezza_operativa: r["Messa in sicurezza operativa"],
    messa_sicurezza_permanenete: r["Messa in sicurezza permanente"],
    bonifica: r["Bonifica e ripristino ambientale"],
    bonifica_sicurezza: r["Bonifica e ripristino ambientale con misure di sicurezza"],
    procedura: r.Procedura,
    note: r.Note,
    lat: parseFloat(r.Latitudine),
    lon: parseFloat(r.Longitudine)
  }));
}

// Scrive i dati su CSV
function saveData(data) {
    console.log(jsonFilePath);
    fs.writeFile(jsonFilePath, JSON.stringify(data, null, 2), (err) => {
      if (err) {
        console.error("Errore nel salvataggio:", err);
      } else {
        console.log("File salvato correttamente!");
      }
    });
}

loadSitesFromJSON();

// --- API ---
app.get('/siti', (req, res) => {
    const { provincia } = req.query;
    const data = loadSitesFromJSON();
    const filtered = provincia ? data.filter(s => s.provincia.trim().toLowerCase() === provincia.trim().toLowerCase()) 
    : data;
    res.json(filtered);
});

// API POST aggiunge sito
app.post('/siti', (req, res) => {
  const newSito = req.body;
  console.log(newSito);
  const data = loadSitesFromJSON();
  data.push(newSito);
  saveData(data);
  res.status(201).json({ message: 'Sito aggiunto' });
});

// API PUT modifica sito (basato su Codice univoco)
app.put('/siti/:codice', (req, res) => {
  const codice = req.params.codice;
  const updated = req.body;
  const data = loadSitesFromJSON();
  const index = data.findIndex(s => s.codice === codice);
  if (index === -1) return res.status(404).json({ error: 'Sito non trovato' });
  data[index] = updated;
  saveData(data);
  res.json({ message: 'Sito aggiornato' });
});

// API DELETE
app.delete('/siti/:codice', (req, res) => {
  const codice = req.params.codice;
  let data = loadSitesFromJSON();
  const originalLength = data.length;
  data = data.filter(s => s.codice !== codice);
  if (data.length === originalLength) return res.status(404).json({ error: 'Sito non trovato' });
  saveData(data);
  res.json({ message: 'Sito rimosso' });
});

// Avvia server
app.listen(PORT, () => {
  console.log(`Server avviato sulla porta ${PORT}`);
});
