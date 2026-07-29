# AYK Muhasebe Yardımcısı V3.0

Electron tabanlı Windows masaüstü uygulaması. HTA, VBS ve ayrı PowerShell güncelleyicisi kullanılmaz.

## NPM kullanmadan EXE oluşturma

Bu projede yerel bilgisayarda Node.js veya npm çalıştırmak gerekmez. Derleme GitHub Actions sunucusunda yapılır.

1. Proje dosyalarını GitHub deposuna yükleyin.
2. GitHub'da **Actions** sekmesini açın.
3. Soldan **Windows EXE Derle** iş akışını seçin.
4. **Run workflow** düğmesine basın.
5. İşlem yeşil tikle tamamlanınca çalışmayı açın.
6. Sayfanın altındaki **Artifacts** bölümünden `AYK-Muhasebe-Yardimcisi-Windows-V3` paketini indirin.

Artifact içinde kurulum ve portable Windows EXE dosyaları bulunur.

## Resmî sürüm yayınlama

Yeni sürüm yayınlarken `package.json` içindeki sürüm numarasını yükseltin. Örneğin:

```json
"version": "3.0.1"
```

Değişiklikleri GitHub'a gönderdikten sonra aynı sürüm için `v3.0.1` etiketi oluşturup gönderin. **Windows Release Yayınla** iş akışı otomatik çalışır ve EXE dosyalarını GitHub Releases bölümüne ekler.

## Proje yapısı

- `main.js`: Electron ana süreç
- `preload.js`: Güvenli masaüstü API köprüsü
- `src/`: Arayüz ve uygulama kodları
- `Assets/`: Stil ve görseller
- `Modules/`: Modül tanımları
- `.github/workflows/`: GitHub üzerinde otomatik EXE derleme ve yayınlama

## Güvenlik notu

Windows kod imzalama sertifikası henüz eklenmediği için ilk çalıştırmada Windows SmartScreen uyarısı gösterebilir. Bu durum derleme hatası değildir.
