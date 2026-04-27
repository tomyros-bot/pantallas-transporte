const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));

// Helpers to generate realistic looking mock data based on the current time
function getUpcomingTimes(count, intervalMinutes = 15) {
    const times = [];
    let currentMinOffset = Math.floor(Math.random() * 5); // next train in 0-4 mins
    
    for (let i = 0; i < count; i++) {
        const d = new Date();
        d.setMinutes(d.getMinutes() + currentMinOffset);
        
        times.push({
            time: d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            minutes: currentMinOffset
        });
        
        currentMinOffset += intervalMinutes + Math.floor(Math.random() * 5 - 2); // add ~interval mins
    }
    return times;
}

// ==========================================
// ENDPOINT: TRENES (C5 - Parque Polvoranca)
// ==========================================
async function fetchRealRenfeData() {
    // Aquí iría la lógica de extracción de tiempo real de Cercanías Renfe.
    // Dado que Renfe no tiene una API JSON pública sin autenticación, 
    // habitualmente se requiere leer de un feed GTFS-RT o hacer scraping a su visor web.
    // Si tuvieras acceso a su feed, harías algo como:
    // const response = await axios.get('URL_GTFS_RENFE');
    // return parseGtfs(response.data);
    
    throw new Error("Conexión oficial de Renfe no configurada aún.");
}

app.get('/api/trenes', async (req, res) => {
    try {
        // 1. Intentamos obtener datos reales
        let trains = await fetchRealRenfeData();
        
        res.json({
            station: "Parque Polvoranca",
            updatedAt: new Date().toISOString(),
            trains: trains,
            mode: "real"
        });
    } catch (error) {
        // 2. Si falla la conexión oficial (por mantenimiento, anti-bots, etc), 
        // pasamos al modo simulado ("fallback") para que la pantalla nunca se quede en negro.
        console.warn("Aviso: Usando datos simulados de trenes (" + error.message + ")");
        
        const schedule = getUpcomingTimes(6, 12);
        const fallbackTrains = schedule.map((t, index) => {
            const dest = index % 2 === 0 ? "Humanes" : "Móstoles-El Soto";
            return {
                time: t.time,
                destination: dest,
                line: "C5",
                platform: index % 2 === 0 ? "1" : "2",
                minutes: t.minutes
            };
        });

        res.json({
            station: "Parque Polvoranca",
            updatedAt: new Date().toISOString(),
            trains: fallbackTrains,
            mode: "simulated"
        });
    }
});

// ==========================================
// ENDPOINT: AUTOBUSES (Línea 482 - Leganés)
// ==========================================
async function fetchRealCRTMData() {
    // Aquí iría la lógica para consumir el portal de Datos Abiertos del CRTM o su widget.
    // La librería @dubisdev/crtm-api o llamadas directas a sus webservices requieren
    // un ID de parada específico (ej. 07573) y sufren cambios de esquema frecuentes.
    // const response = await axios.get('API_CRTM_TIEMPO_REAL?stop=07573');
    
    throw new Error("Conexión oficial del CRTM no configurada aún.");
}

app.get('/api/buses', async (req, res) => {
    try {
        // 1. Intentamos obtener datos reales
        let buses = await fetchRealCRTMData();
        
        res.json({
            stop: "Estación Renfe",
            line: "482",
            updatedAt: new Date().toISOString(),
            buses: buses,
            mode: "real"
        });
    } catch (error) {
        // 2. Fallback a datos simulados para mantener la cartelería operativa
        console.warn("Aviso: Usando datos simulados de buses (" + error.message + ")");
        
        const schedule = getUpcomingTimes(5, 20);
        const fallbackBuses = schedule.map(t => ({
            time: t.time,
            destination: "Madrid (Aluche)",
            line: "482",
            minutes: t.minutes
        }));

        res.json({
            stop: "Estación Renfe",
            line: "482",
            updatedAt: new Date().toISOString(),
            buses: fallbackBuses,
            mode: "simulated"
        });
    }
});

app.listen(PORT, () => {
    console.log(`Backend server running on http://localhost:${PORT}`);
    console.log(`- API Trenes: http://localhost:${PORT}/api/trenes`);
    console.log(`- API Buses: http://localhost:${PORT}/api/buses`);
});
