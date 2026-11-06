// TEFAS'ın herkese açık getiri verisini, erişim koduyla korunan küçük bir sunucudan çeker.
// Ayarlar: APP_CODE (Fonoloji için de kullandığın aynı erişim kodu)
const IZIN = ["BindComparisonFundReturns", "BindHistoryInfo"];

module.exports = async (req, res) => {
  const code = process.env.APP_CODE;
  if (!code) return res.status(500).json({ error: "APP_CODE ayarlanmamış" });
  if (req.headers["x-app-code"] !== code) return res.status(401).json({ error: "Erişim kodu yanlış" });

  const ep = String(req.query.ep || "");
  if (!IZIN.includes(ep)) return res.status(400).json({ error: "İzin verilmeyen uç" });

  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(req.query)) {
    if (k !== "ep") {
      if (Array.isArray(v)) {
        v.forEach(item => body.append(k, String(item)));
      } else {
        body.set(k, String(v));
      }
    }
  }

  try {
    const r = await fetch("https://www.tefas.gov.tr/api/DB/" + ep, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "Origin": "https://www.tefas.gov.tr",
        "Referer": "https://www.tefas.gov.tr/FonKarsilastirma.aspx",
        "X-Requested-With": "XMLHttpRequest",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        "Accept": "application/json, text/javascript, */*; q=0.01"
      },
      body
    });
    const text = await r.text();
    res.setHeader("Content-Type", r.headers.get("content-type") || "text/plain");
    res.setHeader("Cache-Control", "private, max-age=300");
    res.status(r.status).send(text);
  } catch (e) {
    res.status(502).json({ error: "TEFAS’a ulaşılamadı: " + e.message });
  }
};
