const API = 'https://team-soccer-api.onrender.com';

function mostrarToast(mensaje, tipo = 'exito') {
    let toast = document.getElementById('toast-notif');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notif';
        toast.style.cssText = `
            position:fixed; bottom:2rem; left:50%; transform:translateX(-50%) translateY(20px);
            padding:0.8rem 1.8rem; border-radius:12px; font-family:'Outfit',sans-serif;
            font-size:0.85rem; font-weight:600; letter-spacing:0.5px;
            z-index:9999; opacity:0; transition:all 0.3s ease; white-space:nowrap;
            box-shadow:0 8px 30px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(toast);
    }
    toast.style.background = tipo === 'exito'
        ? 'linear-gradient(135deg,#22c55e,#16a34a)'
        : 'linear-gradient(135deg,#ef4444,#dc2626)';
    toast.style.color = '#fff';
    toast.style.border = tipo === 'exito'
        ? '1px solid rgba(34,197,94,0.4)'
        : '1px solid rgba(239,68,68,0.4)';
    toast.textContent = mensaje;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(-50%) translateY(20px)';
    }, 3000);
}

let categoriaActual = null;
let categoriaEditando = null;
let categoriaAEliminar = null;

window.addEventListener('DOMContentLoaded', () => {
    cargarCategorias();
    const categoriaGuardada = localStorage.getItem('categoriaSeleccionada');
    if (categoriaGuardada) {
        categoriaActual = categoriaGuardada;
        document.getElementById('selectedText').textContent = categoriaGuardada;
        mostrarOpciones();
    }
});

async function cargarCategorias() {
    try {
        const res = await fetch(`${API}/categorias`);
        const categorias = await res.json();
        window._categoriasDB = categorias;
        const container = document.getElementById("optionsContainer");
        container.innerHTML = '';
        categorias.forEach(cat => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option-item';
            if (cat.nombre === categoriaActual) optionDiv.classList.add('selected');
            optionDiv.innerHTML = `
                <span class="option-text">${cat.nombre}</span>
                <div class="option-actions">
                    <button class="btn-icon" onclick="editarCategoria('${cat.nombre}'); event.stopPropagation();">✏️</button>
                    <button class="btn-icon" onclick="mostrarModalEliminar('${cat.nombre}'); event.stopPropagation();">🗑️</button>
                </div>`;
            optionDiv.addEventListener('click', () => seleccionarCategoria(cat.nombre));
            container.appendChild(optionDiv);
        });
    } catch(e) {
        console.error('Error cargando categorías:', e);
    }
}

function toggleOptions() {
    const select = document.getElementById('customSelect');
    const container = document.getElementById('optionsContainer');
    select.classList.toggle('open');
    container.classList.toggle('open');
}

function seleccionarCategoria(categoria) {
    categoriaActual = categoria;
    localStorage.setItem('categoriaSeleccionada', categoria);
    document.getElementById('selectedText').textContent = categoria;
    toggleOptions();
    cargarCategorias();
    mostrarOpciones();
}

function mostrarOpciones() {
    const panel = document.getElementById("opcionesCategoria");
    const textoCategoria = document.getElementById("textoCategoria");
    if (categoriaActual) {
        panel.classList.remove("oculto");
        textoCategoria.textContent = categoriaActual;
    } else {
        panel.classList.add("oculto");
    }
}

function mostrarFormularioCrear() {
    categoriaEditando = null;
    document.getElementById('tituloModal').textContent = '⚡ Nueva Categoría ⚡';
    document.getElementById('nombreCategoria').value = '';
    document.getElementById('errorNombre').textContent = '';
    document.getElementById('modalCategoria').classList.add('activo');
    document.getElementById('overlay').classList.add('activo');
    document.getElementById('nombreCategoria').focus();
}

function editarCategoria(categoria) {
    categoriaEditando = categoria;
    document.getElementById('tituloModal').textContent = '✏️ Editar Categoría';
    document.getElementById('nombreCategoria').value = categoria;
    document.getElementById('errorNombre').textContent = '';
    document.getElementById('modalCategoria').classList.add('activo');
    document.getElementById('overlay').classList.add('activo');
    document.getElementById('nombreCategoria').focus();
}

function cerrarModal() {
    document.getElementById('modalCategoria').classList.remove('activo');
    document.getElementById('overlay').classList.remove('activo');
    categoriaEditando = null;
}

async function guardarCategoria() {
    const nombre = document.getElementById('nombreCategoria').value.trim();
    const errorDiv = document.getElementById('errorNombre');
    if (nombre === "") { errorDiv.textContent = "⚠️ El nombre no puede estar vacío"; return; }

    try {
        if (categoriaEditando) {
            const cat = window._categoriasDB.find(c => c.nombre === categoriaEditando);
            await fetch(`${API}/categorias/${cat.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, edad_min: null, edad_max: null, permite_refuerzos: false, max_refuerzos: 0 })
            });
            if (categoriaActual === categoriaEditando) {
                categoriaActual = nombre;
                localStorage.setItem('categoriaSeleccionada', nombre);
                document.getElementById('selectedText').textContent = nombre;
            }
            mostrarToast(`✓ Categoría actualizada a "${nombre}"`);
        } else {
            const res = await fetch(`${API}/categorias`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre, edad_min: null, edad_max: null, permite_refuerzos: false, max_refuerzos: 0 })
            });
            const nueva = await res.json();
            if (nueva.error) { errorDiv.textContent = "⚠️ Esta categoría ya existe"; return; }
            mostrarToast(`✓ Categoría "${nombre}" creada`);
        }
        cerrarModal();
        await cargarCategorias();
        mostrarOpciones();
    } catch(e) {
        errorDiv.textContent = "⚠️ Error al guardar, revisa el servidor";
    }
}

function mostrarModalEliminar(categoria) {
    categoriaAEliminar = categoria;
    document.getElementById('categoriaEliminar').textContent = categoria;
    document.getElementById('modalEliminar').classList.add('activo');
    document.getElementById('overlay').classList.add('activo');
}

function cerrarModalEliminar() {
    document.getElementById('modalEliminar').classList.remove('activo');
    document.getElementById('overlay').classList.remove('activo');
    categoriaAEliminar = null;
}

async function confirmarEliminar() {
    if (!categoriaAEliminar) return;
    const cat = window._categoriasDB.find(c => c.nombre === categoriaAEliminar);
    await fetch(`${API}/categorias/${cat.id}`, { method: 'DELETE' });
    if (categoriaActual === categoriaAEliminar) {
        categoriaActual = null;
        localStorage.removeItem('categoriaSeleccionada');
        document.getElementById('selectedText').textContent = '🏆 Selecciona una Categoría';
        document.getElementById('opcionesCategoria').classList.remove('activo');
    }
    mostrarToast(`✓ Categoría "${categoriaAEliminar}" eliminada`);
    cerrarModalEliminar();
    await cargarCategorias();
}

function cerrarTodo() {
    cerrarModal();
    cerrarModalEliminar();
    document.getElementById('customSelect').classList.remove('open');
    document.getElementById('optionsContainer').classList.remove('open');
}

document.addEventListener('click', (e) => {
    const select = document.getElementById('customSelect');
    const container = document.getElementById('optionsContainer');
    const selectorContainer = document.querySelector('.selector-container');
    if (!selectorContainer.contains(e.target)) {
        select.classList.remove('open');
        container.classList.remove('open');
    }
});

document.getElementById('nombreCategoria').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') { guardarCategoria(); }
});