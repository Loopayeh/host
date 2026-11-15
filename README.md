# PS4 Host — ps4.loopayeh.ir

هاست جیلبریک PlayStation 4 با ظاهر اختصاصی Loopayeh و موتور WebKitty.

## نحوه استفاده

در مرورگر PS4 آدرس زیر را باز کنید:

```
http://ps4.loopayeh.ir/
```

یا با HTTPS:

```
https://ps4.loopayeh.ir/
```

صفحه‌ی اصلی فریمور کنسول را خودکار تشخیص می‌دهد؛ مدل اکسپلویت (PSFree / BadHoist / CSSFontFace / Slopkit / Relapse / Afterglow / BPF) و نسخه HEN (GoldHEN) را انتخاب کن و روی لوگو بزن.

پشتیبانی: 4.50 – 5.07 و 6.70 – 14.02

## ساختار

- `index.html` — صفحه اصلی (انتخاب مدل اکسپلویت + HEN)
- `cache.html`, `includes/caches/` — سیستم کش جداگانه برای هر گروه فریمور (AppCache)
- `includes/js/`, `includes/css/` — موتور و ظاهر (اسکین Loopayeh در `includes/css/loopayeh.css`)
- `includes/payloads/` — پیلودها (GoldHEN/PS4HEN، FTP، BinLoader، ELF Loader، Linux و …)
- `src/` — زنجیره‌های اکسپلویت (`psfree-lapse`, `badhoist`, `cssfontface`, `slopkit`, `slopkit-afterglow`, `relapse`, `bpf-double-free`, `kpatches`)
- `505/`, `672/`, `702/`, `755/`, `9.00/` — کالکشن‌های قدیمی (از روت لینک نشده‌اند)
- `5.05-14.02/`, `5.05-13.52/`, `6.00-11.02/`, `ps4jb-Feyzee-AIO/`, `PSFree/`, ... — هاست‌های قدیمی (پشتیبان، از روت لینک نشده‌اند)
- `restore/`, `restore-t/` — راهنماهای نصب/ریستور

## اجرای محلی

```bash
python -m http.server 8080
```

سپس `http://localhost:8080/`

> نکته: روی `localhost` صفحه وارد حالت «local server» می‌شود (فرستادن پیلود به PS4 از PC/موبایل). برای دیدن صفحه‌ی انتخاب اکسپلویت، آدرس را با `?test=1` باز کنید.

## دامنه

GitHub Pages با دامنه سفارشی `ps4.loopayeh.ir` (فایل `CNAME`).
