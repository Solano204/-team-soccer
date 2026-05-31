const API = 'https://team-soccer-api.onrender.com';
let _equiposDB = [];

// =============================================
//  EQUIPOS · FUT 7 EL JAGUAR
// =============================================

const urlParams = new URLSearchParams(window.location.search);
const categoria = urlParams.get('categoria');

if (!categoria) location.href = '../menu/menu.html';

// Títulos
document.getElementById('tituloEquipos').textContent = 'Equipos';
document.getElementById('headerCat').textContent    = categoria || '';

// Storage
const storageKey       = `equipos_${categoria}`;
const storageKeyConfig = `config_${categoria}`;

const lista = document.getElementById('listaEquipos');
let configTemporal  = null;
let equipoAEliminar = null;

// Volver
document.getElementById('btnVolver').onclick = () => {
    location.href = '../menu/menu.html';
};

// ── Paleta de colores para camisetas ──
const JERSEY_COLORS = [
    '#1d4ed8','#dc2626','#16a34a','#7c3aed',
    '#ea580c','#0891b2','#be185d','#854d0e',
    '#065f46','#1e3a5f','#6d28d9','#b45309',
    '#0f766e','#9f1239','#1e40af','#166534'
];

function getJerseyColor(nombre) {
    let hash = 0;
    for (let i = 0; i < nombre.length; i++) {
        hash = nombre.charCodeAt(i) + ((hash << 5) - hash);
    }
    return JERSEY_COLORS[Math.abs(hash) % JERSEY_COLORS.length];
}

function getJerseyNumber(index) {
    const nums = [10,7,9,1,11,8,6,3,5,4,2,17,23,99,13,19];
    return nums[index % nums.length];
}

// ── SVG Camiseta dinámica ──
function jerseyBadgeSVG(nombre, index) {
    const color    = getJerseyColor(nombre);
    const number   = getJerseyNumber(index);
    const colorDark = shadeColor(color, -25);

    return `
    <svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="jg${index}" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="${color}"/>
                <stop offset="100%" stop-color="${colorDark}"/>
            </linearGradient>
        </defs>
        <!-- sombra -->
        <ellipse cx="40" cy="74" rx="22" ry="4" fill="rgba(0,0,0,0.25)"/>
        <!-- camiseta -->
        <path d="M15 12 L5 28 L20 32 L20 70 L60 70 L60 32 L75 28 L65 12 L52 18 Q40 23 28 18 Z"
              fill="url(#jg${index})" stroke="rgba(255,255,255,0.18)" stroke-width="1.2"/>
        <!-- cuello -->
        <path d="M28 18 Q34 24 40 24 Q46 24 52 18" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
        <!-- reflejo -->
        <path d="M20 32 L20 45 Q30 42 38 43 L38 30 Q29 31 20 32 Z" fill="rgba(255,255,255,0.07)"/>
        <!-- número -->
        <text x="40" y="54" text-anchor="middle"
              font-family="Bebas Neue, cursive" font-size="18"
              fill="white" opacity="0.92"
              style="text-shadow:0 2px 4px rgba(0,0,0,0.5)">${number}</text>
    </svg>`;
}

function shadeColor(hex, pct) {
    let n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.max(0, (n >> 16) + pct));
    const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + pct));
    const b = Math.min(255, Math.max(0, (n & 0xff) + pct));
    return `#${((r<<16)|(g<<8)|b).toString(16).padStart(6,'0')}`;
}

// ══════════════════════════════════════
//  TOAST
// ══════════════════════════════════════
function mostrarToast(msg, tipo = 'exito') {
    let t = document.getElementById('toast-equipos');
    if (!t) { t = document.createElement('div'); t.id = 'toast-equipos'; document.body.appendChild(t); }
    t.style.background = tipo === 'exito'
        ? 'linear-gradient(135deg,#22c55e,#16a34a)'
        : 'linear-gradient(135deg,#ef4444,#dc2626)';
    t.style.color  = '#fff';
    t.style.border = tipo === 'exito' ? '1px solid rgba(34,197,94,0.4)' : '1px solid rgba(239,68,68,0.4)';
    t.textContent  = msg;
    t.style.opacity   = '1';
    t.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(t._t);
    t._t = setTimeout(() => {
        t.style.opacity   = '0';
        t.style.transform = 'translateX(-50%) translateY(20px)';
    }, 3000);
}

// ══════════════════════════════════════
//  EQUIPOS CRUD
// ══════════════════════════════════════
async function cargarEquipos() {
    try {
        const cat = window._categoriasDB?.find(c => c.nombre === categoria);
        if (!cat) return [];
        const res = await fetch(`${API}/equipos/${cat.id}`);
        _equiposDB = await res.json();
        return _equiposDB.map(e => e.nombre);
    } catch(e) {
        return JSON.parse(localStorage.getItem(storageKey)) || [];
    }
}

function actualizarContadores(equipos) {
    const n = equipos.length;
    document.getElementById('headerCount').textContent   = n;
    document.getElementById('countEquipos').textContent  =
        `${n} equipo${n !== 1 ? 's' : ''} registrado${n !== 1 ? 's' : ''}`;
}

function mostrarFormulario() {
    document.getElementById('formAgregar').classList.add('activo');
    document.getElementById('nombreEquipo').value = '';
    document.getElementById('errorNombre').textContent = '';
    document.getElementById('jerseyPreview').style.color = 'var(--accent)';
    document.getElementById('jerseyNum').textContent = '?';
    document.getElementById('nombreEquipo').focus();
}

function ocultarFormulario() {
    document.getElementById('formAgregar').classList.remove('activo');
}

// Preview de camiseta en tiempo real
document.getElementById('nombreEquipo').addEventListener('input', function() {
    const v = this.value.trim();
    if (v) {
        const color = getJerseyColor(v);
        const eq    = cargarEquipos();
        const num   = getJerseyNumber(eq.length);
        document.getElementById('jerseyPreview').style.color = color;
        document.getElementById('jerseyNum').textContent = num;
    } else {
        document.getElementById('jerseyPreview').style.color = 'var(--accent)';
        document.getElementById('jerseyNum').textContent = '?';
    }
});

async function guardarEquipo() {
    const nombre   = document.getElementById('nombreEquipo').value.trim();
    const errorDiv = document.getElementById('errorNombre');
    if (!nombre) { errorDiv.textContent = 'El nombre no puede estar vacío'; return; }
    try {
        const cat = window._categoriasDB?.find(c => c.nombre === categoria);
        const res = await fetch(`${API}/equipos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ categoria_id: cat.id, nombre })
        });
        const data = await res.json();
        if (data.error) { errorDiv.textContent = 'Ya existe un equipo con este nombre'; return; }
        ocultarFormulario();
        await mostrarEquipos();
        mostrarToast(`✓ Equipo "${nombre}" agregado`);
    } catch(e) {
        errorDiv.textContent = 'Error al guardar, revisa el servidor';
    }
}

async function mostrarEquipos() {
    const equipos = await cargarEquipos();
    lista.innerHTML = '';
    actualizarContadores(equipos);

    const vacio = document.getElementById('estadoVacio');
    if (equipos.length === 0) { vacio.style.display = 'flex'; return; }
    vacio.style.display = 'none';

    const sorted = [...equipos].sort((a,b) => a.localeCompare(b));

    sorted.forEach((nombre, index) => {
        const color = getJerseyColor(nombre);
        const card  = document.createElement('div');
        card.className = 'equipo-card';
        card.dataset.nombreOriginal = nombre;
        card.style.setProperty('--team-color', color);

        // franja superior del color del equipo
        card.style.borderTop = `4px solid ${color}`;

        // botón editar
        const btnEdit = document.createElement('button');
        btnEdit.className = 'btn-editar-equipo';
        btnEdit.innerHTML = '✏️';
        btnEdit.title     = 'Editar nombre';
        btnEdit.onclick   = (e) => { e.stopPropagation(); activarEdicion(card); };

        // botón eliminar
        const btnDel  = document.createElement('button');
        btnDel.className = 'btn-eliminar-equipo';
        btnDel.innerHTML = '✕';
        btnDel.title     = 'Eliminar equipo';
        btnDel.onclick   = (e) => { e.stopPropagation(); pedirEliminar(nombre); };

        // camiseta SVG
        const jerseyWrap = document.createElement('div');
        jerseyWrap.className = 'jersey-wrap';
        jerseyWrap.innerHTML = jerseyBadgeSVG(nombre, index);

        // nombre
        const nombreEl = document.createElement('div');
        nombreEl.className   = 'equipo-nombre';
        nombreEl.textContent = nombre;

        // sub
        const subEl = document.createElement('div');
        subEl.className   = 'equipo-sub';
        subEl.textContent = 'Ver jugadores →';

        card.appendChild(btnEdit);
        card.appendChild(btnDel);
        card.appendChild(jerseyWrap);
        card.appendChild(nombreEl);
        card.appendChild(subEl);

        card.onclick = () => {
            if (!card.classList.contains('editando')) {
                location.href = `jugadores.html?categoria=${encodeURIComponent(categoria)}&equipo=${encodeURIComponent(nombre)}`;
            }
        };

        lista.appendChild(card);
    });
}

// ── Edición inline ──
function activarEdicion(card) {
    const nombreOriginal = card.dataset.nombreOriginal;
    const jerseyWrap = card.querySelector('.jersey-wrap');
    const nombreEl   = card.querySelector('.equipo-nombre');
    const subEl      = card.querySelector('.equipo-sub');

    card.classList.add('editando');
    card.style.pointerEvents = 'none';
    card.querySelector('.btn-editar-equipo').style.display  = 'none';
    card.querySelector('.btn-eliminar-equipo').style.display = 'none';
    jerseyWrap.style.display = 'none';
    nombreEl.style.display   = 'none';
    subEl.style.display      = 'none';

    const input = document.createElement('input');
    input.type        = 'text';
    input.value       = nombreOriginal;
    input.placeholder = 'Nombre del equipo';
    card.appendChild(input);
    input.focus(); input.select();

const guardar = async () => {
    const nuevo = input.value.trim();
    if (!nuevo || nuevo === nombreOriginal) { cancelar(); return; }
    const eq = _equiposDB.find(e => e.nombre === nombreOriginal);
    if (!eq) { cancelar(); return; }
    const nombres = _equiposDB.map(e => e.nombre);
    if (nombres.includes(nuevo)) {
        mostrarToast('⚠️ Ya existe un equipo con ese nombre', 'error');
        input.focus(); return;
    }
    await fetch(`${API}/equipos/${eq.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevo })
    });

    // ── Actualizar nombre en el rol guardado en Railway ──
    try {
        const cats = await fetch(`${API}/categorias`).then(r => r.json());
        const cat  = cats.find(c => c.nombre === categoria);
        if (cat) {
            const rolRes = await fetch(`${API}/rol/${cat.id}`);
            const rolData = await rolRes.json();
            if (rolData && rolData.jornadas) {
                // Reemplazar nombre viejo por nuevo en jornadas
                const reemplazar = (obj) => {
                    if (obj.local === nombreOriginal)     obj.local     = nuevo;
                    if (obj.visitante === nombreOriginal) obj.visitante = nuevo;
                    if (obj.descanso === nombreOriginal)  obj.descanso  = nuevo;
                    return obj;
                };
                rolData.jornadas = rolData.jornadas.map(j => j.map(reemplazar));
                rolData.equipos_en_rol = (rolData.equipos_en_rol || []).map(e => e === nombreOriginal ? nuevo : e);

                await fetch(`${API}/rol`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        categoria_id: cat.id,
                        jornadas: rolData.jornadas,
                        equipos_en_rol: rolData.equipos_en_rol,
                        partidos_jugados: rolData.partidos_jugados || {},
                        jornadas_jugadas: rolData.jornadas_jugadas || [],
                        jornadas_doradas: rolData.jornadas_doradas || [],
                        partidos_agregados: rolData.partidos_agregados || {},
                        partidos_movidos: rolData.partidos_movidos || {},
                        jornada_actual_marcada: rolData.jornada_actual_marcada ?? null
                    })
                });
            }
        }
    } catch(e) { console.error('Error actualizando rol:', e); }
    // ── fin actualización rol ──

    await mostrarEquipos();
    mostrarToast(`✓ Renombrado a "${nuevo}"`);
};

    const cancelar = () => {
        card.classList.remove('editando');
        card.style.pointerEvents = '';
        card.querySelector('.btn-editar-equipo').style.display  = '';
        card.querySelector('.btn-eliminar-equipo').style.display = '';
        jerseyWrap.style.display = '';
        nombreEl.style.display   = '';
        subEl.style.display      = '';
        input.remove();
    };

    input.addEventListener('keypress', (e) => { if (e.key === 'Enter') guardar(); });
    input.addEventListener('blur',     () => { setTimeout(guardar, 200); });
    input.addEventListener('keydown',  (e) => { if (e.key === 'Escape') cancelar(); });
}

// ── Eliminar ──
function pedirEliminar(nombre) {
    equipoAEliminar = nombre;
    document.getElementById('nombreEliminar').textContent = nombre;
    document.getElementById('overlayModal').classList.add('activo');
    document.getElementById('modalEliminar').classList.add('activo');
}

function ocultarModalEliminar() {
    document.getElementById('overlayModal').classList.remove('activo');
    document.getElementById('modalEliminar').classList.remove('activo');
    equipoAEliminar = null;
}

async function confirmarEliminar() {
    if (!equipoAEliminar) return;
    const eq = _equiposDB.find(e => e.nombre === equipoAEliminar);
    if (eq) {
        await fetch(`${API}/equipos/${eq.id}`, { method: 'DELETE' });
        mostrarToast(`✓ Equipo "${equipoAEliminar}" eliminado`);
    }
    ocultarModalEliminar();
    await mostrarEquipos();
}

// ══════════════════════════════════════
//  CONFIGURACIÓN
// ══════════════════════════════════════
function cargarConfiguracion() {
    const cfg = JSON.parse(localStorage.getItem(storageKeyConfig)) || {};
    if (cfg.edadMin) document.getElementById('edadMin').value = cfg.edadMin;
    if (cfg.edadMax) document.getElementById('edadMax').value = cfg.edadMax;
    if (cfg.permitirRefuerzos) {
        document.getElementById('permitirRefuerzos').checked = true;
        toggleRefuerzos();
        if (cfg.cantidadRefuerzos) {
            document.getElementById('cantidadRefuerzos').value = cfg.cantidadRefuerzos;
            generarRefuerzos();
            if (cfg.refuerzos) {
                cfg.refuerzos.forEach((r, i) => {
                    const min = document.getElementById(`refuerzoMin${i}`);
                    const max = document.getElementById(`refuerzoMax${i}`);
                    if (min) min.value = r.min || '';
                    if (max) max.value = r.max || '';
                });
            }
        }
    }
}

function toggleRefuerzos() {
    const cb  = document.getElementById('permitirRefuerzos');
    const sec = document.getElementById('refuerzosConfig');
    if (cb.checked) { sec.classList.add('activo'); generarRefuerzos(); }
    else            { sec.classList.remove('activo'); document.getElementById('listaRefuerzos').innerHTML = ''; }
}

function generarRefuerzos() {
    const cant = parseInt(document.getElementById('cantidadRefuerzos').value) || 1;
    const cont = document.getElementById('listaRefuerzos');
    const vals = [];
    for (let i = 0; i < 10; i++) {
        const min = document.getElementById(`refuerzoMin${i}`);
        const max = document.getElementById(`refuerzoMax${i}`);
        if (min) vals[i] = { min: min.value, max: max.value };
    }
    cont.innerHTML = '';
    for (let i = 0; i < cant; i++) {
        const item = document.createElement('div');
        item.className = 'refuerzo-item';
        item.innerHTML = `
            <label>Refuerzo ${i+1}</label>
            <input type="number" id="refuerzoMin${i}" placeholder="Mín" min="0" max="100" value="${vals[i]?.min||''}">
            <span>—</span>
            <input type="number" id="refuerzoMax${i}" placeholder="Máx" min="0" max="100" value="${vals[i]?.max||''}">
            <span>años</span>`;
        cont.appendChild(item);
    }
}

function guardarConfiguracion() {
    const min = parseInt(document.getElementById('edadMin').value);
    const max = parseInt(document.getElementById('edadMax').value);
    if (!min || !max)  { mostrarModalAdvertencia('Campo Requerido','Completa el rango de edad mínima y máxima.'); return; }
    if (min >= max)    { mostrarModalAdvertencia('Error en Rango','La edad mínima debe ser menor que la máxima.'); return; }

    const cfg = { edadMin:min, edadMax:max, permitirRefuerzos: document.getElementById('permitirRefuerzos').checked };

    if (cfg.permitirRefuerzos) {
        const cant = parseInt(document.getElementById('cantidadRefuerzos').value);
        cfg.cantidadRefuerzos = cant;
        cfg.refuerzos = [];
        for (let i = 0; i < cant; i++) {
            const minVal = parseInt(document.getElementById(`refuerzoMin${i}`).value);
            const maxVal = parseInt(document.getElementById(`refuerzoMax${i}`).value);
            if (!minVal || !maxVal) { mostrarModalAdvertencia('Refuerzo Incompleto', `Completa el rango del Refuerzo ${i+1}.`); return; }
            if (minVal > maxVal) { mostrarModalAdvertencia('Rango Inválido', `El mínimo del Refuerzo ${i+1} no puede ser mayor que el máximo.`); return; }
            cfg.refuerzos.push({ min: minVal, max: maxVal });
        }
    }
    configTemporal = cfg;
    mostrarModalConfirmacion();
}

function mostrarModalConfirmacion() {
    document.getElementById('overlayModal').classList.add('activo');
    document.getElementById('modalConfirmacion').classList.add('activo');
}
function ocultarModalConfirmacion() {
    document.getElementById('overlayModal').classList.remove('activo');
    document.getElementById('modalConfirmacion').classList.remove('activo');
}
function confirmarGuardarConfiguracion() {
    localStorage.setItem(storageKeyConfig, JSON.stringify(configTemporal));
    ocultarModalConfirmacion();
    mostrarToast('✓ Configuración guardada');
}

function mostrarModalAdvertencia(titulo, msg) {
    document.getElementById('tituloAdvertencia').textContent  = titulo;
    document.getElementById('mensajeAdvertencia').textContent = msg;
    document.getElementById('overlayModal').classList.add('activo');
    document.getElementById('modalAdvertencia').classList.add('activo');
}
function ocultarModalAdvertencia() {
    document.getElementById('overlayModal').classList.remove('activo');
    document.getElementById('modalAdvertencia').classList.remove('activo');
}

// overlay cierra todo
document.getElementById('overlayModal').addEventListener('click', () => {
    ocultarModalConfirmacion();
    ocultarModalAdvertencia();
    ocultarModalEliminar();
});

// Enter en el form
document.getElementById('nombreEquipo').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') guardarEquipo();
});

// ══════════════════════════════════════
//  QR CREDENCIALES DE CATEGORÍA
//  Al escanear → página pública con las
//  credenciales de todos los equipos
// ══════════════════════════════════════
function generarQRCategoria() {
    var disId = localStorage.getItem('diseno_asignado_' + categoria);
    var tieneDiseno = !!disId;

    document.getElementById('qrCatText').textContent = tieneDiseno
        ? 'Escanea para ver las credenciales con el diseño asignado a "' + categoria + '"'
        : 'Sin diseño asignado aún. El QR mostrará la lista de jugadores.';

    // URL pública que mostrará las credenciales
    var baseURL = 'https://team-soccer-api.onrender.com/publico';
var qrURL   = baseURL + '?categoria=' + encodeURIComponent(categoria);

    // Limpiar QR anterior
    var canvas = document.getElementById('qrCatCanvas');
    canvas.innerHTML = '';

    new QRCode(canvas, {
        text:         qrURL,
        width:        200,
        height:       200,
        colorDark:    '#0a1628',
        colorLight:   '#ffffff',
        correctLevel: QRCode.CorrectLevel.M
    });

    document.getElementById('overlayQRCat').classList.add('activo');
    document.getElementById('modalQRCat').classList.add('activo');
}

function cerrarQRCat() {
    document.getElementById('overlayQRCat').classList.remove('activo');
    document.getElementById('modalQRCat').classList.remove('activo');
}

document.getElementById('overlayQRCat').addEventListener('click', cerrarQRCat);

function imprimirQRCat() {
    var canvas  = document.getElementById('qrCatCanvas');
    var qrEl    = canvas.querySelector('img') || canvas.querySelector('canvas');
    var qrSrc   = qrEl ? (qrEl.src || qrEl.toDataURL()) : '';
    var zona    = document.getElementById('zonaPrintQR');
    zona.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:200mm;gap:8mm;text-align:center;font-family:'Outfit',sans-serif;">
            <div style="font-family:'Bebas Neue',cursive;font-size:12mm;letter-spacing:4mm;color:#1a1a2e;">FUT 7 EL JAGUAR</div>
            <div style="font-size:5mm;color:#444;letter-spacing:2mm;text-transform:uppercase;">${categoria}</div>
            <div style="border:0.5mm solid #ddd;padding:6mm;border-radius:4mm;">
                <img src="${qrSrc}" style="width:60mm;height:60mm;display:block;">
            </div>
            <div style="font-size:4mm;color:#555;max-width:90mm;line-height:1.5;">
                Escanea este código para ver las credenciales del equipo
            </div>
        </div>`;
    zona.style.display = 'block';
    setTimeout(() => { window.print(); setTimeout(() => { zona.style.display = 'none'; }, 1000); }, 200);
}

// ── Init ──
// ── Init ──
async function init() {
    try {
        const res = await fetch(`${API}/categorias`);
        window._categoriasDB = await res.json();
    } catch(e) {
        window._categoriasDB = [];
    }
    cargarConfiguracion();
    await mostrarEquipos();
}
init();