//Frontend
let markersMap = {};
let filterOptions = ["Si", "No"];
let province = ["CITTA' METROPOLITANA DI BOLOGNA", "MODENA", "REGGIO EMILIA", "FERRARA", "RIMINI", "PIACENZA", "RAVENNA", "PARMA", "FORLI'"];

const map = L.map('map').setView([44.5, 11.3], 8);
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);


async function mostraSezione(id) {
    // Nasconde tutte le sezioni
    const sezioni = document.querySelectorAll('section');
    sezioni.forEach(s => {
        s.classList.remove('attiva');
    });

    // Mostra solo quella con l'ID selezionato
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

async function statsSiti(){
    const sites = await getSites();
    const sitesSizes = [sites.length, 0, 0]
    console.log(sitesSizes);
    sites.forEach(s => {
        if(s["bonifica"] === 'Si' || s["bonifica_sicurezza"] === 'Si'){
            sitesSizes[1] += 1;
        }
        else if(s["messa_sicurezza_emergenza"] === "Si"){
            sitesSizes[2] += 1;
        }
        else if(s["messa_sicurezza_operativa"] === "Si"){
            sitesSizes[2] += 1;
        }
        else if(s["messa_sicurezza_permanenete"] === "Si"){
            sitesSizes[2] += 1;
        }
    });
    console.log(sitesSizes);
    document.getElementById("content").querySelectorAll('div').forEach((d, i=0) => {
        d.innerHTML += sitesSizes[i];
    });
}

function markSites(sites){
    Object.values(markersMap).forEach(m => map.removeLayer(m));
    Object.keys(markersMap).forEach(k => delete markersMap[k]);
  
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
    const targetKeys = [
              "messa_sicurezza_emergenza",
              "messa_sicurezza_operativa",
              "messa_sicurezza_permanenete",
              "bonifica",
              "bonifica_sicurezza",
              "procedura",
              "note"
            ];

    let divArray = document.getElementById('info').querySelectorAll('div');

    targetKeys.forEach((t, i=0) => {
        divArray[i].querySelector('span').innerHTML = sito[t];
    });

    mostraSezione("infopanel");
}

function showLess(){

    document.getElementById('info').querySelectorAll('div').forEach(d => {
        d.querySelector('span').innerHTML = '';
    })

    document.getElementById("modificaSito").querySelector('form').reset();
    mostraSezione("default");
}

window.addEventListener("load", async () => {
    statsSiti();
    markSites(await getSites());
});


/*EventListeners*/
document.querySelectorAll("select").forEach(el => {
    const firstOption = document.createElement("option");
    firstOption.value = "";
    firstOption.textContent = "-- Seleziona --"
    el.appendChild(firstOption);
});

document.getElementById("filters").querySelectorAll("select").forEach(el => {
    el.addEventListener('change', async (e) => {
        markSites(await getSites(e.target.id, e.target.value));

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
      document.querySelector('.modify-btn').addEventListener('click', async (e) => {
            const targetKeys = [
                          "messa_sicurezza_emergenza",
                          "messa_sicurezza_operativa",
                          "messa_sicurezza_permanenete",
                          "bonifica",
                          "bonifica_sicurezza",
                        ];
            const modificaForm = document.getElementById("modificaSito").querySelector("form");

            targetKeys.forEach(key => {
              if(sitoSelezionato[key] === 'Si'){
                document.getElementById("check-"+key).checked = true;
              }
            });

            mostraSezione("modificaSito");

            modificaForm.addEventListener("submit", function (e) {
              e.preventDefault();
            
              const formData = new FormData(this);
              const objData = Object.fromEntries(formData.entries())
            
              Object.keys(objData).forEach(k => {
                sitoSelezionato[k] = objData[k];
              })
              const data = JSON.stringify(objData);
          
              modifySite(sitoSelezionato, data);
              showMore(sitoSelezionato);
            });
            
        })
    }else if(event.target.classList.contains('delete-btn')){
      if (confirm("Eliminare questo sito dalla mappa? L'operazione non è reversibile.")) {
        deleteSite(sitoSelezionato);
      } else {
        console.log("Annullato");
      }
    }
  } 
}});


document.getElementById("cerca").querySelector("form").addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const objData = Object.fromEntries(formData.entries())
    markSites(await getSites('codice', objData.codice));
    e.target.querySelector('input[name="codice"]').value = '';
});

document.querySelector("#provincia-agg").addEventListener('change', async function (e) {
    const comuneSelect = document.querySelector("#comune-agg");

    const res = await fetch('/comuni');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const comuni = await res.json();

    comuni[e.target.value].forEach(c => {
      const optionDefault = document.createElement("option");
      optionDefault.value = optionDefault.textContent = c.toUpperCase();
      
      const esiste = Array.from(comuneSelect.children).some(
                      (child) => child.innerHTML === optionDefault.innerHTML
                      );

      if (!esiste) {
        comuneSelect.appendChild(optionDefault);
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
    mostraSezione("default");
});

document.querySelector("#hidden-items").querySelectorAll("select").forEach(el => {
    filterOptions.forEach(val => {
      const optionDefault = document.createElement("option");
      optionDefault.value = val;
      optionDefault.textContent = val;
      el.appendChild(optionDefault);
    })
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


