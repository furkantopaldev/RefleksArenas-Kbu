# QR ile Katılınan 1 Dakikalık Yarışma Oyunu

## Proje özeti

**Çalışma adı:** Refleks Arenası  
**Tek cümlelik fikir:** Bir standdaki QR kodu okutan 2–4 kişi, kendi telefonlarında aynı kısa oyun odasına katılır; yaklaşık 60 saniyede refleks, dikkat ve doğru karar verme becerileriyle puan toplayıp ekranda sıralanır.

Oyun çevrim içi bir ürün gibi görünse de oyuncuların birbirini görmesi veya sesli görüşmesi gerekmez. Telefonlar yalnızca aynı oyun odasındaki canlı turlara bağlanır. Standdaki büyük ekranda da oda, geri sayım ve sonuçlar gösterilebilir. Büyük ekran zorunlu değildir; yoksa telefon ekranlarından biri oyun yöneticisi görünümünde kullanılabilir.

## Hedef ve tasarım ilkeleri

- Oyuna katılmak için uygulama indirme ve hesap açma gerektirmesin.
- QR koddan oyuna giriş 10–15 saniyede tamamlanabilsin.
- Bir tur yaklaşık 60 saniye sürsün; bekleme ve sonuç ekranlarıyla toplam stand deneyimi 1,5–2 dakikayı geçmesin.
- 2 kişiyle de eğlenceli, 3–4 kişiyle de adil çalışsın.
- Kuralları birkaç saniyede anlaşılabilsin; ustalaşması zaman alsın.
- Sonuç ekranı kutlayıcı olsun; birinciyi belirgin biçimde öne çıkarsın, diğer oyuncuları da aşağılamasın.
- Ödül varsa, sonuç ve ödül iddiası işletmeci tarafından doğrulanabilsin.

## Oyun fikri seçenekleri

### 1. Refleks Arenası — önerilen ana fikir

Ekranda farklı renklerde/hedeflerde işaretler belirir. Oyuncular, yalnızca kısa yönergede belirtilen doğru hedefe mümkün olduğunca çabuk dokunur. Bazı hedefler tuzak veya puan düşürücü olabilir. Herkes aynı anda oynar, kendi telefonunda dokunur; sistem tepki süresi ve doğruluğu puana çevirir.

**Neden uygun:** Öğrenmesi kolay, tek dakikaya sığar, telefonda rahat oynanır, seyredenler de büyük ekrandan heyecanı takip eder. Yalnızca hızlı dokunmayı ödüllendirmemek için doğruluk, kombo ve riskli hedefleri ayırt etme puanlaması kullanılır.

### 2. Hafıza Kapışması

Kısa bir ışık/ikon dizisi gösterilir; oyuncular sırayı kendi telefonlarında tekrarlar. Tur ilerledikçe dizi uzar ve hızlanır.

**Artısı:** Basit geliştirme ve net kurallar. **Eksisi:** Aynı anda yarış hissi daha düşük olabilir; oyuncuların sırayla cevap vermesi beklemeyi artırabilir.

### 3. Son Saniye

Oyuncular ekranda ilerleyen bir ibreyi hedef alanında durdurmaya çalışır; hedef alanı her turda daralır veya yer değiştirir.

**Artısı:** Seyirci için anlaşılır ve gerilimli. **Eksisi:** Tek bir mekanik 60 saniye boyunca tekrarlı hissedebilir; varyasyon tasarımı gerekir.

**Öneri:** İlk sürümü Refleks Arenası ile kurmak; ileride Hafıza Kapışması veya Son Saniye'yi aynı QR/oda altyapısına eklenebilir ayrı oyun modu olarak değerlendirmek.

## Önerilen oyun akışı

1. **QR okutma:** Standdaki sabit QR kod web oyununu açar. QR, belirli bir stand/istasyonun giriş adresini taşır; oyuncu için tek kullanımlık kişisel kod olarak kullanılmaz.
2. **Oda oluşturma:** Sunucu bekleyen oyuncular için oda açar. Ekranda oda adı veya kısa kod görünür.
3. **Oyuncu katılımı:** Oyuncu bir takma ad seçer ve boş oyuncu yerlerinden birine katılır. Takma adlar kısa tutulur; kişisel bilgi istenmez.
4. **Hazır olma:** Katılımcı sayısı en az 2 olduğunda başlatma mümkün olur. Oyun, stand görevlisi tarafından veya sabit bir bekleme süresi sonunda başlatılabilir. 4 kişi dolunca kısa geri sayım otomatik başlar.
5. **Geri sayım:** Bütün telefonlarda ve varsa stand ekranında eşzamanlı 3–2–1 geri sayımı gösterilir.
6. **Oyun:** Yaklaşık 60 saniyede 3 kısa bölüm oynanır. Her bölüm, aynı temel mekaniğe yeni bir küçük kural ekler; böylece oyun tazelenir ama kurallar değişip kafa karıştırmaz.
7. **Sonuç:** Sunucu puanları sıralar ve herkesin telefonuna sonuç ekranını gönderir. Beraberlikte doğruluk oranı, sonra doğru cevapların ortalama tepki süresi kullanılır.
8. **Yeni tur:** Oda temizlenir veya kapanır; yeni grup aynı QR'dan yeni oturum açar.

### Örnek 60 saniyelik tur

- **0–5 sn:** Kısa yönerge ve geri sayım.
- **5–22 sn:** Isınma bölümü; doğru renge/hedefe dokun.
- **22–42 sn:** Tuzak hedefler eklenir; yanlış dokunma puan kaybettirir.
- **42–60 sn:** Hedefler daha kısa süre görünür; doğru seri için kombo bonusu verilir.

Süreler ilk prototipte ayarlanmalıdır. Animasyon/bağlantı gecikmeleri nedeniyle tepki süresinin adil ölçülmesi gerçek cihazlarda denenmelidir.

## Oynanış ve puanlama taslağı

### Temel kural

Her tur başında ekranda kısa bir görev görünür: örneğin “Yalnızca mavi yıldızlara dokun.” Bir hedef kısa süre belirir. Oyuncu doğru hedefe dokunursa puan kazanır; yanlış hedefe dokunursa küçük ceza alır; dokunmazsa puan almaz.

### Başlangıç puan modeli

- Doğru hedef: **+100 puan**
- Yanlış hedef/tuzak: **−50 puan** (toplam puan sıfırın altına düşmez)
- Arka arkaya 3 doğru: **+50 kombo bonusu**
- Hedefin görünme süresine göre sınırlı hız bonusu: **0–50 puan**
- Hız bonusu doğruluğun önüne geçmemeli; doğruluk ve doğru karar ana unsur olmalı.

Bu değerler prototip varsayımıdır. Kullanıcı testinde oyunların çok kolay, çok zor veya yalnızca ekran/cihaz gecikmesine bağlı olduğu görülürse değiştirilmeli.

### Adalet ve erişilebilirlik

- Herkese aynı hedef dizisi ve aynı hedef zamanlaması gönderilir.
- Skorlar istemciye güvenmek yerine sunucuda hesaplanır; istemci yalnızca dokunma olayını ve zaman bilgisini gönderir.
- Telefon boyutu ve ekran en-boy oranı farklı olsa da dokunma hedefleri yeterince büyük tutulur.
- Renk tek başına anlam taşımamalı; şekil veya simgeyle desteklenmelidir.
- Ses kapalıyken de oyun anlaşılmalıdır; sesler opsiyonel geri bildirim olur.
- Bağlantısı kısa süre kopan oyuncunun turu hemen bozulmamalı; yeniden bağlanma penceresi tanımlanmalıdır.

## Kazanma, sonuç ekranı ve ödül

### Win screen

Sonuç ekranı enerjik ve fotoğraflanmaya uygun olabilir:

- Birinci oyuncuya büyük kutlama animasyonu ve “Arenanın şampiyonu!” mesajı.
- İkinci ve diğer oyuncular için sıralama, puan ve kısa pozitif mesajlar.
- Her oyuncuya kendi puanı, doğru hedef sayısı, isabet oranı ve en iyi kombo özeti.
- Beraberlikte eşit sıra veya önceden belirtilmiş bağlayıcı kural.
- “Tekrar oyna” çağrısı veya ödül standına yönlendirme.

### Ödül seçenekleri

1. **Anlık küçük ödül:** Birinciye indirim, içecek/ürün hediyesi veya küçük promosyon. Stand işletmecisi tarafından verilir.
2. **Günlük rekor:** O günün en yüksek puanına ek ödül; skor tablosu takma adla gösterilir.
3. **Katılım ödülü:** Her oyuncuya küçük bir avantaj, birinciye ek ödül. Böylece kaybedenlerin deneyimi de olumlu kalır.
4. **Dijital rozet:** Ödül maliyeti olmadan tekrar oynama motivasyonu sağlar.

Ödül, oyunun skoruna göre verilecekse koşullar (beraberlik, bağlantı kopması, günlük sıfırlama, ödül adedi ve geçerlilik) oyuncuya önceden açıkça gösterilmelidir. Ödül iddiası için sonuç ekranında kısa oda/sonuç kodu bulunabilir; görevli kodu stand panelinden doğrular. Ödül ve kampanya kuralları işletmenin ve yürürlükteki yerel düzenlemelerin gerekliliklerine göre ayrıca kontrol edilmelidir.

## QR ve çok oyunculu sistem taslağı

### Kullanıcı açısından

- Sabit QR → mobil uyumlu web sayfası.
- Takma ad → boş oyuncu slotuna katıl.
- Lobi ekranı → kaç kişi hazır, oyun ne zaman başlayacak.
- Oyun ekranı → görev, geri sayım, hedef ve kendi puanın.
- Sonuç → sıralama ve varsa ödül kodu.

### Teknik açıdan ilk yaklaşım

- **İstemci:** Mobil tarayıcıda çalışan responsive web oyunu; ilk sürüm için uygulama mağazası kurulumu gerekmez.
- **Canlı eşzamanlama:** WebSocket veya benzeri gerçek zamanlı kanal ile lobi, oyun başlangıcı, hedef olayları ve skor güncellemeleri paylaşılır.
- **Sunucu:** Oda oluşturma, oyuncu katılımı, oturum saati ve skor doğrulaması sunucuda yapılır.
- **Oda ömrü:** Oda yalnızca kısa oturum boyunca yaşar; boş veya tamamlanmış odalar belirli süre sonra silinir.
- **Gösterim ekranı:** İsteğe bağlı tarayıcı tabanlı yönetici/seyirci görünümü, oyuncu adları ve sıralamayı yansıtır.
- **İnternet:** QR ile farklı telefonların eşzamanlı katılımı için telefonların erişebildiği bir ağ bağlantısı gerekir. Stand Wi-Fi'ı ve hücresel bağlantı senaryosu gerçek mekânda kontrol edilmelidir.

İlk prototipte kalıcı hesap, arkadaş listesi, sohbet, uygulama mağazası uygulaması ve karmaşık ödül cüzdanı kapsam dışı tutulabilir. Böylece temel eğlence ve eşzamanlılık önce doğrulanır.

## MVP kapsamı

### İlk sürümde olmalı

- Sabit QR ile mobil web oyunu açılması.
- 2–4 oyunculu oda ve kısa takma ad.
- Lobi, hazır durumu ve geri sayım.
- 60 saniyelik Refleks Arenası modu.
- Sunucu tarafında skor hesaplama ve sonuç sıralaması.
- Birinciyi öne çıkaran sonuç ekranı.
- Bağlantı koptu/oda dolu/oyun başladı durumlarının anlaşılır mesajları.
- Stand için basit oyun başlatma ve oda sıfırlama kontrolü.

### Sonraki aşamaya bırakılabilir

- Günlük/haftalık lider tablosu.
- Birden fazla mini oyun modu.
- Ödül kodu üretimi ve işletme paneli.
- Farklı stand/şube yönetimi.
- Görsel tema ve etkinlik bazlı oyun paketleri.
- Analitik: katılım sayısı, tamamlanan turlar, ortalama bekleme ve tekrar oynama oranı.

## Başarı ölçütleri

Prototip stand ortamında gözlemlenerek ölçülebilir:

- QR'dan lobiye varma süresi.
- 4 kişinin tamamının katılım oranı.
- Turu tamamlayan oyuncu oranı.
- Tur süresi ve sıradaki gruba geçiş süresi.
- Tekrar oynamak isteyenlerin oranı.
- Oyuncuların kuralları yardım almadan anlayıp anlamadığı.
- Farklı telefonlarda haksız gecikme veya dokunma sorunu yaşanıp yaşanmadığı.

İlk denemede küçük gruplarla test edip yönergeyi ve hedef hızını ayarlamak, ardından gerçek stand internetinde denemek gerekir.

## Başlıca riskler ve karşılıklar

- **Bağlantı gecikmesi:** Hedef olaylarını sunucu zamanına bağla, telefon ekranlarında aynı zaman çizgisini kullan ve gerçek ortamda ölç.
- **Tek kişinin çoklu katılımı:** Kısa ömürlü oda koltuğu belirteçleri kullan; ödül varsa görevli doğrulaması ekle. Tam güvenlik gerektiren ödüllerde ek kontrol planla.
- **Takma adların uygunsuz kullanımı:** Kısa karakter sınırı, temel filtre ve görevli oda sıfırlaması uygula.
- **İki oyuncuda düşük rekabet:** Hızlı başlangıç ve 3 bölümde artan zorlukla turu canlı tut; 2 kişiye özel içerik varsayma.
- **İlk kez oynayanların zorlanması:** Bir örnek hedef göster, metni kısa tut, simge/renk birlikte kullan.
- **Ödül kaynaklı anlaşmazlık:** Kuralları tur başlamadan göster ve beraberlik/bağlantı kesilmesi şartlarını belirle.

## Görsel ve ses tonu

- Parlak, yüksek kontrastlı arcade görünümü; kalabalık olmayan ekran.
- Oyun alanında yalnızca görev, hedefler, süre ve puan görünür.
- Dokunma geri bildirimi: kısa büyüme/parlama animasyonu ve isteğe bağlı ses.
- Yanlış cevapta cezalandırıcı uzun animasyon yerine kısa, net uyarı.
- Finalde konfeti ve kazanan vurgusu; herkesin skor özeti okunabilir.

## Proje kararları ve açık sorular

Kodlamaya başlamadan önce netleştirilmesi yararlı kararlar:

1. Standda internet bağlantısı nasıl sağlanacak: işletme Wi-Fi'ı, telefonların mobil verisi veya ikisi birden mi?
2. Sonuçlar yalnızca o oyun odasında mı gösterilecek, yoksa günlük rekor tutulacak mı?
3. Ödül gerçek ürün/indirim mi olacak, yoksa ilk etapta yalnızca dijital kazanan ekranı mı?
4. Standda büyük ekran/TV bulunacak mı?
5. Oyunun görsel teması markaya veya etkinliğe göre özelleştirilecek mi?

Bu kararlar alınana kadar güvenli başlangıç varsayımı: kişisel veri toplamayan, takma adla çalışan, kalıcı lider tablosu olmayan ve gerçek ödül dağıtımını görevliye bırakan web tabanlı MVP.

## Kısa sunum metni

**Refleks Arenası**, stand ziyaretçilerinin QR kodu okutup kendi telefonlarından katıldığı, 2–4 kişilik ve yaklaşık bir dakika süren hızlı bir yarışma oyunudur. Oyuncular aynı hedefleri görür, doğru işaretlere dokunarak puan toplar ve turun sonunda anında sıralama ekranını görür. Kolay katılım, kısa tur, izlenebilir rekabet ve isteğe bağlı küçük ödüller standdaki bekleme anını eğlenceli bir deneyime dönüştürür.
