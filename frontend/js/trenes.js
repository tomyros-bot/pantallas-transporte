// Update clock every second
function updateClock() {
    const now = new Date();
    document.getElementById('clock').textContent = now.toLocaleTimeString('es-ES', { 
        hour: '2-digit', minute: '2-digit' 
    });
}
setInterval(updateClock, 1000);
updateClock();

async function fetchTrains() {
    const container = document.getElementById('trains-container');
    const statusMsg = document.getElementById('status-msg');
    
    try {
        // URL relativa para que funcione tanto en local como en producción
        const response = await fetch('/api/trenes');
        if (!response.ok) throw new Error('Error en red');
        
        const data = await response.json();
        
        if (data.trains && data.trains.length > 0) {
            container.innerHTML = '';
            
            // Limit to 4 trains for the screen
            const trainsToShow = data.trains.slice(0, 4);
            
            trainsToShow.forEach(train => {
                const row = document.createElement('div');
                row.className = `departure-row ${train.minutes <= 5 ? 'imminent' : ''}`;
                
                let statusHtml = '';
                if (train.minutes === 0) {
                    statusHtml = `<div class="status-text">En estación</div>`;
                } else {
                    statusHtml = `
                        <span class="minutes">${train.minutes}</span>
                        <span class="minutes-text">min</span>
                    `;
                }
                
                row.innerHTML = `
                    <div class="time-col">${train.time}</div>
                    <div class="dest-col">${train.destination}</div>
                    <div class="status-col">
                        ${statusHtml}
                    </div>
                `;
                container.appendChild(row);
            });
            
            statusMsg.textContent = 'Servicio normal';
            statusMsg.style.color = 'var(--text-muted)';
        } else {
            showError("No hay trenes programados en este momento.");
        }
        
        const now = new Date();
        document.getElementById('last-update').textContent = `Última actualización: ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
        
    } catch (error) {
        console.error('Error fetching trains:', error);
        showError("Información temporalmente no disponible. Consulta app oficial.");
    }
}

function showError(message) {
    const container = document.getElementById('trains-container');
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
fetchTrains();

// Refresh every 30 seconds
setInterval(fetchTrains, 30000);
