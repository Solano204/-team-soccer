// ========== INTERFAZ Y NAVEGACIÓN - REESCRITO DESDE CERO ==========

function toggleVistaCategoria(categoria, event) {
    event.stopPropagation();
    
    const estadoActual = estadosVistaCategorias[categoria] || 'visible';
    const btn = event.target.closest('.btn-vista-categoria');
    
    if (estadoActual === 'visible') {
        estadosVistaCategorias[categoria] = 'gris';
        btn.className = 'btn-vista-categoria gris';
        btn.textContent = '👁️‍🗨️';
    } else if (estadoActual === 'gris') {
        estadosVistaCategorias[categoria] = 'oculto';
        btn.className = 'btn-vista-categoria oculto';
        btn.textContent = '🚫';
    } else {
        estadosVistaCategorias[categoria] = 'visible';
        btn.className = 'btn-vista-categoria visible';
        btn.textContent = '👁️';
    }
    
    generarAgenda();
}

function cargarCategorias() {
    const categoriasDB = window._categoriasDB || [];
const categorias = categoriasDB.map(c => c.nombre);
    const container = document.getElementById('categoriasLista');
    container.innerHTML = '';

    if (categorias.length === 0) {
        container.innerHTML = `
            <div class="mensaje-vacio">
                <h3>⚠️ Sin Categorías</h3>
                <p>Crea categorías primero</p>
            </div>
        `;
        return;
    }

    categorias.forEach(categoria => {
        const rol = JSON.parse(localStorage.getItem(`rol_${categoria}`)) || [];
        const jornadasPendientes = [];
        
        rol.forEach((partidos, index) => {
            if (esJornadaPendiente(categoria, index + 1)) {
                jornadasPendientes.push({ partidos, numero: index + 1 });
            }
        });

        const colorCategoria = coloresCategorias[categoria] || '#e0e0e0';
        const categoriaId = categoria.replace(/\s+/g, '-');

        const categoriaDiv = document.createElement('div');
        categoriaDiv.className = 'categoria-item';
        
        categoriaDiv.innerHTML = `
            <div class="categoria-header" onclick="toggleCategoria('${categoria}')">
                <button class="btn-vista-categoria visible" onclick="toggleVistaCategoria('${categoria}', event)">👁️</button>
                <span class="categoria-nombre">${categoria}</span>
                <div class="categoria-controles">
                    <button class="btn-color-categoria" 
                            onclick="cambiarColorCategoria('${categoria}'); event.stopPropagation();" 
                            title="Cambiar color">
                        <div class="color-display" id="color-display-${categoriaId}" style="background-color: ${colorCategoria}"></div>
                        🎨
                    </button>
                    <span class="categoria-badge">${jornadasPendientes.length}</span>
                </div>
            </div>
            <div class="jornadas-lista" id="jornadas_${categoria}">
                ${jornadasPendientes.map(jornada => `
                    <div class="jornada-item">
                        <div class="jornada-toggle" onclick="toggleJornada('${categoria}', ${jornada.numero})">
                            <span class="jornada-nombre">Jornada ${jornada.numero}</span>
                            <span class="jornada-icon" id="icon_${categoria}_${jornada.numero}">▼</span>
                        </div>
                        <div class="jornada-partidos" id="partidos_${categoria}_${jornada.numero}">
                            ${jornada.partidos.map((partido, pIdx) => {
                                const estaJugado = esPartidoJugado(categoria, jornada.numero, pIdx);
const yaAsignado = !partido.descanso && partidoYaAsignado(categoria, partido.local, partido.visitante);
const esDraggable = !estaJugado && !yaAsignado;

let claseExtra = '';
if (estaJugado) claseExtra = 'partido-jugado-bloqueado';
else if (yaAsignado) claseExtra = 'partido-ya-asignado';
                                return `
                                    <div class="partido-mini ${partido.descanso ? 'descanso' : ''} ${claseExtra}" 
                                         ${esDraggable ? 'draggable="true"' : ''}
                                         ${esDraggable ? `ondragstart="iniciarArrastre(event, '${categoria}', ${jornada.numero}, ${pIdx})"` : ''}
                                         ${esDraggable ? 'ondragend="finalizarArrastre(event)"' : ''}
                                         ${!esDraggable ? 'style="cursor: not-allowed; opacity: 0.6;"' : ''}>
                                        ${estaJugado ? '<span style="font-size:1rem;">🔒</span>' : '<span class="drag-icon">⋮⋮</span>'}
                                        <span class="partido-texto">
                                            ${partido.descanso ? 
                                                `💤 ${partido.descanso}` :
                                                `${partido.local} <span class="vs-mini">VS</span> ${partido.visitante}`
                                            }
                                            ${yaAsignado ? '<span style="margin-left:0.3rem;font-size:0.9rem;">✓</span>' : ''}
                                        </span>
                                    </div>
                                `;
                            }).join('')}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        container.appendChild(categoriaDiv);
        container.appendChild(categoriaDiv);

// RESTAURAR ESTADO DE CATEGORÍA ABIERTA/CERRADA
if (categoriasAbiertas[categoria]) {
    const jornadasDiv = document.getElementById(`jornadas_${categoria}`);
    if (jornadasDiv) {
        jornadasDiv.classList.add('activo');
    }
}

// RESTAURAR ESTADO DE JORNADAS ABIERTAS
jornadasPendientes.forEach(jornada => {
    const key = `${categoria}_${jornada.numero}`;
    if (jornadasAbiertas[key]) {
        const partidosDiv = document.getElementById(`partidos_${categoria}_${jornada.numero}`);
        const icon = document.getElementById(`icon_${categoria}_${jornada.numero}`);
        if (partidosDiv && icon) {
            partidosDiv.classList.add('activo');
            icon.classList.add('expandido');
        }
    }
});
    });

}

function toggleCategoria(categoria) {
    const jornadasDiv = document.getElementById(`jornadas_${categoria}`);
    const estaActivo = jornadasDiv.classList.contains('activo');
    
    if (estaActivo) {
        jornadasDiv.classList.remove('activo');
        categoriasAbiertas[categoria] = false;
    } else {
        jornadasDiv.classList.add('activo');
        categoriasAbiertas[categoria] = true;
    }
}

function toggleJornada(categoria, numeroJornada) {
    const partidosDiv = document.getElementById(`partidos_${categoria}_${numeroJornada}`);
    const icon = document.getElementById(`icon_${categoria}_${numeroJornada}`);
    const key = `${categoria}_${numeroJornada}`;
    
    const estaActivo = partidosDiv.classList.contains('activo');
    
    if (estaActivo) {
        partidosDiv.classList.remove('activo');
        icon.classList.remove('expandido');
        jornadasAbiertas[key] = false;
    } else {
        partidosDiv.classList.add('activo');
        icon.classList.add('expandido');
        jornadasAbiertas[key] = true;
    }
}

function generarAgenda() {
    const tbody = document.getElementById('agendaBody');
    if (!tbody) {
        console.error('❌ No se encontró agendaBody');
        return;
    }
    
    tbody.innerHTML = '';
    const fechas = generarFechasSemana();

    horarios.forEach(hora => {
        const fila = document.createElement('tr');
        
        // Celda de hora
        const celdaHora = document.createElement('td');
        celdaHora.className = 'hora-cell';
        celdaHora.style.padding = '0.2rem';
        celdaHora.textContent = hora;
        fila.appendChild(celdaHora);

        // Celdas de cada día
        fechas.forEach((fecha) => {
            const celda = document.createElement('td');
            celda.className = 'celda-horario';
            celda.style.padding = '0';
            celda.style.margin = '0';
            celda.style.boxSizing = 'border-box';
            
            const fechaKey = `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`;
            const key = `${fechaKey}_${hora}`;
            
            const contenido = horariosAsignados[key];
            
if (contenido) {
                // HAY CONTENIDO EN LA CELDA
                
                if (contenido.esEvento) {
    // EVENTO PERSONALIZADO - AHORA PUEDE MOVERSE
    celda.classList.add('ocupada', 'celda-evento', 'celda-movible');
    celda.draggable = true;
    
    // Limpiar el nombre del evento de caracteres problemáticos
    const nombreEventoLimpio = (contenido.nombreEvento || 'Sin nombre')
        .replace(/[<>]/g, '') // Eliminar < y >
        .replace(/["']/g, '') // Eliminar comillas
        .trim();
    
    // Evento para ARRASTRAR el evento personalizado
    celda.ondragstart = function(e) {
        e.stopPropagation();
        console.log('🎯 Iniciando drag desde evento:', key);
        keyArrastrandoCelda = key;
        elementoArrastrandoPanel = null;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', 'celda-evento');
        celda.classList.add('dragging-celda-activa');
    };
    
    celda.ondragend = function(e) {
        console.log('🏁 Finalizando drag desde evento');
        celda.classList.remove('dragging-celda-activa');
        finalizarArrastre(e);
    };
    
    // Permitir DROP sobre eventos para intercambiar
    celda.ondragover = function(e) {
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'move';
    };
    
    celda.ondrop = function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('🔥 DROP sobre evento:', fechaKey, hora);
        soltarEnCelda(fechaKey, hora);
    };
    
    // Crear el contenido del evento de forma segura
    const btnEliminar = document.createElement('button');
    btnEliminar.className = 'btn-eliminar';
    btnEliminar.textContent = '✕';
    btnEliminar.onclick = function(e) {
        e.stopPropagation();
        eliminarPartido(key);
    };
    
    const divEvento = document.createElement('div');
    divEvento.className = 'evento-personalizado';
    divEvento.style.backgroundColor = '#ffeaa7';
    divEvento.style.borderRadius = '4px';
    
    const iconoEvento = document.createElement('span');
    iconoEvento.textContent = '📌';
    iconoEvento.style.fontSize = '1rem';
    
    const textoEvento = document.createElement('span');
    textoEvento.textContent = nombreEventoLimpio;
    textoEvento.style.fontSize = '0.55rem';
    textoEvento.style.fontWeight = '900';
    
    divEvento.appendChild(iconoEvento);
    divEvento.appendChild(textoEvento);
    
    const iconoMover = document.createElement('div');
    iconoMover.className = 'icono-mover';
    iconoMover.textContent = '⋮⋮';
    
    celda.appendChild(btnEliminar);
    celda.appendChild(divEvento);
    celda.appendChild(iconoMover);
    
} else {
                    // PARTIDO DE TORNEO
                    const estadoVista = estadosVistaCategorias[contenido.categoria] || 'visible';
                    
                    if (estadoVista === 'oculto') {
                        celda.classList.add('oculta');
                    } else {
                        celda.classList.add('ocupada');
                        
                        const color = estadoVista === 'gris' ? '#d0d0d0' : (coloresCategorias[contenido.categoria] || '#e0e0e0');
                        
                        if (estadoVista === 'gris') {
                            // VISTA GRIS (ocupado)
                            celda.classList.add('ocupada-otra');
                            celda.innerHTML = `
                                <div class="partido-asignado" style="background-color: ${color}">
                                    <div class="cat-label">${contenido.categoria}</div>
                                    <span style="font-size:0.9rem">🔒</span>
                                    <span style="font-size:0.7rem">Ocupado</span>
                                </div>
                            `;
                            
                            // NO permitir drop en vista gris
                            celda.ondragover = function(e) {
                                e.preventDefault();
                                e.stopPropagation();
                                e.dataTransfer.dropEffect = 'none';
                            };
                            
                        } else {
                            // VISTA NORMAL - PUEDE MOVERSE Y RECIBIR DROPS
                            celda.classList.add('celda-movible');
                            celda.draggable = true;
                            
                            // Evento para ARRASTRAR DESDE esta celda
                            celda.ondragstart = function(e) {
                                e.stopPropagation();
                                console.log('🎯 Iniciando drag desde celda:', key);
                                const puedeArrastrar = iniciarArrastreDesdeCelda(key);
                                if (!puedeArrastrar) {
                                    e.preventDefault();
                                    return false;
                                }
                                e.dataTransfer.effectAllowed = 'move';
                                e.dataTransfer.setData('text/plain', 'celda');
                                celda.classList.add('dragging-celda-activa');
                            };
                            
                            celda.ondragend = function(e) {
                                console.log('🏁 Finalizando drag desde celda');
                                celda.classList.remove('dragging-celda-activa');
                                finalizarArrastre(e);
                            };
                            
                            // IMPORTANTE: Permitir DROP sobre esta celda para intercambiar
                            celda.ondragover = function(e) {
                                e.preventDefault();
                                e.stopPropagation();
                                e.dataTransfer.dropEffect = 'move';
                            };
                            
                            celda.ondrop = function(e) {
                                e.preventDefault();
                                e.stopPropagation();
                                console.log('🔥 DROP sobre celda ocupada:', fechaKey, hora);
                                soltarEnCelda(fechaKey, hora);
                            };
                            
                            const textoPartido = contenido.esDescanso ? 
                            `<span>${contenido.texto}</span>` : 
                            `<span>${contenido.local}</span>
                            <span style="font-size:0.5rem">VS</span>
                            <span>${contenido.visitante}</span>`;
                            
                            celda.innerHTML = `
                                <button class="btn-eliminar" onclick="eliminarPartido('${key}'); event.stopPropagation();">✕</button>
                                <div class="partido-asignado" style="background-color: ${color}">
                                    <div class="cat-label">${contenido.categoria}</div>
                                    ${textoPartido}
                                </div>
                                <div class="icono-mover">⋮⋮</div>
                            `;
                        }
                    }
                }
            } else {
                // CELDA VACÍA
                celda.ondragover = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    e.dataTransfer.dropEffect = 'move';
                };
                
                celda.ondrop = function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('🔥 DROP en celda vacía:', fechaKey, hora);
                    soltarEnCelda(fechaKey, hora);
                };
                
                // Doble clic para evento
                celda.ondblclick = function() {
                    mostrarModalEvento(fechaKey, hora);
                };
                
                celda.title = 'Doble clic para agregar evento';
            }

            fila.appendChild(celda);
        });

        tbody.appendChild(fila);
    });
    
    console.log('✅ Agenda generada');
}