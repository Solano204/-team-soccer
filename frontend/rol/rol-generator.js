// ========== GENERACIÓN Y GESTIÓN DEL ROL ==========

// Cargar datos iniciales desde Railway
async function cargarDatos() {
    const catId = await getCategoriaId();
    if (!catId) {
        jornadasContainer.innerHTML = `<div class="mensaje-info">⚠️ No se encontró la categoría. Regresa al menú y selecciona una categoría.</div>`;
        btnGenerar.disabled = true;
        return;
    }

    // Cargar equipos desde Railway
    let equipos = [];
    try {
        const res = await fetch(`${API}/equipos/${catId}`);
        equipos = await res.json();
        // Guardar en localStorage para compatibilidad con sugerencias
        localStorage.setItem(storageKeyEquipos, JSON.stringify(equipos.map(e => e.nombre)));
    } catch(e) {
        console.error('Error cargando equipos:', e);
    }

    // Cargar rol guardado desde Railway
    const estadoGuardado = await cargarEstadoRailway();

    if (estadoGuardado && estadoGuardado.jornadas && estadoGuardado.jornadas.length > 0) {
        todasLasJornadas = estadoGuardado.jornadas;

        // Restaurar estado en localStorage para compatibilidad con los JS existentes
        localStorage.setItem(storageKeyRol, JSON.stringify(estadoGuardado.jornadas));
        localStorage.setItem(storageKeyEquiposEnRol, JSON.stringify(estadoGuardado.equipos_en_rol || []));
        localStorage.setItem(storageKeyPartidosJugados, JSON.stringify(estadoGuardado.partidos_jugados || {}));
        localStorage.setItem(storageKeyJornadasJugadas, JSON.stringify(estadoGuardado.jornadas_jugadas || []));
        localStorage.setItem(`jornadasDoradas_${categoria}`, JSON.stringify(estadoGuardado.jornadas_doradas || []));
        localStorage.setItem(storageKeyPartidosAgregados, JSON.stringify(estadoGuardado.partidos_agregados || {}));
        localStorage.setItem(storageKeyPartidosMovidos, JSON.stringify(estadoGuardado.partidos_movidos || {}));

        if (estadoGuardado.jornada_actual_marcada !== null && estadoGuardado.jornada_actual_marcada !== undefined) {
    localStorage.setItem(`jornadaActual_${categoria}`, estadoGuardado.jornada_actual_marcada.toString());
}
if (estadoGuardado.sugerencia_fija) {
    localStorage.setItem(`sugerencia_fija_${categoria}`, JSON.stringify(estadoGuardado.sugerencia_fija));
}

        const numEquipos = (estadoGuardado.equipos_en_rol || []).length || equipos.length;
        mostrarEstadisticas(numEquipos, todasLasJornadas);

        if (jornadaActual >= todasLasJornadas.length) jornadaActual = 0;

        mostrarRolSegunVista();
        btnGenerar.disabled = true;

        const btnAgregar = getBtnAgregar();
        if (btnAgregar) btnAgregar.style.display = 'inline-block';

        const jornadasDoradas = estadoGuardado.jornadas_doradas || [];
        if (jornadasDoradas.length > 0) {
            const btnSugerencia = document.querySelector('.btn-vista-sugerencia');
            if (btnSugerencia) btnSugerencia.style.display = 'inline-block';
        }

    } else if (equipos.length < 2) {
        jornadasContainer.innerHTML = `
            <div class="mensaje-info">
                ⚽ Necesitas al menos 2 equipos para generar un rol de juegos.
                <strong>¡Ve a "Equipos" para agregar equipos!</strong>
            </div>`;
        btnGenerar.disabled = true;
        const btnAgregar = getBtnAgregar();
        if (btnAgregar) btnAgregar.style.display = 'none';
    } else {
        const numJornadas = equipos.length % 2 === 0 ? equipos.length - 1 : equipos.length;
        jornadasContainer.innerHTML = `
            <div class="mensaje-info">
                🏆 Tienes <strong>${equipos.length} equipos</strong> registrados.
                ¡Presiona <strong>"Crear Rol"</strong> para generar el calendario!
                <br><br>Se generarán <strong>${numJornadas} jornadas</strong>.
            </div>`;
        const btnAgregar = getBtnAgregar();
        if (btnAgregar) btnAgregar.style.display = 'none';
    }
}

// Generar rol completo (Round-Robin)
async function generarRol() {
    const catId = await getCategoriaId();
    if (!catId) { alert('⚠️ No se encontró la categoría'); return; }

    let equipos = [];
    try {
        const res = await fetch(`${API}/equipos/${catId}`);
        const data = await res.json();
        equipos = data.map(e => e.nombre);
    } catch(e) {
        alert('⚠️ Error cargando equipos desde el servidor');
        return;
    }

    if (equipos.length < 2) {
        alert("⚠️ Necesitas al menos 2 equipos para generar un rol.");
        return;
    }

    mostrarAnimacionCarga("🏆 Generando Rol de Juegos 🏆");

    setTimeout(async () => {
        // Limpiar datos anteriores
        localStorage.removeItem(`jornadasCompletas_${categoria}`);
        localStorage.removeItem(`jornadasDoradas_${categoria}`);
        localStorage.removeItem(`jornadasCompletasAntes_${categoria}`);
        localStorage.removeItem(storageKeyPartidosJugados);
        localStorage.removeItem(storageKeyPartidosAgregados);
        localStorage.removeItem(storageKeyPartidosMovidos);
        localStorage.removeItem(storageKeyJornadasJugadas);
        localStorage.removeItem(`jornadaActual_${categoria}`);
        localStorage.removeItem(`sugerencia_fija_${categoria}`);

        const numEquipos = equipos.length;
        const esImpar = numEquipos % 2 !== 0;
        let equiposRotacion = [...equipos];
        if (esImpar) equiposRotacion.push(null);

        const totalEquipos = equiposRotacion.length;
        const numJornadas = totalEquipos - 1;
        const jornadas = [];

        for (let jornada = 0; jornada < numJornadas; jornada++) {
            const partidosJornada = [];
            for (let i = 0; i < totalEquipos / 2; i++) {
                const equipo1 = equiposRotacion[i];
                const equipo2 = equiposRotacion[totalEquipos - 1 - i];
                if (equipo1 === null) {
                    partidosJornada.push({ descanso: equipo2 });
                } else if (equipo2 === null) {
                    partidosJornada.push({ descanso: equipo1 });
                } else {
                    partidosJornada.push({ local: equipo1, visitante: equipo2 });
                }
            }
            jornadas.push(partidosJornada);
            const ultimo = equiposRotacion.pop();
            equiposRotacion.splice(1, 0, ultimo);
        }

        // Guardar en localStorage
        localStorage.setItem(storageKeyRol, JSON.stringify(jornadas));
        localStorage.setItem(storageKeyEquiposEnRol, JSON.stringify(equipos));
        todasLasJornadas = jornadas;
        jornadaActual = 0;

        // Guardar en Railway
        await guardarEstadoRailway();

        mostrarEstadisticas(numEquipos, jornadas);
        mostrarRolSegunVista();
        btnGenerar.disabled = true;

        const btnAgregar = getBtnAgregar();
        if (btnAgregar) btnAgregar.style.display = 'inline-block';

        const btnSugerencia = document.querySelector('.btn-vista-sugerencia');
        if (btnSugerencia) btnSugerencia.style.display = 'none';

        alert(`✅ ¡Rol generado exitosamente!\n\n📊 ${numJornadas} jornadas creadas\n⚽ ${numEquipos} equipos participantes`);
    }, 2800);
}

// Eliminar rol
async function eliminarRol() {
    if (confirm("⚠️ ¿Estás seguro de que quieres eliminar el rol de juegos?\n\nEsta acción borrará ABSOLUTAMENTE TODO.\n\n🗑️ No se puede deshacer.")) {
        // Limpiar localStorage
        localStorage.removeItem(storageKeyRol);
        localStorage.removeItem(storageKeyJornadasJugadas);
        localStorage.removeItem(storageKeyEquiposEnRol);
        localStorage.removeItem(storageKeyPartidosJugados);
        localStorage.removeItem(storageKeyPartidosAgregados);
        localStorage.removeItem(storageKeyPartidosMovidos);
        localStorage.removeItem(`jornadasCompletas_${categoria}`);
        localStorage.removeItem(`jornadasDoradas_${categoria}`);
        localStorage.removeItem(`jornadasCompletasAntes_${categoria}`);
        localStorage.removeItem(`jornadaActual_${categoria}`);

        // Eliminar de Railway
        await eliminarRolRailway();

        // Limpiar variables
        todasLasJornadas = [];
        jornadaActual = 0;
        rolSugerido = null;
        partidosJugadosSugerencia = null;

        document.getElementById('estadisticasContainer').style.display = 'none';
        document.getElementById('navegacionContainer').style.display = 'none';

        jornadasContainer.innerHTML = `
            <div class="mensaje-info">
                ✅ Rol eliminado exitosamente.
                <strong>¡Presiona "Crear Rol" para generar uno nuevo!</strong>
            </div>`;

        btnGenerar.disabled = false;

        const btnAgregar = getBtnAgregar();
        if (btnAgregar) btnAgregar.style.display = 'none';

        const btnSugerencia = document.querySelector('.btn-vista-sugerencia');
        if (btnSugerencia) btnSugerencia.style.display = 'none';
    }
}

// Descargar PDF (sin cambios)
async function descargarPDF() {
    const { jsPDF } = window.jspdf;

    const contenedorPDF = document.createElement('div');
    contenedorPDF.id = 'contenedor-pdf-temp';
    contenedorPDF.style.cssText = `
        position: absolute; left: -9999px; top: 0;
        width: 1000px; background: white; padding: 30px;
        font-family: 'Outfit', sans-serif;
    `;

    const numJornadas = todasLasJornadas.length;
    let columnas = 2, tamañoJornada = 'grande';
    if (numJornadas <= 4)       { columnas = 2; tamañoJornada = 'grande'; }
    else if (numJornadas <= 9)  { columnas = 3; tamañoJornada = 'mediano'; }
    else if (numJornadas <= 16) { columnas = 4; tamañoJornada = 'pequeño'; }
    else                        { columnas = 5; tamañoJornada = 'muy-pequeño'; }

    contenedorPDF.innerHTML = `
        <div style="text-align:center;margin-bottom:25px;border-bottom:5px solid #000;padding-bottom:20px;">
            <h1 style="font-family:'Bebas Neue',sans-serif;font-size:56px;margin:0;color:#f59e0b;letter-spacing:3px;">FUT 7 EL JAGUAR</h1>
            <h2 style="font-family:'Bebas Neue',sans-serif;font-size:38px;margin:10px 0 0;color:#ef4444;">${categoria.toUpperCase()}</h2>
        </div>
        <div id="jornadas-pdf-grid" style="display:grid;grid-template-columns:repeat(${columnas},1fr);gap:15px;width:100%;"></div>`;

    const jornadasGrid = contenedorPDF.querySelector('#jornadas-pdf-grid');
    const estilos = {
        'grande':      { fontSize:'15px', headerSize:'22px', padding:'10px', paddingPartido:'8px', vsSize:'11px', vsPadding:'4px 10px' },
        'mediano':     { fontSize:'13px', headerSize:'18px', padding:'8px',  paddingPartido:'7px', vsSize:'10px', vsPadding:'3px 8px' },
        'pequeño':     { fontSize:'11px', headerSize:'15px', padding:'6px',  paddingPartido:'5px', vsSize:'9px',  vsPadding:'2px 6px' },
        'muy-pequeño': { fontSize:'9px',  headerSize:'13px', padding:'5px',  paddingPartido:'4px', vsSize:'8px',  vsPadding:'2px 5px' }
    };
    const estilo = estilos[tamañoJornada];

    todasLasJornadas.forEach((partidosJornada, index) => {
        const jornadaDiv = document.createElement('div');
        jornadaDiv.style.cssText = `background:#f8f9fa;border:3px solid #000;border-radius:8px;overflow:hidden;box-shadow:3px 3px 0 #000;height:fit-content;`;

        let partidosHTML = '';
        partidosJornada.forEach(partido => {
            if (partido.descanso) {
                partidosHTML += `<div style="background:linear-gradient(135deg,#e1bee7,#ce93d8);padding:${estilo.paddingPartido};text-align:center;border-bottom:2px solid #000;font-weight:700;font-size:${estilo.fontSize};color:#4a148c;">💤 ${partido.descanso}</div>`;
            } else {
                partidosHTML += `
                    <div style="background:white;padding:${estilo.paddingPartido};display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #e0e0e0;font-weight:700;font-size:${estilo.fontSize};gap:5px;">
                        <span style="flex:1;text-align:right;">${partido.local}</span>
                        <span style="background:linear-gradient(135deg,#ef4444,#dc2626);color:white;padding:${estilo.vsPadding};border-radius:5px;font-size:${estilo.vsSize};border:2px solid #000;flex-shrink:0;">VS</span>
                        <span style="flex:1;text-align:left;">${partido.visitante}</span>
                    </div>`;
            }
        });

        jornadaDiv.innerHTML = `
            <div style="background:linear-gradient(135deg,#f59e0b,#d97706);color:white;padding:${estilo.padding};text-align:center;border-bottom:3px solid #000;">
                <h3 style="font-family:'Bebas Neue',sans-serif;font-size:${estilo.headerSize};margin:0;letter-spacing:1px;">JORNADA ${index + 1}</h3>
            </div>${partidosHTML}`;
        jornadasGrid.appendChild(jornadaDiv);
    });

    document.body.appendChild(contenedorPDF);
    await new Promise(res => setTimeout(res, 500));

    const canvas = await html2canvas(contenedorPDF, { scale:2.5, useCORS:true, backgroundColor:"#ffffff", logging:false });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("portrait","pt","letter");
    const pageWidth  = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgProps   = pdf.getImageProperties(imgData);
    const imgWidth   = pageWidth - 20;
    const imgHeight  = (imgProps.height * imgWidth) / imgProps.width;

    if (imgHeight > pageHeight - 20) {
        const ratio = (pageHeight - 20) / imgHeight;
        pdf.addImage(imgData,"PNG",(pageWidth - imgWidth*ratio)/2, 10, imgWidth*ratio, imgHeight*ratio);
    } else {
        pdf.addImage(imgData,"PNG",(pageWidth - imgWidth)/2, 10, imgWidth, imgHeight);
    }

    pdf.save(`FUT7_EL_JAGUAR_${categoria}.pdf`);
    document.body.removeChild(contenedorPDF);
    alert('✅ PDF generado exitosamente');
}

// Inicializar
cargarDatos();