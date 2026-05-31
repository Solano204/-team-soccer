// ========== VISUALIZACIÓN DE JORNADAS ==========

// Mostrar rol según la vista seleccionada
function mostrarRolSegunVista() {
    if (vistaActual === 'individual') {
        mostrarJornadaIndividual(jornadaActual);
        actualizarNavegacion();
    } else if (vistaActual === 'sugerencia') {
        mostrarVistaSugerencia();
    } else if (vistaActual === 'actual') {
        mostrarJornadaActual();
    } else {
        mostrarTodasLasJornadas();
    }
}

// Cambiar vista entre individual, todas, actual y sugerencia
function cambiarVista(vista) {
    vistaActual = vista;
    document.querySelectorAll('.btn-vista').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (vista === 'individual') {
        const btnInd = document.querySelector('.btn-vista[onclick*="individual"]');
        if (btnInd) btnInd.classList.add('active');
    } else if (vista === 'todas') {
        const btnTodas = document.querySelector('.btn-vista[onclick*="todas"]');
        if (btnTodas) btnTodas.classList.add('active');
    } else if (vista === 'actual') {
        const btnActual = document.querySelector('.btn-vista[onclick*="actual"]');
        if (btnActual) btnActual.classList.add('active');
    } else if (vista === 'sugerencia') {
        const btnSug = document.querySelector('.btn-vista-sugerencia');
        if (btnSug) btnSug.classList.add('active');
    }
    
    const buscadorJornada = document.getElementById('buscadorJornada');
    const btnPrimera = document.getElementById('btnPrimera');
    const btnAnterior = document.getElementById('btnAnterior');
    const btnSiguiente = document.getElementById('btnSiguiente');
    const btnUltima = document.getElementById('btnUltima');
    const infoJornada = document.getElementById('infoJornada');
    
    if (vista === 'individual') {
        buscadorJornada.style.display = 'flex';
        btnPrimera.style.display = 'inline-block';
        btnAnterior.style.display = 'inline-block';
        btnSiguiente.style.display = 'inline-block';
        btnUltima.style.display = 'inline-block';
        infoJornada.style.display = 'inline-block';
    } else {
        buscadorJornada.style.display = 'none';
        btnPrimera.style.display = 'none';
        btnAnterior.style.display = 'none';
        btnSiguiente.style.display = 'none';
        btnUltima.style.display = 'none';
        infoJornada.style.display = 'none';
    }
    
    mostrarRolSegunVista();
}

// Verificar si una jornada debe tener borde dorado
function esJornadaDorada(jornadaIdx) {
    const jornadasDoradas = JSON.parse(localStorage.getItem(`jornadasDoradas_${categoria}`)) || [];
    return jornadasDoradas.includes(jornadaIdx);
}

// Obtener jornada actual (primera jornada con partidos sin jugar)
function obtenerJornadaActual() {
    const partidosJugados = JSON.parse(localStorage.getItem(storageKeyPartidosJugados)) || {};
    
    for (let jIdx = 0; jIdx < todasLasJornadas.length; jIdx++) {
        const jornada = todasLasJornadas[jIdx];
        
        for (let pIdx = 0; pIdx < jornada.length; pIdx++) {
            const partido = jornada[pIdx];
            if (!partido.descanso) {
                const key = `j${jIdx}-p${pIdx}`;
                if (!partidosJugados[key]) {
                    return jIdx;
                }
            }
        }
    }
    
    return 0;
}

// NUEVA FUNCIÓN: Establecer jornada como actual (borde rojo)
function establecerJornadaActual(jornadaIdx) {
    // Guardar índice de jornada actual
    localStorage.setItem(`jornadaActual_${categoria}`, jornadaIdx.toString());
    
    // Regenerar vista para aplicar cambios
    mostrarRolSegunVista();
    
    console.log(`✅ Jornada ${jornadaIdx + 1} establecida como ACTUAL`);
}

// NUEVA FUNCIÓN: Obtener índice de jornada con borde rojo
function obtenerJornadaActualMarcada() {
    const jornadaGuardada = localStorage.getItem(`jornadaActual_${categoria}`);
    return jornadaGuardada !== null ? parseInt(jornadaGuardada) : null;
}

// Mostrar jornada actual con borde rojo
function mostrarJornadaActual() {
    if (!todasLasJornadas.length) return;
    
    const indexActual = obtenerJornadaActual();
    jornadasContainer.innerHTML = "";
    
    const partidosJornada = todasLasJornadas[indexActual];
    const jornadasJugadas = JSON.parse(localStorage.getItem(storageKeyJornadasJugadas)) || [];
    const esJugada = jornadasJugadas.includes(indexActual);
    const partidosOrdenados = ordenarPartidos(partidosJornada, indexActual);
    
    const jornadaDiv = document.createElement("div");
    jornadaDiv.className = "jornada jornada-actual" + (esJugada ? " jugada" : "");
    
    if (esJornadaDorada(indexActual)) {
        jornadaDiv.classList.add('jornada-completa');
    }
    
    jornadaDiv.dataset.jornadaIdx = indexActual;
    
    jornadaDiv.addEventListener('dragover', handleDragOver);
    jornadaDiv.addEventListener('drop', (e) => handleDrop(e, indexActual));
    jornadaDiv.addEventListener('dragleave', handleDragLeave);
    
    jornadaDiv.innerHTML = `
        <div class="jornada-header">
            <h3>🔴 Jornada ${indexActual + 1} (ACTUAL)</h3>
            <div class="checkbox-jugada">
                <input type="checkbox" id="check-actual-${indexActual}" ${esJugada ? 'checked' : ''} 
                    onchange="marcarJornadaJugada(${indexActual})">
                <label for="check-actual-${indexActual}">Toda Jugada</label>
            </div>
        </div>
        <div class="partidos">
            ${partidosOrdenados.map(({ partido, indiceOriginal }) => 
                generarHTMLPartido(partido, indiceOriginal, indexActual, false)
            ).join('')}
        </div>
    `;
    
    jornadasContainer.appendChild(jornadaDiv);
    agregarEventListenersPartidos(jornadaDiv, indexActual);
    
    if (Object.values(modoAgregarActivo).some(v => v)) {
        jornadaDiv.querySelectorAll('.draggable').forEach(elemento => {
            elemento.addEventListener('dragstart', handleDragStart);
            elemento.addEventListener('dragend', handleDragEnd);
        });
    }
}

// Función para agregar event listeners a los checkboxes - CORREGIDA
function agregarEventListenersPartidos(jornadaDiv, jornadaIdx) {
    const checkboxes = jornadaDiv.querySelectorAll('.checkbox-partido input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
        // CRÍTICO: Obtener el índice del partido desde el div padre
        const partidoDiv = checkbox.closest('.partido');
        
        if (!partidoDiv) {
            console.error('❌ No se encontró el div del partido');
            return;
        }
        
        const partidoIdx = parseInt(partidoDiv.dataset.partidoIdx);
        
        if (isNaN(partidoIdx)) {
            console.error('❌ Índice de partido inválido:', partidoDiv.dataset.partidoIdx);
            return;
        }
        
        console.log(`✅ Agregando listener: Jornada ${jornadaIdx}, Partido ${partidoIdx}`);
        
        // Remover listeners previos y agregar uno nuevo
        checkbox.replaceWith(checkbox.cloneNode(true));
        const nuevoCheckbox = partidoDiv.querySelector('.checkbox-partido input[type="checkbox"]');
        
        nuevoCheckbox.addEventListener('change', function(e) {
            e.stopPropagation();
            console.log(`🔘 Checkbox clickeado: J${jornadaIdx} P${partidoIdx}`);
            marcarPartidoJugado(jornadaIdx, partidoIdx);
        });
    });
}

// Función auxiliar para generar HTML de un partido
function generarHTMLPartido(partido, indiceOriginal, index, esVistaCompleta) {
    if (partido.descanso) {
        return `
            <div class="partido descanso" data-jornada-idx="${index}" data-partido-idx="${indiceOriginal}">
                <div class="descanso-text">${partido.descanso} - DESCANSO</div>
            </div>
        `;
    }
    
    const partidosJugados = JSON.parse(localStorage.getItem(storageKeyPartidosJugados)) || {};
    const partidosAgregados = JSON.parse(localStorage.getItem(storageKeyPartidosAgregados)) || {};
    const partidosMovidos = JSON.parse(localStorage.getItem(storageKeyPartidosMovidos)) || {};
    
    const partidoKey = `j${index}-p${indiceOriginal}`;
    const estaJugado = partidosJugados[partidoKey] || false;
    const estaAgregado = partidosAgregados[partidoKey] || false;
    const estaMovido = partidosMovidos[partidoKey] || false;
    
    let clasePartido = 'partido';
    if (estaMovido) clasePartido += ' partido-movido';
    else if (estaAgregado) clasePartido += ' partido-agregado';
    else if (estaJugado) clasePartido += ' partido-jugado';
    
    const esDraggable = !estaJugado && (
        (!estaMovido && Object.values(modoAgregarActivo).some(v => v)) ||
        (estaAgregado && Object.values(modoAgregarActivo).some(v => v))
    );
    
    const idUnico = `partido-check-j${index}-p${indiceOriginal}-${Math.random().toString(36).substring(7)}`;
    
    const botonEliminar = estaAgregado ? 
        `<button class="btn-eliminar-agregado" onclick="eliminarPartidoAgregado(${index}, ${indiceOriginal}); event.stopPropagation();" title="Eliminar partido agregado">✕</button>` 
        : '';
    
    return `
        <div class="${clasePartido} ${esDraggable ? 'draggable' : ''}" 
            data-jornada-idx="${index}" 
            data-partido-idx="${indiceOriginal}"
            ${esDraggable ? `draggable="true" data-partido-key="${partidoKey}" data-es-agregado="${estaAgregado}"` : ''}>
            <div class="checkbox-partido">
                <input type="checkbox" 
                    id="${idUnico}" 
                    ${estaJugado ? 'checked' : ''} 
                    ${estaAgregado || estaMovido ? 'disabled' : ''}>
                <label for="${idUnico}">✓</label>
            </div>
            <span class="equipo equipo-local">${partido.local}</span>
            <span class="vs-badge">VS</span>
            <span class="equipo equipo-visitante">${partido.visitante}</span>
            ${botonEliminar}
        </div>
    `;
}

// Mostrar una jornada individual
function mostrarJornadaIndividual(index) {
    if (!todasLasJornadas.length) return;
    
    jornadasContainer.innerHTML = "";
    const partidosJornada = todasLasJornadas[index];
    const jornadasJugadas = JSON.parse(localStorage.getItem(storageKeyJornadasJugadas)) || [];
    const esJugada = jornadasJugadas.includes(index);
    const partidosOrdenados = ordenarPartidos(partidosJornada, index);
    
    // Verificar si es la jornada actual marcada
    const jornadaActualMarcada = obtenerJornadaActualMarcada();
    const esJornadaActualMarcada = jornadaActualMarcada === index;
    
    const jornadaDiv = document.createElement("div");
    jornadaDiv.className = "jornada" + (esJugada ? " jugada" : "");
    
    // Agregar borde rojo si es jornada actual
    if (esJornadaActualMarcada) {
        jornadaDiv.classList.add('jornada-actual');
    }
    
    if (esJornadaDorada(index)) {
        jornadaDiv.classList.add('jornada-completa');
    }
    
    jornadaDiv.dataset.jornadaIdx = index;
    
    // DOBLE CLIC para marcar como jornada actual
    jornadaDiv.addEventListener('dblclick', function() {
        if (esJornadaActualMarcada) {
            // Si ya es actual, quitar marca
            localStorage.removeItem(`jornadaActual_${categoria}`);
            console.log(`🔴 Jornada ${index + 1} desmarcada como ACTUAL`);
        } else {
            // Marcar como actual
            establecerJornadaActual(index);
        }
    });
    
    jornadaDiv.addEventListener('dragover', handleDragOver);
    jornadaDiv.addEventListener('drop', (e) => handleDrop(e, index));
    jornadaDiv.addEventListener('dragleave', handleDragLeave);
    
    jornadaDiv.innerHTML = `
        <div class="jornada-header">
            <h3>Jornada ${index + 1}${esJornadaActualMarcada ? ' 🔴' : ''}</h3>
            <div class="checkbox-jugada">
                <input type="checkbox" id="check-${index}" ${esJugada ? 'checked' : ''} 
                    onchange="marcarJornadaJugada(${index})">
                <label for="check-${index}">Toda Jugada</label>
            </div>
        </div>
        <div class="partidos">
            ${partidosOrdenados.map(({ partido, indiceOriginal }) => 
                generarHTMLPartido(partido, indiceOriginal, index, false)
            ).join('')}
        </div>
    `;
    
    jornadasContainer.appendChild(jornadaDiv);
    agregarEventListenersPartidos(jornadaDiv, index);
    
    if (Object.values(modoAgregarActivo).some(v => v)) {
        jornadaDiv.querySelectorAll('.draggable').forEach(elemento => {
            elemento.addEventListener('dragstart', handleDragStart);
            elemento.addEventListener('dragend', handleDragEnd);
        });
    }
}

// Mostrar todas las jornadas (ROL NUEVO)
function mostrarTodasLasJornadas() {
    jornadasContainer.innerHTML = "";
    const jornadasJugadas = JSON.parse(localStorage.getItem(storageKeyJornadasJugadas)) || [];
    const jornadaActualMarcada = obtenerJornadaActualMarcada();
    
    todasLasJornadas.forEach((partidosJornada, index) => {
        const esJugada = jornadasJugadas.includes(index);
        const partidosOrdenados = ordenarPartidos(partidosJornada, index);
        const esJornadaActualMarcada = jornadaActualMarcada === index;
        
        const jornadaDiv = document.createElement("div");
        jornadaDiv.className = "jornada" + (esJugada ? " jugada" : "");
        
        // Agregar borde rojo si es jornada actual
        if (esJornadaActualMarcada) {
            jornadaDiv.classList.add('jornada-actual');
        }
        
        if (esJornadaDorada(index)) {
            jornadaDiv.classList.add('jornada-completa');
        }
        
        jornadaDiv.dataset.jornadaIdx = index;
        
        // DOBLE CLIC para marcar como jornada actual
        jornadaDiv.addEventListener('dblclick', function() {
            if (esJornadaActualMarcada) {
                localStorage.removeItem(`jornadaActual_${categoria}`);
                console.log(`🔴 Jornada ${index + 1} desmarcada como ACTUAL`);
            } else {
                establecerJornadaActual(index);
            }
        });
        
        jornadaDiv.addEventListener('dragover', handleDragOver);
        jornadaDiv.addEventListener('drop', (e) => handleDrop(e, index));
        jornadaDiv.addEventListener('dragleave', handleDragLeave);
        
        jornadaDiv.innerHTML = `
            <div class="jornada-header">
                <h3>Jornada ${index + 1}${esJornadaActualMarcada ? ' 🔴' : ''} </h3>
                <div class="checkbox-jugada">
                    <input type="checkbox" id="check-all-${index}" ${esJugada ? 'checked' : ''} 
                        onchange="marcarJornadaJugada(${index})">
                    <label for="check-all-${index}">Toda Jugada</label>
                </div>
            </div>
            <div class="partidos">
                ${partidosOrdenados.map(({ partido, indiceOriginal }) => 
                    generarHTMLPartido(partido, indiceOriginal, index, true)
                ).join('')}
            </div>
        `;
        
        jornadasContainer.appendChild(jornadaDiv);
        agregarEventListenersPartidos(jornadaDiv, index);
        
        if (Object.values(modoAgregarActivo).some(v => v)) {
            jornadaDiv.querySelectorAll('.draggable').forEach(elemento => {
                elemento.addEventListener('dragstart', handleDragStart);
                elemento.addEventListener('dragend', handleDragEnd);
            });
        }
    });
}
// Mostrar vista de sugerencia
function mostrarVistaSugerencia() {
    console.log("👁️ Mostrando vista de sugerencia...");
    
    if (!rolSugerido) {
        const resultado = generarSugerenciaAutomatica();
        if (!resultado) {
            cambiarVista('todas');
            return;
        }
    }
    
    jornadasContainer.innerHTML = "";
    
    rolSugerido.forEach((partidosJornada, index) => {
        const jornadaDiv = document.createElement("div");
        jornadaDiv.className = "jornada jornada-sugerencia";
        
        let htmlPartidos = '';
        partidosJornada.forEach((partido, pIdx) => {
            if (partido.descanso) {
                htmlPartidos += `
                    <div class="partido descanso">
                        <div class="descanso-text">${partido.descanso} - DESCANSO</div>
                    </div>
                `;
            } else {
                const key = `j${index}-p${pIdx}`;
                const estaJugado = partidosJugadosSugerencia[key] || false;
                
                const partidoKey = `${partido.local}-${partido.visitante}`;
                const esRedistribuido = partidosRedistribuidos.has(partidoKey);
                
                let clasePartido = 'partido ';
                if (estaJugado) {
                    clasePartido += 'partido-jugado';
                } else if (esRedistribuido) {
                    clasePartido += 'partido-sugerido';
                } else {
                    clasePartido += 'partido-normal-sugerencia';
                }
                
                htmlPartidos += `
                    <div class="${clasePartido}">
                        <span class="equipo equipo-local">${partido.local}</span>
                        <span class="vs-badge">VS</span>
                        <span class="equipo equipo-visitante">${partido.visitante}</span>
                    </div>
                `;
            }
        });
        
        jornadaDiv.innerHTML = `
            <div class="jornada-header">
                <h3>Jornada ${index + 1} (Sugerencia)</h3>
                <button class="btn-agregar-partido ${modoAgregarActivo[index] ? 'active' : ''}" 
                        onclick="toggleModoAgregarSugerencia(${index})">
                    ${modoAgregarActivo[index] ? '✔ Listo' : '➕ Agregar Partido'}
                </button>
            </div>
            <div class="partidos">
                ${htmlPartidos}
            </div>
        `;
        
        jornadasContainer.appendChild(jornadaDiv);
    });
}


// Navegar entre jornadas
function cambiarJornada(direccion) {
    jornadaActual += direccion;
    jornadaActual = Math.max(0, Math.min(jornadaActual, todasLasJornadas.length - 1));
    mostrarJornadaIndividual(jornadaActual);
    actualizarNavegacion();
}

function irAPrimeraJornada() {
    jornadaActual = 0;
    mostrarJornadaIndividual(jornadaActual);
    actualizarNavegacion();
}

function irAUltimaJornada() {
    jornadaActual = todasLasJornadas.length - 1;
    mostrarJornadaIndividual(jornadaActual);
    actualizarNavegacion();
}

function irAJornada() {
    const input = document.getElementById('inputBuscarJornada');
    const numeroJornada = parseInt(input.value);
    
    if (isNaN(numeroJornada) || numeroJornada < 1 || numeroJornada > todasLasJornadas.length) {
        alert(`⚠️ Ingresa un número válido entre 1 y ${todasLasJornadas.length}`);
        return;
    }
    
    jornadaActual = numeroJornada - 1;
    mostrarJornadaIndividual(jornadaActual);
    actualizarNavegacion();
    input.value = '';
}