# WTTG3 Guide

Welcome To The Game 3 için hazırlanan bu React uygulaması; site programını, mining tier bilgilerini, wiki key'lerini ve oyun durumunu tek bir arayüzde sunar. Arayüz Vite ile derlenir.

## Özellikler

- Siteleri zaman programına göre veya alfabetik sırada görüntüleme
- Sitelerin 00–60 dakikalık uygunluk aralıklarını takip etme
- Ziyaret edilen siteleri işaretleme
- FBI tarafından el konulan siteleri `[FBI Seized]` etiketiyle gösterme
- Site görsellerini görüntüleme ve görseli tam ekran açma
- Tier 1, Tier 2 ve Tier 3 mining hızlarını ayrı tablolarda görüntüleme
- Mining tier listelerini Tracker ekranının altında da görüntüleme
- Sekmeler arasında gezinme ve seçili sekmeyi sayfa yenilendiğinde koruma
- Sekiz key kaydını ve her kayda ait wiki numarasını tutma
- Tracker'da oyun durumunu canlı izleme veya demo verisini görüntüleme
- Mobil uyumlu arayüz

Ziyaret işaretleri ve key tracking kayıtları sunucuya gönderilmez; tarayıcının `localStorage` alanında saklanır. `Reset Data` düğmesi bu kayıtları siler.

Canlı Tracker verisi `http://127.0.0.1:17655/stream` adresindeki yerel köprüden alınır. Köprüye bağlanmadan arayüzü görmek için Tracker sekmesindeki demo modunu kullanabilirsiniz.

## Geliştirme

Node.js kurulu bir ortamda proje bağımlılıklarını yükleyin ve geliştirme sunucusunu başlatın:

```sh
npm install
npm run dev
```

Geliştirme sunucusu, site görselleri API'sini de yerel olarak sunar. Üretim derlemesini `npm run build` ile `dist/` klasörüne alın; derlemeyi yerel olarak görüntülemek için `npm run preview` komutunu kullanın.

## Site verilerini düzenleme

Site grupları ve uygunluk saatleri [`json/sites.json`](./json/sites.json) dosyasında tutulur. Dosya `groups` dizisinden oluşur. Her grubun `group` adı ve `sites` dizisi vardır; site kayıtlarında `name` ile dört zaman dilimi bulunur:

- `00`: 00–15. dakika
- `15`: 15–30. dakika
- `30`: 30–45. dakika
- `45`: 45–60. dakika

Zaman dilimi değerleri `true` veya `false` olmalıdır. Örneğin `00` ve `15` değerleri `true` olan bir site, 00–30. dakikalar arasında kullanılabilir.

## Site görselleri

Bir site adına tıklandığında uygulama, `api/site-images.js` üzerinden ilgili klasördeki PNG dosyalarını bulur. Yeni eklenen veya silinen görseller sonraki istekte otomatik olarak yansır; dosya manifesti tutmanız gerekmez.

Klasör adı, site adındaki boşluklar ve noktalama işaretleri kaldırılıp küçük harfe çevrilerek belirlenir. Sondaki `[H87]` ve `[H40]` etiketleri de hesaba katılmaz. Örneğin:

```text
Sites/
  blackhatpost/
    index.png
    submit.png
  blushingbrides/
    index.png
    join.png
    samples.png
```

Site klasöründe PNG dosyası yoksa uygulama bilgilendirme mesajı gösterir. Görselleri eklemek veya kaldırmak için ilgili klasörü düzenleyin. Hosting ortamlarında klasör ve dosya adlarının büyük-küçük harflerini koruyun.

## Kaynak kodu düzeni

- `src/App.jsx`: Sekmeler ve uygulamanın ana akışı
- `src/app/`: Uygulama ayarları ve sekme yapılandırması
- `src/features/site-list/`: Site çizelgesi, zaman çizelgesi ve görsel penceresi
- `src/features/tier-list/`: Mining tier verileri ve tabloları
- `src/features/key-tracking/`: Key Tracking arayüzü
- `src/features/tracker/`: Oyun Tracker arayüzü ve stilleri
- `src/styles.css`: Uygulama genelindeki stiller
- `src/main.jsx`: React uygulamasının giriş noktası
- `api/site-images.js`: Site görsellerini listeleyen API fonksiyonu

## Yayınlama

Ön yüz Vite ile `dist/` klasörüne derlenir. `vite.config.mjs`, `Sites/`, `images/` ve `json/` klasörlerini derleme çıktısına kopyalar. Site görsellerini çalışma zamanında tarayan API ise Node.js sunucu fonksiyonu olarak çalışır; bu nedenle yalnızca statik dosya sunan bir hosting servisi API'yi çalıştıramaz.

Vercel'de depoyu içe aktarırken şu ayarları kullanın:

- **Framework Preset:** Vite
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

`vercel.json`, `Sites/` klasörünü API fonksiyonuna dahil eder. Dağıtım sırasında `index.html`, `src/`, `json/sites.json`, `api/`, `Sites/` ve `images/` proje yapısını koruyarak depoda bulunmalıdır.

## Lisans

Bu proje [MIT Lisansı](./LICENSE) altında lisanslanmıştır.
