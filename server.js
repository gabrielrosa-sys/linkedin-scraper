const express = require('express');
const puppeteer = require('puppeteer');

const app = express();

app.get('/linkedin', async (req, res) => {
  const url = req.query.url;

  if (!url) {
    return res.send('Falta URL');
  }

  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox']
    });

    const page = await browser.newPage();

    // 🔐 COOKIE (VAMOS CONFIGURAR DEPOIS)
    const cookie = {
      name: 'li_at',
      value: process.env.LINKEDIN_COOKIE,
      domain: '.linkedin.com',
      path: '/'
    };

    await page.setCookie(cookie);

    await page.goto(url, { waitUntil: 'networkidle2' });

    await new Promise(r => setTimeout(r, 5000));

    const data = await page.evaluate(() => {
      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.innerText : '0';
      };

      return {
        likes: getText('[aria-label*="reactions"]'),
        comments: getText('[aria-label*="comments"]'),
        shares: getText('[aria-label*="reposts"]'),
        views: getText('[aria-label*="views"]')
      };
    });

    await browser.close();
    res.json(data);

  } catch (err) {
    res.send('Erro: ' + err.message);
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('Servidor rodando na porta ' + PORT);
});
