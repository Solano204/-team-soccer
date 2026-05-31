// ========== GESTIÓN DE PARTIDOS Y EQUIPOS ==========

// Marcar una jornada como jugada (marca todos sus partidos)
function marcarJornadaJugada(index) {
    const jornadasJugadas = JSON.parse(localStorage.getItem(storageKeyJornadasJugadas)) || [];
    const partidosJugados = JSON.parse(localStorage.getItem(storageKeyPartidosJugados)) || {};

    if (jornadasJugadas.includes(index)) {
        const idx = jornadasJugadas.indexOf(index);
        jornadasJugadas.splice(idx, 1);
        todasLasJornadas[index].forEach((partido, pIdx) => {
            if (!partido.descanso) delete partidosJugados[`j${index}-p${pIdx}`];
        });
    } else {
        jornadasJugadas.push(index);
        todasLasJornadas[index].forEach((partido, pIdx) => {
            if (!partido.descanso) partidosJugados[`j${index}-p${pIdx}`] = true;
        });
    }

    localStorage.setItem(storageKeyJornadasJugadas, JSON.stringify(jornadasJugadas));
    localStorage.setItem(storageKeyPartidosJugados, JSON.stringify(partidosJugados));

    guardarJornadasCompletas();
    // Actualizar partidos jugados en sugerencia fija
const sugerenciaGuardada = localStorage.getItem(`sugerencia_fija_${categoria}`);
if (sugerenciaGuardada) {
    const datos = JSON.parse(sugerenciaGuardada);
    const partidoActual = todasLasJornadas[jornadaIdx][partidoIdx];
    if (partidoActual && !partidoActual.descanso) {
        const equiposBuscados = [partidoActual.local, partidoActual.visitante].sort().join('-');
        const estaJugadoAhora = !!partidosJugados[partidoKey];
        datos.jornadas.forEach((jornada, jIdx) => {
            jornada.forEach((partido, pIdx) => {
                if (!partido.descanso) {
                    const equiposSug = [partido.local, partido.visitante].sort().join('-');
                    if (equiposSug === equiposBuscados) {
                        const keySug = `j${jIdx}-p${pIdx}`;
                        if (estaJugadoAhora) {
                            datos.partidosJugados[keySug] = true;
                            if (partidosJugadosSugerencia) partidosJugadosSugerencia[keySug] = true;
                        } else {
                            delete datos.partidosJugados[keySug];
                            if (partidosJugadosSugerencia) delete partidosJugadosSugerencia[keySug];
                        }
                    }
                }
            });
        });
        localStorage.setItem(`sugerencia_fija_${categoria}`, JSON.stringify(datos));
    }
}
    guardarEstadoRailway(); // ← guardar en Railway
    mostrarRolSegunVista();
}

// Marcar un partido individual como jugado
function marcarPartidoJugado(jornadaIdx, partidoIdx) {
    console.log(`🎯 Marcando partido: Jornada ${jornadaIdx}, Partido ${partidoIdx}`);

    const partidosJugados = JSON.parse(localStorage.getItem(storageKeyPartidosJugados)) || {};
    const partidoKey = `j${jornadaIdx}-p${partidoIdx}`;

    if (partidosJugados[partidoKey]) {
        delete partidosJugados[partidoKey];
        console.log(`❌ Partido desmarcado`);
    } else {
        partidosJugados[partidoKey] = true;
        console.log(`✅ Partido marcado`);
    }

    localStorage.setItem(storageKeyPartidosJugados, JSON.stringify(partidosJugados));

    const jornadasJugadas = JSON.parse(localStorage.getItem(storageKeyJornadasJugadas)) || [];
    const partidosJornada = todasLasJornadas[jornadaIdx].filter(p => !p.descanso);
    const todosJugados = partidosJornada.every((_, pIdx) => partidosJugados[`j${jornadaIdx}-p${pIdx}`]);

    if (todosJugados && !jornadasJugadas.includes(jornadaIdx)) {
        jornadasJugadas.push(jornadaIdx);
        localStorage.setItem(storageKeyJornadasJugadas, JSON.stringify(jornadasJugadas));
    } else if (!todosJugados && jornadasJugadas.includes(jornadaIdx)) {
        jornadasJugadas.splice(jornadasJugadas.indexOf(jornadaIdx), 1);
        localStorage.setItem(storageKeyJornadasJugadas, JSON.stringify(jornadasJugadas));
    }

    guardarJornadasCompletas();
    guardarEstadoRailway(); // ← guardar en Railway
    mostrarRolSegunVista();
}

// Guardar jornadas completamente jugadas
function guardarJornadasCompletas() {
    const jornadasCompletas = [];
    const partidosJugados = JSON.parse(localStorage.getItem(storageKeyPartidosJugados)) || {};

    for (let jIdx = 0; jIdx < todasLasJornadas.length; jIdx++) {
        const jornada = todasLasJornadas[jIdx];
        const partidosNoDescanso = jornada.filter(p => !p.descanso);
        if (partidosNoDescanso.length === 0) continue;

        let todosJugados = true;
        for (let pIdx = 0; pIdx < jornada.length; pIdx++) {
            if (!jornada[pIdx].descanso && !partidosJugados[`j${jIdx}-p${pIdx}`]) {
                todosJugados = false;
                break;
            }
        }
        if (todosJugados) jornadasCompletas.push(jIdx);
    }

    localStorage.setItem(`jornadasCompletas_${categoria}`, JSON.stringify(jornadasCompletas));
    console.log(`💾 Guardadas ${jornadasCompletas.length} jornadas completas:`, jornadasCompletas);
}

// ========== MODAL AGREGAR EQUIPOS ==========

async function mostrarModalAgregar() {
    const catId = await getCategoriaId();
    let equiposDB = [];
    if (catId) {
        try {
            const res = await fetch(`${API}/equipos/${catId}`);
            const data = await res.json();
            equiposDB = data.map(e => e.nombre);
            localStorage.setItem(storageKeyEquipos, JSON.stringify(equiposDB));
        } catch(e) { console.error(e); }
    }

    const equiposEnRol = JSON.parse(localStorage.getItem(storageKeyEquiposEnRol)) || [];
    const equiposDisponibles = equiposDB.filter(eq => !equiposEnRol.includes(eq));
    const container = document.getElementById('equiposDisponibles');

    if (equiposDisponibles.length === 0) {
        container.innerHTML = '<div class="mensaje-sin-equipos">No hay equipos nuevos para agregar</div>';
    } else {
        container.innerHTML = equiposDisponibles.map(equipo => `
            <div class="equipo-checkbox">
                <input type="checkbox" id="eq-${equipo}" value="${equipo}">
                <label for="eq-${equipo}">${equipo}</label>
            </div>`).join('');
    }

    document.getElementById('overlayModal').style.display = 'block';
    document.getElementById('modalAgregar').style.display = 'block';
}

function cerrarModalAgregar() {
    document.getElementById('overlayModal').style.display = 'none';
    document.getElementById('modalAgregar').style.display = 'none';
}

function agregarEquiposAlRol() {
    const checkboxes = document.querySelectorAll('#equiposDisponibles input[type="checkbox"]:checked');
    const nuevosEquipos = Array.from(checkboxes).map(cb => cb.value);

    if (nuevosEquipos.length === 0) { alert('⚠️ Selecciona al menos un equipo'); return; }

    cerrarModalAgregar();
    mostrarAnimacionCarga("⚽ Agregando Equipos al Torneo ⚽");

    setTimeout(async () => {
        const equiposEnRol = JSON.parse(localStorage.getItem(storageKeyEquiposEnRol)) || [];
        const todosEquipos = [...equiposEnRol, ...nuevosEquipos];
        const partidosJugados = JSON.parse(localStorage.getItem(storageKeyPartidosJugados)) || {};

        const jornadasCompletasAntes = JSON.parse(localStorage.getItem(`jornadasCompletas_${categoria}`)) || [];
        const jornadasDoradasPrevias = JSON.parse(localStorage.getItem(`jornadasDoradas_${categoria}`)) || [];
        const todasLasJornadasDoradas = [...new Set([...jornadasDoradasPrevias, ...jornadasCompletasAntes])];

        localStorage.setItem(`jornadasCompletasAntes_${categoria}`, todasLasJornadasDoradas.length.toString());
        localStorage.setItem(`jornadasDoradas_${categoria}`, JSON.stringify(todasLasJornadasDoradas));

        const enfrentamientosRealizados = new Set();
        Object.keys(partidosJugados).forEach(key => {
            if (partidosJugados[key]) {
                const [j, p] = key.replace('j', '').split('-p').map(Number);
                const partido = todasLasJornadas[j][p];
                if (partido && !partido.descanso) {
                    enfrentamientosRealizados.add([partido.local, partido.visitante].sort().join('-'));
                }
            }
        });

        const numEquipos = todosEquipos.length;
        const esImpar = numEquipos % 2 !== 0;
        let equiposRotacion = [...todosEquipos];
        if (esImpar) equiposRotacion.push(null);

        const totalEquipos = equiposRotacion.length;
        const numJornadas = totalEquipos - 1;
        const jornadasConInfo = [];

        for (let jornada = 0; jornada < numJornadas; jornada++) {
            const partidosJornada = [];
            let contadorJugados = 0;

            for (let i = 0; i < totalEquipos / 2; i++) {
                const equipo1 = equiposRotacion[i];
                const equipo2 = equiposRotacion[totalEquipos - 1 - i];

                if (equipo1 === null) {
                    partidosJornada.push({ descanso: equipo2 });
                } else if (equipo2 === null) {
                    partidosJornada.push({ descanso: equipo1 });
                } else {
                    const partidoKey = [equipo1, equipo2].sort().join('-');
                    partidosJornada.push({ local: equipo1, visitante: equipo2 });
                    if (enfrentamientosRealizados.has(partidoKey)) contadorJugados++;
                }
            }

            jornadasConInfo.push({ jornada: partidosJornada, partidosJugados: contadorJugados });
            const ultimo = equiposRotacion.pop();
            equiposRotacion.splice(1, 0, ultimo);
        }

        jornadasConInfo.sort((a, b) => b.partidosJugados - a.partidosJugados);
        const nuevasJornadas = jornadasConInfo.map(info => info.jornada);

        const nuevosPartidosJugados = {};
        nuevasJornadas.forEach((jornada, jIdx) => {
            jornada.forEach((partido, pIdx) => {
                if (!partido.descanso) {
                    const pk = [partido.local, partido.visitante].sort().join('-');
                    if (enfrentamientosRealizados.has(pk)) nuevosPartidosJugados[`j${jIdx}-p${pIdx}`] = true;
                }
            });
        });

        localStorage.setItem(storageKeyRol, JSON.stringify(nuevasJornadas));
        localStorage.setItem(storageKeyEquiposEnRol, JSON.stringify(todosEquipos));
        localStorage.setItem(storageKeyPartidosJugados, JSON.stringify(nuevosPartidosJugados));
        localStorage.removeItem(storageKeyJornadasJugadas);

        todasLasJornadas = nuevasJornadas;
        jornadaActual = 0;


        localStorage.removeItem(`sugerencia_fija_${categoria}`);
rolSugerido = null;
partidosJugadosSugerencia = null;
partidosRedistribuidos.clear();
        // Guardar en Railway
        await guardarEstadoRailway();

        mostrarEstadisticas(numEquipos, nuevasJornadas);
        mostrarRolSegunVista();

        const btnSugerencia = document.querySelector('.btn-vista-sugerencia');
        if (btnSugerencia) btnSugerencia.style.display = 'inline-block';

        let mensaje = `✅ ¡${nuevosEquipos.length} equipo(s) agregado(s)!\n\n`;
        mensaje += `🔄 Rol regenerado y ordenado por partidos jugados.\n`;
        mensaje += `✓ Los partidos ya jugados aparecen marcados.\n`;
        if (todasLasJornadasDoradas.length > 0) {
            mensaje += `\n🌟 Las ${todasLasJornadasDoradas.length} jornadas doradas se mantienen.\n`;
            mensaje += `\n💡 Usa el botón "🤖 IA" para distribuir los partidos pendientes.`;
        }
        alert(mensaje);
    }, 2800);
}

// ========== DRAG & DROP ==========

function toggleModoAgregar(jornadaIdx) {
    modoAgregarActivo[jornadaIdx] = !modoAgregarActivo[jornadaIdx];
    mostrarRolSegunVista();
}

function handleDragStart(e) {
    partidoArrastrado = e.target.dataset.partidoKey;
    esPartidoAgregado = e.target.dataset.esAgregado === 'true';
    e.target.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', partidoArrastrado);
}

function handleDragEnd(e) { e.target.classList.remove('dragging'); }

function handleDragOver(e) {
    if (e.preventDefault) e.preventDefault();
    const jornadaDiv = e.currentTarget;
    const jornadaIdx = parseInt(jornadaDiv.dataset.jornadaIdx);
    if (modoAgregarActivo[jornadaIdx]) {
        jornadaDiv.classList.add('drop-zone-active');
        e.dataTransfer.dropEffect = 'move';
    } else {
        e.dataTransfer.dropEffect = 'none';
    }
    return false;
}

function handleDragLeave(e) { e.currentTarget.classList.remove('drop-zone-active'); }

function handleDrop(e, jornadaDestinoIdx) {
    if (e.stopPropagation) e.stopPropagation();
    e.currentTarget.classList.remove('drop-zone-active');

    if (!modoAgregarActivo[jornadaDestinoIdx]) {
        alert('⚠️ Activa el modo "Agregar Partido" en esta jornada primero');
        return false;
    }
    if (!partidoArrastrado) return false;

    const [jornadaOrigenStr, partidoOrigenStr] = partidoArrastrado.replace('j', '').split('-p');
    const jornadaOrigenIdx = parseInt(jornadaOrigenStr);
    const partidoOrigenIdx = parseInt(partidoOrigenStr);

    if (jornadaOrigenIdx === jornadaDestinoIdx) {
        alert('⚠️ No puedes agregar un partido a su misma jornada');
        return false;
    }

    const partidosJugados = JSON.parse(localStorage.getItem(storageKeyPartidosJugados)) || {};
    if (partidosJugados[partidoArrastrado]) {
        alert('⚠️ No puedes agregar un partido que ya fue jugado');
        return false;
    }

    const partidosMovidos   = JSON.parse(localStorage.getItem(storageKeyPartidosMovidos)) || {};
    const partidosAgregados = JSON.parse(localStorage.getItem(storageKeyPartidosAgregados)) || {};
    const partidoOriginal   = todasLasJornadas[jornadaOrigenIdx][partidoOrigenIdx];

    if (partidoOriginal.descanso) { alert('⚠️ No puedes agregar un descanso'); return false; }

    const esPartidoAgregadoQueSeMovera = partidosAgregados[partidoArrastrado];

    if (esPartidoAgregadoQueSeMovera) {
        todasLasJornadas[jornadaOrigenIdx].splice(partidoOrigenIdx, 1);
        delete partidosAgregados[partidoArrastrado];

        const nuevosPA = {};
        Object.keys(partidosAgregados).forEach(key => {
            const [j, p] = key.replace('j', '').split('-p').map(Number);
            if (j === jornadaOrigenIdx && p > partidoOrigenIdx) {
                nuevosPA[`j${j}-p${p - 1}`] = true;
            } else {
                nuevosPA[key] = partidosAgregados[key];
            }
        });

        todasLasJornadas[jornadaDestinoIdx].push({ local: partidoOriginal.local, visitante: partidoOriginal.visitante });
        const nuevoIdx = todasLasJornadas[jornadaDestinoIdx].length - 1;
        nuevosPA[`j${jornadaDestinoIdx}-p${nuevoIdx}`] = true;

        localStorage.setItem(storageKeyRol, JSON.stringify(todasLasJornadas));
        localStorage.setItem(storageKeyPartidosAgregados, JSON.stringify(nuevosPA));

        guardarEstadoRailway();
        modoAgregarActivo[jornadaDestinoIdx] = false;
        mostrarRolSegunVista();
        alert(`✅ Partido agregado movido:\n\n📤 Eliminado de Jornada ${jornadaOrigenIdx + 1}\n📥 Agregado a Jornada ${jornadaDestinoIdx + 1}`);
        return false;
    }

    if (partidosMovidos[partidoArrastrado]) {
        alert('⚠️ Este partido ya fue movido a otra jornada');
        return false;
    }

    partidosMovidos[partidoArrastrado] = true;
    localStorage.setItem(storageKeyPartidosMovidos, JSON.stringify(partidosMovidos));

    todasLasJornadas[jornadaDestinoIdx].push({ local: partidoOriginal.local, visitante: partidoOriginal.visitante });
    const nuevoIdx = todasLasJornadas[jornadaDestinoIdx].length - 1;
    partidosAgregados[`j${jornadaDestinoIdx}-p${nuevoIdx}`] = true;

    localStorage.setItem(storageKeyRol, JSON.stringify(todasLasJornadas));
    localStorage.setItem(storageKeyPartidosAgregados, JSON.stringify(partidosAgregados));

    guardarEstadoRailway();
    modoAgregarActivo[jornadaDestinoIdx] = false;
    mostrarRolSegunVista();
    alert(`✅ Partido movido:\n\n📤 Jornada ${jornadaOrigenIdx + 1} (marcado como movido)\n📥 Jornada ${jornadaDestinoIdx + 1} (partido agregado)`);
    return false;
}

function eliminarPartidoAgregado(jornadaIdx, partidoIdx) {
    if (!confirm('⚠️ ¿Eliminar este partido agregado?\n\nEl partido original volverá a su estado normal.')) return;

    const partidosAgregados = JSON.parse(localStorage.getItem(storageKeyPartidosAgregados)) || {};
    const partidosMovidos   = JSON.parse(localStorage.getItem(storageKeyPartidosMovidos)) || {};
    const partidoKey = `j${jornadaIdx}-p${partidoIdx}`;

    if (!partidosAgregados[partidoKey]) { alert('⚠️ Este no es un partido agregado'); return; }

    const partidoAEliminar = todasLasJornadas[jornadaIdx][partidoIdx];

    todasLasJornadas.forEach((jornada, jIdx) => {
        jornada.forEach((partido, pIdx) => {
            if (!partido.descanso &&
                partido.local === partidoAEliminar.local &&
                partido.visitante === partidoAEliminar.visitante &&
                jIdx !== jornadaIdx) {
                delete partidosMovidos[`j${jIdx}-p${pIdx}`];
            }
        });
    });

    todasLasJornadas[jornadaIdx].splice(partidoIdx, 1);
    delete partidosAgregados[partidoKey];

    const nuevosPA = {};
    Object.keys(partidosAgregados).forEach(key => {
        const [j, p] = key.replace('j', '').split('-p').map(Number);
        if (j === jornadaIdx && p > partidoIdx) {
            nuevosPA[`j${j}-p${p - 1}`] = true;
        } else {
            nuevosPA[key] = partidosAgregados[key];
        }
    });

    localStorage.setItem(storageKeyRol, JSON.stringify(todasLasJornadas));
    localStorage.setItem(storageKeyPartidosAgregados, JSON.stringify(nuevosPA));
    localStorage.setItem(storageKeyPartidosMovidos, JSON.stringify(partidosMovidos));

    guardarEstadoRailway();
    mostrarRolSegunVista();
    alert('✅ Partido agregado eliminado\n\n♻️ El partido original fue restaurado');
}

// ========== MODO AGREGAR EN SUGERENCIAS ==========
function toggleModoAgregarSugerencia(jornadaIdx) {
    modoAgregarActivo[jornadaIdx] = !modoAgregarActivo[jornadaIdx];
    console.log(`🔄 Modo agregar J${jornadaIdx + 1}:`, modoAgregarActivo[jornadaIdx]);
    mostrarVistaSugerencia();
}