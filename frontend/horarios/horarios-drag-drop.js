// ========== SISTEMA DE DRAG & DROP - REESCRITO DESDE CERO ==========

// Variables globales limpias
let elementoArrastrandoPanel = null;
let keyArrastrandoCelda = null;

// ========== DRAG DESDE PANEL IZQUIERDO ==========
function iniciarArrastre(event, categoria, numeroJornada, indexPartido) {
    console.log('🎯 INICIO: Arrastre desde panel');
    
    // Limpiar estado previo
    elementoArrastrandoPanel = null;
    keyArrastrandoCelda = null;
    
    const rol = JSON.parse(localStorage.getItem(`rol_${categoria}`)) || [];
    const partido = rol[numeroJornada - 1][indexPartido];
    
    // Verificar si el partido ya está jugado
    if (esPartidoJugado(categoria, numeroJornada, indexPartido)) {
        event.preventDefault();
        alert('🔒 Este partido ya fue jugado y no se puede programar.');
        return;
    }
    
    // Verificar si el partido ya está asignado
    if (!partido.descanso && partidoYaAsignado(categoria, partido.local, partido.visitante)) {
        event.preventDefault();
        alert('⚠️ Este partido ya está asignado en la agenda.');
        return;
    }
    
    // Guardar información del partido
    elementoArrastrandoPanel = {
        categoria: categoria,
        jornada: numeroJornada,
        partido: partido
    };
    
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', 'panel');
    event.target.classList.add('dragging');
    
    console.log('✅ Partido del panel listo para arrastrar:', elementoArrastrandoPanel);
}

// ========== DRAG DESDE CELDA DE AGENDA ==========
function iniciarArrastreDesdeCelda(keyOrigen) {
    console.log('🎯 INICIO: Arrastre desde celda', keyOrigen);
    
    // Limpiar estado previo
    elementoArrastrandoPanel = null;
    keyArrastrandoCelda = keyOrigen;
    
    const partido = horariosAsignados[keyOrigen];
    
    if (!partido) {
        console.error('❌ No hay partido en esta celda');
        return false;
    }
    
    if (partido.esEvento) {
        alert('⚠️ Los eventos personalizados no se pueden mover.');
        return false;
    }
    
    console.log('✅ Partido de celda listo para arrastrar:', partido);
    return true;
}

function finalizarArrastre(event) {
    event.target.classList.remove('dragging');
    
    // Limpiar todas las clases de dragging
    document.querySelectorAll('.dragging-celda-activa').forEach(el => {
        el.classList.remove('dragging-celda-activa');
    });
}

// ========== DROP EN CELDA ==========
// ========== DROP EN CELDA ==========
function soltarEnCelda(fechaKey, hora) {
    const keyDestino = `${fechaKey}_${hora}`;
    
    console.log('🔥 DROP EN CELDA:', keyDestino);
    console.log('Panel:', elementoArrastrandoPanel);
    console.log('Celda:', keyArrastrandoCelda);
    
    // CASO 1: Arrastre desde panel izquierdo
if (elementoArrastrandoPanel) {
    console.log('✅ CASO 1: Desde panel');
    
    if (horariosAsignados[keyDestino]) {
        alert('⚠️ Este horario ya está ocupado.\n\nElimínalo primero o arrastra el partido asignado para intercambiar.');
        limpiarEstadoDrag();
        return;
    }
    
    const partido = elementoArrastrandoPanel.partido;
    
    if (partido.descanso) {
        horariosAsignados[keyDestino] = {
            categoria: elementoArrastrandoPanel.categoria,
            jornada: elementoArrastrandoPanel.jornada,
            esDescanso: true,
            texto: `${partido.descanso} - DESCANSO`
        };
    } else {
        horariosAsignados[keyDestino] = {
            categoria: elementoArrastrandoPanel.categoria,
            jornada: elementoArrastrandoPanel.jornada,
            local: partido.local,
            visitante: partido.visitante,
            esDescanso: false
        };
    }
    
    guardarHorariosRailway();
    
// ── VERIFICAR FECHA Y MARCAR ESTADO ──
if (!partido.descanso) {
    const partesFecha = fechaKey.split('-');
    const fechaPartido = new Date(partesFecha[0], partesFecha[1] - 1, partesFecha[2]);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const cat = elementoArrastrandoPanel.categoria;
    const jornada = elementoArrastrandoPanel.jornada;
    const rol = JSON.parse(localStorage.getItem(`rol_${cat}`)) || [];
    const partidosJornada = rol[jornada - 1] || [];

    const indexPartido = partidosJornada.findIndex(p =>
        !p.descanso && p.local === partido.local && p.visitante === partido.visitante
    );

    if (indexPartido !== -1) {
        const storageKeyJugados = `partidos_jugados_${cat}`;
        const jugados = JSON.parse(localStorage.getItem(storageKeyJugados)) || {};

        if (fechaPartido < hoy) {
            // Fecha pasada → marcar como jugado
            jugados[`j${jornada - 1}-p${indexPartido}`] = true;
        } else {
            // Fecha futura o hoy → marcar como programado (no jugado)
            jugados[`j${jornada - 1}-p${indexPartido}`] = false;
        }

        localStorage.setItem(storageKeyJugados, JSON.stringify(jugados));
    }
}
// ────────────────────────────────────────
    // ─────────────────────────────────────────────────
    
    limpiarEstadoDrag();
    generarAgenda();
    cargarCategorias();
    console.log('💾 Partido asignado desde panel');
}
    
    // CASO 2: Arrastre desde otra celda (mover/intercambiar)
    else if (keyArrastrandoCelda) {
        console.log('✅ CASO 2: Desde celda');
        
        const keyOrigen = keyArrastrandoCelda;
        
        // No permitir soltar en la misma celda
        if (keyOrigen === keyDestino) {
            console.log('⚠️ Misma celda, cancelando');
            limpiarEstadoDrag();
            return;
        }
        
        const partidoOrigen = horariosAsignados[keyOrigen];
        const partidoDestino = horariosAsignados[keyDestino];
        
        if (!partidoOrigen) {
            console.error('❌ Error: No hay partido en origen');
            limpiarEstadoDrag();
            return;
        }
        
        // Si la celda destino está vacía: MOVER
        if (!partidoDestino) {
            console.log('📦 Moviendo a celda vacía');
            
            horariosAsignados[keyDestino] = partidoOrigen;
            delete horariosAsignados[keyOrigen];
            
            guardarHorariosRailway();
            limpiarEstadoDrag();
            generarAgenda();
            cargarCategorias();
            console.log('✅ Partido movido');
        }
        
// Si la celda destino está ocupada: INTERCAMBIAR
        else {
            console.log('🔄 Celda ocupada, preguntando por intercambio');
            
            // Construir mensaje descriptivo
            const descripcionOrigen = obtenerDescripcionPartido(partidoOrigen);
            const descripcionDestino = obtenerDescripcionPartido(partidoDestino);
            
            const confirmar = confirm(
                '🔄 INTERCAMBIAR POSICIONES\n\n' +
                `📍 Lo que mueves:\n   ${descripcionOrigen}\n\n` +
                `📍 Lo que está en destino:\n   ${descripcionDestino}\n\n` +
                '¿Intercambiar posiciones?\n\n' +
                '✅ SÍ = Intercambiar\n' +
                '❌ NO = Cancelar'
            );
            
            if (confirmar) {
                console.log('✅ Usuario confirmó intercambio');
                
                // Intercambiar usando variable temporal
                const temp = { ...partidoDestino };
                horariosAsignados[keyDestino] = { ...partidoOrigen };
                horariosAsignados[keyOrigen] = temp;
                
                guardarHorariosRailway();
                limpiarEstadoDrag();
                generarAgenda();
                cargarCategorias();
                
                alert('✅ Posiciones intercambiadas exitosamente');
                console.log('✅ Intercambio completado');
            } else {
                console.log('❌ Usuario canceló');
                limpiarEstadoDrag();
            }
        }
    }
    
    else {
        console.log('⚠️ No hay nada que soltar');
        limpiarEstadoDrag();
    }
}
// ========== FUNCIONES AUXILIARES ==========

function limpiarEstadoDrag() {
    elementoArrastrandoPanel = null;
    keyArrastrandoCelda = null;
    
    document.querySelectorAll('.dragging').forEach(el => el.classList.remove('dragging'));
    document.querySelectorAll('.dragging-celda-activa').forEach(el => el.classList.remove('dragging-celda-activa'));
}

function obtenerDescripcionPartido(partido) {
    if (partido.esEvento) {
        return `📌 ${partido.nombreEvento} (Evento)`;
    } else if (partido.esDescanso) {
        return `${partido.texto} (${partido.categoria})`;
    } else {
        return `${partido.local} vs ${partido.visitante} (${partido.categoria})`;
    }
}

function actualizarBadgesCategorias() {
    const categorias = JSON.parse(localStorage.getItem("categorias")) || [];
    categorias.forEach(cat => {
        const rol = JSON.parse(localStorage.getItem(`rol_${cat}`)) || [];
        const jornadasPendientes = [];
        
        rol.forEach((partidos, index) => {
            if (esJornadaPendiente(cat, index + 1)) {
                jornadasPendientes.push({ partidos, numero: index + 1 });
            }
        });

        const jornadasDiv = document.querySelector(`#jornadas_${cat}`);
        if (jornadasDiv && jornadasDiv.previousElementSibling) {
            const badgeElement = jornadasDiv.previousElementSibling.querySelector('.categoria-badge');
            if (badgeElement) {
                badgeElement.textContent = jornadasPendientes.length;
            }
            
            // RESTAURAR ESTADO DE CATEGORÍA
            if (categoriasAbiertas[cat]) {
                jornadasDiv.classList.add('activo');
            }
        }
        
        // RESTAURAR ESTADO DE JORNADAS
        jornadasPendientes.forEach(jornada => {
            const key = `${cat}_${jornada.numero}`;
            if (jornadasAbiertas[key]) {
                const partidosDiv = document.getElementById(`partidos_${cat}_${jornada.numero}`);
                const icon = document.getElementById(`icon_${cat}_${jornada.numero}`);
                if (partidosDiv && icon) {
                    partidosDiv.classList.add('activo');
                    icon.classList.add('expandido');
                }
            }
        });
    });
}