fetch('https://crtm.es/widgets/api/GetStopsTimes.php?codStop=5_35011&type=1&orderBy=2&stopTimesByIti=3').then(r=>r.text()).then(console.log).catch(console.error);  
