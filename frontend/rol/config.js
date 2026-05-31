// ========== CONFIGURACIÓN Y VARIABLES GLOBALES ==========

const API = 'https://team-soccer-api.onrender.com';

// Variables globales del estado de la aplicación
let jornadaActual = 0;
let todasLasJornadas = [];
let vistaActual = 'individual';
let modoAgregarActivo = {};

// Variable para drag & drop
let partidoArrastrado = null;
let esPartidoAgregado = false;

// Variables para sistema de sugerencias
let rolSugerido = null;
let partidosJugadosSugerencia = null;

// Obtener categoría de la URL
const urlParams = new URLSearchParams(window.location.search);
const categoria = urlParams.get('categoria') || 'Demo';

// Ruta al menú
const RUTA_MENU = '../menu/menu.html';

// Actualizar título y subtítulo
document.getElementById('tituloRol').textContent = `ROL ${categoria.toUpperCase()}`;
const headerSub = document.getElementById('headerSub');
if (headerSub) headerSub.textContent = categoria;

// Claves — se mantienen para compatibilidad con sugerencias y estados temporales
const storageKeyEquipos        = `equipos_${categoria}`;
const storageKeyRol            = `rol_${categoria}`;
const storageKeyJornadasJugadas= `jornadas_jugadas_${categoria}`;
const storageKeyEquiposEnRol   = `equipos_en_rol_${categoria}`;
const storageKeyPartidosJugados= `partidos_jugados_${categoria}`;
const storageKeyPartidosAgregados = `partidos_agregados_${categoria}`;
const storageKeyPartidosMovidos   = `partidos_movidos_${categoria}`;

// Referencias DOM
const jornadasContainer = document.getElementById("jornadasContainer");
const btnGenerar  = document.getElementById("btnGenerar");
const btnEliminar = document.getElementById("btnEliminar");

function getBtnAgregar() {
    return document.getElementById("btnAgregar");
}

// ── HELPERS RAILWAY ──────────────────────────────────

// Cache del id de categoría para no buscarlo múltiples veces
let _categoriIdCache = null;

async function getCategoriaId() {
    if (_categoriIdCache) return _categoriIdCache;
    try {
        const res = await fetch(`${API}/categorias`);
        const cats = await res.json();
        const cat = cats.find(c => c.nombre === categoria);
        _categoriIdCache = cat ? cat.id : null;
        return _categoriIdCache;
    } catch(e) {
        console.error('Error obteniendo categoría:', e);
        return null;
    }
}

// Cargar todo el estado del rol desde Railway
async function cargarEstadoRailway() {
    const catId = await getCategoriaId();
    if (!catId) return null;
    try {
        const res = await fetch(`${API}/rol/${catId}`);
        const data = await res.json();
        return data;
    } catch(e) {
        console.error('Error cargando rol:', e);
        return null;
    }
}

// Guardar todo el estado del rol en Railway
async function guardarEstadoRailway() {
    const catId = await getCategoriaId();
    if (!catId) return;

    const partidosJugados   = JSON.parse(localStorage.getItem(storageKeyPartidosJugados)) || {};
    const jornadasJugadas   = JSON.parse(localStorage.getItem(storageKeyJornadasJugadas)) || [];
    const jornadasDoradas   = JSON.parse(localStorage.getItem(`jornadasDoradas_${categoria}`)) || [];
    const equiposEnRol      = JSON.parse(localStorage.getItem(storageKeyEquiposEnRol)) || [];
    const partidosAgregados = JSON.parse(localStorage.getItem(storageKeyPartidosAgregados)) || {};
    const partidosMovidos   = JSON.parse(localStorage.getItem(storageKeyPartidosMovidos)) || {};
    const jornadaActualMarcada = localStorage.getItem(`jornadaActual_${categoria}`);

    const sugerenciaFija = localStorage.getItem(`sugerencia_fija_${categoria}`);

try {
    await fetch(`${API}/rol`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },

body: JSON.stringify({
    categoria_id: catId,
    jornadas: todasLasJornadas,
    equipos_en_rol: equiposEnRol,
    partidos_jugados: partidosJugados,
    jornadas_jugadas: jornadasJugadas,
    jornadas_doradas: jornadasDoradas,
    partidos_agregados: partidosAgregados,
    partidos_movidos: partidosMovidos,
    jornada_actual_marcada: jornadaActualMarcada !== null ? parseInt(jornadaActualMarcada) : null,
    sugerencia_fija: sugerenciaFija ? JSON.parse(sugerenciaFija) : null
})
        });
    } catch(e) {
        console.error('Error guardando rol:', e);
    }
}

// Eliminar rol de Railway
async function eliminarRolRailway() {
    const catId = await getCategoriaId();
    if (!catId) return;
    try {
        await fetch(`${API}/rol/${catId}`, { method: 'DELETE' });
    } catch(e) {
        console.error('Error eliminando rol:', e);
    }
}

// Toggle modo agregar sugerencias
function toggleModoAgregarSugerencia(jornadaIdx) {
    modoAgregarActivo[jornadaIdx] = !modoAgregarActivo[jornadaIdx];
    mostrarVistaSugerencia();
}