//Frontend
let markersMap = {};
let filterOptions = ["Si", "No"];
let province = ["CITTA' METROPOLITANA DI BOLOGNA", "MODENA", "REGGIO EMILIA", "FERRARA", "RIMINI", "PIACENZA", "RAVENNA", "PARMA", "FORLI'"];

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

    document.getElementById(id).classList.add('attiva');
    document.querySelector('.options').querySelectorAll('button').forEach(b => {
    if(b.name === id){
        b.style.textDecoration = 'underline';
    }else{
        b.style.textDecoration = 'none';
    }
    })

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
            .querySelectorAll('div')
            .forEach((d, i) => {
              d.querySelector('span').innerHTML = sitesSizes[i];
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

    let divArray = document.getElementById('infopanel').querySelector(`.card`).querySelectorAll('div');

    targetKeys.forEach((t, i) => {
        divArray[i].querySelector('span').innerHTML = sito[t];
    });

    mostraSezione("infopanel");
}

function showLess(){

    document.getElementById('infopanel').querySelector('.card').querySelectorAll('div').forEach(d => {
        d.querySelector('span').innerHTML = '';
    })

    document.getElementById("modificaSito").querySelector('form').reset();
    mostraSezione("default");
}

function prepareModificaForm(sitoSelezionato) {
  const form = document.getElementById("modificaSito").querySelector("form");
  const keys = Object.keys(sitoSelezionato)
                     .filter(k => k.startsWith('bonifica') || k.startsWith('messa_sicurezza'));

  keys.forEach(k => {
    if (sitoSelezionato[k] === 'Si') {
      form.querySelectorAll(`input[name=${k}]`).forEach(i => i.checked = true);
    }
  });

  mostraSezione("modificaSito");

  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    const formData = new FormData(this);
    const objData = Object.fromEntries(formData.entries());
    Object.assign(sitoSelezionato, objData);

    await modifySite(sitoSelezionato, JSON.stringify(objData));
    defaultCard();
    showMore(sitoSelezionato);
  });
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
    const sitoSelezionato = sites.find(s => s.codice === codice);

    if (sitoSelezionato) {
      if(event.target.classList.contains('show-more-btn')) {
        showMore(sitoSelezionato);
        document.querySelector('.modify-btn')
                .addEventListener('click', (e)=> prepareModificaForm(sitoSelezionato));

        document.querySelector('.delete-btn').addEventListener('click', async (e) => {
          if(confirm("Eliminare questo sito dalla mappa? L'operazione non è reversibile.")){
            deleteSite(codice);
            const marker = markersMap[codice];
            if (marker) {
              map.removeLayer(marker);
              delete markersMap[codice];
              console.log(`Marker con codice ${codice} rimosso`);
            } else {
              console.warn(`Nessun marker trovato per il codice ${codice}`);
            }
            defaultCard();
          } else {
            console.log("Annullato");
          }
        });
      }
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
    
    addSite(data);
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


