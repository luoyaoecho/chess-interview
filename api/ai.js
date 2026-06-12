/**
 * Vercel Serverless 代理 —— 等价于 server_proxy.py
 * 部署后用户自带 API Key，前端通过此函数转发 AI 请求
 * 服务端不存储、不记录任何 API Key
 */
export default async function handler(req, res) {
  // CORS 预检
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Target-URL, X-API-Key, X-Model');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const targetUrl = req.headers['x-target-url'];
  const apiKey = req.headers['x-api-key'];

  if (!targetUrl) return res.status(400).json({ error: 'Missing X-Target-URL header' });
  if (!apiKey) return res.status(400).json({ error: 'Missing X-API-Key — 请在前端输入你的 API Key' });

  try {
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + apiKey
      },
      body: JSON.stringify(req.body)
    });

    const data = await response.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(response.status).json(data);
  } catch (err) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(502).json({ error: 'AI 请求失败：' + err.message });
  }
}
