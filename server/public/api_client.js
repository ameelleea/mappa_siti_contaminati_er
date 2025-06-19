//Comunicazione col backend
let queryFields = {}; //Ultimi filtri richiesti

//Costruzione querystring
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

//Chiamata API GET comuni
async function getComuni(provincia) {
    const url = `/comuni?${new URLSearchParams({'provincia': provincia}).toString()}`;

    try {
      console.log(`\n---\nRequest:\nGET ${url}\n`);

      const res = await fetch(url);
      const data = await res.json();

      console.groupCollapsed(`Response GET: (${data.results.length} risultati)`);
      console.log('Status:', res.status);
      console.log('Body:', data);
      console.groupEnd();

      if (!res.ok || !data.success) throw new Error(`${res.status} ${data.error}`);

      return data.results;

    } catch (err) {
      console.error('Errore caricando siti:', err);
    }
}

//Chiamata API GET siti
async function getSites(filterType='', filter='') {
    const queryString = buildQueryString(filterType, filter);
    const url = `/siti${queryString}`;

    try {
      console.log(`\n---\nRequest:\nGET ${url}\n`);

      const res = await fetch(url);
      const data = await res.json();

      console.groupCollapsed(`Response GET: (${data.results.length} risultati)`);
      console.log('Status:', res.status);
      console.log('Body:', data);
      console.groupEnd();

      if (!res.ok || !data.success) throw new Error(`${res.status} ${data.error}`);

      return data.results;

    } catch (err) {
      console.error('Errore caricando siti:', err);
    }
}

//Chiamata API POST
async function addSite(payload){
  console.log(`\n---\nRequest:\nPOST /siti\nBody:\n`, payload);

  try{
    const res = await fetch('/siti', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json'
                  },
                  body: payload
    });

    const data = await res.json();
    
    console.log(`Response POST:\nStatus: ${res.status}\nBody:\n`, data, '\n---\n');
  }catch(error){
    console.log('Errore nella POST: ' + error);
  }
}

//Chiamata API PUT
async function modifySite(sito) {
  console.log(`\n---\nRequest:\nPUT /siti/${sito.codice}\nBody:\n`, sito);

  try{
    const res = await fetch(`/siti/${sito.codice}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(sito)
        });
  
    const data = await res.json();
    console.log(`Response PUT:\nStatus: ${res.status}\nBody:\n`, data, '\n---\n');
       
  }catch(error){ 
    console.error('Errore nella PUT:', error);
  }
}

//Chiamata API DELETE
async function deleteSite(codice) {
  console.log(`\n---\nRequest:\nDELETE /siti/${codice}`);
  try{
    const res = await fetch(`/siti/${codice}`, {
                  method: 'DELETE'
                });

    const data = await res.json();
    console.log(`Response DELETE:\nStatus: ${res.status}\nBody:\n`, data, '\n---\n');
  }catch(error){
    console.error('Errore nella DELETE:', error);
  }
}