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

// Caricamento dati dal CSV
function loadSitesFromJSON() {
  const jsonData = fs.readFileSync(jsonFilePath, "utf-8");

  const sites = JSON.parse(jsonData).map((r) => ({
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

  return sites;
}

// Scrive i dati su CSV
function saveData(data, jsonFilePath) {
    
    const mappedData =  data.map((r) => ({
      Codice: r.codice,
      Comune: r.comune, 
      Provincia: r.provincia,
      Indirizzo: r.indirizzo,
      Attività: r.attività,
      ["Messa in sicurezza d'emergenza"]: r.messa_sicurezza_emergenza,
      ["Messa in sicurezza operativa"]: r.messa_sicurezza_operativa,
      ["Messa in sicurezza permanente"]: r.messa_sicurezza_permanenete,
      ["Bonifica e ripristino ambientale"]: r.bonifica,
      ["Bonifica e ripristino ambientale con misure di sicurezza"]: r.bonifica_sicurezza,
      Procedura: r.procedura,
      Note: r.note,
      Latitudine: r.lat,
      Longitudine: r.lon
    }));

    fs.writeFile(jsonFilePath, JSON.stringify(mappedData, null, 2), (err) => {
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
    const queryKeys = Object.keys(req.query);
    const data = loadSitesFromJSON();

    if(queryKeys.length === 0){
      return res.json(data);
    }

    const filtered = data.filter(sito => {
      return queryKeys.every(key => 
        sito[key] && sito[key].trim().toLowerCase() === req.query[key].trim().toLowerCase()
      );
    });

    res.json(filtered);
});

// API POST
app.post('/siti', (req, res) => {
  const newSito = req.body;
  const data = loadSitesFromJSON();
  if(!data.filter(s => s === newSito)){
    data.push(newSito);
  }
  
  saveData(data, jsonFilePath);
  res.status(201).json({ message: 'Sito aggiunto' });
});

// API PUT
app.put('/siti/:codice', (req, res) => {
  const codice = req.params.codice;
  const updated = req.body;
  const data = loadSitesFromJSON();
  const index = data.findIndex(s => s.codice === codice);
  if (index === -1) return res.status(404).json({ error: 'Sito non trovato' });
  data[index] = updated;
  saveData(data, jsonFilePath);
  res.json({ message: 'Sito aggiornato' });
});

// API DELETE
app.delete('/siti/:codice', (req, res) => {
  const codice = req.params.codice;
  let data = loadSitesFromJSON();
  const originalLength = data.length;
  data = data.filter(s => s.codice !== codice);
  if (data.length === originalLength) return res.status(404).json({ error: 'Sito non trovato' });
  saveData(data, jsonFilePath);
  res.json({ message: 'Sito rimosso' });
});

// Avvia server
app.listen(PORT, () => {
  console.log(`Server avviato sulla porta ${PORT}`);
});
