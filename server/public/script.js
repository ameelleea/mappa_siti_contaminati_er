//Frontend
let markersMap = {};
let filterOptions = ["Si", "No"];
let province = ["CITTA' METROPOLITANA DI BOLOGNA", "MODENA", "REGGIO EMILIA", "FERRARA", "RIMINI", "PIACENZA", "RAVENNA", "PARMA", "FORLI'"];
let sitoSelezionato;

const map = L.map('map').setView([44.5, 11.3], 8);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

function populateSelect(selects, values, includeEmpty = false) {
  selects.forEach(el => {
    if (includeEmpty) {
      const firstOption = document.createElement("option");
      firstOption.value = "";
      firstOption.textContent = "-- Seleziona --";
      el.appendChild(firstOption);
    }

    values.forEach(val => {
      const option = document.createElement("option");
      option.value = val;
      option.textContent = val;
      el.appendChild(option);
    });
  });
}

async function mostraSezione(id) {
    const sezioni = document.querySelectorAll('section');
    sezioni.forEach(s => {s.classList.remove('attiva')});

    const sezione = document.getElementById(id);
    sezione.classList.add('attiva');

    const header = document.querySelector('header');
    const stile = window.getComputedStyle(header);
    const headerOffset = header.getBoundingClientRect().height + parseFloat(stile.marginBottom);
    const elementPosition = sezione.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

    window.scrollTo({
      top: offsetPosition,
      behavior: "smooth"
    });

    if(id !== 'infopanel' && id !== "modificaSito")
        markSites(await getSites());
}

async function defaultCard(){
    const sites = await getSites();
    const keysStarts = ['bonifica', 'messa'];
    const sitesSizes = [sites.length, 0, 0];

    keysStarts.forEach((start, idx) => {
      sites.forEach(s => {
        sitesSizes[idx+1] += Object.keys(s)
                                  .filter(k => k.startsWith(start) && s[k] === 'Si')
                                  .length;
      })
    });

    document.getElementById("default")
            .querySelector('.card')
            .querySelectorAll('dd')
            .forEach((d, i) => {
              d.innerHTML = sitesSizes[i];
    });
}

function markSites(sites){
    Object.values(markersMap).forEach(m => {
      map.removeLayer(m);
      delete markersMap[m];
    });
  
    sites.forEach(sito => {
        if (sito.lat && sito.lon) {
            const marker = L.marker([parseFloat(sito.lat), parseFloat(sito.lon)])
                            .addTo(map)
                            .bindPopup(`
                              <b style='color:#F23041; font-size:medium;'>Codice: ${sito.codice}</b><br>
                              <b>Attività:</b> ${sito.attività}<br>
                              <b>Indirizzo:</b> ${sito.indirizzo}<br>
                              <b>${sito.comune + ', ' + sito.provincia}<br></b>
                              <button type="button" class="marker-button show-more-btn" data-id="${sito.codice}">Mostra altro</button>
                            `);  
                            
            markersMap[sito.codice] = marker;
                            
            //Chiusura pannello informazioni
            marker.on('popupclose', function () {
            showLess();
            });
        }
    });
}

function showMore(sito){
    const targetKeys = Object.keys(sito).slice(5, 12);
    let ddArray = document.getElementById('infopanel').querySelector(`.card`).querySelectorAll('dd');

    targetKeys.forEach((t, i) => {
        ddArray[i].innerHTML = sito[t];
    });

    mostraSezione("infopanel");
}

function showLess(){

    document.getElementById('infopanel').querySelector('.card').querySelectorAll('dd').forEach(d => {
        d.innerHTML = '';
    })

    document.getElementById("modificaSito").querySelector('form').reset();
    mostraSezione("default");
}

let lastSubmitHandler = null;

function prepareModificaForm(sito) {
  const form = document.getElementById("modificaSito").querySelector("form");
  const keys = Object.keys(sito)
    .filter(k => k.startsWith('bonifica') || k.startsWith('messa_sicurezza'));

  // Reset dei checkbox
  form.querySelectorAll("input[type=checkbox]").forEach(i => i.checked = false);

  keys.forEach(k => {
    if (sito[k] === 'Si') {
      form.querySelectorAll(`input[name=${k}]`).forEach(i => i.checked = true);
    }
  });

  //Rimuovi handler precedente (se esiste)
  if (lastSubmitHandler) {
    form.removeEventListener("submit", lastSubmitHandler);
  }

  //Crea e assegna nuovo handler
  const newHandler = async function (e) {
    e.preventDefault();
    const formData = new FormData(form);
    const objData = Object.fromEntries(formData.entries());
    Object.assign(sito, objData);

    await modifySite(sito);
    defaultCard();
    showPopup('infopanel');
    showMore(sito);
  };

  form.addEventListener("submit", newHandler);
  lastSubmitHandler = newHandler;

  mostraSezione("modificaSito");
}


function showPopup(sezione) {
  const popup = document.getElementById(sezione).querySelector('.popup-confirm');

  popup.style.opacity = '1';
  popup.style.transform = 'translateY(0)';
  popup.style.pointerEvents = 'auto';

  setTimeout(() => {
    popup.style.opacity = '0';
    popup.style.transform = 'translateY(-10px)';
    popup.style.pointerEvents = 'none';
  }, 2000);
}

window.addEventListener("load", async () => {
    defaultCard();
    markSites(await getSites());
    populateSelect(document.querySelectorAll("select"), [], true);
    populateSelect(document.querySelectorAll(".provincia"), province);
    populateSelect(document.querySelector("#hidden-items").querySelectorAll("select"), filterOptions);
});


/*EventListeners*/
document.getElementById("filters").querySelectorAll("select").forEach(el => {
    el.addEventListener('change', async (e) => {
        markSites(await getSites(e.target.id, e.target.value));

        if(e.target.id === "provincia"){
            const selectComune = document.getElementById('comune');
            Array.from(selectComune.children).slice(1).forEach(child => selectComune.removeChild(child));
            const comuniPresenti = new Set();

            if(e.target.value !== ''){

              const sites = await getSites();
              sites.forEach(sito  => {
                  if(sito.provincia === e.target.value && !comuniPresenti.has(sito.comune)){
                      comuniPresenti.add(sito.comune);
                      const comuneOption = document.createElement("option");
                      comuneOption.value = comuneOption.textContent = sito.comune;
                      selectComune.appendChild(comuneOption);
                  }
              });

              document.querySelector('.comune-group').style.display = 'flex';
          }
          else{
              document.querySelector('.comune-group').style.display = "none";
          }
        }
    })  
});

document.addEventListener('click', async (event) => {
  if(event.target){
    const codice = event.target.getAttribute('data-id');
    const sites = await getSites();
    sitoSelezionato = sites.find(s => s.codice === codice);

    if (sitoSelezionato) {
      if(event.target.classList.contains('show-more-btn'))
        showMore(sitoSelezionato);
    }
  }
});

document.getElementById("cerca").querySelector("form").addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const objData = Object.fromEntries(formData.entries())
    markSites(await getSites('codice', objData.codice));
    e.target.querySelector('input[name="codice"]').value = '';
});

document.querySelector("#aggiungiSito").querySelector('.provincia').addEventListener('change', async function (e) {
    const comuneSelect = document.querySelector("#comune-agg");

    const res = await fetch('/comuni');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

    const comuni = await res.json();
    const comuniPresenti = new Set();

    comuni[e.target.value].forEach(c => {
      if(!comuniPresenti.has(c)){
        const comuneOption = document.createElement("option");
        comuneOption.value = comuneOption.textContent = c.toUpperCase();
        comuneSelect.append(comuneOption);
      }
    })
});

document.getElementById("aggiungiSito").querySelector("form").addEventListener("submit", async function (e) {
    e.preventDefault();
    
    const formData = new FormData(this);
    const objData = Object.fromEntries(formData.entries())
    const data = JSON.stringify(objData);
    console.log(data);
    
    await addSite(data);
    this.reset();
    markSites(await getSites());
    defaultCard();
    mostraSezione("default");
});

document.getElementById("more-filters").addEventListener('click', (e) => {
    const moreFilters = document.getElementById("hidden-items");

    if(e.target.textContent === 'Più filtri'){
        moreFilters.style.display = 'grid';
        e.target.textContent = 'Meno filtri';
    }else{
        moreFilters.style.display = 'none';
        e.target.textContent = 'Più filtri';
    }
});

document.getElementById("reset-filters").addEventListener('click', async () => {
  document.getElementById("filters").querySelectorAll("select").forEach(sel => {
    sel.value = "";
  })

  markSites(await getSites());
});

document.querySelector('.modify-btn').addEventListener('click', (e)=> prepareModificaForm(sitoSelezionato));

document.querySelector('.delete-btn').addEventListener('click', async (e) => {
  console.log(sitoSelezionato);
  if(confirm("Eliminare questo sito dalla mappa? L'operazione non è reversibile.")){
    deleteSite(sitoSelezionato.codice);
    const marker = markersMap[sitoSelezionato.codice];
    if (marker) {
      map.removeLayer(marker);
      delete markersMap[sitoSelezionato.codice];
      console.log(`Marker con codice ${sitoSelezionato.codice} rimosso`);
    } else {
      console.warn(`Nessun marker trovato per il codice ${sitoSelezionato.codice}`);
    }
    defaultCard();
    showPopup('default');
  } else {
    console.log("Annullato");
  }
});

//Comunicazione col backend
let queryFields = {};

function buildQueryString(filterType, filter){
  if (filterType === 'codice') {
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
    
    if(!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
    const data = await res.json();
    console.log('Risposta dal server: ' + data);
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
    
    if(!res.ok) throw new Error(`HTTP error! Status: ${res.status}`);
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