const express = require("express");
const fs = require("fs");
const path = require("path");
const { json } = require("body-parser");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const jsonFilePath = path.join(__dirname, "data/Regione-Emilia-Romagna---Siti-contaminati.json");
const comunePath = path.join(__dirname, "data/comuni_emilia_romagna.json")

const campiSito = {
  codice: "Codice",
  comune: "Comune",
  provincia: "Provincia",
  indirizzo: "Indirizzo",
  attività: "Attività",
  messa_sicurezza_emergenza: "Messa in sicurezza d'emergenza",
  messa_sicurezza_operativa: "Messa in sicurezza operativa",
  messa_sicurezza_permanente: "Messa in sicurezza permanente",
  bonifica: "Bonifica e ripristino ambientale",
  bonifica_sicurezza: "Bonifica e ripristino ambientale con misure di sicurezza",
  procedura: "Procedura",
  note: "Note",
  lat: "Latitudine",
  lon: "Longitudine"
};

// Caricamento dati
function loadSitesFromJSON() {
  const jsonData = fs.readFileSync(jsonFilePath, "utf-8");
  const rawData = JSON.parse(jsonData);

  return rawData.map(entry => {
    const site = {};

    for (const [key, originalKey] of Object.entries(campiSito)) {
      site[key] = (key === "lat" || key === "lon")
        ? parseFloat(entry[originalKey])
        : entry[originalKey];
    }

    return site;
  });
}

// Scrittura dati
function saveData(data, jsonFilePath) {
  const mappedData = data.map(entry => {
    const mapped = {};
    for (const [key, originalKey] of Object.entries(campiSito)) {
      mapped[originalKey] = entry[key];
    }
    return mapped;
  });

  fs.writeFile(jsonFilePath, JSON.stringify(mappedData, null, 2), err => {
    if (err) {
      console.error("Errore nel salvataggio:", err);
    } else {
      console.log("File salvato correttamente!");
    }
  });
}

// --- API ---
//API GET COMUNI
app.get('/comuni', (req, res) => {
  try{
    const provincia = req.query.provincia;
    const totComuni = fs.readFileSync(comunePath, 'utf-8');
    const comuni = JSON.parse(totComuni);
    
    if (!provincia) {
      const response = {
        success: true,
        message: 'Tutti i comuni restituiti con successo',
        results: data
      };

      return res.json(response);
    }

    const comuniObj = comuni[provincia];

    const response = {
      success: true,
      message: `Tutti i comuni della provincia restituiti con successo`,
      results: comuniObj
    };

    res.json(response);
  }catch(e){
    res.status(500).json({error: 'Errore nella lettura dei dati'});
  }
});

//API GET SITI
app.get('/siti', (req, res) => {
  try {
    // Logging della richiesta
    console.log(`\n---\nRequest:\nGET ${req.originalUrl}\n`);

    const queryKeys = Object.keys(req.query);
    const data = loadSitesFromJSON();

    if (queryKeys.length === 0) {
      let response = {
        success: true,
        message: 'Tutti i siti restituiti con successo',
        results: data
      };

      return res.json(response);
    }

    const filtered = data.filter(sito =>
      queryKeys.every(key =>
        sito[key] && sito[key].trim().toLowerCase() === req.query[key].trim().toLowerCase()
      )
    );

    if(filtered.length > 0){
      response = {
        success: true,
        message: `${filtered.length} i siti restituiti con successo`,
        results: filtered
      }
    }else{
      response = {
        success: true,
        message: 'Nessun sito trovato corrispondente ai parametri',
        results: filtered
      }
    }

    console.log(`Response:\n${JSON.stringify(response, null, 2)}\n---`);
    res.json(response);

  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Errore nella lettura dei dati' });
  }
});

// API POST
app.post('/siti', (req, res) => {
  console.log(`\n---\nRequest:\nPOST ${req.originalUrl}`);
  console.log('Body:', JSON.stringify(req.body, null, 2));
  const newSito = req.body;
  const data = loadSitesFromJSON();

  if (data.some(s => s.codice === newSito.codice)){
    return res.status(409).json({ error: 'Sito già esistente con questo codice' });
  }

  data.push(newSito);

  try {
    saveData(data, jsonFilePath);
    const response = { success: true, message: 'Sito aggiunto', sito: newSito };
    console.log(`Response:\n${JSON.stringify(response, null, 2)}\n---`);
    res.status(201).json(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Errore nel salvataggio del file' });
  }
});

// API PUT
app.put('/siti/:codice', (req, res) => {
  console.log(`\n---\nRequest:\nPUT ${req.originalUrl}`);
  console.log('Body:', JSON.stringify(req.body, null, 2));

  const codice = req.params.codice;
  const updated = req.body;
  const data = loadSitesFromJSON();
  const index = data.findIndex(s => s.codice === codice);

  if (index === -1) return res.status(404).json({ error: 'Sito non trovato' });
  data[index] = updated;
  saveData(data, jsonFilePath);

  const response = { success: true, message: 'Sito aggiornato', sito: updated };
  console.log(`Response:\n${JSON.stringify(response, null, 2)}\n---`);
  res.status(200).json(response);
});

// API DELETE
app.delete('/siti/:codice', (req, res) => {
  console.log(`\n---\nRequest:\nDELETE ${req.originalUrl}`);

  const codice = req.params.codice;
  let data = loadSitesFromJSON();
  const originalLength = data.length;
  data = data.filter(s => s.codice !== codice);
  if (data.length === originalLength) return res.status(404).json({ error: 'Sito non trovato' });
  saveData(data, jsonFilePath);

  const response = { success: true, message: `Sito con codice ${req.params.codice} eliminato` };
  console.log(`Response:\n${JSON.stringify(response, null, 2)}\n---`);
  res.status(200).json(response);
});

// Avvia server
app.listen(PORT, () => {
  console.log(`Server avviato sulla porta ${PORT}`);
});
