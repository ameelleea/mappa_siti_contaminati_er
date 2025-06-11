const map = L.map('map').setView([44.5, 11.3], 8);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let markersMap = {};
let queryFields = {};
let filterOptions = ["Si", "No"];
let province = ["CITTA' METROPOLITANA DI BOLOGNA", "MODENA", "REGGIO EMILIA", "FERRARA", "RIMINI", "PIACENZA", "RAVENNA", "PARMA", "FORLI'"];

function markSites(sites){
  Object.values(markersMap).forEach(m => map.removeLayer(m));
  Object.keys(markersMap).forEach(k => delete markersMap[k]);
  
  sites.forEach(sito => {
    if (sito.lat && sito.lon) {
      const marker = L.marker([parseFloat(sito.lat), parseFloat(sito.lon)])
                      .addTo(map)
                      .bindPopup(`
                        <b>Codice: ${sito.codice}</b><br>
                        Attività: ${sito.attività}<br>
                        Indirizzo: ${sito.indirizzo}<br>
                        ${sito.comune + ', ' + sito.provincia}<br>
                        <button type="button" class="show-more-btn" data-id="${sito.codice}">Mostra altro</button>
                        <button type="button" class="modify-btn" data-id="${sito.codice}">Modifica</button>
                        <button type="button" class="delete-btn" data-id="${sito.codice}">Elimina</button>
                      `);  
    
      markersMap[sito.codice] = marker;
      marker.on('popupclose', function () {
      showLess();
      });
    }
  });
}

function showMore(sito){
    const infopanel = document.getElementById("infopanel");
    const tbody = infopanel.querySelector("table tbody");
    tbody.innerHTML =     `<tr>
      <th>Messa in sicurezza emergenza</th>
      <td>${sito.messa_sicurezza_emergenza}</td>
     </tr>
     <tr>
      <th>Messa in sicurezza operativa</th>
      <td>${sito.messa_sicurezza_operativa}</td>
     </tr>
     <tr>
      <th>Messa in sicurezza permanente</th>
      <td>${sito.messa_sicurezza_permanenete}</td>
     </tr>
     <tr>
      <th>Bonifica</th>
      <td>${sito.bonifica}</td>
     </tr>
     <tr>
      <th>Bonifica sicurezza</th>
      <td>${sito.bonifica_sicurezza}</td>
     </tr>
     <tr>
      <th>Procedure</th>
      <td>${sito.procedura}</td>
     </tr>
     <tr>
      <th>Note</th>
      <td>${sito.note}</td>
     </tr>`;

     infopanel.style.display = "block";
}

function showLess(){
    document.getElementById("infopanel").style.display = "none";
    document.getElementById("infopanel").querySelector("table tbody").innerHTML = "";
}

async function getSites() {
    try {
        const res = await fetch(`/siti`);
        
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const sites = await res.json();
        return sites;
      

    } catch (err) {
        console.error('Errore caricando siti:', err);
    }
}

async function filterSites(e) {
    try {
        const filterType = e.target.id;
        const filter = e.target.value;
        console.log(filter);
        console.log(queryFields);
        
        if(filterType === 'provincia'){
          delete queryFields['comune'];
        }

        filter === '' ? delete queryFields[filterType] : queryFields[filterType] = filter;

        console.log(queryFields);
        const queryString = new URLSearchParams(queryFields).toString()
        console.log(queryString);
        const res = await fetch(`/siti?${queryString}`);
        
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const dati = await res.json();
        console.log(dati);
        
        markSites(dati);
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
     {

    }
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
        map.removeLayer(marker); // oppure marker.remove();
        delete markersMap[sito.codice]; // rimuovilo anche dalla mappa dei marker
        console.log(`Marker con codice ${sito.codice} rimosso`);
      } else {
        console.warn(`Nessun marker trovato per il codice ${sito.codice}`);
      }
}


window.addEventListener("load", async () => {
    markSites(await getSites());
});


document.querySelectorAll("select").forEach(el => {
        const firstOption = document.createElement("option");
        firstOption.value = "";
        firstOption.textContent = "-- Seleziona --"
        el.appendChild(firstOption);
});

document.getElementById("filters").querySelectorAll("select").forEach(el => {
  el.addEventListener('change', async (e) => {
    console.log("Eventlistener attivo");
    filterSites(e);

    if(e.target.id === "provincia"){
      const selectComune = document.getElementById('comune');
      Array.from(selectComune.children).slice(1).forEach(child => selectComune.removeChild(child));

      if(e.target.value !== ''){
              
        const sites = await getSites();
        sites.forEach(sito  => {
            if(sito.provincia === e.target.value){
                const optionDefault = document.createElement("option");
                optionDefault.value = optionDefault.textContent = sito.comune;

                const esiste = Array.from(selectComune.children).some(
                (figlio) => figlio.innerHTML === optionDefault.innerHTML
                );

                if (!esiste) {
                  selectComune.appendChild(optionDefault);
                }
            }
        })

        document.querySelector('.comune-group').style.display = 'flex';
      }
      else{
        document.querySelector('.comune-group').style.display = "none";
      }
    }
  })  
});

document.querySelectorAll(".provincia").forEach(el => {
  province.forEach(val => {
    const optionDefault = document.createElement("option");
    optionDefault.value = val;
    optionDefault.textContent = val;
    el.appendChild(optionDefault);
  })
})

document.addEventListener('click', async (event) => {
  if (event.target){
    const codice = event.target.getAttribute('data-id');
    const res = await fetch(`/siti`);
        
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const sites = await res.json();
    const sitoSelezionato = sites.find(s => s.codice === codice);
    if (sitoSelezionato) {
      
    
    if(event.target.classList.contains('show-more-btn')) {
      showMore(sitoSelezionato);
  }else if(event.target.classList.contains('modify-btn')){

    const modificaForm = document.getElementById("modificadiv");

    if(sitoSelezionato['messa_sicurezza_emergenza'] === 'Si'){
      document.getElementById("check-messa_sicurezza_emergenza").checked = true;
    }
    if(sitoSelezionato['messa_sicurezza_operativa'] === 'Si'){
      document.getElementById("check-messa_sicurezza_operativa").checked = true;
    }
    if(sitoSelezionato['messa_sicurezza_permanente'] === 'Si'){
      document.getElementById("check-messa_sicurezza_permanente").checked = true;
    }
    if(sitoSelezionato['bonifica'] === 'Si'){
      document.getElementById("check-bonifica").checked = true;
    }
    if(sitoSelezionato['bonifica_sicurezza'] === 'Si'){
      document.getElementById("check-bonifica_sicurezza").checked = true;
    } 
     
    modificaForm.style.display = "block";

    modificaForm.addEventListener("submit", function (e) {
    e.preventDefault(); // Impedisce il refresh della pagina
    
    const formData = new FormData(this);
    const objData = Object.fromEntries(formData.entries())
    console.log(objData);
    Object.keys(objData).forEach(k => {
      sitoSelezionato[k] = objData[k];
    })
    const data = JSON.stringify(objData);
    console.log(data);
    
    modifySite(sitoSelezionato, data);
    this.reset();
    this.style.display = "none";
});
  }else if(event.target.classList.contains('delete-btn')){
    if (confirm("Eliminare questo sito dalla mappa? L'operazione non è reversibile.")) {
      deleteSite(sitoSelezionato);
  } else {
    // L'utente ha cliccato Annulla
    console.log("Annullato");
  }
    
  }
}
}
});

//document.getElementById("codice").addEventListener('keydown', async (e) => {
//  if (e.key === 'Enter') {
//    e.preventDefault();  // evita che il form si invii se c'è
//    console.log(e);
//    console.log(e.target.id);
//    console.log(e.target.value);
//    filterSites(e)
//  }
//});

//document.getElementById("codice").addEventListener('onfocus', (e) => {
//  this.value = '';
//  delete queryFields['codice'];
//});

document.getElementById("sitoForm").addEventListener("submit", function (e) {
    e.preventDefault(); // Impedisce il refresh della pagina
    
    const formData = new FormData(this);
    const objData = Object.fromEntries(formData.entries())
    objData.comune = objData.comune.toUpperCase();
    console.log(objData);
    const data = JSON.stringify(objData);
    console.log(data);
    
    addSite(data);
    this.reset();
    this.style.display = "none";
});

document.getElementById("addSite").addEventListener('click', () => {
    const form = document.getElementById("sitoForm");

    form.style.display = (form.style.display === "none") ? "block" : "none";
});

document.querySelector("#hidden-items").querySelectorAll("select").forEach(el => {
    filterOptions.forEach(val => {
      const optionDefault = document.createElement("option");
      optionDefault.value = val;
      optionDefault.textContent = val;
      el.appendChild(optionDefault);
    })
});

document.getElementById("more-filters").addEventListener('click', () => {
  const moreFilters = document.getElementById("hidden-items");
  const displayStyle = moreFilters.style.display;

  if(displayStyle === "none"){
    moreFilters.style.display = "flex";
  }else{
    moreFilters.style.display = "none";
  }
});

document.getElementById("reset-filters").addEventListener('click', () => {
  document.getElementById("filters").querySelectorAll("select").forEach(sel => {
    sel.value = "";
    sel.dispatchEvent(new Event("change"));
  })
});
 





