/* ===== Utilidades ===== */
const $ = s => document.querySelector(s);
const hoje = () => new Date().toISOString().slice(0,10);
function load(k, def){ try{ return JSON.parse(localStorage.getItem(k)) ?? def; }catch{ return def; } }
function save(k,v){ localStorage.setItem(k, JSON.stringify(v)); }

/* ===== Abas ===== */
document.querySelectorAll('.tab').forEach(t => t.addEventListener('click', () => {
  document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));
  document.querySelectorAll('.panel').forEach(x=>x.classList.remove('active'));
  t.classList.add('active');
  $('#'+t.dataset.tab).classList.add('active');
  if(t.dataset.tab==='progresso') renderProgresso();
}));

/* ===== Pomodoro ===== */
let dur = 25*60, rest = dur, timer = null, running = false;
let pomodoros = load('sh_pomodoros', {});
if(!pomodoros[hoje()]) pomodoros[hoje()] = 0;

const disp = $('#timer-display');
function paint(){ disp.textContent = `${String(Math.floor(rest/60)).padStart(2,'0')}:${String(rest%60).padStart(2,'0')}`; }
function setMode(foco){
  dur = (foco?25:5)*60; rest = dur; paint();
  $('#mode-focus').classList.toggle('active', foco);
  $('#mode-break').classList.toggle('active', !foco);
}
$('#mode-focus').onclick = () => { stop(); setMode(true); };
$('#mode-break').onclick = () => { stop(); setMode(false); };
function stop(){ clearInterval(timer); timer=null; running=false; $('#btn-start').textContent='▶ Iniciar'; }
$('#btn-start').onclick = () => {
  if(running){ stop(); return; }
  running = true; $('#btn-start').textContent = '⏸ Pausar';
  timer = setInterval(() => {
    rest--;
    if(rest <= 0){
      clearInterval(timer); stop();
      if(dur === 25*60){ pomodoros[hoje()] = (pomodoros[hoje()]||0)+1; save('sh_pomodoros', pomodoros); renderCount(); }
      setMode(dur !== 25*60);
      alert(dur===25*60 ? '⏰ Tempo! Faz uma pausa de 5 min.' : '☕ Pausa acabou — volta ao foco!');
    }
    paint();
  }, 1000);
};
$('#btn-reset').onclick = () => { stop(); rest = dur; paint(); };
function renderCount(){ $('#pomodoro-count').textContent = `Pomodoros hoje: ${pomodoros[hoje()]||0}`; }
paint(); renderCount();

/* ===== Flashcards ===== */
let cards = load('sh_cards', []);
let idx = 0, flipped = false;

$('#fc-add').onclick = () => {
  const q = $('#fc-q').value.trim(), a = $('#fc-a').value.trim();
  if(!q || !a) return alert('Preenche pergunta e resposta!');
  cards.push({q, a}); save('sh_cards', cards);
  $('#fc-q').value = ''; $('#fc-a').value = '';
  renderFC();
};
function flipCard(){
  flipped = !flipped;
  const c = cards[idx];
  $('#fc-side').textContent = flipped ? c.a : c.q;
  $('#fc-side').classList.toggle('flip', flipped);
}
function nextCard(){ idx = (idx+1) % cards.length; flipped = false; renderFC(); }
function prevCard(){ idx = (idx-1+cards.length) % cards.length; flipped = false; renderFC(); }
function renderFC(){
  $('#fc-empty').classList.toggle('hidden', cards.length > 0);
  $('#fc-card').classList.toggle('hidden', cards.length === 0);
  if(cards.length){
    flipped = false;
    $('#fc-side').textContent = cards[idx].q;
    $('#fc-side').classList.remove('flip');
    $('#fc-progress').textContent = `Card ${idx+1} de ${cards.length}`;
  }
}
renderFC();

/* ===== Notas ===== */
let notas = load('sh_notas', []);
$('#nota-add').onclick = () => {
  const t = $('#nota-titulo').value.trim(), x = $('#nota-texto').value.trim();
  if(!t) return alert('Falta o título!');
  notas.unshift({t, x, d: hoje()}); save('sh_notas', notas);
  $('#nota-titulo').value = ''; $('#nota-texto').value = '';
  renderNotas();
};
function delNota(i){ if(confirm('Apagar esta nota?')){ notas.splice(i,1); save('sh_notas', notas); renderNotas(); } }
function renderNotas(){
  $('#notas-lista').innerHTML = notas.map((n,i) => `
    <div class="nota"><button class="btn-del" onclick="delNota(${i})">🗑</button>
    <h4>${esc(n.t)}</h4><p>${esc(n.x)}</p>
    <p class="muted">${n.d}</p></div>`).join('') || '<p class="muted">Sem notas ainda.</p>';
}
function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;'); }
renderNotas();

/* ===== Progresso ===== */
function renderProgresso(){
  $('#stat-pomodoros').textContent = Object.values(pomodoros).reduce((a,b)=>a+b,0);
  $('#stat-flashcards').textContent = cards.length;
  $('#stat-notas').textContent = notas.length;

  const dias = [...Array(7)].map((_,i) => {
    const d = new Date(); d.setDate(d.getDate()-6+i);
    return d.toISOString().slice(0,10);
  });
  const max = Math.max(1, ...dias.map(d => pomodoros[d]||0));
  $('#chart').innerHTML = dias.map(d => {
    const v = pomodoros[d]||0;
    return `<div class="bar" style="height:${(v/max)*90}%" title="${v} pomodoros"><span>${d.slice(8)}/${d.slice(5,7)}</span></div>`;
  }).join('');
}
