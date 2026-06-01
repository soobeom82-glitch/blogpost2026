# Google Search Console 체크리스트

이 문서는 `Operator's Log`를 Google Search Console에 등록하고, 새 글이 빠르게
수집되도록 관리할 때 쓰는 실무 체크리스트다.

공식 참고 문서:

- [Add a website property to Search Console](https://support.google.com/webmasters/answer/34592?hl=en)
- [Verify your site ownership](https://support.google.com/webmasters/answer/9008080?hl=en)
- [Top tasks for Search Console users](https://support.google.com/webmasters/answer/10351509?hl=en)
- [URL Inspection tool](https://support.google.com/webmasters/answer/9012289?hl=en&lang=en)

## 1. 속성 추가

- Search Console에서 사이트 속성을 추가한다.
- 이 프로젝트는 `https://blogpost2026.vercel.app` 또는 실제 연결 도메인 기준으로
  등록한다.
- 도메인 전체를 보려면 `Domain property`, 현재 주소만 빠르게 쓰려면
  `URL-prefix property`를 선택한다.

메모:

- Google 공식 문서 기준으로 `Domain property`는 DNS 검증이 필요하다.
- `URL-prefix property`는 HTML 태그 검증도 가능하다.

## 2. 소유권 검증

현재 프로젝트는 두 가지 방식에 맞춰 준비돼 있다.

### 방법 A. HTML 태그 검증

- Search Console이 주는 `google-site-verification` 값을 복사한다.
- Vercel 환경변수 `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`에 넣는다.
- 재배포한다.
- 다시 Search Console에서 `Verify`를 누른다.

이 방식은 Google 공식 문서 기준으로 홈페이지의 `<head>`에 메타 태그를 넣을 수
있어야 한다.

### 방법 B. DNS 검증

- 실제 커스텀 도메인을 붙였다면 DNS TXT 또는 CNAME 레코드로 검증할 수 있다.
- Domain property를 쓸 때는 이 방식이 기본이다.

## 3. 사이트맵 제출

이 프로젝트는 이미 다음을 제공한다.

- `/sitemap.xml`
- `/robots.txt`
- `/feed.xml`

Search Console의 `Sitemaps` 메뉴에서 아래를 제출한다.

- `https://도메인/sitemap.xml`

Google 공식 문서 기준으로 많은 페이지를 수집시키는 가장 좋은 방법은 사이트맵
제출이다.

## 4. 새 글 발행 후 할 일

새 글을 발행한 뒤에는 아래 순서로 확인한다.

1. 글 URL이 실제로 열리는지 확인
2. `View Source`로 `title`, `description`, canonical이 맞는지 확인
3. Search Console `URL Inspection`에서 해당 URL 검사
4. 문제가 없으면 `Request indexing`

Google 공식 문서 기준으로 단일 페이지의 빠른 재수집은 URL Inspection의
`Request indexing`이 가장 단순하다.

## 5. 인덱싱이 잘 안 될 때 우선 점검

- canonical이 다른 주소로 잘못 잡히지 않았는가
- robots에 막히지 않았는가
- 글 내용이 너무 짧거나 중복되지 않는가
- 발행 직후라 Google이 아직 수집하지 않은 상태는 아닌가
- 새 글이 홈, 카테고리, 이전/다음글 링크에서 연결되어 있는가

## 6. 이 프로젝트 기준 운영 체크

- `NEXT_PUBLIC_SITE_URL`이 실제 도메인과 맞아야 한다.
- 새 글은 홈 목록과 카테고리 페이지에서 링크되어야 한다.
- 글 제목은 검색어 의도가 보이게 쓴다.
- 사진, 숫자, 대응 순서를 넣어서 `얇은 글`로 보이지 않게 만든다.
- 댓글은 정책 위반 시 바로 정리한다.

## 7. 발행 후 모니터링

Search Console에서 먼저 볼 항목:

- `Performance`
- `Page indexing`
- `Sitemaps`
- `URL Inspection`

특히 초반에는 아래를 본다.

- 어떤 검색어로 처음 노출되는지
- 노출은 되는데 클릭이 안 나는 제목이 무엇인지
- 수집은 됐는데 색인 제외되는 URL이 있는지

## 8. 이 프로젝트의 현재 준비 상태

이미 반영된 것:

- canonical 메타
- Open Graph / Twitter 메타
- `WebSite` / `BlogPosting` 구조화 데이터
- `sitemap.xml`
- `robots.txt`
- `feed.xml`
- 소개 / 문의 / 개인정보처리방침 페이지

남은 실사용 입력값:

- `NEXT_PUBLIC_SITE_URL`
- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
- `NEXT_PUBLIC_CONTACT_EMAIL`

실제 운영 도메인을 붙인 뒤 위 세 값을 채우고 재배포하면 Search Console 등록
준비는 끝난다.
