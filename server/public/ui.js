//Frontend
let markersMap = {};
let sites = [];
let province = ["CITTA' METROPOLITANA DI BOLOGNA", "MODENA", "REGGIO EMILIA", "FERRARA", "RIMINI", "PIACENZA", "RAVENNA", "PARMA", "FORLI'"];
let sitoSelezionato;
let lastSubmitHandler = null;

const map = L.map('map').setView([44.5, 11.3], 8);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

function populateSelect(selects, values) {
  selects.forEach(el => {
    const fragment = document.createDocumentFragment();


    const firstOption = document.createElement("option");
    firstOption.value = "";
    firstOption.textContent = "-- Seleziona --";
    fragment.appendChild(firstOption);
    

    values.forEach(val => {
      const option = document.createElement("option");
      option.value = val;
      option.textContent = val;
      fragment.appendChild(option);
    });

    el.appendChild(fragment);
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
  try{
    sites = await getSites();
  }catch(e){
    console.log(e);
  }

  const sitesSizes = [sites.length, 0, 0];

  sites.forEach(s => {
    sitesSizes[1] += Object.keys(s).filter(k => k.startsWith('bonifica') && s[k] === 'Si').length;
    sitesSizes[2] += Object.keys(s).filter(k => k.startsWith('messa') && s[k] === 'Si').length;
  });

  document.getElementById("default")
          .querySelector('.card')
          .querySelectorAll('dd')
          .forEach((d, i) => {
            d.innerHTML = sitesSizes[i];
  });

  markSites(sites);
}

function markSites(sites){
    Object.keys(markersMap).forEach(key => {
      map.removeLayer(markersMap[key]);
      delete markersMap[key];
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

/* Setup iniziale pagina */
window.addEventListener("load", async () => {
  defaultCard();
  let filterOptions = ["Si", "No"];

  populateSelect(document.querySelectorAll("select"), []);
  populateSelect(document.querySelectorAll(".provincia"), province);
  populateSelect(document.querySelector("#hidden-items").querySelectorAll("select"), filterOptions);
});


/*EventListeners*/
document.getElementById("filters").querySelectorAll("select").forEach(el => {
    el.addEventListener('change', async (e) => {
      try{
        sites = await getSites(e.target.id, e.target.value);
        markSites(sites);
      }catch(e){
        console.log(e);
      }

      if(e.target.id === "provincia"){
        const selectComune = document.getElementById('comune');
        
        while(selectComune.children.length > 1) {
          selectComune.removeChild(selectComune.lastChild);
        }

        const comuniPresenti = new Set();

        if(e.target.value !== ''){
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
    const objData = Object.fromEntries(formData.entries());
    try{
      sites = await getSites('codice', objData.codice);
    }catch(e){
      console.log(e);
    }

    markSites(sites);
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
    
    try{
      await addSite(data);
      defaultCard();
    }catch(e){
      console.log(e);
    }
    this.reset();
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

  defaultCard();
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


