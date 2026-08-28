# Tugas PAW Week 12 — Keamanan Web Dasar
Nama: Muhammad Riswanda Putra Nugraha
NIM: 20240140021

## Bagian 1 — Eksplorasi Kerentanan (secure-search-app)

### 1. Validasi Input Server-Side

**Test 1 — Semua field kosong**
![Validasi menolak semua field kosong](<screenshots/Screenshot 2026-08-28 172029.png>)
Server menolak dan menampilkan 5 pesan error sekaligus: panjang username,
format username, format email, panjang password, dan wajib ada angka.

**Test 2 — Username mengandung simbol**
![Validasi menolak username bersimbol](<screenshots/Screenshot 2026-08-28 172137.png>)
Username diisi `wanda!!!`, email & password valid. Server hanya menolak
pada field username: "Username cuma boleh huruf & angka, gak boleh spasi/simbol".

**Test 3 — Password pendek tanpa angka**
![Validasi menolak password pendek](<screenshots/Screenshot 2026-08-28 172215.png>)
Username `wanda!!!`, password `rwanda`. Server menolak 3 hal sekaligus:
format username, panjang password minimal 8, dan wajib ada angka.

**Test 4 — JavaScript browser dimatikan**
![Validasi tetap jalan meski JS dimatikan](<screenshots/Screenshot 2026-08-28 172325.png>)
JS di-disable lewat DevTools (Ctrl+Shift+P → Disable JavaScript), form
tetap disubmit dengan data invalid yang sama. Server tetap menolak dan
menampilkan pesan error yang sama persis — membuktikan validasi memang
dilakukan di server (express-validator di middlewares/validators.js),
bukan hanya oleh JavaScript di browser.

### 2. Sanitasi Input
![Perbandingan data sebelum dan sesudah sanitasi](<screenshots/Screenshot 2026-08-28 173028.png>)
Input mentah: `"teks": "<b>tes</b>"`, `"email_input": "Budi.Santoso+promo@GMAIL.com"`
Setelah disanitasi (middlewares/validators.js -> sanitasiDemoRules):
- teks: `<`, `>`, `/` diubah jadi HTML entity aman (`&lt;b&gt;tes&lt;&#x2F;b&gt;`)
  hasil dari `.trim().escape()`
- email_input: dinormalisasi jadi lowercase dan alias Gmail (+promo) dibuang
  menjadi `budisantoso@gmail.com`, hasil dari `.normalizeEmail()`

### 3. Escape HTML
![Payload muncul sebagai teks di kotak auto-escape, memicu alert di kotak raw](<screenshots/Screenshot 2026-08-28 174058.png>)
![Halaman setelah alert ditutup, gambar broken terlihat di kotak raw](<screenshots/Screenshot 2026-08-28 174104.png>)
Payload: `<img src=x onerror=alert(1)>`

- Kotak `<%= input %>` (auto-escape): kode ditampilkan sebagai teks biasa
  `<img src=x onerror=alert(1)>`, tidak dieksekusi karena EJS meng-escape
  karakter HTML secara otomatis.
- Kotak `<%- input %>` (raw, tidak di-escape): browser benar-benar merender
  tag <img> tersebut. Karena src="x" tidak valid, event onerror terpicu dan
  memunculkan alert(1) — membuktikan bahwa output yang tidak di-escape bisa
  dieksploitasi untuk menjalankan script arbitrer (dalam kasus nyata bisa
  dipakai mencuri cookie/session, bukan cuma alert).

### 4. SQL Injection
![Kolom aman tidak menemukan produk, kolom rentan menampilkan semua produk](<screenshots/Screenshot 2026-08-28 174259.png>)
Payload: `' OR '1'='1`

- Kolom AMAN (parameterized query, Sequelize Op.iLike): 0 produk ditemukan.
  Payload diperlakukan sebagai teks pencarian literal, bukan bagian dari
  struktur SQL, karena query & value dikirim terpisah ke database.
- Kolom RENTAN (string SQL disambung manual): query yang terbentuk adalah
  `SELECT * FROM products WHERE name ILIKE '%' OR '1'='1%'`. Karena kondisi
  '1'='1' selalu bernilai benar, filter pencarian berhasil di-bypass dan
  SEMUA produk di database ditampilkan (5 produk), termasuk data yang
  seharusnya tidak relevan dengan kata kunci pencarian.

### 5. XSS (Cross-Site Scripting)

**Reflected XSS**
![Alert muncul dari payload script di parameter URL](<screenshots/Screenshot 2026-08-28 174357.png>)
![Halaman demo XSS setelah alert ditutup](<screenshots/Screenshot 2026-08-28 174402.png>)
Payload: `<script>alert('XSS dari ' + document.cookie)</script>`
Script yang diinput lewat parameter URL langsung dieksekusi browser
(alert muncul), membuktikan input tidak di-escape sebelum di-render ke
halaman. Di dunia nyata, document.cookie bisa dipakai menyolong sesi
login korban.

**Stored XSS**
![Alert otomatis muncul dari produk seeder tanpa mengetik payload](<screenshots/Screenshot 2026-08-28 174720.png>)
![Hasil pencarian menampilkan produk seeder berisi payload script](<screenshots/Screenshot 2026-08-28 174726.png>)
Search kata kunci umum ("a") di `/search-unsafe-demo` menampilkan 5 produk,
salah satunya adalah produk seeder yang NAMA-nya sendiri berisi payload
`<script>alert("Stored XSS dari nama produk")</script>`. Begitu halaman
selesai dirender, alert otomatis muncul TANPA perlu mengetik payload
apapun — berbeda dari reflected XSS, payload ini sudah tersimpan permanen
di database sehingga akan ter-trigger ke SEMUA pengguna yang membuka
halaman tersebut, bukan hanya yang mengetik payload.

## Bagian 2 — Implementasi Sendiri (Aman)
Tema: Buku Tamu (Guestbook) dengan fitur kirim pesan & pencarian
Stack: Node.js + Express + EJS + Sequelize (PostgreSQL)

### Bukti 1 — Escape HTML / Proteksi XSS otomatis dari seeder
![Payload script dari seeder tampil sebagai teks, tidak memicu alert](<screenshots/Screenshot 2026-08-28 180259.png>)
Data seeder sengaja diisi payload `<script>alert('XSS berhasil jika ini
muncul jadi alert')</script>` pada field pesan. Karena seluruh output di
views/index.ejs dirender menggunakan `<%= %>` (bukan `<%- %>`), EJS
otomatis meng-escape karakter HTML sehingga payload ditampilkan sebagai
teks mentah, TIDAK dieksekusi sebagai script — tidak ada alert yang
muncul, berbeda dengan behavior di secure-search-app versi rentan
(Bagian 1).

### Bukti 2 — Validasi Server-Side
![Form menolak submit dengan semua field kosong](<screenshots/Screenshot 2026-08-28 180624.png>)
Submit form dengan semua field kosong. Server (express-validator di
middlewares/validators.js) menolak dan menampilkan 3 pesan error
sekaligus: panjang nama, format email, dan panjang pesan — request
tidak pernah tersimpan ke database.

### Bukti 3 — Sanitasi Input
![Nama ter-trim dan pesan ter-escape setelah tersimpan](<screenshots/Screenshot 2026-08-28 180748.png>)
Input: nama "  wanda  " (dengan spasi nempel), pesan "<b>halo dunia</b>".
Hasil tersimpan: nama sudah ter-trim jadi "wanda" (tanpa spasi ekstra),
dan pesan ter-escape jadi teks `&lt;b&gt;halo dunia&lt;&#x2F;b&gt;` —
tag <b> tidak dirender sebagai HTML, sesuai hasil dari .trim().escape()
di middlewares/validators.js.

### Bukti 4 — SQL Injection Prevention
![Pencarian dengan payload SQLi menghasilkan 0 pesan](<screenshots/Screenshot 2026-08-28 181124.png>)
Payload `' OR '1'='1` dimasukkan ke kotak pencarian. Hasil: "Daftar Pesan (0)"
— payload diperlakukan sebagai teks pencarian literal karena query dibangun
lewat Sequelize Op.iLike (parameterized query), bukan string SQL yang
disambung manual. Berbeda dengan Bagian 1, filter TIDAK berhasil di-bypass.

### Bukti 5 — XSS Prevention dari input form langsung
![Payload script dari form manual tampil sebagai teks ter-escape](<screenshots/Screenshot 2026-08-28 181156.png>)
Payload `<script>alert('coba dari form')</script>` dikirim langsung lewat
form "Kirim Pesan". Hasil tersimpan dan ditampilkan sebagai teks ter-escape
`&lt;script&gt;alert(&#x27;coba dari form&#x27;)&lt;&#x2F;script&gt;` —
tidak ada alert yang muncul, membuktikan kombinasi sanitasi (.escape()) saat
input dan rendering `<%= %>` di EJS berhasil mencegah XSS baik dari input
baru maupun dari data seeder.

## Ringkasan — Cara Penanganan 5 Syarat Keamanan di Bagian 2

1. **Validasi Server-Side**: `express-validator` di `middlewares/validators.js`
   (`entryValidationRules`) memvalidasi panjang nama (3-50 karakter), format
   email, dan panjang pesan (5-500 karakter) di server, dijalankan sebelum
   controller lewat middleware `handleValidationErrors`.
2. **Sanitasi**: masih di `entryValidationRules`, dengan `.trim()` untuk
   membuang spasi berlebih dan `.escape()` untuk mengubah karakter HTML
   berbahaya jadi entity aman, serta `.normalizeEmail()` untuk merapikan
   format email sebelum data disimpan ke database.
3. **Escape HTML**: seluruh data dinamis di `views/index.ejs` dirender
   dengan `<%= %>` (auto-escape bawaan EJS), bukan `<%- %>`, sehingga
   HTML/JS yang dimasukkan user selalu tampil sebagai teks, tidak pernah
   dieksekusi oleh browser.
4. **SQL Injection Prevention**: seluruh query (termasuk pencarian) memakai
   Sequelize (`Entry.findAll`, `Op.iLike`) yang mengirim query dan value
   secara terpisah ke database (parameterized query), bukan string SQL
   yang disambung manual dari input user.
5. **XSS Prevention**: hasil gabungan dari sanitasi input (`.escape()` saat
   validasi) dan escape output (`<%= %>` di EJS) — dua lapis pertahanan ini
   membuat payload script baik dari form maupun dari data seeder tidak
   pernah tereksekusi sebagai kode di browser.