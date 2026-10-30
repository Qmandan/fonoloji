// Fonoloji API'sine anahtarı gizleyerek istek atan küçük sunucu.
// Ayarlar (Vercel > Settings > Environment Variables):
//   FONOLOJI_KEY : Fonoloji'den aldığın API anahtarı
//   APP_CODE     : Kendi seçtiğin erişim kodu (başkaları kotanı harcamasın diye)
function strip(v) {
  if (Array.isArray(v)) return v.map(strip);
  if (v && typeof v === "object") {
    const o = {};
    for (const k of Object.keys(v)) if (k !== "logoDataUrl") o[k] = strip(v[k]);
    return o;
  }
  return v;
}

module.exports = async (req, res) => {
  const key = process.env.FONOLOJI_KEY;
  const code = process.env.APP_CODE;
  if (!key) return res.status(500).json({ error: "FONOLOJI_KEY ayarlanmamış" });
  if (!code) return res.status(500).json({ error: "APP_CODE ayarlanmamış" });
  if (req.headers["x-app-code"] !== code) return res.status(401).json({ error: "Erişim kodu yanlış" });

  const path = String(req.query.path || "");
  const ok = /^\/funds(\/[A-Za-z0-9]{2,6}(\/(timeseries|portfolio|analysis))?)?$/;
  if (!ok.test(path)) return res.status(400).json({ error: "İzin verilmeyen yol" });

  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(req.query)) {
    if (k !== "path" && k !== "api_key") qs.set(k, String(v));
  }
  const url = "https://fonoloji.com/v1" + path + (qs.toString() ? "?" + qs.toString() : "");

  try {
    const r = await fetch(url, { headers: { "X-API-Key": key } });
    const text = await r.text();
    let body = text;
    try { body = JSON.stringify(strip(JSON.parse(text))); } catch (e) {}
    res.setHeader("Content-Type", r.headers.get("content-type") || "application/json");
    res.setHeader("Cache-Control", "private, max-age=120");
    res.status(r.status).send(body);
  } catch (e) {
    res.status(502).json({ error: "Fonoloji'ye ulaşılamadı: " + e.message });
  }
};
