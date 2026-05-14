fetch('https://www.adif.es/es/w/parque-polvoranca-35011').then(r=>r.text()).then(t=>{ const m = t.match(/url.*departures/i); if(m) console.log(m[0]); }).catch(console.error);  
