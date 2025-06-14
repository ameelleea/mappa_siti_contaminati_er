//Comunicazione col backend
let queryFields = {};

async function getSites(filterType='', filter='') {

    if((filterType === 'codice' || filterType === '')){
        queryFields = {};
    }else{
        delete queryFields['codice'];
    }
    if(filterType === 'provincia'){
        delete queryFields['comune'];
    }

    filter === '' ? delete queryFields[filterType] : queryFields[filterType] = filter;
    const queryString = filterType === '' ? '' : '?' + new URLSearchParams(queryFields).toString();

    try {
      const res = await fetch(`/siti${queryString}`);
      
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const sites = await res.json();
      return sites;

    } catch (err) {
      console.error('Errore caricando siti:', err);
    }
}

async function addSite(params){
    fetch('/siti', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: params
    })
    .then(response => response.json())
    .then(data => {
      console.log('Risposta dal server:', data);
    })
    .catch(error => console.error('Errore nella POST:', error));
}

async function modifySite(sito, params) {
    fetch(`/siti/${sito.codice}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: params
        })
        .then(response => response.json())
        .then(data => {
          console.log('Aggiornato con successo:', data);
        })
        .catch(error => console.error('Errore nella PUT:', error));
}

async function deleteSite(sito) {
    fetch(`/siti/${sito.codice}`, {
          method: 'DELETE'
        })
        .then(response => {
          if (response.ok) {
            console.log('Elemento eliminato');
          } else {
            console.error('Errore nella DELETE');
          }
        })
        .catch(error => console.error('Errore:', error));
      
      const marker = markersMap[sito.codice];
      if (marker) {
        map.removeLayer(marker);
        delete markersMap[sito.codice];
        console.log(`Marker con codice ${sito.codice} rimosso`);
      } else {
        console.warn(`Nessun marker trovato per il codice ${sito.codice}`);
      }
}