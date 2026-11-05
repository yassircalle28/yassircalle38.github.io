/* MOTO LIVE 360
   Aplicación académica: Vanilla JavaScript, DOM, BOM y eventos.
   Todas las motocicletas, precios y existencias son datos ficticios.
   Las imágenes son espacios reservados: assets/images/foto-1.jpg ... foto-7.jpg.
*/
"use strict";

const motorcycles = [
  {id:1,brand:"Yamaha",model:"YZ250F",category:"Motocross / Cross",price:8900,stock:3,image:"foto-1.jpeg",description:"Potencia equilibrada, respuesta precisa y tecnología de competición para dominar cada curva.",specs:["4 tiempos","250 cc","Inyección electrónica"],variants:["Estándar","Competición","Preparación personalizada"]},
  {id:2,brand:"Yamaha",model:"YZ450F",category:"Motocross / Cross",price:10200,stock:2,image:"foto-2.jpeg",description:"Motor de alto rendimiento y chasis ágil para pilotos que buscan máxima respuesta en pista.",specs:["4 tiempos","450 cc","Refrigeración líquida"],variants:["Estándar","Competición","Preparación personalizada"]},
  {id:3,brand:"Suzuki",model:"RM-Z450",category:"Motocross / Cross",price:9400,stock:0,image:"foto-3.jpeg",description:"Una cross enfocada en el control, la estabilidad y la aceleración en circuitos exigentes.",specs:["4 tiempos","450 cc","Inyección electrónica"],variants:["Estándar","Competición","Preparación personalizada"]},
  {id:4,brand:"Honda",model:"CRF450R",category:"Motocross / Cross",price:9900,stock:4,image:"foto-4.jpeg",description:"Diseñada para circuito, con entrega de potencia contundente y geometría deportiva.",specs:["4 tiempos","450 cc","Un cilindro"],variants:["Estándar","Competición","Preparación personalizada"]},
  {id:5,brand:"Honda",model:"CRF450RX",category:"Enduro",price:10400,stock:2,image:"foto-5.jpeg",description:"Configuración orientada al enduro, con componentes pensados para recorridos técnicos.",specs:["4 tiempos","450 cc","Enduro"],variants:["Estándar","Competición","Preparación personalizada"]},
  {id:6,brand:"KTM",model:"250 EXC",category:"Enduro",price:11200,stock:3,image:"foto-6.jpeg",description:"Ligera y versátil para rutas de enduro, senderos y terrenos cambiantes.",specs:["2 tiempos","250 cc","Enduro"],variants:["Estándar","Competición","Preparación personalizada"]},
  {id:7,brand:"KTM",model:"300 EXC",category:"Hard Enduro",price:11900,stock:1,image:"foto-7.jpeg",description:"Tracción y respuesta para superar ascensos, obstáculos y rutas de hard enduro.",specs:["2 tiempos","300 cc","Hard Enduro"],variants:["Estándar","Competición","Preparación personalizada"]}
];

const STORAGE_KEYS = {logs:"ml360_logs_v1", requests:"ml360_requests_v1", chat:"ml360_chat_v1"};
let selectedBikeId = 1;
let activeMode = "buyer";
let isLive = true;
let highlightedBikeId = null;
let logs = loadJSON(STORAGE_KEYS.logs, []);
let requests = loadJSON(STORAGE_KEYS.requests, []);
let chatHistory = loadJSON(STORAGE_KEYS.chat, []);
let lastKeyupValue = "";
let lastKeyupLoggedAt = 0;
let modalBikeId = null;

const $ = (selector, root=document) => root.querySelector(selector);
const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char]));
function loadJSON(key, fallback){try{return JSON.parse(localStorage.getItem(key)) ?? fallback;}catch(error){return fallback;}}
function saveJSON(key, value){try{localStorage.setItem(key,JSON.stringify(value));}catch(error){console.warn("No se pudo guardar en localStorage:",error);}}
function getBike(id){return motorcycles.find(bike=>bike.id===Number(id));}
function money(value){return "US$ "+Number(value).toLocaleString("en-US");}
function nowTime(){return new Date().toLocaleTimeString("es-BO",{hour12:false});}
function logEvent(type, description, day="DÍA 1", user="Comprador"){
  const entry={id:Date.now()+Math.random(),time:nowTime(),timestamp:Date.now(),type,description,day,user};
  logs.unshift(entry); if(logs.length>500) logs=logs.slice(0,500);
  saveJSON(STORAGE_KEYS.logs,logs); renderLogs();
}
function toast(message, warning=false){
  const element=document.createElement("div");element.className="toast"+(warning?" warning":"");element.textContent=message;
  $("#toastContainer").appendChild(element);setTimeout(()=>element.remove(),3200);
}
function setFeedback(message){$("#sellerFeedback").textContent=message;}
function imageMarkup(bike, className=""){
  return `<img class="${className}" src="assets/images/${encodeURIComponent(bike.image)}" alt="Fotografía de ${escapeHTML(bike.brand+" "+bike.model)}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><div class="thumb-placeholder" style="display:none">FOTO ${bike.id}</div>`;
}
function renderCatalog(){
  const brand=$("#brandFilter").value, category=$("#categoryFilter").value, availability=$("#availabilityFilter").value;
  const filtered=motorcycles.filter(b=> (!brand||b.brand===brand)&&(!category||b.category===category)&&(!availability||(availability==="available"?b.stock>0:b.stock===0)));
  $("#catalogCount").textContent=String(filtered.length).padStart(2,"0")+" MODELOS";
  $("#catalogList").innerHTML=filtered.length?filtered.map(b=>`
    <article class="bike-card ${b.id===selectedBikeId?"selected":""}" data-bike-id="${b.id}">
      <div class="bike-thumb">${imageMarkup(b)}</div>
      <div class="bike-details"><small>${escapeHTML(b.brand.toUpperCase())} · ${escapeHTML(b.category.toUpperCase())}</small><strong>${escapeHTML(b.model)}</strong><span>${b.stock>0?"● Disponible":"● Agotada"} · ${b.stock} uds.</span><b>${money(b.price)}</b></div>
      <div class="bike-actions"><button data-action="details">Ver</button><button class="select-bike" data-action="select">Seleccionar</button><button data-action="reserve">Reservar</button></div>
    </article>`).join(""):`<div class="empty-state"><strong>No hay modelos con esos filtros</strong><small>Prueba otra combinación.</small></div>`;
}
function renderBike(bikeId, shouldLog=true){
  const bike=getBike(bikeId);if(!bike)return;selectedBikeId=bike.id;
  $("#mainBikeImage").style.display="block";$("#mainBikeImage").src=`assets/images/${bike.image}`;$("#mainBikeImage").alt=`Fotografía de ${bike.brand} ${bike.model}`;
  $("#mainBikeImage").onerror=()=>{$("#mainBikeImage").style.display="none";$("#photoPlaceholder").style.display="flex";$("#photoPlaceholder").innerHTML=`<div class="placeholder-icon">＋</div><strong>FOTO ${bike.id}</strong><span>Coloca tu imagen en<br><code>assets/images/${bike.image}</code></span>`;};
  $("#photoPlaceholder").style.display="none";
  $("#stageBrand").textContent=bike.brand.toUpperCase();$("#stageModel").textContent=bike.model;$("#stageCategory").textContent=bike.category.toUpperCase();
  $("#productBrand").textContent=bike.brand.toUpperCase();$("#productTitle").textContent=bike.model;$("#productCategory").textContent=bike.category.toUpperCase();$("#productDescription").textContent=bike.description;
  $("#productSpecs").innerHTML=bike.specs.map(s=>`<span>${escapeHTML(s)}</span>`).join("");
  $("#productPrice").textContent=money(bike.price);$("#stockLabel").textContent=bike.stock>0?`● Disponible · ${bike.stock} unidades`:"● Agotada · consulta disponibilidad";$("#stockLabel").classList.toggle("unavailable",bike.stock===0);
  $("#carouselPosition").textContent=String(bike.id).padStart(2,"0")+" / 07";
  $("#sellerBikeSelect").value=String(bike.id);$("#formBikeSelect").value=String(bike.id);syncFormBike();
  renderCatalog();
  if(shouldLog)logEvent("PRODUCT_CLICK",`Seleccionó ${bike.brand} ${bike.model}.`);
}
function populateSelects(){
  const options=motorcycles.map(b=>`<option value="${b.id}">${b.brand} ${b.model}</option>`).join("");
  $("#sellerBikeSelect").innerHTML=options;$("#formBikeSelect").innerHTML=options;
  $("#sellerBikeSelect").value=String(selectedBikeId);$("#formBikeSelect").value=String(selectedBikeId);
}
function syncFormBike(){
  const bike=getBike($("#formBikeSelect").value||selectedBikeId);if(!bike)return;
  $("#formBrand").value=bike.brand;$("#formModel").value=bike.model;$("#formCategory").value=bike.category;
  const quantity=$("#quantitySelect");[...quantity.options].forEach(option=>{option.disabled=Number(option.value)>Math.max(1,bike.stock);});
  if(Number(quantity.value)>Math.max(1,bike.stock))quantity.value="1";
}
function addChatMessage(name,message,isSeller=false,time=nowTime()){
  const wrap=document.createElement("div");wrap.className="chat-message"+(isSeller?" seller-message":"");
  const initials=name.split(/\s+/).map(s=>s[0]).join("").slice(0,2).toUpperCase();
  wrap.innerHTML=`<div class="chat-avatar">${escapeHTML(initials)}</div><div class="chat-body"><div class="chat-meta"><strong>${escapeHTML(name)}</strong><time>${escapeHTML(time)}</time></div><p>${escapeHTML(message)}</p></div>`;
  $("#chatMessages").appendChild(wrap);$("#chatMessages").scrollTop=$("#chatMessages").scrollHeight;
}
function sendChat(name,message,isSeller=false){
  const clean=message.trim();if(!clean)return;
  addChatMessage(name,clean,isSeller);chatHistory.push({name,message:clean,isSeller,time:nowTime()});chatHistory=chatHistory.slice(-80);saveJSON(STORAGE_KEYS.chat,chatHistory);
  logEvent("CHAT_SEND",`${name} envió: "${clean.slice(0,80)}${clean.length>80?"…":""}"`,"DÍA 1",name);
}
function renderChatHistory(){chatHistory.forEach(m=>addChatMessage(m.name,m.message,m.isSeller,m.time));}
function showReaction(symbol="♥"){
  const el=document.createElement("span");el.className="floating-reaction";el.textContent=symbol;el.style.right=Math.floor(Math.random()*45)+"px";$("#floatingReactions").appendChild(el);setTimeout(()=>el.remove(),1600);
  logEvent("LIKE_STREAM",`El usuario envió una reacción ${symbol}.`,"DÍA 1");
}
function addRequest(data){
  const request={id:"ML360-"+Date.now().toString(36).toUpperCase(),createdAt:Date.now(),time:nowTime(),status:"Pendiente",...data};
  requests.unshift(request);saveJSON(STORAGE_KEYS.requests,requests);renderRequests();
  logEvent(data.operation==="Solicitud de compra"?"PURCHASE_REQUEST":"RESERVATION_REQUEST",`${data.fullName} solicitó ${data.operation.toLowerCase()} de ${data.brand} ${data.model} (${request.id}).`,"DÍA 2",data.fullName);
  return request;
}
function renderRequests(){
  const pending=requests.filter(r=>r.status==="Pendiente").length;
  $("#pendingCount").textContent=pending;$("#requestCount").textContent=requests.length;
  if(!requests.length){$("#notificationList").innerHTML='<div class="empty-state"><span>◷</span><strong>Sin solicitudes todavía</strong><small>Las nuevas reservas aparecerán aquí.</small></div>';return;}
  $("#notificationList").innerHTML=requests.map(r=>`<article class="notice" data-request-id="${escapeHTML(r.id)}"><div class="notice-top"><strong>${escapeHTML(r.fullName)}</strong><time>${escapeHTML(r.time)}</time></div><p>${escapeHTML(r.operation)} · ${escapeHTML(r.brand)} ${escapeHTML(r.model)}<br><span style="color:#7f8a95">${escapeHTML(r.id)} · ${escapeHTML(r.quantity)} unidad(es)</span></p><div class="notice-actions"><span class="state-pill ${r.status.toLowerCase()}">${escapeHTML(r.status)}</span>${r.status==="Pendiente"?'<button class="mini-action accept" data-action="accept">Aceptar</button><button class="mini-action reject" data-action="reject">Rechazar</button>':""}</div></article>`).join("");
}
function renderLogs(){
  const filter=$("#logFilter")?.value||"";
  const filtered=logs.filter(l=>!filter||l.day===filter||l.type===filter);
  $("#logList").innerHTML=filtered.length?filtered.map(l=>`<div class="log-entry ${l.day==="DÍA 2"?"day2":""}"><span class="log-time">[${escapeHTML(l.time)}]</span><span class="log-type">${escapeHTML(l.type)}</span><span class="log-description">${escapeHTML(l.description)} <span class="log-user">· ${escapeHTML(l.user)}</span></span></div>`).join(""):'<div class="empty-state"><strong>No hay eventos para mostrar</strong><small>Las interacciones aparecerán aquí.</small></div>';
  $("#logTotal").textContent=filtered.length+" EVENTOS";
}
function openDetails(bikeId){
  const b=getBike(bikeId);if(!b)return;modalBikeId=b.id;
  $("#modalImage").style.display="block";$("#modalImage").src=`assets/images/${b.image}`;$("#modalImage").onerror=()=>{$("#modalImage").style.display="none";$("#modalPhotoPlaceholder").style.display="flex";$("#modalPhotoPlaceholder").innerHTML=`FOTO ${b.id}<small>assets/images/${b.image}</small>`;};$("#modalPhotoPlaceholder").style.display="none";
  $("#modalBrand").textContent=b.brand.toUpperCase()+" · "+b.category.toUpperCase();$("#modalTitle").textContent=b.model;$("#modalDescription").textContent=b.description;$("#modalPrice").textContent=money(b.price);$("#modalSpecs").innerHTML=b.specs.map(s=>`<span>${escapeHTML(s)}</span>`).join("");
  $("#detailsModal").classList.add("open");$("#detailsModal").setAttribute("aria-hidden","false");logEvent("PRODUCT_DETAILS",`Consultó los detalles de ${b.brand} ${b.model}.`);
}
function closeModal(){$("#detailsModal").classList.remove("open");$("#detailsModal").setAttribute("aria-hidden","true");}
function requestForBike(bikeId,operation="Reserva"){
  const bike=getBike(bikeId);if(!bike)return;
  $("#formBikeSelect").value=String(bike.id);syncFormBike();$("#requestForm").elements.operation.value=operation;
  $("#requestPanel").scrollIntoView({behavior:"smooth",block:"center"});$("#requestForm").elements.fullName.focus();
  toast(`Completa tus datos para solicitar ${bike.brand} ${bike.model}.`,true);
  logEvent("RESERVATION_START",`Abrió el formulario para ${bike.brand} ${bike.model}.`,"DÍA 1");
}
function updateMode(mode){
  activeMode=mode;$$(".mode-btn").forEach(b=>b.classList.toggle("active",b.dataset.mode===mode));
  $("#sellerConsole").classList.toggle("hidden",mode!=="seller");
  $("#requestPanel").classList.toggle("hidden",mode!=="buyer");
  if(mode==="seller")$("#sellerConsole").scrollIntoView({behavior:"smooth",block:"nearest"});
  logEvent("MODE_CHANGE",`Cambió a la vista de ${mode==="seller"?"vendedor":"comprador"}.`,"DÍA 1",mode==="seller"?"Vendedor":"Comprador");
}
function exportCSV(){
  const rows=[["Hora","Día","Evento","Usuario","Descripción"],...logs.slice().reverse().map(l=>[l.time,l.day,l.type,l.user,l.description])];
  const csv=rows.map(row=>row.map(value=>'"'+String(value??"").replace(/"/g,'""')+'"').join(",")).join("\r\n");
  const blob=new Blob(["\ufeff"+csv],{type:"text/csv;charset=utf-8;"});const url=URL.createObjectURL(blob);
  const link=document.createElement("a");link.href=url;link.download="bitacora-moto-live-360.csv";document.body.appendChild(link);link.click();link.remove();URL.revokeObjectURL(url);
  logEvent("EXPORT_CSV","Exportó la bitácora en formato CSV.","DÍA 2","Vendedor");toast("Bitácora exportada en CSV.");
}

// Delegación de eventos: un listener en el contenedor principal detecta acciones actuales y futuras.
$("#app").addEventListener("click",event=>{
  const target=event.target;
  const modeButton=target.closest("[data-mode]");
  if(modeButton){updateMode(modeButton.dataset.mode);return;}
  const card=target.closest(".bike-card");
  if(card){
    const bikeId=Number(card.dataset.bikeId),action=target.closest("[data-action]")?.dataset.action;
    if(action==="details"){openDetails(bikeId);return;}
    if(action==="select"){renderBike(bikeId);return;}
    if(action==="reserve"){renderBike(bikeId);requestForBike(bikeId,"Reserva");return;}
  }
  const notice=target.closest(".notice");
  if(notice){
    const request=requests.find(r=>r.id===notice.dataset.requestId),action=target.closest("[data-action]")?.dataset.action;
    if(request&&action==="accept"||request&&action==="reject"){
      request.status=action==="accept"?"Aceptada":"Rechazada";saveJSON(STORAGE_KEYS.requests,requests);renderRequests();
      logEvent(action==="accept"?"RESERVATION_ACCEPTED":"RESERVATION_REJECTED",`El vendedor ${action==="accept"?"aceptó":"rechazó"} la solicitud ${request.id} de ${request.fullName}.`,"DÍA 2","Vendedor");
      toast(`Solicitud ${request.status.toLowerCase()}.`);
    }
  }
});

$("#chatForm").addEventListener("submit",event=>{event.preventDefault();const input=$("#chatInput");if(!input.value.trim())return;sendChat(activeMode==="seller"?"MOTO LIVE 360":"Tú",input.value,activeMode==="seller");input.value="";lastKeyupValue="";});
$("#chatInput").addEventListener("keyup",event=>{
  const value=event.target.value.trim(),now=Date.now();
  if(value.length>=3&&value!==lastKeyupValue&&(now-lastKeyupLoggedAt)>1200){logEvent("CHAT_INPUT",`El usuario está escribiendo un comentario (${value.length} caracteres).`,"DÍA 1","Comprador");lastKeyupValue=value;lastKeyupLoggedAt=now;}
});
$("#chatHeart").addEventListener("click",()=>showReaction("♥"));$("#chatFire").addEventListener("click",()=>showReaction("🔥"));
$("#stageHeart").addEventListener("click",()=>{showReaction("♥");});
$("#streamStage").addEventListener("dblclick",event=>{if(event.target.closest("button"))return;showReaction("💖");logEvent("DBLCLICK","Doble clic en la transmisión: envió corazones.","DÍA 1");});
$("#highlightBtn").addEventListener("click",()=>{highlightedBikeId=selectedBikeId;const b=getBike(selectedBikeId);setFeedback(`${b.brand} ${b.model} ahora es el producto destacado.`);logEvent("HIGHLIGHT_PRODUCT",`Destacó ${b.brand} ${b.model}.`,"DÍA 1","Vendedor");toast("Producto destacado en la transmisión.");});
$("#sellerHighlight").addEventListener("click",()=>$("#highlightBtn").click());
$("#sellerBikeSelect").addEventListener("change",event=>{renderBike(event.target.value);logEvent("CHANGE",`El vendedor cambió el producto presentado a ${getBike(event.target.value).model}.`,"DÍA 2","Vendedor");});
$("#formBikeSelect").addEventListener("change",event=>{const b=getBike(event.target.value);syncFormBike();logEvent("CHANGE",`Seleccionó ${b.brand} ${b.model} en el formulario.`,"DÍA 2","Comprador");});
["brandFilter","categoryFilter","availabilityFilter"].forEach(id=>$("#"+id).addEventListener("change",()=>{renderCatalog();logEvent("CHANGE",`Modificó el filtro ${id.replace("Filter","")} del catálogo.`,"DÍA 2");}));
$("#variantSelect").addEventListener("change",event=>logEvent("CHANGE",`Seleccionó variante: ${event.target.value}.`,"DÍA 2"));
$("#quantitySelect").addEventListener("change",event=>logEvent("CHANGE",`Cambió la cantidad a ${event.target.value}.`,"DÍA 2"));
$("#requestForm").addEventListener("submit",event=>{
  event.preventDefault();const form=event.currentTarget;
  if(!form.reportValidity()){logEvent("VALIDATION_ERROR","El formulario no superó la validación HTML5.","DÍA 2");return;}
  const data=Object.fromEntries(new FormData(form).entries()),bike=getBike(data.bike);
  if(!bike){toast("Selecciona una motocicleta válida.",true);return;}
  if(Number(data.quantity)>bike.stock&&bike.stock>0){toast("La cantidad supera el stock de demostración.",true);return;}
  const request=addRequest({...data,brand:bike.brand,model:bike.model,category:bike.category,price:bike.price});
  logEvent("SUBMIT",`Formulario enviado correctamente. Solicitud ${request.id}.`,"DÍA 2",data.fullName);
  $("#formFeedback").textContent=`✓ Solicitud ${request.id} recibida. El vendedor podrá revisarla en el panel de notificaciones.`;
  toast("¡Solicitud enviada! El vendedor ya recibió la notificación.");
  sendChat(data.fullName,`Acabo de enviar una ${data.operation.toLowerCase()} para ${bike.brand} ${bike.model}.`);
  form.reset();$("#formBikeSelect").value=String(bike.id);syncFormBike();
});
$("#prevBike").addEventListener("click",()=>{const next=selectedBikeId===1?7:selectedBikeId-1;renderBike(next);});
$("#nextBike").addEventListener("click",()=>{const next=selectedBikeId===7?1:selectedBikeId+1;renderBike(next);});
$("#modalSelect").addEventListener("click",()=>{renderBike(modalBikeId);closeModal();});
$("#modalReserve").addEventListener("click",()=>{const id=modalBikeId;closeModal();renderBike(id);requestForBike(id,"Reserva");});
$$("[data-close-modal]").forEach(b=>b.addEventListener("click",closeModal));
$("#detailsModal").addEventListener("click",event=>{if(event.target.id==="detailsModal")closeModal();});
document.addEventListener("keydown",event=>{if(event.key==="Escape")closeModal();});
$("#reserveQuickBtn").addEventListener("click",()=>requestForBike(selectedBikeId,"Reserva"));
$("#offerBtn").addEventListener("click",()=>{const b=getBike(selectedBikeId);const discounted=Math.round(b.price*.95);setFeedback(`OFERTA PUBLICADA: ${b.brand} ${b.model} · ${money(discounted)} (5% de descuento ficticio).`);logEvent("OFFER_PUBLISHED",`Publicó oferta de demostración para ${b.brand} ${b.model}: ${money(discounted)}.`,"DÍA 1","Vendedor");toast("Oferta de demostración publicada.");});
$("#streamToggle").addEventListener("click",()=>{isLive=!isLive;$("#liveBadge").classList.toggle("offline",!isLive);$("#liveBadge").innerHTML=isLive?"<span></span> EN VIVO":"TRANSMISIÓN FINALIZADA";$("#streamToggle").textContent=isLive?"■ Finalizar transmisión":"▶ Iniciar transmisión";setFeedback(isLive?"La transmisión está activa.":"La transmisión simulada ha finalizado.");logEvent("STREAM_STATUS",isLive?"Inició la transmisión simulada.":"Finalizó la transmisión simulada.","DÍA 1","Vendedor");});
$("#showRequests").addEventListener("click",()=>{$("#notificationList").scrollIntoView({behavior:"smooth",block:"nearest"});toast(`${requests.length} solicitudes registradas.`);});
$("#clearNotices").addEventListener("click",()=>{if(!requests.length)return;requests=[];saveJSON(STORAGE_KEYS.requests,requests);renderRequests();logEvent("NOTIFICATIONS_CLEARED","El vendedor limpió el panel de notificaciones.","DÍA 2","Vendedor");});
$("#logFilter").addEventListener("change",renderLogs);
$("#clearLog").addEventListener("click",()=>{if(!confirm("¿Seguro que deseas borrar toda la bitácora?"))return;logs=[];saveJSON(STORAGE_KEYS.logs,logs);renderLogs();});
$("#exportLog").addEventListener("click",exportCSV);
$("#shareBtn").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(location.href);toast("Enlace copiado.");}catch(error){toast("Copia la dirección desde la barra del navegador.",true);}logEvent("SHARE_LINK","Intentó compartir el enlace de la plataforma.","DÍA 1");});

// Reloj y contador de espectadores: simulación visual, sin conexión externa.
function updateClock(){$("#headerClock").textContent=nowTime();}
setInterval(updateClock,1000);updateClock();
setInterval(()=>{if(isLive){const current=Number($("#viewerCount").textContent.replace(/\D/g,""))||1284;$("#viewerCount").textContent=(current+Math.floor(Math.random()*7)-3).toLocaleString("es-BO");$("#chatOnline").textContent=120+Math.floor(Math.random()*24);}},4500);

// Inicialización de la aplicación.
populateSelects();renderBike(1,false);renderChatHistory();renderRequests();renderLogs();
if(!logs.length)logEvent("SESSION_START","Inició la plataforma MOTO LIVE 360.","DÍA 1","Sistema");
if(!chatHistory.length){
  addChatMessage("Pedro M.","¿La YZ250F está disponible?");
  addChatMessage("Laura R.","¿Hacen envíos a otros departamentos?");
  addChatMessage("MOTO LIVE 360","¡Bienvenidos! Todos los precios son de demostración.",true);
}
