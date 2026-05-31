// ========== ANIMACIÓN DE CARGA CON JAGUAR ==========

// Mostrar animación de carga
function mostrarAnimacionCarga(mensaje = "Generando rol...") {
    console.log("🎬 Iniciando animación..."); // Debug
    
    // Crear overlay
    const overlay = document.createElement('div');
    overlay.id = 'loadingOverlay';
    overlay.className = 'loading-overlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.95);
        backdrop-filter: blur(10px);
        z-index: 9999;
        display: flex;
        align-items: center;
        justify-content: center;
        animation: fadeIn 0.3s ease;
    `;
    
    // Crear contenedor de la animación
    const container = document.createElement('div');
    container.className = 'loading-container';
    
    container.innerHTML = `
        <div class="loading-content">
            <div class="loading-track">
                <div class="jaguar-runner" id="jaguarRunner">🐆</div>
                <div class="track-line"></div>
            </div>
            <div class="loading-text" id="loadingText">${mensaje}</div>
            <div class="loading-bar-container">
                <div class="loading-bar" id="loadingBar"></div>
                <div class="loading-percentage" id="loadingPercentage">0%</div>
            </div>
        </div>
    `;
    
    overlay.appendChild(container);
    document.body.appendChild(overlay);
    
    console.log("✅ Overlay agregado al DOM"); // Debug
    
    // Iniciar animación después de un frame
    requestAnimationFrame(() => {
        animarCarga();
    });
}

// Animar el progreso
function animarCarga() {
    console.log("🏃 Iniciando animación del jaguar..."); // Debug
    
    const jaguar = document.getElementById('jaguarRunner');
    const bar = document.getElementById('loadingBar');
    const percentage = document.getElementById('loadingPercentage');
    
    if (!jaguar || !bar || !percentage) {
        console.error("❌ No se encontraron los elementos de la animación");
        return;
    }
    
    let progress = 0;
    const duration = 2500; // 2.5 segundos
    const interval = 20; // Actualizar cada 20ms
    const increment = (100 / duration) * interval;
    
    const progressInterval = setInterval(() => {
        progress += increment;
        
        if (progress >= 100) {
            progress = 100;
            clearInterval(progressInterval);
            
            console.log("✅ Animación completada al 100%"); // Debug
            
            // Pequeña pausa antes de ocultar
            setTimeout(() => {
                ocultarAnimacionCarga();
            }, 300);
        }
        
        // Actualizar barra y porcentaje
        bar.style.width = progress + '%';
        percentage.textContent = Math.floor(progress) + '%';
        
        // Mover jaguar
        jaguar.style.left = progress + '%';
        
        // Agregar efecto de velocidad variable
        if (progress < 30) {
            jaguar.style.transform = 'translateX(-50%) scaleX(-1) scale(1.1)';
        } else if (progress < 70) {
            jaguar.style.transform = 'translateX(-50%) scaleX(-1) scale(1.3) rotate(5deg)';
        } else {
            jaguar.style.transform = 'translateX(-50%) scaleX(-1) scale(1.5) rotate(8deg)';
        }
    }, interval);
}

// Ocultar animación
function ocultarAnimacionCarga() {
    console.log("👋 Ocultando animación..."); // Debug
    
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
        overlay.style.animation = 'fadeOut 0.4s ease forwards';
        setTimeout(() => {
            overlay.remove();
            console.log("✅ Overlay eliminado"); // Debug
        }, 400);
    }
}

// Inyectar estilos CSS inmediatamente
(function inyectarEstilosAnimacion() {
    if (document.getElementById('loadingAnimationStyles')) {
        console.log("⚠️ Los estilos ya están inyectados");
        return;
    }
    
    const style = document.createElement('style');
    style.id = 'loadingAnimationStyles';
    style.textContent = `
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        .loading-container {
            text-align: center;
            max-width: 600px;
            width: 90%;
        }
        
        .loading-content {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 3rem 2rem;
            border-radius: 25px;
            border: 6px solid #000;
            box-shadow: 
                0 20px 60px rgba(0,0,0,0.8),
                inset 0 0 30px rgba(255,255,255,0.1);
        }
        
        .loading-track {
            position: relative;
            width: 100%;
            height: 80px;
            margin-bottom: 2rem;
        }
        
        .track-line {
            position: absolute;
            bottom: 20px;
            left: 0;
            width: 100%;
            height: 4px;
            background: linear-gradient(90deg, 
                #fff 0%, 
                #ffeaa7 25%, 
                #fdcb6e 50%, 
                #ff9800 75%, 
                #ff6b6b 100%
            );
            border-radius: 2px;
            box-shadow: 0 0 20px rgba(255,255,255,0.5);
        }
        
        .jaguar-runner {
            position: absolute;
            bottom: 15px;
            left: 0;
            font-size: 4rem;
            transform: translateX(-50%) scaleX(-1);
            transition: all 0.02s linear;
            filter: drop-shadow(0 5px 15px rgba(0,0,0,0.8));
            animation: jaguarBounce 0.15s ease-in-out infinite;
        }
        
        @keyframes jaguarBounce {
            0%, 100% { bottom: 15px; }
            50% { bottom: 25px; }
        }
        
        .loading-text {
            font-family: 'Bangers', cursive;
            color: #fff;
            font-size: 2rem;
            margin-bottom: 1.5rem;
            text-shadow: 
                3px 3px 0 #000,
                -2px -2px 0 #000,
                2px -2px 0 #000,
                -2px 2px 0 #000;
            letter-spacing: 2px;
            animation: textPulse 1s ease-in-out infinite;
        }
        
        @keyframes textPulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
        }
        
        .loading-bar-container {
            position: relative;
            width: 100%;
            height: 40px;
            background: rgba(0, 0, 0, 0.3);
            border-radius: 20px;
            border: 4px solid #000;
            overflow: hidden;
            box-shadow: inset 0 5px 15px rgba(0,0,0,0.5);
        }
        
        .loading-bar {
            position: absolute;
            top: 0;
            left: 0;
            height: 100%;
            width: 0%;
            background: linear-gradient(90deg, 
                #4ecca3 0%, 
                #2ecc71 25%,
                #ffeaa7 50%,
                #fdcb6e 75%,
                #ff6b6b 100%
            );
            border-radius: 16px;
            transition: width 0.02s linear;
            box-shadow: 
                0 0 20px rgba(78, 204, 163, 0.8),
                inset 0 2px 10px rgba(255,255,255,0.3);
            animation: barShine 2s ease-in-out infinite;
        }
        
        @keyframes barShine {
            0% { filter: brightness(1); }
            50% { filter: brightness(1.3); }
            100% { filter: brightness(1); }
        }
        
        .loading-percentage {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            font-family: 'Bangers', cursive;
            font-size: 1.5rem;
            font-weight: 900;
            color: #fff;
            text-shadow: 
                2px 2px 0 #000,
                -1px -1px 0 #000,
                1px -1px 0 #000,
                -1px 1px 0 #000;
            z-index: 10;
        }
        
        /* Responsive */
        @media (max-width: 768px) {
            .loading-content {
                padding: 2rem 1.5rem;
            }
            
            .loading-text {
                font-size: 1.5rem;
            }
            
            .jaguar-runner {
                font-size: 3rem;
            }
            
            .loading-bar-container {
                height: 35px;
            }
            
            .loading-percentage {
                font-size: 1.2rem;
            }
        }
    `;
    
    document.head.appendChild(style);
    console.log("✅ Estilos de animación inyectados"); // Debug
})();