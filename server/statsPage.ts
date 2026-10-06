// Self-contained page for the organisers: open /stats?key=HOST_KEY on your own phone
export const STATS_PAGE = `<!doctype html>
<html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Refleks Arenası - Sayaç</title>
<style>
  body{margin:0;font-family:system-ui,sans-serif;background:#13112e;color:#fff;padding:20px;max-width:560px;margin:auto}
  h1{font-size:18px;color:#facc15;letter-spacing:.08em;text-transform:uppercase}
  h2{font-size:14px;color:#93c5fd;letter-spacing:.08em;text-transform:uppercase;margin:26px 0 8px}
  .big{background:#25214f;border-radius:20px;padding:22px;text-align:center;margin:14px 0}
  .big b{display:block;font-size:64px;line-height:1;color:#facc15}
  .big span{color:#93c5fd;font-weight:700}
  .row{display:flex;gap:12px}.row .big{flex:1}.row .big b{font-size:36px}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  td,th{padding:8px 4px;border-bottom:1px solid #ffffff22;text-align:right}
  td:first-child,th:first-child{text-align:left}
  small{color:#ffffff88}
  label{display:block;font-size:13px;color:#ffffffaa;margin-top:10px}
  input[type=number],input[type=text]{width:100%;box-sizing:border-box;padding:10px;border-radius:10px;border:1px solid #ffffff33;background:#0f0d24;color:#fff;font-size:16px}
  button{margin-top:12px;padding:10px 16px;border:0;border-radius:10px;background:#facc15;color:#2b1b5e;font-weight:800;font-size:15px}
  .award{background:#25214f;border-radius:14px;padding:12px;margin:8px 0;display:flex;align-items:center;gap:10px}
  .award.done{opacity:.5}
  .code{font-family:ui-monospace,monospace;font-size:22px;font-weight:800;color:#facc15;letter-spacing:.1em}
  .award .info{flex:1;min-width:0}.award .info div{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .award input{width:24px;height:24px}
</style></head><body>
<h1>⚡ Refleks Arenası · Sayaç</h1>
<div id="err" style="color:#fca5a5"></div>
<div class="big"><b id="tp">–</b><span>bugün oynayan kişi</span></div>
<div class="row">
  <div class="big"><b id="tr">–</b><span>bugünkü tur</span></div>
  <div class="big"><b id="all">–</b><span>toplam kişi</span></div>
</div>

<h2>🎁 Ödüller</h2>
<div class="row">
  <div class="big"><b id="rem">–</b><span>kalan ödül</span></div>
  <div class="big"><b id="given">–</b><span>kazanan (bugün)</span></div>
</div>
<div id="awards"></div>
<small id="backupNote"></small>

<h2>Kademeler</h2>
<div id="tierRem" style="color:#93c5fd;font-size:14px"></div>
<div id="tiers"></div>
<button id="save">Kaydet</button> <small id="saved"></small>

<h2>Son günler</h2>
<table><thead><tr><th>Gün</th><th>Kişi</th><th>Tur</th></tr></thead><tbody id="days"></tbody></table>
<p><small>Aynı kişi tekrar oynarsa tekrar sayılır. Sunucu yeniden başlarsa veya yeni sürüm yüklenirse sunucu sayaçları sıfırlanabilir; ödül listesi bu telefonda da yedeklenir.</small></p>
<script>
  const key = new URLSearchParams(location.search).get('key') || '';
  const BK = 'refleks_awards_backup';
  let formFilled = false;
  const esc = (t)=>String(t).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function readBackup(){ try{ return JSON.parse(localStorage.getItem(BK)||'{}'); }catch(e){ return {}; } }
  function writeBackup(b){ try{ localStorage.setItem(BK, JSON.stringify(b)); }catch(e){} }
  async function post(url, body){
    const r = await fetch(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.assign({key:key},body))});
    return r.ok ? r.json() : null;
  }
  async function claim(code, v){
    const b = readBackup(); if(b[code]) { b[code].claimed = v; writeBackup(b); }
    await post('/api/prizes/claim',{code:code, claimed:v}); load();
  }
  window.claim = claim;
  function renderAwards(server, limit){
    const b = readBackup(); const today = server.date;
    server.list.forEach(function(a){ b[a.code] = Object.assign({}, a, {claimed: a.claimed || (b[a.code] && b[a.code].claimed)}); });
    writeBackup(b);
    const mine = Object.values(b).filter(function(a){return a.date===today;}).sort(function(x,y){return y.time.localeCompare(x.time);});
    const onServer = new Set(server.list.map(function(a){return a.code;}));
    const lost = mine.filter(function(a){return !onServer.has(a.code);}).length;
    document.getElementById('backupNote').textContent = lost ? ('Uyarı: '+lost+' ödül sunucuda görünmüyor (sunucu yeniden başlamış olabilir); bu telefonun kaydından gösteriliyor.') : '';
    document.getElementById('given').textContent = mine.length;
    document.getElementById('rem').textContent = Math.max(0, limit - mine.length);
    document.getElementById('awards').innerHTML = mine.map(function(a){
      return '<div class="award'+(a.claimed?' done':'')+'"><span class="code">'+esc(a.code)+'</span><div class="info"><div><b>'+esc(a.avatar)+' '+esc(a.name)+'</b></div><div><small>'+esc(a.prize)+' · '+esc(a.score)+' puan · '+esc(a.time)+'</small></div></div>'
      +'<label style="margin:0"><small>Verildi</small><input type="checkbox" '+(a.claimed?'checked':'')+' onchange="claim(\\''+esc(a.code)+'\\',this.checked)"></label></div>';
    }).join('');
  }
  async function load(){
    try{
      const r = await fetch('/api/stats?key=' + encodeURIComponent(key), {cache:'no-store'});
      if(!r.ok){ document.getElementById('err').textContent = r.status===403 ? 'Anahtar hatalı.' : 'Veri alınamadı.'; return; }
      const s = await r.json();
      document.getElementById('err').textContent='';
      document.getElementById('tp').textContent = s.today.players;
      document.getElementById('tr').textContent = s.today.rounds;
      document.getElementById('all').textContent = s.totalPlayers;
      document.getElementById('days').innerHTML = s.days.map(function(d){return '<tr><td>'+d.date+'</td><td>'+d.players+'</td><td>'+d.rounds+'</td></tr>';}).join('');
      renderAwards({date:s.today.date, list:s.prizes.awardsToday}, s.prizes.totalLimit);
      document.getElementById('tierRem').textContent = 'Kalan: ' + s.prizes.tiers.map(function(t){return t.prize+' '+t.remaining+'/'+t.limit;}).join(' · ');
      if(!formFilled){
        document.getElementById('tiers').innerHTML = s.prizes.tiers.map(function(t){
          return '<div class="award" style="display:block" data-id="'+esc(t.id)+'"><b>'+esc(t.prize)+'</b>'
            +'<label>Ödül adı</label><input type="text" class="f-prize" maxlength="40" value="'+esc(t.prize)+'">'
            +'<label>En az puan</label><input type="number" class="f-min" inputmode="numeric" value="'+t.minScore+'">'
            +'<label>Günlük adet</label><input type="number" class="f-limit" inputmode="numeric" value="'+t.limit+'"></div>';
        }).join('');
        formFilled = true;
      }
    }catch(e){ document.getElementById('err').textContent='Bağlantı yok, tekrar deneniyor...'; }
  }
  document.getElementById('save').onclick = async function(){
    const tiers = Array.from(document.querySelectorAll('#tiers [data-id]')).map(function(el){
      return {id:el.getAttribute('data-id'), prize:el.querySelector('.f-prize').value, minScore:Number(el.querySelector('.f-min').value), limit:Number(el.querySelector('.f-limit').value)};
    });
    const res = await post('/api/prizes/config',{tiers:tiers});
    document.getElementById('saved').textContent = res ? 'Kaydedildi ✓' : 'Kaydedilemedi (anahtar?)';
    formFilled = false;
    setTimeout(function(){document.getElementById('saved').textContent='';},3000); load();
  };
  load(); setInterval(load, 5000);
</script></body></html>`;
