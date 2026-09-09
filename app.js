// Coordenadas en píxeles de las torres visibles en el mapa.
// Los puntos negros son torres de alerta sísmica y los triángulos amarillos
// también son torres de alerta sísmica. Para el proyecto se contabilizan ambos.
const black = [
[530.5,274.7],[674,280.5],[477,310.4],[615.4,337.6],[712.6,343.3],[427.5,347.9],[799.8,351.8],[556.9,368.4],[646.4,391.3],[472.6,396.4],[766.7,412.7],[860.9,412.6],[592.6,415.1],[395.4,420.1],[726.7,426.8],[319.6,461.1],[223.5,465.6],[454.5,474.2],[634.2,474.8],[799.8,474.4],[902.3,481.6],[543.5,483.6],[373.7,494.3],[719,503.4],[266.9,524.6],[882.9,535.5],[814.8,539.1],[603.3,544.7],[956.5,562.5],[324.7,565.2],[754.3,565.8],[394.6,572.6],[1011.7,590.7],[1070.8,604],[813.1,608.6],[241.7,611],[724.8,616.7],[598,622.9],[930.4,636.8],[668.5,649.7],[1188.2,648],[781,669.4],[506.5,672.6],[1113.2,681.4],[628.4,701.2],[963.4,700.4],[690.3,714.9],[843.7,728.6],[905.2,739.4],[1040.3,739.6],[1091,759.2],[985.6,761.1],[633.3,767.5],[750.2,816.9],
// Una estación adicional indicada en el conteo original del mapa.
[302,420]
];

const yellow = [
[258.3,241.2],[492.5,431.4],[174,531.1],[492.6,552.3],[658.1,580.5],[859.7,581.2],[284.9,631.6],[1033.6,669.4],[436.2,686.1],[545.4,740.3],[1169.3,745.2],[1398.2,768.3],[733.2,769.5],[668.1,784.3],[841.9,813.4],[936.1,813.2],[884.5,852.7],[977,864.3]
];

const towers = [...black.map((p,i)=>({x:p[0],y:p[1],tipo:'negra',id:i+1})), ...yellow.map((p,i)=>({x:p[0],y:p[1],tipo:'amarilla',id:black.length+i+1}))];

const img=document.getElementById('imagenMapa');
const canvas=document.getElementById('overlay');
const ctx=canvas.getContext('2d');
const resultado=document.getElementById('resultado');

function setupCanvas(){
  canvas.width=img.naturalWidth;
  canvas.height=img.naturalHeight;
  drawBase();
}

function drawBase(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // Región seleccionada, torre más cercana y usuario se dibujan aquí.
}

// Recorta un polígono contra la mediatriz entre dos torres.
function clipPolygon(poly, a, b){
  if(!poly.length) return [];
  const out=[];
  const dx=b.x-a.x, dy=b.y-a.y;
  const mx=(a.x+b.x)/2, my=(a.y+b.y)/2;
  const inside=p => (p.x-mx)*dx + (p.y-my)*dy <= 0;
  for(let i=0;i<poly.length;i++){
    const A=poly[i], B=poly[(i+1)%poly.length];
    const ia=inside(A), ib=inside(B);
    if(ia) out.push(A);
    if(ia!==ib){
      const vx=B.x-A.x, vy=B.y-A.y;
      const den=vx*dx+vy*dy;
      if(Math.abs(den)>1e-9){
        const t=((mx-A.x)*dx+(my-A.y)*dy)/den;
        out.push({x:A.x+t*vx,y:A.y+t*vy});
      }
    }
  }
  return out;
}

function voronoiCell(index){
  const s=towers[index];
  let poly=[{x:0,y:0},{x:canvas.width,y:0},{x:canvas.width,y:canvas.height},{x:0,y:canvas.height}];
  for(let j=0;j<towers.length;j++) if(j!==index) poly=clipPolygon(poly,s,towers[j]);
  return poly;
}

function distancia(a,b){return Math.hypot(a.x-b.x,a.y-b.y)}

function nearestTower(x,y){
  let best=0,bestD=Infinity;
  towers.forEach((t,i)=>{const d=distancia({x,y},t);if(d<bestD){bestD=d;best=i;}});
  return {index:best,d:bestD,tower:towers[best]};
}

function seleccionar(x,y,origen='Ubicación seleccionada'){
  const n=nearestTower(x,y);
  const cell=voronoiCell(n.index);
  drawSelection(cell,n.index,x,y);
  const tipo=n.tower.tipo==='negra'?'punto negro':'triángulo amarillo';
  resultado.innerHTML=`<h2>Resultado</h2><p><b>${origen}</b></p><p>📍 Torre más cercana: <b>Torre ${n.tower.id}</b> (${tipo})</p><p>📐 Región de Voronoi: <b>región de la Torre ${n.tower.id}</b></p><p>La región resaltada corresponde al conjunto de posiciones para las que esta torre es la más cercana.</p>`;
}

function drawSelection(cell,index,x,y){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  // Región de Voronoi resaltada.
  if(cell.length){
    ctx.beginPath();ctx.moveTo(cell[0].x,cell[0].y);
    cell.slice(1).forEach(p=>ctx.lineTo(p.x,p.y));ctx.closePath();
    ctx.fillStyle='rgba(255,190,0,.30)';ctx.fill();
    ctx.strokeStyle='#d28f00';ctx.lineWidth=4;ctx.stroke();
  }
  // Punto del usuario.
  ctx.beginPath();ctx.arc(x,y,10,0,Math.PI*2);ctx.fillStyle='#1677ff';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.stroke();
  // Torre más cercana.
  const t=towers[index];
  ctx.beginPath();ctx.arc(t.x,t.y,15,0,Math.PI*2);ctx.strokeStyle='#1677ff';ctx.lineWidth=5;ctx.stroke();
}

canvas.addEventListener('click',e=>{
  const r=canvas.getBoundingClientRect();
  const x=(e.clientX-r.left)*canvas.width/r.width;
  const y=(e.clientY-r.top)*canvas.height/r.height;
  seleccionar(x,y,'Ubicación elegida en el mapa');
});

document.getElementById('limpiar').addEventListener('click',()=>{
  drawBase();
  resultado.innerHTML='<h2>¿Cómo funciona?</h2><p>Presioná <b>Usar mi ubicación</b> o hacé clic directamente sobre el mapa para simular la ubicación de un usuario.</p><p>La aplicación calcula la torre más cercana y resalta su región de Voronoi.</p>';
});

document.getElementById('ubicacion').addEventListener('click',()=>{
  if(!navigator.geolocation){resultado.innerHTML='<h2>Error</h2><p>Este navegador no permite obtener la ubicación.</p>';return;}
  resultado.innerHTML='<h2>Buscando ubicación...</h2><p>Esperá un momento.</p>';
  navigator.geolocation.getCurrentPosition(pos=>{
    // Área aproximada cubierta por el mapa: sur/centro de México.
    const lon=pos.coords.longitude, lat=pos.coords.latitude;
    const west=-105, east=-90, north=22, south=13;
    const x=(lon-west)/(east-west)*canvas.width;
    const y=(north-lat)/(north-south)*canvas.height;
    if(x<0||x>canvas.width||y<0||y>canvas.height){
      resultado.innerHTML='<h2>Ubicación fuera del mapa</h2><p>Tu ubicación actual está fuera del área representada. Podés hacer clic sobre el mapa para probar la aplicación.</p>';
      return;
    }
    seleccionar(x,y,`Ubicación del usuario (${lat.toFixed(3)}, ${lon.toFixed(3)})`);
  },()=>{
    resultado.innerHTML='<h2>No se pudo obtener la ubicación</h2><p>Podés permitir el acceso a la ubicación o hacer clic directamente sobre el mapa para probarla.</p>';
  });
});

img.addEventListener('load',setupCanvas);
if(img.complete) setupCanvas();
