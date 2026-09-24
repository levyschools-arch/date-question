// Cloudflare Worker: receives the date page's report and forwards it to Telegram.
// The bot token and chat id live in the Worker's encrypted secrets
// (TELEGRAM_TOKEN, TELEGRAM_CHAT_ID), never in the public page.
const ALLOWED_ORIGIN = 'https://levyschools-arch.github.io';

const cors = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const clean = (v, max = 60) => String(v ?? '').replace(/[\r\n]+/g, ' ').trim().slice(0, max);

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: cors });
    if (request.headers.get('Origin') !== ALLOWED_ORIGIN) return new Response('Forbidden', { status: 403 });

    let d;
    try { d = await request.json(); } catch { return new Response('Bad request', { status: 400, headers: cors }); }

    const text = [
      `${clean(d.name, 30) || 'Someone'} said YES!`,
      `Day: ${clean(d.day)}`,
      `Time: ${clean(d.time)}`,
      `Food: ${clean(d.food)}`,
      `Tapped: ${clean(d.button)}`,
      `At: ${new Date().toLocaleString('en-GB', { timeZone: 'Europe/Madrid' })} (Madrid)`,
    ].join('\n');

    const tg = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text }),
    });
    return new Response(tg.ok ? 'ok' : 'telegram error', { status: tg.ok ? 200 : 502, headers: cors });
  },
};
