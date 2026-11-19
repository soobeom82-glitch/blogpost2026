# Operator's Log

실제 사업 운영에서 겪은 사건, 비용, 대응과 판단을 인터뷰 형식으로 기록하는 블로그입니다. Next.js App Router와 MDX를 사용하며 Vercel 배포를 위한 설정을 포함합니다.

## 현재 구성

- 주차장 운영 연재 13편, 공매 가이드 4편, 운영노트 2편, 여행·생활 기록 1편: 총 20편
- 주차장·무인카페 카테고리, 주제별 운영노트, 관련 글·연재 이동
- `/personal` 여행·생활 기록: 사업 글 목록·추천·RSS와 별도 분류
- 조회수, 좋아요, 공유, 댓글·답글과 비밀번호 수정·삭제, 운영자 삭제
- PostgreSQL 저장, 로컬 개발용 JSON 저장
- Telegram 조회·좋아요·답글 알림, 매일 오전 7시 KST 전날 리포트
- RSS, 사이트맵, robots, canonical·구조화 데이터, AdSense 연결

무인카페는 카테고리와 소재만 준비돼 있습니다. 기존 경험 인터뷰 없이 글을 만들어 채우지 않습니다. 글에 언급된 세금계산서 자동화 도구는 별도 업무 도구이며 이 블로그의 기능이 아닙니다.

## 로컬 실행

Node 22 이상을 사용합니다. `.nvmrc`는 22로 지정돼 있습니다.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

`DATABASE_URL`이 비어 있으면 로컬 JSON을 사용합니다. Vercel에서는 DB가 필수이며 JSON 저장으로 전환하지 않습니다. 환경변수와 배포 절차는 [DEPLOY.md](./DEPLOY.md)를 확인하세요.

## 구조

```text
app/             페이지, 참여 API, 일일 리포트, 검색·광고 관련 경로
components/      글 카드, 댓글, 참여 버튼, 공유
lib/             저장, 검증·요청 제한, 비밀번호, 글 분류, Telegram
content/posts/   MDX 원문과 자동 생성되는 index.js
public/          이미지와 사이트 소유권 확인 파일
scripts/         글 등록 목록 생성 및 콘텐츠 검증
tests/          단위·저장소·PostgreSQL·브라우저 회귀 테스트
docs/           인터뷰, 백로그, 검색 등록, 유지보수 기록
skills/          프로젝트 전용 인터뷰 글쓰기 지침
```

## 새 글 발행

1. `content/posts/`에 MDX를 작성합니다.
2. 제목·요약·날짜·사업 카테고리·운영 주제를 메타데이터에 넣습니다.
3. 연재이면 `series`, `seriesOrder`, `seriesType`을 명시합니다.
4. `npm run content:generate`를 실행합니다. 수동으로 `index.js`를 편집하지 않습니다.
5. `npm run check`와 `npm run build`를 통과시킵니다.
6. 원문·이미지·생성 목록을 함께 커밋합니다. 연결된 배포 프로젝트에 푸시하면 배포가 시작됩니다.

```mdx
export const metadata = {
  title: "글 제목",
  publishedAt: "2026-11-18",
  category: "무인카페",
  primaryCategory: "cafe",
  topics: ["issue"],
  summary: "한 줄 요약"
};
```

사업 카테고리와 주제 값은 `lib/post-taxonomy.js`에 있습니다. 독립 글에는 연재 필드를 넣지 않습니다. 연재 순서는 발행일이나 파일 등록 순서가 아닌 `seriesOrder`로 결정됩니다. `dev`·`build` 실행 전에도 등록 목록을 자동 생성합니다.

여행·생활 후기는 `section: "personal"`, `primaryCategory: "travel"`, `category: "여행·생활 기록"`을 지정합니다. `section`이 없으면 기존 사업 글로 취급합니다. 개인 기록에는 인터뷰나 연재 형식을 강제하지 않으며, 현재 사업 RSS(`/feed.xml`)에는 포함하지 않습니다.

## 검증

```sh
npm run check         # 글·이미지·연재·링크 검사, Biome, 파일 저장소 회귀 테스트
npm run build
npx playwright install chromium
npm run test:e2e      # 로컬 서버·임시 JSON으로 실제 브라우저/API 검증
npm run test:outage   # DB 연결 장애 시 본문 유지·오류 응답 검증
```

별도 PostgreSQL 테스트 DB가 있으면 다음을 실행합니다. 운영 DB를 사용하면 안 됩니다. 테스트 DB 이름은 `_test`로 끝나야 합니다.

```sh
TEST_DATABASE_URL=postgres://user:password@localhost:5432/operators_log_test npm run test:db
```

GitHub Actions는 PostgreSQL 17 서비스와 Chromium으로 위 검사를 실행합니다. 브라우저 테스트에는 실제 Telegram 토큰을 전달하지 않습니다.

## 콘텐츠 원칙

- 실제 경험을 기반으로 하며 AI는 질문·구조화·초안 작성에 사용합니다.
- 한 글에는 한 사건 또는 밀접한 판단 흐름을 담습니다.
- 상황 → 대응 → 결과와 비용 → 다시 한다면 바꿀 점을 기록합니다.
- 인터뷰는 한 번에 한 질문씩 진행하고, 초안 작성 전에 사진·문서·영수증 유무를 확인합니다.
- 사용자 경험이나 수치를 추정하여 만들어내지 않습니다.

[콘텐츠 백로그](./docs/content-backlog.md) · [인터뷰 방식](./docs/interview-workflow.md) · [검색 등록](./docs/search-console-checklist.md) · [유지보수 현황](./docs/maintenance.md)
