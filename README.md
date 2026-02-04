# Online Tools

개발자를 위한 다양한 유틸리티 도구를 제공하는 웹 애플리케이션입니다. 순수 클라이언트 사이드로 동작하며, 빌드 시스템 없이 바로 사용할 수 있습니다.

## 특징

- **오프라인 지원**: 대부분의 기능이 오프라인에서도 동작
- **빌드 불필요**: HTML 파일을 직접 열거나 정적 서버로 실행
- **다크/라이트 테마**: 사용자 선호에 따른 테마 전환
- **상태 저장**: localStorage를 통한 입력 값 자동 저장
- **반응형 디자인**: 모바일 및 데스크톱 지원

## 도구 목록

### Viewer
마크업 언어 미리보기

| 탭 | 설명 |
|---|---|
| Markdown | Markdown 문서 실시간 렌더링 |
| Textile | Textile 문서 실시간 렌더링 |

### String
문자열 처리 도구

| 탭 | 설명 |
|---|---|
| Counter | 문자 수, 단어 수, 줄 수, 바이트 크기 계산 |
| Search/Replace | 텍스트 검색 및 치환 (정규식 지원) |
| Compare | 두 텍스트 비교 (diff) |

### Formatter
코드 포맷터

| 탭 | 설명 |
|---|---|
| JSON | JSON 정렬 및 포맷팅, 오류 위치 표시 |
| YAML | YAML 포맷팅 |
| JavaScript | JavaScript 코드 정렬 |

### Encoding
인코딩/디코딩 도구

| 탭 | 설명 |
|---|---|
| Base64 | Base64 인코딩/디코딩 |
| URL | URL 인코딩/디코딩 |

### Converter
단위 변환기

| 탭 | 설명 |
|---|---|
| Radix | 진수 변환 (2진수, 8진수, 10진수, 16진수) |
| Byte | 데이터 크기 변환 (Bit, Byte, KB, MB, GB, TB) |

### Encrypt
암호화 및 인증서 도구

| 탭 | 설명 |
|---|---|
| Hash | 해시 생성 (MD5, SHA-1, SHA-256, SHA-512) |
| Certificate | PEM 인증서 파싱 및 정보 표시, 인증서 조회 명령어 생성 |

### Calculator
계산기

| 기능 | 설명 |
|---|---|
| IP Calculator | IP 주소 및 서브넷 계산 (CIDR, 네트워크 주소, 브로드캐스트 등) |

### Generator
생성기

| 기능 | 설명 |
|---|---|
| UUID | UUID v4 생성 (다중 생성 지원) |

### Command
명령어 생성기

| 탭 | 설명 |
|---|---|
| Windows | Windows 시스템 명령어 모음 |

### Downloader
다운로드 도구

| 탭 | 설명 |
|---|---|
| HTML | HTML에서 미디어 URL 추출 (이미지, 비디오, 오디오, PDF) |
| GitHub | GitHub 저장소 다운로드 링크 생성 |

### Network
네트워크 도구

| 탭 | 설명 |
|---|---|
| DNS | DNS 조회 (다양한 DNS 서버 지원: Google, Cloudflare, Quad9 등) |
| Port Scan | 포트 스캔 명령어 생성 (nmap, netcat, PowerShell 등) |
| CURL | cURL 명령어 생성기 (헤더, 파라미터, 바디 지원) |

## 실행 방법

### 방법 1: 직접 열기
`index.html` 파일을 브라우저에서 직접 열기

> 일부 기능(ES 모듈이 필요한 외부 라이브러리)은 로컬 서버 사용 시 더 잘 동작합니다.

### 방법 2: 로컬 서버 실행
```bash
# Python 3
python -m http.server 8080

# Node.js (npx)
npx serve

# PHP
php -S localhost:8080
```
브라우저에서 `http://localhost:8080` 접속

## 프로젝트 구조

```
online-tools/
├── index.html      # 메인 HTML (사이드바 네비게이션)
├── app.js          # 전체 애플리케이션 로직 (IIFE)
├── styles.css      # 스타일시트 (다크/라이트 테마)
├── CLAUDE.md       # Claude Code 가이드
└── README.md       # 이 파일
```

## 기술 스택

- **프론트엔드**: Vanilla JavaScript (ES6+)
- **스타일**: CSS3 (Custom Properties, Flexbox, Grid)
- **라우팅**: Hash-based SPA 라우팅
- **저장소**: localStorage

### 외부 라이브러리 (CDN)
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

## 브라우저 지원

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## 라이선스

MIT License
