// Online Tools Application
(function() {
    'use strict';

    // Server Mode Manager - Backend 연동 시 추가 기능 제공
    const serverMode = {
        enabled: false,
        authenticated: false,
        backendUrl: '/api',

        init() {
            const toggle = document.getElementById('authToggle');

            // file:// 프로토콜이면 토글 비활성화
            if (window.location.protocol === 'file:') {
                if (toggle) {
                    toggle.disabled = true;
                    toggle.parentElement.title = 'Server mode requires HTTP';
                }
                return;
            }

            // 로그인 후 돌아온 경우 인증 상태 확인
            if (sessionStorage.getItem('serverModeLoginAttempt')) {
                sessionStorage.removeItem('serverModeLoginAttempt');
                this.checkAuthStatus();
            }
        },

        updateAuthUI() {
            const label = document.getElementById('authLabel');
            const toggle = document.getElementById('authToggle');

            if (this.authenticated) {
                if (label) {
                    label.textContent = 'Authorized';
                    label.classList.add('authorized');
                }
                if (toggle) toggle.checked = true;
            } else {
                if (label) {
                    label.textContent = 'Guest';
                    label.classList.remove('authorized');
                }
                if (toggle) toggle.checked = false;
            }
        },

        async checkAuthStatus() {
            try {
                const response = await fetch('/api/auth/check', { credentials: 'include' });
                if (response.ok) {
                    const data = await response.json();
                    this.enabled = true;
                    this.authenticated = data.authenticated;
                    this.updateAuthUI();
                }
            } catch (e) {
                // Backend 없음
                this.enabled = false;
                this.authenticated = false;
                this.updateAuthUI();
            }
        },

        toggleAuth(checked) {
            if (checked) {
                // ON으로 전환 시도 -> 로그인 필요
                this.login();
            } else {
                // OFF로 전환 -> 로그아웃
                this.logout();
            }
        },

        login() {
            // 로그인 시도 표시 후 리다이렉트
            sessionStorage.setItem('serverModeLoginAttempt', 'true');
            window.location.href = '/api/auth/login';
        },

        logout() {
            this.enabled = false;
            this.authenticated = false;
            this.updateAuthUI();
            fetch('/api/auth/logout', { credentials: 'include' })
                .then(() => window.location.reload());
        },

        // API 프록시 호출 (로그인 필요)
        async proxyFetch(url, options = {}) {
            if (!this.enabled || !this.authenticated) {
                throw new Error('Login required for this feature');
            }

            const response = await fetch('/api/proxy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ url, options })
            });

            return response.json();
        },

        // 코드 실행 (로그인 필요)
        async execute(code, language) {
            if (!this.enabled || !this.authenticated) {
                throw new Error('Login required for this feature');
            }

            const response = await fetch('/api/execute', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ code, language })
            });

            return response.json();
        }
    };

    // window에 노출
    window.serverMode = serverMode;

    // Dynamic Library Loader
    const libraryLoader = {
        // Library definitions with URLs and check functions
        libraries: {
            marked: {
                name: 'Markdown (marked.js)',
                url: 'https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.6/marked.min.js',
                check: () => typeof marked !== 'undefined',
                loaded: false,
                loading: false
            },
            hljs: {
                name: 'Syntax Highlighting (highlight.js)',
                url: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js',
                css: 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css',
                check: () => typeof hljs !== 'undefined',
                loaded: false,
                loading: false
            },
            diff_match_patch: {
                name: 'Diff (diff_match_patch)',
                url: 'https://cdnjs.cloudflare.com/ajax/libs/diff_match_patch/20121119/diff_match_patch.min.js',
                check: () => typeof diff_match_patch !== 'undefined',
                loaded: false,
                loading: false
            },
            jsyaml: {
                name: 'YAML (js-yaml)',
                url: 'https://cdnjs.cloudflare.com/ajax/libs/js-yaml/4.1.0/js-yaml.min.js',
                check: () => typeof jsyaml !== 'undefined',
                loaded: false,
                loading: false
            },
            vkbeautify: {
                name: 'XML/HTML (vkbeautify)',
                url: 'https://cdnjs.cloudflare.com/ajax/libs/vkbeautify/0.99.00/vkbeautify.min.js',
                check: () => typeof vkbeautify !== 'undefined',
                loaded: false,
                loading: false
            },
            sqlFormatter: {
                name: 'SQL (sql-formatter)',
                url: 'https://cdnjs.cloudflare.com/ajax/libs/sql-formatter/4.0.2/sql-formatter.min.js',
                check: () => typeof sqlFormatter !== 'undefined',
                loaded: false,
                loading: false
            },
            CryptoJS: {
                name: 'Hash (crypto-js)',
                url: 'https://cdnjs.cloudflare.com/ajax/libs/crypto-js/4.1.1/crypto-js.min.js',
                check: () => typeof CryptoJS !== 'undefined',
                loaded: false,
                loading: false
            },
            textile: {
                name: 'Textile (textile-js)',
                url: 'https://cdnjs.cloudflare.com/ajax/libs/textile-js/2.0.116/textile.min.js',
                check: () => typeof textile !== 'undefined',
                loaded: false,
                loading: false
            },
            jsbeautify: {
                name: 'JavaScript (js-beautify)',
                url: 'https://cdnjs.cloudflare.com/ajax/libs/js-beautify/1.14.11/beautify.min.js',
                check: () => typeof js_beautify !== 'undefined',
                loaded: false,
                loading: false
            },
            forge: {
                name: 'Certificate (node-forge)',
                url: 'https://cdnjs.cloudflare.com/ajax/libs/forge/0.10.0/forge.min.js',
                check: () => typeof forge !== 'undefined',
                loaded: false,
                loading: false
            }
        },

        // Map tabs to required libraries
        tabLibraries: {
            // Viewer tabs
            'viewer/markdown': ['marked', 'hljs'],
            'viewer/textile': ['textile'],
            'encrypt/cert': ['forge'],
            // Formatter tabs
            'formatter/json': [],  // Native JSON
            'formatter/yaml': ['jsyaml'],
            'formatter/xml': ['vkbeautify'],
            'formatter/sql': ['sqlFormatter'],
            'formatter/html': ['vkbeautify'],
            'formatter/javascript': ['jsbeautify'],
            // Differ tabs
            'differ/text': ['diff_match_patch'],
            // Encrypt tabs
            'encrypt/hash': ['CryptoJS']
        },

        // Get libraries for a specific tab
        getTabLibraries(category, tab) {
            const key = `${category}/${tab}`;
            return this.tabLibraries[key] || [];
        },

        // Load a CSS file
        loadCSS(url) {
            return new Promise((resolve) => {
                if (document.querySelector(`link[href="${url}"]`)) {
                    resolve();
                    return;
                }
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = url;
                link.onload = resolve;
                link.onerror = resolve; // Don't fail on CSS error
                document.head.appendChild(link);
            });
        },

        // Load a single library
        async loadLibrary(libName, timeout = 2000) {
            const lib = this.libraries[libName];
            if (!lib) return false;

            // Already loaded
            if (lib.loaded || lib.check()) {
                lib.loaded = true;
                return true;
            }

            // Currently loading, wait for it
            if (lib.loading) {
                return new Promise((resolve) => {
                    const checkInterval = setInterval(() => {
                        if (!lib.loading) {
                            clearInterval(checkInterval);
                            resolve(lib.loaded);
                        }
                    }, 100);
                });
            }

            lib.loading = true;

            // Load CSS if exists
            if (lib.css) {
                await this.loadCSS(lib.css);
            }

            return new Promise((resolve) => {
                const script = document.createElement('script');
                script.src = lib.url;

                const timeoutId = setTimeout(() => {
                    lib.loading = false;
                    lib.loaded = false;
                    resolve(false);
                }, timeout);

                script.onload = () => {
                    clearTimeout(timeoutId);
                    // Small delay to ensure library is fully initialized
                    setTimeout(() => {
                        lib.loading = false;
                        lib.loaded = lib.check();
                        resolve(lib.loaded);
                    }, 50);
                };

                script.onerror = () => {
                    clearTimeout(timeoutId);
                    lib.loading = false;
                    lib.loaded = false;
                    resolve(false);
                };

                document.head.appendChild(script);
            });
        },

        // Load all libraries for a specific tab
        async loadForTab(category, tab) {
            const libs = this.getTabLibraries(category, tab);
            if (!libs || libs.length === 0) return {};

            const results = {};
            const loadPromises = libs.map(async (libName) => {
                results[libName] = await this.loadLibrary(libName);
            });

            await Promise.all(loadPromises);
            return results;
        },

        // Check if tab has unloaded libraries
        hasUnloadedForTab(category, tab) {
            const libs = this.getTabLibraries(category, tab);
            return libs.some(lib => !this.isLoaded(lib));
        },

        // Check if library is loaded
        isLoaded(libName) {
            const lib = this.libraries[libName];
            return lib ? (lib.loaded || lib.check()) : false;
        },

        // Preload only used libraries in background (non-blocking)
        preloadAll() {
            const usedLibs = new Set();
            Object.values(this.tabLibraries).forEach(libs => {
                libs.forEach(lib => usedLibs.add(lib));
            });
            usedLibs.forEach(libName => {
                if (!this.isLoaded(libName) && !this.libraries[libName].loading) {
                    this.loadLibrary(libName, 10000);
                }
            });
        },

        // Get status for display
        getStatus() {
            const status = {};
            for (const [key, lib] of Object.entries(this.libraries)) {
                status[key] = {
                    name: lib.name,
                    loaded: lib.loaded || lib.check(),
                    loading: lib.loading
                };
            }
            return status;
        }
    };

    // Theme Management
    const themeManager = {
        init() {
            // Default to dark mode if no preference is saved
            const savedTheme = localStorage.getItem('theme');
            const theme = savedTheme !== null ? savedTheme : 'dark';
            this.setTheme(theme);

            // Set up toggle listener
            document.getElementById('themeToggle').addEventListener('click', () => {
                this.toggleTheme();
            });
        },

        setTheme(theme) {
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('theme', theme);
            this.updateToggleUI(theme);
        },

        toggleTheme() {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            this.setTheme(newTheme);
        },

        updateToggleUI(theme) {
            const icon = document.getElementById('themeIcon');
            const label = document.getElementById('themeLabel');

            if (theme === 'dark') {
                icon.textContent = '🌙';
                label.textContent = 'Dark';
            } else {
                icon.textContent = '☀️';
                label.textContent = 'Light';
            }
        }
    };

    // Router
    const router = {
        routes: {},
        currentRoute: null,

        init() {
            window.addEventListener('hashchange', () => this.handleRoute());
            this.handleRoute();
        },

        async handleRoute() {
            const hash = window.location.hash.slice(1) || '/viewer';
            const parts = hash.split('/').filter(p => p);
            const category = parts[0] || 'viewer';
            const subTab = parts[1] || null;

            this.currentRoute = { category, subTab };
            this.updateNavigation();

            try {
                await this.render();
            } catch (e) {
                console.error('Error rendering page:', e);
            }
        },

        async render() {
            const app = document.getElementById('app');
            const { category, subTab } = this.currentRoute;

            if (pages[category]) {
                // Render the page (pages handle their own library loading per tab)
                app.innerHTML = pages[category].render(subTab);
                await pages[category].init(subTab);
            } else {
                app.innerHTML = '<h1>Page Not Found</h1>';
            }
        },

        updateNavigation() {
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
                if (link.dataset.category === this.currentRoute.category) {
                    link.classList.add('active');
                }
            });
        },

        navigate(path) {
            window.location.hash = path;
        }
    };

    // Built-in Formatters (fallback when external libraries are not available)
    const builtinFormatters = {
        // Simple XML/HTML formatter
        formatXml(xml, indent = 2) {
            let formatted = '';
            let pad = 0;
            const nodes = xml.replace(/>\s*</g, '><').split(/(<[^>]+>)/);

            nodes.forEach(node => {
                if (!node.trim()) return;

                if (node.match(/^<\/\w/)) {
                    pad -= indent;
                }

                formatted += ' '.repeat(Math.max(0, pad)) + node + '\n';

                if (node.match(/^<\w[^>]*[^\/]>$/)) {
                    pad += indent;
                }
            });

            return formatted.trim();
        },

        // Simple SQL formatter
        formatSql(sql) {
            const keywords = ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'JOIN', 'LEFT', 'RIGHT', 'INNER', 'OUTER',
                'ON', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT', 'OFFSET', 'INSERT', 'INTO', 'VALUES',
                'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'DROP', 'ALTER', 'INDEX', 'UNION', 'AS'];

            let formatted = sql.trim();

            // Add newlines before major keywords
            const majorKeywords = ['SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT',
                'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER', 'UNION'];

            majorKeywords.forEach(kw => {
                const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
                formatted = formatted.replace(regex, '\n$1');
            });

            // Add newlines after AND/OR
            formatted = formatted.replace(/\b(AND|OR)\b/gi, '\n    $1');

            // Uppercase keywords
            keywords.forEach(kw => {
                const regex = new RegExp(`\\b(${kw})\\b`, 'gi');
                formatted = formatted.replace(regex, kw);
            });

            return formatted.trim();
        },

        // Simple YAML parser/formatter (basic support)
        formatYaml(yaml) {
            // Just return as-is with normalized indentation for basic YAML
            return yaml.split('\n').map(line => {
                const trimmed = line.trimStart();
                const indent = line.length - trimmed.length;
                return ' '.repeat(indent) + trimmed;
            }).join('\n');
        },

        // Simple JavaScript formatter (basic support)
        formatJavaScript(js, indent = 4) {
            const indentStr = indent === '\t' ? '\t' : ' '.repeat(indent);
            let result = '';
            let level = 0;
            let inString = false;
            let stringChar = '';
            let inComment = false;
            let inMultiLineComment = false;
            let newLine = true;

            const addIndent = () => indentStr.repeat(level);

            for (let i = 0; i < js.length; i++) {
                const char = js[i];
                const nextChar = js[i + 1];
                const prevChar = js[i - 1];

                // Handle strings
                if (!inComment && !inMultiLineComment && (char === '"' || char === "'" || char === '`') && prevChar !== '\\') {
                    if (!inString) {
                        inString = true;
                        stringChar = char;
                    } else if (char === stringChar) {
                        inString = false;
                    }
                    result += char;
                    continue;
                }

                if (inString) {
                    result += char;
                    continue;
                }

                // Handle comments
                if (!inMultiLineComment && char === '/' && nextChar === '/') {
                    inComment = true;
                    result += char;
                    continue;
                }

                if (!inComment && char === '/' && nextChar === '*') {
                    inMultiLineComment = true;
                    result += char;
                    continue;
                }

                if (inMultiLineComment && char === '*' && nextChar === '/') {
                    result += '*/';
                    i++;
                    inMultiLineComment = false;
                    continue;
                }

                if (inComment && char === '\n') {
                    inComment = false;
                    result += char;
                    newLine = true;
                    continue;
                }

                if (inComment || inMultiLineComment) {
                    result += char;
                    continue;
                }

                // Handle braces and brackets
                if (char === '{' || char === '[') {
                    result += char + '\n';
                    level++;
                    result += addIndent();
                    newLine = true;
                    continue;
                }

                if (char === '}' || char === ']') {
                    level = Math.max(0, level - 1);
                    result = result.trimEnd() + '\n' + addIndent() + char;
                    newLine = false;
                    continue;
                }

                // Handle semicolons
                if (char === ';') {
                    result += char + '\n';
                    result += addIndent();
                    newLine = true;
                    continue;
                }

                // Handle newlines
                if (char === '\n') {
                    if (!newLine) {
                        result += '\n' + addIndent();
                        newLine = true;
                    }
                    continue;
                }

                // Skip extra whitespace at line start
                if (newLine && (char === ' ' || char === '\t')) {
                    continue;
                }

                newLine = false;
                result += char;
            }

            return result.trim();
        }
    };

    // Built-in Hash Functions (using Web Crypto API)
    const builtinHash = {
        async md5(message) {
            // MD5 is not in Web Crypto API, provide simple implementation
            return this.simpleMd5(message);
        },

        simpleMd5(string) {
            function md5cycle(x, k) {
                var a = x[0], b = x[1], c = x[2], d = x[3];
                a = ff(a, b, c, d, k[0], 7, -680876936);
                d = ff(d, a, b, c, k[1], 12, -389564586);
                c = ff(c, d, a, b, k[2], 17, 606105819);
                b = ff(b, c, d, a, k[3], 22, -1044525330);
                a = ff(a, b, c, d, k[4], 7, -176418897);
                d = ff(d, a, b, c, k[5], 12, 1200080426);
                c = ff(c, d, a, b, k[6], 17, -1473231341);
                b = ff(b, c, d, a, k[7], 22, -45705983);
                a = ff(a, b, c, d, k[8], 7, 1770035416);
                d = ff(d, a, b, c, k[9], 12, -1958414417);
                c = ff(c, d, a, b, k[10], 17, -42063);
                b = ff(b, c, d, a, k[11], 22, -1990404162);
                a = ff(a, b, c, d, k[12], 7, 1804603682);
                d = ff(d, a, b, c, k[13], 12, -40341101);
                c = ff(c, d, a, b, k[14], 17, -1502002290);
                b = ff(b, c, d, a, k[15], 22, 1236535329);
                a = gg(a, b, c, d, k[1], 5, -165796510);
                d = gg(d, a, b, c, k[6], 9, -1069501632);
                c = gg(c, d, a, b, k[11], 14, 643717713);
                b = gg(b, c, d, a, k[0], 20, -373897302);
                a = gg(a, b, c, d, k[5], 5, -701558691);
                d = gg(d, a, b, c, k[10], 9, 38016083);
                c = gg(c, d, a, b, k[15], 14, -660478335);
                b = gg(b, c, d, a, k[4], 20, -405537848);
                a = gg(a, b, c, d, k[9], 5, 568446438);
                d = gg(d, a, b, c, k[14], 9, -1019803690);
                c = gg(c, d, a, b, k[3], 14, -187363961);
                b = gg(b, c, d, a, k[8], 20, 1163531501);
                a = gg(a, b, c, d, k[13], 5, -1444681467);
                d = gg(d, a, b, c, k[2], 9, -51403784);
                c = gg(c, d, a, b, k[7], 14, 1735328473);
                b = gg(b, c, d, a, k[12], 20, -1926607734);
                a = hh(a, b, c, d, k[5], 4, -378558);
                d = hh(d, a, b, c, k[8], 11, -2022574463);
                c = hh(c, d, a, b, k[11], 16, 1839030562);
                b = hh(b, c, d, a, k[14], 23, -35309556);
                a = hh(a, b, c, d, k[1], 4, -1530992060);
                d = hh(d, a, b, c, k[4], 11, 1272893353);
                c = hh(c, d, a, b, k[7], 16, -155497632);
                b = hh(b, c, d, a, k[10], 23, -1094730640);
                a = hh(a, b, c, d, k[13], 4, 681279174);
                d = hh(d, a, b, c, k[0], 11, -358537222);
                c = hh(c, d, a, b, k[3], 16, -722521979);
                b = hh(b, c, d, a, k[6], 23, 76029189);
                a = hh(a, b, c, d, k[9], 4, -640364487);
                d = hh(d, a, b, c, k[12], 11, -421815835);
                c = hh(c, d, a, b, k[15], 16, 530742520);
                b = hh(b, c, d, a, k[2], 23, -995338651);
                a = ii(a, b, c, d, k[0], 6, -198630844);
                d = ii(d, a, b, c, k[7], 10, 1126891415);
                c = ii(c, d, a, b, k[14], 15, -1416354905);
                b = ii(b, c, d, a, k[5], 21, -57434055);
                a = ii(a, b, c, d, k[12], 6, 1700485571);
                d = ii(d, a, b, c, k[3], 10, -1894986606);
                c = ii(c, d, a, b, k[10], 15, -1051523);
                b = ii(b, c, d, a, k[1], 21, -2054922799);
                a = ii(a, b, c, d, k[8], 6, 1873313359);
                d = ii(d, a, b, c, k[15], 10, -30611744);
                c = ii(c, d, a, b, k[6], 15, -1560198380);
                b = ii(b, c, d, a, k[13], 21, 1309151649);
                a = ii(a, b, c, d, k[4], 6, -145523070);
                d = ii(d, a, b, c, k[11], 10, -1120210379);
                c = ii(c, d, a, b, k[2], 15, 718787259);
                b = ii(b, c, d, a, k[9], 21, -343485551);
                x[0] = add32(a, x[0]);
                x[1] = add32(b, x[1]);
                x[2] = add32(c, x[2]);
                x[3] = add32(d, x[3]);
            }

            function cmn(q, a, b, x, s, t) {
                a = add32(add32(a, q), add32(x, t));
                return add32((a << s) | (a >>> (32 - s)), b);
            }

            function ff(a, b, c, d, x, s, t) {
                return cmn((b & c) | ((~b) & d), a, b, x, s, t);
            }

            function gg(a, b, c, d, x, s, t) {
                return cmn((b & d) | (c & (~d)), a, b, x, s, t);
            }

            function hh(a, b, c, d, x, s, t) {
                return cmn(b ^ c ^ d, a, b, x, s, t);
            }

            function ii(a, b, c, d, x, s, t) {
                return cmn(c ^ (b | (~d)), a, b, x, s, t);
            }

            function md51(s) {
                var n = s.length,
                    state = [1732584193, -271733879, -1732584194, 271733878], i;
                for (i = 64; i <= s.length; i += 64) {
                    md5cycle(state, md5blk(s.substring(i - 64, i)));
                }
                s = s.substring(i - 64);
                var tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
                for (i = 0; i < s.length; i++)
                    tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
                tail[i >> 2] |= 0x80 << ((i % 4) << 3);
                if (i > 55) {
                    md5cycle(state, tail);
                    for (i = 0; i < 16; i++) tail[i] = 0;
                }
                tail[14] = n * 8;
                md5cycle(state, tail);
                return state;
            }

            function md5blk(s) {
                var md5blks = [], i;
                for (i = 0; i < 64; i += 4) {
                    md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) +
                        (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
                }
                return md5blks;
            }

            var hex_chr = '0123456789abcdef'.split('');

            function rhex(n) {
                var s = '', j = 0;
                for (; j < 4; j++)
                    s += hex_chr[(n >> (j * 8 + 4)) & 0x0F] + hex_chr[(n >> (j * 8)) & 0x0F];
                return s;
            }

            function hex(x) {
                for (var i = 0; i < x.length; i++)
                    x[i] = rhex(x[i]);
                return x.join('');
            }

            function add32(a, b) {
                return (a + b) & 0xFFFFFFFF;
            }

            return hex(md51(string));
        },

        async sha1(message) {
            const msgBuffer = new TextEncoder().encode(message);
            const hashBuffer = await crypto.subtle.digest('SHA-1', msgBuffer);
            return this.bufferToHex(hashBuffer);
        },

        async sha256(message) {
            const msgBuffer = new TextEncoder().encode(message);
            const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
            return this.bufferToHex(hashBuffer);
        },

        async sha512(message) {
            const msgBuffer = new TextEncoder().encode(message);
            const hashBuffer = await crypto.subtle.digest('SHA-512', msgBuffer);
            return this.bufferToHex(hashBuffer);
        },

        bufferToHex(buffer) {
            return Array.from(new Uint8Array(buffer))
                .map(b => b.toString(16).padStart(2, '0'))
                .join('');
        }
    };

    // Simple Diff Implementation (fallback when diff_match_patch is not available)
    const simpleDiff = {
        diff(text1, text2) {
            const lines1 = text1.split('\n');
            const lines2 = text2.split('\n');
            const result = [];

            let i = 0, j = 0;
            while (i < lines1.length || j < lines2.length) {
                if (i >= lines1.length) {
                    result.push([1, lines2[j] + '\n']);
                    j++;
                } else if (j >= lines2.length) {
                    result.push([-1, lines1[i] + '\n']);
                    i++;
                } else if (lines1[i] === lines2[j]) {
                    result.push([0, lines1[i] + '\n']);
                    i++;
                    j++;
                } else {
                    // Simple approach: mark as removed then added
                    result.push([-1, lines1[i] + '\n']);
                    result.push([1, lines2[j] + '\n']);
                    i++;
                    j++;
                }
            }
            return result;
        }
    };

    // Simple Markdown Parser
    const markdownParser = {
        parse(text) {
            if (!text) return '';

            let html = text;

            // Escape HTML
            html = html.replace(/&/g, '&amp;')
                       .replace(/</g, '&lt;')
                       .replace(/>/g, '&gt;');

            // Code blocks (``` ... ```)
            html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
                return `<pre><code class="language-${lang}">${code.trim()}</code></pre>`;
            });

            // Inline code (`code`)
            html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

            // Headers
            html = html.replace(/^###### (.+)$/gm, '<h6>$1</h6>');
            html = html.replace(/^##### (.+)$/gm, '<h5>$1</h5>');
            html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');
            html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
            html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
            html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');

            // Bold and Italic
            html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
            html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
            html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
            html = html.replace(/___(.+?)___/g, '<strong><em>$1</em></strong>');
            html = html.replace(/__(.+?)__/g, '<strong>$1</strong>');
            html = html.replace(/_(.+?)_/g, '<em>$1</em>');

            // Strikethrough
            html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

            // Blockquotes
            html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');
            // Merge consecutive blockquotes
            html = html.replace(/<\/blockquote>\n<blockquote>/g, '\n');

            // Horizontal rules
            html = html.replace(/^(-{3,}|_{3,}|\*{3,})$/gm, '<hr>');

            // Links
            html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');

            // Images
            html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1">');

            // Tables
            html = this.parseTables(html);

            // Unordered lists
            html = this.parseUnorderedLists(html);

            // Ordered lists
            html = this.parseOrderedLists(html);

            // Paragraphs (lines that aren't already wrapped in tags)
            html = html.split('\n\n').map(block => {
                block = block.trim();
                if (!block) return '';
                if (block.match(/^<(h[1-6]|p|ul|ol|li|blockquote|pre|hr|table|div)/)) {
                    return block;
                }
                // Wrap in paragraph if not already a block element
                if (!block.startsWith('<')) {
                    return `<p>${block.replace(/\n/g, '<br>')}</p>`;
                }
                return block;
            }).join('\n');

            return html;
        },

        parseTables(html) {
            const lines = html.split('\n');
            let result = [];
            let inTable = false;
            let tableRows = [];

            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                const isTableRow = line.trim().startsWith('|') && line.trim().endsWith('|');
                const isSeparator = /^\|[\s\-:|]+\|$/.test(line.trim());

                if (isTableRow && !isSeparator) {
                    if (!inTable) {
                        inTable = true;
                        tableRows = [];
                    }
                    tableRows.push(line);
                } else if (isSeparator && inTable) {
                    // Skip separator line
                    continue;
                } else {
                    if (inTable && tableRows.length > 0) {
                        result.push(this.buildTable(tableRows));
                        tableRows = [];
                        inTable = false;
                    }
                    result.push(line);
                }
            }

            if (inTable && tableRows.length > 0) {
                result.push(this.buildTable(tableRows));
            }

            return result.join('\n');
        },

        buildTable(rows) {
            if (rows.length === 0) return '';

            let html = '<table>';
            rows.forEach((row, index) => {
                const cells = row.split('|').filter(c => c.trim() !== '');
                const tag = index === 0 ? 'th' : 'td';
                const rowTag = index === 0 ? 'thead' : (index === 1 ? 'tbody' : '');

                if (index === 0) html += '<thead>';
                if (index === 1) html += '<tbody>';

                html += '<tr>';
                cells.forEach(cell => {
                    html += `<${tag}>${cell.trim()}</${tag}>`;
                });
                html += '</tr>';

                if (index === 0) html += '</thead>';
            });
            if (rows.length > 1) html += '</tbody>';
            html += '</table>';
            return html;
        },

        parseUnorderedLists(html) {
            const lines = html.split('\n');
            let result = [];
            let inList = false;

            for (let line of lines) {
                const match = line.match(/^(\s*)[-*+] (.+)$/);
                if (match) {
                    if (!inList) {
                        result.push('<ul>');
                        inList = true;
                    }
                    result.push(`<li>${match[2]}</li>`);
                } else {
                    if (inList) {
                        result.push('</ul>');
                        inList = false;
                    }
                    result.push(line);
                }
            }
            if (inList) result.push('</ul>');

            return result.join('\n');
        },

        parseOrderedLists(html) {
            const lines = html.split('\n');
            let result = [];
            let inList = false;

            for (let line of lines) {
                const match = line.match(/^(\s*)\d+\. (.+)$/);
                if (match) {
                    if (!inList) {
                        result.push('<ol>');
                        inList = true;
                    }
                    result.push(`<li>${match[2]}</li>`);
                } else {
                    if (inList) {
                        result.push('</ol>');
                        inList = false;
                    }
                    result.push(line);
                }
            }
            if (inList) result.push('</ol>');

            return result.join('\n');
        }
    };

    // Simple Textile Parser (Redmine compatible)
    const textileParser = {
        parse(text) {
            if (!text) return '';

            let html = text;

            // Escape HTML
            html = html.replace(/&/g, '&amp;')
                       .replace(/</g, '&lt;')
                       .replace(/>/g, '&gt;');

            // Pre/Code blocks
            html = html.replace(/&lt;pre&gt;&lt;code[^&]*&gt;([\s\S]*?)&lt;\/code&gt;&lt;\/pre&gt;/g, (match, code) => {
                return `<pre><code>${code}</code></pre>`;
            });
            html = html.replace(/&lt;pre&gt;([\s\S]*?)&lt;\/pre&gt;/g, (match, code) => {
                return `<pre>${code}</pre>`;
            });

            // Inline code (@code@)
            html = html.replace(/@([^@\n]+)@/g, '<code>$1</code>');

            // Headers (h1. h2. h3. etc.)
            html = html.replace(/^h1\.\s+(.+)$/gm, '<h1>$1</h1>');
            html = html.replace(/^h2\.\s+(.+)$/gm, '<h2>$1</h2>');
            html = html.replace(/^h3\.\s+(.+)$/gm, '<h3>$1</h3>');
            html = html.replace(/^h4\.\s+(.+)$/gm, '<h4>$1</h4>');
            html = html.replace(/^h5\.\s+(.+)$/gm, '<h5>$1</h5>');
            html = html.replace(/^h6\.\s+(.+)$/gm, '<h6>$1</h6>');

            // Bold (*bold*)
            html = html.replace(/\*([^\*\n]+)\*/g, '<strong>$1</strong>');

            // Italic (_italic_)
            html = html.replace(/(?<![a-zA-Z0-9])_([^_\n]+)_(?![a-zA-Z0-9])/g, '<em>$1</em>');

            // Strikethrough (-deleted-)
            html = html.replace(/-([^-\n]+)-/g, '<del>$1</del>');

            // Underline (+underline+)
            html = html.replace(/\+([^\+\n]+)\+/g, '<ins>$1</ins>');

            // Superscript (^super^)
            html = html.replace(/\^([^\^\n]+)\^/g, '<sup>$1</sup>');

            // Subscript (~sub~)
            html = html.replace(/~([^~\n]+)~/g, '<sub>$1</sub>');

            // Blockquotes (bq.)
            html = html.replace(/^bq\.\s+(.+)$/gm, '<blockquote>$1</blockquote>');

            // Links ("text":url)
            html = html.replace(/"([^"]+)":(\S+)/g, '<a href="$2" target="_blank">$1</a>');

            // Images (!url!)
            html = html.replace(/!(\S+)!/g, '<img src="$1" alt="">');

            // Tables
            html = this.parseTables(html);

            // Unordered lists (* item)
            html = this.parseUnorderedLists(html);

            // Ordered lists (# item)
            html = this.parseOrderedLists(html);

            // Paragraphs
            html = html.split('\n\n').map(block => {
                block = block.trim();
                if (!block) return '';
                if (block.match(/^<(h[1-6]|p|ul|ol|li|blockquote|pre|table|div)/)) {
                    return block;
                }
                if (!block.startsWith('<')) {
                    return `<p>${block.replace(/\n/g, '<br>')}</p>`;
                }
                return block;
            }).join('\n');

            return html;
        },

        parseTables(html) {
            const lines = html.split('\n');
            let result = [];
            let inTable = false;
            let tableRows = [];

            for (let line of lines) {
                // Textile table row starts with |
                const isTableRow = line.trim().startsWith('|') && line.trim().endsWith('|');

                if (isTableRow) {
                    if (!inTable) {
                        inTable = true;
                        tableRows = [];
                    }
                    tableRows.push(line);
                } else {
                    if (inTable && tableRows.length > 0) {
                        result.push(this.buildTable(tableRows));
                        tableRows = [];
                        inTable = false;
                    }
                    result.push(line);
                }
            }

            if (inTable && tableRows.length > 0) {
                result.push(this.buildTable(tableRows));
            }

            return result.join('\n');
        },

        buildTable(rows) {
            if (rows.length === 0) return '';

            let html = '<table>';
            let hasHeader = false;

            rows.forEach((row, index) => {
                const cells = row.split('|').filter(c => c !== '');
                html += '<tr>';
                cells.forEach(cell => {
                    const trimmed = cell.trim();
                    // Header cell starts with _.
                    if (trimmed.startsWith('_.')) {
                        if (!hasHeader) {
                            hasHeader = true;
                        }
                        html += `<th>${trimmed.substring(2).trim()}</th>`;
                    } else {
                        html += `<td>${trimmed}</td>`;
                    }
                });
                html += '</tr>';
            });
            html += '</table>';
            return html;
        },

        parseUnorderedLists(html) {
            const lines = html.split('\n');
            let result = [];
            let inList = false;

            for (let line of lines) {
                const match = line.match(/^\*+\s+(.+)$/);
                if (match) {
                    if (!inList) {
                        result.push('<ul>');
                        inList = true;
                    }
                    result.push(`<li>${match[1]}</li>`);
                } else {
                    if (inList) {
                        result.push('</ul>');
                        inList = false;
                    }
                    result.push(line);
                }
            }
            if (inList) result.push('</ul>');

            return result.join('\n');
        },

        parseOrderedLists(html) {
            const lines = html.split('\n');
            let result = [];
            let inList = false;

            for (let line of lines) {
                const match = line.match(/^#+\s+(.+)$/);
                if (match) {
                    if (!inList) {
                        result.push('<ol>');
                        inList = true;
                    }
                    result.push(`<li>${match[1]}</li>`);
                } else {
                    if (inList) {
                        result.push('</ol>');
                        inList = false;
                    }
                    result.push(line);
                }
            }
            if (inList) result.push('</ol>');

            return result.join('\n');
        }
    };

    // Utility Functions
    const utils = {
        showToast(message) {
            const toast = document.getElementById('toast');
            toast.textContent = message;
            toast.classList.add('show');
            setTimeout(() => toast.classList.remove('show'), 2000);
        },

        copyToClipboard(text) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('Copied to clipboard!');
            }).catch(() => {
                this.showToast('Failed to copy');
            });
        },

        escapeHtml(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        },

        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        // Load value from localStorage and call callback if exists
        loadFromStorage(key, callback) {
            try {
                const value = localStorage.getItem(key);
                if (value !== null && callback) callback(value);
                return value;
            } catch (e) {
                return null;
            }
        },

        // Save value to localStorage with error handling
        saveToStorage(key, value) {
            try {
                localStorage.setItem(key, value);
                return true;
            } catch (e) {
                if (e.name === 'QuotaExceededError') {
                    this.showToast('Storage quota exceeded');
                }
                return false;
            }
        },

        // Remove item from localStorage
        removeFromStorage(key) {
            try {
                localStorage.removeItem(key);
            } catch (e) {
                // Ignore errors
            }
        },

        // Show error message element
        showError(elementId, message) {
            const el = document.getElementById(elementId);
            if (el) {
                el.textContent = message;
                el.style.display = 'block';
            }
        },

        // Hide error message element
        hideError(elementId) {
            const el = document.getElementById(elementId);
            if (el) {
                el.style.display = 'none';
            }
        },

        // Clear multiple form elements
        clearElements(ids, storageKeys = []) {
            ids.forEach(id => {
                const el = document.getElementById(id);
                if (el) {
                    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                        el.value = '';
                    } else {
                        el.textContent = '';
                        el.innerHTML = '';
                    }
                }
            });
            storageKeys.forEach(key => this.removeFromStorage(key));
        }
    };

    // Pages
    const pages = {
        // Viewer Page
        viewer: {
            tabs: ['markdown', 'textile'],

            render(activeTab) {
                activeTab = activeTab || 'markdown';
                const tabLabels = { markdown: 'Markdown', textile: 'Textile' };

                const isTextile = activeTab === 'textile';
                const inputLabel = isTextile ? 'Textile Input' : 'Markdown Input';
                const placeholder = isTextile ? 'Enter Textile text here...' : 'Enter Markdown text here...';
                return `
                    <div class="page-container">
                        <h1 class="page-title">Viewer<span id="builtin-badge" class="builtin-badge" style="display:none;">내장 기능</span></h1>
                        <div class="tabs">
                            ${this.tabs.map(tab => `
                                <button class="tab-btn ${tab === activeTab ? 'active' : ''}"
                                        data-tab="${tab}" onclick="pages.viewer.switchTab('${tab}')">
                                    ${tabLabels[tab] || tab.charAt(0).toUpperCase() + tab.slice(1)}
                                </button>
                            `).join('')}
                        </div>
                        <div class="card">
                            <div class="viewer-container">
                                <div class="form-group viewer-input-group">
                                    <div class="label-with-actions">
                                        <label class="form-label">${inputLabel}</label>
                                        <button class="btn btn-small btn-secondary" onclick="pages.viewer.paste()">Paste</button>
                                    </div>
                                    <textarea id="viewer-input" class="form-textarea large"
                                              placeholder="${placeholder}"></textarea>
                                </div>
                                <div class="form-group viewer-output-group">
                                    <label class="form-label">Preview</label>
                                    <div id="viewer-output" class="markdown-preview"></div>
                                </div>
                            </div>
                            <div class="flex gap-10 mt-10">
                                <button class="btn btn-secondary" onclick="pages.viewer.copy()">Copy</button>
                                <button class="btn btn-secondary" onclick="pages.viewer.clear()">Clear</button>
                            </div>
                        </div>
                    </div>
                `;
            },

            async init(activeTab) {
                this.currentTab = activeTab || 'markdown';

                // Clean up previous observers to prevent memory leak
                if (this._inputObserver) this._inputObserver.disconnect();
                if (this._outputObserver) this._outputObserver.disconnect();

                await this.loadTabLibraries();

                const input = document.getElementById('viewer-input');
                const output = document.getElementById('viewer-output');
                const self = this;
                const storageKey = this.currentTab === 'textile' ? 'textile-input' : 'markdown-input';

                input.addEventListener('input', utils.debounce(() => {
                    self.renderContent();
                    utils.saveToStorage(storageKey, input.value);
                }, 200));

                // Sync scroll between input and preview
                input.addEventListener('scroll', () => {
                    const scrollPercent = input.scrollTop / (input.scrollHeight - input.clientHeight);
                    output.scrollTop = scrollPercent * (output.scrollHeight - output.clientHeight);
                });

                // Sync height between input and preview when resized
                let isResizing = false;
                const syncHeight = (source, target) => {
                    if (isResizing) return;
                    isResizing = true;
                    target.style.height = source.offsetHeight + 'px';
                    setTimeout(() => isResizing = false, 10);
                };

                this._inputObserver = new ResizeObserver(() => syncHeight(input, output));
                this._outputObserver = new ResizeObserver(() => syncHeight(output, input));
                this._inputObserver.observe(input);
                this._outputObserver.observe(output);

                // Load saved content or use initial sample
                const savedContent = utils.loadFromStorage(storageKey);
                if (savedContent !== null) {
                    input.value = savedContent;
                } else if (this.currentTab === 'textile') {
                    input.value = `h1. Textile Preview

Welcome to the *Textile Viewer*!

h2. Features

* Real-time preview
* Redmine Textile support
* Code blocks support

h3. Code Example

<pre><code class="javascript">
function hello() {
    console.log("Hello, World!");
}
</code></pre>

h3. Inline Code

Use @console.log()@ to print messages.

h3. Table Example

|_. Header 1 |_. Header 2 |_. Header 3 |
| Cell 1 | Cell 2 | Cell 3 |
| Cell 4 | Cell 5 | Cell 6 |

bq. This is a blockquote

*Bold text* and _italic text_ and -strikethrough-

# First item
# Second item
# Third item

"Link Example":https://example.com
`;
                } else {
                    input.value = `# Markdown Preview

Welcome to the **Markdown Viewer**!

## Features

- Real-time preview
- GitHub Flavored Markdown support
- Code blocks support

### Code Example

\`\`\`javascript
function hello() {
    console.log("Hello, World!");
}
\`\`\`

### Inline Code

Use \`console.log()\` to print messages.

### Table Example

| Header 1 | Header 2 | Header 3 |
|----------|----------|----------|
| Cell 1   | Cell 2   | Cell 3   |
| Cell 4   | Cell 5   | Cell 6   |

> This is a blockquote

---

**Bold text** and *italic text* and ~~strikethrough~~

1. First item
2. Second item
3. Third item

[Link Example](https://example.com)
`;
                }
                this.renderContent();
            },

            async loadTabLibraries() {
                const badge = document.getElementById('builtin-badge');
                const self = this;

                // Determine which library to check based on current tab
                const libToCheck = this.currentTab === 'textile' ? 'textile' : 'marked';

                // Show UI immediately, load library in background
                const updateBadge = () => {
                    const useBuiltin = !libraryLoader.isLoaded(libToCheck);
                    if (badge) badge.style.display = useBuiltin ? 'inline-block' : 'none';
                                    };

                updateBadge();

                // Load library in background if needed
                if (libraryLoader.hasUnloadedForTab('viewer', this.currentTab)) {
                    libraryLoader.loadForTab('viewer', this.currentTab).then(() => {
                        updateBadge();
                        // Re-render with external library
                        const input = document.getElementById('viewer-input');
                        if (input && input.value) {
                            self.renderContent();
                        }
                    });
                }
            },

            switchTab(tab) {
                router.navigate(`/viewer/${tab}`);
            },

            renderContent() {
                if (this.currentTab === 'textile') {
                    this.renderTextile();
                } else {
                    this.renderMarkdown();
                }
            },

            renderTextile() {
                const input = document.getElementById('viewer-input').value;
                const output = document.getElementById('viewer-output');

                try {
                    if (typeof textile !== 'undefined') {
                        output.innerHTML = textile(input);
                    } else {
                        // Fallback to built-in parser
                        output.innerHTML = textileParser.parse(input);
                    }
                } catch (e) {
                    output.innerHTML = `<p style="color: var(--error-color);">Error rendering textile: ${e.message}</p>`;
                }
            },

            renderMarkdown() {
                const input = document.getElementById('viewer-input').value;
                const output = document.getElementById('viewer-output');

                try {
                    // Use external marked library if available, otherwise use built-in parser
                    if (typeof marked !== 'undefined') {
                        // Configure marked with highlight.js if available
                        marked.setOptions({
                            breaks: true,
                            gfm: true,
                            highlight: function(code, lang) {
                                if (typeof hljs !== 'undefined' && lang && hljs.getLanguage(lang)) {
                                    try {
                                        return hljs.highlight(code, { language: lang }).value;
                                    } catch (e) {}
                                }
                                if (typeof hljs !== 'undefined') {
                                    return hljs.highlightAuto(code).value;
                                }
                                return code;
                            }
                        });
                        output.innerHTML = marked.parse(input);
                    } else {
                        // Fallback to built-in parser
                        output.innerHTML = markdownParser.parse(input);
                    }
                } catch (e) {
                    output.innerHTML = `<p style="color: var(--error-color);">Error rendering markdown: ${e.message}</p>`;
                }
            },

            copy() {
                const output = document.getElementById('viewer-output').innerHTML;
                utils.copyToClipboard(output);
            },

            clear() {
                const storageKey = this.currentTab === 'textile' ? 'textile-input' : 'markdown-input';
                utils.clearElements(['viewer-input', 'viewer-output'], [storageKey]);
            },

            async paste() {
                try {
                    const storageKey = this.currentTab === 'textile' ? 'textile-input' : 'markdown-input';
                    const text = await navigator.clipboard.readText();
                    const input = document.getElementById('viewer-input');
                    input.value = text;
                    utils.saveToStorage(storageKey, text);
                    this.renderContent();
                } catch (e) {
                    utils.showToast('Failed to read clipboard', 'error');
                }
            }
        },

        // Formatter Page
        formatter: {
            tabs: ['json', 'yaml', 'javascript'],

            render(activeTab) {
                activeTab = activeTab || 'json';
                return `
                    <div class="page-container">
                        <h1 class="page-title">Formatter<span id="builtin-badge" class="builtin-badge" style="display:none;">내장 기능</span></h1>
                        <div class="tabs">
                            ${this.tabs.map(tab => `
                                <button class="tab-btn ${tab === activeTab ? 'active' : ''}"
                                        data-tab="${tab}" onclick="pages.formatter.switchTab('${tab}')">
                                    ${tab.toUpperCase()}
                                </button>
                            `).join('')}
                        </div>
                        <div class="card">
                            <div class="form-group">
                                <div class="label-with-actions">
                                    <label class="form-label">Input</label>
                                    <button class="btn btn-small btn-secondary" onclick="pages.formatter.paste()">Paste</button>
                                </div>
                                <textarea id="formatter-input" class="form-textarea large"
                                          placeholder="Paste your ${activeTab.toUpperCase()} here..."></textarea>
                                <div class="flex justify-between align-center mt-5">
                                    <div class="flex gap-10">
                                        <button class="btn btn-small btn-secondary" onclick="pages.formatter.copy()">Copy</button>
                                        <button class="btn btn-small btn-secondary" onclick="pages.formatter.clear()">Clear</button>
                                    </div>
                                    <div id="formatter-input-status" class="input-status">Pos: 0 Ln: 1 Col: 1 | Length: 0</div>
                                </div>
                            </div>
                            <div id="formatter-error" class="message message-error" style="display: none;"></div>
                            <div class="form-group">
                                <div class="label-with-actions">
                                    <label class="form-label">Formatted Output</label>
                                    <span class="indent-control">
                                        <label for="formatter-indent">Indent:</label>
                                        <select id="formatter-indent" onchange="pages.formatter.format()">
                                            <option value="2">2</option>
                                            <option value="4" selected>4</option>
                                            <option value="8">8</option>
                                            <option value="tab">Tab</option>
                                        </select>
                                    </span>
                                </div>
                                <pre id="formatter-output" class="form-output"></pre>
                            </div>
                        </div>
                    </div>
                `;
            },

            async init(activeTab) {
                this.currentTab = activeTab || 'json';
                await this.loadTabLibraries();

                const input = document.getElementById('formatter-input');
                const storageKey = `formatter-input-${this.currentTab}`;

                // Load saved content
                utils.loadFromStorage(storageKey, (saved) => {
                    input.value = saved;
                    this.format();
                });

                input.addEventListener('input', utils.debounce(() => {
                    this.format();
                    utils.saveToStorage(storageKey, input.value);
                }, 300));

                // Update input status (length and cursor position) - optimized
                const updateInputStatus = () => {
                    const status = document.getElementById('formatter-input-status');
                    if (status) {
                        const len = input.value.length;
                        const pos = input.selectionStart;
                        const valueUpToPos = input.value.substring(0, pos);
                        const line = valueUpToPos.split('\n').length;
                        const lastNewlinePos = valueUpToPos.lastIndexOf('\n');
                        const column = lastNewlinePos === -1 ? pos + 1 : pos - lastNewlinePos;
                        status.textContent = `Pos: ${pos} Ln: ${line} Col: ${column} | Length: ${len}`;
                    }
                };

                ['input', 'click', 'keyup', 'select'].forEach(event => {
                    input.addEventListener(event, updateInputStatus);
                });
                updateInputStatus();
            },

            async loadTabLibraries() {
                const badge = document.getElementById('builtin-badge');
                const self = this;

                const updateBadge = () => {
                    let useBuiltin = false;
                    if (self.currentTab === 'yaml') useBuiltin = !libraryLoader.isLoaded('jsyaml');
                    if (self.currentTab === 'javascript') useBuiltin = !libraryLoader.isLoaded('jsbeautify');
                    badge.style.display = useBuiltin ? 'inline-block' : 'none';
                                    };

                updateBadge();

                // Load library in background if needed
                if (libraryLoader.hasUnloadedForTab('formatter', this.currentTab)) {
                    libraryLoader.loadForTab('formatter', this.currentTab).then(() => {
                        updateBadge();
                        // Re-format if content exists
                        const input = document.getElementById('formatter-input');
                        if (input && input.value) {
                            this.format();
                        }
                    });
                }
            },

            switchTab(tab) {
                router.navigate(`/formatter/${tab}`);
            },

            getIndent() {
                const indentSelect = document.getElementById('formatter-indent');
                const indentValue = indentSelect ? indentSelect.value : '4';
                if (indentValue === 'tab') {
                    return '\t';
                }
                return parseInt(indentValue, 10);
            },

            getIndentStr() {
                const indent = this.getIndent();
                if (indent === '\t') {
                    return '\t';
                }
                return ' '.repeat(indent);
            },

            format() {
                const input = document.getElementById('formatter-input').value;
                const output = document.getElementById('formatter-output');
                const error = document.getElementById('formatter-error');
                const indent = this.getIndent();

                if (!input.trim()) {
                    output.textContent = '';
                    error.style.display = 'none';
                    return;
                }

                try {
                    let formatted;
                    switch (this.currentTab) {
                        case 'json':
                            formatted = JSON.stringify(JSON.parse(input), null, indent);
                            break;
                        case 'yaml':
                            if (typeof jsyaml !== 'undefined') {
                                const parsed = jsyaml.load(input);
                                const yamlIndent = indent === '\t' ? 4 : indent;
                                formatted = jsyaml.dump(parsed, { indent: yamlIndent });
                            } else {
                                formatted = builtinFormatters.formatYaml(input);
                            }
                            break;
                        case 'javascript':
                            if (typeof js_beautify !== 'undefined') {
                                const jsIndent = indent === '\t' ? 1 : indent;
                                formatted = js_beautify(input, {
                                    indent_size: jsIndent,
                                    indent_char: indent === '\t' ? '\t' : ' ',
                                    max_preserve_newlines: 2,
                                    preserve_newlines: true,
                                    keep_array_indentation: false,
                                    break_chained_methods: false,
                                    space_before_conditional: true,
                                    unescape_strings: false,
                                    jslint_happy: false,
                                    end_with_newline: false,
                                    wrap_line_length: 0,
                                    e4x: false,
                                    comma_first: false,
                                    operator_position: 'before-newline'
                                });
                            } else {
                                formatted = builtinFormatters.formatJavaScript(input, indent);
                            }
                            break;
                    }
                    output.textContent = formatted;
                    error.style.display = 'none';
                } catch (e) {
                    error.textContent = `Error: ${e.message}`;
                    error.style.display = 'block';
                    // Try to show partial formatting even with errors
                    try {
                        if (this.currentTab === 'json') {
                            output.innerHTML = this.formatJsonWithError(input, e);
                        } else if (this.currentTab === 'yaml') {
                            output.innerHTML = this.formatYamlWithError(input, e);
                        } else {
                            output.textContent = input;
                        }
                    } catch (e2) {
                        output.textContent = input;
                    }
                }
            },

            // Format JSON with error location visualization
            formatJsonWithError(input, parseError) {
                // Extract error position from error message
                let errorPosition = -1;
                const posMatch = parseError.message.match(/position\s+(\d+)/i);
                if (posMatch) {
                    errorPosition = parseInt(posMatch[1], 10);
                }

                // Tokenize and format JSON
                const result = [];
                const indentStr = this.getIndentStr();
                let indent = 0;
                let i = 0;
                let currentLineTokens = [];
                let errorMarked = false;

                const flushLine = (forceErrorMark = false) => {
                    if (currentLineTokens.length > 0) {
                        let lineContent = utils.escapeHtml(indentStr.repeat(indent) + currentLineTokens.join(''));

                        // Wrap line with error class if this line contains the error
                        if (forceErrorMark && !errorMarked) {
                            lineContent = '<span class="error-line">' + lineContent + '</span>';
                            errorMarked = true;
                        }

                        result.push(lineContent);
                        currentLineTokens = [];
                    }
                };

                const addToken = (token, startPos, endPos) => {
                    // Check if error is at this token's position
                    if (!errorMarked && errorPosition >= 0 && startPos <= errorPosition && endPos > errorPosition) {
                        currentLineTokens.push(token);
                        flushLine(true);
                        return;
                    }
                    currentLineTokens.push(token);
                };

                while (i < input.length) {
                    const ch = input[i];

                    // Handle newlines - flush current line
                    if (ch === '\n' || ch === '\r') {
                        if (!errorMarked && errorPosition === i) {
                            flushLine(true);
                        } else {
                            flushLine();
                        }
                        i++;
                        // Skip \r\n as single newline
                        if (ch === '\r' && i < input.length && input[i] === '\n') {
                            i++;
                        }
                        continue;
                    }

                    // Skip spaces and tabs but track position for error
                    if (ch === ' ' || ch === '\t') {
                        if (!errorMarked && errorPosition === i) {
                            flushLine(true);
                        }
                        i++;
                        continue;
                    }

                    // Opening brackets
                    if (ch === '{' || ch === '[') {
                        flushLine();
                        addToken(ch, i, i + 1);
                        flushLine();
                        indent++;
                        i++;
                        continue;
                    }

                    // Closing brackets
                    if (ch === '}' || ch === ']') {
                        flushLine();
                        indent = Math.max(0, indent - 1);
                        addToken(ch, i, i + 1);
                        i++;
                        // Check for comma after closing bracket
                        let j = i;
                        while (j < input.length && (input[j] === ' ' || input[j] === '\t' || input[j] === '\n' || input[j] === '\r')) j++;
                        if (j < input.length && input[j] === ',') {
                            addToken(',', j, j + 1);
                            i = j + 1;
                        }
                        flushLine();
                        continue;
                    }

                    // Comma - new line after
                    if (ch === ',') {
                        addToken(',', i, i + 1);
                        flushLine();
                        i++;
                        continue;
                    }

                    // Colon
                    if (ch === ':') {
                        addToken(': ', i, i + 1);
                        i++;
                        continue;
                    }

                    // String
                    if (ch === '"') {
                        let str = '"';
                        let startPos = i;
                        i++;
                        while (i < input.length) {
                            if (input[i] === '\\' && i + 1 < input.length) {
                                str += input[i] + input[i + 1];
                                i += 2;
                            } else if (input[i] === '"') {
                                str += '"';
                                i++;
                                break;
                            } else {
                                str += input[i];
                                i++;
                            }
                        }
                        addToken(str, startPos, i);
                        continue;
                    }

                    // Number, true, false, null
                    if (ch === '-' || (ch >= '0' && ch <= '9') || ch === 't' || ch === 'f' || ch === 'n') {
                        let token = '';
                        let startPos = i;
                        while (i < input.length && !/[\s,\}\]\:]/.test(input[i])) {
                            token += input[i];
                            i++;
                        }
                        addToken(token, startPos, i);
                        continue;
                    }

                    // Unknown character - include it
                    addToken(ch, i, i + 1);
                    i++;
                }

                flushLine();

                // If error position is at the end and not yet marked
                if (!errorMarked && errorPosition >= 0 && errorPosition >= input.length) {
                    result.push('<span class="error-line">&lt;-- ERROR (unexpected end)</span>');
                }

                return result.join('\n');
            },

            // Format YAML with error location visualization
            formatYamlWithError(input, parseError) {
                // Extract error line from js-yaml error
                let errorLine = -1;

                // js-yaml provides mark.line (0-indexed)
                if (parseError.mark && typeof parseError.mark.line === 'number') {
                    errorLine = parseError.mark.line;
                } else {
                    // Try to extract from error message
                    const lineMatch = parseError.message.match(/line\s+(\d+)/i);
                    if (lineMatch) {
                        errorLine = parseInt(lineMatch[1], 10) - 1; // Convert to 0-indexed
                    }
                }

                // Split input into lines and highlight error line
                const lines = input.split('\n');
                const result = lines.map((line, index) => {
                    const escapedLine = utils.escapeHtml(line) || ' ';
                    if (index === errorLine) {
                        return `<span class="error-line">${escapedLine}</span>`;
                    }
                    return escapedLine;
                });

                return result.join('\n');
            },

            async paste() {
                try {
                    const text = await navigator.clipboard.readText();
                    const input = document.getElementById('formatter-input');
                    input.value = text;
                    utils.saveToStorage(`formatter-input-${this.currentTab}`, text);
                    this.format();
                    input.dispatchEvent(new Event('input'));
                } catch (e) {
                    utils.showToast('Failed to read clipboard', 'error');
                }
            },

            copy() {
                utils.copyToClipboard(document.getElementById('formatter-input').value);
            },

            clear() {
                utils.clearElements(['formatter-input', 'formatter-output'], [`formatter-input-${this.currentTab}`]);
                utils.hideError('formatter-error');
            }
        },

        // Encoding Page
        encoding: {
            tabs: ['base64', 'url'],

            render(activeTab) {
                activeTab = activeTab || 'base64';
                return `
                    <div class="page-container">
                        <h1 class="page-title">Encoding</h1>
                        <div class="tabs">
                            ${this.tabs.map(tab => `
                                <button class="tab-btn ${tab === activeTab ? 'active' : ''}"
                                        data-tab="${tab}" onclick="pages.encoding.switchTab('${tab}')">
                                    ${tab.toUpperCase()}
                                </button>
                            `).join('')}
                        </div>
                        <div class="card">
                            <div class="form-group">
                                <div class="label-with-actions">
                                    <label class="form-label">Decoded (Plain Text)</label>
                                    <button class="btn btn-small btn-secondary" onclick="pages.encoding.pasteDecoded()">Paste</button>
                                </div>
                                <textarea id="encoding-decoded" class="form-textarea"
                                          placeholder="Enter text to encode..."></textarea>
                                <button class="btn btn-secondary mt-10" onclick="pages.encoding.copyDecoded()">Copy</button>
                            </div>
                            <div class="arrow-indicator">↕</div>
                            <div class="form-group">
                                <div class="label-with-actions">
                                    <label class="form-label">Encoded</label>
                                    <button class="btn btn-small btn-secondary" onclick="pages.encoding.pasteEncoded()">Paste</button>
                                </div>
                                <textarea id="encoding-encoded" class="form-textarea"
                                          placeholder="Enter text to decode..."></textarea>
                                <button class="btn btn-secondary mt-10" onclick="pages.encoding.copyEncoded()">Copy</button>
                            </div>
                            <div id="encoding-error" class="message message-error" style="display: none;"></div>
                            <div class="flex gap-10 mt-10">
                                <button class="btn btn-secondary" onclick="pages.encoding.clear()">Clear</button>
                            </div>
                        </div>
                    </div>
                `;
            },

            async init(activeTab) {
                this.currentTab = activeTab || 'base64';
                const decoded = document.getElementById('encoding-decoded');
                const encoded = document.getElementById('encoding-encoded');
                const storageKey = `encoding-${this.currentTab}`;

                utils.loadFromStorage(storageKey, (saved) => {
                    decoded.value = saved;
                    this.encode();
                });

                decoded.addEventListener('input', utils.debounce(() => {
                    this.encode();
                    utils.saveToStorage(storageKey, decoded.value);
                }, 200));
                encoded.addEventListener('input', utils.debounce(() => {
                    this.decode();
                    utils.saveToStorage(storageKey, decoded.value);
                }, 200));
            },

            switchTab(tab) {
                router.navigate(`/encoding/${tab}`);
            },

            encode() {
                const input = document.getElementById('encoding-decoded').value;
                const output = document.getElementById('encoding-encoded');

                if (!input) {
                    output.value = '';
                    utils.hideError('encoding-error');
                    return;
                }

                try {
                    let encoded;
                    switch (this.currentTab) {
                        case 'base64':
                            encoded = btoa(unescape(encodeURIComponent(input)));
                            break;
                        case 'url':
                            encoded = encodeURIComponent(input);
                            break;
                    }
                    output.value = encoded;
                    utils.hideError('encoding-error');
                } catch (e) {
                    utils.showError('encoding-error', `Encoding error: ${e.message}`);
                }
            },

            decode() {
                const input = document.getElementById('encoding-encoded').value;
                const output = document.getElementById('encoding-decoded');

                if (!input) {
                    output.value = '';
                    utils.hideError('encoding-error');
                    return;
                }

                try {
                    let decoded;
                    switch (this.currentTab) {
                        case 'base64':
                            decoded = decodeURIComponent(escape(atob(input.trim())));
                            break;
                        case 'url':
                            decoded = decodeURIComponent(input);
                            break;
                    }
                    output.value = decoded;
                    utils.hideError('encoding-error');
                } catch (e) {
                    utils.showError('encoding-error', `Decoding error: ${e.message}`);
                }
            },

            async pasteDecoded() {
                try {
                    const text = await navigator.clipboard.readText();
                    const decoded = document.getElementById('encoding-decoded');
                    decoded.value = text;
                    decoded.dispatchEvent(new Event('input'));
                } catch (e) {
                    utils.showToast('Failed to read clipboard', 'error');
                }
            },

            async pasteEncoded() {
                try {
                    const text = await navigator.clipboard.readText();
                    const encoded = document.getElementById('encoding-encoded');
                    encoded.value = text;
                    encoded.dispatchEvent(new Event('input'));
                } catch (e) {
                    utils.showToast('Failed to read clipboard', 'error');
                }
            },

            copyDecoded() {
                utils.copyToClipboard(document.getElementById('encoding-decoded').value);
            },

            copyEncoded() {
                utils.copyToClipboard(document.getElementById('encoding-encoded').value);
            },

            clear() {
                utils.clearElements(
                    ['encoding-decoded', 'encoding-encoded'],
                    this.tabs.map(tab => `encoding-${tab}`)
                );
                utils.hideError('encoding-error');
            }
        },

        // Converter Page
        converter: {
            tabs: ['radix', 'byte'],

            render(activeTab) {
                activeTab = activeTab || 'radix';
                const tabLabels = {
                    radix: 'Radix',
                    byte: 'Byte'
                };

                let content = '';
                switch (activeTab) {
                    case 'radix':
                        content = this.renderRadix();
                        break;
                    case 'byte':
                        content = this.renderByte();
                        break;
                }

                return `
                    <div class="page-container">
                        <h1 class="page-title">Converter</h1>
                        <div class="tabs">
                            ${this.tabs.map(tab => `
                                <button class="tab-btn ${tab === activeTab ? 'active' : ''}"
                                        data-tab="${tab}" onclick="pages.converter.switchTab('${tab}')">
                                    ${tabLabels[tab]}
                                </button>
                            `).join('')}
                        </div>
                        ${content}
                    </div>
                `;
            },

            renderRadix() {
                return `
                    <div class="card">
                        <div class="form-group">
                            <label class="form-label">Binary (2진수)</label>
                            <input type="text" id="radix-bin" class="form-input" placeholder="e.g., 1010">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Octal (8진수)</label>
                            <input type="text" id="radix-oct" class="form-input" placeholder="e.g., 12">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Decimal (10진수)</label>
                            <input type="text" id="radix-dec" class="form-input" placeholder="e.g., 10">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Hexadecimal (16진수)</label>
                            <input type="text" id="radix-hex" class="form-input" placeholder="e.g., A">
                        </div>
                        <button class="btn btn-secondary mt-10" onclick="pages.converter.clearRadix()">Clear</button>
                    </div>
                `;
            },

            renderByte() {
                return `
                    <div class="card">
                        <div class="form-group">
                            <label class="form-label">Bit</label>
                            <input type="text" id="size-bit" class="form-input" placeholder="e.g., 8">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Byte</label>
                            <input type="text" id="size-byte" class="form-input" placeholder="e.g., 1">
                        </div>
                        <div class="form-group">
                            <label class="form-label">KB (Kilobyte)</label>
                            <input type="text" id="size-kb" class="form-input" placeholder="e.g., 0.001">
                        </div>
                        <div class="form-group">
                            <label class="form-label">MB (Megabyte)</label>
                            <input type="text" id="size-mb" class="form-input" placeholder="e.g., 0.000001">
                        </div>
                        <div class="form-group">
                            <label class="form-label">GB (Gigabyte)</label>
                            <input type="text" id="size-gb" class="form-input" placeholder="e.g., 0.000000001">
                        </div>
                        <div class="form-group">
                            <label class="form-label">TB (Terabyte)</label>
                            <input type="text" id="size-tb" class="form-input" placeholder="e.g., 0.000000000001">
                        </div>
                        <button class="btn btn-secondary mt-10" onclick="pages.converter.clearByte()">Clear</button>
                    </div>
                `;
            },

            async init(activeTab) {
                this.currentTab = activeTab || 'radix';

                switch (this.currentTab) {
                    case 'radix':
                        this.initRadix();
                        break;
                    case 'byte':
                        this.initByte();
                        break;
                }
            },

            switchTab(tab) {
                router.navigate(`/converter/${tab}`);
            },

            initRadix() {
                const bin = document.getElementById('radix-bin');
                const oct = document.getElementById('radix-oct');
                const dec = document.getElementById('radix-dec');
                const hex = document.getElementById('radix-hex');

                const patterns = {
                    bin: /[^01]/g,
                    oct: /[^0-7]/g,
                    dec: /[^0-9]/g,
                    hex: /[^0-9A-Fa-f]/g
                };

                const filterInput = (input, type) => {
                    const pos = input.selectionStart;
                    const before = input.value;
                    input.value = input.value.replace(patterns[type], '');
                    if (before !== input.value) {
                        input.selectionStart = input.selectionEnd = pos - 1;
                    }
                };

                const updateAll = (value, base, source) => {
                    const num = parseInt(value, base);
                    if (isNaN(num)) return;

                    if (source !== 'bin') bin.value = num.toString(2);
                    if (source !== 'oct') oct.value = num.toString(8);
                    if (source !== 'dec') dec.value = num.toString(10);
                    if (source !== 'hex') hex.value = num.toString(16).toUpperCase();
                    utils.saveToStorage('radix-dec', dec.value);
                };

                utils.loadFromStorage('radix-dec', (savedDec) => {
                    updateAll(savedDec, 10, '');
                });

                bin.addEventListener('input', () => { filterInput(bin, 'bin'); updateAll(bin.value, 2, 'bin'); });
                oct.addEventListener('input', () => { filterInput(oct, 'oct'); updateAll(oct.value, 8, 'oct'); });
                dec.addEventListener('input', () => { filterInput(dec, 'dec'); updateAll(dec.value, 10, 'dec'); });
                hex.addEventListener('input', () => { filterInput(hex, 'hex'); updateAll(hex.value, 16, 'hex'); });
            },

            clearRadix() {
                utils.clearElements(
                    ['radix-bin', 'radix-oct', 'radix-dec', 'radix-hex'],
                    ['radix-dec']
                );
            },

            initByte() {
                const units = ['bit', 'byte', 'kb', 'mb', 'gb', 'tb'];
                const multipliers = {
                    bit: 1,
                    byte: 8,
                    kb: 8 * 1024,
                    mb: 8 * 1024 * 1024,
                    gb: 8 * 1024 * 1024 * 1024,
                    tb: 8 * 1024 * 1024 * 1024 * 1024
                };

                const updateAll = (bits, source) => {
                    units.forEach(unit => {
                        if (unit !== source) {
                            const value = bits / multipliers[unit];
                            document.getElementById(`size-${unit}`).value =
                                value < 0.0001 ? '' :
                                value % 1 === 0 ? value : value.toFixed(4).replace(/\.?0+$/, '');
                        }
                    });
                    utils.saveToStorage('byte-bit', document.getElementById('size-bit').value);
                };

                utils.loadFromStorage('byte-bit', (savedBit) => {
                    if (savedBit !== '') {
                        document.getElementById('size-bit').value = savedBit;
                        updateAll(parseFloat(savedBit), 'bit');
                    }
                });

                units.forEach(unit => {
                    document.getElementById(`size-${unit}`).addEventListener('input', (e) => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                            updateAll(value * multipliers[unit], unit);
                        }
                    });
                });
            },

            clearByte() {
                utils.clearElements(
                    ['size-bit', 'size-byte', 'size-kb', 'size-mb', 'size-gb', 'size-tb'],
                    ['byte-bit']
                );
            }
        },

        // Encrypt Page
        encrypt: {
            tabs: ['hash', 'cert'],

            render(activeTab) {
                activeTab = activeTab || 'hash';
                const tabLabels = { hash: 'Hash', cert: 'Certificate' };

                if (activeTab === 'cert') {
                    return this.renderCert();
                }

                return `
                    <div class="page-container">
                        <h1 class="page-title">Encrypt<span id="builtin-badge" class="builtin-badge" style="display:none;">내장 기능</span></h1>
                        <div class="tabs">
                            ${this.tabs.map(tab => `
                                <button class="tab-btn ${tab === activeTab ? 'active' : ''}"
                                        data-tab="${tab}" onclick="pages.encrypt.switchTab('${tab}')">
                                    ${tabLabels[tab]}
                                </button>
                            `).join('')}
                        </div>
                        <div class="card">
                            <div class="form-group">
                                <div class="label-with-actions">
                                    <label class="form-label">Input Text</label>
                                    <button class="btn btn-small btn-secondary" onclick="pages.encrypt.pasteHash()">Paste</button>
                                </div>
                                <textarea id="hash-input" class="form-textarea"
                                          placeholder="Enter text to hash..."></textarea>
                                <div class="flex gap-10 mt-10">
                                    <button class="btn btn-secondary" onclick="pages.encrypt.clearHash()">Clear</button>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Hash Results</label>
                                <div id="hash-results">
                                    <div class="hash-result">
                                        <span class="hash-label">MD5</span>
                                        <span class="hash-value" id="hash-md5">-</span>
                                        <button class="btn btn-small btn-secondary" onclick="pages.encrypt.copyHash('md5')">Copy</button>
                                    </div>
                                    <div class="hash-result">
                                        <span class="hash-label">SHA-1</span>
                                        <span class="hash-value" id="hash-sha1">-</span>
                                        <button class="btn btn-small btn-secondary" onclick="pages.encrypt.copyHash('sha1')">Copy</button>
                                    </div>
                                    <div class="hash-result">
                                        <span class="hash-label">SHA-256</span>
                                        <span class="hash-value" id="hash-sha256">-</span>
                                        <button class="btn btn-small btn-secondary" onclick="pages.encrypt.copyHash('sha256')">Copy</button>
                                    </div>
                                    <div class="hash-result">
                                        <span class="hash-label">SHA-512</span>
                                        <span class="hash-value" id="hash-sha512">-</span>
                                        <button class="btn btn-small btn-secondary" onclick="pages.encrypt.copyHash('sha512')">Copy</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            },

            renderCert() {
                const tabLabels = { hash: 'Hash', cert: 'Certificate' };
                return `
                    <div class="page-container">
                        <h1 class="page-title">Encrypt<span id="builtin-badge" class="builtin-badge" style="display:none;">내장 기능</span></h1>
                        <div class="tabs">
                            ${this.tabs.map(tab => `
                                <button class="tab-btn ${tab === 'cert' ? 'active' : ''}"
                                        data-tab="${tab}" onclick="pages.encrypt.switchTab('${tab}')">
                                    ${tabLabels[tab]}
                                </button>
                            `).join('')}
                        </div>

                        <div class="card">
                            <h3 class="card-title">Certificate Viewer</h3>
                            <div class="form-group">
                                <div class="label-with-actions">
                                    <label class="form-label">Certificate or URL</label>
                                    <span id="cert-input-type-badge" class="builtin-badge" style="display:none; background-color: var(--primary-color);"></span>
                                    <button class="btn btn-small btn-secondary" onclick="pages.encrypt.pasteCert()">Paste</button>
                                </div>
                                <textarea id="cert-input" class="form-textarea large"
                                          placeholder="PEM 인증서 또는 URL/호스트명을 입력하세요

예시 1 (인증서):
-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAJC1...
-----END CERTIFICATE-----

예시 2 (URL):
google.com
https://example.com:443"></textarea>
                            </div>
                            <div class="flex gap-10">
                                <button class="btn btn-secondary" onclick="pages.encrypt.clearCert()">Clear</button>
                                <button class="btn btn-primary" id="fetch-cert-btn" style="display: none;" onclick="pages.encrypt.fetchCertFromUrl()">
                                    <span id="fetch-cert-text">Fetch Certificate</span>
                                </button>
                            </div>
                        </div>

                        <div id="cert-error" class="message message-error" style="display: none;"></div>

                        <div id="cert-auth-hint" class="message" style="display: none; background-color: var(--primary-color); color: white; opacity: 0.9;">
                            Login to use the "Fetch Certificate" feature for automatic certificate retrieval.
                        </div>

                        <div id="cert-commands" class="card" style="display: none;">
                            <h3 class="card-title">Commands to Fetch Certificate</h3>
                            <div class="tabs" style="margin-bottom: 15px;">
                                <button class="tab-btn active" data-cert-tab="linux" onclick="pages.encrypt.switchCertCommandTab('linux')">Linux / macOS</button>
                                <button class="tab-btn" data-cert-tab="windows" onclick="pages.encrypt.switchCertCommandTab('windows')">Windows</button>
                            </div>

                            <div id="cert-tab-linux">
                                <div class="form-group">
                                    <div class="label-with-actions">
                                        <label class="form-label">OpenSSL - Get certificate</label>
                                        <button class="btn btn-small btn-secondary" onclick="pages.encrypt.copyCertCommand('openssl')">Copy</button>
                                    </div>
                                    <pre id="cmd-openssl" class="result-box" style="margin: 0; white-space: pre-wrap;"></pre>
                                </div>
                                <div class="form-group" style="margin-bottom: 0;">
                                    <div class="label-with-actions">
                                        <label class="form-label">OpenSSL - View certificate details</label>
                                        <button class="btn btn-small btn-secondary" onclick="pages.encrypt.copyCertCommand('openssl-view')">Copy</button>
                                    </div>
                                    <pre id="cmd-openssl-view" class="result-box" style="margin: 0; white-space: pre-wrap;"></pre>
                                </div>
                            </div>

                            <div id="cert-tab-windows" style="display: none;">
                                <div class="form-group">
                                    <div class="label-with-actions">
                                        <label class="form-label">PowerShell - Get certificate</label>
                                        <button class="btn btn-small btn-secondary" onclick="pages.encrypt.copyCertCommand('powershell')">Copy</button>
                                    </div>
                                    <pre id="cmd-powershell-cert" class="result-box" style="margin: 0; white-space: pre-wrap;"></pre>
                                </div>
                                <div class="form-group" style="margin-bottom: 0;">
                                    <div class="label-with-actions">
                                        <label class="form-label">PowerShell - View certificate details</label>
                                        <button class="btn btn-small btn-secondary" onclick="pages.encrypt.copyCertCommand('powershell-view')">Copy</button>
                                    </div>
                                    <pre id="cmd-powershell-view" class="result-box" style="margin: 0; white-space: pre-wrap;"></pre>
                                </div>
                            </div>
                        </div>

                        <div id="cert-results" class="card" style="display: none;">
                            <h3 class="card-title">Certificate Information</h3>
                            <div class="ip-result-grid" id="cert-result-grid"></div>
                        </div>
                    </div>
                `;
            },

            async init(activeTab) {
                this.currentTab = activeTab || 'hash';

                if (this.currentTab === 'cert') {
                    await this.initCert();
                    return;
                }

                await this.loadTabLibraries();

                const input = document.getElementById('hash-input');

                utils.loadFromStorage('hash-input', (saved) => {
                    input.value = saved;
                    this.generateHashes();
                });

                input.addEventListener('input', utils.debounce(() => {
                    this.generateHashes();
                    utils.saveToStorage('hash-input', input.value);
                }, 200));
            },

            async loadTabLibraries() {
                const badge = document.getElementById('builtin-badge');
                const self = this;

                let libToCheck = 'CryptoJS';
                if (this.currentTab === 'cert') libToCheck = 'forge';

                const updateBadge = () => {
                    const useBuiltin = !libraryLoader.isLoaded(libToCheck);
                    if (badge) badge.style.display = useBuiltin ? 'inline-block' : 'none';
                                    };

                updateBadge();

                // Load library in background if needed
                if (libraryLoader.hasUnloadedForTab('encrypt', this.currentTab)) {
                    libraryLoader.loadForTab('encrypt', this.currentTab).then(() => {
                        updateBadge();
                        if (self.currentTab === 'cert') {
                            const certInput = document.getElementById('cert-input');
                            if (certInput && certInput.value) {
                                self.processCertInput();
                            }
                        }
                    });
                }
            },

            switchTab(tab) {
                router.navigate(`/encrypt/${tab}`);
            },

            // ==================== Hash Functions ====================

            async generateHashes() {
                const input = document.getElementById('hash-input').value;

                if (!input) {
                    ['md5', 'sha1', 'sha256', 'sha512'].forEach(algo => {
                        document.getElementById(`hash-${algo}`).textContent = '-';
                    });
                    return;
                }

                // Use CryptoJS if available, otherwise use built-in Web Crypto API
                if (typeof CryptoJS !== 'undefined') {
                    document.getElementById('hash-md5').textContent = CryptoJS.MD5(input).toString();
                    document.getElementById('hash-sha1').textContent = CryptoJS.SHA1(input).toString();
                    document.getElementById('hash-sha256').textContent = CryptoJS.SHA256(input).toString();
                    document.getElementById('hash-sha512').textContent = CryptoJS.SHA512(input).toString();
                } else {
                    // Use built-in hash functions
                    try {
                        document.getElementById('hash-md5').textContent = builtinHash.simpleMd5(input);
                        document.getElementById('hash-sha1').textContent = await builtinHash.sha1(input);
                        document.getElementById('hash-sha256').textContent = await builtinHash.sha256(input);
                        document.getElementById('hash-sha512').textContent = await builtinHash.sha512(input);
                    } catch (e) {
                        console.error('Hash error:', e);
                    }
                }
            },

            copyHash(algo) {
                const value = document.getElementById(`hash-${algo}`).textContent;
                if (value !== '-') {
                    utils.copyToClipboard(value);
                }
            },

            async pasteHash() {
                try {
                    const text = await navigator.clipboard.readText();
                    const input = document.getElementById('hash-input');
                    input.value = text;
                    utils.saveToStorage('hash-input', text);
                    this.generateHashes();
                } catch (e) {
                    utils.showToast('Failed to read clipboard', 'error');
                }
            },

            clearHash() {
                document.getElementById('hash-input').value = '';
                utils.removeFromStorage('hash-input');
                document.getElementById('hash-md5').textContent = '-';
                document.getElementById('hash-sha1').textContent = '-';
                document.getElementById('hash-sha256').textContent = '-';
                document.getElementById('hash-sha512').textContent = '-';
            },

            // ==================== Certificate Functions ====================

            async initCert() {
                await this.loadTabLibraries();

                const certInput = document.getElementById('cert-input');
                const self = this;

                utils.loadFromStorage('cert-input', (saved) => {
                    certInput.value = saved;
                    this.processCertInput();
                });

                certInput.addEventListener('input', utils.debounce(() => {
                    utils.saveToStorage('cert-input', certInput.value);
                    self.processCertInput();
                }, 300));
            },

            detectInputType(input) {
                const trimmed = input.trim();
                if (!trimmed) return null;

                if (trimmed.includes('-----BEGIN CERTIFICATE-----')) {
                    return 'pem';
                }

                const urlPattern = /^(https?:\/\/)?[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?)+(:\d+)?(\/.*)?$/;
                if (urlPattern.test(trimmed)) {
                    return 'url';
                }

                const simpleHostPattern = /^[a-zA-Z0-9-]+(:\d+)?$/;
                if (simpleHostPattern.test(trimmed)) {
                    return 'url';
                }

                return null;
            },

            processCertInput() {
                const input = document.getElementById('cert-input').value;
                const badge = document.getElementById('cert-input-type-badge');
                const commandsEl = document.getElementById('cert-commands');
                const resultsEl = document.getElementById('cert-results');
                const errorEl = document.getElementById('cert-error');
                const fetchBtn = document.getElementById('fetch-cert-btn');

                const inputType = this.detectInputType(input);

                if (inputType === 'pem') {
                    badge.textContent = 'Certificate';
                    badge.style.display = 'inline-block';
                    badge.style.backgroundColor = 'var(--success-color)';
                } else if (inputType === 'url') {
                    badge.textContent = 'URL';
                    badge.style.display = 'inline-block';
                    badge.style.backgroundColor = 'var(--primary-color)';
                } else {
                    badge.style.display = 'none';
                }

                errorEl.style.display = 'none';

                // Fetch 버튼: Authorized 상태이고 URL 입력 시에만 표시
                const authHint = document.getElementById('cert-auth-hint');
                if (fetchBtn) {
                    if (inputType === 'url' && window.serverMode && window.serverMode.authenticated) {
                        fetchBtn.style.display = 'inline-flex';
                        if (authHint) authHint.style.display = 'none';
                    } else {
                        fetchBtn.style.display = 'none';
                        // URL 입력인데 미인증 상태면 힌트 표시
                        if (authHint && inputType === 'url') {
                            authHint.style.display = 'block';
                        } else if (authHint) {
                            authHint.style.display = 'none';
                        }
                    }
                }

                if (inputType === 'url') {
                    this.updateCertCommands();
                    resultsEl.style.display = 'none';
                } else if (inputType === 'pem') {
                    commandsEl.style.display = 'none';
                    if (authHint) authHint.style.display = 'none';
                    this.parseCert();
                } else {
                    commandsEl.style.display = 'none';
                    if (authHint) authHint.style.display = 'none';
                    resultsEl.style.display = 'none';
                }
            },

            switchCertCommandTab(tab) {
                document.querySelectorAll('#cert-commands .tab-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.certTab === tab);
                });
                document.getElementById('cert-tab-linux').style.display = tab === 'linux' ? 'block' : 'none';
                document.getElementById('cert-tab-windows').style.display = tab === 'windows' ? 'block' : 'none';
            },

            updateCertCommands() {
                const urlInput = document.getElementById('cert-input').value.trim();
                if (!urlInput) {
                    document.getElementById('cert-commands').style.display = 'none';
                    return;
                }

                let host = urlInput;
                let port = 443;

                host = host.replace(/^https?:\/\//, '');

                const portMatch = host.match(/:(\d+)/);
                if (portMatch) {
                    port = parseInt(portMatch[1]);
                    host = host.replace(/:(\d+)/, '');
                }

                host = host.split('/')[0];

                const openssl = `openssl s_client -connect ${host}:${port} -servername ${host} </dev/null 2>/dev/null | openssl x509 -outform PEM`;
                const opensslView = `openssl s_client -connect ${host}:${port} -servername ${host} </dev/null 2>/dev/null | openssl x509 -noout -text`;

                const powershell = `$tcpClient = New-Object Net.Sockets.TcpClient("${host}", ${port})
$sslStream = New-Object Net.Security.SslStream($tcpClient.GetStream())
$sslStream.AuthenticateAsClient("${host}")
$cert = $sslStream.RemoteCertificate
[System.Convert]::ToBase64String($cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Cert))
$tcpClient.Close()`;

                const powershellView = `$tcpClient = New-Object Net.Sockets.TcpClient("${host}", ${port})
$sslStream = New-Object Net.Security.SslStream($tcpClient.GetStream())
$sslStream.AuthenticateAsClient("${host}")
$cert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($sslStream.RemoteCertificate)
$cert | Format-List *
$tcpClient.Close()`;

                document.getElementById('cmd-openssl').textContent = openssl;
                document.getElementById('cmd-openssl-view').textContent = opensslView;
                document.getElementById('cmd-powershell-cert').textContent = powershell;
                document.getElementById('cmd-powershell-view').textContent = powershellView;
                document.getElementById('cert-commands').style.display = 'block';
            },

            copyCertCommand(cmd) {
                const mapping = {
                    'openssl': 'cmd-openssl',
                    'openssl-view': 'cmd-openssl-view',
                    'powershell': 'cmd-powershell-cert',
                    'powershell-view': 'cmd-powershell-view'
                };
                const el = document.getElementById(mapping[cmd]);
                if (el) {
                    utils.copyToClipboard(el.textContent);
                }
            },

            async fetchCertFromUrl() {
                const input = document.getElementById('cert-input').value.trim();
                const fetchBtn = document.getElementById('fetch-cert-btn');
                const fetchText = document.getElementById('fetch-cert-text');
                const errorEl = document.getElementById('cert-error');

                if (!input) return;

                // URL 파싱
                let host = input.replace(/^https?:\/\//, '');
                let port = 443;

                const portMatch = host.match(/:(\d+)/);
                if (portMatch) {
                    port = parseInt(portMatch[1]);
                    host = host.replace(/:(\d+)/, '');
                }
                host = host.split('/')[0];

                // 로딩 상태 표시
                fetchBtn.disabled = true;
                fetchText.textContent = 'Fetching...';
                errorEl.style.display = 'none';

                try {
                    const response = await fetch('/api/cert/fetch', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                        body: JSON.stringify({ host, port })
                    });

                    const data = await response.json();

                    if (!response.ok || !data.success) {
                        throw new Error(data.error || 'Failed to fetch certificate');
                    }

                    // 가져온 인증서를 입력창에 표시하고 파싱
                    document.getElementById('cert-input').value = data.pem;
                    utils.saveToStorage('cert-input', data.pem);
                    this.processCertInput();
                    utils.showToast('Certificate fetched successfully');

                } catch (e) {
                    errorEl.textContent = `Error: ${e.message}`;
                    errorEl.style.display = 'block';
                } finally {
                    fetchBtn.disabled = false;
                    fetchText.textContent = 'Fetch Certificate';
                }
            },

            async pasteCert() {
                try {
                    const text = await navigator.clipboard.readText();
                    const input = document.getElementById('cert-input');
                    input.value = text;
                    utils.saveToStorage('cert-input', text);
                    this.processCertInput();
                } catch (e) {
                    utils.showToast('Failed to read clipboard', 'error');
                }
            },

            parseCert() {
                const pemInput = document.getElementById('cert-input').value.trim();
                const errorEl = document.getElementById('cert-error');
                const resultsEl = document.getElementById('cert-results');

                if (!pemInput) {
                    errorEl.textContent = 'Please enter a certificate in PEM format';
                    errorEl.style.display = 'block';
                    resultsEl.style.display = 'none';
                    return;
                }

                if (!pemInput.includes('-----BEGIN CERTIFICATE-----')) {
                    errorEl.textContent = 'Invalid format. Certificate must be in PEM format (starts with -----BEGIN CERTIFICATE-----)';
                    errorEl.style.display = 'block';
                    resultsEl.style.display = 'none';
                    return;
                }

                try {
                    if (typeof forge !== 'undefined') {
                        this.parseCertWithForge(pemInput);
                    } else {
                        this.parseCertBasic(pemInput);
                    }
                    errorEl.style.display = 'none';
                } catch (e) {
                    errorEl.textContent = `Error parsing certificate: ${e.message}`;
                    errorEl.style.display = 'block';
                    resultsEl.style.display = 'none';
                }
            },

            parseCertWithForge(pem) {
                const cert = forge.pki.certificateFromPem(pem);
                const gridEl = document.getElementById('cert-result-grid');
                const resultsEl = document.getElementById('cert-results');

                const formatDN = (attrs) => {
                    const parts = [];
                    const mapping = {
                        'commonName': 'CN',
                        'organizationName': 'O',
                        'organizationalUnitName': 'OU',
                        'countryName': 'C',
                        'stateOrProvinceName': 'ST',
                        'localityName': 'L'
                    };
                    attrs.forEach(attr => {
                        const abbr = mapping[attr.name] || attr.shortName || attr.name;
                        parts.push(`${abbr}=${attr.value}`);
                    });
                    return parts.join(', ');
                };

                const notBefore = cert.validity.notBefore;
                const notAfter = cert.validity.notAfter;
                const now = new Date();
                const isExpired = notAfter < now;

                const derBytes = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
                const sha1 = forge.md.sha1.create().update(derBytes).digest().toHex().toUpperCase().match(/.{2}/g).join(':');
                const sha256 = forge.md.sha256.create().update(derBytes).digest().toHex().toUpperCase().match(/.{2}/g).join(':');

                let san = [];
                const sanExt = cert.getExtension('subjectAltName');
                if (sanExt && sanExt.altNames) {
                    san = sanExt.altNames.map(name => {
                        if (name.type === 2) return `DNS: ${name.value}`;
                        if (name.type === 7) return `IP: ${name.ip}`;
                        return name.value;
                    });
                }

                let keyUsage = [];
                const kuExt = cert.getExtension('keyUsage');
                if (kuExt) {
                    if (kuExt.digitalSignature) keyUsage.push('Digital Signature');
                    if (kuExt.keyEncipherment) keyUsage.push('Key Encipherment');
                    if (kuExt.dataEncipherment) keyUsage.push('Data Encipherment');
                    if (kuExt.keyAgreement) keyUsage.push('Key Agreement');
                    if (kuExt.keyCertSign) keyUsage.push('Certificate Sign');
                    if (kuExt.cRLSign) keyUsage.push('CRL Sign');
                }

                let extKeyUsage = [];
                const ekuExt = cert.getExtension('extKeyUsage');
                if (ekuExt) {
                    if (ekuExt.serverAuth) extKeyUsage.push('Server Authentication');
                    if (ekuExt.clientAuth) extKeyUsage.push('Client Authentication');
                    if (ekuExt.codeSigning) extKeyUsage.push('Code Signing');
                    if (ekuExt.emailProtection) extKeyUsage.push('Email Protection');
                }

                let isCA = false;
                const basicConstraints = cert.getExtension('basicConstraints');
                if (basicConstraints) {
                    isCA = basicConstraints.cA === true;
                }

                let html = `
                    <div class="ip-result-item" style="grid-column: 1 / -1;">
                        <div class="ip-result-label">Subject</div>
                        <div class="ip-result-value">${utils.escapeHtml(formatDN(cert.subject.attributes))}</div>
                    </div>
                    <div class="ip-result-item" style="grid-column: 1 / -1;">
                        <div class="ip-result-label">Issuer</div>
                        <div class="ip-result-value">${utils.escapeHtml(formatDN(cert.issuer.attributes))}</div>
                    </div>
                    <div class="ip-result-item">
                        <div class="ip-result-label">Serial Number</div>
                        <div class="ip-result-value" style="word-break: break-all;">${cert.serialNumber}</div>
                    </div>
                    <div class="ip-result-item">
                        <div class="ip-result-label">Version</div>
                        <div class="ip-result-value">V${cert.version + 1}</div>
                    </div>
                    <div class="ip-result-item">
                        <div class="ip-result-label">Valid From</div>
                        <div class="ip-result-value">${notBefore.toISOString()}</div>
                    </div>
                    <div class="ip-result-item">
                        <div class="ip-result-label">Valid To</div>
                        <div class="ip-result-value" style="color: ${isExpired ? 'var(--error-color)' : 'inherit'}">
                            ${notAfter.toISOString()}${isExpired ? ' (EXPIRED)' : ''}
                        </div>
                    </div>
                    <div class="ip-result-item">
                        <div class="ip-result-label">Signature Algorithm</div>
                        <div class="ip-result-value">${cert.signatureOid}</div>
                    </div>
                    <div class="ip-result-item">
                        <div class="ip-result-label">Public Key</div>
                        <div class="ip-result-value">${cert.publicKey.n ? 'RSA ' + (cert.publicKey.n.bitLength()) + ' bits' : 'Unknown'}</div>
                    </div>
                    <div class="ip-result-item">
                        <div class="ip-result-label">Is CA</div>
                        <div class="ip-result-value">${isCA ? 'Yes' : 'No'}</div>
                    </div>
                `;

                if (san.length > 0) {
                    html += `
                        <div class="ip-result-item" style="grid-column: 1 / -1;">
                            <div class="ip-result-label">Subject Alternative Names</div>
                            <div class="ip-result-value">${san.map(s => utils.escapeHtml(s)).join('<br>')}</div>
                        </div>
                    `;
                }

                if (keyUsage.length > 0) {
                    html += `
                        <div class="ip-result-item" style="grid-column: 1 / -1;">
                            <div class="ip-result-label">Key Usage</div>
                            <div class="ip-result-value">${keyUsage.join(', ')}</div>
                        </div>
                    `;
                }

                if (extKeyUsage.length > 0) {
                    html += `
                        <div class="ip-result-item" style="grid-column: 1 / -1;">
                            <div class="ip-result-label">Extended Key Usage</div>
                            <div class="ip-result-value">${extKeyUsage.join(', ')}</div>
                        </div>
                    `;
                }

                html += `
                    <div class="ip-result-item" style="grid-column: 1 / -1;">
                        <div class="ip-result-label">SHA-1 Fingerprint</div>
                        <div class="ip-result-value" style="font-family: monospace; font-size: 0.85rem;">${sha1}</div>
                    </div>
                    <div class="ip-result-item" style="grid-column: 1 / -1;">
                        <div class="ip-result-label">SHA-256 Fingerprint</div>
                        <div class="ip-result-value" style="font-family: monospace; font-size: 0.85rem; word-break: break-all;">${sha256}</div>
                    </div>
                `;

                gridEl.innerHTML = html;
                resultsEl.style.display = 'block';
            },

            parseCertBasic(pem) {
                const gridEl = document.getElementById('cert-result-grid');
                const resultsEl = document.getElementById('cert-results');

                const base64Match = pem.match(/-----BEGIN CERTIFICATE-----\s*([\s\S]*?)\s*-----END CERTIFICATE-----/);
                if (!base64Match) {
                    throw new Error('Could not extract certificate content');
                }

                const base64 = base64Match[1].replace(/\s/g, '');

                let derBytes;
                try {
                    const binaryStr = atob(base64);
                    derBytes = new Uint8Array(binaryStr.length);
                    for (let i = 0; i < binaryStr.length; i++) {
                        derBytes[i] = binaryStr.charCodeAt(i);
                    }
                } catch (e) {
                    throw new Error('Invalid base64 encoding');
                }

                const parseLength = (bytes, offset) => {
                    if (bytes[offset] < 0x80) {
                        return { length: bytes[offset], bytesRead: 1 };
                    }
                    const numBytes = bytes[offset] & 0x7f;
                    let length = 0;
                    for (let i = 0; i < numBytes; i++) {
                        length = (length << 8) | bytes[offset + 1 + i];
                    }
                    return { length, bytesRead: 1 + numBytes };
                };

                const parseElement = (bytes, offset) => {
                    if (offset >= bytes.length) return null;
                    const tag = bytes[offset];
                    const lenInfo = parseLength(bytes, offset + 1);
                    const headerLen = 1 + lenInfo.bytesRead;
                    const contentStart = offset + headerLen;
                    const contentEnd = contentStart + lenInfo.length;
                    return {
                        tag, headerLen, length: lenInfo.length, totalLen: headerLen + lenInfo.length,
                        content: bytes.slice(contentStart, contentEnd), contentStart, contentEnd
                    };
                };

                const oidNames = {
                    '2.5.4.3': 'CN', '2.5.4.6': 'C', '2.5.4.7': 'L', '2.5.4.8': 'ST', '2.5.4.10': 'O', '2.5.4.11': 'OU',
                    '1.2.840.113549.1.1.1': 'RSA', '1.2.840.113549.1.1.5': 'SHA1withRSA', '1.2.840.113549.1.1.11': 'SHA256withRSA',
                    '1.2.840.113549.1.1.12': 'SHA384withRSA', '1.2.840.113549.1.1.13': 'SHA512withRSA',
                    '1.2.840.10045.4.3.2': 'SHA256withECDSA', '1.2.840.10045.4.3.3': 'SHA384withECDSA'
                };

                const parseOID = (bytes) => {
                    const parts = [Math.floor(bytes[0] / 40), bytes[0] % 40];
                    let value = 0;
                    for (let i = 1; i < bytes.length; i++) {
                        value = (value << 7) | (bytes[i] & 0x7f);
                        if ((bytes[i] & 0x80) === 0) { parts.push(value); value = 0; }
                    }
                    return parts.join('.');
                };

                const parseString = (bytes) => {
                    try { return new TextDecoder('utf-8').decode(bytes); }
                    catch { return Array.from(bytes).map(b => String.fromCharCode(b)).join(''); }
                };

                const parseTime = (bytes, tag) => {
                    const str = parseString(bytes);
                    let year, month, day, hour, min, sec;
                    if (tag === 0x17) {
                        year = parseInt(str.substr(0, 2));
                        year += year >= 50 ? 1900 : 2000;
                        month = str.substr(2, 2); day = str.substr(4, 2);
                        hour = str.substr(6, 2); min = str.substr(8, 2); sec = str.substr(10, 2);
                    } else {
                        year = parseInt(str.substr(0, 4));
                        month = str.substr(4, 2); day = str.substr(6, 2);
                        hour = str.substr(8, 2); min = str.substr(10, 2); sec = str.substr(12, 2);
                    }
                    return new Date(Date.UTC(year, parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(min), parseInt(sec)));
                };

                const parseName = (bytes) => {
                    const parts = [];
                    let pos = 0;
                    while (pos < bytes.length) {
                        const set = parseElement(bytes, pos);
                        if (!set || set.tag !== 0x31) break;
                        let setPos = 0;
                        while (setPos < set.content.length) {
                            const seq = parseElement(set.content, setPos);
                            if (!seq || seq.tag !== 0x30) break;
                            const oidEl = parseElement(seq.content, 0);
                            if (oidEl && oidEl.tag === 0x06) {
                                const oid = parseOID(oidEl.content);
                                const valueEl = parseElement(seq.content, oidEl.totalLen);
                                if (valueEl) {
                                    parts.push(`${oidNames[oid] || oid}=${parseString(valueEl.content)}`);
                                }
                            }
                            setPos += seq.totalLen;
                        }
                        pos += set.totalLen;
                    }
                    return parts.join(', ');
                };

                let certInfo = {
                    version: 'v1', serialNumber: 'Unknown', signatureAlgorithm: 'Unknown',
                    issuer: 'Unknown', subject: 'Unknown', notBefore: null, notAfter: null,
                    publicKeyAlgorithm: 'Unknown', publicKeySize: null
                };

                try {
                    const cert = parseElement(derBytes, 0);
                    if (!cert || cert.tag !== 0x30) throw new Error('Invalid certificate');

                    const tbs = parseElement(derBytes, cert.contentStart);
                    if (!tbs || tbs.tag !== 0x30) throw new Error('Invalid TBSCertificate');

                    let pos = tbs.contentStart;
                    let el = parseElement(derBytes, pos);

                    if (el && el.tag === 0xa0) {
                        const verInt = parseElement(el.content, 0);
                        if (verInt && verInt.tag === 0x02) certInfo.version = `v${verInt.content[0] + 1}`;
                        pos += el.totalLen;
                        el = parseElement(derBytes, pos);
                    }

                    if (el && el.tag === 0x02) {
                        certInfo.serialNumber = Array.from(el.content).map(b => b.toString(16).padStart(2, '0')).join(':').toUpperCase();
                        pos += el.totalLen;
                    }

                    el = parseElement(derBytes, pos);
                    if (el && el.tag === 0x30) {
                        const oidEl = parseElement(el.content, 0);
                        if (oidEl && oidEl.tag === 0x06) certInfo.signatureAlgorithm = oidNames[parseOID(oidEl.content)] || parseOID(oidEl.content);
                        pos += el.totalLen;
                    }

                    el = parseElement(derBytes, pos);
                    if (el && el.tag === 0x30) { certInfo.issuer = parseName(el.content); pos += el.totalLen; }

                    el = parseElement(derBytes, pos);
                    if (el && el.tag === 0x30) {
                        const notBeforeEl = parseElement(el.content, 0);
                        if (notBeforeEl && (notBeforeEl.tag === 0x17 || notBeforeEl.tag === 0x18)) certInfo.notBefore = parseTime(notBeforeEl.content, notBeforeEl.tag);
                        const notAfterEl = parseElement(el.content, notBeforeEl.totalLen);
                        if (notAfterEl && (notAfterEl.tag === 0x17 || notAfterEl.tag === 0x18)) certInfo.notAfter = parseTime(notAfterEl.content, notAfterEl.tag);
                        pos += el.totalLen;
                    }

                    el = parseElement(derBytes, pos);
                    if (el && el.tag === 0x30) { certInfo.subject = parseName(el.content); pos += el.totalLen; }

                    el = parseElement(derBytes, pos);
                    if (el && el.tag === 0x30) {
                        const algoSeq = parseElement(el.content, 0);
                        if (algoSeq && algoSeq.tag === 0x30) {
                            const oidEl = parseElement(algoSeq.content, 0);
                            if (oidEl && oidEl.tag === 0x06) certInfo.publicKeyAlgorithm = oidNames[parseOID(oidEl.content)] || parseOID(oidEl.content);
                        }
                        const keyBitString = parseElement(el.content, algoSeq.totalLen);
                        if (keyBitString && keyBitString.tag === 0x03 && keyBitString.content.length > 1 && certInfo.publicKeyAlgorithm === 'RSA') {
                            const rsaSeq = parseElement(keyBitString.content, 1);
                            if (rsaSeq && rsaSeq.tag === 0x30) {
                                const modulus = parseElement(rsaSeq.content, 0);
                                if (modulus && modulus.tag === 0x02) certInfo.publicKeySize = (modulus.content.length - (modulus.content[0] === 0 ? 1 : 0)) * 8;
                            }
                        }
                    }
                } catch (e) { }

                const derSize = derBytes.length;
                const now = new Date();
                const isExpired = certInfo.notAfter && certInfo.notAfter < now;
                const isNotYetValid = certInfo.notBefore && certInfo.notBefore > now;

                let validityStatus = '';
                if (isExpired) validityStatus = '<span style="color: var(--error-color);"> (만료됨)</span>';
                else if (isNotYetValid) validityStatus = '<span style="color: var(--warning-color);"> (아직 유효하지 않음)</span>';

                gridEl.innerHTML = `
                    <div class="ip-result-item" style="grid-column: 1 / -1;">
                        <div class="ip-result-label">Subject</div>
                        <div class="ip-result-value">${utils.escapeHtml(certInfo.subject)}</div>
                    </div>
                    <div class="ip-result-item" style="grid-column: 1 / -1;">
                        <div class="ip-result-label">Issuer</div>
                        <div class="ip-result-value">${utils.escapeHtml(certInfo.issuer)}</div>
                    </div>
                    <div class="ip-result-item">
                        <div class="ip-result-label">Serial Number</div>
                        <div class="ip-result-value" style="font-family: monospace; font-size: 0.85rem; word-break: break-all;">${certInfo.serialNumber}</div>
                    </div>
                    <div class="ip-result-item">
                        <div class="ip-result-label">Version</div>
                        <div class="ip-result-value">${certInfo.version}</div>
                    </div>
                    <div class="ip-result-item">
                        <div class="ip-result-label">Valid From</div>
                        <div class="ip-result-value">${certInfo.notBefore ? certInfo.notBefore.toISOString() : 'Unknown'}</div>
                    </div>
                    <div class="ip-result-item">
                        <div class="ip-result-label">Valid To</div>
                        <div class="ip-result-value" style="${isExpired ? 'color: var(--error-color);' : ''}">${certInfo.notAfter ? certInfo.notAfter.toISOString() : 'Unknown'}${validityStatus}</div>
                    </div>
                    <div class="ip-result-item">
                        <div class="ip-result-label">Signature Algorithm</div>
                        <div class="ip-result-value">${certInfo.signatureAlgorithm}</div>
                    </div>
                    <div class="ip-result-item">
                        <div class="ip-result-label">Public Key</div>
                        <div class="ip-result-value">${certInfo.publicKeyAlgorithm}${certInfo.publicKeySize ? ' ' + certInfo.publicKeySize + ' bits' : ''}</div>
                    </div>
                    <div class="ip-result-item">
                        <div class="ip-result-label">Certificate Size</div>
                        <div class="ip-result-value">${derSize.toLocaleString()} bytes</div>
                    </div>
                `;
                resultsEl.style.display = 'block';
            },

            clearCert() {
                utils.clearElements(['cert-input'], ['cert-input']);
                utils.hideError('cert-error');
                ['cert-results', 'cert-commands', 'cert-input-type-badge'].forEach(id => {
                    const el = document.getElementById(id);
                    if (el) el.style.display = 'none';
                });
            }
        },

        // String Page
        string: {
            tabs: ['counter', 'replacer', 'compare'],

            // Helper to build search regex
            buildSearchRegex(searchText, useRegex, caseSensitive) {
                const flags = caseSensitive ? 'g' : 'gi';
                if (useRegex) {
                    return new RegExp(searchText, flags);
                }
                const escaped = searchText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                return new RegExp(escaped, flags);
            },

            render(activeTab) {
                activeTab = activeTab || 'counter';
                const tabLabels = { counter: 'Counter', replacer: 'Search/Replace', compare: 'Compare' };

                let content = '';
                switch (activeTab) {
                    case 'counter':
                        content = this.renderCounter();
                        break;
                    case 'replacer':
                        content = this.renderReplacer();
                        break;
                    case 'compare':
                        content = this.renderCompare();
                        break;
                }

                return `
                    <div class="page-container">
                        <h1 class="page-title">String<span id="builtin-badge" class="builtin-badge" style="display:none;">내장 기능</span></h1>
                        <div class="tabs">
                            ${this.tabs.map(tab => `
                                <button class="tab-btn ${tab === activeTab ? 'active' : ''}"
                                        data-tab="${tab}" onclick="pages.string.switchTab('${tab}')">
                                    ${tabLabels[tab]}
                                </button>
                            `).join('')}
                        </div>
                        ${content}
                    </div>
                `;
            },

            renderCounter() {
                return `
                    <div class="card">
                        <div class="form-group">
                            <div class="label-with-actions">
                                <label class="form-label">Input Text</label>
                                <button class="btn btn-small btn-secondary" onclick="pages.string.pasteCounter()">Paste</button>
                            </div>
                            <textarea id="string-analyze-input" class="form-textarea large"
                                      placeholder="Enter text to analyze..."></textarea>
                        </div>
                        <div class="flex gap-10 mt-10 mb-10">
                            <button class="btn btn-secondary" onclick="pages.string.copyCounter()">Copy</button>
                            <button class="btn btn-secondary" onclick="pages.string.clearCounter()">Clear</button>
                        </div>
                        <div class="ip-result-grid" id="string-results">
                            <div class="ip-result-item">
                                <div class="ip-result-label">Character Count</div>
                                <div class="ip-result-value" id="char-count">0</div>
                            </div>
                            <div class="ip-result-item">
                                <div class="ip-result-label">Character Count (no spaces)</div>
                                <div class="ip-result-value" id="char-count-no-space">0</div>
                            </div>
                            <div class="ip-result-item">
                                <div class="ip-result-label">Word Count</div>
                                <div class="ip-result-value" id="word-count">0</div>
                            </div>
                            <div class="ip-result-item">
                                <div class="ip-result-label">Line Count</div>
                                <div class="ip-result-value" id="line-count">0</div>
                            </div>
                            <div class="ip-result-item">
                                <div class="ip-result-label">Byte Size (UTF-8)</div>
                                <div class="ip-result-value" id="byte-size">0</div>
                            </div>
                        </div>
                    </div>
                `;
            },

            renderReplacer() {
                return `
                    <div class="card">
                        <div class="form-group">
                            <div class="label-with-actions">
                                <label class="form-label">Input Text</label>
                                <button class="btn btn-small btn-secondary" onclick="pages.string.pasteReplacer()">Paste</button>
                            </div>
                            <textarea id="replacer-input" class="form-textarea large"
                                      placeholder="Enter text to search in..."></textarea>
                        </div>
                        <div class="replacer-controls">
                            <div class="form-group">
                                <label class="form-label">Search</label>
                                <input type="text" id="replacer-search" class="form-input"
                                       placeholder="Search text or /regex/flags">
                            </div>
                            <div class="form-group">
                                <div class="label-with-help">
                                    <label class="form-label">Replace with</label>
                                    <span class="help-icon" tabindex="0">
                                        !
                                        <span class="help-tooltip">
                                            <strong>Escape Sequences:</strong><br>
                                            \\n → Newline<br>
                                            \\t → Tab<br>
                                            \\r → Carriage Return<br>
                                            \\\\ → Backslash
                                        </span>
                                    </span>
                                </div>
                                <input type="text" id="replacer-replace" class="form-input"
                                       placeholder="Replacement text">
                            </div>
                            <div class="replacer-options">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="replacer-regex"> Use Regex
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="replacer-case"> Case Sensitive
                                </label>
                            </div>
                        </div>
                        <div class="flex gap-10 mt-20">
                            <button class="btn btn-primary" onclick="pages.string.searchReplacer()">Search</button>
                            <button class="btn btn-primary" onclick="pages.string.replaceAll()">Replace All</button>
                            <button class="btn btn-secondary" onclick="pages.string.clearReplacer()">Clear</button>
                        </div>
                    </div>
                    <div class="card" id="replacer-result-card" style="display: none;">
                        <div class="replacer-stats" id="replacer-stats">
                            <span class="replacer-stat" id="result-stat-search"><strong>Matches:</strong> <span id="match-count">0</span></span>
                            <span class="replacer-stat" id="result-stat-replace" style="display: none;"><strong>Replaced:</strong> <span id="replace-count">0</span> occurrence(s)</span>
                        </div>
                        <div class="form-group">
                            <label class="form-label" id="result-label">Result</label>
                            <div id="replacer-result" class="replacer-result-box"></div>
                        </div>
                        <div class="form-group" id="match-positions-group" style="display: none;">
                            <label class="form-label">Match Positions</label>
                            <div id="match-positions" class="match-positions"></div>
                        </div>
                        <div class="flex gap-10 mt-20" id="replace-actions" style="display: none;">
                            <button class="btn btn-primary" onclick="pages.string.applyReplace()">Apply to Input</button>
                            <button class="btn btn-secondary" onclick="pages.string.copyReplaceResult()">Copy</button>
                        </div>
                    </div>
                `;
            },

            renderCompare() {
                return `
                    <div class="card">
                        <div class="compare-input-container">
                            <div class="compare-input-panel">
                                <div class="label-with-actions">
                                    <label class="form-label">Original Text</label>
                                    <button class="btn btn-small btn-secondary" onclick="pages.string.pasteOriginal()">Paste</button>
                                </div>
                                <textarea id="input-original" class="form-textarea" placeholder="Enter original text..."></textarea>
                                <div class="flex gap-10 mt-10">
                                    <button class="btn btn-secondary" onclick="pages.string.copyOriginal()">Copy</button>
                                    <button class="btn btn-secondary" onclick="pages.string.clearOriginal()">Clear</button>
                                </div>
                            </div>
                            <div class="compare-input-panel">
                                <div class="label-with-actions">
                                    <label class="form-label">Modified Text</label>
                                    <button class="btn btn-small btn-secondary" onclick="pages.string.pasteModified()">Paste</button>
                                </div>
                                <textarea id="input-modified" class="form-textarea" placeholder="Enter modified text..."></textarea>
                                <div class="flex gap-10 mt-10">
                                    <button class="btn btn-secondary" onclick="pages.string.copyModified()">Copy</button>
                                    <button class="btn btn-secondary" onclick="pages.string.clearModified()">Clear</button>
                                </div>
                            </div>
                        </div>
                        <div class="diff-stats" id="diff-stats">
                            <div class="diff-stat">
                                <span class="diff-stat-label">Added:</span>
                                <span class="diff-stat-value" id="stat-added" style="color: var(--success-color);">0</span>
                            </div>
                            <div class="diff-stat">
                                <span class="diff-stat-label">Removed:</span>
                                <span class="diff-stat-value" id="stat-removed" style="color: var(--error-color);">0</span>
                            </div>
                            <div class="diff-stat">
                                <span class="diff-stat-label">Unchanged:</span>
                                <span class="diff-stat-value" id="stat-unchanged">0</span>
                            </div>
                        </div>
                        <div class="compare-container">
                            <div class="compare-panel">
                                <label class="form-label">Original</label>
                                <div class="compare-editor-wrapper">
                                    <div class="compare-gutter" id="gutter-original"></div>
                                    <div class="compare-editor" id="editor-original"></div>
                                </div>
                            </div>
                            <div class="compare-panel">
                                <label class="form-label">Modified</label>
                                <div class="compare-editor-wrapper">
                                    <div class="compare-gutter" id="gutter-modified"></div>
                                    <div class="compare-editor" id="editor-modified"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            },

            async init(activeTab) {
                this.currentTab = activeTab || 'counter';

                if (this.currentTab === 'counter') {
                    const input = document.getElementById('string-analyze-input');
                    utils.loadFromStorage('string-analyze-input', (saved) => {
                        input.value = saved;
                        this.analyzeString();
                    });
                    input.addEventListener('input', utils.debounce(() => {
                        this.analyzeString();
                        utils.saveToStorage('string-analyze-input', input.value);
                    }, 100));
                } else if (this.currentTab === 'replacer') {
                    const input = document.getElementById('replacer-input');
                    const search = document.getElementById('replacer-search');
                    const replace = document.getElementById('replacer-replace');
                    const regexChk = document.getElementById('replacer-regex');
                    const caseChk = document.getElementById('replacer-case');

                    utils.loadFromStorage('replacer-input', (v) => input.value = v);
                    utils.loadFromStorage('replacer-search', (v) => search.value = v);
                    utils.loadFromStorage('replacer-replace', (v) => replace.value = v);
                    utils.loadFromStorage('replacer-regex', (v) => regexChk.checked = v === 'true');
                    utils.loadFromStorage('replacer-case', (v) => caseChk.checked = v === 'true');

                    input.addEventListener('input', () => utils.saveToStorage('replacer-input', input.value));
                    search.addEventListener('input', () => utils.saveToStorage('replacer-search', search.value));
                    replace.addEventListener('input', () => utils.saveToStorage('replacer-replace', replace.value));
                    regexChk.addEventListener('change', () => utils.saveToStorage('replacer-regex', regexChk.checked));
                    caseChk.addEventListener('change', () => utils.saveToStorage('replacer-case', caseChk.checked));
                } else if (this.currentTab === 'compare') {
                    await this.loadDiffLibraries();

                    const inputOriginal = document.getElementById('input-original');
                    const inputModified = document.getElementById('input-modified');
                    const editorOriginal = document.getElementById('editor-original');
                    const editorModified = document.getElementById('editor-modified');

                    utils.loadFromStorage('compare-original', (v) => inputOriginal.value = v);
                    utils.loadFromStorage('compare-modified', (v) => inputModified.value = v);

                    const compareDebounced = utils.debounce(() => this.runCompare(), 300);

                    inputOriginal.addEventListener('input', () => {
                        utils.saveToStorage('compare-original', inputOriginal.value);
                        compareDebounced();
                    });
                    inputModified.addEventListener('input', () => {
                        utils.saveToStorage('compare-modified', inputModified.value);
                        compareDebounced();
                    });

                    // Sync scroll between original and modified input textareas
                    let isInputSyncing = false;

                    inputOriginal.addEventListener('scroll', () => {
                        if (isInputSyncing) return;
                        isInputSyncing = true;
                        const scrollPercent = inputOriginal.scrollTop / (inputOriginal.scrollHeight - inputOriginal.clientHeight);
                        inputModified.scrollTop = scrollPercent * (inputModified.scrollHeight - inputModified.clientHeight);
                        setTimeout(() => isInputSyncing = false, 10);
                    });
                    inputModified.addEventListener('scroll', () => {
                        if (isInputSyncing) return;
                        isInputSyncing = true;
                        const scrollPercent = inputModified.scrollTop / (inputModified.scrollHeight - inputModified.clientHeight);
                        inputOriginal.scrollTop = scrollPercent * (inputOriginal.scrollHeight - inputOriginal.clientHeight);
                        setTimeout(() => isInputSyncing = false, 10);
                    });

                    // Sync scroll between original and modified result editors and their gutters
                    const gutterOriginal = document.getElementById('gutter-original');
                    const gutterModified = document.getElementById('gutter-modified');
                    let isSyncing = false;

                    editorOriginal.addEventListener('scroll', () => {
                        // Sync gutter with editor
                        gutterOriginal.scrollTop = editorOriginal.scrollTop;

                        if (isSyncing) return;
                        isSyncing = true;
                        const scrollPercent = editorOriginal.scrollTop / (editorOriginal.scrollHeight - editorOriginal.clientHeight);
                        editorModified.scrollTop = scrollPercent * (editorModified.scrollHeight - editorModified.clientHeight);
                        gutterModified.scrollTop = editorModified.scrollTop;
                        setTimeout(() => isSyncing = false, 10);
                    });
                    editorModified.addEventListener('scroll', () => {
                        // Sync gutter with editor
                        gutterModified.scrollTop = editorModified.scrollTop;

                        if (isSyncing) return;
                        isSyncing = true;
                        const scrollPercent = editorModified.scrollTop / (editorModified.scrollHeight - editorModified.clientHeight);
                        editorOriginal.scrollTop = scrollPercent * (editorOriginal.scrollHeight - editorOriginal.clientHeight);
                        gutterOriginal.scrollTop = editorOriginal.scrollTop;
                        setTimeout(() => isSyncing = false, 10);
                    });

                    // Initial compare
                    this.runCompare();
                }
            },

            async loadDiffLibraries() {
                const badge = document.getElementById('builtin-badge');

                const updateBadge = () => {
                    const useBuiltin = !libraryLoader.isLoaded('diff_match_patch');
                    badge.style.display = useBuiltin ? 'inline-block' : 'none';
                                    };

                updateBadge();

                if (libraryLoader.hasUnloadedForTab('differ', 'text')) {
                    libraryLoader.loadForTab('differ', 'text').then(() => {
                        updateBadge();
                    });
                }
            },

            switchTab(tab) {
                router.navigate(`/string/${tab}`);
            },

            analyzeString() {
                const input = document.getElementById('string-analyze-input').value;

                document.getElementById('char-count').textContent = input.length;
                document.getElementById('char-count-no-space').textContent = input.replace(/\s/g, '').length;
                document.getElementById('word-count').textContent = input.trim() ? input.trim().split(/\s+/).length : 0;
                document.getElementById('line-count').textContent = input ? input.split('\n').length : 0;
                document.getElementById('byte-size').textContent = new Blob([input]).size;
            },

            async pasteCounter() {
                try {
                    const text = await navigator.clipboard.readText();
                    const input = document.getElementById('string-analyze-input');
                    input.value = text;
                    utils.saveToStorage('string-analyze-input', text);
                    this.analyzeString();
                } catch (e) {
                    utils.showToast('Failed to read clipboard', 'error');
                }
            },

            copyCounter() {
                utils.copyToClipboard(document.getElementById('string-analyze-input').value);
            },

            clearCounter() {
                document.getElementById('string-analyze-input').value = '';
                utils.removeFromStorage('string-analyze-input');
                this.analyzeString();
            },

            async pasteReplacer() {
                try {
                    const text = await navigator.clipboard.readText();
                    const input = document.getElementById('replacer-input');
                    input.value = text;
                    utils.saveToStorage('replacer-input', text);
                } catch (e) {
                    utils.showToast('Failed to read clipboard', 'error');
                }
            },

            searchReplacer() {
                const input = document.getElementById('replacer-input').value;
                const searchText = document.getElementById('replacer-search').value;
                const useRegex = document.getElementById('replacer-regex').checked;
                const caseSensitive = document.getElementById('replacer-case').checked;
                const resultCard = document.getElementById('replacer-result-card');
                const resultBox = document.getElementById('replacer-result');
                const matchCount = document.getElementById('match-count');
                const positionsGroup = document.getElementById('match-positions-group');
                const positionsBox = document.getElementById('match-positions');
                const resultLabel = document.getElementById('result-label');
                const statSearch = document.getElementById('result-stat-search');
                const statReplace = document.getElementById('result-stat-replace');
                const replaceActions = document.getElementById('replace-actions');

                if (!input || !searchText) {
                    resultCard.style.display = 'none';
                    return;
                }

                try {
                    const regex = this.buildSearchRegex(searchText, useRegex, caseSensitive);

                    const matches = [];
                    let match;
                    while ((match = regex.exec(input)) !== null) {
                        matches.push({ index: match.index, text: match[0], length: match[0].length });
                        if (match[0].length === 0) regex.lastIndex++;
                    }

                    matchCount.textContent = matches.length;

                    if (matches.length === 0) {
                        resultBox.innerHTML = `<span class="text-muted">No matches found</span>`;
                        positionsGroup.style.display = 'none';
                    } else {
                        // Build highlighted result
                        let html = '';
                        let lastIndex = 0;
                        matches.forEach(m => {
                            html += utils.escapeHtml(input.substring(lastIndex, m.index));
                            html += `<mark class="search-highlight">${utils.escapeHtml(m.text)}</mark>`;
                            lastIndex = m.index + m.length;
                        });
                        html += utils.escapeHtml(input.substring(lastIndex));
                        resultBox.innerHTML = html;

                        // Show positions
                        const posHtml = matches.map((m, i) => {
                            const line = input.substring(0, m.index).split('\n').length;
                            const col = m.index - input.lastIndexOf('\n', m.index - 1);
                            return `<span class="match-position">#${i + 1}: Line ${line}, Col ${col} "${utils.escapeHtml(m.text.substring(0, 20))}${m.text.length > 20 ? '...' : ''}"</span>`;
                        }).join('');
                        positionsBox.innerHTML = posHtml;
                        positionsGroup.style.display = 'block';
                    }

                    // Show search mode UI
                    resultLabel.textContent = 'Search Result (matches highlighted)';
                    statSearch.style.display = 'inline';
                    statReplace.style.display = 'none';
                    replaceActions.style.display = 'none';
                    resultCard.style.display = 'block';
                } catch (e) {
                    utils.showToast('Invalid regex pattern: ' + e.message, 'error');
                }
            },

            replaceAll() {
                const input = document.getElementById('replacer-input').value;
                const searchText = document.getElementById('replacer-search').value;
                const replaceText = document.getElementById('replacer-replace').value;
                const useRegex = document.getElementById('replacer-regex').checked;
                const caseSensitive = document.getElementById('replacer-case').checked;
                const resultCard = document.getElementById('replacer-result-card');
                const resultBox = document.getElementById('replacer-result');
                const replaceCount = document.getElementById('replace-count');
                const resultLabel = document.getElementById('result-label');
                const statSearch = document.getElementById('result-stat-search');
                const statReplace = document.getElementById('result-stat-replace');
                const replaceActions = document.getElementById('replace-actions');
                const positionsGroup = document.getElementById('match-positions-group');

                if (!input || !searchText) {
                    utils.showToast('Please enter text and search pattern', 'error');
                    return;
                }

                try {
                    const regex = this.buildSearchRegex(searchText, useRegex, caseSensitive);

                    // Convert escape sequences in replace text
                    const actualReplaceText = replaceText
                        .replace(/\\n/g, '\n')
                        .replace(/\\t/g, '\t')
                        .replace(/\\r/g, '\r')
                        .replace(/\\\\/g, '\\');

                    // Find all matches and build highlighted result
                    const matches = [];
                    let match;
                    while ((match = regex.exec(input)) !== null) {
                        matches.push({ index: match.index, text: match[0], length: match[0].length });
                        if (match[0].length === 0) regex.lastIndex++;
                    }

                    // Build result with highlights
                    let html = '';
                    let plainResult = '';
                    let lastIndex = 0;
                    matches.forEach(m => {
                        const before = input.substring(lastIndex, m.index);
                        html += utils.escapeHtml(before);
                        plainResult += before;

                        // For regex with capture groups, apply replacement properly
                        const replaced = m.text.replace(new RegExp(searchText, useRegex ? (caseSensitive ? '' : 'i') : ''), actualReplaceText);
                        html += `<mark class="replace-highlight">${utils.escapeHtml(replaced)}</mark>`;
                        plainResult += replaced;
                        lastIndex = m.index + m.length;
                    });
                    html += utils.escapeHtml(input.substring(lastIndex));
                    plainResult += input.substring(lastIndex);

                    this.lastReplaceResult = plainResult;
                    replaceCount.textContent = matches.length;
                    resultBox.innerHTML = html;

                    // Show replace mode UI
                    resultLabel.textContent = 'Replace Result (replaced highlighted)';
                    statSearch.style.display = 'none';
                    statReplace.style.display = 'inline';
                    positionsGroup.style.display = 'none';
                    replaceActions.style.display = 'flex';
                    resultCard.style.display = 'block';
                } catch (e) {
                    utils.showToast('Invalid regex pattern: ' + e.message, 'error');
                }
            },

            applyReplace() {
                if (this.lastReplaceResult !== undefined) {
                    const input = document.getElementById('replacer-input');
                    input.value = this.lastReplaceResult;
                    utils.saveToStorage('replacer-input', this.lastReplaceResult);
                    document.getElementById('replacer-result-card').style.display = 'none';
                    utils.showToast('Applied to input', 'success');
                    this.searchReplacer();
                }
            },

            copyReplaceResult() {
                if (this.lastReplaceResult !== undefined) {
                    utils.copyToClipboard(this.lastReplaceResult);
                }
            },

            clearReplacer() {
                utils.clearElements(
                    ['replacer-input', 'replacer-search', 'replacer-replace'],
                    ['replacer-input', 'replacer-search', 'replacer-replace', 'replacer-regex', 'replacer-case']
                );
                document.getElementById('replacer-regex').checked = false;
                document.getElementById('replacer-case').checked = false;
                document.getElementById('replacer-result-card').style.display = 'none';
                this.lastReplaceResult = undefined;
            },

            async pasteOriginal() {
                try {
                    const text = await navigator.clipboard.readText();
                    const input = document.getElementById('input-original');
                    input.value = text;
                    utils.saveToStorage('compare-original', text);
                    this.runCompare();
                } catch (e) {
                    utils.showToast('Failed to read clipboard', 'error');
                }
            },

            async pasteModified() {
                try {
                    const text = await navigator.clipboard.readText();
                    const input = document.getElementById('input-modified');
                    input.value = text;
                    utils.saveToStorage('compare-modified', text);
                    this.runCompare();
                } catch (e) {
                    utils.showToast('Failed to read clipboard', 'error');
                }
            },

            copyOriginal() {
                utils.copyToClipboard(document.getElementById('input-original').value);
            },

            copyModified() {
                utils.copyToClipboard(document.getElementById('input-modified').value);
            },

            clearOriginal() {
                utils.clearElements(['input-original', 'editor-original', 'gutter-original'], ['compare-original']);
                this.runCompare();
            },

            clearModified() {
                utils.clearElements(['input-modified', 'editor-modified', 'gutter-modified'], ['compare-modified']);
                this.runCompare();
            },

            runCompare() {
                const inputOriginal = document.getElementById('input-original');
                const inputModified = document.getElementById('input-modified');
                const editorOriginal = document.getElementById('editor-original');
                const editorModified = document.getElementById('editor-modified');
                const gutterOriginal = document.getElementById('gutter-original');
                const gutterModified = document.getElementById('gutter-modified');

                const originalText = inputOriginal.value;
                const modifiedText = inputModified.value;

                const originalLines = originalText.split('\n');
                const modifiedLines = modifiedText.split('\n');

                // Simple line-by-line diff using LCS approach
                const diff = this.computeLineDiff(originalLines, modifiedLines);

                let addedCount = 0, removedCount = 0, unchangedCount = 0;

                // Build original side - count actual lines for gutter
                let originalHtml = '';
                let originalGutterHtml = '';
                let originalLineNum = 0;
                diff.original.forEach((item) => {
                    const escaped = utils.escapeHtml(item.text);
                    if (item.type === 'removed') {
                        originalLineNum++;
                        originalHtml += `<div class="compare-line compare-line-removed">${escaped || '&nbsp;'}</div>`;
                        originalGutterHtml += `<div class="compare-gutter-line compare-gutter-removed">${originalLineNum}</div>`;
                        removedCount++;
                    } else if (item.type === 'empty') {
                        originalHtml += `<div class="compare-line compare-line-empty">&nbsp;</div>`;
                        originalGutterHtml += `<div class="compare-gutter-line compare-gutter-empty"></div>`;
                    } else {
                        originalLineNum++;
                        originalHtml += `<div class="compare-line">${escaped || '&nbsp;'}</div>`;
                        originalGutterHtml += `<div class="compare-gutter-line">${originalLineNum}</div>`;
                        unchangedCount++;
                    }
                });

                // Build modified side - count actual lines for gutter
                let modifiedHtml = '';
                let modifiedGutterHtml = '';
                let modifiedLineNum = 0;
                diff.modified.forEach((item) => {
                    const escaped = utils.escapeHtml(item.text);
                    if (item.type === 'added') {
                        modifiedLineNum++;
                        modifiedHtml += `<div class="compare-line compare-line-added">${escaped || '&nbsp;'}</div>`;
                        modifiedGutterHtml += `<div class="compare-gutter-line compare-gutter-added">${modifiedLineNum}</div>`;
                        addedCount++;
                    } else if (item.type === 'empty') {
                        modifiedHtml += `<div class="compare-line compare-line-empty">&nbsp;</div>`;
                        modifiedGutterHtml += `<div class="compare-gutter-line compare-gutter-empty"></div>`;
                    } else {
                        modifiedLineNum++;
                        modifiedHtml += `<div class="compare-line">${escaped || '&nbsp;'}</div>`;
                        modifiedGutterHtml += `<div class="compare-gutter-line">${modifiedLineNum}</div>`;
                    }
                });

                // Update display - directly set editor innerHTML
                editorOriginal.innerHTML = originalHtml;
                editorModified.innerHTML = modifiedHtml;
                gutterOriginal.innerHTML = originalGutterHtml;
                gutterModified.innerHTML = modifiedGutterHtml;

                // Update stats
                document.getElementById('stat-added').textContent = addedCount;
                document.getElementById('stat-removed').textContent = removedCount;
                document.getElementById('stat-unchanged').textContent = unchangedCount;
            },

            computeLineDiff(originalLines, modifiedLines) {
                // LCS-based line diff
                const m = originalLines.length;
                const n = modifiedLines.length;

                // Build LCS table
                const dp = Array(m + 1).fill(null).map(() => Array(n + 1).fill(0));
                for (let i = 1; i <= m; i++) {
                    for (let j = 1; j <= n; j++) {
                        if (originalLines[i - 1] === modifiedLines[j - 1]) {
                            dp[i][j] = dp[i - 1][j - 1] + 1;
                        } else {
                            dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                        }
                    }
                }

                // Backtrack to find diff
                const originalResult = [];
                const modifiedResult = [];
                let i = m, j = n;

                const tempOriginal = [];
                const tempModified = [];

                while (i > 0 || j > 0) {
                    if (i > 0 && j > 0 && originalLines[i - 1] === modifiedLines[j - 1]) {
                        tempOriginal.unshift({ type: 'unchanged', text: originalLines[i - 1] });
                        tempModified.unshift({ type: 'unchanged', text: modifiedLines[j - 1] });
                        i--; j--;
                    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
                        tempOriginal.unshift({ type: 'empty', text: '' });
                        tempModified.unshift({ type: 'added', text: modifiedLines[j - 1] });
                        j--;
                    } else {
                        tempOriginal.unshift({ type: 'removed', text: originalLines[i - 1] });
                        tempModified.unshift({ type: 'empty', text: '' });
                        i--;
                    }
                }

                return { original: tempOriginal, modified: tempModified };
            },

            clearCompare() {
                utils.clearElements(
                    ['editor-original', 'editor-modified'],
                    ['compare-original', 'compare-modified']
                );
                this.runCompare();
            }
        },

        // Calculator Page (IP Calculator)
        calculator: {
            render() {
                return `
                    <div class="page-container">
                        <h1 class="page-title">IP Calculator</h1>
                    <div class="card">
                        <div class="form-group">
                            <div class="label-with-actions">
                                <label class="form-label">IP Address / CIDR</label>
                                <button class="btn btn-small btn-secondary" onclick="pages.calculator.paste()">Paste</button>
                            </div>
                            <input type="text" id="ip-input" class="form-input"
                                   placeholder="e.g., 192.168.1.0/24 or 192.168.1.0 255.255.255.0">
                            <div class="flex gap-10 mt-10">
                                <button class="btn btn-secondary" onclick="pages.calculator.copy()">Copy</button>
                                <button class="btn btn-secondary" onclick="pages.calculator.clear()">Clear</button>
                            </div>
                        </div>
                        <div id="ip-error" class="message message-error" style="display: none;"></div>
                        <div class="ip-result-grid" id="ip-results">
                            <div class="ip-result-item">
                                <div class="ip-result-label">IP Address</div>
                                <div class="ip-result-value" id="ip-address">-</div>
                            </div>
                            <div class="ip-result-item">
                                <div class="ip-result-label">Network Address</div>
                                <div class="ip-result-value" id="ip-network">-</div>
                            </div>
                            <div class="ip-result-item">
                                <div class="ip-result-label">Broadcast Address</div>
                                <div class="ip-result-value" id="ip-broadcast">-</div>
                            </div>
                            <div class="ip-result-item">
                                <div class="ip-result-label">Host Range</div>
                                <div class="ip-result-value" id="ip-range">-</div>
                            </div>
                            <div class="ip-result-item">
                                <div class="ip-result-label">Total Hosts</div>
                                <div class="ip-result-value" id="ip-hosts">-</div>
                            </div>
                            <div class="ip-result-item">
                                <div class="ip-result-label">Subnet Mask (Decimal)</div>
                                <div class="ip-result-value" id="ip-mask-dec">-</div>
                            </div>
                            <div class="ip-result-item">
                                <div class="ip-result-label">Subnet Mask (Binary)</div>
                                <div class="ip-result-value" id="ip-mask-bin">-</div>
                            </div>
                            <div class="ip-result-item">
                                <div class="ip-result-label">Prefix Length</div>
                                <div class="ip-result-value" id="ip-prefix">-</div>
                            </div>
                            <div class="ip-result-item">
                                <div class="ip-result-label">IP Class</div>
                                <div class="ip-result-value" id="ip-class">-</div>
                            </div>
                        </div>
                    </div>
                </div>
                `;
            },

            async init() {
                const input = document.getElementById('ip-input');
                utils.loadFromStorage('calc-ip-input', (saved) => {
                    input.value = saved;
                    this.calculateIP();
                });
                input.addEventListener('input', utils.debounce(() => {
                    this.calculateIP();
                    utils.saveToStorage('calc-ip-input', input.value);
                }, 300));
            },

            calculateIP() {
                const input = document.getElementById('ip-input').value.trim();
                const error = document.getElementById('ip-error');

                if (!input) {
                    this.clearIPResults();
                    error.style.display = 'none';
                    return;
                }

                try {
                    let ip, prefix;

                    if (input.includes('/')) {
                        [ip, prefix] = input.split('/');
                        prefix = parseInt(prefix, 10);
                    } else if (input.includes(' ')) {
                        const parts = input.split(/\s+/);
                        ip = parts[0];
                        const mask = parts[1];
                        prefix = this.maskToPrefix(mask);
                    } else {
                        ip = input;
                        prefix = 32;
                    }

                    if (!this.isValidIP(ip) || prefix < 0 || prefix > 32) {
                        throw new Error('Invalid IP address or prefix');
                    }

                    const ipNum = this.ipToNumber(ip);
                    const maskNum = this.prefixToMask(prefix);
                    const networkNum = ipNum & maskNum;
                    const broadcastNum = networkNum | (~maskNum >>> 0);
                    const hostCount = Math.pow(2, 32 - prefix) - 2;

                    document.getElementById('ip-address').textContent = ip;
                    document.getElementById('ip-network').textContent = this.numberToIP(networkNum);
                    document.getElementById('ip-broadcast').textContent = this.numberToIP(broadcastNum);
                    document.getElementById('ip-range').textContent = prefix < 31
                        ? `${this.numberToIP(networkNum + 1)} - ${this.numberToIP(broadcastNum - 1)}`
                        : 'N/A';
                    document.getElementById('ip-hosts').textContent = prefix < 31 ? hostCount : (prefix === 31 ? 2 : 1);
                    document.getElementById('ip-mask-dec').textContent = this.numberToIP(maskNum);
                    document.getElementById('ip-mask-bin').textContent = maskNum.toString(2).padStart(32, '0').match(/.{8}/g).join('.');
                    document.getElementById('ip-prefix').textContent = `/${prefix}`;
                    document.getElementById('ip-class').textContent = this.getIPClass(ipNum);

                    error.style.display = 'none';
                } catch (e) {
                    error.textContent = e.message;
                    error.style.display = 'block';
                    this.clearIPResults();
                }
            },

            clearIPResults() {
                ['ip-address', 'ip-network', 'ip-broadcast', 'ip-range', 'ip-hosts',
                 'ip-mask-dec', 'ip-mask-bin', 'ip-prefix', 'ip-class'].forEach(id => {
                    document.getElementById(id).textContent = '-';
                });
            },

            isValidIP(ip) {
                const parts = ip.split('.');
                if (parts.length !== 4) return false;
                return parts.every(p => {
                    const n = parseInt(p, 10);
                    return !isNaN(n) && n >= 0 && n <= 255 && p === n.toString();
                });
            },

            ipToNumber(ip) {
                return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
            },

            numberToIP(num) {
                return [(num >>> 24) & 255, (num >>> 16) & 255, (num >>> 8) & 255, num & 255].join('.');
            },

            prefixToMask(prefix) {
                return prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
            },

            maskToPrefix(mask) {
                const num = this.ipToNumber(mask);
                let count = 0;
                let n = num;
                while (n) {
                    count += n & 1;
                    n >>>= 1;
                }
                return count;
            },

            getIPClass(ipNum) {
                const firstOctet = (ipNum >>> 24) & 255;
                if (firstOctet < 128) return 'A';
                if (firstOctet < 192) return 'B';
                if (firstOctet < 224) return 'C';
                if (firstOctet < 240) return 'D (Multicast)';
                return 'E (Reserved)';
            },

            async paste() {
                try {
                    const text = await navigator.clipboard.readText();
                    const input = document.getElementById('ip-input');
                    input.value = text.trim();
                    utils.saveToStorage('calc-ip-input', input.value);
                    this.calculateIP();
                } catch (e) {
                    utils.showToast('Failed to read clipboard', 'error');
                }
            },

            copy() {
                utils.copyToClipboard(document.getElementById('ip-input').value);
            },

            clear() {
                utils.clearElements(['ip-input'], ['calc-ip-input']);
                utils.hideError('ip-error');
                ['ip-address', 'ip-network', 'ip-broadcast', 'ip-range',
                 'ip-hosts', 'ip-mask-dec', 'ip-mask-bin', 'ip-prefix', 'ip-class'].forEach(id => {
                    document.getElementById(id).textContent = '-';
                });
            }
        },

        // Generator Page
        generator: {
            render() {
                return `
                    <div class="page-container">
                        <h1 class="page-title">UUID Generator</h1>
                        <div class="card">
                            <div class="form-group">
                                <label class="form-label">Number of UUIDs to generate</label>
                                <div class="input-group">
                                    <input type="number" id="uuid-count" class="form-input"
                                           value="5" min="1" max="100" placeholder="Enter count...">
                                    <button class="btn btn-primary" onclick="pages.generator.generate()">Generate</button>
                                </div>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Generated UUIDs</label>
                                <div class="uuid-list" id="uuid-list">
                                    <p style="color: var(--text-muted);">Click "Generate" to create UUIDs</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            },

            async init() {
                const input = document.getElementById('uuid-count');

                utils.loadFromStorage('uuid-count', (saved) => input.value = saved);

                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') this.generate();
                });
                input.addEventListener('input', () => utils.saveToStorage('uuid-count', input.value));
            },

            generate() {
                const count = Math.min(100, Math.max(1, parseInt(document.getElementById('uuid-count').value, 10) || 5));
                const list = document.getElementById('uuid-list');

                this.uuids = [];
                let html = '';

                for (let i = 0; i < count; i++) {
                    const uuid = this.generateUUID();
                    this.uuids.push(uuid);
                    html += `
                        <div class="uuid-item">
                            <span>${uuid}</span>
                            <button class="btn btn-small btn-secondary" onclick="pages.generator.copy('${uuid}')">Copy</button>
                        </div>
                    `;
                }

                html += `
                    <div class="flex gap-10 mt-10">
                        <button class="btn btn-secondary" onclick="pages.generator.copyAll()">Copy All</button>
                    </div>
                `;

                list.innerHTML = html;
            },

            generateUUID() {
                return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    const r = Math.random() * 16 | 0;
                    const v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            },

            copy(uuid) {
                utils.copyToClipboard(uuid);
            },

            copyAll() {
                if (this.uuids && this.uuids.length) {
                    utils.copyToClipboard(this.uuids.join('\n'));
                }
            }
        },

        // Command Page
        command: {
            tabs: ['windows'],

            windowsCommands: [
                { cmd: 'ncpa.cpl', desc: '네트워크 연결', icon: '🌐' },
                { cmd: 'mmsys.cpl', desc: '소리 설정', icon: '🔊' },
                { cmd: 'appwiz.cpl', desc: '프로그램 추가/제거', icon: '📦' },
                { cmd: 'firewall.cpl', desc: '방화벽 설정', icon: '🛡️' },
                { cmd: 'devmgmt.msc', desc: '장치 관리자', icon: '🔧' },
                { cmd: 'gpedit.msc', desc: '그룹 정책 편집기', icon: '📋' },
                { cmd: 'eventvwr.msc', desc: '이벤트 뷰어', icon: '📊' },
                { cmd: 'sysdm.cpl', desc: '시스템 속성', icon: '💻' },
                { cmd: 'lusrmgr.msc', desc: '로컬 사용자 및 그룹', icon: '👥' },
                { cmd: 'diskmgmt.msc', desc: '디스크 관리', icon: '💿' },
                { cmd: 'services.msc', desc: '서비스 관리', icon: '⚙️' },
                { cmd: 'msconfig', desc: '시스템 구성', icon: '🔩' },
                { cmd: 'regedit', desc: '레지스트리 편집기', icon: '📝' },
                { cmd: 'taskmgr', desc: '작업 관리자', icon: '📈' },
                { cmd: 'control', desc: '제어판', icon: '🎛️' }
            ],

            render(activeTab) {
                return `
                    <div class="page-container">
                        <h1 class="page-title">Command Reference</h1>
                        ${this.renderWindows()}
                    </div>
                `;
            },

            renderWindows() {
                return `
                    <div class="card">
                        <p class="mb-10" style="color: var(--text-muted); font-size: 0.85rem;">
                            Win+R 또는 명령 프롬프트에서 실행하세요.
                        </p>
                        <div class="command-grid">
                            ${this.windowsCommands.map(({ cmd, desc, icon }) => `
                                <div class="command-item" onclick="pages.command.copyCommand('${cmd}')">
                                    <span class="command-cmd">${cmd}</span>
                                    <span class="command-icon">${icon}</span>
                                    <span class="command-label">${desc}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                `;
            },

            async init(activeTab) {
                // Windows commands page - no initialization needed
            },

            copyCommand(cmd) {
                utils.copyToClipboard(cmd);
            }
        },

        // Downloader Page
        downloader: {
            tabs: ['html', 'github'],
            foundItems: [],

            render(activeTab) {
                activeTab = activeTab || 'html';
                const tabLabels = { html: 'HTML', github: 'Github' };

                let content = '';
                switch (activeTab) {
                    case 'html':
                        content = this.renderHtml();
                        break;
                    case 'github':
                        content = this.renderGithub();
                        break;
                }

                return `
                    <div class="page-container">
                        <h1 class="page-title">Downloader</h1>
                        <div class="tabs">
                            ${this.tabs.map(tab => `
                                <button class="tab-btn ${tab === activeTab ? 'active' : ''}"
                                        data-tab="${tab}" onclick="pages.downloader.switchTab('${tab}')">
                                    ${tabLabels[tab]}
                                </button>
                            `).join('')}
                        </div>
                        ${content}
                    </div>
                `;
            },

            renderHtml() {
                return `
                    <div class="card">
                        <div class="form-group">
                            <div class="label-with-actions">
                                <label class="form-label">Base URL <span style="color: var(--error-color);">*</span></label>
                                <button class="btn btn-small btn-secondary" onclick="pages.downloader.pasteBaseUrl()">Paste</button>
                            </div>
                            <input type="text" id="dl-base-url" class="form-input"
                                   placeholder="https://example.com">
                        </div>
                        <div class="form-group">
                            <div class="label-with-actions">
                                <label class="form-label">HTML Content <span style="color: var(--error-color);">*</span></label>
                                <button class="btn btn-small btn-secondary" onclick="pages.downloader.paste()">Paste</button>
                            </div>
                            <textarea id="downloader-input" class="form-textarea large"
                                      placeholder="Paste HTML content here..."></textarea>
                        </div>
                        <div class="form-group">
                            <label class="form-label">CSS Selector (optional)</label>
                            <input type="text" id="dl-selector" class="form-input"
                                   placeholder="e.g. #content, .gallery, article, div.post-body">
                            <small style="color: var(--text-muted);">Leave empty to search entire HTML</small>
                        </div>
                        <div class="form-group">
                            <label class="form-label">User-Agent (optional)</label>
                            <input type="text" id="dl-user-agent" class="form-input"
                                   placeholder="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36...">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Options</label>
                            <div class="checkbox-group">
                                <label class="checkbox-label">
                                    <input type="checkbox" id="dl-images" checked> Images
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="dl-videos" checked> Videos
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="dl-audio" checked> Audio
                                </label>
                                <label class="checkbox-label">
                                    <input type="checkbox" id="dl-pdf" checked> PDF
                                </label>
                            </div>
                        </div>
                        <div class="flex gap-10 mt-10">
                            <button class="btn btn-primary" onclick="pages.downloader.findMedia()">Find Media</button>
                            <button class="btn btn-secondary" onclick="pages.downloader.clearInput()">Clear</button>
                        </div>
                    </div>
                    <div class="card dl-status-card" id="dl-status-card" style="display: none;">
                        <div class="dl-status-header">
                            <span class="dl-status-spinner"></span>
                            <span class="dl-status-title">Progress</span>
                        </div>
                        <div class="dl-status-log" id="dl-status-log"></div>
                    </div>
                    <div class="card dl-error-card" id="dl-error-card" style="display: none;">
                        <div class="dl-error-message" id="dl-error-message"></div>
                    </div>
                    <div class="card" id="dl-results-card" style="display: none;">
                        <h3 class="card-title">Found Items</h3>
                        <div class="flex gap-10 mb-10">
                            <button class="btn btn-small btn-secondary" onclick="pages.downloader.selectAll()">Select All</button>
                            <button class="btn btn-small btn-secondary" onclick="pages.downloader.deselectAll()">Deselect All</button>
                            <button class="btn btn-small btn-success dl-auth-required" onclick="pages.downloader.downloadSelected()" style="display: none;">Download Selected</button>
                        </div>
                        <div id="dl-auth-hint" class="message" style="display: none; background-color: var(--primary-color); color: white; opacity: 0.9; margin-bottom: 15px;">
                            Login to enable download functionality.
                        </div>
                        <div id="dl-items-list" class="dl-items-list"></div>
                    </div>
                `;
            },

            renderGithub() {
                return `
                    <div class="card">
                        <div class="form-group">
                            <div class="label-with-actions">
                                <label class="form-label">GitHub Repository URL</label>
                                <button class="btn btn-small btn-secondary" onclick="pages.downloader.pasteGithub()">Paste</button>
                            </div>
                            <input type="text" id="github-url" class="form-input"
                                   placeholder="https://github.com/owner/repository">
                        </div>
                        <div class="form-group">
                            <div class="label-with-actions">
                                <label class="form-label">Branch / Tag / Release</label>
                                <button class="btn btn-small btn-secondary" onclick="pages.downloader.fetchBranches()">Branches</button>
                                <button class="btn btn-small btn-secondary" onclick="pages.downloader.fetchTags()">Tags</button>
                                <button class="btn btn-small btn-secondary" onclick="pages.downloader.fetchReleases()">Releases</button>
                            </div>
                            <select id="github-ref-select" class="form-select" style="display: none;">
                                <option value="">Select...</option>
                            </select>
                            <input type="text" id="github-branch" class="form-input"
                                   placeholder="main (default)">
                            <small style="color: var(--text-muted);">Enter manually or click buttons to load from repository</small>
                        </div>
                        <div class="flex gap-10 mt-10">
                            <button class="btn btn-primary" onclick="pages.downloader.downloadGithub()">Download</button>
                            <button class="btn btn-secondary" onclick="pages.downloader.clearGithub()">Clear</button>
                        </div>
                        <div id="github-status" class="mt-10" style="display: none;"></div>
                    </div>
                `;
            },

            async init(activeTab) {
                this.currentTab = activeTab || 'html';
                this.foundItems = [];

                if (this.currentTab === 'html') {
                    // Load saved checkbox states
                    ['dl-images', 'dl-videos', 'dl-audio', 'dl-pdf'].forEach(id => {
                        const checkbox = document.getElementById(id);
                        if (checkbox) {
                            utils.loadFromStorage(id, (saved) => checkbox.checked = saved === 'true');
                            checkbox.addEventListener('change', () => utils.saveToStorage(id, checkbox.checked));
                        }
                    });

                    // Load saved inputs
                    const inputs = [
                        { id: 'dl-base-url', key: 'dl-base-url' },
                        { id: 'downloader-input', key: 'dl-html-content' },
                        { id: 'dl-user-agent', key: 'dl-user-agent' },
                        { id: 'dl-selector', key: 'dl-selector' }
                    ];
                    inputs.forEach(({ id, key }) => {
                        const input = document.getElementById(id);
                        if (input) {
                            utils.loadFromStorage(key, (saved) => input.value = saved);
                            input.addEventListener('input', () => utils.saveToStorage(key, input.value));
                        }
                    });
                }
            },

            switchTab(tab) {
                router.navigate(`/downloader/${tab}`);
            },

            async pasteBaseUrl() {
                try {
                    const text = await navigator.clipboard.readText();
                    const input = document.getElementById('dl-base-url');
                    input.value = text.trim();
                    input.dispatchEvent(new Event('input'));
                    utils.showToast('Pasted from clipboard');
                } catch (e) {
                    utils.showToast('Failed to paste from clipboard');
                }
            },

            async paste() {
                try {
                    const text = await navigator.clipboard.readText();
                    const input = document.getElementById('downloader-input');
                    input.value = text;
                    input.dispatchEvent(new Event('input'));
                    utils.showToast('Pasted from clipboard');
                } catch (e) {
                    utils.showToast('Failed to paste from clipboard');
                }
            },

            async pasteGithub() {
                try {
                    const text = await navigator.clipboard.readText();
                    const input = document.getElementById('github-url');
                    input.value = text;
                    input.dispatchEvent(new Event('input'));
                    utils.showToast('Pasted from clipboard');
                } catch (e) {
                    utils.showToast('Failed to paste from clipboard');
                }
            },

            clearInput() {
                utils.clearElements(['downloader-input'], ['dl-html-content']);
                ['dl-results-card', 'dl-status-card', 'dl-error-card'].forEach(id => {
                    document.getElementById(id).style.display = 'none';
                });
                this.foundItems = [];
            },

            clearGithub() {
                document.getElementById('github-url').value = '';
                document.getElementById('github-branch').value = '';
                const refSelect = document.getElementById('github-ref-select');
                refSelect.innerHTML = '<option value="">Select...</option>';
                refSelect.style.display = 'none';
                document.getElementById('github-branch').style.display = 'block';
                document.getElementById('github-status').style.display = 'none';
            },

            statusStartTime: null,

            showStatus(message, clear = false) {
                const statusCard = document.getElementById('dl-status-card');
                const statusLog = document.getElementById('dl-status-log');
                const spinner = statusCard.querySelector('.dl-status-spinner');

                if (clear) {
                    statusLog.innerHTML = '';
                    this.statusStartTime = Date.now();
                }

                if (!this.statusStartTime) {
                    this.statusStartTime = Date.now();
                }

                // Show spinner
                if (spinner) spinner.style.display = 'block';

                const elapsed = ((Date.now() - this.statusStartTime) / 1000).toFixed(2);
                const logEntry = document.createElement('div');
                logEntry.className = 'dl-status-entry';
                logEntry.innerHTML = `<span class="dl-status-time">[${elapsed}s]</span> ${message}`;
                statusLog.appendChild(logEntry);
                statusLog.scrollTop = statusLog.scrollHeight;

                statusCard.style.display = 'block';
            },

            stopStatusSpinner() {
                const statusCard = document.getElementById('dl-status-card');
                const spinner = statusCard.querySelector('.dl-status-spinner');
                if (spinner) spinner.style.display = 'none';
            },

            hideStatus() {
                document.getElementById('dl-status-card').style.display = 'none';
            },

            clearStatus() {
                const statusLog = document.getElementById('dl-status-log');
                if (statusLog) {
                    statusLog.innerHTML = '';
                }
                this.statusStartTime = null;
                document.getElementById('dl-status-card').style.display = 'none';
            },

            showError(message) {
                this.stopStatusSpinner();
                const errorCard = document.getElementById('dl-error-card');
                const errorMessage = document.getElementById('dl-error-message');
                errorMessage.textContent = message;
                errorCard.style.display = 'block';
                document.getElementById('dl-results-card').style.display = 'none';
            },

            hideError() {
                document.getElementById('dl-error-card').style.display = 'none';
            },

            async findMedia() {
                const result = await this.parseContent();
                return result;
            },

            async downloadAll() {
                if (!window.serverMode || !window.serverMode.authenticated) {
                    utils.showToast('Login required for download');
                    return;
                }

                // If no items found yet, find them first
                if (this.foundItems.length === 0) {
                    const result = await this.parseContent();
                    if (!result) return; // parsing failed
                }

                // Download checked items
                await this.downloadSelected();
            },

            async parseContent() {
                const baseUrl = document.getElementById('dl-base-url').value.trim();
                if (!baseUrl) {
                    this.showError('Please enter Base URL');
                    return false;
                }

                const input = document.getElementById('downloader-input').value.trim();
                if (!input) {
                    this.showError('Please enter HTML content');
                    return false;
                }

                this.clearStatus();
                this.showStatus('Starting media search...');
                this.showStatus(`Base URL: ${baseUrl}`);

                const includeImages = document.getElementById('dl-images').checked;
                const includeVideos = document.getElementById('dl-videos').checked;
                const includeAudio = document.getElementById('dl-audio').checked;
                const includePdf = document.getElementById('dl-pdf').checked;
                const selector = document.getElementById('dl-selector').value.trim();

                let html = input;
                this.showStatus(`Processing HTML content (${input.length} characters)`);

                // Apply CSS selector if provided
                if (selector) {
                    this.showStatus(`Applying CSS selector: ${selector}`);
                    try {
                        const parser = new DOMParser();
                        const doc = parser.parseFromString(html, 'text/html');
                        const elements = doc.querySelectorAll(selector);
                        if (elements.length === 0) {
                            this.showError(`No elements found matching selector: ${selector}`);
                            return false;
                        }
                        this.showStatus(`Found ${elements.length} element(s) matching selector`);
                        // Combine all matched elements' HTML
                        html = Array.from(elements).map(el => el.outerHTML).join('\n');
                    } catch (e) {
                        this.showError(`Invalid CSS selector: ${selector}`);
                        return false;
                    }
                }

                // Parse HTML content
                this.showStatus('Searching media in HTML...');
                this.foundItems = this.extractMediaFromHtml(html, includeImages, includeVideos, includeAudio, includePdf, baseUrl);

                if (this.foundItems.length === 0) {
                    this.showStatus('No media items found.');
                    this.showError('No media items found in the provided HTML content.');
                    return false;
                }

                // Count by type
                const counts = {};
                this.foundItems.forEach(item => {
                    counts[item.type] = (counts[item.type] || 0) + 1;
                });
                const summary = Object.entries(counts).map(([type, count]) => `${count} ${type}(s)`).join(', ');
                this.showStatus(`Found ${this.foundItems.length} items: ${summary}`);
                this.showStatus('Complete!');
                this.stopStatusSpinner();

                this.hideError();
                this.displayFoundItems();
                return true;
            },

            resolveUrl(src, baseUrl) {
                if (!src || src.startsWith('data:') || src.startsWith('javascript:')) {
                    return null;
                }
                if (!baseUrl || src.startsWith('http://') || src.startsWith('https://')) {
                    return src;
                }
                try {
                    return new URL(src, baseUrl).href;
                } catch {
                    return src;
                }
            },

            findLineNumber(html, searchStr) {
                const index = html.indexOf(searchStr);
                if (index === -1) return -1;
                return html.substring(0, index).split('\n').length;
            },

            extractMediaFromHtml(html, includeImages, includeVideos, includeAudio, includePdf, baseUrl = '') {
                const items = [];
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');

                // Extract images
                if (includeImages) {
                    this.showStatus('Searching for images...');
                    doc.querySelectorAll('img[src]').forEach(img => {
                        const origSrc = img.getAttribute('src');
                        const src = this.resolveUrl(origSrc, baseUrl);
                        if (src) {
                            const line = this.findLineNumber(html, origSrc);
                            this.showStatus(`  [Line ${line}] Found image: ${this.getFilenameFromUrl(src) || 'image'}`);
                            items.push({
                                type: 'image',
                                url: src,
                                name: this.getFilenameFromUrl(src) || 'image',
                                icon: '🖼️'
                            });
                        }
                    });

                    // Also check for background images in style
                    const bgImageRegex = /url\(['"]?([^'"()]+)['"]?\)/g;
                    let match;
                    while ((match = bgImageRegex.exec(html)) !== null) {
                        const src = this.resolveUrl(match[1], baseUrl);
                        if (src && /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(src)) {
                            if (!items.find(i => i.url === src)) {
                                const line = this.findLineNumber(html, match[1]);
                                this.showStatus(`  [Line ${line}] Found background image: ${this.getFilenameFromUrl(src) || 'image'}`);
                                items.push({
                                    type: 'image',
                                    url: src,
                                    name: this.getFilenameFromUrl(src) || 'image',
                                    icon: '🖼️'
                                });
                            }
                        }
                    }
                }

                // Extract videos
                if (includeVideos) {
                    this.showStatus('Searching for videos...');
                    doc.querySelectorAll('video source[src], video[src]').forEach(el => {
                        const origSrc = el.getAttribute('src');
                        const src = this.resolveUrl(origSrc, baseUrl);
                        if (src) {
                            const line = this.findLineNumber(html, origSrc);
                            this.showStatus(`  [Line ${line}] Found video: ${this.getFilenameFromUrl(src) || 'video'}`);
                            items.push({
                                type: 'video',
                                url: src,
                                name: this.getFilenameFromUrl(src) || 'video',
                                icon: '🎬'
                            });
                        }
                    });

                    // Check for video links
                    doc.querySelectorAll('a[href]').forEach(a => {
                        const origHref = a.getAttribute('href');
                        const href = this.resolveUrl(origHref, baseUrl);
                        if (href && /\.(mp4|webm|ogg|mov|avi|mkv)$/i.test(href)) {
                            if (!items.find(i => i.url === href)) {
                                const line = this.findLineNumber(html, origHref);
                                this.showStatus(`  [Line ${line}] Found video link: ${this.getFilenameFromUrl(href) || 'video'}`);
                                items.push({
                                    type: 'video',
                                    url: href,
                                    name: this.getFilenameFromUrl(href) || 'video',
                                    icon: '🎬'
                                });
                            }
                        }
                    });
                }

                // Extract audio
                if (includeAudio) {
                    this.showStatus('Searching for audio...');
                    doc.querySelectorAll('audio source[src], audio[src]').forEach(el => {
                        const origSrc = el.getAttribute('src');
                        const src = this.resolveUrl(origSrc, baseUrl);
                        if (src) {
                            const line = this.findLineNumber(html, origSrc);
                            this.showStatus(`  [Line ${line}] Found audio: ${this.getFilenameFromUrl(src) || 'audio'}`);
                            items.push({
                                type: 'audio',
                                url: src,
                                name: this.getFilenameFromUrl(src) || 'audio',
                                icon: '🎵'
                            });
                        }
                    });

                    // Check for audio links
                    doc.querySelectorAll('a[href]').forEach(a => {
                        const origHref = a.getAttribute('href');
                        const href = this.resolveUrl(origHref, baseUrl);
                        if (href && /\.(mp3|wav|ogg|flac|aac|m4a)$/i.test(href)) {
                            if (!items.find(i => i.url === href)) {
                                const line = this.findLineNumber(html, origHref);
                                this.showStatus(`  [Line ${line}] Found audio link: ${this.getFilenameFromUrl(href) || 'audio'}`);
                                items.push({
                                    type: 'audio',
                                    url: href,
                                    name: this.getFilenameFromUrl(href) || 'audio',
                                    icon: '🎵'
                                });
                            }
                        }
                    });
                }

                // Extract PDFs
                if (includePdf) {
                    this.showStatus('Searching for PDFs...');
                    doc.querySelectorAll('a[href], embed[src], object[data]').forEach(el => {
                        const origSrc = el.getAttribute('href') || el.getAttribute('src') || el.getAttribute('data');
                        const src = this.resolveUrl(origSrc, baseUrl);
                        if (src && /\.pdf$/i.test(src)) {
                            if (!items.find(i => i.url === src)) {
                                const line = this.findLineNumber(html, origSrc);
                                this.showStatus(`  [Line ${line}] Found PDF: ${this.getFilenameFromUrl(src) || 'document.pdf'}`);
                                items.push({
                                    type: 'pdf',
                                    url: src,
                                    name: this.getFilenameFromUrl(src) || 'document.pdf',
                                    icon: '📄'
                                });
                            }
                        }
                    });
                }

                return items;
            },

            getFilenameFromUrl(url) {
                try {
                    const pathname = new URL(url, 'http://example.com').pathname;
                    const filename = pathname.split('/').pop();
                    return filename || null;
                } catch {
                    return url.split('/').pop() || null;
                }
            },

            displayFoundItems() {
                const listEl = document.getElementById('dl-items-list');
                const isAuthorized = window.serverMode && window.serverMode.authenticated;

                listEl.innerHTML = this.foundItems.map((item, idx) => `
                    <div class="dl-item">
                        <div class="dl-item-header">
                            <label class="checkbox-label">
                                <input type="checkbox" class="dl-item-check" data-index="${idx}" checked>
                                <span class="dl-item-icon">${item.icon}</span>
                                <span class="dl-item-name">${item.name}</span>
                                <span class="dl-item-type">${item.type}</span>
                            </label>
                            <div class="dl-item-actions">
                                ${isAuthorized ? `<button class="btn btn-small btn-secondary" onclick="pages.downloader.downloadSingle(${idx})">Download</button>` : ''}
                                <button class="btn btn-small btn-secondary" onclick="pages.downloader.copyUrl(${idx})">Copy URL</button>
                            </div>
                        </div>
                        ${item.type === 'image' ? `
                            <div class="dl-item-preview">
                                <img src="${item.url}" alt="${item.name}" onerror="this.parentElement.innerHTML='<span class=\\'preview-error\\'>Preview unavailable</span>'">
                            </div>
                        ` : ''}
                        ${item.type === 'video' ? `
                            <div class="dl-item-preview">
                                <video src="${item.url}" controls muted preload="metadata" onerror="this.parentElement.innerHTML='<span class=\\'preview-error\\'>Preview unavailable</span>'"></video>
                            </div>
                        ` : ''}
                        ${item.type === 'audio' ? `
                            <div class="dl-item-preview">
                                <audio src="${item.url}" controls preload="metadata" onerror="this.parentElement.innerHTML='<span class=\\'preview-error\\'>Preview unavailable</span>'"></audio>
                            </div>
                        ` : ''}
                        ${item.type === 'pdf' ? `
                            <div class="dl-item-preview dl-pdf-preview">
                                <iframe src="${item.url}" onerror="this.parentElement.innerHTML='<span class=\\'preview-error\\'>Preview unavailable</span>'"></iframe>
                            </div>
                        ` : ''}
                        <div class="dl-item-url">${item.url}</div>
                    </div>
                `).join('');

                document.getElementById('dl-results-card').style.display = 'block';

                // Show/hide auth-dependent elements
                const authHint = document.getElementById('dl-auth-hint');
                const authButtons = document.querySelectorAll('.dl-auth-required');

                if (isAuthorized) {
                    if (authHint) authHint.style.display = 'none';
                    authButtons.forEach(btn => btn.style.display = 'inline-flex');
                } else {
                    if (authHint) authHint.style.display = 'block';
                    authButtons.forEach(btn => btn.style.display = 'none');
                }
            },

            copyUrl(idx) {
                const item = this.foundItems[idx];
                if (item) {
                    utils.copyToClipboard(item.url);
                }
            },

            downloadSingle(idx) {
                const item = this.foundItems[idx];
                if (!item) return;

                if (!window.serverMode || !window.serverMode.authenticated) {
                    utils.showToast('Login required for download');
                    return;
                }

                // Backend 프록시를 통해 다운로드
                const userAgent = document.getElementById('dl-user-agent')?.value || '';
                const downloadUrl = `/api/download?url=${encodeURIComponent(item.url)}`;

                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = item.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                utils.showToast(`Downloading: ${item.name}`);
            },

            selectAll() {
                document.querySelectorAll('.dl-item-check').forEach(cb => cb.checked = true);
            },

            deselectAll() {
                document.querySelectorAll('.dl-item-check').forEach(cb => cb.checked = false);
            },

            async downloadSelected() {
                if (!window.serverMode || !window.serverMode.authenticated) {
                    utils.showToast('Login required for download');
                    return;
                }

                const selected = [];
                document.querySelectorAll('.dl-item-check:checked').forEach(cb => {
                    const idx = parseInt(cb.dataset.index);
                    selected.push({ ...this.foundItems[idx], idx });
                });

                if (selected.length === 0) {
                    utils.showToast('No items selected');
                    return;
                }

                utils.showToast(`Starting download of ${selected.length} item(s)...`);

                // 순차적으로 다운로드 (브라우저 제한 고려)
                for (let i = 0; i < selected.length; i++) {
                    const item = selected[i];
                    const downloadUrl = `/api/download?url=${encodeURIComponent(item.url)}`;

                    const link = document.createElement('a');
                    link.href = downloadUrl;
                    link.download = item.name;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);

                    // 다음 다운로드 전 짧은 대기
                    if (i < selected.length - 1) {
                        await new Promise(resolve => setTimeout(resolve, 500));
                    }
                }

                utils.showToast(`Downloaded ${selected.length} item(s)`);
            },

            parseGithubUrl(url) {
                // Parse GitHub URL: https://github.com/owner/repo or https://github.com/owner/repo/tree/branch
                const patterns = [
                    /github\.com\/([^\/]+)\/([^\/]+)(?:\/tree\/([^\/]+))?/,
                    /github\.com\/([^\/]+)\/([^\/]+)/
                ];

                for (const pattern of patterns) {
                    const match = url.match(pattern);
                    if (match) {
                        return {
                            owner: match[1],
                            repo: match[2].replace(/\.git$/, ''),
                            branch: match[3] || null
                        };
                    }
                }
                return null;
            },

            downloadGithub() {
                const urlInput = document.getElementById('github-url').value.trim();
                const refSelect = document.getElementById('github-ref-select');
                const branchInput = document.getElementById('github-branch').value.trim();
                const statusEl = document.getElementById('github-status');

                if (!urlInput) {
                    utils.showToast('Please enter a GitHub URL');
                    return;
                }

                const parsed = this.parseGithubUrl(urlInput);
                if (!parsed) {
                    utils.showToast('Invalid GitHub URL format');
                    return;
                }

                // Determine ref type and value
                let refType = 'branch';
                let refValue = 'main';
                let downloadUrl = '';
                let displayType = 'Branch';

                const selectedRef = refSelect.style.display !== 'none' && refSelect.value;
                if (selectedRef) {
                    const [type, ...valueParts] = selectedRef.split(':');
                    refType = type;
                    refValue = valueParts.join(':');
                } else if (branchInput) {
                    refValue = branchInput;
                } else if (parsed.branch) {
                    refValue = parsed.branch;
                }

                // Build download URL based on type
                switch (refType) {
                    case 'tag':
                        downloadUrl = `https://github.com/${parsed.owner}/${parsed.repo}/archive/refs/tags/${refValue}.zip`;
                        displayType = 'Tag';
                        break;
                    case 'release-zip':
                        downloadUrl = `https://github.com/${parsed.owner}/${parsed.repo}/archive/refs/tags/${refValue}.zip`;
                        displayType = 'Release (zip)';
                        break;
                    case 'release-tar':
                        downloadUrl = `https://github.com/${parsed.owner}/${parsed.repo}/archive/refs/tags/${refValue}.tar.gz`;
                        displayType = 'Release (tar.gz)';
                        break;
                    case 'asset':
                        downloadUrl = refValue; // refValue contains the full URL for assets
                        displayType = 'Release Asset';
                        refValue = refValue.split('/').pop(); // Get filename
                        break;
                    default:
                        downloadUrl = `https://github.com/${parsed.owner}/${parsed.repo}/archive/refs/heads/${refValue}.zip`;
                        displayType = 'Branch';
                }

                statusEl.innerHTML = `
                    <div style="color: var(--text-muted);">
                        <p>Repository: <strong>${parsed.owner}/${parsed.repo}</strong></p>
                        <p>${displayType}: <strong>${refValue}</strong></p>
                        <p>Download will start automatically...</p>
                    </div>
                `;
                statusEl.style.display = 'block';

                // Trigger download
                window.open(downloadUrl, '_blank');
                utils.showToast('Download started');
            },

            async fetchBranches() {
                const urlInput = document.getElementById('github-url').value.trim();
                const refSelect = document.getElementById('github-ref-select');
                const branchInput = document.getElementById('github-branch');
                const statusEl = document.getElementById('github-status');

                if (!urlInput) {
                    utils.showToast('Please enter a GitHub URL first');
                    return;
                }

                const parsed = this.parseGithubUrl(urlInput);
                if (!parsed) {
                    utils.showToast('Invalid GitHub URL format');
                    return;
                }

                statusEl.innerHTML = '<div style="color: var(--text-muted);">Fetching branches...</div>';
                statusEl.style.display = 'block';

                try {
                    const response = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/branches`);

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const branches = await response.json();

                    if (branches.length === 0) {
                        statusEl.innerHTML = '<div style="color: var(--text-muted);">No branches found</div>';
                        return;
                    }

                    // Populate dropdown
                    refSelect.innerHTML = '<option value="">Select a branch...</option>' +
                        branches.map(b => `<option value="branch:${b.name}">${b.name}${b.name === 'main' || b.name === 'master' ? ' (default)' : ''}</option>`).join('');

                    // Show dropdown, hide text input
                    refSelect.style.display = 'block';
                    branchInput.style.display = 'none';

                    statusEl.innerHTML = `<div style="color: var(--success-color);">Found ${branches.length} branch(es)</div>`;
                    utils.showToast(`Found ${branches.length} branches`);

                } catch (e) {
                    statusEl.innerHTML = `<div style="color: var(--error-color);">Failed to fetch branches: ${e.message}</div>`;
                    utils.showToast('Failed to fetch branches');
                }
            },

            async fetchTags() {
                const urlInput = document.getElementById('github-url').value.trim();
                const refSelect = document.getElementById('github-ref-select');
                const branchInput = document.getElementById('github-branch');
                const statusEl = document.getElementById('github-status');

                if (!urlInput) {
                    utils.showToast('Please enter a GitHub URL first');
                    return;
                }

                const parsed = this.parseGithubUrl(urlInput);
                if (!parsed) {
                    utils.showToast('Invalid GitHub URL format');
                    return;
                }

                statusEl.innerHTML = '<div style="color: var(--text-muted);">Fetching tags...</div>';
                statusEl.style.display = 'block';

                try {
                    const response = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/tags`);

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const tags = await response.json();

                    if (tags.length === 0) {
                        statusEl.innerHTML = '<div style="color: var(--text-muted);">No tags found</div>';
                        return;
                    }

                    // Populate dropdown
                    refSelect.innerHTML = '<option value="">Select a tag...</option>' +
                        tags.map(t => `<option value="tag:${t.name}">${t.name}</option>`).join('');

                    // Show dropdown, hide text input
                    refSelect.style.display = 'block';
                    branchInput.style.display = 'none';

                    statusEl.innerHTML = `<div style="color: var(--success-color);">Found ${tags.length} tag(s)</div>`;
                    utils.showToast(`Found ${tags.length} tags`);

                } catch (e) {
                    statusEl.innerHTML = `<div style="color: var(--error-color);">Failed to fetch tags: ${e.message}</div>`;
                    utils.showToast('Failed to fetch tags');
                }
            },

            async fetchReleases() {
                const urlInput = document.getElementById('github-url').value.trim();
                const refSelect = document.getElementById('github-ref-select');
                const branchInput = document.getElementById('github-branch');
                const statusEl = document.getElementById('github-status');

                if (!urlInput) {
                    utils.showToast('Please enter a GitHub URL first');
                    return;
                }

                const parsed = this.parseGithubUrl(urlInput);
                if (!parsed) {
                    utils.showToast('Invalid GitHub URL format');
                    return;
                }

                statusEl.innerHTML = '<div style="color: var(--text-muted);">Fetching releases...</div>';
                statusEl.style.display = 'block';

                try {
                    const response = await fetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}/releases`);

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const releases = await response.json();

                    if (releases.length === 0) {
                        statusEl.innerHTML = '<div style="color: var(--text-muted);">No releases found</div>';
                        return;
                    }

                    // Populate dropdown with releases and their assets
                    let options = '<option value="">Select a release...</option>';
                    releases.forEach(r => {
                        const label = r.name || r.tag_name;
                        const prerelease = r.prerelease ? ' (pre-release)' : '';
                        // Source code zip
                        options += `<option value="release-zip:${r.tag_name}">📦 ${label}${prerelease} - Source (zip)</option>`;
                        options += `<option value="release-tar:${r.tag_name}">📦 ${label}${prerelease} - Source (tar.gz)</option>`;
                        // Release assets
                        if (r.assets && r.assets.length > 0) {
                            r.assets.forEach(asset => {
                                options += `<option value="asset:${asset.browser_download_url}">📎 ${label} - ${asset.name}</option>`;
                            });
                        }
                    });

                    refSelect.innerHTML = options;

                    // Show dropdown, hide text input
                    refSelect.style.display = 'block';
                    branchInput.style.display = 'none';

                    const assetCount = releases.reduce((sum, r) => sum + (r.assets ? r.assets.length : 0), 0);
                    statusEl.innerHTML = `<div style="color: var(--success-color);">Found ${releases.length} release(s) with ${assetCount} asset(s)</div>`;
                    utils.showToast(`Found ${releases.length} releases`);

                } catch (e) {
                    statusEl.innerHTML = `<div style="color: var(--error-color);">Failed to fetch releases: ${e.message}</div>`;
                    utils.showToast('Failed to fetch releases');
                }
            }
        },

        // Network Page
        network: {
            tabs: ['dns', 'portscan', 'curl'],
            dnsServers: {
                'google': { name: 'Google', url: 'https://dns.google/resolve', ip: '8.8.8.8' },
                'cloudflare': { name: 'Cloudflare', url: 'https://cloudflare-dns.com/dns-query', ip: '1.1.1.1' },
                'quad9': { name: 'Quad9', url: 'https://dns.quad9.net:5053/dns-query', ip: '9.9.9.9' },
                'opendns': { name: 'OpenDNS', url: 'https://doh.opendns.com/dns-query', ip: '208.67.222.222' },
                'adguard': { name: 'AdGuard', url: 'https://dns.adguard.com/dns-query', ip: '94.140.14.14' },
                'custom': { name: 'Custom', url: '', ip: '' }
            },

            render(activeTab) {
                activeTab = activeTab || 'dns';
                const tabLabels = { dns: 'DNS', portscan: 'Port Scan', curl: 'Curl' };

                let content = '';
                switch (activeTab) {
                    case 'portscan':
                        content = this.renderPortScan();
                        break;
                    case 'curl':
                        content = this.renderCurl();
                        break;
                    default:
                        content = this.renderDNS();
                }

                return `
                    <div class="page-container">
                        <h1 class="page-title">Network</h1>
                        <div class="tabs">
                            ${this.tabs.map(tab => `
                                <button class="tab-btn ${tab === activeTab ? 'active' : ''}"
                                        data-tab="${tab}" onclick="pages.network.switchTab('${tab}')">
                                    ${tabLabels[tab] || tab.toUpperCase()}
                                </button>
                            `).join('')}
                        </div>
                        ${content}
                    </div>
                `;
            },

            renderDNS() {
                return `
                    <div class="card">
                        <h3 class="card-title">DNS Lookup</h3>
                        <div class="form-group">
                            <div class="label-with-actions">
                                <label class="form-label">Domain / IP Address</label>
                                <button class="btn btn-small btn-secondary" onclick="pages.network.paste()">Paste</button>
                            </div>
                            <input type="text" id="dns-input" class="form-input"
                                   placeholder="e.g., example.com or 8.8.8.8">
                        </div>
                        <div class="two-column" style="gap: 15px;">
                            <div class="form-group" style="margin-bottom: 0;">
                                <label class="form-label">Record Type</label>
                                <select id="dns-type" class="form-select">
                                    <option value="A">A (IPv4 Address)</option>
                                    <option value="AAAA">AAAA (IPv6 Address)</option>
                                    <option value="CNAME">CNAME (Canonical Name)</option>
                                    <option value="MX">MX (Mail Exchange)</option>
                                    <option value="TXT">TXT (Text Record)</option>
                                    <option value="NS">NS (Name Server)</option>
                                    <option value="SOA">SOA (Start of Authority)</option>
                                    <option value="PTR">PTR (Reverse DNS)</option>
                                </select>
                            </div>
                            <div class="form-group" style="margin-bottom: 0;">
                                <label class="form-label">DNS Server</label>
                                <select id="dns-server" class="form-select">
                                    <option value="google">Google (8.8.8.8)</option>
                                    <option value="cloudflare">Cloudflare (1.1.1.1)</option>
                                    <option value="quad9">Quad9 (9.9.9.9)</option>
                                    <option value="opendns">OpenDNS (208.67.222.222)</option>
                                    <option value="adguard">AdGuard (94.140.14.14)</option>
                                    <option value="custom">Custom...</option>
                                </select>
                            </div>
                        </div>
                        <div id="custom-dns-container" class="form-group" style="display: none; margin-top: 15px;">
                            <label class="form-label">Custom DNS Server</label>
                            <div class="two-column" style="gap: 15px;">
                                <input type="text" id="dns-custom-ip" class="form-input"
                                       placeholder="IP for commands (e.g., 8.8.8.8)">
                                <input type="text" id="dns-custom-url" class="form-input"
                                       placeholder="DoH URL (e.g., https://dns.example.com/dns-query)">
                            </div>
                            <div class="input-status" style="margin-top: 5px;">
                                Enter DoH URL for web lookup, or just IP for command generation only
                            </div>
                        </div>
                        <div class="flex gap-10 mt-20">
                            <button class="btn btn-primary network-auth-btn" id="dns-lookup-btn" onclick="pages.network.lookup()" style="display: none;">Lookup</button>
                            <button class="btn btn-secondary" onclick="pages.network.clear()">Clear</button>
                        </div>
                        <div id="dns-auth-hint" class="mt-10" style="font-size: 0.85rem; color: var(--text-muted);"></div>
                    </div>

                    <div id="dns-error" class="message message-error" style="display: none;"></div>
                    <div id="dns-loading" class="card" style="display: none;">
                        <div class="loading-container" style="min-height: 100px;">
                            <div class="loading-spinner"></div>
                            <div class="loading-text">Querying DNS...</div>
                        </div>
                    </div>

                    <div id="dns-results" class="card" style="display: none;">
                        <h3 class="card-title">Results</h3>
                        <div class="ip-result-grid" id="dns-result-grid"></div>
                    </div>

                    <div id="dns-commands" class="card">
                        <h3 class="card-title">Command Line</h3>
                        <div class="tabs" style="margin-bottom: 15px;">
                            <button class="tab-btn active" data-cmd-tab="windows" onclick="pages.network.switchCommandTab('windows')">Windows</button>
                            <button class="tab-btn" data-cmd-tab="linux" onclick="pages.network.switchCommandTab('linux')">Linux / macOS</button>
                        </div>

                        <div id="cmd-tab-windows" class="cmd-tab-content">
                            <div class="form-group">
                                <div class="label-with-actions">
                                    <label class="form-label">CMD - nslookup</label>
                                    <button class="btn btn-small btn-secondary" onclick="pages.network.copyCommand('win-nslookup')">Copy</button>
                                </div>
                                <pre id="cmd-win-nslookup" class="result-box" style="margin: 0;"></pre>
                            </div>
                            <div class="form-group" style="margin-bottom: 0;">
                                <div class="label-with-actions">
                                    <label class="form-label">PowerShell - Resolve-DnsName</label>
                                    <button class="btn btn-small btn-secondary" onclick="pages.network.copyCommand('powershell')">Copy</button>
                                </div>
                                <pre id="cmd-powershell" class="result-box" style="margin: 0;"></pre>
                            </div>
                        </div>

                        <div id="cmd-tab-linux" class="cmd-tab-content" style="display: none;">
                            <div class="form-group">
                                <div class="label-with-actions">
                                    <label class="form-label">dig</label>
                                    <button class="btn btn-small btn-secondary" onclick="pages.network.copyCommand('dig')">Copy</button>
                                </div>
                                <pre id="cmd-dig" class="result-box" style="margin: 0;"></pre>
                            </div>
                            <div class="form-group">
                                <div class="label-with-actions">
                                    <label class="form-label">host</label>
                                    <button class="btn btn-small btn-secondary" onclick="pages.network.copyCommand('host')">Copy</button>
                                </div>
                                <pre id="cmd-host" class="result-box" style="margin: 0;"></pre>
                            </div>
                            <div class="form-group" style="margin-bottom: 0;">
                                <div class="label-with-actions">
                                    <label class="form-label">nslookup</label>
                                    <button class="btn btn-small btn-secondary" onclick="pages.network.copyCommand('nslookup')">Copy</button>
                                </div>
                                <pre id="cmd-nslookup" class="result-box" style="margin: 0;"></pre>
                            </div>
                        </div>
                    </div>
                `;
            },

            async init(activeTab) {
                activeTab = activeTab || 'dns';
                switch (activeTab) {
                    case 'portscan':
                        this.initPortScan();
                        break;
                    case 'curl':
                        this.initCurl();
                        break;
                    default:
                        this.initDNS();
                }
            },

            initDNS() {
                const input = document.getElementById('dns-input');
                const typeSelect = document.getElementById('dns-type');
                const serverSelect = document.getElementById('dns-server');
                const customContainer = document.getElementById('custom-dns-container');
                const customIp = document.getElementById('dns-custom-ip');
                const customUrl = document.getElementById('dns-custom-url');

                // Load saved values
                utils.loadFromStorage('dns-input', (v) => input.value = v);
                utils.loadFromStorage('dns-type', (v) => typeSelect.value = v);
                utils.loadFromStorage('dns-server', (v) => {
                    serverSelect.value = v;
                    if (v === 'custom') customContainer.style.display = 'block';
                });
                utils.loadFromStorage('dns-custom-ip', (v) => customIp.value = v);
                utils.loadFromStorage('dns-custom-url', (v) => customUrl.value = v);

                // Save on change
                input.addEventListener('input', () => {
                    utils.saveToStorage('dns-input', input.value);
                    this.updateCommands();
                });
                typeSelect.addEventListener('change', () => {
                    utils.saveToStorage('dns-type', typeSelect.value);
                    this.updateCommands();
                });
                serverSelect.addEventListener('change', () => {
                    utils.saveToStorage('dns-server', serverSelect.value);
                    customContainer.style.display = serverSelect.value === 'custom' ? 'block' : 'none';
                    this.updateCommands();
                });
                customIp.addEventListener('input', () => {
                    utils.saveToStorage('dns-custom-ip', customIp.value);
                    this.updateCommands();
                });
                customUrl.addEventListener('input', () => utils.saveToStorage('dns-custom-url', customUrl.value));

                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter' && window.serverMode?.authenticated) this.lookup();
                });

                this.updateCommands();
                this.updateDnsAuthUI();
            },

            updateDnsAuthUI() {
                const isAuthorized = window.serverMode && window.serverMode.authenticated;
                const lookupBtn = document.getElementById('dns-lookup-btn');
                const authHint = document.getElementById('dns-auth-hint');

                if (isAuthorized) {
                    if (lookupBtn) lookupBtn.style.display = 'inline-flex';
                    if (authHint) authHint.innerHTML = '✓ <span style="color: var(--success-color);">DNS lookup enabled</span>';
                } else {
                    if (lookupBtn) lookupBtn.style.display = 'none';
                    if (authHint) authHint.innerHTML = '<span style="color: var(--primary-color);">Login</span> to perform DNS lookups.';
                }
            },

            switchTab(tab) {
                router.navigate(`/network/${tab}`);
            },

            isIP(str) {
                // Check if string is IPv4
                const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
                if (ipv4Regex.test(str)) {
                    const parts = str.split('.');
                    return parts.every(p => parseInt(p) >= 0 && parseInt(p) <= 255);
                }
                return false;
            },

            ipToReverseDNS(ip) {
                // Convert IP to reverse DNS format (PTR)
                // 8.8.8.8 -> 8.8.8.8.in-addr.arpa
                const parts = ip.split('.').reverse();
                return parts.join('.') + '.in-addr.arpa';
            },

            async lookup() {
                const input = document.getElementById('dns-input').value.trim();
                const type = document.getElementById('dns-type').value;
                const server = document.getElementById('dns-server').value;
                const errorEl = document.getElementById('dns-error');
                const loadingEl = document.getElementById('dns-loading');
                const resultsEl = document.getElementById('dns-results');
                const commandsEl = document.getElementById('dns-commands');

                if (!input) {
                    errorEl.textContent = 'Please enter a domain or IP address';
                    errorEl.style.display = 'block';
                    resultsEl.style.display = 'none';
                    return;
                }

                errorEl.style.display = 'none';
                loadingEl.style.display = 'block';
                resultsEl.style.display = 'none';

                try {
                    let queryName = input;
                    let queryType = type;

                    // Handle reverse DNS lookup
                    if (type === 'PTR' && this.isIP(input)) {
                        queryName = this.ipToReverseDNS(input);
                    } else if (this.isIP(input) && type !== 'PTR') {
                        // If user enters IP but not PTR type, suggest PTR
                        queryType = 'PTR';
                        queryName = this.ipToReverseDNS(input);
                        document.getElementById('dns-type').value = 'PTR';
                        utils.saveToStorage('dns-type', 'PTR');
                    }

                    let url, options = {};

                    if (server === 'custom') {
                        const customUrl = document.getElementById('dns-custom-url').value.trim();
                        if (!customUrl) {
                            throw new Error('Please enter a DoH URL for custom DNS server');
                        }
                        url = `${customUrl}?name=${encodeURIComponent(queryName)}&type=${queryType}`;
                        options.headers = { 'Accept': 'application/dns-json' };
                    } else if (server === 'google') {
                        url = `${this.dnsServers[server].url}?name=${encodeURIComponent(queryName)}&type=${queryType}`;
                    } else {
                        // Cloudflare, Quad9, OpenDNS, AdGuard - all use standard DoH format
                        url = `${this.dnsServers[server].url}?name=${encodeURIComponent(queryName)}&type=${queryType}`;
                        options.headers = { 'Accept': 'application/dns-json' };
                    }

                    const response = await fetch(url, options);
                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    const data = await response.json();
                    this.displayResults(data, input, queryType);
                    commandsEl.style.display = 'block';
                    this.updateCommands();

                } catch (e) {
                    errorEl.textContent = `DNS query failed: ${e.message}`;
                    errorEl.style.display = 'block';
                    resultsEl.style.display = 'none';
                } finally {
                    loadingEl.style.display = 'none';
                }
            },

            displayResults(data, originalInput, queryType) {
                const resultsEl = document.getElementById('dns-results');
                const gridEl = document.getElementById('dns-result-grid');

                // Check for errors in response
                if (data.Status !== 0) {
                    const statusMessages = {
                        1: 'Format Error',
                        2: 'Server Failure',
                        3: 'Non-Existent Domain (NXDOMAIN)',
                        4: 'Not Implemented',
                        5: 'Query Refused'
                    };
                    gridEl.innerHTML = `
                        <div class="ip-result-item" style="grid-column: 1 / -1;">
                            <div class="ip-result-label">Status</div>
                            <div class="ip-result-value" style="color: var(--error-color);">
                                ${statusMessages[data.Status] || `Error Code: ${data.Status}`}
                            </div>
                        </div>
                    `;
                    resultsEl.style.display = 'block';
                    return;
                }

                let html = `
                    <div class="ip-result-item">
                        <div class="ip-result-label">Query</div>
                        <div class="ip-result-value">${utils.escapeHtml(originalInput)}</div>
                    </div>
                    <div class="ip-result-item">
                        <div class="ip-result-label">Type</div>
                        <div class="ip-result-value">${queryType}</div>
                    </div>
                `;

                if (data.Answer && data.Answer.length > 0) {
                    data.Answer.forEach((record, idx) => {
                        let displayValue = record.data;
                        let label = `Record ${idx + 1}`;

                        // Format based on type
                        switch (queryType) {
                            case 'MX':
                                // MX records have priority
                                const mxParts = record.data.split(' ');
                                if (mxParts.length >= 2) {
                                    displayValue = `${mxParts[1]} (Priority: ${mxParts[0]})`;
                                }
                                label = `Mail Server ${idx + 1}`;
                                break;
                            case 'A':
                                label = `IPv4 Address ${idx + 1}`;
                                break;
                            case 'AAAA':
                                label = `IPv6 Address ${idx + 1}`;
                                break;
                            case 'CNAME':
                                label = 'Canonical Name';
                                break;
                            case 'TXT':
                                label = `TXT Record ${idx + 1}`;
                                // Remove surrounding quotes if present
                                displayValue = record.data.replace(/^"|"$/g, '');
                                break;
                            case 'NS':
                                label = `Name Server ${idx + 1}`;
                                break;
                            case 'PTR':
                                label = 'Hostname';
                                break;
                            case 'SOA':
                                label = 'SOA Record';
                                break;
                        }

                        html += `
                            <div class="ip-result-item">
                                <div class="ip-result-label">${label}</div>
                                <div class="ip-result-value">${utils.escapeHtml(displayValue)}</div>
                            </div>
                        `;

                        // Show TTL
                        if (record.TTL !== undefined) {
                            html += `
                                <div class="ip-result-item">
                                    <div class="ip-result-label">TTL</div>
                                    <div class="ip-result-value">${record.TTL} seconds</div>
                                </div>
                            `;
                        }
                    });
                } else {
                    html += `
                        <div class="ip-result-item" style="grid-column: 1 / -1;">
                            <div class="ip-result-label">Result</div>
                            <div class="ip-result-value" style="color: var(--text-muted);">No records found</div>
                        </div>
                    `;
                }

                // Show Authority section if present and no Answer
                if ((!data.Answer || data.Answer.length === 0) && data.Authority && data.Authority.length > 0) {
                    html += `
                        <div class="ip-result-item" style="grid-column: 1 / -1;">
                            <div class="ip-result-label">Authority</div>
                            <div class="ip-result-value">${utils.escapeHtml(data.Authority[0].data)}</div>
                        </div>
                    `;
                }

                gridEl.innerHTML = html;
                resultsEl.style.display = 'block';
            },

            switchCommandTab(tab) {
                // Update tab buttons
                document.querySelectorAll('#dns-commands .tab-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.cmdTab === tab);
                });
                // Show/hide content
                document.getElementById('cmd-tab-windows').style.display = tab === 'windows' ? 'block' : 'none';
                document.getElementById('cmd-tab-linux').style.display = tab === 'linux' ? 'block' : 'none';
            },

            updateCommands() {
                const input = document.getElementById('dns-input').value.trim();
                const type = document.getElementById('dns-type').value;
                const server = document.getElementById('dns-server').value;

                // Get DNS server IP
                let dnsServerIP;
                if (server === 'custom') {
                    dnsServerIP = document.getElementById('dns-custom-ip').value.trim() || '8.8.8.8';
                } else {
                    dnsServerIP = this.dnsServers[server].ip;
                }

                let queryName = input || 'example.com';
                let originalInput = input || 'example.com';
                if (type === 'PTR' && this.isIP(input)) {
                    queryName = this.ipToReverseDNS(input);
                }

                // PowerShell record type mapping
                const psTypeMap = {
                    'A': 'A',
                    'AAAA': 'AAAA',
                    'CNAME': 'CNAME',
                    'MX': 'MX',
                    'TXT': 'TXT',
                    'NS': 'NS',
                    'SOA': 'SOA',
                    'PTR': 'PTR'
                };

                // host command type mapping (uses different syntax)
                const hostTypeMap = {
                    'A': '',           // default
                    'AAAA': '-t AAAA',
                    'CNAME': '-t CNAME',
                    'MX': '-t MX',
                    'TXT': '-t TXT',
                    'NS': '-t NS',
                    'SOA': '-t SOA',
                    'PTR': ''          // host handles IP automatically
                };

                // === Windows Commands ===

                // Windows CMD - nslookup
                let winNslookup = `nslookup`;
                if (type !== 'A') {
                    winNslookup += ` -type=${type}`;
                }
                winNslookup += ` ${queryName} ${dnsServerIP}`;

                // Windows PowerShell - Resolve-DnsName
                let powershell = `Resolve-DnsName -Name "${queryName}" -Type ${psTypeMap[type]} -Server ${dnsServerIP}`;

                // === Linux/macOS Commands ===

                // dig command (most detailed)
                let dig = `dig @${dnsServerIP} ${queryName} ${type}`;
                // Add +short for cleaner output option
                let digShort = `dig @${dnsServerIP} ${queryName} ${type} +short`;

                // host command
                let host;
                if (type === 'PTR' && this.isIP(originalInput)) {
                    // host can do reverse lookup directly with IP
                    host = `host ${originalInput} ${dnsServerIP}`;
                } else if (hostTypeMap[type]) {
                    host = `host ${hostTypeMap[type]} ${queryName} ${dnsServerIP}`;
                } else {
                    host = `host ${queryName} ${dnsServerIP}`;
                }

                // Linux/macOS nslookup (same as Windows but shown for completeness)
                let nslookup = `nslookup`;
                if (type !== 'A') {
                    nslookup += ` -type=${type}`;
                }
                nslookup += ` ${queryName} ${dnsServerIP}`;

                // Update all command elements
                document.getElementById('cmd-win-nslookup').textContent = winNslookup;
                document.getElementById('cmd-powershell').textContent = powershell;
                document.getElementById('cmd-dig').textContent = dig;
                document.getElementById('cmd-host').textContent = host;
                document.getElementById('cmd-nslookup').textContent = nslookup;
            },

            copyCommand(cmd) {
                const el = document.getElementById(`cmd-${cmd}`);
                if (el) {
                    utils.copyToClipboard(el.textContent);
                }
            },

            async paste() {
                try {
                    const text = await navigator.clipboard.readText();
                    const input = document.getElementById('dns-input');
                    input.value = text.trim();
                    utils.saveToStorage('dns-input', input.value);
                    this.updateCommands();
                } catch (e) {
                    utils.showToast('Failed to read clipboard', 'error');
                }
            },

            clear() {
                utils.clearElements(
                    ['dns-input', 'dns-custom-ip', 'dns-custom-url'],
                    ['dns-input', 'dns-custom-ip', 'dns-custom-url']
                );
                document.getElementById('dns-type').value = 'A';
                document.getElementById('dns-server').value = 'google';
                ['custom-dns-container', 'dns-error', 'dns-results'].forEach(id => {
                    document.getElementById(id).style.display = 'none';
                });
                utils.saveToStorage('dns-type', 'A');
                utils.saveToStorage('dns-server', 'google');
                this.updateCommands();
            },

            // ==================== Port Scan ====================

            renderPortScan() {
                return `
                    <div class="card">
                        <h3 class="card-title">Port Scan Command Generator</h3>
                        <p style="color: var(--text-muted); margin-bottom: 20px; font-size: 0.9rem;">
                            Generate commands to check if ports are listening or accessible. No actual scanning is performed.
                        </p>

                        <div class="form-group">
                            <label class="form-label">Target (IP or Hostname)</label>
                            <input type="text" id="port-target" class="form-input"
                                   placeholder="e.g., 192.168.1.1, 10.0.0.0/24, example.com">
                            <div class="input-status">Supports: single IP, CIDR notation (10.0.0.0/24), IP range (10.0.0.1-10), hostname</div>
                        </div>

                        <div class="two-column" style="gap: 15px;">
                            <div class="form-group" style="margin-bottom: 0;">
                                <label class="form-label">Protocol</label>
                                <select id="port-protocol" class="form-select">
                                    <option value="tcp">TCP</option>
                                    <option value="udp">UDP</option>
                                    <option value="both">TCP + UDP</option>
                                </select>
                            </div>
                            <div class="form-group" style="margin-bottom: 0;">
                                <label class="form-label">Port(s)</label>
                                <input type="text" id="port-range" class="form-input"
                                       placeholder="e.g., 80, 22-25, 80,443,8080">
                            </div>
                        </div>

                        <div class="form-group mt-20">
                            <label class="form-label">Scan Type</label>
                            <div class="checkbox-group">
                                <label class="checkbox-label">
                                    <input type="radio" name="scan-type" value="remote" checked>
                                    Remote - Check if port is accessible from this machine
                                </label>
                                <label class="checkbox-label">
                                    <input type="radio" name="scan-type" value="local">
                                    Local - Check listening ports on local machine
                                </label>
                            </div>
                        </div>

                        <div class="flex gap-10 mt-20">
                            <button class="btn btn-secondary" onclick="pages.network.clearPortScan()">Clear</button>
                        </div>
                    </div>

                    <div id="port-commands" class="card">
                        <h3 class="card-title">Commands</h3>
                        <div class="tabs" style="margin-bottom: 15px;">
                            <button class="tab-btn active" data-port-tab="windows" onclick="pages.network.switchPortCommandTab('windows')">Windows</button>
                            <button class="tab-btn" data-port-tab="linux" onclick="pages.network.switchPortCommandTab('linux')">Linux / macOS</button>
                        </div>

                        <div id="port-tab-windows" class="port-tab-content">
                            <div id="win-remote-cmds">
                                <div class="form-group">
                                    <div class="label-with-actions">
                                        <label class="form-label">PowerShell - Test-NetConnection</label>
                                        <button class="btn btn-small btn-secondary" onclick="pages.network.copyPortCommand('ps-tnc')">Copy</button>
                                    </div>
                                    <pre id="cmd-ps-tnc" class="result-box" style="margin: 0; white-space: pre-wrap;"></pre>
                                </div>
                                <div class="form-group">
                                    <div class="label-with-actions">
                                        <label class="form-label">PowerShell - Test-Connection (TCP)</label>
                                        <button class="btn btn-small btn-secondary" onclick="pages.network.copyPortCommand('ps-tcp')">Copy</button>
                                    </div>
                                    <pre id="cmd-ps-tcp" class="result-box" style="margin: 0; white-space: pre-wrap;"></pre>
                                </div>
                            </div>
                            <div id="win-local-cmds" style="display: none;">
                                <div class="form-group">
                                    <div class="label-with-actions">
                                        <label class="form-label">CMD - netstat</label>
                                        <button class="btn btn-small btn-secondary" onclick="pages.network.copyPortCommand('win-netstat')">Copy</button>
                                    </div>
                                    <pre id="cmd-win-netstat" class="result-box" style="margin: 0; white-space: pre-wrap;"></pre>
                                </div>
                                <div class="form-group">
                                    <div class="label-with-actions">
                                        <label class="form-label">PowerShell - Get-NetTCPConnection</label>
                                        <button class="btn btn-small btn-secondary" onclick="pages.network.copyPortCommand('ps-netconn')">Copy</button>
                                    </div>
                                    <pre id="cmd-ps-netconn" class="result-box" style="margin: 0; white-space: pre-wrap;"></pre>
                                </div>
                            </div>
                        </div>

                        <div id="port-tab-linux" class="port-tab-content" style="display: none;">
                            <div id="linux-remote-cmds">
                                <div class="form-group">
                                    <div class="label-with-actions">
                                        <label class="form-label">netcat (nc)</label>
                                        <button class="btn btn-small btn-secondary" onclick="pages.network.copyPortCommand('nc')">Copy</button>
                                    </div>
                                    <pre id="cmd-nc" class="result-box" style="margin: 0; white-space: pre-wrap;"></pre>
                                </div>
                                <div class="form-group">
                                    <div class="label-with-actions">
                                        <label class="form-label">nmap</label>
                                        <button class="btn btn-small btn-secondary" onclick="pages.network.copyPortCommand('nmap')">Copy</button>
                                    </div>
                                    <pre id="cmd-nmap" class="result-box" style="margin: 0; white-space: pre-wrap;"></pre>
                                </div>
                                <div class="form-group">
                                    <div class="label-with-actions">
                                        <label class="form-label">Bash - /dev/tcp (TCP only)</label>
                                        <button class="btn btn-small btn-secondary" onclick="pages.network.copyPortCommand('bash-tcp')">Copy</button>
                                    </div>
                                    <pre id="cmd-bash-tcp" class="result-box" style="margin: 0; white-space: pre-wrap;"></pre>
                                </div>
                            </div>
                            <div id="linux-local-cmds" style="display: none;">
                                <div class="form-group">
                                    <div class="label-with-actions">
                                        <label class="form-label">ss (modern)</label>
                                        <button class="btn btn-small btn-secondary" onclick="pages.network.copyPortCommand('ss')">Copy</button>
                                    </div>
                                    <pre id="cmd-ss" class="result-box" style="margin: 0; white-space: pre-wrap;"></pre>
                                </div>
                                <div class="form-group">
                                    <div class="label-with-actions">
                                        <label class="form-label">netstat</label>
                                        <button class="btn btn-small btn-secondary" onclick="pages.network.copyPortCommand('linux-netstat')">Copy</button>
                                    </div>
                                    <pre id="cmd-linux-netstat" class="result-box" style="margin: 0; white-space: pre-wrap;"></pre>
                                </div>
                                <div class="form-group">
                                    <div class="label-with-actions">
                                        <label class="form-label">lsof</label>
                                        <button class="btn btn-small btn-secondary" onclick="pages.network.copyPortCommand('lsof')">Copy</button>
                                    </div>
                                    <pre id="cmd-lsof" class="result-box" style="margin: 0; white-space: pre-wrap;"></pre>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            },

            initPortScan() {
                const target = document.getElementById('port-target');
                const protocol = document.getElementById('port-protocol');
                const portRange = document.getElementById('port-range');
                const scanTypeRadios = document.querySelectorAll('input[name="scan-type"]');

                // Load saved values
                utils.loadFromStorage('port-target', (v) => target.value = v);
                utils.loadFromStorage('port-protocol', (v) => protocol.value = v);
                utils.loadFromStorage('port-range', (v) => portRange.value = v);
                utils.loadFromStorage('port-scan-type', (v) => {
                    scanTypeRadios.forEach(r => r.checked = r.value === v);
                });

                this.updatePortScanVisibility();

                // Event listeners
                target.addEventListener('input', () => {
                    utils.saveToStorage('port-target', target.value);
                    this.updatePortCommands();
                });
                protocol.addEventListener('change', () => {
                    utils.saveToStorage('port-protocol', protocol.value);
                    this.updatePortCommands();
                });
                portRange.addEventListener('input', () => {
                    utils.saveToStorage('port-range', portRange.value);
                    this.updatePortCommands();
                });
                scanTypeRadios.forEach(radio => {
                    radio.addEventListener('change', () => {
                        utils.saveToStorage('port-scan-type', radio.value);
                        this.updatePortScanVisibility();
                        this.updatePortCommands();
                    });
                });

                this.updatePortCommands();
            },

            switchPortCommandTab(tab) {
                document.querySelectorAll('#port-commands .tab-btn').forEach(btn => {
                    btn.classList.toggle('active', btn.dataset.portTab === tab);
                });
                document.getElementById('port-tab-windows').style.display = tab === 'windows' ? 'block' : 'none';
                document.getElementById('port-tab-linux').style.display = tab === 'linux' ? 'block' : 'none';
            },

            updatePortScanVisibility() {
                const scanType = document.querySelector('input[name="scan-type"]:checked')?.value || 'remote';
                const isRemote = scanType === 'remote';

                // Windows
                document.getElementById('win-remote-cmds').style.display = isRemote ? 'block' : 'none';
                document.getElementById('win-local-cmds').style.display = isRemote ? 'none' : 'block';

                // Linux
                document.getElementById('linux-remote-cmds').style.display = isRemote ? 'block' : 'none';
                document.getElementById('linux-local-cmds').style.display = isRemote ? 'none' : 'block';
            },

            updatePortCommands() {
                const target = document.getElementById('port-target').value.trim() || '192.168.1.1';
                const protocol = document.getElementById('port-protocol').value;
                const portRange = document.getElementById('port-range').value.trim() || '80';
                const scanType = document.querySelector('input[name="scan-type"]:checked')?.value || 'remote';

                // Parse port range for different command formats
                const ports = this.parsePortRange(portRange);
                const portList = ports.join(',');
                const firstPort = ports[0] || 80;
                const hasRange = portRange.includes('-');
                const hasMultiple = ports.length > 1;

                // Protocol flags
                const isTcp = protocol === 'tcp' || protocol === 'both';
                const isUdp = protocol === 'udp' || protocol === 'both';

                if (scanType === 'remote') {
                    // === Remote scanning commands ===

                    // PowerShell Test-NetConnection (single port only)
                    let psTnc;
                    if (hasMultiple) {
                        psTnc = `# Test multiple ports\n${ports.slice(0, 5).map(p => `Test-NetConnection -ComputerName ${target} -Port ${p}`).join('\n')}`;
                        if (ports.length > 5) psTnc += `\n# ... and ${ports.length - 5} more ports`;
                    } else {
                        psTnc = `Test-NetConnection -ComputerName ${target} -Port ${firstPort}`;
                    }

                    // PowerShell TCP Client test
                    let psTcp;
                    if (hasMultiple) {
                        psTcp = `# Test multiple ports\n@(${portList}) | ForEach-Object {\n    $port = $_\n    $tcp = New-Object System.Net.Sockets.TcpClient\n    try {\n        $tcp.Connect("${target}", $port)\n        Write-Host "Port $port is OPEN" -ForegroundColor Green\n    } catch {\n        Write-Host "Port $port is CLOSED" -ForegroundColor Red\n    } finally {\n        $tcp.Close()\n    }\n}`;
                    } else {
                        psTcp = `$tcp = New-Object System.Net.Sockets.TcpClient\ntry {\n    $tcp.Connect("${target}", ${firstPort})\n    Write-Host "Port ${firstPort} is OPEN"\n} catch {\n    Write-Host "Port ${firstPort} is CLOSED"\n} finally {\n    $tcp.Close()\n}`;
                    }

                    // netcat
                    let nc;
                    const ncProto = isUdp ? '-u ' : '';
                    if (hasRange) {
                        const rangeParts = portRange.match(/(\d+)-(\d+)/);
                        if (rangeParts) {
                            nc = `nc -zv ${ncProto}${target} ${rangeParts[1]}-${rangeParts[2]}`;
                        } else {
                            nc = `nc -zv ${ncProto}${target} ${firstPort}`;
                        }
                    } else if (hasMultiple) {
                        nc = `nc -zv ${ncProto}${target} ${portList.replace(/,/g, ' ')}`;
                    } else {
                        nc = `nc -zv ${ncProto}${target} ${firstPort}`;
                    }

                    // nmap
                    let nmapProto = '';
                    if (protocol === 'udp') nmapProto = '-sU ';
                    else if (protocol === 'both') nmapProto = '-sS -sU ';

                    let nmap = `nmap ${nmapProto}-p ${portRange.replace(/\s/g, '')} ${target}`;

                    // Bash /dev/tcp
                    let bashTcp;
                    if (hasMultiple) {
                        bashTcp = `# Test multiple ports\nfor port in ${ports.join(' ')}; do\n    (echo >/dev/tcp/${target}/$port) 2>/dev/null && echo "Port $port is OPEN" || echo "Port $port is CLOSED"\ndone`;
                    } else {
                        bashTcp = `(echo >/dev/tcp/${target}/${firstPort}) 2>/dev/null && echo "Port ${firstPort} is OPEN" || echo "Port ${firstPort} is CLOSED"`;
                    }

                    document.getElementById('cmd-ps-tnc').textContent = psTnc;
                    document.getElementById('cmd-ps-tcp').textContent = psTcp;
                    document.getElementById('cmd-nc').textContent = nc;
                    document.getElementById('cmd-nmap').textContent = nmap;
                    document.getElementById('cmd-bash-tcp').textContent = bashTcp;

                } else {
                    // === Local listening commands ===

                    // Windows netstat
                    let winNetstat = 'netstat -an';
                    if (isTcp && !isUdp) winNetstat += ' -p tcp';
                    else if (isUdp && !isTcp) winNetstat += ' -p udp';
                    winNetstat += ' | findstr "LISTENING"';
                    if (portRange && portRange !== '80') {
                        winNetstat += ` | findstr ":${firstPort}"`;
                    }

                    // PowerShell Get-NetTCPConnection
                    let psNetconn = '';
                    if (isTcp) {
                        psNetconn = `Get-NetTCPConnection -State Listen`;
                        if (portRange && portRange !== '80') {
                            psNetconn += ` | Where-Object LocalPort -eq ${firstPort}`;
                        }
                    }
                    if (isUdp) {
                        if (psNetconn) psNetconn += '\n\n# UDP:\n';
                        psNetconn += `Get-NetUDPEndpoint`;
                        if (portRange && portRange !== '80') {
                            psNetconn += ` | Where-Object LocalPort -eq ${firstPort}`;
                        }
                    }

                    // ss command
                    let ssFlags = '-ln';
                    if (isTcp && !isUdp) ssFlags += 't';
                    else if (isUdp && !isTcp) ssFlags += 'u';
                    else ssFlags += 'tu';
                    let ss = `ss ${ssFlags}`;
                    if (portRange && portRange !== '80') {
                        ss += ` | grep ":${firstPort}"`;
                    }

                    // Linux netstat
                    let linuxNetstat = 'netstat';
                    if (isTcp && !isUdp) linuxNetstat += ' -tln';
                    else if (isUdp && !isTcp) linuxNetstat += ' -uln';
                    else linuxNetstat += ' -tuln';
                    if (portRange && portRange !== '80') {
                        linuxNetstat += ` | grep ":${firstPort}"`;
                    }

                    // lsof
                    let lsof = 'lsof -i';
                    if (isTcp && !isUdp) lsof += ' -sTCP:LISTEN';
                    if (portRange && portRange !== '80') {
                        lsof += ` | grep ":${firstPort}"`;
                    }

                    document.getElementById('cmd-win-netstat').textContent = winNetstat;
                    document.getElementById('cmd-ps-netconn').textContent = psNetconn;
                    document.getElementById('cmd-ss').textContent = ss;
                    document.getElementById('cmd-linux-netstat').textContent = linuxNetstat;
                    document.getElementById('cmd-lsof').textContent = lsof;
                }
            },

            parsePortRange(input) {
                const ports = [];
                const parts = input.split(',').map(p => p.trim());

                for (const part of parts) {
                    if (part.includes('-')) {
                        const [start, end] = part.split('-').map(p => parseInt(p.trim()));
                        if (!isNaN(start) && !isNaN(end)) {
                            for (let i = start; i <= Math.min(end, start + 100); i++) {
                                ports.push(i);
                            }
                        }
                    } else {
                        const port = parseInt(part);
                        if (!isNaN(port) && port > 0 && port <= 65535) {
                            ports.push(port);
                        }
                    }
                }

                return ports.length > 0 ? ports : [80];
            },

            copyPortCommand(cmd) {
                const el = document.getElementById(`cmd-${cmd}`);
                if (el) {
                    utils.copyToClipboard(el.textContent);
                }
            },

            clearPortScan() {
                utils.clearElements(
                    ['port-target', 'port-range'],
                    ['port-target', 'port-protocol', 'port-range', 'port-scan-type']
                );
                document.getElementById('port-protocol').value = 'tcp';
                document.querySelector('input[name="scan-type"][value="remote"]').checked = true;
                this.updatePortScanVisibility();
                this.updatePortCommands();
            },

            // ==================== CURL ====================

            renderCurl() {
                return `
                    <div class="card">
                        <div class="form-group">
                            <label class="form-label">HTTP Method</label>
                            <select id="curl-method" class="form-select">
                                <option value="GET">GET</option>
                                <option value="POST">POST</option>
                                <option value="PUT">PUT</option>
                                <option value="DELETE">DELETE</option>
                                <option value="PATCH">PATCH</option>
                                <option value="HEAD">HEAD</option>
                                <option value="OPTIONS">OPTIONS</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">URL</label>
                            <input type="text" id="curl-url" class="form-input" placeholder="https://api.example.com/endpoint">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Headers</label>
                            <div id="curl-headers">
                                <div class="header-row">
                                    <input type="text" class="form-input header-key" placeholder="Header name">
                                    <input type="text" class="form-input header-value" placeholder="Header value">
                                    <button class="btn btn-secondary btn-small" onclick="pages.network.removeHeader(this)">✕</button>
                                </div>
                            </div>
                            <button class="btn btn-secondary btn-small mt-10" onclick="pages.network.addHeader()">+ Add Header</button>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Query Parameters</label>
                            <div id="curl-params">
                                <div class="header-row">
                                    <input type="text" class="form-input param-key" placeholder="Parameter name">
                                    <input type="text" class="form-input param-value" placeholder="Parameter value">
                                    <button class="btn btn-secondary btn-small" onclick="pages.network.removeParam(this)">✕</button>
                                </div>
                            </div>
                            <button class="btn btn-secondary btn-small mt-10" onclick="pages.network.addParam()">+ Add Parameter</button>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Request Body (JSON)</label>
                            <textarea id="curl-body" class="form-textarea" placeholder='{"key": "value"}'></textarea>
                        </div>
                        <div class="flex gap-10 mt-20">
                            <button class="btn btn-primary" onclick="pages.network.generateCurl()">Generate Curl</button>
                            <button class="btn btn-success network-auth-btn" id="execute-request-btn" onclick="pages.network.executeRequest()" style="display: none;">Execute Request</button>
                            <button class="btn btn-secondary" onclick="pages.network.clearCurl()">Clear</button>
                        </div>
                        <div id="curl-auth-hint" class="mt-10" style="font-size: 0.85rem; color: var(--text-muted);"></div>
                    </div>
                    <div class="card" id="curl-result-card" style="display: none;">
                        <h3 class="card-title">Generated Curl Commands</h3>
                        <div class="form-group">
                            <div class="label-with-actions">
                                <label class="form-label">Windows (CMD/PowerShell)</label>
                                <button class="btn btn-secondary btn-small" onclick="pages.network.copyCurl('windows')">Copy</button>
                            </div>
                            <pre class="result-box" id="curl-windows" style="margin: 0; white-space: pre-wrap;"></pre>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <div class="label-with-actions">
                                <label class="form-label">Linux/macOS (Bash)</label>
                                <button class="btn btn-secondary btn-small" onclick="pages.network.copyCurl('linux')">Copy</button>
                            </div>
                            <pre class="result-box" id="curl-linux" style="margin: 0; white-space: pre-wrap;"></pre>
                        </div>
                    </div>
                    <div class="card" id="curl-response-card" style="display: none;">
                        <h3 class="card-title">Response</h3>
                        <div class="form-group">
                            <label class="form-label">Status</label>
                            <div id="curl-status" class="result-box" style="max-height: 50px;"></div>
                        </div>
                        <div class="form-group" style="margin-bottom: 0;">
                            <label class="form-label">Response Body</label>
                            <pre class="result-box" id="curl-response" style="max-height: 300px; margin: 0; white-space: pre-wrap;"></pre>
                        </div>
                    </div>
                `;
            },

            initCurl() {
                const method = document.getElementById('curl-method');
                const url = document.getElementById('curl-url');
                const body = document.getElementById('curl-body');

                utils.loadFromStorage('curl-method', (v) => method.value = v);
                utils.loadFromStorage('curl-url', (v) => url.value = v);
                utils.loadFromStorage('curl-body', (v) => body.value = v);

                method.addEventListener('change', () => utils.saveToStorage('curl-method', method.value));
                url.addEventListener('input', () => utils.saveToStorage('curl-url', url.value));
                body.addEventListener('input', () => utils.saveToStorage('curl-body', body.value));

                // Auth 상태에 따른 UI 표시
                const authHint = document.getElementById('curl-auth-hint');
                const executeBtn = document.getElementById('execute-request-btn');
                const isAuthorized = window.serverMode && window.serverMode.authenticated;

                if (isAuthorized) {
                    if (executeBtn) executeBtn.style.display = 'inline-flex';
                    if (authHint) authHint.innerHTML = '✓ <span style="color: var(--success-color);">Server proxy enabled</span> - CORS restrictions bypassed';
                } else {
                    if (executeBtn) executeBtn.style.display = 'none';
                    if (authHint) authHint.innerHTML = '<span style="color: var(--primary-color);">Login</span> to execute requests via server proxy.';
                }
            },

            addHeader() {
                const container = document.getElementById('curl-headers');
                const row = document.createElement('div');
                row.className = 'header-row';
                row.innerHTML = `
                    <input type="text" class="form-input header-key" placeholder="Header name">
                    <input type="text" class="form-input header-value" placeholder="Header value">
                    <button class="btn btn-secondary btn-small" onclick="pages.network.removeHeader(this)">✕</button>
                `;
                container.appendChild(row);
            },

            removeHeader(btn) {
                const container = document.getElementById('curl-headers');
                if (container.children.length > 1) {
                    btn.parentElement.remove();
                } else {
                    btn.parentElement.querySelectorAll('input').forEach(i => i.value = '');
                }
            },

            addParam() {
                const container = document.getElementById('curl-params');
                const row = document.createElement('div');
                row.className = 'header-row';
                row.innerHTML = `
                    <input type="text" class="form-input param-key" placeholder="Parameter name">
                    <input type="text" class="form-input param-value" placeholder="Parameter value">
                    <button class="btn btn-secondary btn-small" onclick="pages.network.removeParam(this)">✕</button>
                `;
                container.appendChild(row);
            },

            removeParam(btn) {
                const container = document.getElementById('curl-params');
                if (container.children.length > 1) {
                    btn.parentElement.remove();
                } else {
                    btn.parentElement.querySelectorAll('input').forEach(i => i.value = '');
                }
            },

            generateCurl() {
                const method = document.getElementById('curl-method').value;
                let url = document.getElementById('curl-url').value.trim();
                const body = document.getElementById('curl-body').value.trim();

                if (!url) {
                    utils.showToast('Please enter a URL');
                    return;
                }

                // Collect headers
                const headers = [];
                document.querySelectorAll('#curl-headers .header-row').forEach(row => {
                    const key = row.querySelector('.header-key').value.trim();
                    const value = row.querySelector('.header-value').value.trim();
                    if (key && value) {
                        headers.push({ key, value });
                    }
                });

                // Collect params
                const params = [];
                document.querySelectorAll('#curl-params .header-row').forEach(row => {
                    const key = row.querySelector('.param-key').value.trim();
                    const value = row.querySelector('.param-value').value.trim();
                    if (key) {
                        params.push({ key, value });
                    }
                });

                // Build URL with params
                if (params.length > 0) {
                    const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
                    params.forEach(p => urlObj.searchParams.append(p.key, p.value));
                    url = urlObj.toString();
                }

                // Generate Windows curl
                let winCurl = `curl -X ${method}`;
                headers.forEach(h => {
                    winCurl += ` -H "${h.key}: ${h.value}"`;
                });
                if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
                    const escapedBody = body.replace(/"/g, '\\"');
                    winCurl += ` -d "${escapedBody}"`;
                }
                winCurl += ` "${url}"`;

                // Generate Linux curl
                let linuxCurl = `curl -X ${method}`;
                headers.forEach(h => {
                    linuxCurl += ` -H '${h.key}: ${h.value}'`;
                });
                if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
                    linuxCurl += ` -d '${body}'`;
                }
                linuxCurl += ` '${url}'`;

                document.getElementById('curl-windows').textContent = winCurl;
                document.getElementById('curl-linux').textContent = linuxCurl;
                document.getElementById('curl-result-card').style.display = 'block';

                this.generatedCurl = { windows: winCurl, linux: linuxCurl };
            },

            copyCurl(platform) {
                if (this.generatedCurl && this.generatedCurl[platform]) {
                    utils.copyToClipboard(this.generatedCurl[platform]);
                }
            },

            async executeRequest() {
                const method = document.getElementById('curl-method').value;
                let url = document.getElementById('curl-url').value.trim();
                const body = document.getElementById('curl-body').value.trim();

                if (!url) {
                    utils.showToast('Please enter a URL');
                    return;
                }

                if (!url.startsWith('http')) {
                    url = 'https://' + url;
                }

                // Collect headers
                const headers = {};
                document.querySelectorAll('#curl-headers .header-row').forEach(row => {
                    const key = row.querySelector('.header-key').value.trim();
                    const value = row.querySelector('.header-value').value.trim();
                    if (key && value) {
                        headers[key] = value;
                    }
                });

                // Collect params
                const params = [];
                document.querySelectorAll('#curl-params .header-row').forEach(row => {
                    const key = row.querySelector('.param-key').value.trim();
                    const value = row.querySelector('.param-value').value.trim();
                    if (key) {
                        params.push({ key, value });
                    }
                });

                if (params.length > 0) {
                    const urlObj = new URL(url);
                    params.forEach(p => urlObj.searchParams.append(p.key, p.value));
                    url = urlObj.toString();
                }

                const responseCard = document.getElementById('curl-response-card');
                const statusEl = document.getElementById('curl-status');
                const responseEl = document.getElementById('curl-response');

                statusEl.textContent = 'Loading...';
                statusEl.style.color = 'var(--text-color)';
                responseEl.textContent = '';
                responseCard.style.display = 'block';

                // Authorized 상태면 Backend 프록시 사용 (CORS 우회)
                const isAuthorized = window.serverMode && window.serverMode.authenticated;

                try {
                    let responseStatus, responseStatusText, responseBody, latency;

                    if (isAuthorized) {
                        // Backend API 사용
                        const apiResponse = await fetch('/api/network/http', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            credentials: 'include',
                            body: JSON.stringify({
                                url,
                                method,
                                headers,
                                body: body || undefined
                            })
                        });

                        const data = await apiResponse.json();

                        if (!apiResponse.ok || !data.success) {
                            throw new Error(data.error || 'Request failed');
                        }

                        responseStatus = data.status;
                        responseStatusText = data.statusText;
                        responseBody = data.body;
                        latency = data.latency;
                    } else {
                        // 직접 fetch (CORS 제한 있음)
                        const options = {
                            method,
                            headers,
                            mode: 'cors'
                        };

                        if (body && ['POST', 'PUT', 'PATCH'].includes(method)) {
                            options.body = body;
                            if (!headers['Content-Type']) {
                                options.headers['Content-Type'] = 'application/json';
                            }
                        }

                        const startTime = Date.now();
                        const response = await fetch(url, options);
                        latency = Date.now() - startTime;

                        responseStatus = response.status;
                        responseStatusText = response.statusText;
                        responseBody = await response.text();
                    }

                    const isOk = responseStatus >= 200 && responseStatus < 300;
                    statusEl.innerHTML = `${responseStatus} ${responseStatusText}` +
                        (latency ? ` <span style="color: var(--text-muted);">(${latency}ms)</span>` : '');
                    statusEl.style.color = isOk ? 'var(--success-color)' : 'var(--error-color)';

                    try {
                        const json = JSON.parse(responseBody);
                        responseEl.textContent = JSON.stringify(json, null, 2);
                    } catch {
                        responseEl.textContent = responseBody;
                    }
                } catch (e) {
                    statusEl.textContent = 'Error';
                    statusEl.style.color = 'var(--error-color)';
                    let errorMsg = e.message;
                    if (!isAuthorized) {
                        errorMsg += '\n\nTip: Login to bypass CORS restrictions using server proxy.';
                    }
                    responseEl.textContent = errorMsg;
                }
            },

            clearCurl() {
                document.getElementById('curl-method').value = 'GET';
                utils.clearElements(['curl-url', 'curl-body'], ['curl-method', 'curl-url', 'curl-body']);
                ['curl-result-card', 'curl-response-card'].forEach(id => {
                    document.getElementById(id).style.display = 'none';
                });

                // Reset headers to single empty row
                document.getElementById('curl-headers').innerHTML = `
                    <div class="header-row">
                        <input type="text" class="form-input header-key" placeholder="Header name">
                        <input type="text" class="form-input header-value" placeholder="Header value">
                        <button class="btn btn-secondary btn-small" onclick="pages.network.removeHeader(this)">✕</button>
                    </div>
                `;

                // Reset params to single empty row
                document.getElementById('curl-params').innerHTML = `
                    <div class="header-row">
                        <input type="text" class="form-input param-key" placeholder="Parameter name">
                        <input type="text" class="form-input param-value" placeholder="Parameter value">
                        <button class="btn btn-secondary btn-small" onclick="pages.network.removeParam(this)">✕</button>
                    </div>
                `;

                this.generatedCurl = null;
            }
        }
    };

    // Make pages available globally for onclick handlers
    window.pages = pages;

    // Sidebar Toggle
    document.getElementById('sidebarToggle').addEventListener('click', () => {
        document.querySelector('.sidebar').classList.toggle('open');
    });

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        const sidebar = document.querySelector('.sidebar');
        const toggle = document.getElementById('sidebarToggle');
        if (window.innerWidth <= 768 &&
            !sidebar.contains(e.target) &&
            !toggle.contains(e.target) &&
            sidebar.classList.contains('open')) {
            sidebar.classList.remove('open');
        }
    });

    // Close sidebar when clicking nav-link on mobile
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                document.querySelector('.sidebar').classList.remove('open');
            }
        });
    });

    // Sidebar Collapse (Desktop)
    const collapseBtn = document.getElementById('sidebarCollapseBtn');
    const updateCollapseButton = (collapsed) => {
        collapseBtn.title = collapsed ? '사이드바 펼치기' : '사이드바 접기';
    };

    collapseBtn.addEventListener('click', () => {
        const sidebar = document.querySelector('.sidebar');
        const isCollapsed = sidebar.classList.toggle('collapsed');
        document.body.classList.toggle('sidebar-collapsed', isCollapsed);
        utils.saveToStorage('sidebarCollapsed', isCollapsed);
        updateCollapseButton(isCollapsed);
    });

    // Restore sidebar state on load (desktop only)
    if (window.innerWidth > 768) {
        utils.loadFromStorage('sidebarCollapsed', (saved) => {
            if (saved === 'true') {
                document.querySelector('.sidebar').classList.add('collapsed');
                document.body.classList.add('sidebar-collapsed');
                updateCollapseButton(true);
            }
        });
    }

    // Library Status Functions (global)
    window.showLibraryStatus = function() {
        const modal = document.createElement('div');
        modal.className = 'library-modal';
        modal.id = 'library-modal';

        const status = libraryLoader.getStatus();
        let itemsHtml = '';
        Object.entries(status).forEach(([key, info]) => {
            let icon, statusClass, statusText;
            if (info.loading) {
                icon = '⏳';
                statusClass = 'loading';
                statusText = '로딩 중...';
            } else if (info.loaded) {
                icon = '✓';
                statusClass = 'loaded';
                statusText = '외부 라이브러리';
            } else {
                icon = '⚠';
                statusClass = 'builtin';
                statusText = '내장 기능';
            }
            itemsHtml += `
                <div class="library-item">
                    <span class="library-status-icon">${icon}</span>
                    <span class="library-name">${info.name}</span>
                    <span class="library-status ${statusClass}">${statusText}</span>
                </div>
            `;
        });

        modal.innerHTML = `
            <div class="library-modal-content">
                <h3 class="library-modal-title">라이브러리 상태</h3>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 15px;">
                    라이브러리는 해당 기능 사용 시 자동으로 로드됩니다.
                </p>
                ${itemsHtml}
                <button class="btn btn-primary library-modal-close" onclick="closeLibraryModal()">닫기</button>
            </div>
        `;

        document.body.appendChild(modal);
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeLibraryModal();
        });
    };

    window.closeLibraryModal = function() {
        const modal = document.getElementById('library-modal');
        if (modal) modal.remove();
    };


    // Initialize Theme Manager
    themeManager.init();

    // Initialize Server Mode
    serverMode.init();

    // Initialize Router
    router.init();

    // Preload libraries in background after page loads
    setTimeout(() => {
        libraryLoader.preloadAll();
    }, 1000);
})();
