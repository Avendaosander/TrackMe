console.log("Bienvenido a TrackMe");

// API de https://www.ipify.org/
const URL_API_IP = "https://api.ipify.org/?format=json";

// APIs de https://geo.ipify.org/docs
const URL_API_GEO ="https://geo.ipify.org/api/v2/country,city,vpn?apiKey=at_tJNUdet4sUYU6WfaWQqCyHi0UYsGG&ipAddress=";
const URL_API_GEO_DOMAIN ="https://geo.ipify.org/api/v2/country,city,vpn?apiKey=at_tJNUdet4sUYU6WfaWQqCyHi0UYsGG&domain=";

// Aqui se guarda la IP del usuario
let IP = "";

// Aqui se guarda la Geolocalizacion del usuario
let Geo = "";

// Aqui se guarda el Popup para mostrar la informacion del usuario
let contPopup = "";

// Latitud Inicial
let latitud = "6.52448";

// Longitud Inicial
let longitud = "-65.46779";

// Aqui se guarda la posicion de un marcador
let marcador;

// Establece el mapa en estas coordenadas (Venezuela) y un zoom al maximo
let map = L.map("map").setView([latitud, longitud], 6);

// Agregar una capa de openstreetmap
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {}).addTo(map);

// Boton para filtrar busqueda por Coordenadas
const btnCoordinate = document.getElementById("btnCoordinate");

// Boton para filtrar busqueda por Ip
const btnIp = document.getElementById("btnIp");

// Boton para filtrar busqueda por Dominio
const btnDomain = document.getElementById("btnDomain");

// Objeto con los ejemplos para cada tipo de busqueda
const ejemplos = {
   coordenadas: {
      primero: '9.3165721, -70.5998961',
      segundo: '9.302005, -70.592128',
   },
   ip: {
      primero: '200.8.113.234',
      segundo: '192.168.0.1',
   },
   dominio: {
      primero: 'inter.com.ve',
      segundo: 'www.ejemplo.com',
   }
}

// Formulario
let formulario = document.getElementById("form");

// Input de coordenadas
let coordenadas = document.getElementById("coordenadas");

// Boton para buscar direccion por Coordenadas
let sendCoordenadas = document.getElementById("sendCoordenadas");

// Al cargar la pagina se obtiene la IP y la Geolocalizacion del usuario
document.addEventListener("DOMContentLoaded", async () => {
   await obtenerIp();
   if (!IP) return alert('La peticion no se pudo completar, revise su conexión a internet y vuelva a intentarlo');
   // console.log(IP);
   
   await obtenerGeo(IP)
   if (!Geo) return alert('La peticion no se pudo completar, revise su conexión a internet y vuelva a intentarlo')
   // console.log(Geo);

   document.getElementById("loader").classList.toggle('loader-off')

   await map.flyTo([Geo.location.lat, Geo.location.lng], 18);

   contPopup = await crearPopup(Geo)
   // console.log(contPopup);

   marcador.remove()
   await GenerarMarcador(Geo.location.lat, Geo.location.lng, contPopup)
});

// Funcion para obtener la IP del usuario
const obtenerIp = async () => {
   try {
      await fetch(URL_API_IP)
         .then(res => res.json())
         .then(res => IP = res.ip)
   } catch (error) {
      console.error(error.message)
   }
};

// Funcion para obtener la Geolocalizacion del usuario por IP
const obtenerGeo = async (ip) => {
   try {
      await fetch(`${URL_API_GEO}${ip}`)
         .then(res => res.json())
         .then(res => Geo = res)
   } catch (error) {
      console.error(error.message)
   }
};

// Funcion para obtener la Geolocalizacion del usuario por dominio
const obtenerGeoDominio = async (domain) => {
   try {
      await fetch(`${URL_API_GEO_DOMAIN}${domain}`)
         .then(res => res.json())
         .then(res => Geo = res)
   } catch (error) {
      console.error(error.message)
   }
};

// Funcion para asignar un marcador en el mapa
const GenerarMarcador = (lat, lng, contPopup = null) => {
   marcador = L.marker([lat, lng]).addTo(map);
   marcador
      .bindPopup(
         contPopup 
            ? contPopup 
            : "Aqui debe ir la información del cliente"
      ).openPopup();
}

// Crea un marcador inicial por defecto
GenerarMarcador(latitud, longitud, "Venezuela")

// Funcion para crar un popup con la información del usuario
const crearPopup = (location) => {
   contPopup = document.createRange().createContextualFragment(/*html*/
      `<div id="contPopup">
         <p class="msg-popup">Ip: ${location.ip}</p>
         <p class="msg-popup">Domain: ${location.as ? location.as.domain : location.domains[0]}</p>
         <p class="msg-popup">Location</p>
         <p class="msg-popup">Country: ${location.location.country}</p>
         <p class="msg-popup">Region: ${location.location.region}</p>
         <p class="msg-popup">City: ${location.location.city}</p>
         <p class="msg-popup">Coordinates: ${location.location.lat}, ${location.location.lng}</p>
      </div>`
   )
   return contPopup
}

// Crea un popup con las coordenadas de donde hace click en el mapa
const popup = L.popup();
map.on("click", (e) => {
   popup
      .setLatLng(e.latlng)
      .setContent(`Latidud: ${e.latlng.lat} <br> Longitud: ${e.latlng.lng}`)
      .openOn(map);
});

// Asigna una capa al minimapa
const osm2 = new L.TileLayer(
   "https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}.png",
   { minZoom: 5, maxZoom: 15, attribution: "CartoDB" }
);

// Crea un minimapa
let miniMap = new L.Control.MiniMap(osm2, {
   toggleDisplay: true,
   minimized: false,
   position: "bottomleft",
}).addTo(map);

// Evento para filtrar la busqueda por coordenadas
btnCoordinate.addEventListener("click", e => {
   const filtro = btnCoordinate.textContent
   filtrarEjemplos(filtro)
   filtrarBusqueda(filtro)
   coordenadas = document.getElementById("coordenadas");
   sendCoordenadas = document.getElementById('sendCoordenadas')

   // Evento del boton al buscar una ubicacion por Coordenadas
   sendCoordenadas.addEventListener("click", async (e) => {
      e.preventDefault();
      const regex = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)\s*[,]\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
      if (regex.test(coordenadas.value.trim())) {
         let coordinates = coordenadas.value.split(",");
         const lat = coordinates[0]
         const lng = coordinates[1]
         map.flyTo(coordinates, 18);
         marcador.remove()
         contPopup = crearPopup(Geo)
         GenerarMarcador(lat, lng)
      } else {
         return console.warn("No es una coordenada valida");
      }
   });
})

// Evento para filtrar la busqueda por IP
btnIp.addEventListener("click", e => {
   const filtro = btnIp.textContent
   filtrarEjemplos(filtro)
   filtrarBusqueda(filtro)
   const IPs = document.getElementById("ip");
   const sendIp = document.getElementById('sendIp')

   // Evento del boton al buscar una ubicacion por IP
   sendIp.addEventListener("click", async (e) => {
      e.preventDefault();
      Geo = ''
      const regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      const newIP = IPs.value.trim()
      if (regex.test(newIP)) {
         await obtenerGeo(newIP)
         if (!Geo) return alert('La peticion no se pudo completar, revise su conexión a internet y vuelva a intentarlo')
         const lat = Geo.location.lat
         const lng = Geo.location.lng
         map.flyTo([lat, lng], 18);
         marcador.remove()
         contPopup = crearPopup(Geo)
         GenerarMarcador(lat, lng, contPopup)
      } else {
         return console.warn("No es una IP valida");
      }
   });
})

// Evento para filtrar la busqueda por Dominio
btnDomain.addEventListener("click", e => {
   const filtro = btnDomain.textContent
   filtrarEjemplos(filtro)
   filtrarBusqueda(filtro)
   const dominio = document.getElementById("dominio");
   const sendDominio = document.getElementById('sendDominio')

   // Evento del boton al buscar una ubicacion por Dominio
   sendDominio.addEventListener("click", async (e) => {
      e.preventDefault();
      Geo = ''
      const regex = /^[a-zA-Z0-9]+([\-\.]{1}[a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/;
      const newDomain = dominio.value.trim()
      if (regex.test(newDomain)) {
         await obtenerGeoDominio(newDomain)
         if (!Geo) return alert('La peticion no se pudo completar, revise su conexión a internet y vuelva a intentarlo')
         const lat = Geo.location.lat
         const lng = Geo.location.lng
         map.flyTo([lat, lng], 18);
         marcador.remove()
         contPopup = crearPopup(Geo)
         GenerarMarcador(lat, lng, contPopup)
      } else {
         return console.warn("No es dominio valido");
      }
   });
})

// Funcion para filtrar los ejemplos por un filtro
const filtrarEjemplos = (filtro) => {
   const oneLowerCase = filtro[0].toLowerCase() + filtro.substring(1);
   const contenedorEjemplos = document.querySelector('.contenedor-ejemplos')
   
   while(contenedorEjemplos.firstChild){
      contenedorEjemplos.removeChild(contenedorEjemplos.firstChild)
   }
   const texto1 = document.createElement("h2");
   const texto2 = document.createElement("p");
   const texto3 = document.createElement("p");
   texto1.textContent = `${filtro} de ejemplo:`
   

   for (const key in ejemplos) {
      if (key === oneLowerCase) {
         texto2.textContent = `${ejemplos[key].primero}`
         texto3.textContent = `${ejemplos[key].segundo}`
      }
   }
   
   contenedorEjemplos.appendChild(texto1);
   contenedorEjemplos.appendChild(texto2);
   contenedorEjemplos.appendChild(texto3);
}

// Funcion para filtrar el formulario por un filtro
const filtrarBusqueda = (filtro) => {
   const oneLowerCase = filtro[0].toLowerCase() + filtro.substring(1);

   const label = document.createElement("label");
   label.setAttribute('for', `${oneLowerCase}`)
   label.textContent = `Buscar dirección por ${filtro}`

   const input = document.createElement("input");
   input.type = 'text'
   input.name = `${oneLowerCase}`
   input.id = `${oneLowerCase}`
   input.classList.add('buscador')

   for (const key in ejemplos) {
      if (key === oneLowerCase) {
         input.placeholder = `Ejemplo: ${ejemplos[key].primero}`
      }
   }

   const boton = document.createElement("button");

   switch (filtro) {
      case 'Coordenadas':
         boton.id = 'sendCoordenadas'
         break;
      case 'Ip':
         boton.id = 'sendIp'
         break;
      case 'Dominio':
         boton.id = 'sendDominio'
         break;
   }
   boton.classList.add('btnForm')
   boton.textContent = 'Buscar'

   while(formulario.firstChild){
      formulario.removeChild(formulario.firstChild)
   }

   formulario.appendChild(label);
   formulario.appendChild(input);
   formulario.appendChild(boton);

   coordenadas = document.getElementById("coordenadas");
}

// Evento del boton inicial al buscar una ubicacion por Coordenadas
sendCoordenadas.addEventListener("click", async (e) => {
   e.preventDefault();
   const regex = /^[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?)\s*[,]\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)$/;
   if (regex.test(coordenadas.value.trim())) {
      let coordinates = coordenadas.value.split(",");
      const lat = coordinates[0]
      const lng = coordinates[1]
      map.flyTo(coordinates, 18);
      marcador.remove()
      GenerarMarcador(lat, lng)
   } else {
      return console.warn("No es una coordenada valida");
   }
});