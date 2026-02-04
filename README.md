# Online Tools

개발자를 위한 다양한 유틸리티 도구를 제공하는 웹 애플리케이션입니다. 두 가지 모드로 실행 가능합니다:

- **Guest 모드**: 순수 클라이언트 사이드로 동작, 빌드 시스템 없이 바로 사용
- **Authorized 모드**: nginx + Node.js 백엔드 서버 배포, 추가 기능 사용 가능

## 특징

- **오프라인 지원**: 대부분의 기능이 오프라인에서도 동작 (Guest 모드)
- **빌드 불필요**: HTML 파일을 직접 열거나 정적 서버로 실행
- **다크/라이트 테마**: 사용자 선호에 따른 테마 전환
- **상태 저장**: localStorage를 통한 입력 값 자동 저장
- **반응형 디자인**: 모바일 및 데스크톱 지원
- **서버 기능**: 인증 후 CORS 우회, SSL 인증서 조회, DNS 조회 등 추가 기능

## 도구 목록

| 카테고리 | 탭 | 설명 |
|---------|-----|------|
| Viewer | Markdown | Markdown 문서 실시간 렌더링 |
| | Textile | Textile 문서 실시간 렌더링 |
| String | Counter | 문자 수, 단어 수, 줄 수, 바이트 크기 계산 |
| | Search/Replace | 텍스트 검색 및 치환 (정규식 지원) |
| | Compare | 두 텍스트 비교 (diff) |
| Formatter | JSON | JSON 정렬 및 포맷팅, 오류 위치 표시 |
| | YAML | YAML 포맷팅 |
| | JavaScript | JavaScript 코드 정렬 |
| Encoding | Base64 | Base64 인코딩/디코딩 |
| | URL | URL 인코딩/디코딩 |
| Converter | Radix | 진수 변환 (2, 8, 10, 16진수) |
| | Byte | 데이터 크기 변환 (Bit ~ TB) |
| Encrypt | Hash | 해시 생성 (MD5, SHA-1, SHA-256, SHA-512) |
| | Certificate | PEM 파싱, 인증서 조회 명령어, **URL 조회 (Auth)** |
| Calculator | IP | IP/서브넷 계산 (CIDR, 네트워크, 브로드캐스트) |
| Generator | UUID | UUID v4 생성 (다중 생성 지원) |
| Command | Windows | Windows 시스템 명령어 모음 |
| Downloader | HTML | 미디어 URL 추출, **파일 다운로드 (Auth)** |
| | GitHub | GitHub 저장소 다운로드 링크 생성 |
| Network | IP | 공인 IP 조회 명령어, **IP 조회 (Auth)** |
| | DNS | DNS 조회 명령어, **Lookup 실행 (Auth)** |
| | HTTP | **HTTP 요청 실행 (Auth)** |
| | CURL | cURL 명령어 생성, **요청 실행 (Auth)** |
| | Port Scan | 포트 스캔 명령어 생성 (nmap, netcat 등) |

> **(Auth)** 표시된 기능은 Authorized 모드에서만 사용 가능

## 실행 방법

### 방법 1: Guest 모드 (직접 열기)
`index.html` 파일을 브라우저에서 직접 열기

> 일부 기능(ES 모듈이 필요한 외부 라이브러리)은 로컬 서버 사용 시 더 잘 동작합니다.

### 방법 2: Guest 모드 (로컬 서버)
```bash
# Python 3
python -m http.server 8080

# Node.js (npx)
npx serve

# PHP
php -S localhost:8080
```
브라우저에서 `http://localhost:8080` 접속

### 방법 3: Authorized 모드 (서버 배포)
nginx + Node.js 백엔드 서버 배포로 추가 기능을 사용할 수 있습니다.

```bash
# 1. .htpasswd 파일 생성
htpasswd -c nginx/.htpasswd username

# 2. 백엔드 서버 실행
cd backend && npm install && npm start

# 3. nginx 설정 후 실행
# nginx/nginx.conf 참고
```

로그인 후 추가 기능을 사용할 수 있습니다:
- SSL 인증서 URL 조회
- 파일 다운로드 (CORS 우회)
- DNS Lookup 실행
- HTTP 요청 실행
- cURL 요청 실행

## 프로젝트 구조

```
online-tools/
├── index.html          # 메인 HTML (사이드바 네비게이션, 인증 UI)
├── app.js              # 전체 애플리케이션 로직 (IIFE, serverMode 포함)
├── styles.css          # 스타일시트 (다크/라이트 테마)
├── CLAUDE.md           # Claude Code 가이드
├── README.md           # 이 파일
│
├── backend/            # Node.js 백엔드 (Authorized 모드)
│   ├── server.js       # Express API 서버
│   └── package.json    # Node.js 의존성
│
└── nginx/              # nginx 설정 (Authorized 모드)
    ├── nginx.conf      # nginx 설정 파일
    └── .htpasswd       # Basic Auth 인증 파일
```

## 기술 스택

### 프론트엔드
- **JavaScript**: Vanilla JavaScript (ES6+)
- **스타일**: CSS3 (Custom Properties, Flexbox, Grid)
- **라우팅**: Hash-based SPA 라우팅
- **저장소**: localStorage, sessionStorage

### 백엔드 (Authorized 모드)
- **웹서버**: nginx (Basic Auth, Reverse Proxy)
- **API 서버**: Node.js + Express
- **보안**: nginx Basic Auth (.htpasswd)

### 백엔드 API
| 엔드포인트 | 메서드 | 설명 |
|-----------|--------|------|
| `/api/auth/check` | GET | 인증 상태 확인 |
| `/api/auth/login` | GET | Basic Auth 트리거 |
| `/api/auth/logout` | GET | 로그아웃 (401 반환) |
| `/api/cert/fetch` | POST | SSL 인증서 조회 |
| `/api/download` | GET | 파일 다운로드 프록시 |
| `/api/network/dns` | POST | DNS 조회 |
| `/api/network/http` | POST | HTTP 요청 프록시 |
| `/api/proxy` | POST | 범용 API 프록시 |
| `/api/execute` | POST | JavaScript 코드 실행 (샌드박스) |

### 프론트엔드 라이브러리 (CDN)
라이브러리는 필요 시 동적으로 로드되며, 로드 실패 시 내장 기능으로 대체됩니다.

- [marked.js](https://marked.js.org/) - Markdown 파싱
- [highlight.js](https://highlightjs.org/) - 코드 하이라이팅
- [diff_match_patch](https://github.com/google/diff-match-patch) - 텍스트 비교
- [js-yaml](https://github.com/nodeca/js-yaml) - YAML 파싱
- [vkbeautify](https://github.com/nickyout/vkBeautify) - XML/SQL 포맷팅
- [sql-formatter](https://github.com/sql-formatter-org/sql-formatter) - SQL 포맷팅
- [crypto-js](https://github.com/brix/crypto-js) - 암호화 함수
- [textile-js](https://github.com/borgar/textile-js) - Textile 파싱
- [js-beautify](https://github.com/beautifier/js-beautify) - JavaScript 포맷팅
- [node-forge](https://github.com/digitalbazaar/forge) - 인증서 파싱

### 백엔드 라이브러리 (npm)
- [express](https://expressjs.com/) - 웹 프레임워크
- [node-fetch](https://github.com/node-fetch/node-fetch) - HTTP 클라이언트
- [vm2](https://github.com/patriksimek/vm2) - JavaScript 샌드박스

## Guest vs Authorized 기능 비교

| 기능 | Guest | Authorized |
|------|:-----:|:----------:|
| 모든 클라이언트 도구 | ✅ | ✅ |
| Encrypt/Cert: PEM 파싱 | ✅ | ✅ |
| Encrypt/Cert: URL에서 인증서 조회 | ❌ | ✅ |
| Downloader/HTML: 링크 추출 | ✅ | ✅ |
| Downloader/HTML: 파일 다운로드 | ❌ | ✅ |
| Network/Curl: 명령어 생성 | ✅ | ✅ |
| Network/Curl: 요청 실행 | ❌ | ✅ |
| Network/DNS: 명령어 생성 | ✅ | ✅ |
| Network/DNS: Lookup 실행 | ❌ | ✅ |
| Network/HTTP: 요청 실행 | ❌ | ✅ |
| Network/Port Scan: 명령어 생성 | ✅ | ✅ |

## 브라우저 지원

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 라이선스

MIT License
