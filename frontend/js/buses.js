// Update clock every second
function updateClock() {
    const now = new Date();
    document.getElementById('clock').textContent = now.toLocaleTimeString('es-ES', { 
        hour: '2-digit', minute: '2-digit' 
    });
}
setInterval(updateClock, 1000);
updateClock();

async function fetchBuses() {
    const container = document.getElementById('buses-container');
    const statusMsg = document.getElementById('status-msg');
    
    try {
        // URL relativa para que funcione tanto en local como en producción
        const response = await fetch('/api/buses');
        if (!response.ok) throw new Error('Error en red');
        
        const data = await response.json();
        
        if (data.buses && data.buses.length > 0) {
            container.innerHTML = '';
            
            // Limit to 4 buses for the screen
            const busesToShow = data.buses.slice(0, 4);
            
            busesToShow.forEach(bus => {
                const row = document.createElement('div');
                row.className = `departure-row ${bus.minutes <= 5 ? 'imminent' : ''}`;
                
                let statusHtml = '';
                if (bus.minutes === 0) {
                    statusHtml = `<div class="status-text">En parada</div>`;
                } else {
                    statusHtml = `
                        <span class="minutes">${bus.minutes}</span>
                        <span class="minutes-text">min</span>
                    `;
                }
                
                row.innerHTML = `
                    <div class="line-col"><span class="small-badge">${bus.line}</span></div>
                    <div class="time-col">${bus.time}</div>
                    <div class="dest-col">${bus.destination}</div>
                    <div class="status-col">
                        ${statusHtml}
                    </div>
                `;
                container.appendChild(row);
            });
            
            statusMsg.textContent = 'Servicio normal';
            statusMsg.style.color = 'var(--text-muted)';
        } else {
            showError("No hay autobuses programados en este momento.");
        }
        
        const now = new Date();
        document.getElementById('last-update').textContent = `Última actualización: ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
        
    } catch (error) {
        console.error('Error fetching buses:', error);
        showError("Información temporalmente no disponible. Consulta app oficial.");
    }
}

function showError(message) {
    const container = document.getElementById('buses-container');
    container.innerHTML = `
        <div class="error-state">
            <div class="error-icon">⚠️</div>
            <div>${message}</div>
        </div>
    `;
    document.getElementById('status-msg').textContent = 'Error de conexión';
    document.getElementById('status-msg').style.color = '#ff4757';
}

// Initial fetch
fetchBuses();

// Refresh every 30 seconds
setInterval(fetchBuses, 30000);
