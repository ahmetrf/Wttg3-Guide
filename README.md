# Wttg3 Guide

Wttg3 Guide, Welcome To The Game 3 oyununda bulunan sitelerinin zaman çizelgelerini ve mining tier bilgilerini tek bir yerde sunan statik bir web uygulamasıdır.

## Özellikler

- Siteleri mevcut zaman gruplarına göre veya alfabetik tek bir listede görüntüleme
- Site uygunluklarını 00–60 dakikalık zaman çizelgesinde takip etme
- Ziyaret edilen siteleri işaretleme
- Site adına tıklayarak varsa `index.png` ve `submit.png` görsellerini görüntüleme
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

Görseller `Sites` klasöründe, site adına karşılık gelen alt klasörlerde aranır. `[H87]` ve `[H40]` gibi ad etiketleri klasör adına dahil edilmez.

```text
Sites/
  blackhatpost/
    index.png
    submit.png
  bizarrepropagation/
    index.png
```

Bir görsel dosyası yoksa ilgili sekme gösterilmez; site için görsel bulunamazsa bilgilendirme mesajı çıkar. Hosting ortamlarında klasör ve dosya adlarının büyük/küçük harflerini aynen koruyun.

## Yayınlama

Proje derleme veya paket kurulumu gerektirmez; statik hosting servislerinde yayınlanabilir. Vercel gibi bir serviste depoyu içe aktarırken:

- **Framework Preset:** Other
- **Build Command:** Boş bırakın
- **Output Directory:** `.` (proje kökü)

Ana sayfa `index.html` dosyasıdır. `json/sites.json`, `Sites/` ve `images/` klasörleri de aynı proje yapısıyla yayınlanmalıdır.

## Lisans

Bu proje [MIT Lisansı](./LICENSE) altında lisanslanmıştır.

Copilot ile yapılmıştır.
