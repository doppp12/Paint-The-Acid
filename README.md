# Paint The Acid — 홈페이지

슬라임으로 물드는 게이밍 기어 브랜드 **Paint The Acid**의 홈페이지입니다. (Vite + React)

## 화면 구성
- **홈** — VIPER × JOKER 콜라보 배너, 주요 기능, 드림 셋업, New Arrivals, 둘러보기
- **상품 상세** — 스펙, 상세 설명, 리뷰(시안용 예시), 문의, 배송/교환/반품 안내
- **장바구니 → 주문/결제 → 주문완료** (무통장입금 흐름)
- **SLIME TURF WAR** — 5라운드 캔버스 땅따먹기 게임, 클리어 시 쿠폰/증정품 보상
- **커뮤니티(고객센터·FAQ)**, **콜라보레이션**

장바구니와 쿠폰은 브라우저 `localStorage`에 저장됩니다.

## 실행
```bash
npm install
npm run dev      # 개발 서버
npm run build    # dist/ 에 정적 빌드
```

## 구조
```
index.html            폰트·메타
src/main.jsx          진입점
src/App.jsx           화면 로직 + 마크업
src/data.js           상품·리뷰·FAQ·결제수단 데이터
src/game/turfWar.js   TURF WAR 게임 엔진 (canvas)
src/styles.css        전역 스타일
public/assets/        이미지
```

> `src/data.js`의 `BANK_ACCOUNT`는 예시 값입니다. 실제 입금 계좌로 바꿔 주세요.
