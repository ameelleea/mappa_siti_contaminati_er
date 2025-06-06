const map = L.map('map').setView([44.5, 11.3], 8);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

let markers = [];

function markSites(sites){
    markers.forEach(m => map.removeLayer(m));
    markers = [];

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
                            `);  
            
            markers.push(marker);
            marker.on('popupclose', function () {
            showLess();
            // Qui puoi eseguire qualsiasi azione (nascondere info aggiuntive, aggiornare UI, ecc.)
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

async function loadSites() {
    try {
        const res = await fetch(`/siti${'?provincia=' + ''}`);
        
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        const sites = await res.json();
        
        markSites(sites);

    } catch (err) {
        console.error('Errore caricando siti:', err);
    }
}

async function filterSites(e) {
    try {
    const prov = e.target.value;

    const res = await fetch(`/siti${prov ? '?provincia=' + prov : ''}`);
    
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

/*
async function modifySite(sito) {
    fetch('/siti/${sito.codice}', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nome: 'Sito aggiornato',
            provincia: 'MO'
          })
        })
        .then(response => response.json())
        .then(data => {
          console.log('Aggiornato con successo:', data);
        })
        .catch(error => console.error('Errore nella PUT:', error));

}

async function deleteSite(sito) {
    fetch('/siti/${codice}', {
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

}
*/

window.addEventListener("load", loadSites());

document.getElementById('provincia').addEventListener('change', async (e) => filterSites(e));

document.addEventListener('click', async (event) => {
  if (event.target && event.target.classList.contains('show-more-btn')) {
    const codice = event.target.getAttribute('data-id');
    const res = await fetch(`/siti${'?provincia=' + ''}`);
        
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const sites = await res.json();
    const sitoSelezionato = sites.find(s => s.codice === codice);
    if (sitoSelezionato) {
      showMore(sitoSelezionato);
    }
  }
});

document.getElementById("sitoForm").addEventListener("submit", function (e) {
    e.preventDefault(); // Impedisce il refresh della pagina
    
    const formData = new FormData(this);
    const objData = Object.fromEntries(formData.entries())
    objData.comune = objData.comune.toUpperCase();
    objData.provincia = objData.provincia.toUpperCase();
    console.log(objData);
    const data = JSON.stringify(objData);
    console.log(data);
    
    addSite(data);
});

document.getElementById("addSite").addEventListener('click', () => {
    const form = document.getElementById("sitoForm");
    form.style.visibility = (form.style.visibility === "hidden") ? "visible" : "hidden";
});


