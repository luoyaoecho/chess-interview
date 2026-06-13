/**
 * Vercel Serverless —— 测评结果写入飞书多维表格
 */
const APP_ID = 'cli_aa8e309d91f89bb7';
const APP_SECRET = 'R3fe6oasSoGIl5ytZRICLcHCG2MmTpxX';
const BASE_TOKEN = 'GnfqbhwSiaz0oSsV0XJcL2xSn1g';
const TABLE_ID = 'tblyU9Y2AlW5gief';

async function getToken() {
  const res = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ app_id: APP_ID, app_secret: APP_SECRET })
  });
  const data = await res.json();
  return data.tenant_access_token || '';
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = req.body;
    const token = await getToken();
    if (!token) return res.status(500).json({ error: '获取飞书token失败' });

    const rooms = body.rooms || [];
    let successCount = 0;

    for (const room of rooms) {
      const record = {
        fields: {
          '设备ip': body.ip || '未知',
          '设备': body.device || '未知',
          '昵称': body.nickname || '',
          '次数': String(body.count || 1),
          '开始时间': body.startTime || '',
          '结束时间': body.endTime || '',
          '测试时长': body.duration || '',
          '综合类型（四神兽）': body.beastType || '',
          '综合类型（16型）': body.type16 || '',
          '综合分数': String(body.totalScore || '0'),
          '所属房间': room.room || '',
          '房间类型（四神兽）': room.beast || '',
          '房间类型（16型）': room.type || '',
          '房间分数': String(room.score || '0'),
          '是否为五房间最低分数': room.isLowest ? '是' : '否',
          '与最佳房间策略差异项': room.diffNote || ''
        }
      };

      const resp = await fetch(
        `https://open.feishu.cn/open-apis/bitable/v1/apps/${BASE_TOKEN}/tables/${TABLE_ID}/records`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(record)
        }
      );
      const result = await resp.json();
      if (result.code === 0) successCount++;
    }

    return res.status(200).json({ ok: true, written: successCount, total: rooms.length });
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
