fetch('https://horarios.renfe.com/CER/hjcer300.jsp?CP=NO&NUCLEO=10&O=35011&D=18000').then(r=>r.text()).then(t=>console.log(t.substring(0, 500))).catch(console.error);  
