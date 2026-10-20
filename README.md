# Wttg3 Guide

Wttg3 Guide, Welcome To The Game 3 sitelerinin zaman çizelgelerini ve mining tier bilgilerini sunan bir web uygulamasıdır. Arayüz statik dosyalardan oluşur; site görselleri ise istek sırasında sunucu tarafındaki API tarafından taranır.

## Özellikler

- Siteleri mevcut zaman gruplarına göre veya alfabetik tek bir listede görüntüleme
- Site uygunluklarını 00–60 dakikalık zaman çizelgesinde takip etme
- Ziyaret edilen siteleri işaretleme
- Site adına tıklayarak ilgili klasördeki görselleri görüntüleme
- Görsellere tıklayarak tam ekran açma
- Tier 1, Tier 2 ve Tier 3 mining hızlarını görüntüleme
- Mobil uyumlu arayüz

Ziyaret işaretleri sunucuya gönderilmez; yalnızca kullanılan tarayıcının `localStorage` alanında saklanır.

## Site verilerini düzenleme

Site grupları ve saat uygunlukları [`json/sites.json`](./json/sites.json) dosyasında tutulur. Her site kaydında:

- `name`: Ekranda gösterilen site adı
- `00`, `15`, `30`, `45`: İlgili 15 dakikalık aralığın uygun olup olmadığını belirten `true` veya `false` değerleri

Örneğin `00` ve `15` değerleri `true` olan bir site, zaman çizelgesinde 00’dan 30’a kadar kesintisiz bir çubukla gösterilir.

## Site görselleri

Bir site adına tıklandığında `api/site-images.js`, o siteye ait klasörü o anda tarar ve klasördeki PNG dosyalarının adlarını döndürür. Yeni eklenen veya silinen görseller sonraki istekte otomatik yansır; manifest dosyası üretmek ya da görsel adlarını elle kaydetmek gerekmez.

Site klasör adı, ekranda görünen site adının boşlukları ve `[H87]`/`[H40]` etiketi kaldırılıp küçük harfe çevrilmesiyle bulunur. Örneğin:

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

Site klasöründe PNG yoksa bilgilendirme mesajı gösterilir. Görselleri eklemek veya kaldırmak için ilgili klasörü düzenleyin. Hosting ortamlarında klasör ve dosya adlarının büyük/küçük harflerini aynen koruyun.

## Yayınlama

Uygulamanın ön yüzü statik dosyalardan oluşur; görsel klasörlerini çalışma anında tarayan API ise Node.js sunucu fonksiyonu olarak çalışır. Bu nedenle yalnızca statik dosya sunan servisler API’yi çalıştıramaz. Vercel’de depoyu içe aktarırken:

- **Framework Preset:** Other
- **Build Command:** Boş bırakın; Vercel `api/site-images.js` fonksiyonunu otomatik algılar.

`vercel.json`, `Sites/` görsellerinin API fonksiyonuna dahil edilmesini sağlar. `index.html`, `json/sites.json`, `api/`, `Sites/` ve `images/` proje yapısını koruyarak deploy edilmelidir. Görsel ekleme veya silme değişikliklerini deploy ettikten sonra API klasörü yeniden tarar.

## Lisans

Bu proje [MIT Lisansı](./LICENSE) altında lisanslanmıştır.

Copilot ile yapılmıştır.
