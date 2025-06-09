const map = L.map('map').setView([44.5, 11.3], 8);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let markersMap = {};
let queryFields = {};

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
    document.getElementById("infopanel").innerHTML =
  
    `<p>Messa in sicurezza emergenza: ${sito.messa_sicurezza_emergenza}</p>
     <p>Messa in sicurezza operativa: ${sito.messa_sicurezza_operativa}</p>
     <p>Messa in sicurezza permanente: ${sito.messa_sicurezza_permanenete}</p>
     <p>Bonifica: ${sito.bonifica}</p>
     <p>Bonifica sicurezza: ${sito.bonifica_sicurezza}</p>
     <p>Procedure: ${sito.procedura}</p>
     <p>Note: ${sito.note}</p>
     `
}

function showLess(){
    document.getElementById("infopanel").innerHTML = null;
}

async function getSites() {
    try {
        const res = await fetch(`/siti`);
        
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const sites = await res.json();
        console.log(sites);
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



document.querySelectorAll(".filters").forEach(el => {
  el.addEventListener('change', async (e) => {
    console.log("Eventlistener attivo");
    filterSites(e);

    if(e.target.id === "provincia"){
      const selectComune = document.getElementById('comune');
      console.log(selectComune);

      if(e.target.value !== ''){
      
      const comuneHTML = ['<option value=""></option>'];
      
      const sites = await getSites();
      sites.forEach(sito  => {
          if(sito.provincia === e.target.value){
              let option = `<option value="${sito.comune}">${sito.comune}</option>`
              if(!comuneHTML.includes(option)){
                  comuneHTML.push(option);
              }
          }
      })
      
      selectComune.innerHTML = comuneHTML.join();
      document.querySelector('.comune-group').style.display = 'flex';
      }
      else{
        selectComune.innerHTML = '';
        document.querySelector('.comune-group').style.display = "none";
      }
    }
  })  
});

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

    const sites = await getSites();
    const sito = sites.filter(s => s.codice === sitoSelezionato.codice);
    const modificaForm = document.getElementById("modificadiv");

    if(sito['messa_sicurezza_emergenza'] === 'Si'){
      document.getElementById("check-messa_sicurezza_emergenza").checked = true;
    }
    if(sito['messa_sicurezza_operativa'] === 'Si'){
      document.getElementById("check-messa_sicurezza_operativa").checked = true;
    }
    if(sito['messa_sicurezza_permanente'] === 'Si'){
      document.getElementById("check-messa_sicurezza_permanente").checked = true;
    }
    if(sito['bonifica'] === 'Si'){
      document.getElementById("check-bonifica").checked = true;
    }
    if(sito['bonifica_sicurezza'] === 'Si'){
      document.getElementById("check-bonifica_sicurezza").checked = true;
    } 
     

    modificaForm.style.visibility = "visible";

    modificaForm.addEventListener("submit", function (e) {
    e.preventDefault(); // Impedisce il refresh della pagina
    
    const formData = new FormData(this);
    const objData = Object.fromEntries(formData.entries())
    console.log(objData);
    const data = JSON.stringify(objData);
    console.log(data);
    
    modifySite(sitoSelezionato, data);
    this.reset();
    this.style.visibility = "hidden";
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

document.getElementById("codice").addEventListener('keydown', async (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();  // evita che il form si invii se c'è
    console.log(e);
    console.log(e.target.id);
    console.log(e.target.value);
    filterSites(e)
  }
});

document.getElementById("codice").addEventListener('onfocus', (e) => {
  this.value = '';
  delete queryFields['codice'];
});

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
    this.style.visibility = "hidden";
});

document.getElementById("addSite").addEventListener('click', () => {
    const form = document.getElementById("sitoForm");
    form.style.visibility = (form.style.visibility === "hidden") ? "visible" : "hidden";
});


