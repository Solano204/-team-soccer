// ========== SISTEMA DE SUGERENCIAS AUTOMÁTICAS ==========

// Variable global para guardar qué partidos fueron redistribuidos
let partidosRedistribuidos = new Set();

// Generar sugerencia (SIN aplicar automáticamente)
function generarSugerenciaAutomatica() {
    console.log("🤖 Generando sugerencia de nivelación...");
    
    const partidosJugados = JSON.parse(localStorage.getItem(storageKeyPartidosJugados)) || {};
    const jornadasOriginales = JSON.parse(localStorage.getItem(storageKeyRol)) || [];
    
    if (jornadasOriginales.length === 0) {
        alert("⚠️ No hay rol para generar sugerencias");
        return null;
    }
    
    // OBTENER TODAS LAS JORNADAS DORADAS (historial completo)
const jornadasDoradas = JSON.parse(localStorage.getItem(`jornadasDoradas_${categoria}`)) || [];

console.log(`📊 Jornadas doradas (completas): ${jornadasDoradas.length}`, jornadasDoradas);

if (jornadasDoradas.length === 0) {
    alert("⚠️ No hay jornadas jugadas previas.\n\nLa sugerencia solo funciona después de agregar equipos a un rol con jornadas ya jugadas.");
    return null;
}

// La última jornada dorada es hasta donde extraeremos partidos
const ultimaJornadaDorada = Math.max(...jornadasDoradas);
console.log(`🎯 Última jornada dorada: ${ultimaJornadaDorada + 1}`);
    
    // 1. COPIAR EL ROL ACTUAL
    const nuevasJornadas = jornadasOriginales.map(jornada => [...jornada]);
    
    // 2. IDENTIFICAR EQUIPOS NUEVOS
    const todosEquipos = new Set();
    const equiposConPartidosJugados = new Set();
    
    jornadasOriginales.forEach((jornada, jIdx) => {
        jornada.forEach((partido, pIdx) => {
            if (!partido.descanso) {
                todosEquipos.add(partido.local);
                todosEquipos.add(partido.visitante);
                
                const key = `j${jIdx}-p${pIdx}`;
                if (partidosJugados[key]) {
                    equiposConPartidosJugados.add(partido.local);
                    equiposConPartidosJugados.add(partido.visitante);
                }
            }
        });
    });
    
    const equiposNuevos = Array.from(todosEquipos).filter(eq => !equiposConPartidosJugados.has(eq));
    console.log(`🆕 Equipos nuevos detectados:`, equiposNuevos);
    
    // 3. EXTRAER PARTIDOS NO JUGADOS DE JORNADAS DORADAS
const partidosPendientes = [];
partidosRedistribuidos.clear();

// Solo procesar jornadas que están en la lista de doradas
for (let jIdx = 0; jIdx < jornadasOriginales.length; jIdx++) {
    // Verificar si esta jornada está en las jornadas doradas
    if (!jornadasDoradas.includes(jIdx)) {
        continue; // Saltar jornadas que no están doradas
    }
        const jornada = nuevasJornadas[jIdx];
        
        console.log(`\n🔍 Revisando Jornada ${jIdx + 1}...`);
        
        for (let pIdx = jornada.length - 1; pIdx >= 0; pIdx--) {
            const partido = jornada[pIdx];
            const key = `j${jIdx}-p${pIdx}`;
            
            if (!partidosJugados[key] && !partido.descanso) {
                partidosPendientes.push({
                    local: partido.local,
                    visitante: partido.visitante
                });
                
                const partidoKey = `${partido.local}-${partido.visitante}`;
                partidosRedistribuidos.add(partidoKey);
                jornada.splice(pIdx, 1);
                console.log(`  📤 Extraído: ${partido.local} vs ${partido.visitante}`);
            }
        }
    }
    
    console.log(`\n📋 Total partidos pendientes: ${partidosPendientes.length}`);
    
    if (partidosPendientes.length === 0) {
        alert("✅ No hay partidos pendientes por mover.");
        return null;
    }
    
// 4. DISTRIBUIR PARTIDOS INTELIGENTEMENTE
// Empezar desde la jornada DESPUÉS de la última dorada
const jornadaInicio = ultimaJornadaDorada + 1;
let jornadaIdx = jornadaInicio;

console.log(`📍 Iniciando distribución desde jornada ${jornadaInicio + 1}`);
    while (partidosPendientes.length > 0 && jornadaIdx < nuevasJornadas.length) {
        const jornada = nuevasJornadas[jornadaIdx];
        
        const partidosPorEquipo = {};
        jornada.forEach(partido => {
            if (!partido.descanso) {
                partidosPorEquipo[partido.local] = (partidosPorEquipo[partido.local] || 0) + 1;
                partidosPorEquipo[partido.visitante] = (partidosPorEquipo[partido.visitante] || 0) + 1;
            }
        });
        
        const equiposEnJornada = new Set(Object.keys(partidosPorEquipo));
        let partidosAgregados = 0;
        const maxPartidosPorJornada = 3;
        
        // Primera pasada: priorizar equipos que ya juegan
        for (let i = partidosPendientes.length - 1; i >= 0 && partidosAgregados < maxPartidosPorJornada; i--) {
            const partido = partidosPendientes[i];
            const partidosLocal = partidosPorEquipo[partido.local] || 0;
            const partidosVisitante = partidosPorEquipo[partido.visitante] || 0;
            
            if (partidosLocal >= 2 || partidosVisitante >= 2) continue;
            
            const localEnJornada = equiposEnJornada.has(partido.local);
            const visitanteEnJornada = equiposEnJornada.has(partido.visitante);
            
            if (localEnJornada || visitanteEnJornada) {
                jornada.push({ local: partido.local, visitante: partido.visitante });
                partidosPorEquipo[partido.local] = (partidosPorEquipo[partido.local] || 0) + 1;
                partidosPorEquipo[partido.visitante] = (partidosPorEquipo[partido.visitante] || 0) + 1;
                equiposEnJornada.add(partido.local);
                equiposEnJornada.add(partido.visitante);
                partidosPendientes.splice(i, 1);
                partidosAgregados++;
            }
        }
        
        // Segunda pasada: agregar partidos sin prioridad
        if (partidosAgregados === 0 && partidosPendientes.length > 0) {
            for (let i = partidosPendientes.length - 1; i >= 0 && partidosAgregados < maxPartidosPorJornada; i--) {
                const partido = partidosPendientes[i];
                const partidosLocal = partidosPorEquipo[partido.local] || 0;
                const partidosVisitante = partidosPorEquipo[partido.visitante] || 0;
                
                if (partidosLocal >= 2 || partidosVisitante >= 2) continue;
                
                jornada.push({ local: partido.local, visitante: partido.visitante });
                partidosPorEquipo[partido.local] = (partidosPorEquipo[partido.local] || 0) + 1;
                partidosPorEquipo[partido.visitante] = (partidosPorEquipo[partido.visitante] || 0) + 1;
                partidosPendientes.splice(i, 1);
                partidosAgregados++;
            }
        }
        
        jornadaIdx++;
if (jornadaIdx >= nuevasJornadas.length && partidosPendientes.length > 0) {
    jornadaIdx = jornadaInicio;
}
// Evitar ciclo infinito si no hay espacio
if (jornadaIdx === jornadaInicio && partidosAgregados === 0 && partidosPendientes.length > 0) {
    console.warn('⚠️ No se pueden agregar más partidos, posible ciclo infinito');
    break;
}
        if (jornadaIdx === jornadaInicio && partidosAgregados === 0 && partidosPendientes.length > 0) {
            break;
        }
    }
    
    // 5. RECONSTRUIR PARTIDOS JUGADOS
    const enfrentamientosJugados = new Set();
    Object.keys(partidosJugados).forEach(key => {
        if (partidosJugados[key]) {
            const partes = key.replace('j', '').split('-p');
            const j = parseInt(partes[0]);
            const p = parseInt(partes[1]);
            const partido = jornadasOriginales[j] && jornadasOriginales[j][p];
            if (partido && !partido.descanso) {
                const partidoKey = [partido.local, partido.visitante].sort().join('-');
                enfrentamientosJugados.add(partidoKey);
            }
        }
    });
    
    const nuevosPartidosJugados = {};
    nuevasJornadas.forEach((jornada, jIdx) => {
        jornada.forEach((partido, pIdx) => {
            if (!partido.descanso) {
                const partidoKey = [partido.local, partido.visitante].sort().join('-');
                if (enfrentamientosJugados.has(partidoKey)) {
                    nuevosPartidosJugados[`j${jIdx}-p${pIdx}`] = true;
                }
            }
        });
    });
    
    // 6. GUARDAR SUGERENCIA (NO APLICAR)
    rolSugerido = nuevasJornadas;
    partidosJugadosSugerencia = nuevosPartidosJugados;
    
    console.log("✅ Sugerencia generada");
    
    return {
        jornadas: nuevasJornadas,
        partidosJugados: nuevosPartidosJugados
    };
}

// Mostrar vista de sugerencia
function mostrarVistaSugerencia() {
    console.log("👁️ Mostrando vista de sugerencia...");

    // Cargar sugerencia fija si existe (no regenerar)
   // Siempre recargar desde localStorage para tener partidos jugados actualizados
const guardada = localStorage.getItem(`sugerencia_fija_${categoria}`);
if (guardada) {
    const datos = JSON.parse(guardada);
    rolSugerido = datos.jornadas;
    partidosJugadosSugerencia = datos.partidosJugados;
    partidosRedistribuidos = new Set(datos.redistribuidos || []);
} else {
    const resultado = generarSugerenciaAutomatica();
    if (!resultado) {
        cambiarVista('todas');
        return;
    }
    // Guardar como fija DESPUÉS de que generarSugerenciaAutomatica asignó rolSugerido
    localStorage.setItem(`sugerencia_fija_${categoria}`, JSON.stringify({
        jornadas: resultado.jornadas,
        partidosJugados: resultado.partidosJugados,
        redistribuidos: Array.from(partidosRedistribuidos)
    }));
    rolSugerido = resultado.jornadas;
    partidosJugadosSugerencia = resultado.partidosJugados;
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
            </div>
            <div class="partidos">
                ${htmlPartidos}
            </div>
        `;

        jornadasContainer.appendChild(jornadaDiv);
    });
}

// Aplicar sugerencia (YA NO SE USA, pero se mantiene por compatibilidad)
function aplicarSugerencia() {
    if (!rolSugerido || !partidosJugadosSugerencia) {
        return;
    }
    
    localStorage.setItem(storageKeyRol, JSON.stringify(rolSugerido));
    localStorage.setItem(storageKeyPartidosJugados, JSON.stringify(partidosJugadosSugerencia));
    localStorage.removeItem(storageKeyPartidosAgregados);
    localStorage.removeItem(storageKeyPartidosMovidos);
    localStorage.removeItem(storageKeyJornadasJugadas);
    localStorage.removeItem(`jornadasCompletasAntes_${categoria}`);
    
    todasLasJornadas = rolSugerido;
    jornadaActual = 0;
    
    const numEquipos = JSON.parse(localStorage.getItem(storageKeyEquiposEnRol)) || [];
    mostrarEstadisticas(numEquipos.length, todasLasJornadas);
    
    rolSugerido = null;
    partidosJugadosSugerencia = null;
    partidosRedistribuidos.clear();
    
    const btnSugerencia = document.querySelector('.btn-vista-sugerencia');
    if (btnSugerencia) {
        btnSugerencia.style.display = 'none';
    }
    
    cambiarVista('individual');
}

function cancelarSugerencia() {
    rolSugerido = null;
    partidosJugadosSugerencia = null;
    partidosRedistribuidos.clear();
    localStorage.removeItem(`sugerencia_fija_${categoria}`);
    cambiarVista('todas');
}

