// Self-contained page for the organisers: open /stats?key=HOST_KEY on your own phone
export const STATS_PAGE = `<!doctype html>
<html lang="tr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>Refleks Arenası - Sayaç</title>
<style>
  body{margin:0;font-family:system-ui,sans-serif;background:#13112e;color:#fff;padding:20px;max-width:520px;margin:auto}
  h1{font-size:18px;color:#facc15;letter-spacing:.08em;text-transform:uppercase}
  .big{background:#25214f;border-radius:20px;padding:22px;text-align:center;margin:14px 0}
  .big b{display:block;font-size:64px;line-height:1;color:#facc15}
  .big span{color:#93c5fd;font-weight:700}
  .row{display:flex;gap:12px}.row .big{flex:1}.row .big b{font-size:36px}
  table{width:100%;border-collapse:collapse;margin-top:8px}
  td,th{padding:8px 4px;border-bottom:1px solid #ffffff22;text-align:right}
  td:first-child,th:first-child{text-align:left}
  small{color:#ffffff88}
</style></head><body>
<h1>⚡ Refleks Arenası · Sayaç</h1>
<div id="err" style="color:#fca5a5"></div>
<div class="big"><b id="tp">–</b><span>bugün oynayan kişi</span></div>
<div class="row">
  <div class="big"><b id="tr">–</b><span>bugünkü tur</span></div>
  <div class="big"><b id="all">–</b><span>toplam kişi</span></div>
</div>
<table><thead><tr><th>Gün</th><th>Kişi</th><th>Tur</th></tr></thead><tbody id="days"></tbody></table>
<p><small>Aynı kişi tekrar oynarsa tekrar sayılır. Sunucu yeniden başlarsa sayaç sıfırlanabilir.</small></p>
<script>
  const key = new URLSearchParams(location.search).get('key') || '';
  async function load(){
    try{
      const r = await fetch('/api/stats?key=' + encodeURIComponent(key), {cache:'no-store'});
      if(!r.ok){ document.getElementById('err').textContent = r.status===403 ? 'Anahtar hatalı.' : 'Veri alınamadı.'; return; }
      const s = await r.json();
      document.getElementById('err').textContent='';
      document.getElementById('tp').textContent = s.today.players;
      document.getElementById('tr').textContent = s.today.rounds;
      document.getElementById('all').textContent = s.totalPlayers;
      document.getElementById('days').innerHTML = s.days.map(d=>'<tr><td>'+d.date+'</td><td>'+d.players+'</td><td>'+d.rounds+'</td></tr>').join('');
    }catch(e){ document.getElementById('err').textContent='Bağlantı yok, tekrar deneniyor...'; }
  }
  load(); setInterval(load, 5000);
</script></body></html>`;
