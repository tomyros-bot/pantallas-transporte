const express = require('express');
const cors = require('cors');
const path = require('path');
const axios = require('axios');

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
            time: d.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' }),
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
    // 5_105 is Parque Polvoranca in CRTM's database
    const codStop = '5_105'; 
    const url = `https://crtm.es/widgets/api/GetStopsTimes.php?codStop=${codStop}&type=1&orderBy=2&stopTimesByIti=3`;
    
    const response = await axios.get(url, { timeout: 10000 });
    const data = response.data;
    
    if (!data || !data.stopTimes) {
        throw new Error("Respuesta inválida de la API oficial (Trenes)");
    }
    
    let times = [];
    const timesData = data.stopTimes.times?.Time;
    
    if (timesData) {
        const timeArray = Array.isArray(timesData) ? timesData : [timesData];
        times = timeArray.filter(t => {
            const diffMs = new Date(t.time) - new Date();
            return diffMs > -60000; // Only show trains that haven't departed more than 1 minute ago
        }).map(t => {
            const dateObj = new Date(t.time);
            const diffMs = dateObj - new Date();
            const diffMins = Math.max(0, Math.floor(diffMs / 60000));
            
            return {
                time: dateObj.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' }),
                destination: t.destination,
                line: t.line.shortDescription || "C5",
                platform: "-", // CRTM API does not typically provide platform numbers
                minutes: diffMins
            };
        });
    }
    
    times.sort((a, b) => a.minutes - b.minutes);
    
    if (times.length === 0) {
        throw new Error("No hay trenes programados en este momento");
    }
    
    return times;
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
    // Group multiple nearby stops around Parque Polvoranca to show more lines (482, 486, etc.)
    const codStops = ['8_15597', '8_08212', '8_08213']; 
    
    const promises = codStops.map(codStop => {
        const url = `https://crtm.es/widgets/api/GetStopsTimes.php?codStop=${codStop}&type=1&orderBy=2&stopTimesByIti=3`;
        return axios.get(url, { timeout: 10000 }).then(res => res.data);
    });
    
    const results = await Promise.allSettled(promises);
    
    let times = [];
    
    for (const result of results) {
        if (result.status === 'fulfilled' && result.value && result.value.stopTimes) {
            const timesData = result.value.stopTimes.times?.Time;
            
            if (timesData) {
                const timeArray = Array.isArray(timesData) ? timesData : [timesData];
                
                timeArray.forEach(t => {
                    const dateObj = new Date(t.time);
                    const diffMs = dateObj - new Date();
                    
                    // Only show buses that haven't departed more than 1 minute ago
                    if (diffMs > -60000) {
                        const diffMins = Math.max(0, Math.floor(diffMs / 60000));
                        
                        times.push({
                            time: dateObj.toLocaleTimeString('es-ES', { timeZone: 'Europe/Madrid', hour: '2-digit', minute: '2-digit' }),
                            destination: t.destination,
                            line: t.line.shortDescription || "Bus",
                            minutes: diffMins
                        });
                    }
                });
            }
        }
    }
    
    times.sort((a, b) => a.minutes - b.minutes);
    
    if (times.length === 0) {
        throw new Error("No hay autobuses programados en este momento");
    }
    
    return times;
}

app.get('/api/buses', async (req, res) => {
    try {
        // 1. Intentamos obtener datos reales
        let buses = await fetchRealCRTMData();
        
        res.json({
            stop: "Estación Renfe",
            line: "Varias",
            updatedAt: new Date().toISOString(),
            buses: buses,
            mode: "real"
        });
    } catch (error) {
        // 2. Fallback a datos simulados para mantener la cartelería operativa
        console.warn("Aviso: Usando datos simulados de buses (" + error.message + ")");
        
        const schedule = getUpcomingTimes(5, 20);
        const fallbackBuses = schedule.map((t, index) => ({
            time: t.time,
            destination: index % 2 === 0 ? "Madrid (Aluche)" : "Leganés",
            line: index % 2 === 0 ? "482" : "486",
            minutes: t.minutes
        }));

        res.json({
            stop: "Estación Renfe",
            line: "Varias",
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
