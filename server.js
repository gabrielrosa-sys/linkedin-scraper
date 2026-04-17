const express = require('express');
const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');
const app = express();

app.get('/linkedin', async (req, res) => {
  const url = req.query.url;
  if (!url) {
    return res.status(400).json({ erro: 'Falta o parâmetro ?url=' });
  }

  let browser;
  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();

    // Simula um navegador real
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Cookie de autenticação do LinkedIn
    await page.setCookie({
      name: 'li_at',
      value: process.env.LINKEDIN_COOKIE,
      domain: '.linkedin.com',
      path: '/'
    });

    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    await new Promise(r => setTimeout(r, 5000));

    const data = await page.evaluate(() => {
      const buscar = (...seletores) => {
        for (const s of seletores) {
          const els = document.querySelectorAll(s);
          for (const el of els) {
            const texto = el.innerText?.trim();
            if (texto && /\d/.test(texto)) return texto;
          }
        }
        return '0';
      };

      return {
        likes: buscar(
          '[aria-label*="reaction"]',
          '[aria-label*="like"]',
          '.social-counts-reactions__count'
        ),
        comments: buscar(
          '[aria-label*="comment"]',
          '.social-counts-comments'
        ),
        shares: buscar(
          '[aria-label*="repost"]',
          '[aria-label*="share"]',
          '.social-counts-reposts'
        ),
        views: buscar(
          '[aria-label*="view"]',
          '.social-counts-views',
          '.analytics-entry-point'
        )
      };
    });

    res.json({ sucesso: true, url, ...data });

  } catch (err) {
    res.status(500).json({ erro: err.message });
  } finally {
    if (browser) await browser.close();
  }
});

app.get('/', (req, res) => {
  res.send('Servidor LinkedIn Scraper rodando ✅');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log('Servidor rodando na porta ' + PORT);
});
