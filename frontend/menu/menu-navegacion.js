// ── Controlar animación splash ──
// Protección de login
if (!sessionStorage.getItem('sesion_jaguar')) {
    location.href = '../login/index.html';
}
const vieneDeSesion = sessionStorage.getItem('menu_visitado');

if (vieneDeSesion) {
    // Ya visitó el menú antes — saltar animación
    const splash = document.querySelector('.splash');
    const app    = document.querySelector('.app');
    if (splash) {
        splash.style.animation = 'none';
        splash.style.opacity   = '0';
        splash.style.pointerEvents = 'none';
    }
    if (app) {
        app.style.animation = 'none';
        app.style.opacity   = '1';
    }
} else {
    // Primera vez desde login — marcar y dejar correr la animación
    sessionStorage.setItem('menu_visitado', '1');
}

// ========== NAVEGACIÓN ENTRE SECCIONES ==========

const RUTAS = {
    equipos:           '../equipos/equipos.html',
    rol:               '../rol/index.html',
    horarios:          '../horarios/horarios.html',
    puntos:            '../puntos/puntos.html',
    'cobro-credencial':'../cobros/cobro-credencial.html',
    'cobro-inscripcion':'../cobros/cobro-inscripcion.html',
    'cobro-arbitro':   '../cobros/cobro-arbitro.html',
    login: '../login/index.html'
};

function irASeccion(seccion) {
    if (!categoriaActual) {
        mostrarToast('⚠️ Selecciona una categoría primero', 'error');
        return;
    }

    const url = RUTAS[seccion];

    if (!url) {
        mostrarToast('⚠️ Sección no encontrada', 'error');
        return;
    }

    location.href = `${url}?categoria=${encodeURIComponent(categoriaActual)}`;
}

function cerrarSesion() {
    localStorage.removeItem('categoriaSeleccionada');
    sessionStorage.removeItem('menu_visitado');
    sessionStorage.removeItem('sesion_jaguar');
    location.href = RUTAS.login;
}

function toggleTheme() {
    const html = document.documentElement;
    const isDark = html.getAttribute('data-theme') === 'dark';
    html.setAttribute('data-theme', isDark ? 'light' : 'dark');
    localStorage.setItem('tema_jaguar', isDark ? 'light' : 'dark');
}

const temaGuardado = localStorage.getItem('tema_jaguar');
if (temaGuardado) {
    document.documentElement.setAttribute('data-theme', temaGuardado);
}