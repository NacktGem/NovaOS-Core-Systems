import assert from 'node:assert/strict';
import puppeteer from 'puppeteer';

const base = 'http://localhost:8760';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto(base);
  await page.evaluate(() => { document.cookie = 'csrf_token=t'; });
  const result = await page.evaluate(async () => {
    const r = await fetch('/agents/echo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-role': 'GODMODE',
        'x-csrf-token': 't',
      },
      body: JSON.stringify({ command: 'send_message', args: { message: 'hi' }, log: true }),
    });
    return r.json();
  });
  assert.ok(result.job_id);
  const log = await page.evaluate(async (jobId) => {
    const r = await fetch(`/logs/echo/${jobId}.json`, {
      headers: { 'x-role': 'GODMODE' },
    });
    return r.json();
  }, result.job_id);
  assert.equal(log.response.agent, 'echo');
  await browser.close();
})();
