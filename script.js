/* ── URL DE GOOGLE APPS SCRIPT ── */
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw4i-xvxLwwk1856Wi72LGNOWe54ImUXKVM-oRaSPFXYw7wWMREZ6HBcOFXItfEAz33sw/exec';
/* ── SOBRE DE BIENVENIDA ── */
(function () {
  const overlay  = document.getElementById('intro-overlay');
  const envelope = document.getElementById('envelope');
  if (!overlay || !envelope) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.body.classList.add('intro-locked');

  function openEnvelope() {
    if (envelope.classList.contains('open')) return;
    envelope.classList.add('open');
    const delay = reduceMotion ? 200 : 1500;
    setTimeout(() => {
      overlay.classList.add('hidden');
      document.body.classList.remove('intro-locked');
    }, delay);
  }

  envelope.addEventListener('click', openEnvelope);
  envelope.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openEnvelope();
    }
  });
})();

/* ── NAV: añade clase 'scrolled' al hacer scroll ── */
const nav = document.getElementById('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
});

/* ── MOBILE MENU ── */
function openMobileMenu() {
  document.getElementById('mobile-menu').style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function closeMobileMenu() {
  document.getElementById('mobile-menu').style.display = 'none';
  document.body.style.overflow = '';
}

/* ── REVEAL ON SCROLL ── */
const revealEls = document.querySelectorAll('.reveal');
const observer = new IntersectionObserver((entries) => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('visible'), i * 80);
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
revealEls.forEach(el => observer.observe(el));

/* ── FAQ ── */
function toggleFaq(btn) {
  const answer = btn.nextElementSibling;
  const isOpen = answer.classList.contains('open');
  document.querySelectorAll('.faq-a').forEach(a => a.classList.remove('open'));
  document.querySelectorAll('.faq-q').forEach(q => q.classList.remove('active'));
  if (!isOpen) {
    answer.classList.add('open');
    btn.classList.add('active');
  }
}

/* ── RSVP ── */
const asistenciaInput   = document.getElementById('r-asistencia');
const personasInput     = document.getElementById('r-personas');
const alojamientoInput  = document.getElementById('r-alojamiento');
const personasDetalle   = document.getElementById('personas-detalle');

const MENU_OPTIONS = [
  ['sin-restricciones', 'Sin restricciones'],
  ['vegetariano', 'Vegetariano'],
  ['vegano', 'Vegano'],
  ['sin-gluten', 'Sin gluten (celíaco)'],
  ['sin-lactosa', 'Sin lactosa'],
  ['sin-mariscos', 'Sin mariscos'],
  ['sin-frutos-secos', 'Sin frutos secos'],
  ['infantil', 'Menú infantil'],
  ['otro', 'Otro (indicar en notas)']
];

function menuOptionsHTML() {
  return MENU_OPTIONS.map(([v, label]) => `<option value="${v}">${label}</option>`).join('');
}

// Genera los campos de nombre/menú según el nº de personas
function renderPersonasDetalle() {
  const n = parseInt(personasInput.value);
  personasDetalle.innerHTML = '';
  if (isNaN(n) || n < 1) return;

  let html = '';
  for (let i = 1; i <= n; i++) {
    html += `<div class="persona-block-label">${i === 1 ? 'Tu menú' : 'Acompañante ' + (i - 1)}</div>`;
    html += '<div class="persona-block">';
    if (i > 1) {
      html += `
        <div class="rsvp-field">
          <label for="p-nombre-${i}" class="sr-only">Nombre del acompañante</label>
          <input type="text" id="p-nombre-${i}" placeholder="Nombre completo del acompañante" autocomplete="off">
        </div>`;
    }
    html += `
        <div class="rsvp-field">
          <label for="p-menu-${i}" class="sr-only">Menú especial</label>
          <select id="p-menu-${i}">
            <option value="" disabled selected>Menú especial</option>
            ${menuOptionsHTML()}
          </select>
        </div>`;
    html += '</div>';
  }
  personasDetalle.innerHTML = html;
}

function toggleAsistenciaFields() {
  const valor = asistenciaInput.value;
  const asiste = valor === 'preboda' || valor === 'boda' || valor === 'ambas';

  personasInput.disabled = !asiste;
  alojamientoInput.disabled = !asiste;

  if (!asiste) {
    personasInput.value = '';
    alojamientoInput.selectedIndex = 0;
    personasDetalle.innerHTML = '';
  }
}

asistenciaInput.addEventListener('change', toggleAsistenciaFields);
personasInput.addEventListener('change', renderPersonasDetalle);

// Envío del formulario RSVP a Google Sheets
function submitRSVP() {
  const nombre      = document.getElementById('r-nombre').value.trim();
  const asistencia  = document.getElementById('r-asistencia').value;
  const personas    = document.getElementById('r-personas').value;
  const alojamiento = document.getElementById('r-alojamiento').value;
  const notas       = document.getElementById('r-notas').value.trim();

  if (!asistencia) {
    alert('Por favor, indícanos a qué asistirás.');
    return;
  }

  const asiste = asistencia === 'preboda' || asistencia === 'boda' || asistencia === 'ambas';

  if (!asiste) {
    if (!nombre) {
      alert('Por favor, rellena tu nombre.');
      return;
    }
  } else if (!nombre || !personas) {
    alert('Por favor, rellena todos los campos obligatorios.');
    return;
  }

  // Recoge nombre y menú de cada persona
  const personasData = [];
  if (asiste) {
    const n = parseInt(personas) || 0;
    for (let i = 1; i <= n; i++) {
      const nombreP = i === 1 ? nombre : (document.getElementById(`p-nombre-${i}`)?.value.trim() || '');
      const menuP   = document.getElementById(`p-menu-${i}`)?.value || '';
      personasData.push({ nombre: nombreP, menu: menuP });
    }
  }

  const submitBtn = document.querySelector('.rsvp-submit');
  const originalText = submitBtn.innerText;
  submitBtn.disabled = true;
  submitBtn.innerText = 'ENVIANDO...';

  const payload = { nombre, asistencia, personas, alojamiento, personasData, notas };

  fetch(SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  })
  .then(() => {
    document.getElementById('rsvp-form').style.display = 'none';
    document.getElementById('rsvp-success').style.display = 'block';
  })
  .catch(error => {
    console.error('Error al enviar:', error);
    alert('Hubo un problema al enviar la confirmación.');
    submitBtn.disabled = false;
    submitBtn.innerText = originalText;
  });
}

/* ── CARGAR FOTOS EN LA GALERÍA ── */
function cargarGalería() {
  const grid = document.getElementById('grid-fotos');
  if (!grid) return;

  // '?t=' evita que el navegador muestre una lista antigua guardada en caché
  fetch(SCRIPT_URL + '?t=' + Date.now(), { cache: 'no-store' })
    .then(r => r.json())
    .then(data => {
      if (data.result !== 'success') throw new Error(data.error || 'Respuesta no válida');
      grid.innerHTML = '';

      if (!data.fotos || data.fotos.length === 0) {
        grid.innerHTML = '<p class="fotos-vacio">Todavía no hay fotos. ¡Sé el primero en compartir una!</p>';
        return;
      }

      data.fotos.forEach(foto => {
        const item = document.createElement('div');
        item.className = 'foto-item';
        const enlace = foto.ver || foto.url;
        item.innerHTML = `
          <a href="${enlace}" target="_blank" rel="noopener">
            <img src="https://lh3.googleusercontent.com/d/${foto.id}=w1000" alt="Foto de la boda" loading="lazy" referrerpolicy="no-referrer">
            ${foto.tipo === 'video' ? '<span class="foto-play">▶</span>' : ''}
          </a>
          ${foto.descargar ? `<a class="foto-download" href="${foto.descargar}" title="Descargar" aria-label="Descargar">↓</a>` : ''}`;
        // Si Drive aún no ha generado la miniatura, ocultamos la casilla rota
        const img = item.querySelector('img');
        img.onerror = () => {
          // Plan B: miniatura de Drive; si tampoco carga, ocultamos la casilla
          if (!img.dataset.retry) { img.dataset.retry = 1; img.src = foto.url; }
          else item.remove();
        };
        grid.appendChild(item);
      });
    })
    .catch(err => {
      console.error('Error al cargar la galería:', err);
      grid.innerHTML = '<p class="fotos-vacio">No se pudieron cargar las fotos en este momento.</p>';
    });
}

document.addEventListener('DOMContentLoaded', cargarGalería);

/* ── SUBIR FOTOS Y VÍDEOS ── */
// Google Apps Script acepta ~50 MB por envío; en base64 el archivo crece un 33 %
const MAX_MB = 35;

function leerBase64(file) {
  return new Promise((ok, ko) => {
    const reader = new FileReader();
    reader.onload = e => ok(e.target.result.split(',')[1]);
    reader.onerror = () => ko(new Error('No se pudo leer el archivo'));
    reader.readAsDataURL(file);
  });
}

async function subirUno(file, nombre) {
  const data = await leerBase64(file);
  const payload = {
    tipo: 'foto',
    archivo: {
      data,
      mimeType: file.type || 'application/octet-stream',
      nombre: `${nombre}_${Date.now()}_${file.name}`
    }
  };
  // Sin 'no-cors' para poder leer la respuesta y saber si ha ido bien
  const res = await fetch(SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload)
  });
  const json = await res.json();
  if (json.result !== 'success') throw new Error(json.error || 'Error desconocido');
}

async function uploadFoto() {
  const nombre = document.getElementById('f-nombre').value.trim() || 'Invitado';
  const files  = Array.from(document.getElementById('f-archivo').files);
  const btn    = document.getElementById('btn-foto');
  const ok     = document.getElementById('foto-success');

  if (files.length === 0) {
    alert('Por favor, selecciona al menos una foto o vídeo.');
    return;
  }

  const grandes = files.filter(f => f.size > MAX_MB * 1024 * 1024);
  if (grandes.length) {
    alert(`Estos archivos pesan más de ${MAX_MB} MB y no se pueden subir desde la web:\n\n` +
          grandes.map(f => '· ' + f.name).join('\n') +
          '\n\nPrueba con un vídeo más corto o envíanoslo por WhatsApp.');
    return;
  }

  ok.style.display = 'none';
  btn.disabled = true;
  const fallos = [];

  for (let i = 0; i < files.length; i++) {
    btn.innerText = files.length > 1 ? `SUBIENDO ${i + 1} DE ${files.length}...` : 'SUBIENDO...';
    try {
      await subirUno(files[i], nombre);
    } catch (err) {
      console.error('Error subiendo', files[i].name, err);
      fallos.push(files[i].name);
    }
  }

  btn.disabled = false;

  if (fallos.length === files.length) {
    btn.innerText = 'SUBIR FOTO O VÍDEO';
    alert('No se ha podido subir. Inténtalo de nuevo en unos minutos.');
    return;
  }

  document.getElementById('foto-form').reset();
  btn.innerText = 'SUBIR MÁS FOTOS';
  ok.style.display = 'block';
  if (fallos.length) {
    alert('Algunos archivos no se han podido subir:\n\n' + fallos.map(f => '· ' + f).join('\n'));
  }
  setTimeout(cargarGalería, 2000);
}

/* ── CUENTA ATRÁS ── */
const boda = new Date('2027-04-24T13:00:00').getTime();

function tickCD() {
  const cdContainer = document.getElementById('countdown');
  if (!cdContainer) return;

  const diff = boda - Date.now();

  if (diff <= 0) {
    cdContainer.innerHTML =
      '<p style="text-align:center;font-family:Cormorant Garamond,serif;font-size:40px;font-style:italic;color:var(--dark);padding:80px">¡Hoy es el gran día!</p>';
    return;
  }

  const pad = n => String(n).padStart(2, '0');
  const elDias = document.getElementById('cd-dias');
  const elHoras = document.getElementById('cd-horas');
  const elMin = document.getElementById('cd-min');
  const elSeg = document.getElementById('cd-seg');

  if (elDias) elDias.textContent  = Math.floor(diff / 86400000);
  if (elHoras) elHoras.textContent = pad(Math.floor((diff % 86400000) / 3600000));
  if (elMin) elMin.textContent   = pad(Math.floor((diff % 3600000) / 60000));
  if (elSeg) elSeg.textContent   = pad(Math.floor((diff % 60000) / 1000));
}

tickCD();
setInterval(tickCD, 1000);
