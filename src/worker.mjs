import './cvnss_converter.js';

const cv = globalThis.CVNSSConverter;
if (!cv) throw new Error('CVNSSConverter failed to initialize');

const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'content-type, authorization, x-api-key',
  'access-control-allow-methods': 'GET,POST,OPTIONS',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      ...CORS,
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

function text(body, contentType = 'text/plain; charset=utf-8', status = 200) {
  return new Response(body, {
    status,
    headers: { ...CORS, 'content-type': contentType, 'cache-control': 'no-store' },
  });
}

async function readJson(request, maxBytes = 256 * 1024) {
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > maxBytes) throw new Error('Payload too large');
  return raw ? JSON.parse(raw) : {};
}

function authorized(request, env) {
  const expected = env?.CVNSS_API_KEY || '';
  if (!expected) return true;
  const auth = request.headers.get('authorization') || '';
  const bearer = auth.replace(/^Bearer\s+/i, '');
  const custom = request.headers.get('x-api-key') || '';
  return bearer === expected || custom === expected;
}

function choose(result, to) {
  if (!['cqn', 'cvn', 'cvss'].includes(to)) throw new Error('Invalid to mode');
  return result[to];
}

function openApiYaml(origin) {
  const safeOrigin = origin.replace(/\/$/, '');
  return `openapi: 3.1.0
info:
  title: CVNSS4.0 Instant Converter API
  version: 5.0.0
  description: Deterministic CQN/CVN/CVNSS4.0 converter backed by CVNSS4.0 v5.0 audit-safe.
servers:
  - url: ${safeOrigin}
paths:
  /convert:
    post:
      operationId: convertInstant
      summary: Convert text instantly between CQN, CVN and CVNSS4.0
      description: Always use this operation for normal CVNSS4.0 conversion or decoding. Do not audit first.
      x-openai-isConsequential: false
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [text, from, to]
              properties:
                text:
                  type: string
                from:
                  type: string
                  enum: [cqn, cvn, cvss]
                to:
                  type: string
                  enum: [cqn, cvn, cvss]
      responses:
        '200':
          description: Converted text
          content:
            application/json:
              schema:
                type: object
                properties:
                  output: { type: string }
                  cqn: { type: string }
                  cvn: { type: string }
                  cvss: { type: string }
                  version: { type: string }
                  elapsed_ms: { type: number }
  /inspect:
    post:
      operationId: inspectCvnssWord
      summary: Inspect one CVN/CVNSS4.0 word for ambiguity
      description: Use only for explicit audit/debug requests, not normal conversion.
      x-openai-isConsequential: false
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [word]
              properties:
                word:
                  type: string
                source:
                  type: string
                  enum: [cvn, cvss]
                  default: cvss
      responses:
        '200':
          description: Ambiguity inspection result
          content:
            application/json:
              schema:
                type: object
                additionalProperties: true
  /health:
    get:
      operationId: cvnssHealth
      summary: Check converter health
      x-openai-isConsequential: false
      responses:
        '200':
          description: Health status
          content:
            application/json:
              schema:
                type: object
                properties:
                  ok: { type: boolean }
                  version: { type: string }
                  selfTestOk: { type: boolean }
`;
}

const SELF_TEST = cv.selfTest();

export default {
  async fetch(request, env) {
    try {
      if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
      const url = new URL(request.url);

      if (url.pathname === '/' && request.method === 'GET') {
        return json({
          ok: SELF_TEST.ok,
          service: 'CVNSS4.0 Instant Actions API',
          version: cv.VERSION,
          endpoints: ['/convert', '/inspect', '/health', '/openapi.yaml', '/privacy'],
        });
      }

      if (url.pathname === '/health' && request.method === 'GET') {
        return json({
          ok: SELF_TEST.ok,
          version: cv.VERSION,
          sourceVersion: cv.SOURCE_VERSION,
          selfTestOk: SELF_TEST.ok,
          tests: SELF_TEST.tests,
          audit: cv.audit(),
        });
      }

      if (url.pathname === '/openapi.yaml' && request.method === 'GET') {
        return text(openApiYaml(url.origin), 'application/yaml; charset=utf-8');
      }

      if (url.pathname === '/privacy' && request.method === 'GET') {
        return text(`<!doctype html><html lang="vi"><meta charset="utf-8"><title>CVNSS4.0 Actions Privacy</title><body><h1>CVNSS4.0 Actions Privacy</h1><p>Dịch vụ chỉ xử lý văn bản được gửi để trả kết quả chuyển đổi CQN/CVN/CVNSS4.0. Mã nguồn tham chiếu không chủ ý lưu nội dung yêu cầu.</p></body></html>`, 'text/html; charset=utf-8');
      }

      if (!authorized(request, env)) return json({ error: 'Unauthorized' }, 401);

      if (url.pathname === '/convert' && request.method === 'POST') {
        const body = await readJson(request);
        const input = String(body.text ?? '');
        const from = body.from || 'cqn';
        const to = body.to || (from === 'cvss' ? 'cqn' : 'cvss');
        if (!['cqn', 'cvn', 'cvss'].includes(from)) return json({ error: 'Invalid from mode' }, 400);
        if (!['cqn', 'cvn', 'cvss'].includes(to)) return json({ error: 'Invalid to mode' }, 400);

        const t0 = performance.now();
        const result = cv.convert(input, from);
        const elapsed = performance.now() - t0;
        return json({
          output: choose(result, to),
          cqn: result.cqn,
          cvn: result.cvn,
          cvss: result.cvss,
          version: cv.VERSION,
          elapsed_ms: Number(elapsed.toFixed(4)),
        });
      }

      if (url.pathname === '/inspect' && request.method === 'POST') {
        const body = await readJson(request, 32 * 1024);
        const word = String(body.word ?? '');
        const source = body.source || 'cvss';
        if (!word) return json({ error: 'word is required' }, 400);
        if (!['cvn', 'cvss'].includes(source)) return json({ error: 'Invalid source' }, 400);
        return json(cv.inspectWord(word, source));
      }

      return json({ error: 'Not found' }, 404);
    } catch (error) {
      return json({ error: error?.message || String(error) }, 500);
    }
  },
};
