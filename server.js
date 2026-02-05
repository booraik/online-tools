const express = require('express');
const fetch = require('node-fetch');
const https = require('https');
const { VM } = require('vm2');
const tls = require('tls');
const dns = require('dns').promises;

const app = express();
app.use(express.json({ limit: '10mb' }));

// 정적 파일 서빙 (frontend) - 캐시 설정 포함
app.use(express.static(__dirname, {
    maxAge: '1h',
    etag: true
}));

// Backend 상태 확인 (프론트엔드에서 Server 모드 감지용)
app.get('/api/auth/check', (req, res) => {
    res.json({ ok: true });
});

// SSL 인증서 가져오기
app.post('/api/cert/fetch', (req, res) => {
    const { host, port = 443 } = req.body;

    if (!host) {
        return res.status(400).json({ error: 'Host is required' });
    }

    const options = {
        host: host,
        port: port,
        servername: host,
        rejectUnauthorized: false  // 만료/자체서명 인증서도 가져오기
    };

    let responded = false;
    const sendResponse = (statusCode, data) => {
        if (responded) return;
        responded = true;
        res.status(statusCode).json(data);
    };

    const socket = tls.connect(options, () => {
        try {
            const cert = socket.getPeerCertificate(true);

            if (!cert || Object.keys(cert).length === 0) {
                socket.destroy();
                return sendResponse(400, { error: 'No certificate found' });
            }

            // PEM 형식으로 변환
            const pemCert = '-----BEGIN CERTIFICATE-----\n' +
                cert.raw.toString('base64').match(/.{1,64}/g).join('\n') +
                '\n-----END CERTIFICATE-----';

            socket.destroy();
            sendResponse(200, {
                success: true,
                pem: pemCert,
                info: {
                    subject: cert.subject,
                    issuer: cert.issuer,
                    validFrom: cert.valid_from,
                    validTo: cert.valid_to,
                    serialNumber: cert.serialNumber
                }
            });
        } catch (e) {
            socket.destroy();
            sendResponse(500, { error: e.message });
        }
    });

    socket.setTimeout(10000);
    socket.on('timeout', () => {
        socket.destroy();
        sendResponse(504, { error: 'Connection timeout' });
    });

    socket.on('error', (err) => {
        sendResponse(500, { error: err.message });
    });
});

// 파일 다운로드 프록시
app.get('/api/download', async (req, res) => {
    try {
        const { url } = req.query;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // URL 검증
        const parsedUrl = new URL(url);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return res.status(400).json({ error: 'Invalid URL protocol' });
        }

        const userAgent = req.headers['x-user-agent'] || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

        const response = await fetch(url, {
            headers: {
                'User-Agent': userAgent
            }
        });

        if (!response.ok) {
            return res.status(response.status).json({ error: `Failed to fetch: ${response.statusText}` });
        }

        // 파일명 추출
        const contentDisposition = response.headers.get('content-disposition');
        let filename = '';
        if (contentDisposition) {
            const match = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (match) filename = match[1].replace(/['"]/g, '');
        }
        if (!filename) {
            filename = parsedUrl.pathname.split('/').pop() || 'download';
        }

        // Content-Type 전달
        const contentType = response.headers.get('content-type');
        if (contentType) {
            res.setHeader('Content-Type', contentType);
        }

        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

        // 스트리밍 전송
        response.body.pipe(res);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DNS 조회
app.post('/api/network/dns', async (req, res) => {
    const { host, type = 'A' } = req.body;

    if (!host) {
        return res.status(400).json({ error: 'Host is required' });
    }

    try {
        let results = [];

        switch (type.toUpperCase()) {
            case 'A':
                results = await dns.resolve4(host);
                break;
            case 'AAAA':
                results = await dns.resolve6(host);
                break;
            case 'MX':
                results = await dns.resolveMx(host);
                break;
            case 'TXT':
                results = await dns.resolveTxt(host);
                break;
            case 'NS':
                results = await dns.resolveNs(host);
                break;
            case 'CNAME':
                results = await dns.resolveCname(host);
                break;
            case 'SOA':
                results = [await dns.resolveSoa(host)];
                break;
            case 'PTR':
                results = await dns.reverse(host);
                break;
            default:
                return res.status(400).json({ error: `Unsupported record type: ${type}` });
        }

        res.json({
            success: true,
            host,
            type,
            results,
            queriedAt: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            error: error.code === 'ENOTFOUND' ? 'Domain not found' : error.message
        });
    }
});

// HTTP 요청 실행 - CORS 우회
app.post('/api/network/http', async (req, res) => {
    const { url, method = 'GET', headers = {}, body, insecure = false } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        const parsedUrl = new URL(url);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return res.status(400).json({ error: 'Invalid URL protocol' });
        }

        const startTime = Date.now();
        const options = {
            method,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                ...headers
            }
        };

        // SSL 인증서 무시 옵션
        if (insecure && parsedUrl.protocol === 'https:') {
            options.agent = new https.Agent({ rejectUnauthorized: false });
        }

        if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
            options.body = typeof body === 'string' ? body : JSON.stringify(body);
        }

        const response = await fetch(url, options);
        const latency = Date.now() - startTime;
        const responseText = await response.text();

        // 응답 헤더 수집
        const responseHeaders = {};
        response.headers.forEach((value, key) => {
            responseHeaders[key] = value;
        });

        res.json({
            success: true,
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
            body: responseText,
            latency,
            url: response.url
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API 프록시
app.post('/api/proxy', async (req, res) => {
    try {
        const { url, options = {} } = req.body;

        // URL 검증
        const parsedUrl = new URL(url);
        if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
            return res.status(400).json({ error: 'Invalid URL protocol' });
        }

        const response = await fetch(url, {
            method: options.method || 'GET',
            headers: options.headers || {},
            body: options.body ? JSON.stringify(options.body) : undefined
        });

        const contentType = response.headers.get('content-type');
        let data;

        if (contentType?.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        res.json({
            status: response.status,
            headers: Object.fromEntries(response.headers),
            data
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// 코드 실행 (JavaScript 샌드박스)
app.post('/api/execute', (req, res) => {
    try {
        const { code, language } = req.body;

        if (language !== 'javascript') {
            return res.status(400).json({ error: 'Only JavaScript is supported' });
        }

        const output = [];
        const vm = new VM({
            timeout: 5000,
            sandbox: {
                console: {
                    log: (...args) => output.push(args.join(' ')),
                    error: (...args) => output.push('[ERROR] ' + args.join(' '))
                }
            }
        });

        const result = vm.run(code);

        res.json({
            success: true,
            output: output.join('\n'),
            result: result !== undefined ? String(result) : undefined
        });
    } catch (error) {
        res.json({
            success: false,
            error: error.message
        });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
