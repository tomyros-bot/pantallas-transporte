fetch('https://www.adif.es/api/site/cercanias/station/35011/departures').then(r=>r.text()).then(console.log).catch(console.error);  
