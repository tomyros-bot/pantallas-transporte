fetch('https://horarios.renfe.com/cer/hjcer310.jsp?nucleo=10&o=35011&d=18000').then(r=>r.text()).then(t=>console.log(t.substring(0, 500))).catch(console.error);  
