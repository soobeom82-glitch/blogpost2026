# 배포 및 운영

## 설치와 배포

1. Node 22 이상에서 `npm ci`를 실행합니다.
2. `.env.example`을 참고해 Vercel 환경변수를 설정합니다.
3. PostgreSQL을 연결합니다. 기존 DB를 사용한다면 변경 전 백업을 확보합니다.
4. `npm run check`, `npm run build`, `npm run test:e2e` 결과를 확인합니다.
5. GitHub 저장소를 Vercel 프로젝트에 연결하고 배포합니다.
6. 실제 도메인·문의 페이지·검색 메타데이터·참여 기능을 확인합니다.

## 환경변수

| 변수 | 용도 |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | 실제 운영 사이트 URL. 끝의 `/`는 생략합니다. |
| `DATABASE_URL` | Vercel에서 필수. `POSTGRES_URL`, `POSTGRES_PRISMA_URL`도 지원합니다. |
| `ENGAGEMENT_SECRET` | 운영 환경에서 필수. 최소 32자의 임의 비밀 문자열이며 방문자 쿠키 서명과 요청 제한 키 생성에 사용합니다. |
| `CRON_SECRET` | 일일 리포트 활성화 시 필수. Vercel이 `Authorization: Bearer ...`로 전달합니다. |
| `NEXT_PUBLIC_CONTACT_EMAIL` | 공개 문의 이메일 |
| `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` | Search Console HTML 태그 인증값. 선택 사항입니다. |
| `NEXT_PUBLIC_ADSENSE_CLIENT` | 광고 연결 시 설정. `ca-pub-...` 형식입니다. |
| `COMMENT_ADMIN_PASSWORD` | 운영자 댓글 삭제 기능을 사용할 때 설정합니다. |
| `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | Telegram 알림과 리포트를 사용할 때 함께 설정합니다. |

비밀값은 저장소에 넣지 않습니다. 개발·Preview·Production 환경의 값은 별도로 관리합니다. Preview에서 운영 DB나 실제 알림 채널을 공유하지 마세요. `.env*`는 Git에서 제외하며 예제 파일만 추적합니다.

## 저장 방식과 기존 데이터

- PostgreSQL 환경변수 중 하나라도 있으면 해당 DB를 사용합니다.
- Vercel에서 DB가 없거나 연결에 실패해도 로컬 JSON으로 데이터를 저장하지 않습니다. API는 503을 반환하고 글 본문은 계속 표시합니다.
- 스키마는 서버의 첫 DB 접근에서 잠금 아래 생성·확장합니다. 런타임 DB 사용자에게 관련 테이블 생성·변경 권한이 필요합니다.
- 기존 통계·댓글·이미 발송한 리포트 기록을 보존하는 추가 방식의 마이그레이션입니다.
- 기존 SHA-256 댓글 비밀번호는 계속 검증되며, 수정에 성공하면 솔트를 포함한 scrypt로 갱신됩니다.
- 새 좋아요는 서명된 익명 브라우저 쿠키별로 한 번만 반영됩니다. 기존 누적 좋아요에는 사용자 식별값이 없으므로 과거 숫자는 유지하며 소급 재계산하지 않습니다.
- 쿠키 삭제·다른 브라우저는 새 방문자로 취급됩니다. 익명 방식이므로 사람 한 명당 한 번이라는 보장은 없습니다.
- 로컬 JSON은 파일 잠금과 원자적 교체로 동시 쓰기를 보호합니다. 단일 호스트의 개발·테스트용이며 여러 서버의 공유 저장소가 아닙니다.

## 요청 제한과 통계 기준

- Vercel에서는 플랫폼이 덮어쓰는 `x-vercel-forwarded-for`를 이용하고 IP 원문 대신 HMAC 키를 저장합니다. 임의 `X-Forwarded-For`는 신뢰하지 않습니다.
- Vercel 밖에서는 공유 제한 키를 사용합니다. 자체 호스팅 시 신뢰할 프록시의 IP 전달·덮어쓰기 정책을 별도로 구성해야 합니다.
- 읽기·조회수: 분당 120회, 좋아요: 분당 30회, 댓글 작성: 10분당 10회, 수정·삭제: 10분당 20회입니다. 제한 시 429와 `Retry-After`를 반환합니다.
- 조회수는 익명 브라우저별·글별·한국 날짜별 1회입니다. 고유 방문자 수나 전체 사이트 세션 수는 아닙니다.
- 리포트 좋아요는 해당 날짜의 좋아요 추가 횟수이며 취소를 차감한 순증가가 아닙니다. 댓글 수는 집계 시점에 남아 있는 당일 작성 댓글입니다.

## 일일 리포트

`vercel.json`의 `0 22 * * *`는 한국 시간 오전 7시입니다. 전날 00:00~24:00 KST를 집계합니다.

- `/api/cron/daily-report`: 인증 후 실제 발송, 날짜별 중복 실행 방지
- `/api/cron/daily-report?preview=1`: 인증 후 JSON 미리보기만 반환. Telegram을 보내거나 발송 기록을 바꾸지 않습니다.
- `CRON_SECRET` 미설정은 503, 잘못된 인증은 401입니다.
- 발송 중 기록에 5분 임대 시간을 두어 프로세스 종료 후 재시도할 수 있습니다. 명시적 실패는 해당 실행의 기록만 해제합니다.
- Telegram 수신 직후 DB 완료 기록에 실패하는 경우 중복 메시지가 발생할 수 있습니다. 외부 발송과 DB를 단일 트랜잭션으로 묶을 수 없으므로 정확히 한 번 발송을 보장하지 않습니다.

로컬 또는 승인된 운영 점검에서 비밀값을 URL에 넣지 않고 헤더로 전달합니다. 이 URL은 브라우저에서 무심코 열어 발송을 시험하는 용도로 사용하지 않습니다.

## 새 글

현재 발행 목록은 사업 글 19편과 여행·생활 기록 1편, 총 20편입니다. `content/posts/*.mdx` 작성 후 `npm run content:generate`를 실행합니다. 필수 메타데이터, 연재 중복 순서, 이미지·글 링크를 검사하고 `index.js`를 생성합니다. 전체 예시는 README를 참고하세요.

## 배포 후 확인

- 본문, 모바일, 연재 이동, 운영노트 주제 필터
- 좋아요 후 새로고침, 댓글·답글 및 비밀번호 수정·삭제
- DB 장애 시 본문 유지와 참여 기능 오류 안내
- `/sitemap.xml`, `/robots.txt`, `/feed.xml`, 페이지별 canonical
- 공개 문의 이메일과 광고 사용에 맞는 개인정보 안내
- Search Console 소유권·사이트맵 제출 및 AdSense 승인 여부는 각 서비스에서 별도로 확인

공식 문서: [Vercel Cron 보안](https://vercel.com/docs/cron-jobs/manage-cron-jobs) · [Next.js MDX](https://nextjs.org/docs/app/guides/mdx)
