# ⚡ Refleks Arenası (60s QR ile Katılınan Çok Oyunculu Stand Oyunu)

Standdaki bir PC ekranındaki **QR kodu** okutan 2–4 oyuncunun kendi akıllı telefonlarından katılarak yarıştığı, yaklaşık 60 saniyede refleks, hız ve Stroop zihin çelişkisi becerileriyle puan toplayıp podyuma çıktığı eğlenceli ve rekabetçi parti oyunu.

---

## 🚀 Hızlı Başlangıç

### 1. Bağımlılıkları Yükleyin:
```bash
npm install
```

### 2. Geliştirme Sunucusunu Başlatın:
```bash
npm run dev
```

Sunucu başladığında terminalde yerel IP adresiniz ve bağlantı linkleriniz görüntülenecektir:
- 💻 **PC / Stand Ekranı:** `http://localhost:5173` (veya `http://localhost:5173/host`)
- 🌐 **Genel Bulut Tüneli (HTTPS):** Sunucu başladığında herkese açık güvenli bir HTTPS tüneli otomatik açılır ve QR kod doğrudan bu bağlantıyı içerir. Böylece oyuncular ister 4G/5G ister Wi-Fi üzerinden tek tıkla bağlanabilir!

---

## 🎮 Oyun Akışı ve Mekanikleri

1. **Katılım (10-15 sn):**
   - Standdaki PC ekranında büyük bir QR Kod belirir (Genel HTTPS tüneli veya Yerel Wi-Fi IP).
   - Oyuncular telefonlarının kamerasıyla QR kodu okutur (Windows Güvenlik Duvarı veya ağ engelleri olmadan anında açılır).
   - Tek dokunuşla hazır Türkçe eğlenceli takma ad veya avatar seçip lobiye katılır.
   - 4 kişi dolduğunda otomatik 3-2-1 geri sayım başlar. Görevli dilerse 2-3 kişiyle de *"Hemen Başlat"* butonuna basabilir.

2. **60 Saniyelik 3 Aşamalı Dinamik Kapışma:**
   - **🟢 Faz 1 (0–15s - Isınma):** 4 kartlı düzen. Hızlı renk ve şekil avı ("Mavi Karta Bas", "Yıldız Şekline Bas").
   - **⚡ Faz 2 (15–40s - Stroop Zihin Çelişkisi):** 6 kartlı düzen. Kelimenin anlamı ile yazı rengi arasındaki çelişkiyi çözme ("Yazı Rengine Bas: 'KIRMIZI' kelimesi Mavi renkteyse -> Maviye bas!").
   - **🔥 Faz 3 (40–60s - Çılgın Kombo & Altın Hedefler):** Hızlı yenilenen 6 kart, 2X Altın hedefler ve alevli kombo çarpanı.

3. **Puanlama ve Hızlı Düzeltme:**
   - Doğru dokunuş: **+100 Puan** (+ Hız Bonusu + Kombo Çarpanı).
   - Yanlış dokunuş: Sadece **-25 Puan** (Soru yazısı ASLA kapanmaz, 220ms sonra oyuncu doğru karta basmayı anında tekrar deneyebilir).

4. **Podyum & Günlük Skorlar:**
   - Tur bittiğinde PC ekranında **1., 2., 3. Podyumu** ve konfeti patlaması gösterilir.
   - Kazananın skoru otomatik olarak **Günün En İyi Skorları (Daily Leaderboard)** listesine kaydedilir.
   - Görevli tek tıkla *"Yeni Tur Başlat"* diyerek odayı sıfırlar ve sıradaki grup için yeni QR'ı hazırlar.

---

## 🛠️ Stand Görevlisi & Test Kolaylıkları

- **🤖 Bot Oyuncu Ekle:** Tek başınıza test ederken veya standda slot doldurmak için tek tıkla yapay zeka botu ekleyebilirsiniz.
- **🔊 Web Audio API Sesleri:** Harici mp3 indirmeye gerek kalmadan tarayıcının kendi ses sentezleyicisi ile sıfır gecikmeli arcade ses efektleri çalar.
- **📱 Canlı Yerel IP Algılama:** PC'nizin bağlı olduğu Wi-Fi/Hotspot IP adresi otomatik tespit edilip QR koda dönüştürülür.
