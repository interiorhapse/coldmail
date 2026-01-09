# ColdMail 크롤러

기업 정보 자동 수집 모듈

## 설치

```bash
cd C:\Projects\coldmail\scripts\crawler
pip install -r requirements.txt
```

## 사용법

### 수동 실행
```bash
# 전체 소스에서 수집
python main.py

# 특정 소스만
python main.py --source saramin

# 수집 한도 지정
python main.py --limit 100

# 키워드 지정
python main.py --keywords AI 스타트업 마케팅
```

### 자동 실행 (Windows 작업 스케줄러)

1. Windows 검색에서 "작업 스케줄러" 실행
2. "작업 만들기" 클릭
3. 설정:
   - 이름: ColdMail 크롤러
   - 트리거: 매일 02:00
   - 동작: `C:\Projects\coldmail\scripts\crawler\run_crawler.bat`

## 폴더 구조

```
crawler/
├── config.py           # 설정
├── main.py             # 메인 실행
├── requirements.txt    # 의존성
├── run_crawler.bat     # 자동 실행용 배치
│
├── sources/            # 수집 소스
│   ├── saramin.py      # 사람인
│   ├── rocketpunch.py  # 로켓펀치 (예정)
│   └── wanted.py       # 원티드 (예정)
│
├── parser/
│   └── ai_parser.py    # AI 연락처 추출
│
├── storage/
│   └── supabase_client.py  # DB 저장
│
└── logs/               # 실행 로그
```

## 수집 흐름

1. 사람인/로켓펀치/원티드에서 기업 목록 수집
2. 각 기업 상세 페이지 크롤링
3. 기업 웹사이트 추가 크롤링 (연락처 페이지, 푸터 등)
4. AI (Gemini)가 텍스트에서 연락처 추출
5. Supabase companies 테이블에 저장
