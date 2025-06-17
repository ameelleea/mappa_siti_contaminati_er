//Comunicazione col backend
let queryFields = {};

function buildQueryString(filterType, filter){
  if (!filterType && !filter) {
    queryFields = {};
  }else if (filterType === 'codice') {
    queryFields = { codice: filter };
  } else {
    delete queryFields['codice'];

    if (filterType === 'provincia') {
      delete queryFields['comune'];
    }

    if (filter) {
      queryFields[filterType] = filter;
    } else {
      delete queryFields[filterType];
    }
  }

  const queryString = Object.keys(queryFields).length > 0
    ? '?' + new URLSearchParams(queryFields).toString()
    : '';

    return queryString;
}

async function getSites(filterType='', filter='') {
    const queryString = buildQueryString(filterType, filter);

    try {
      const res = await fetch(`/siti${queryString}`);
      
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const sites = await res.json();
      return sites;

    } catch (err) {
      console.error('Errore caricando siti:', err);
    }
}

async function addSite(payload){
  try{
    const res = await fetch('/siti', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: payload
    });
    const data = await res.json();
    
    if(!res.ok) throw new Error(`${res.status}, ${data.error}`);
    
    console.log('Risposta dal server: ', res.status, data.message);
  }catch(error){
    console.log('Errore nella POST: ' + error);
  }
}

async function modifySite(sito) {
  try{
    console.log(sito.codice);
    const res = await fetch(`/siti/${sito.codice}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(sito)
        });
    
    if(!res.ok) throw new Error(`HTTP error! Status: ${res.status, res.error}`);
    const data = await res.json();
    console.log('Aggiornato con successo:', data);
       
  }catch(error){ 
    console.error('Errore nella PUT:', error);
  }
}

async function deleteSite(codice) {
  try{
    const res = await fetch(`/siti/${codice}`, {
                  method: 'DELETE'
                });

    if(!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);

    console.log('Elemento eliminato.');
  }catch(error){
    console.error('Errore:', error);
  }
}