// =============================================
//  JUGADORES · FUT 7 EL JAGUAR  (reescrito)
// =============================================


const urlParams = new URLSearchParams(window.location.search);
const categoria = urlParams.get('categoria');
const equipo    = urlParams.get('equipo');
if (!categoria || !equipo) location.href = '../menu/menu.html';

// ── Storage keys ──
const SK       = `jugadores_${categoria}_${equipo}`;
const SK_GLOB  = `jugadores_activos_${categoria}`;
const SK_CFG   = `config_${categoria}`;

// ── Color de equipo ──
const JERSEY_COLORS = [
    '#1d4ed8','#dc2626','#16a34a','#7c3aed','#ea580c',
    '#0891b2','#be185d','#854d0e','#065f46','#1e3a5f',
    '#6d28d9','#b45309','#0f766e','#9f1239','#1e40af','#166534'
];
function hashColor(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = s.charCodeAt(i) + ((h << 5) - h);
    return JERSEY_COLORS[Math.abs(h) % JERSEY_COLORS.length];
}
function shade(hex, p) {
    const n = parseInt(hex.slice(1), 16);
    const r = Math.min(255, Math.max(0, (n >> 16) + p));
    const g = Math.min(255, Math.max(0, ((n >> 8) & 0xff) + p));
    const b = Math.min(255, Math.max(0, (n & 0xff) + p));
    return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}
function toRgba(hex, a) {
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
}
const teamColor     = hashColor(equipo || '');
const teamColorDark = shade(teamColor, -35);
document.documentElement.style.setProperty('--team-color', teamColor);
document.documentElement.style.setProperty('--team-color-dark', teamColorDark);
document.documentElement.style.setProperty('--team-color-alpha', toRgba(teamColor, 0.18));

// ── Escape HTML ──
function esc(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ══════════════════════════════════════════════
//  STORAGE
// ══════════════════════════════════════════════
function cargarJugadores()  { return JSON.parse(localStorage.getItem(SK)) || []; }
function guardarJugadores(arr) {
    localStorage.setItem(SK, JSON.stringify(arr));
    sincronizarActivos();
    actualizarStats();
}
function cargarCfg() { return JSON.parse(localStorage.getItem(SK_CFG)) || {}; }

function sincronizarActivos() {
    const equipos = JSON.parse(localStorage.getItem(`equipos_${categoria}`)) || [];
    const activos = [];
    equipos.forEach(eq => {
        const jugs = JSON.parse(localStorage.getItem(`jugadores_${categoria}_${eq}`)) || [];
        jugs.forEach(j => { if (!j.baja) activos.push(j.nombre.toLowerCase().trim()); });
    });
    localStorage.setItem(SK_GLOB, JSON.stringify(activos));
}

// ── Diseño de credencial ──
// ── Diseño de credencial ──
async function getDiseno() {
    try {
        const r = await fetch('https://team-soccer-api.onrender.com/disenos/' + encodeURIComponent(categoria));
        const lista = await r.json();
        return lista.find(d => d.activo == 1 || d.activo === true) || null;
    } catch(e) { return null; }
}
function getFuente(id) {
    const m = {
        bebas:"'Bebas Neue',cursive", anton:"'Anton',sans-serif",
        oswald:"'Oswald',sans-serif", teko:"'Teko',sans-serif",
        barlow:"'Barlow Condensed',sans-serif", outfit:"'Outfit',sans-serif",
        inter:"'Inter',sans-serif", poppins:"'Poppins',sans-serif",
        montserrat:"'Montserrat',sans-serif", roboto:"'Roboto Condensed',sans-serif",
        orbitron:"'Orbitron',sans-serif", russo:"'Russo One',sans-serif",
        cinzel:"'Cinzel',serif", playfair:"'Playfair Display',serif"
    };
    return m[id] || "'Outfit',sans-serif";
}

// ══════════════════════════════════════════════
//  HELPERS EDAD / REFUERZOS
// ══════════════════════════════════════════════
function calcEdad(fecha) {
    if (!fecha) return 0;
    const hoy = new Date(), nac = new Date(fecha);
    let e = hoy.getFullYear() - nac.getFullYear();
    if (hoy.getMonth() - nac.getMonth() < 0 ||
       (hoy.getMonth() === nac.getMonth() && hoy.getDate() < nac.getDate())) e--;
    return e;
}
function esRefuerzo(edad) {
    const cfg = cargarCfg();
    if (!cfg.permitirRefuerzos || !cfg.refuerzos) return false;
    return cfg.refuerzos.some(r => edad >= r.min && edad <= r.max);
}
function enRangoNormal(edad) {
    const cfg = cargarCfg();
    if (cfg.edadMin && cfg.edadMax) return edad >= cfg.edadMin && edad <= cfg.edadMax;
    return true;
}
function contarRefuerzosActivos() {
    return cargarJugadores().filter(j => !j.baja && esRefuerzo(j.edad || calcEdad(j.fechaNacimiento))).length;
}
function getLimiteRefuerzos() { return cargarCfg().cantidadRefuerzos || 0; }

function validarEdad(fechaNac, indexExcluir = -1) {
    const cfg  = cargarCfg();
    const edad = calcEdad(fechaNac);
    if (!cfg.edadMin && !cfg.edadMax) return { ok: true, edad };

    const dentroRango = edad >= cfg.edadMin && edad <= cfg.edadMax;
    const esRef = cfg.permitirRefuerzos && cfg.refuerzos &&
                  cfg.refuerzos.some(r => edad >= r.min && edad <= r.max);

    if (dentroRango) return { ok: true, edad };
    if (!esRef) {
        let msg = `Edad (${edad} años) fuera del rango ${cfg.edadMin}-${cfg.edadMax}`;
        if (cfg.permitirRefuerzos && cfg.refuerzos?.length)
            msg += `. Refuerzos: ${cfg.refuerzos.map((r,i)=>`R${i+1}:${r.min}-${r.max}`).join(', ')}`;
        return { ok: false, msg };
    }
    // Validar slot de refuerzo
    const slots = [...cfg.refuerzos].sort((a,b) => (a.max-a.min)-(b.max-b.min));
    const ocupados = slots.map(() => false);
    cargarJugadores().filter((j,i) => !j.baja && i !== indexExcluir).forEach(j => {
        const e = j.edad || calcEdad(j.fechaNacimiento);
        for (let i = 0; i < slots.length; i++) {
            if (!ocupados[i] && e >= slots[i].min && e <= slots[i].max) { ocupados[i] = true; break; }
        }
    });
    const libre = slots.some((s,i) => !ocupados[i] && edad >= s.min && edad <= s.max);
    if (!libre) return { ok: false, msg: `Sin slots de refuerzo disponibles para ${edad} años` };
    return { ok: true, edad };
}

// ══════════════════════════════════════════════
//  HEADER, BANNER, STATS
// ══════════════════════════════════════════════
function jerseySmallSVG(c) {
    const d = shade(c, -30);
    return `<svg viewBox="0 0 48 54" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="hjg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${c}"/><stop offset="100%" stop-color="${d}"/>
        </linearGradient></defs>
        <path d="M9 7 L3 17 L12 20 L12 42 L36 42 L36 20 L45 17 L39 7 L31 11 Q24 14 17 11 Z"
              fill="url(#hjg)" stroke="rgba(255,255,255,0.22)" stroke-width="1"/>
        <path d="M17 11 Q20 15 24 15 Q28 15 31 11" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1"/>
    </svg>`;
}
function jerseyBannerSVG(c) {
    const d = shade(c, -30);
    return `<svg viewBox="0 0 80 90" xmlns="http://www.w3.org/2000/svg">
        <defs><linearGradient id="bjg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${c}"/><stop offset="100%" stop-color="${d}"/>
        </linearGradient></defs>
        <ellipse cx="40" cy="86" rx="22" ry="3" fill="rgba(0,0,0,0.25)"/>
        <path d="M15 12 L5 28 L20 32 L20 70 L60 70 L60 32 L75 28 L65 12 L52 18 Q40 22 28 18 Z"
              fill="url(#bjg)" stroke="rgba(255,255,255,0.2)" stroke-width="1.5"/>
        <path d="M28 18 Q34 24 40 24 Q46 24 52 18" fill="none" stroke="rgba(255,255,255,0.3)" stroke-width="1.5"/>
    </svg>`;
}

document.getElementById('teamEmblem').innerHTML    = jerseySmallSVG(teamColor);
document.getElementById('bannerJersey').innerHTML  = jerseyBannerSVG(teamColor);
document.getElementById('tituloEquipo').textContent = equipo;
document.getElementById('headerCat').textContent    = categoria;
document.getElementById('bannerNombre').textContent = equipo;
document.getElementById('bannerCat').textContent    = `${categoria} · Temporada 2025`;
document.getElementById('btnVolver').onclick = () =>
    location.href = `equipos.html?categoria=${encodeURIComponent(categoria)}`;

function irADiseno() {
    location.href = `galeria-disenos.html?categoria=${encodeURIComponent(categoria)}&equipo=${encodeURIComponent(equipo)}`;
}

function actualizarStats() {
    const jugs = cargarJugadores();
    document.getElementById('statActivos').textContent   = jugs.filter(j => !j.baja).length;
    document.getElementById('statBaja').textContent      = jugs.filter(j =>  j.baja).length;
    document.getElementById('statRefuerzos').textContent = jugs.filter(j => !j.baja && esRefuerzo(j.edad || calcEdad(j.fechaNacimiento))).length;
    document.getElementById('bannerTotal').textContent   = jugs.length;
}

// ══════════════════════════════════════════════
//  RENDER DE CREDENCIAL (canvas interno escalado)
// ══════════════════════════════════════════════

// CW/CH = dimensiones del canvas de diseño original
const CRED_W = 692, CRED_H = 425;

async function renderCredencial(j, ancho) {
    const diseno = await getDiseno();
    const fotoSrc = j.foto || '';
    const primersDosNombres = (j.nombre || '').split(' ').slice(0, 2).join(' ');
const datos = {
    foto: fotoSrc, nombre: primersDosNombres,
        equipo: equipo, numero: '#' + j.numero, categoria: categoria
    };
    console.log('datos rect:', datos.nombre, datos.equipo, datos.numero);

    // Sin diseño → tarjeta genérica
    if (!diseno || !diseno.elementos?.length) {
        const c1 = teamColor, c2 = teamColorDark;
        return `<div style="width:${ancho}px;background:linear-gradient(135deg,${c1},${c2});border-radius:12px;overflow:hidden;font-family:'Outfit',sans-serif;padding:18px;box-sizing:border-box;">
            <div style="display:flex;gap:12px;align-items:center;">
                ${fotoSrc ? `<img src="${fotoSrc}" style="width:64px;height:64px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,0.4);" onerror="this.style.display='none'">` : `<div style="width:64px;height:64px;border-radius:50%;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;font-size:28px;">👤</div>`}
                <div>
                    <div style="font-family:'Bebas Neue',cursive;font-size:20px;color:#fff;letter-spacing:2px;">${esc(j.nombre)}</div>
                    <div style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:3px;">#${j.numero} · ${esc(equipo)}</div>
                    <div style="font-size:11px;color:rgba(255,255,255,0.5);">${esc(categoria)}</div>
                </div>
            </div>
        </div>`;
    }

    // Con diseño → canvas escalado
    const scale  = ancho / CRED_W;
    const altura = Math.round(CRED_H * scale);
    const c1  = diseno.bgColor1 || diseno.colorFondo  || teamColor;
    const c2  = diseno.bgColor2 || diseno.colorFondo2 || teamColorDark;
    const dir = diseno.bgDireccion || '135deg';
    const bgImg = diseno.bgImagen || diseno.imagen || null;
    const bgOp  = ((diseno.bgOpacidad !== undefined ? diseno.bgOpacidad : 80)) / 100;

    let elsHtml = '';
    diseno.elementos.forEach(el => {
        if (!el.visible) return;
        const op  = (el.opacity != null ? el.opacity : 100) / 100;
        const bw  = el.borderWidth || 0;
        const bcol = el.borderColor || 'transparent';
        const bst = el.borderStyle || 'solid';
        const pos = `position:absolute;left:${el.x}px;top:${el.y}px;width:${el.w}px;height:${el.h}px;opacity:${op};`;
        const brd = bw > 0 ? `border:${bw}px ${bst} ${bcol};` : '';
        const br  = `border-radius:${el.radio || 0}px;`;

        const bsh = [];
        if ((el.borderBlur||0) > 0 && bw > 0) bsh.push(`0 0 ${el.borderBlur}px ${bcol}`);
        if (el.sombra) bsh.push(`${el.sombraX||0}px ${el.sombraY||4}px ${el.sombraBlur||8}px ${el.sombraColor||'rgba(0,0,0,0.5)'}`);
        const shadow = bsh.length ? `box-shadow:${bsh.join(',')};` : '';

        if (el.tipo === 'texto') {
            const ff  = getFuente(el.fuente);
            const fs  = el.fontSize || 16;
            const fw  = el.bold ? '700' : '400';
            const col = el.color || '#fff';
            const fa  = el.align || 'left';
            const ls  = el.letterSpacing || 0;
            const bgc = el.bgColor && el.bgColor !== 'transparent' ? `background:${el.bgColor};padding:2px 6px;` : '';
            const ts  = [];
            const sw  = el.strokeWidth || 0;
            if (sw > 0) {
                const sc = el.strokeColor || '#000';
                ts.push(`-${sw}px -${sw}px 0 ${sc}`,`${sw}px -${sw}px 0 ${sc}`,`-${sw}px ${sw}px 0 ${sc}`,`${sw}px ${sw}px 0 ${sc}`);
            }
            if (el.sombra) ts.push(`${el.sombraX||0}px ${el.sombraY||2}px ${el.sombraBlur||8}px ${el.sombraColor||'rgba(0,0,0,0.8)'}`);
            const tsStr = ts.length ? `text-shadow:${ts.join(',')};` : '';
            let contenido = el.texto || '';
            if (el.campo && el.campo !== 'foto' && datos[el.campo] !== undefined) contenido = datos[el.campo];
            elsHtml += `<div style="${pos}${bgc}${br}${brd}overflow:hidden;font-family:${ff};font-size:${fs}px;font-weight:${fw};color:${col};text-align:${fa};letter-spacing:${ls}px;white-space:nowrap;line-height:1.15;display:flex;align-items:center;${tsStr}">${esc(contenido)}</div>`;
        }

        if (el.tipo === 'rect') {
    console.log('RECT campo:', el.campo, '| valor:', datos[el.campo]);
    const bgc = el.bgColor || 'rgba(255,255,255,0.12)';
    const bsh2 = [];
    if ((el.borderBlur||0) > 0 && bw > 0) bsh2.push(`0 0 ${el.borderBlur}px ${bcol}`,`inset 0 0 ${Math.round(el.borderBlur/2)}px ${bcol}`);
    if (el.sombra) bsh2.push(`${el.sombraX||0}px ${el.sombraY||4}px ${el.sombraBlur||8}px ${el.sombraColor||'rgba(0,0,0,0.5)'}`);
    const sh2 = bsh2.length ? `box-shadow:${bsh2.join(',')};` : '';
    let inner = '';
    if (el.campo && el.campo !== 'foto' && datos[el.campo] !== undefined) {
        const rectFs = el.fontSize || Math.round(el.h * 0.45);
inner = `<div style="padding:0 10px;font-family:${getFuente(el.fuente)};font-size:${el.fontSize || 28}px;font-weight:${el.bold ? '900' : '700'};color:${el.color || '#000000'};width:100%;z-index:999;text-align:${el.align || 'left'};">${esc(datos[el.campo] || '')}</div>`;
    }
    elsHtml += `<div style="${pos}background:${bgc};${br}${brd}${sh2}display:flex;align-items:center;">${inner}</div>`;
}


        if (el.tipo === 'linea') {
            const lc = el.color || 'rgba(255,255,255,0.7)';
            const lg = el.grosor || 2;
            elsHtml += `<div style="${pos}"><div style="width:100%;height:${lg}px;margin-top:${(el.h-lg)/2}px;background:${lc};border-radius:2px;"></div></div>`;
        }

        if (el.tipo === 'foto') {
            const src = (el.campo === 'foto') ? fotoSrc : (el.src || fotoSrc);
            const bgcF = el.bgColor && el.bgColor !== 'transparent' ? `background:${el.bgColor};` : 'background:rgba(255,255,255,0.1);';
            const fmask = (el.borderBlur||0) > 0
                ? `-webkit-mask-image:radial-gradient(ellipse at center,black ${Math.max(0,50-el.borderBlur)}%,transparent ${Math.min(100,50+el.borderBlur)}%);mask-image:radial-gradient(ellipse at center,black ${Math.max(0,50-el.borderBlur)}%,transparent ${Math.min(100,50+el.borderBlur)}%);`
                : '';
            elsHtml += `<div style="${pos}${br}${bgcF}${brd}${shadow}overflow:hidden;">
                <div style="position:absolute;inset:0;border-radius:inherit;overflow:hidden;${fmask}">
                    ${src ? `<img src="${src}" style="width:100%;height:100%;object-fit:cover;display:block;" onerror="this.style.display='none'">` : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;font-size:${Math.round(el.h*0.4)}px;opacity:0.4;">👤</div>`}
                </div>
                ${bw > 0 ? `<div style="position:absolute;inset:0;${br}border:${bw}px ${bst} ${bcol};pointer-events:none;"></div>` : ''}
            </div>`;
        }

        if (el.tipo === 'imagen' && el.src) {
            const cx = el.cropX||0, cy = el.cropY||0, iw = el.imgW||el.w, ih = el.imgH||el.h;
            const fmask2 = (el.feather||0) > 0
                ? `-webkit-mask-image:radial-gradient(ellipse at center,black ${Math.max(0,50-el.feather)}%,transparent ${Math.min(100,50+el.feather)}%);mask-image:radial-gradient(ellipse at center,black ${Math.max(0,50-el.feather)}%,transparent ${Math.min(100,50+el.feather)}%);`
                : '';
            elsHtml += `<div style="${pos}${br}${brd}${shadow}overflow:hidden;">
                <div style="position:absolute;inset:0;overflow:hidden;${fmask2}">
                    <img src="${el.src}" style="position:absolute;left:${-cx}px;top:${-cy}px;width:${iw}px;height:${ih}px;display:block;">
                </div></div>`;
        }
    });

    return `<div class="cred-outer" style="width:${ancho}px;height:${altura}px;overflow:hidden;position:relative;">
        <div class="cred-inner" style="position:absolute;top:0;left:0;width:${CRED_W}px;height:${CRED_H}px;background:linear-gradient(${dir},${c1},${c2});transform:scale(${scale});transform-origin:top left;overflow:hidden;">
            ${bgImg ? `<div style="position:absolute;inset:0;background-image:url(${bgImg});background-size:cover;background-position:center;opacity:${bgOp};"></div>` : ''}
            ${elsHtml}
        </div>
    </div>`;
}

// ══════════════════════════════════════════════
//  MODAL NUEVO / EDITAR JUGADOR
// ══════════════════════════════════════════════
let fotoTemp = null;   // base64 de la foto en el modal
let editIndex = -1;    // -1 = nuevo, >=0 = editar

function abrirModalNuevo() {
    editIndex = -1;
    fotoTemp  = null;
    document.getElementById('modalJugadorTitulo').textContent = 'Nuevo Jugador';
    document.getElementById('mNombre').value = '';
    document.getElementById('mNumero').value = '';
    document.getElementById('mFecha').value  = '';
    document.getElementById('mErrNombre').textContent = '';
    document.getElementById('mErrNumero').textContent = '';
    document.getElementById('mErrFecha').textContent  = '';
    actualizarPreviewModal(null);
    document.getElementById('modalJugador').classList.add('activo');
    document.getElementById('overlayModal').classList.add('activo');
    document.getElementById('mNombre').focus();
}

function abrirModalEditar(index) {
    const j   = cargarJugadores()[index];
    editIndex = index;
    fotoTemp  = j.foto || null;
    document.getElementById('modalJugadorTitulo').textContent = 'Editar Jugador';
    document.getElementById('mNombre').value = j.nombre;
    document.getElementById('mNumero').value = j.numero;
    document.getElementById('mFecha').value  = j.fechaNacimiento;
    document.getElementById('mErrNombre').textContent = '';
    document.getElementById('mErrNumero').textContent = '';
    document.getElementById('mErrFecha').textContent  = '';
    actualizarPreviewModal(j);
    document.getElementById('modalJugador').classList.add('activo');
    document.getElementById('overlayModal').classList.add('activo');
}

function cerrarModal() {
    document.getElementById('modalJugador').classList.remove('activo');
    document.getElementById('overlayModal').classList.remove('activo');
    fotoTemp  = null;
    editIndex = -1;
}

async function actualizarPreviewModal(j) {
    const nombre = document.getElementById('mNombre').value || (j?.nombre) || 'Nombre';
    const numero = document.getElementById('mNumero').value || (j?.numero) || '0';
    const foto   = fotoTemp || j?.foto || '';
    const wrap   = document.getElementById('modalCredPreview');
    const w      = wrap.offsetWidth || 320;

    const jugadorTemp = { nombre, numero, foto, fechaNacimiento: document.getElementById('mFecha')?.value || '' };
    wrap.innerHTML = await renderCredencial(jugadorTemp, w);
}

// Actualizar preview en tiempo real al escribir
['mNombre','mNumero','mFecha'].forEach(id => {
    document.getElementById(id)?.addEventListener('input', () => actualizarPreviewModal(null));
});

function subirFotoModal() {
    const input = document.createElement('input');
    input.type  = 'file'; input.accept = 'image/*';
    input.onchange = e => {
        const f = e.target.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = ev => {
            fotoTemp = ev.target.result;
            actualizarPreviewModal(null);
            toast('✓ Foto cargada');
        };
        r.readAsDataURL(f);
    };
    input.click();
}

function guardarDesdeModal() {
    const nombre = document.getElementById('mNombre').value.trim();
    const numero = document.getElementById('mNumero').value.trim();
    const fecha  = document.getElementById('mFecha').value;
    let ok = true;

    document.getElementById('mErrNombre').textContent = '';
    document.getElementById('mErrNumero').textContent = '';
    document.getElementById('mErrFecha').textContent  = '';

    if (!nombre) { document.getElementById('mErrNombre').textContent = 'El nombre es obligatorio'; ok = false; }
    // dorsal es opcional, no valida
    
    if (!ok) return;

    const val = fecha ? validarEdad(fecha, editIndex) : { ok: true, edad: null };
if (!val.ok) { document.getElementById('mErrFecha').textContent = val.msg; return; }

    // Verificar duplicado en otros equipos (solo al fichar nuevo)
    if (editIndex === -1) {
        const activos = JSON.parse(localStorage.getItem(SK_GLOB)) || [];
        if (activos.includes(nombre.toLowerCase())) {
            document.getElementById('mErrNombre').textContent = 'Este jugador ya está activo en otro equipo';
            return;
        }
    }

    const jugs = cargarJugadores();
    const jugador = {
        nombre, numero, fechaNacimiento: fecha,
        edad: val.edad, foto: fotoTemp || null,
        baja: false, pagado: false
    };

    if (editIndex === -1) {
        jugs.push(jugador);
        toast(`✓ ${nombre} registrado`);
    } else {
        jugs[editIndex] = { ...jugs[editIndex], ...jugador, baja: jugs[editIndex].baja, pagado: jugs[editIndex].pagado };
        toast(`✓ ${nombre} actualizado`);
    }

    guardarJugadores(jugs);
    guardarJugadorBD(jugador, editIndex);
    cerrarModal();
    renderLista();
}

// ══════════════════════════════════════════════
//  RENDER LISTA PRINCIPAL
// ══════════════════════════════════════════════
async function renderLista() {
    const lista  = document.getElementById('listaJugadores');
    const jugadores = cargarJugadores();
    lista.innerHTML = '';
    actualizarStats();

    document.getElementById('estadoVacio').style.display = jugadores.length ? 'none' : 'flex';
    if (!jugadores.length) return;

    // Ancho de tarjeta: toma el grid y calcula columnas
const gridW = lista.getBoundingClientRect().width || lista.parentElement?.getBoundingClientRect().width || 600;    const minCol = 260;
    const cols   = Math.max(1, Math.floor(gridW / minCol));
    const gap    = 20;
    const cardW  = Math.floor((gridW - gap * (cols - 1)) / cols);
console.log('gridW:', gridW, 'cols:', cols, 'cardW:', cardW);

    for (const [index, j] of jugadores.entries()) {
        const edad    = j.edad || calcEdad(j.fechaNacimiento);
        const esRef   = esRefuerzo(edad);
        const enRango = enRangoNormal(edad);
        const card    = document.createElement('div');
        card.className = 'jcard' + (j.baja ? ' baja' : '') + (esRef && !j.baja ? ' refuerzo' : '');
        card.style.animationDelay = `${index * 0.06}s`;

        // Credencial
        const credHTML = await renderCredencial(j, cardW);

        // Fecha formateada
        const fechaFmt = j.fechaNacimiento
            ? new Date(j.fechaNacimiento + 'T12:00:00').toLocaleDateString('es-MX', {day:'2-digit',month:'short',year:'numeric'})
            : '—';

        card.innerHTML = `
            <div class="jcard-cred-wrap" data-index="${index}">
                ${credHTML}
                <button class="jcard-foto-btn" title="Cambiar foto">📷</button>
            </div>
            <div class="jcard-info">
                <div class="jcard-info-row">
                    <span class="jcard-fecha">📅 ${fechaFmt}</span>
                    <span class="jcard-edad ${!enRango && !esRef ? 'fuera' : esRef ? 'ref' : ''}">${edad} años</span>
                </div>
            </div>
            <div class="jcard-controls">
                <div class="ctrl-row">
                    <span class="ctrl-lbl">ESTADO</span>
                    <label class="switch"><input type="checkbox" ${!j.baja ? 'checked' : ''}><span class="slider"></span></label>
                </div>
                <div class="ctrl-row">
    <span class="ctrl-lbl">PAGO</span>
    <div style="display:flex;align-items:center;gap:6px;">
        <label class="switch"><input type="checkbox" ${j.pagado ? 'checked' : ''}><span class="slider"></span></label>
    </div>
</div>
<div class="ctrl-row" style="gap:4px;">
    <input type="number" placeholder="Pagado $" value="${j.pagadoMonto||''}" 
        style="width:80px;padding:2px 6px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#fff;font-size:0.68rem;font-family:'Outfit',sans-serif;"
        onchange="guardarMonto(${index}, 'pagadoMonto', this.value)">
    <input type="number" placeholder="Pendiente $" value="${j.pagadoPendiente||''}"
        style="width:80px;padding:2px 6px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.1);border-radius:6px;color:#fff;font-size:0.68rem;font-family:'Outfit',sans-serif;"
        onchange="guardarMonto(${index}, 'pagadoPendiente', this.value)">
</div>
            </div>
            <div class="jcard-actions">
                <button class="jcard-btn-edit">✏️ Editar</button>
                <button class="jcard-btn-del">🗑️</button>
            </div>`;

        // Eventos
        card.querySelector('.jcard-foto-btn').onclick = () => subirFotoCard(index);
        card.querySelectorAll('.switch input')[0].onchange = () => toggleBaja(index);
        card.querySelectorAll('.switch input')[1].onchange = () => togglePago(index);
        card.querySelector('.jcard-btn-edit').onclick = () => abrirModalEditar(index);
        card.querySelector('.jcard-btn-del').onclick  = () => pedirEliminar(index, j.nombre, j.numero);

        lista.appendChild(card);
    };
}

// ══════════════════════════════════════════════
//  FOTO DESDE TARJETA
// ══════════════════════════════════════════════
function subirFotoCard(index) {
    const input = document.createElement('input');
    input.type  = 'file'; input.accept = 'image/*';
    input.onchange = e => {
        const f = e.target.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = ev => {
            const jugs = cargarJugadores();
            jugs[index].foto = ev.target.result;
            guardarJugadores(jugs);
            renderLista();
            toast('✓ Foto actualizada');
        };
        r.readAsDataURL(f);
    };
    input.click();
}

// ══════════════════════════════════════════════
//  TOGGLE BAJA / PAGO
// ══════════════════════════════════════════════
function toggleBaja(index) {
    const jugs = cargarJugadores();
    const j    = jugs[index];
    const edad = j.edad || calcEdad(j.fechaNacimiento);
    if (j.baja && esRefuerzo(edad)) {
        if (contarRefuerzosActivos() >= getLimiteRefuerzos()) {
            mostrarModalInfo('Límite de Refuerzos', `Ya alcanzaste el límite de refuerzos (${getLimiteRefuerzos()}).`);
            renderLista(); return;
        }
    }
    jugs[index].baja = !jugs[index].baja;
    guardarJugadores(jugs);
    renderLista();
}
function togglePago(index) {
    const jugs = cargarJugadores();
    jugs[index].pagado = !jugs[index].pagado;
    guardarJugadores(jugs);
}

function guardarMonto(index, campo, valor) {
    const jugs = cargarJugadores();
    jugs[index][campo] = valor ? parseFloat(valor) : null;
    guardarJugadores(jugs);
}

// ══════════════════════════════════════════════
//  MODALES ELIMINAR / INFO
// ══════════════════════════════════════════════
let pendingDelete = -1;
function pedirEliminar(index, nombre, numero) {
    pendingDelete = index;
    document.getElementById('nombreEliminar').textContent = `${nombre} #${numero}`;
    document.getElementById('modalEliminar').classList.add('activo');
    document.getElementById('overlayModal').classList.add('activo');
}
function ocultarModalEliminar() {
    pendingDelete = -1;
    document.getElementById('modalEliminar').classList.remove('activo');
    document.getElementById('overlayModal').classList.remove('activo');
}
function confirmarEliminar() {
    if (pendingDelete < 0) return;
    const jugs = cargarJugadores();
    const nom  = jugs[pendingDelete].nombre;
    eliminarJugadorBD(pendingDelete); 
    jugs.splice(pendingDelete, 1);
    guardarJugadores(jugs);
    toast(`✓ ${nom} eliminado`);
    ocultarModalEliminar();
    renderLista();
}

function mostrarModalInfo(titulo, texto) {
    document.getElementById('tituloModalRefuerzo').textContent = titulo;
    document.getElementById('textoModalRefuerzo').textContent  = texto;
    document.getElementById('modalRefuerzo').classList.add('activo');
    document.getElementById('overlayModal').classList.add('activo');
}
function ocultarModalRefuerzo() {
    document.getElementById('modalRefuerzo').classList.remove('activo');
    document.getElementById('overlayModal').classList.remove('activo');
}

document.getElementById('overlayModal').addEventListener('click', () => {
    // No cerrar el modalJugador con click en overlay para evitar pérdida accidental
    ocultarModalEliminar();
    ocultarModalRefuerzo();
});

// ══════════════════════════════════════════════
//  IMPRESIÓN
// ══════════════════════════════════════════════
let selPrint = new Set();

function abrirPanelImpresion() {
    selPrint.clear();
    const jugadores = cargarJugadores().filter(j => !j.baja);
    const lista = document.getElementById('listaPrint');
    lista.innerHTML = '';

    if (!jugadores.length) {
        lista.innerHTML = '<p style="text-align:center;color:rgba(255,255,255,0.3);padding:2rem;">Sin jugadores activos</p>';
    } else {
        jugadores.forEach((j, i) => {
            const row = document.createElement('label');
            row.className = 'print-row';
            row.innerHTML = `
                <input type="checkbox" class="print-check" data-i="${i}">
                <div class="print-row-info">
                    <div class="print-row-name">${esc(j.nombre)}</div>
                    <div class="print-row-sub">#${j.numero} · ${j.fechaNacimiento}</div>
                </div>`;
            const cb = row.querySelector('input');
            cb.onchange = function() {
                this.checked ? selPrint.add(i) : selPrint.delete(i);
                row.classList.toggle('selected', this.checked);
                actualizarUIPrint(jugadores.length);
            };
            lista.appendChild(row);
        });
    }

    document.getElementById('printSubtitle').textContent = `${equipo} · ${categoria}`;
    actualizarUIPrint(jugadores.length);
    document.getElementById('panelImpresion').style.display = '';
}

function cerrarPanelImpresion() { document.getElementById('panelImpresion').style.display = 'none'; }

function actualizarUIPrint(total) {
    const n = selPrint.size;
    document.getElementById('countPrint').textContent = `${n} sel.`;
    const btn = document.getElementById('btnVerCred');
    btn.disabled      = n === 0;
    btn.style.opacity = n === 0 ? '0.4' : '1';
    document.getElementById('btnSelectAllPrint').textContent =
        n === total && total > 0 ? '☑ Deseleccionar todos' : '☐ Seleccionar todos';
}

function selectAllPrint() {
    const jugadores = cargarJugadores().filter(j => !j.baja);
    const todos = selPrint.size === jugadores.length;
    selPrint.clear();
    document.querySelectorAll('#listaPrint input[type="checkbox"]').forEach((cb, i) => {
        cb.checked = !todos;
        if (!todos) selPrint.add(i);
        cb.closest('label').classList.toggle('selected', !todos);
    });
    actualizarUIPrint(jugadores.length);
}

async function verCredenciales() {
    const jugadores  = cargarJugadores().filter(j => !j.baja);
    const seleccion  = [...selPrint].sort((a,b)=>a-b).map(i => jugadores[i]).filter(Boolean);
    if (!seleccion.length) return;
    const grid = document.getElementById('gridCredenciales');
    grid.innerHTML = '';
    document.getElementById('credSubtitle').textContent =
        `${seleccion.length} credencial${seleccion.length > 1 ? 'es' : ''} · ${equipo} · ${categoria}`;

    for (const j of seleccion) {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:6px;';
    wrap.innerHTML = await renderCredencial(j, 340);
    const lbl = document.createElement('div');
    lbl.style.cssText = 'font-size:0.72rem;color:rgba(255,255,255,0.4);text-align:center;';
    lbl.textContent = `${j.nombre} · #${j.numero}`;
    wrap.appendChild(lbl);
    grid.appendChild(wrap);
}

    document.getElementById('panelImpresion').style.display = 'none';
    document.getElementById('modalCredenciales').style.display = '';
}

function cerrarModalCredenciales() {
    document.getElementById('modalCredenciales').style.display = 'none';
    document.getElementById('panelImpresion').style.display    = '';
}

async function imprimirAhora() {
    const jugadores = cargarJugadores().filter(j => !j.baja);
    const seleccion = [...selPrint].sort((a,b)=>a-b).map(i => jugadores[i]).filter(Boolean);
    if (!seleccion.length) return;
    const zona = document.getElementById('zonaPrint');
    const pags = [];
    for (let i = 0; i < seleccion.length; i += 4) pags.push(seleccion.slice(i, i+4));
    let html = '';
    for (const [pi, pg] of pags.entries()) {
    if (pi > 0) html += '<div style="page-break-before:always"></div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8mm;">';
    for (const j of pg) { html += `<div style="break-inside:avoid;">${await renderCredencial(j, 340)}</div>`; }
    for (let r = pg.length; r < 4; r++) html += '<div></div>';
    html += '</div>';}
    zona.innerHTML = html; zona.style.display = 'block';
    setTimeout(() => { window.print(); setTimeout(() => { zona.style.display = 'none'; }, 1000); }, 300);
}

// ══════════════════════════════════════════════
//  QR
// ══════════════════════════════════════════════
function generarQREquipo() {
    const base = 'https://team-soccer-api.onrender.com/publico';
    const url  = `${base}?categoria=${encodeURIComponent(categoria)}&equipo=${encodeURIComponent(equipo)}`;
    document.getElementById('qrEquipoText').textContent = `Escanea para ver las credenciales de ${equipo} · ${categoria}`;
    const canvas = document.getElementById('qrEquipoCanvas');
    canvas.innerHTML = '';
    new QRCode(canvas, { text: url, width: 200, height: 200, colorDark: '#0a1628', colorLight: '#ffffff', correctLevel: QRCode.CorrectLevel.M });
    document.getElementById('overlayQREquipo').classList.add('activo');
    document.getElementById('modalQREquipo').classList.add('activo');
}
function cerrarQREquipo() {
    document.getElementById('overlayQREquipo').classList.remove('activo');
    document.getElementById('modalQREquipo').classList.remove('activo');
}
function imprimirQREquipo() {
    const canvas = document.getElementById('qrEquipoCanvas');
    const qrEl   = canvas.querySelector('img') || canvas.querySelector('canvas');
    const qrSrc  = qrEl ? (qrEl.src || qrEl.toDataURL()) : '';
    const zona   = document.getElementById('zonaPrintQREquipo');
    zona.innerHTML = `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:200mm;gap:8mm;text-align:center;font-family:'Outfit',sans-serif;">
        <div style="font-family:'Bebas Neue',cursive;font-size:12mm;letter-spacing:4mm;">${equipo}</div>
        <div style="font-size:4mm;color:#777;">${categoria}</div>
        <div style="border:0.5mm solid #ddd;padding:6mm;border-radius:4mm;"><img src="${qrSrc}" style="width:60mm;height:60mm;display:block;"></div>
        <div style="font-size:4mm;color:#555;">Escanea para ver las credenciales del equipo</div>
    </div>`;
    zona.style.display = 'block';
    setTimeout(() => { window.print(); setTimeout(() => { zona.style.display = 'none'; }, 1000); }, 200);
}
document.getElementById('overlayQREquipo').addEventListener('click', cerrarQREquipo);

// ══════════════════════════════════════════════
//  TOAST
// ══════════════════════════════════════════════
function toast(msg, tipo = 'ok') {
    let t = document.getElementById('toast-jug');
    if (!t) { t = document.createElement('div'); t.id = 'toast-jug'; document.body.appendChild(t); }
    t.style.background = tipo === 'ok'
        ? 'linear-gradient(135deg,#22c55e,#16a34a)'
        : 'linear-gradient(135deg,#ef4444,#dc2626)';
    t.style.cssText += ';position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);padding:.75rem 1.8rem;border-radius:12px;color:#fff;font-family:Outfit,sans-serif;font-size:.85rem;font-weight:600;z-index:9999;box-shadow:0 8px 30px rgba(0,0,0,.4);';
    t.textContent = msg; t.style.opacity = '1';
    clearTimeout(t._t);
    t._t = setTimeout(() => { t.style.opacity = '0'; }, 3000);
}

// ══════════════════════════════════════════════
//  PARTÍCULAS
// ══════════════════════════════════════════════
(function() {
    const c = document.getElementById('particles');
    if (!c) return;
    const cols = [teamColor, shade(teamColor, 40), '#fff', '#c8a84b'];
    for (let i = 0; i < 18; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        const s = Math.random() * 4 + 1.5;
        p.style.cssText = `width:${s}px;height:${s}px;left:${Math.random()*100}%;background:${cols[Math.floor(Math.random()*cols.length)]};animation-duration:${Math.random()*16+10}s;animation-delay:${Math.random()*14}s;`;
        c.appendChild(p);
    }
})();

// ── Init ──
const API = 'https://team-soccer-api.onrender.com';
let _jugadoresDB = [];
let _equipoDB = null;

async function cargarYRenderizar() {
    try {
        const catRes = await fetch(`${API}/categorias`);
        window._categoriasDB = await catRes.json();
        const cat = window._categoriasDB.find(c => c.nombre === categoria);
        if (!cat) { renderLista(); return; }

        const eqRes = await fetch(`${API}/equipos/${cat.id}`);
        const equipos = await eqRes.json();
        _equipoDB = equipos.find(e => e.nombre === equipo);
        if (!_equipoDB) { renderLista(); return; }

        const jugRes = await fetch(`${API}/jugadores/${_equipoDB.id}`);
        const jugsBD = await jugRes.json();

        // Guardar en localStorage con el formato exacto que ya usa el código
        const jugsFormateados = jugsBD.map(j => ({
            nombre: j.nombre,
            numero: j.numero_playera || '',
            fechaNacimiento: j.fecha_nacimiento || '',
            edad: j.fecha_nacimiento ? calcEdad(j.fecha_nacimiento) : null,
            foto: j.foto_url || null,
            baja: j.baja || false,
            pagado: j.pagado || false,
            _id: j.id
        }));
        localStorage.setItem(SK, JSON.stringify(jugsFormateados));
    } catch(e) {
        console.log('Usando localStorage como respaldo');
    }
    sincronizarActivos();
    renderLista();
}

async function guardarJugadorBD(jugador, index) {
    if (!_equipoDB) return;
    try {
        if (index === -1) {
            const res = await fetch(`${API}/jugadores`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    equipo_id: _equipoDB.id,
                    categoria_id: _equipoDB.categoria_id,
                    nombre: jugador.nombre,
                    numero_playera: jugador.numero,
                    fecha_nacimiento: jugador.fechaNacimiento || null,
                    foto_url: jugador.foto || null,
                    baja: false
                })
            });
            const nuevo = await res.json();
            // Actualizar el _id en localStorage
            const jugs = cargarJugadores();
            jugs[jugs.length - 1]._id = nuevo.id;
            localStorage.setItem(SK, JSON.stringify(jugs));
        } else {
            const jugs = cargarJugadores();
            const id = jugs[index]._id;
            if (!id) return;
            await fetch(`${API}/jugadores/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: jugador.nombre,
                    numero_playera: jugador.numero,
                    fecha_nacimiento: jugador.fechaNacimiento || null,
                    foto_url: jugador.foto || null,
                    baja: jugador.baja
                })
            });
        }
    } catch(e) {
        console.log('Error guardando en BD:', e);
    }
}

async function eliminarJugadorBD(index) {
    const jugs = cargarJugadores();
    const id = jugs[index]?._id;
    if (!id) return;
    try {
        await fetch(`${API}/jugadores/${id}`, { method: 'DELETE' });
    } catch(e) {
        console.log('Error eliminando en BD:', e);
    }
}

window.addEventListener('load', () => { setTimeout(cargarYRenderizar, 50); });