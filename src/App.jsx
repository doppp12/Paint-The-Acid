import React from 'react';
import { TurfWar, TurfConfetti } from './game/turfWar.js';
import {
  ROUND_INFO, RIVALS, STORE_KEY, CART_KEY, GIFT_KEY, PRODUCTS, DETAILS, REVIEWS,
  GIFT, PAY_METHODS, BANK_ACCOUNT, won, FAQS,
} from './data.js';

export default class App extends React.Component {
  state = { view: 'home', round: 1, hud: { time: 30, my: 0, enemy: 0, warn: false, warnLeft: 3, warnPct: 0 }, modal: null, result: { my: 0, enemy: 0, stall: false }, coupons: [], toast: '', cart: [], co: { name: '', phone: '', addr: '', addr2: '', method: 'bank', depositor: '', cardNo: '', exp: '', cvc: '', birth: '', saveCard: false }, coErr: '', paying: false, order: null, pendingOrder: null };

  componentDidMount() {
    this.setState({ coupons: this.loadCoupons(), cart: this.loadCart() });
    let pending = false;
    try { pending = localStorage.getItem(GIFT_KEY) === '1'; localStorage.removeItem(GIFT_KEY); } catch (e) {}
    if (pending) setTimeout(() => this.flyGift(), 350);
  }
  loadCart() { try { const s = localStorage.getItem(CART_KEY); if (s) return JSON.parse(s); } catch (e) {} return window.__ptaCart || []; }
  saveCart(cart) { window.__ptaCart = cart; try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) {} this.setState({ cart }); }
  addToCart(p, n = 1) {
    const cart = this.state.cart.slice(), i = cart.findIndex(x => x.id === p.id);
    if (i >= 0) { if (!p.gift) cart[i] = { ...cart[i], qty: cart[i].qty + n }; }
    else cart.push({ ...p, qty: p.gift ? 1 : n, checked: true });
    this.saveCart(cart);
    requestAnimationFrame(() => this.bumpBadge());
  }
  bumpBadge() {
    const b = this.badgeEl; if (!b || !b.animate) return;
    b.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.6)' }, { transform: 'scale(1)' }], { duration: 380, easing: 'cubic-bezier(.3,1.6,.5,1)' });
  }
  flyGift() {
    const target = this.cartBtnEl;
    const done = () => { this.addToCart(GIFT); this.showToast('슬라임 증정품이 장바구니에 담겼습니다!'); };
    if (!target || !document.body.animate) return done();
    const r = target.getBoundingClientRect(), size = Math.min(260, window.innerWidth * 0.6);
    const img = document.createElement('img');
    img.src = GIFT.img; img.alt = '';
    Object.assign(img.style, { position: 'fixed', zIndex: 90, width: size + 'px', height: size + 'px', left: (window.innerWidth - size) / 2 + 'px', top: (window.innerHeight - size) / 2 + 'px', objectFit: 'cover', borderRadius: '24px', border: '3px solid #8CFF00', pointerEvents: 'none' });
    document.body.appendChild(img);
    const dx = r.left + r.width / 2 - window.innerWidth / 2, dy = r.top + r.height / 2 - window.innerHeight / 2;
    const a = img.animate([
      { transform: 'translate(0,0) scale(0)', opacity: 0, borderRadius: '24px' },
      { transform: 'translate(0,0) scale(1.08)', opacity: 1, offset: 0.22 },
      { transform: 'translate(0,0) scale(1)', opacity: 1, offset: 0.34 },
      { transform: 'translate(0,0) scale(1)', opacity: 1, offset: 0.5, borderRadius: '24px' },
      { transform: `translate(${dx}px,${dy}px) scale(0.06)`, opacity: 0.9, borderRadius: '50%' },
    ], { duration: 1700, easing: 'cubic-bezier(.55,0,.75,.4)', fill: 'forwards' });
    a.onfinish = () => { img.remove(); done(); };
  }
  cartBtnRef = el => { this.cartBtnEl = el; };
  cartBadgeRef = el => { this.badgeEl = el; };
  popImgRef = el => { if (el && el.animate) el.animate([{ transform: 'scale(0) rotate(-12deg)', opacity: 0 }, { transform: 'scale(1.15) rotate(3deg)', opacity: 1, offset: 0.6 }, { transform: 'scale(1) rotate(0)' }], { duration: 560, easing: 'cubic-bezier(.3,1.4,.5,1)' }); };
  popTextRef = el => { if (el && el.animate) el.animate([{ transform: 'scale(0.3)', opacity: 0 }, { transform: 'scale(0.3)', opacity: 0, offset: 0.45 }, { transform: 'scale(1.2)', opacity: 1, offset: 0.8 }, { transform: 'scale(1)' }], { duration: 780, easing: 'ease-out' }); };
  componentWillUnmount() { this.engine && this.engine.destroy(); this.stopConfetti && this.stopConfetti(); clearTimeout(this.toastT); }

  loadCoupons() {
    try { const s = localStorage.getItem(STORE_KEY); if (s) return JSON.parse(s); } catch (e) {}
    return window.__ptaCoupons || [];
  }
  saveCoupons(list) {
    window.__ptaCoupons = list;
    try { localStorage.setItem(STORE_KEY, JSON.stringify(list)); } catch (e) {}
    this.setState({ coupons: list });
  }

  canvasRef = el => {
    if (el) {
      const init = () => {
        if (!el.isConnected || this.engine) return;
        
        this.engine = new TurfWar(el, { onHud: hud => this.setState({ hud }), onEnd: r => this.onEnd(r) });
        this.engine.start(this.state.round);
      };
      init();
    } else if (this.engine) { this.engine.destroy(); this.engine = null; }
  };
  confettiRef = el => {
    if (el) { this.stopConfetti = TurfConfetti(el); }
    else if (this.stopConfetti) { this.stopConfetti(); this.stopConfetti = null; }
  };

  onEnd(r) {
    const modal = r.win ? (this.state.round >= 5 ? 'clear' : 'win') : 'lose';
    this.setState({ modal, result: r });
  }
  startRound(n) {
    this.setState({ round: n, modal: null, hud: { time: 0, my: 0, enemy: 0, warn: false, warnLeft: 3, warnPct: 0 } }, () => this.engine && this.engine.start(n));
  }
  goGame() {
    window.scrollTo(0, 0);
    if (this.state.view === 'game') { if (this.state.modal === 'mypage') this.closeMyPage(); return; }
    this.setState({ view: 'game', round: 1, modal: null });
  }
  spinRef = el => { if (el && el.animate) el.animate([{ transform: 'rotate(0)' }, { transform: 'rotate(360deg)' }], { duration: 800, iterations: Infinity }); };
  setCo(k, v) { this.setState(s => ({ co: { ...s.co, [k]: v }, coErr: '' })); }
  goCheckout() { if (!this.state.cart.some(x => x.checked)) return; window.scrollTo(0, 0); this.setState({ view: 'checkout', coErr: '' }); }
  pay(checked, sum, methodLabel) {
    const c = this.state.co, digits = v => v.replace(/\D/g, '');
    let err = '';
    if (!c.name.trim()) err = '받는 분 이름을 입력해 주세요.';
    else if (digits(c.phone).length < 10) err = '연락처를 정확히 입력해 주세요.';
    else if (!c.addr.trim()) err = '배송 주소를 입력해 주세요.';
    else if (c.method === 'card') {
      if (digits(c.cardNo).length < 15) err = '카드 번호를 정확히 입력해 주세요.';
      else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(c.exp)) err = '유효기간을 MM/YY 형식으로 입력해 주세요.';
      else if (digits(c.cvc).length !== 3) err = 'CVC 3자리를 입력해 주세요.';
      else if (digits(c.birth).length !== 6) err = '생년월일 6자리를 입력해 주세요.';
    }
    if (err) return this.setState({ coErr: err });
    if (c.method === 'bank') {
      const d0 = new Date(), due = new Date(d0.getTime() + 864e5);
      const fmt = x => x.getFullYear() + '.' + String(x.getMonth() + 1).padStart(2, '0') + '.' + String(x.getDate()).padStart(2, '0') + ' ' + String(x.getHours()).padStart(2, '0') + ':' + String(x.getMinutes()).padStart(2, '0');
      const no0 = 'PTA-' + d0.getFullYear() + String(d0.getMonth() + 1).padStart(2, '0') + String(d0.getDate()).padStart(2, '0') + '-' + String(Math.floor(Math.random() * 9000) + 1000);
      const extra0 = checked.length - 1;
      return this.setState({ modal: 'bank', pendingOrder: { no: no0, total: sum.total, method: '무통장입금', due: fmt(due), depositor: c.depositor.trim() || c.name.trim(), addr: c.addr + (c.addr2 ? ' ' + c.addr2 : ''), summary: checked[0].name + (extra0 ? ' 외 ' + extra0 + '건' : '') } });
    }
    this.setState({ paying: true });
    const d = new Date(), no = 'PTA-' + d.getFullYear() + String(d.getMonth() + 1).padStart(2, '0') + String(d.getDate()).padStart(2, '0') + '-' + String(Math.floor(Math.random() * 9000) + 1000);
    const first = checked[0], extra = checked.length - 1;
    const order = { no, total: sum.total, method: c.method === 'card' ? methodLabel + ' (' + c.cardNo.slice(-4) + ')' : methodLabel, addr: c.addr + (c.addr2 ? ' ' + c.addr2 : ''), summary: first.name + (extra ? ' 외 ' + extra + '건' : '') };
    setTimeout(() => {
      this.saveCart(this.state.cart.filter(y => !y.checked));
      window.scrollTo(0, 0);
      this.setState(s => ({ paying: false, view: 'done', order, co: { ...s.co, cardNo: s.co.saveCard ? s.co.cardNo : '', cvc: '', exp: s.co.saveCard ? s.co.exp : '' } }));
    }, 1400);
  }
  confirmBank() {
    const order = this.state.pendingOrder; if (!order) return;
    this.saveCart(this.state.cart.filter(y => !y.checked));
    window.scrollTo(0, 0);
    this.setState({ modal: null, pendingOrder: null, view: 'done', order });
  }
  copyAccount() {
    const t = BANK_ACCOUNT.bank + ' ' + BANK_ACCOUNT.number + ' ' + BANK_ACCOUNT.holder;
    const ok = () => this.showToast('계좌번호가 복사되었습니다');
    try { navigator.clipboard.writeText(t).then(ok, ok); } catch (e) { ok(); }
  }
  goCart() { window.scrollTo(0, 0); this.setState({ view: 'cart', modal: null }); }
  goCollab() { window.scrollTo(0, 0); this.setState({ view: 'collab', modal: null }); }
  goProduct(id) { window.scrollTo(0, 0); this.setState({ view: 'product', pid: id, qty: 1, modal: null }); }
  goHome(id) {
    this.setState({ view: 'home', modal: null }, () => {
      const el = id && document.getElementById(id);
      window.scrollTo({ top: el ? el.getBoundingClientRect().top + window.scrollY : 0, behavior: el ? 'smooth' : 'auto' });
    });
  }
  openMyPage() {
    if (this.state.modal === 'mypage') return;
    this.prevModal = this.state.modal;
    this.engine && this.engine.pause();
    this.setState({ modal: 'mypage' });
  }
  closeMyPage() {
    const back = this.prevModal || null; this.prevModal = null;
    this.setState({ modal: back }, () => { if (!back && this.engine) this.engine.resume(); });
  }
  showToast(msg) {
    clearTimeout(this.toastT);
    this.setState({ toast: msg });
    this.toastT = setTimeout(() => this.setState({ toast: '' }), 2200);
  }
  today() { const d = new Date(); return d.getFullYear() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + String(d.getDate()).padStart(2, '0'); }

  renderVals() {
    const s = this.state, prevent = fn => e => { e && e.preventDefault && e.preventDefault(); fn(); };
    const [roundTitle, roundDesc] = ROUND_INFO[s.round];
    const products = PRODUCTS.map(p => ({
      ...p, price: '₩' + p.price.toLocaleString('en-US'), buyLabel: p.name + ' 구매하기', addLabel: p.name + ' 장바구니 담기',
      onAdd: () => { this.addToCart(p); this.showToast(p.name + ' 장바구니에 담겼습니다'); },
      onBuy: () => { this.addToCart(p); this.goCart(); },
      href: '#product-' + p.id, onOpen: prevent(() => this.goProduct(p.id)), openLabel: p.name + ' 상세 보기',
    }));
    const curP = PRODUCTS.find(x => x.id === s.pid) || PRODUCTS[0], curD = DETAILS[curP.id], qty = s.qty || 1;
    const pd = {
      ...curP, ...curD, price: '₩' + curP.price.toLocaleString('en-US'), total: '₩' + (curP.price * qty).toLocaleString('en-US'),
      qty, qtyLabel: '수량 ' + qty + '개', ship: curP.price * qty >= 50000 ? '무료배송' : '배송비 3,000원 (5만원 이상 무료)',
      pointList: curD.points.map(([t, d], i) => ({ t, d, n: '0' + (i + 1) })),
      specList: curD.specs.map(([k, v]) => ({ k, v })),
      dec: () => this.setState({ qty: Math.max(1, qty - 1) }), inc: () => this.setState({ qty: Math.min(99, qty + 1) }),
      onAdd: () => { this.addToCart(curP, qty); this.showToast(curP.name + ' ' + qty + '개를 장바구니에 담았습니다'); },
      onBuy: () => { this.addToCart(curP, qty); this.goCart(); },
    };
    pd.code = 'PTA-' + curP.id.toUpperCase() + '-2611';
    pd.point = Math.round(curP.price * qty * 0.01).toLocaleString('en-US') + 'P';
    pd.wish = () => this.showToast(curP.name + ' 관심상품에 담았습니다');
    pd.ask = () => this.showToast('상품 문의는 준비 중입니다. 고객센터(0321-****)로 문의해 주세요.');
    pd.review = () => this.showToast('리뷰는 구매 후 작성할 수 있습니다.');
    const rv = REVIEWS[curP.id];
    pd.reviewCount = rv.count.toLocaleString('en-US');
    pd.avg = rv.avg.toFixed(1);
    pd.avgStars = '★'.repeat(Math.round(rv.avg)) + '☆'.repeat(5 - Math.round(rv.avg));
    pd.dist = [[5, 0.86], [4, 0.10], [3, 0.03], [2, 0.007], [1, 0.003]].map(([n, r]) => ({ label: n + '점', w: (r * 100).toFixed(1) + '%', n: Math.round(rv.count * r).toLocaleString('en-US') }));
    pd.reviews = rv.list.map(([who, star, date, text]) => ({ who, date, text, stars: '★'.repeat(star) + '☆'.repeat(5 - star), starLabel: '별점 5점 중 ' + star + '점' }));
    pd.moreReviews = () => this.showToast('시안에서는 최근 리뷰 5개만 보여 드려요.');
    const toSec = id => () => { const el = document.getElementById(id); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 70, behavior: 'smooth' }); };
    pd.tabs = [['상품정보', 'pd-info'], ['상품리뷰 (' + pd.reviewCount + ')', 'pd-review'], ['상품문의 (0)', 'pd-qna'], ['배송/교환/반품', 'pd-ship']].map(([label, id]) => ({ label, go: toSec(id) }));
    const related = products.filter(x => x.id !== curP.id).slice(0, 4);
    const cart = s.cart, setCart = fn => this.saveCart(this.state.cart.map(fn).filter(Boolean));
    const cartCount = cart.reduce((n, x) => n + x.qty, 0);
    const checked = cart.filter(x => x.checked);
    const allChecked = cart.length > 0 && checked.length === cart.length;
    const subtotal = checked.reduce((n, x) => n + x.price * x.qty, 0);
    const ship = subtotal === 0 || subtotal >= 50000 ? 0 : 3000;
    const cartItems = cart.map((x, i) => ({
      ...x, divider: i ? '1px solid #1E1B25' : '0', canQty: !x.gift,
      option: x.gift ? 'TURF WAR 5라운드 클리어 보상 · 수량 1개' : '수량 ' + x.qty + '개 · 개당 ' + won(x.price),
      lineLabel: x.gift ? '0원' : won(x.price * x.qty),
      boxBorder: x.checked ? '#8CFF00' : '#4A4652', boxBg: x.checked ? '#8CFF00' : 'transparent',
      checkLabel: x.name + ' 선택', removeLabel: x.name + ' 삭제',
      onToggle: () => setCart(y => y.id === x.id ? { ...y, checked: !y.checked } : y),
      onInc: () => setCart(y => y.id === x.id ? { ...y, qty: y.qty + 1 } : y),
      onDec: () => setCart(y => y.id === x.id ? { ...y, qty: Math.max(1, y.qty - 1) } : y),
      onRemove: () => setCart(y => y.id === x.id ? null : y),
    }));
    const icons = ['Pad', 'Cart', 'Drop', 'Star'];
    const features = [
      { title: 'Play & Earn', desc: '게임을 플레이하고 보상을 받으세요' },
      { title: 'Shop Gears', desc: '슬라임 테마의 게이밍 제품' },
      { title: 'Collect Slime', desc: '플레이, 구매로 슬라임을 수집' },
      { title: 'Rank & Challenge', desc: '다른 유저와 랭킹을 경쟁하세요' },
    ].map((f, i) => ({ ...f, divider: i ? '1px solid #3A3840' : '0', ['is' + icons[i]]: true }));

    const myPts = Math.round(s.result.my * 100 + (s.round - 1) * 1500);
    const myTier = s.round >= 5 ? 'Acid Master' : s.round >= 3 ? 'Spray Legend' : 'Drip Rookie';
    const rows = RIVALS.map(([name, tier, pct, pts]) => ({ name, tier, pct, pts, me: false }));
    rows.push({ name: 'YOU', tier: myTier, pct: s.result.my, pts: myPts, me: true });
    rows.sort((a, b) => b.pts - a.pts || (a.me ? 1 : -1));
    const board = rows.map((r, i) => ({
      ...r, rank: i + 1, ptsLabel: r.pts.toLocaleString('en-US'),
      bg: r.me ? 'rgba(140,255,0,0.12)' : 'transparent', color: r.me ? '#8CFF00' : '#F5F5F5', weight: r.me ? 700 : 500,
    }));
    const myRank = board.find(r => r.me).rank;

    const available = s.coupons.filter(c => !c.used).length;
    const couponList = s.coupons.map(c => ({
      ...c, status: c.used ? '사용 완료' : '사용 가능', btnLabel: c.used ? '사용 완료' : '사용하기',
      btnBg: c.used ? '#2A2830' : '#8CFF00', btnColor: c.used ? '#8C8A94' : '#0A0A0A', cursor: c.used ? 'default' : 'pointer',
      border: c.used ? '#2A2830' : 'rgba(140,255,0,0.45)', opacity: c.used ? 0.7 : 1,
      onUse: () => {
        if (c.used) return;
        this.saveCoupons(this.state.coupons.map(x => x.id === c.id ? { ...x, used: true } : x));
        this.showToast('쿠폰이 적용되었습니다!');
      },
    }));

    const reload = () => location.reload();
    const notices = {
      couponDone: { title: '쿠폰 발급 완료', body: '쿠폰이 마이페이지에 발급되었습니다! 새로고침 후 확인해 주세요.', label: '새로고침', action: reload },
      giftDone: { title: '슬라임 실물 증정품', body: '증정품 수령은 고객센터(1588-SLIME)로 문의하세요.', label: '확인', action: () => this.setState({ modal: 'reload' }) },
      reload: { title: '새로고침 안내', body: '보상 선택이 완료되었습니다. 새로고침 후 다시 이용해 주세요.', label: '새로고침', action: reload },
    };

    return {
      isHome: s.view === 'home', isGame: s.view === 'game', isCart: s.view === 'cart',
      cartBtnRef: this.cartBtnRef, cartBadgeRef: this.cartBadgeRef, popImgRef: this.popImgRef, popTextRef: this.popTextRef,
      hasCart: cartCount > 0, cartCount, cartLabel: '장바구니 (' + cartCount + '개)',
      goCart: () => this.goCart(), cartItems, cartEmpty: cart.length === 0, itemCount: cart.length, checkedCount: checked.length,
      allChecked, allBox: { border: allChecked ? '#8CFF00' : '#4A4652', bg: allChecked ? '#8CFF00' : 'transparent' },
      toggleAll: () => this.saveCart(this.state.cart.map(y => ({ ...y, checked: !allChecked }))),
      removeChecked: () => this.saveCart(this.state.cart.filter(y => !y.checked)),
      sum: { subtotal: won(subtotal), gift: checked.some(x => x.gift) ? '슬라임 1개' : '없음', ship: ship ? won(ship) : '무료', total: won(subtotal + ship) },
      orderDisabled: checked.length === 0, orderBg: checked.length ? '#8CFF00' : '#2A2830', orderColor: checked.length ? '#0A0A0A' : '#8C8A94',
      goOrder: () => this.goCheckout(),
      isCheckout: s.view === 'checkout', isDone: s.view === 'done', isCollab: s.view === 'collab', isCommunity: s.view === 'community', faqs: FAQS,
      isProduct: s.view === 'product', pd, related,
      shelf: [
        { title: 'VIPER 컬렉션', desc: '독을 품은 연두빛 콜라보 세트', img: 'assets/collab/viper-set.jpg', pos: '30% 60%', alt: 'Paint The Acid × VIPER 키보드·마우스·헤드셋 세트', href: '#collab', go: prevent(() => this.goCollab()) },
        { title: 'JOKER 컬렉션', desc: '혼돈을 부르는 보라빛 콜라보 세트', img: 'assets/collab/joker-set.jpg', pos: '70% 60%', alt: 'Paint The Acid × JOKER 키보드·마우스·헤드셋 세트', href: '#collab', go: prevent(() => this.goCollab()) },
        { title: 'SLIME GAMING HEADSET', desc: '슬라임처럼 감싸는 몰입 사운드', img: 'assets/products/headset-v2.png', pos: '50% 50%', alt: 'Slime Gaming Headset', href: '#product-headset', go: prevent(() => this.goProduct('headset')) },
        { title: 'ACID RGB KEYBOARD', desc: '산성 빛으로 물드는 타건감', img: 'assets/products/keyboard-v2.jpg', pos: '50% 50%', alt: 'Acid RGB Keyboard', href: '#product-keyboard', go: prevent(() => this.goProduct('keyboard')) },
        { title: 'TOXIC GAMING MOUSE', desc: '독하게 정확한 컨트롤', img: 'assets/products/mouse-v2.jpg', pos: '50% 50%', alt: 'Toxic Gaming Mouse', href: '#product-mouse', go: prevent(() => this.goProduct('mouse')) },
      ],
      guides: [
        { title: '슬라임 땅따먹기 게임하고 쿠폰 받기', img: 'assets/collab/turf-war-thumb.jpg', pos: '50% 50%', href: '#turf-war', go: prevent(() => this.goGame()) },
        { title: 'Paint The Acid 콜라보', img: 'assets/collab/collab-thumb.jpg', pos: '50% 50%', href: '#collab', go: prevent(() => this.goCollab()) },
        { title: '드림 셋업 가이드', img: 'assets/collab/dream-guide-thumb.jpg', pos: '50% 50%', href: '#dream-setup', go: prevent(() => this.goHome('dream-setup')) },
        { title: '고객센터 · 자주 묻는 질문', img: 'assets/collab/support-thumb.jpg', pos: '50% 50%', href: '#community', go: prevent(() => { window.scrollTo(0, 0); this.setState({ view: 'community', modal: null }); }) },
      ],
      onNavCommunity: prevent(() => { window.scrollTo(0, 0); this.setState({ view: 'community', modal: null }); }),
      contacts: [
        { tag: 'CALL', title: '고객센터 0321-****', desc: '평일 10:00 – 18:00 전화 상담 (임시 번호)', go: () => this.showToast('고객센터 번호는 임시 번호입니다: 0321-****') },
        { tag: 'OPEN CHAT', title: '카카오톡 오픈채팅', desc: '오픈채팅방에서 편하게 문의하세요', go: () => this.showToast('오픈채팅 링크는 준비 중입니다.') },
        { tag: 'AI CHATBOT', title: 'AI 챗봇 상담', desc: '24시간 언제든 바로 답변해 드려요', go: () => this.showToast('AI 챗봇은 준비 중입니다.') },
      ],
      onNavCollab: prevent(() => this.goCollab()),
      scrollCollab: () => { const el = document.getElementById('collab-showcase'); if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY, behavior: 'smooth' }); },
      steps: ['장바구니', '주문/결제', '주문완료'].map((label, i) => {
        const cur = { cart: 0, checkout: 1, done: 2 }[s.view] ?? 0, on = i === cur, past = i < cur;
        return { label, n: past ? '✓' : String(i + 1), notFirst: i > 0, current: on ? 'step' : 'false', color: on ? '#8CFF00' : past ? '#F5F5F5' : '#BDBDC4', weight: on ? 700 : 500, ring: on || past ? '#8CFF00' : '#3A3742', bg: on ? '#8CFF00' : 'transparent', numColor: on ? '#0A0A0A' : past ? '#8CFF00' : '#BDBDC4' };
      }),
      orderLines: checked.map(x => ({ ...x, sub: x.gift ? 'TURF WAR 증정품' : '수량 ' + x.qty + '개', lineLabel: x.gift ? '0원' : won(x.price * x.qty) })),
      co: s.co, coErr: s.coErr, hasCoErr: !!s.coErr, paying: s.paying, spinRef: this.spinRef,
      order: s.order || { no: '', total: '', method: '', addr: '', summary: '', due: '' },
      bank: BANK_ACCOUNT, copyAccount: () => this.copyAccount(), mBank: s.modal === 'bank',
      pendingOrder: s.pendingOrder || { total: '', depositor: '', due: '' },
      closeBank: () => this.setState({ modal: null, pendingOrder: null }), confirmBank: () => this.confirmBank(),
      depositorHint: s.co.name ? s.co.name + ' (미입력 시 받는 분 이름)' : '입금하실 분 이름',
      f: {
        name: e => this.setCo('name', e.target.value), depositor: e => this.setCo('depositor', e.target.value),
        phone: e => { const d = e.target.value.replace(/\D/g, '').slice(0, 11); this.setCo('phone', d.length > 7 ? d.slice(0, 3) + '-' + d.slice(3, d.length - 4) + '-' + d.slice(-4) : d.length > 3 ? d.slice(0, 3) + '-' + d.slice(3) : d); },
        addr: e => this.setCo('addr', e.target.value), addr2: e => this.setCo('addr2', e.target.value),
        cardNo: e => this.setCo('cardNo', e.target.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')),
        exp: e => { const d = e.target.value.replace(/\D/g, '').slice(0, 4); this.setCo('exp', d.length > 2 ? d.slice(0, 2) + '/' + d.slice(2) : d); },
        cvc: e => this.setCo('cvc', e.target.value.replace(/\D/g, '').slice(0, 3)),
        birth: e => this.setCo('birth', e.target.value.replace(/\D/g, '').slice(0, 6)),
      },
      toggleSaveCard: () => this.setCo('saveCard', !s.co.saveCard),
      saveBox: { border: s.co.saveCard ? '#8CFF00' : '#4A4652', bg: s.co.saveCard ? '#8CFF00' : 'transparent' },
      payMethods: PAY_METHODS.map(m => { const on = s.co.method === m.id; return { ...m, on, disabled: !!m.disabled, pick: () => { if (!m.disabled) this.setCo('method', m.id); }, border: on ? '2px solid #8CFF00' : '1px solid #3A3742', bg: on ? 'rgba(140,255,0,0.08)' : 'transparent', weight: on ? 700 : 500, cursor: m.disabled ? 'not-allowed' : 'pointer', opacity: m.disabled ? 0.4 : 1 }; }),
      isCard: s.co.method === 'card', isBank: s.co.method === 'bank', isEasy: ['kakao', 'naver', 'toss'].includes(s.co.method),
      methodLabel: PAY_METHODS.find(m => m.id === s.co.method).label,
      payLabel: s.co.method === 'bank' ? won(subtotal + ship) + ' 주문하기 (무통장입금)' : won(subtotal + ship) + ' 결제하기',
      pay: () => this.pay(checked, { total: won(subtotal + ship) }, PAY_METHODS.find(m => m.id === this.state.co.method).label),
      mGift: s.modal === 'giftPop',
      giftReload: () => { try { localStorage.setItem(GIFT_KEY, '1'); } catch (e) { this.setState({ modal: null }); this.flyGift(); return; } location.reload(); },
      products, features, round: s.round, roundTitle, roundDesc,
      hud: s.hud, myW: s.hud.my + '%', aiW: s.hud.enemy + '%', warnW: Math.round((1 - s.hud.warnPct) * 100) + '%',
      result: s.result, myPtsLabel: myPts.toLocaleString('en-US'), myRank, board,
      loseSub: s.result.stall ? 'WARNING: 점령 정체로 게임 오버!' : '점령 실패! 최상위 플레이어 점유율 리스트를 확인하고 재도전하세요.',
      loseSubColor: s.result.stall ? '#FF3B3B' : '#BDBDC4',
      mWin: s.modal === 'win', mLose: s.modal === 'lose', mClear: s.modal === 'clear', mMy: s.modal === 'mypage',
      mNotice: !!notices[s.modal], notice: notices[s.modal] || notices.reload,
      hasCoupons: available > 0, couponCount: available, myPageLabel: '마이페이지 쿠폰함 (사용 가능 쿠폰 ' + available + '개)',
      noCoupons: s.coupons.length === 0, couponList,
      hasToast: !!s.toast, toast: s.toast,
      canvasRef: this.canvasRef, confettiRef: this.confettiRef,
      onLogo: prevent(() => this.goHome()), onNavProducts: prevent(() => this.goHome('products')), onNavGame: prevent(() => this.goGame()),
      openMyPage: () => this.openMyPage(), closeMyPage: () => this.closeMyPage(),
      goGameFromMy: () => { this.prevModal = null; this.state.view === 'game' ? this.startRound(this.state.round) : this.goGame(); },
      retry: () => this.startRound(s.round), nextRound: () => this.startRound(s.round + 1),
      getCoupon: () => {
        this.saveCoupons([...this.state.coupons, { id: Date.now(), name: '7% 할인쿠폰', rate: '7%', date: this.today(), used: false }]);
        this.setState({ modal: 'couponDone' });
      },
      getGift: () => this.setState({ modal: 'giftPop' }),
    };
  }

  render() {
    const v = this.renderVals();
    return (
    <div style={{ "--bg": "#09090D", "--card": "#100D16", "--lime": "#8CFF00", "--purple": "#6F24B8", "--purple-text": "#B07CF0", "--pink": "#FF3D8B", "--warn": "#FF3B3B", "--text": "#F5F5F5", "--sub": "#BDBDC4", "--line": "#2A2830", "--pad": "clamp(20px,4.6vw,76px)", "background": "radial-gradient(1100px 620px at 78% 30%,rgba(111,36,184,0.22),rgba(111,36,184,0) 70%),var(--bg)", "color": "var(--text)", "fontFamily": "'Noto Sans KR',sans-serif", "minHeight": "100vh", "overflowX": "clip" }}>
    
      <header style={{ "borderBottom": "1px solid #2E2D34" }}>
        <div style={{ "maxWidth": "1672px", "margin": "0 auto", "padding": "10px var(--pad)", "minHeight": "82px", "display": "flex", "flexWrap": "wrap", "alignItems": "center", "justifyContent": "space-between", "columnGap": "32px", "rowGap": "10px" }}>
          <a href="#" onClick={v.onLogo} aria-label="Paint The Acid 홈" style={{ "display": "flex", "alignItems": "center", "gap": "14px", "flex": "1 0 auto" }}>
            <img src="assets/temp/logo-skull.png" alt="" style={{ "width": "58px", "height": "54px", "display": "block" }} />
            <span style={{ "display": "flex", "flexDirection": "column", "gap": "2px" }}>
              <span style={{ "fontFamily": "'Poppins',sans-serif", "fontStyle": "italic", "fontWeight": "800", "fontSize": "28px", "lineHeight": "1", "letterSpacing": "-0.02em", "whiteSpace": "nowrap" }}>Paint The Acid</span>
              <span style={{ "fontFamily": "'Poppins',sans-serif", "fontWeight": "600", "fontSize": "13px", "letterSpacing": "0.13em", "color": "var(--lime)", "whiteSpace": "nowrap" }}>ACID SLIME GEARS</span>
            </span>
          </a>
          <nav aria-label="주요 메뉴" style={{ "display": "flex", "flexWrap": "wrap", "columnGap": "clamp(24px,3.1vw,52px)", "rowGap": "8px", "fontFamily": "'Poppins',sans-serif", "fontWeight": "500", "fontSize": "18px" }}>
            <a href="#products" onClick={v.onNavProducts}>Products</a>
            <a href="#turf-war" onClick={v.onNavGame}>Game</a>
            <a href="#collab" onClick={v.onNavCollab}>Collab</a>
            <a href="#community" onClick={v.onNavCommunity}>Community</a>
          </nav>
          <div style={{ "display": "flex", "alignItems": "center", "justifyContent": "flex-end", "gap": "14px", "flex": "1 0 auto" }}>
            <button aria-label="검색" style={{ "width": "46px", "height": "46px", "background": "none", "border": "0", "color": "var(--text)", "display": "grid", "placeItems": "center", "cursor": "pointer" }}>
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="11" cy="11" r="8"></circle><line x1="17" y1="17" x2="24" y2="24"></line></svg>
            </button>
            <button aria-label={v.myPageLabel} onClick={v.openMyPage} style={{ "position": "relative", "width": "46px", "height": "46px", "background": "none", "border": "0", "color": "var(--text)", "display": "grid", "placeItems": "center", "cursor": "pointer" }}>
              <svg width="24" height="26" viewBox="0 0 24 26" fill="none" stroke="currentColor" strokeWidth="2.2"><circle cx="12" cy="7.5" r="5.5"></circle><path d="M2 25c0-6 4.5-9 10-9s10 3 10 9"></path></svg>
              {v.hasCoupons ? (<>
                <span aria-hidden="true" style={{ "position": "absolute", "top": "2px", "right": "0", "minWidth": "19px", "height": "19px", "padding": "0 5px", "borderRadius": "10px", "background": "var(--lime)", "color": "#0A0A0A", "fontSize": "11px", "fontWeight": "700", "display": "grid", "placeItems": "center", "lineHeight": "1" }}>{v.couponCount}</span>
              </>) : null}
            </button>
            <button ref={v.cartBtnRef} onClick={v.goCart} aria-label={v.cartLabel} style={{ "position": "relative", "width": "46px", "height": "46px", "background": "none", "border": "0", "color": "var(--text)", "display": "grid", "placeItems": "center", "cursor": "pointer" }}>
              <svg width="28" height="26" viewBox="0 0 28 26" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M1 2h4l3 14h14l3-10H7"></path><circle cx="10" cy="22" r="1.8"></circle><circle cx="20" cy="22" r="1.8"></circle></svg>
              {v.hasCart ? (<>
                <span ref={v.cartBadgeRef} aria-hidden="true" style={{ "position": "absolute", "top": "2px", "right": "0", "minWidth": "19px", "height": "19px", "padding": "0 5px", "borderRadius": "10px", "background": "var(--lime)", "color": "#0A0A0A", "fontSize": "11px", "fontWeight": "700", "display": "grid", "placeItems": "center", "lineHeight": "1" }}>{v.cartCount}</span>
              </>) : null}
            </button>
            <a href="#turf-war" onClick={v.onNavGame} style={{ "marginLeft": "36px", "height": "44px", "padding": "0 18px", "display": "inline-flex", "alignItems": "center", "gap": "8px", "background": "#000", "border": "2px solid var(--lime)", "borderRadius": "6px", "color": "var(--lime)", "fontFamily": "'Poppins',sans-serif", "fontWeight": "600", "fontSize": "18px", "whiteSpace": "nowrap" }}>Play Game <span aria-hidden="true" style={{ "width": "0", "height": "0", "borderLeft": "11px solid var(--lime)", "borderTop": "7px solid transparent", "borderBottom": "7px solid transparent" }}></span></a>
          </div>
        </div>
      </header>
    
      <main>
        {v.isHome ? (<>
        <section aria-label="Paint The Acid × VIPER × JOKER 콜라보" style={{ "position": "relative", "marginBottom": "clamp(24px,3vw,56px)" }}>
          <div style={{ "position": "relative", "maxWidth": "2098px", "margin": "0 auto" }}>
            <img src="assets/collab/collab-banner.jpg" alt="PAINT THE ACID — VIPER × JOKER, CHOOSE YOUR CHAOS. 연두색 뱀 테마 VIPER 세트와 보라색 카드 테마 JOKER 세트의 키보드·마우스·헤드셋" style={{ "display": "block", "width": "100%", "height": "auto", "WebkitMaskImage": "linear-gradient(to bottom,#000 0,#000 72%,rgba(0,0,0,0.55) 86%,transparent 100%)", "maskImage": "linear-gradient(to bottom,#000 0,#000 72%,rgba(0,0,0,0.55) 86%,transparent 100%)" }} />
            <div style={{ "position": "absolute", "left": "50%", "top": "37%", "transform": "translateX(-50%)", "display": "flex", "gap": "clamp(8px,1vw,16px)" }}>
              <a href="#collab" onClick={v.onNavCollab} style={{ "height": "clamp(30px,2.6vw,46px)", "padding": "0 clamp(12px,1.4vw,24px)", "display": "inline-flex", "alignItems": "center", "background": "var(--lime)", "border": "2px solid var(--lime)", "borderRadius": "4px", "color": "#0A0A0A", "fontWeight": "700", "fontSize": "clamp(12px,0.95vw,16px)", "whiteSpace": "nowrap" }}>자세한 정보</a>
              <a href="#products" onClick={v.onNavProducts} style={{ "height": "clamp(30px,2.6vw,46px)", "padding": "0 clamp(12px,1.4vw,24px)", "display": "inline-flex", "alignItems": "center", "background": "rgba(0,0,0,0.55)", "border": "2px solid var(--lime)", "borderRadius": "4px", "color": "var(--lime)", "fontWeight": "700", "fontSize": "clamp(12px,0.95vw,16px)", "whiteSpace": "nowrap" }}>구매하기</a>
            </div>
          </div>
        </section>
        <section aria-labelledby="hero-title" style={{ "position": "relative", "maxWidth": "1672px", "margin": "0 auto", "padding": "clamp(8px,1.5vw,24px) var(--pad) clamp(48px,5vw,80px)" }}>
          <div className="hero-in" style={{ "display": "flex", "flexDirection": "column", "alignItems": "center", "textAlign": "center" }}>
            <h1 id="hero-title" style={{ "position": "absolute", "width": "1px", "height": "1px", "margin": "-1px", "padding": "0", "overflow": "hidden", "clip": "rect(0 0 0 0)", "whiteSpace": "nowrap", "border": "0" }}>Paint The Acid</h1>
            <p style={{ "margin": "0", "fontFamily": "'Poppins',sans-serif", "fontWeight": "600", "fontSize": "clamp(13px,1.1vw,16px)", "letterSpacing": "0.36em", "color": "var(--lime)", "whiteSpace": "nowrap", "display": "flex", "gap": "16px", "alignItems": "center" }}>SLIME <span aria-hidden="true" style={{ "color": "var(--sub)", "fontSize": "14px", "letterSpacing": "0" }}>×</span> <span>GAMING GEARS</span></p>
            <p style={{ "margin": "18px 0 0", "fontSize": "clamp(26px,2.6vw,40px)", "fontWeight": "700", "lineHeight": "1.3", "letterSpacing": "-0.01em" }}>슬라임으로 물드는 게이밍 기어 브랜드</p>
            <p style={{ "margin": "14px 0 0", "maxWidth": "520px", "fontSize": "16px", "lineHeight": "1.7", "color": "var(--sub)", "textWrap": "pretty" }}>게임, 쇼핑, 수집까지 — 슬라임의 에너지로 즐기는 새로운 게이밍 경험.</p>
            <span aria-hidden="true" style={{ "display": "block", "width": "min(560px,70%)", "height": "2px", "marginTop": "clamp(32px,3vw,44px)", "background": "linear-gradient(to right,rgba(140,255,0,0),var(--lime) 30%,var(--purple-text) 70%,rgba(176,124,240,0))" }}></span>
          </div>
        </section>
    
        <section id="features" aria-label="주요 기능" style={{ "maxWidth": "1672px", "margin": "0 auto", "padding": "0 calc(var(--pad) + 90px)" }}>
          <ul style={{ "listStyle": "none", "margin": "0", "padding": "4px 0", "display": "grid", "gridTemplateColumns": "repeat(auto-fit,minmax(240px,1fr))" }}>
            {(v.features || []).map((f, $index) => (<React.Fragment key={$index}>
              <li style={{ "display": "flex", "alignItems": "center", "justifyContent": "center", "gap": "28px", "padding": "6px 16px", "minHeight": "56px", "borderLeft": f.divider }}>
                <span aria-hidden="true" style={{ "color": "var(--lime)", "display": "grid", "placeItems": "center", "width": "48px", "height": "48px", "flex": "none" }}>
                  {f.isPad ? (<><svg width="48" height="40" viewBox="0 0 48 40" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinejoin="round"><path d="M14 6h20c7 0 10 6 11 14s-1 14-6 14c-4 0-6-6-10-6h-10c-4 0-6 6-10 6s-7-6-6-14S7 6 14 6z"></path><line x1="15" y1="14" x2="15" y2="24"></line><line x1="10" y1="19" x2="20" y2="19"></line><circle cx="31" cy="16" r="1.6" fill="currentColor"></circle><circle cx="36" cy="21" r="1.6" fill="currentColor"></circle></svg></>) : null}
                  {f.isCart ? (<><svg width="46" height="42" viewBox="0 0 46 42" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round"><path d="M2 3h7l5 25h23l5-17H11"></path><circle cx="17" cy="36" r="3"></circle><circle cx="34" cy="36" r="3"></circle></svg></>) : null}
                  {f.isDrop ? (<><svg width="36" height="48" viewBox="0 0 36 48" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round"><path d="M18 3C12 14 4 22 4 31a14 14 0 0 0 28 0C32 22 24 14 18 3z"></path></svg></>) : null}
                  {f.isStar ? (<><svg width="48" height="46" viewBox="0 0 48 46" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinejoin="round"><path d="M24 3l6.5 13.5 14.5 2-10.5 10 2.6 14.5L24 36l-13.1 7 2.6-14.5L3 18.5l14.5-2z"></path></svg></>) : null}
                </span>
                <span style={{ "display": "flex", "flexDirection": "column", "gap": "6px" }}>
                  <span style={{ "fontFamily": "'Poppins',sans-serif", "fontWeight": "600", "fontSize": "19px", "letterSpacing": "-0.01em" }}>{f.title}</span>
                  <span style={{ "fontSize": "13px", "color": "var(--sub)" }}>{f.desc}</span>
                </span>
              </li>
            </React.Fragment>))}
          </ul>
        </section>
    
        <section id="dream-setup" aria-labelledby="dream-title" style={{ "maxWidth": "1672px", "margin": "0 auto", "padding": "110px calc(var(--pad) + 25px) 30px" }}>
          <div style={{ "display": "flex", "flexDirection": "column", "alignItems": "center", "gap": "10px", "textAlign": "center", "marginBottom": "36px" }}>
            <span style={{ "fontFamily": "'Poppins',sans-serif", "fontWeight": "600", "fontSize": "13px", "letterSpacing": "0.36em", "color": "var(--lime)" }}>DREAM SETUP</span>
            <h2 id="dream-title" style={{ "margin": "0", "fontSize": "clamp(26px,2.6vw,40px)", "fontWeight": "700", "lineHeight": "1.2" }}>Paint The Acid로 완성한 드림 셋업</h2>
            <p style={{ "margin": "0", "fontSize": "16px", "color": "var(--sub)" }}>헤드셋, 키보드, 마우스, 데스크 패드까지 — 슬라임으로 물든 방을 미리 만나보세요.</p>
          </div>
          <img src="assets/collab/dream-setup.jpg" alt="연두색 슬라임 해골 네온과 보라색 조명 아래 Paint The Acid 헤드셋, 키보드, 마우스, 데스크 패드로 꾸민 게이밍 데스크" style={{ "display": "block", "width": "100%", "height": "auto", "borderRadius": "16px", "border": "1px solid #2A2830" }} />
        </section>
    
        <section id="products" aria-labelledby="products-title" style={{ "maxWidth": "1672px", "margin": "0 auto", "padding": "70px calc(var(--pad) + 25px) 120px" }}>
          <div style={{ "display": "flex", "alignItems": "center", "gap": "20px", "marginBottom": "40px" }}>
            <h2 id="products-title" style={{ "margin": "0", "fontFamily": "'Poppins',sans-serif", "fontWeight": "600", "fontSize": "34px", "letterSpacing": "-0.01em", "whiteSpace": "nowrap" }}>New Arrivals</h2>
            <span aria-hidden="true" style={{ "flex": "1", "height": "2px", "marginTop": "20px", "background": "linear-gradient(to right,var(--lime) 0%,rgba(140,255,0,0.55) 70%,rgba(140,255,0,0.15) 100%)" }}></span>
            <a href="#products" style={{ "marginLeft": "12px", "display": "flex", "alignItems": "center", "gap": "10px", "fontSize": "16px", "fontWeight": "500", "whiteSpace": "nowrap" }}>더보기 <span aria-hidden="true">›</span></a>
          </div>
          <ul style={{ "listStyle": "none", "margin": "0", "padding": "0", "display": "grid", "gridTemplateColumns": "repeat(auto-fill,minmax(max(270px,calc((100% - 62px) / 3)),1fr))", "gap": "31px" }}>
            {(v.products || []).map((p, $index) => (<React.Fragment key={$index}>
              <li style={{ "position": "relative", "background": "var(--card)", "border": "1px solid #3A3742", "borderRadius": "18px", "overflow": "hidden", "display": "flex", "flexDirection": "column" }}>
                <a href={p.href} onClick={p.onOpen} className="tile" tabIndex="-1" aria-hidden="true" style={{ "display": "block", "aspectRatio": "1.05", "background": "#130F1A", "overflow": "hidden" }}>
                  <img src={p.img} alt="" style={{ "width": "100%", "height": "100%", "objectFit": "cover", "display": "block" }} />
                </a>
                <div style={{ "padding": "20px 24px 24px", "display": "flex", "flexDirection": "column", "gap": "6px" }}>
                  <h3 style={{ "margin": "0", "fontFamily": "'Poppins',sans-serif", "fontSize": "19px", "fontWeight": "600" }}><a href={p.href} onClick={p.onOpen} aria-label={p.openLabel}>{p.name}</a></h3>
                  <p style={{ "margin": "0 0 16px", "fontSize": "17px", "fontWeight": "700", "color": "var(--lime)" }}>{p.price}</p>
                  <div style={{ "display": "grid", "gridTemplateColumns": "1fr 1fr", "gap": "10px" }}>
                    <button onClick={p.onAdd} aria-label={p.addLabel} style={{ "height": "46px", "border": "2px solid var(--lime)", "borderRadius": "4px", "background": "#000", "color": "var(--text)", "fontWeight": "500", "fontSize": "15px", "cursor": "pointer", "display": "flex", "alignItems": "center", "justifyContent": "center", "gap": "8px", "whiteSpace": "nowrap" }}><svg aria-hidden="true" width="18" height="17" viewBox="0 0 28 26" fill="none" stroke="currentColor" strokeWidth="2.6"><path d="M1 2h4l3 14h14l3-10H7"></path><circle cx="10" cy="22" r="1.8"></circle><circle cx="20" cy="22" r="1.8"></circle></svg>장바구니 담기</button>
                    <button onClick={p.onBuy} aria-label={p.buyLabel} style={{ "height": "46px", "border": "0", "borderRadius": "4px", "background": "var(--lime)", "color": "#0A0A0A", "fontWeight": "700", "fontSize": "16px", "cursor": "pointer" }}>구매하기</button>
                  </div>
                </div>
              </li>
            </React.Fragment>))}
          </ul>
        </section>
    
        <section id="explore" aria-label="둘러보기" style={{ "background": "#000", "padding": "90px 0 120px" }}>
          <div style={{ "maxWidth": "1672px", "margin": "0 auto", "padding": "0 calc(var(--pad) + 25px)", "display": "flex", "flexDirection": "column", "gap": "56px" }}>
            <ul style={{ "listStyle": "none", "margin": "0", "padding": "0", "display": "grid", "gridTemplateColumns": "repeat(auto-fit,minmax(220px,1fr))", "gap": "22px" }}>
              {(v.shelf || []).map((c, $index) => (<React.Fragment key={$index}>
                <li>
                  <a href={c.href} onClick={c.go} className="tile" style={{ "display": "flex", "flexDirection": "column", "gap": "20px", "height": "100%", "color": "var(--text)" }}>
                    <span style={{ "display": "flex", "flexDirection": "column", "alignItems": "center", "gap": "8px", "textAlign": "center", "minHeight": "84px" }}>
                      <span style={{ "fontFamily": "'Poppins',sans-serif", "fontWeight": "700", "fontSize": "21px", "lineHeight": "1.2", "letterSpacing": "0.01em" }}>{c.title}</span>
                      <span style={{ "fontSize": "15px", "lineHeight": "1.4", "color": "var(--sub)" }}>{c.desc}</span>
                    </span>
                    <span style={{ "display": "block", "aspectRatio": "3/4", "borderRadius": "10px", "overflow": "hidden", "background": "#100D16" }}>
                      <img src={c.img} alt={c.alt} style={{ "width": "100%", "height": "100%", "objectFit": "cover", "display": "block", "objectPosition": c.pos }} />
                    </span>
                  </a>
                </li>
              </React.Fragment>))}
            </ul>
            <ul style={{ "listStyle": "none", "margin": "0", "padding": "0", "display": "grid", "gridTemplateColumns": "repeat(auto-fit,minmax(260px,1fr))", "gap": "22px" }}>
              {(v.guides || []).map((g, $index) => (<React.Fragment key={$index}>
                <li>
                  <a href={g.href} onClick={g.go} className="tile" style={{ "display": "flex", "flexDirection": "column", "gap": "16px", "color": "var(--text)" }}>
                    <span className="gthumb" style={{ "display": "block", "aspectRatio": "2/1", "borderRadius": "10px", "overflow": "hidden", "background": "#100D16" }}>
                      <img src={g.img} alt="" style={{ "width": "100%", "height": "100%", "objectFit": "cover", "display": "block", "objectPosition": g.pos }} />
                    </span>
                    <span style={{ "fontSize": "18px", "fontWeight": "700", "padding": "0 4px" }}>{g.title}</span>
                  </a>
                </li>
              </React.Fragment>))}
            </ul>
          </div>
        </section>
        </>) : null}
    
        {v.isGame ? (<>
        <section id="turf-war" aria-labelledby="turf-title" style={{ "maxWidth": "1320px", "margin": "0 auto", "padding": "28px var(--pad) 80px", "display": "flex", "flexDirection": "column", "gap": "18px" }}>
          <div style={{ "display": "flex", "flexWrap": "wrap", "gap": "10px" }}>
            <button onClick={v.onNavProducts} style={{ "height": "42px", "padding": "0 18px", "border": "1px solid #3A3742", "borderRadius": "4px", "background": "transparent", "color": "var(--text)", "fontFamily": "'Poppins',sans-serif", "fontWeight": "600", "fontSize": "14px", "letterSpacing": "0.08em", "cursor": "pointer" }}>TOXIC STORE</button>
            <button aria-current="page" style={{ "height": "42px", "padding": "0 18px", "border": "1px solid var(--lime)", "borderRadius": "4px", "background": "var(--lime)", "color": "#0A0A0A", "fontFamily": "'Poppins',sans-serif", "fontWeight": "700", "fontSize": "14px", "letterSpacing": "0.08em", "cursor": "default" }}>TURF WAR GAME</button>
            <button onClick={v.openMyPage} style={{ "height": "42px", "padding": "0 18px", "border": "1px solid #3A3742", "borderRadius": "4px", "background": "transparent", "color": "var(--text)", "fontFamily": "'Poppins',sans-serif", "fontWeight": "600", "fontSize": "14px", "letterSpacing": "0.08em", "cursor": "pointer" }}>MY PAGE</button>
          </div>
    
          <div style={{ "background": "var(--card)", "border": "1px solid var(--line)", "borderRadius": "14px", "padding": "22px 26px", "display": "flex", "flexDirection": "column", "gap": "16px" }}>
            <div style={{ "display": "flex", "flexWrap": "wrap", "alignItems": "center", "gap": "18px 32px" }}>
              <span style={{ "height": "34px", "padding": "0 16px", "borderRadius": "999px", "background": "var(--lime)", "color": "#0A0A0A", "fontFamily": "'Poppins',sans-serif", "fontStyle": "italic", "fontWeight": "800", "fontSize": "15px", "display": "inline-flex", "alignItems": "center", "whiteSpace": "nowrap" }}>ROUND {v.round}</span>
              <div style={{ "flex": "1 1 320px", "minWidth": "0" }}>
                <h2 id="turf-title" style={{ "margin": "0", "fontSize": "20px", "fontWeight": "700", "lineHeight": "1.35" }}>ROUND {v.round}: {v.roundTitle}</h2>
                <p style={{ "margin": "4px 0 0", "fontSize": "14px", "lineHeight": "1.5", "color": "var(--sub)", "textWrap": "pretty" }}>{v.roundDesc}</p>
              </div>
              <dl style={{ "display": "flex", "gap": "30px", "margin": "0" }}>
                <div><dt style={{ "fontFamily": "'Poppins',sans-serif", "fontWeight": "600", "fontSize": "12px", "letterSpacing": "0.12em", "color": "var(--sub)" }}>TIME</dt><dd style={{ "margin": "2px 0 0", "fontFamily": "'Poppins',sans-serif", "fontWeight": "700", "fontSize": "26px", "lineHeight": "1.2" }}>{v.hud.time}s</dd></div>
                <div><dt style={{ "fontFamily": "'Poppins',sans-serif", "fontWeight": "600", "fontSize": "12px", "letterSpacing": "0.12em", "color": "var(--sub)" }}>MY(GREEN)</dt><dd style={{ "margin": "2px 0 0", "fontFamily": "'Poppins',sans-serif", "fontWeight": "700", "fontSize": "26px", "lineHeight": "1.2", "color": "var(--lime)" }}>{v.hud.my}%</dd></div>
                <div><dt style={{ "fontFamily": "'Poppins',sans-serif", "fontWeight": "600", "fontSize": "12px", "letterSpacing": "0.12em", "color": "var(--sub)" }}>ENEMY(PURPLE)</dt><dd style={{ "margin": "2px 0 0", "fontFamily": "'Poppins',sans-serif", "fontWeight": "700", "fontSize": "26px", "lineHeight": "1.2", "color": "var(--purple-text)" }}>{v.hud.enemy}%</dd></div>
              </dl>
              <button onClick={v.retry} style={{ "height": "42px", "padding": "0 20px", "border": "1px solid #3A3742", "borderRadius": "4px", "background": "transparent", "color": "var(--text)", "fontFamily": "'Poppins',sans-serif", "fontWeight": "600", "fontSize": "14px", "letterSpacing": "0.1em", "cursor": "pointer" }}>RETRY</button>
            </div>
            <div role="presentation" style={{ "height": "10px", "borderRadius": "999px", "background": "#1B1824", "overflow": "hidden", "display": "flex", "justifyContent": "space-between" }}>
              <span style={{ "display": "block", "height": "100%", "width": v.myW, "background": "var(--lime)" }}></span>
              <span style={{ "display": "block", "height": "100%", "width": v.aiW, "background": "var(--purple)" }}></span>
            </div>
            {v.hud.warn ? (<>
              <div role="alert" style={{ "display": "flex", "flexWrap": "wrap", "alignItems": "center", "gap": "10px 16px" }}>
                <strong style={{ "color": "var(--warn)", "fontFamily": "'Poppins',sans-serif", "fontStyle": "italic", "fontWeight": "800", "fontSize": "18px" }}>WARNING!</strong>
                <span style={{ "fontSize": "14px" }}>점령률 정체 — {v.hud.warnLeft}초 안에 영역을 넓히세요</span>
                <span style={{ "flex": "1 1 160px", "height": "8px", "background": "#2A1416", "borderRadius": "999px", "overflow": "hidden" }}><span style={{ "display": "block", "height": "100%", "width": v.warnW, "background": "var(--warn)" }}></span></span>
              </div>
            </>) : null}
          </div>
    
          <div style={{ "border": "3px solid var(--lime)", "borderRadius": "22px", "overflow": "hidden", "background": "#0B0A10", "lineHeight": "0" }}>
            <canvas ref={v.canvasRef} aria-label="SLIME TURF WAR 게임판. 클릭하거나 드래그해서 연두색 슬라임을 분사하세요." style={{ "display": "block", "width": "100%", "height": "auto", "aspectRatio": "3/2", "touchAction": "none", "cursor": "crosshair" }}></canvas>
          </div>
          <p style={{ "margin": "0", "fontSize": "14px", "color": "var(--sub)", "textAlign": "center" }}>마우스 클릭·드래그 또는 터치로 연두색 슬라임을 분사하세요. 보라색 영역도 덮어쓸 수 있습니다.</p>
        </section>
        </>) : null}
        {v.isCart ? (<>
        <section id="cart" aria-labelledby="cart-title" style={{ "maxWidth": "1320px", "margin": "0 auto", "padding": "56px var(--pad) 120px", "display": "flex", "flexDirection": "column", "gap": "28px" }}>
          <div style={{ "display": "flex", "flexWrap": "wrap", "alignItems": "flex-end", "justifyContent": "space-between", "gap": "20px" }}>
            <div style={{ "display": "flex", "flexDirection": "column", "gap": "8px" }}>
              <span style={{ "fontFamily": "'Poppins',sans-serif", "fontWeight": "600", "fontSize": "13px", "letterSpacing": "0.3em", "color": "var(--lime)" }}>MY CART</span>
              <h1 id="cart-title" style={{ "margin": "0", "fontSize": "36px", "fontWeight": "700", "lineHeight": "1.1" }}>장바구니</h1>
            </div>
            <ol aria-label="주문 단계" style={{ "listStyle": "none", "margin": "0", "padding": "0", "display": "flex", "alignItems": "center", "gap": "10px", "fontSize": "14px" }}>
              {(v.steps || []).map((st, $index) => (<React.Fragment key={$index}>
                <li aria-current={st.current} style={{ "display": "flex", "alignItems": "center", "gap": "10px", "color": st.color, "fontWeight": st.weight }}>
                  {st.notFirst ? (<><span aria-hidden="true" style={{ "width": "28px", "height": "1px", "background": "#3A3742" }}></span></>) : null}
                  <span style={{ "width": "28px", "height": "28px", "borderRadius": "50%", "border": `1px solid ${st.ring}`, "background": st.bg, "color": st.numColor, "display": "grid", "placeItems": "center", "fontFamily": "'Poppins',sans-serif", "fontSize": "13px" }}>{st.n}</span>{st.label}
                </li>
              </React.Fragment>))}
            </ol>
          </div>
    
          <div style={{ "display": "flex", "flexWrap": "wrap", "alignItems": "flex-start", "gap": "28px" }}>
            <div style={{ "flex": "1 1 560px", "minWidth": "0", "display": "flex", "flexDirection": "column", "gap": "28px" }}>
              <div style={{ "background": "var(--card)", "border": "1px solid #3A3742", "borderRadius": "16px", "overflow": "hidden" }}>
                <div style={{ "display": "flex", "alignItems": "center", "justifyContent": "space-between", "gap": "12px", "padding": "16px 24px", "borderBottom": "1px solid var(--line)" }}>
                  <button onClick={v.toggleAll} role="checkbox" aria-checked={v.allChecked} style={{ "display": "flex", "alignItems": "center", "gap": "12px", "minHeight": "44px", "background": "none", "border": "0", "padding": "0", "color": "var(--text)", "fontSize": "15px", "fontWeight": "500", "cursor": "pointer" }}>
                    <span aria-hidden="true" style={{ "width": "22px", "height": "22px", "borderRadius": "4px", "border": `2px solid ${v.allBox.border}`, "background": v.allBox.bg, "display": "grid", "placeItems": "center" }}>{v.allChecked ? (<><svg width="12" height="10" viewBox="0 0 12 10" fill="none" stroke="#0A0A0A" strokeWidth="2.4"><path d="M1 5l3.5 3.5L11 1"></path></svg></>) : null}</span>
                    전체선택 ({v.checkedCount}/{v.itemCount})
                  </button>
                  <button onClick={v.removeChecked} style={{ "height": "36px", "padding": "0 14px", "border": "1px solid #3A3742", "borderRadius": "4px", "background": "transparent", "color": "var(--sub)", "fontSize": "13px", "cursor": "pointer" }}>선택삭제</button>
                </div>
                {v.cartEmpty ? (<>
                  <div style={{ "padding": "64px 24px", "display": "flex", "flexDirection": "column", "alignItems": "center", "gap": "16px", "textAlign": "center" }}>
                    <p style={{ "margin": "0", "fontSize": "16px", "color": "var(--sub)" }}>장바구니에 담긴 상품이 없습니다.</p>
                    <button onClick={v.onNavProducts} style={{ "height": "48px", "padding": "0 26px", "border": "0", "borderRadius": "4px", "background": "var(--lime)", "color": "#0A0A0A", "fontWeight": "700", "fontSize": "15px", "cursor": "pointer" }}>제품 보러 가기</button>
                  </div>
                </>) : null}
                <ul style={{ "listStyle": "none", "margin": "0", "padding": "0" }}>
                  {(v.cartItems || []).map((it, $index) => (<React.Fragment key={$index}>
                    <li style={{ "display": "flex", "flexWrap": "wrap", "alignItems": "center", "gap": "18px 20px", "padding": "22px 24px", "borderTop": it.divider }}>
                      <button onClick={it.onToggle} role="checkbox" aria-checked={it.checked} aria-label={it.checkLabel} style={{ "width": "44px", "height": "44px", "margin": "-11px", "background": "none", "border": "0", "display": "grid", "placeItems": "center", "cursor": "pointer" }}>
                        <span aria-hidden="true" style={{ "width": "22px", "height": "22px", "borderRadius": "4px", "border": `2px solid ${it.boxBorder}`, "background": it.boxBg, "display": "grid", "placeItems": "center" }}>{it.checked ? (<><svg width="12" height="10" viewBox="0 0 12 10" fill="none" stroke="#0A0A0A" strokeWidth="2.4"><path d="M1 5l3.5 3.5L11 1"></path></svg></>) : null}</span>
                      </button>
                      <img src={it.img} alt="" style={{ "width": "96px", "height": "96px", "borderRadius": "10px", "objectFit": "cover", "display": "block", "background": "#130F1A", "flex": "none" }} />
                      <div style={{ "flex": "1 1 180px", "minWidth": "0", "display": "flex", "flexDirection": "column", "gap": "6px" }}>
                        {it.gift ? (<><span style={{ "alignSelf": "flex-start", "padding": "3px 8px", "borderRadius": "3px", "background": "var(--purple)", "color": "var(--text)", "fontSize": "11px", "fontWeight": "700", "letterSpacing": "0.06em" }}>TURF WAR 증정품</span></>) : null}
                        <strong style={{ "fontFamily": "'Poppins',sans-serif", "fontSize": "17px", "fontWeight": "600" }}>{it.name}</strong>
                        <span style={{ "fontSize": "13px", "color": "var(--sub)" }}>{it.option}</span>
                      </div>
                      {it.canQty ? (<>
                        <div role="group" aria-label="수량" style={{ "display": "flex", "alignItems": "center", "border": "1px solid #3A3742", "borderRadius": "4px", "height": "40px" }}>
                          <button onClick={it.onDec} aria-label="수량 줄이기" style={{ "width": "40px", "height": "100%", "border": "0", "background": "none", "color": "var(--text)", "fontSize": "18px", "cursor": "pointer" }}>−</button>
                          <span aria-live="polite" style={{ "minWidth": "36px", "textAlign": "center", "fontFamily": "'Poppins',sans-serif", "fontWeight": "600", "fontSize": "15px" }}>{it.qty}</span>
                          <button onClick={it.onInc} aria-label="수량 늘리기" style={{ "width": "40px", "height": "100%", "border": "0", "background": "none", "color": "var(--text)", "fontSize": "18px", "cursor": "pointer" }}>+</button>
                        </div>
                      </>) : null}
                      <span style={{ "minWidth": "120px", "textAlign": "right", "fontSize": "19px", "fontWeight": "700", "color": "var(--lime)" }}>{it.lineLabel}</span>
                      <button onClick={it.onRemove} aria-label={it.removeLabel} style={{ "width": "44px", "height": "44px", "margin": "-8px -12px -8px 0", "border": "0", "background": "none", "color": "var(--sub)", "display": "grid", "placeItems": "center", "cursor": "pointer" }}>
                        <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.8"><line x1="1" y1="1" x2="13" y2="13"></line><line x1="13" y1="1" x2="1" y2="13"></line></svg>
                      </button>
                    </li>
                  </React.Fragment>))}
                </ul>
              </div>
    
              <div style={{ "display": "flex", "flexDirection": "column", "gap": "18px" }}>
                <h2 style={{ "margin": "0", "fontSize": "20px", "fontWeight": "700" }}>함께 보면 좋은 상품</h2>
                <ul style={{ "listStyle": "none", "margin": "0", "padding": "0", "display": "grid", "gridTemplateColumns": "repeat(auto-fit,minmax(180px,1fr))", "gap": "18px" }}>
                  {(v.products || []).map((p, $index) => (<React.Fragment key={$index}>
                    <li style={{ "background": "var(--card)", "border": "1px solid #3A3742", "borderRadius": "14px", "overflow": "hidden", "display": "flex", "flexDirection": "column" }}>
                      <img src={p.img} alt={p.name} style={{ "width": "100%", "aspectRatio": "1.2", "objectFit": "cover", "display": "block" }} />
                      <div style={{ "padding": "14px 16px 16px", "display": "flex", "flexDirection": "column", "gap": "4px" }}>
                        <strong style={{ "fontFamily": "'Poppins',sans-serif", "fontSize": "15px", "fontWeight": "600" }}>{p.name}</strong>
                        <span style={{ "fontSize": "15px", "fontWeight": "700", "color": "var(--lime)" }}>{p.price}</span>
                        <button onClick={p.onAdd} aria-label={p.addLabel} style={{ "marginTop": "10px", "height": "40px", "border": "1px solid #3A3742", "borderRadius": "4px", "background": "transparent", "color": "var(--text)", "fontSize": "14px", "cursor": "pointer" }}>장바구니 담기</button>
                      </div>
                    </li>
                  </React.Fragment>))}
                </ul>
              </div>
            </div>
    
            <aside aria-labelledby="sum-title" style={{ "flex": "0 1 340px", "minWidth": "280px", "position": "sticky", "top": "24px", "display": "flex", "flexDirection": "column", "gap": "14px" }}>
              <div style={{ "background": "var(--card)", "border": "1px solid #3A3742", "borderRadius": "16px", "padding": "24px" }}>
                <h2 id="sum-title" style={{ "margin": "0 0 18px", "fontSize": "18px", "fontWeight": "700" }}>최종 결제 금액</h2>
                <dl style={{ "margin": "0", "display": "flex", "flexDirection": "column", "gap": "12px", "fontSize": "15px" }}>
                  <div style={{ "display": "flex", "justifyContent": "space-between" }}><dt style={{ "color": "var(--sub)" }}>주문금액</dt><dd style={{ "margin": "0" }}>{v.sum.subtotal}</dd></div>
                  <div style={{ "display": "flex", "justifyContent": "space-between" }}><dt style={{ "color": "var(--sub)" }}>증정품</dt><dd style={{ "margin": "0" }}>{v.sum.gift}</dd></div>
                  <div style={{ "display": "flex", "justifyContent": "space-between" }}><dt style={{ "color": "var(--sub)" }}>배송비</dt><dd style={{ "margin": "0" }}>{v.sum.ship}</dd></div>
                </dl>
                <div style={{ "marginTop": "18px", "paddingTop": "18px", "borderTop": "1px solid var(--line)", "display": "flex", "justifyContent": "space-between", "alignItems": "baseline", "gap": "12px" }}>
                  <span style={{ "fontSize": "15px", "fontWeight": "700" }}>총 결제 예정 금액</span>
                  <strong style={{ "fontFamily": "'Poppins',sans-serif", "fontSize": "26px", "fontWeight": "700", "color": "var(--lime)" }}>{v.sum.total}</strong>
                </div>
                <p style={{ "margin": "10px 0 0", "fontSize": "13px", "color": "var(--sub)" }}>50,000원 이상 구매 시 무료배송</p>
              </div>
              <button onClick={v.goOrder} disabled={v.orderDisabled} style={{ "height": "60px", "border": "0", "borderRadius": "4px", "background": v.orderBg, "color": v.orderColor, "fontWeight": "700", "fontSize": "18px", "cursor": "pointer" }}>주문하기 ({v.checkedCount}개)</button>
            </aside>
          </div>
        </section>
        </>) : null}
        {v.isCheckout ? (<>
        <section id="checkout" aria-labelledby="co-title" style={{ "maxWidth": "1320px", "margin": "0 auto", "padding": "56px var(--pad) 120px", "display": "flex", "flexDirection": "column", "gap": "28px" }}>
          <div style={{ "display": "flex", "flexWrap": "wrap", "alignItems": "flex-end", "justifyContent": "space-between", "gap": "20px" }}>
            <div style={{ "display": "flex", "flexDirection": "column", "gap": "8px" }}>
              <span style={{ "fontFamily": "'Poppins',sans-serif", "fontWeight": "600", "fontSize": "13px", "letterSpacing": "0.3em", "color": "var(--lime)" }}>CHECKOUT</span>
              <h1 id="co-title" style={{ "margin": "0", "fontSize": "36px", "fontWeight": "700", "lineHeight": "1.1" }}>주문/결제</h1>
            </div>
            <ol aria-label="주문 단계" style={{ "listStyle": "none", "margin": "0", "padding": "0", "display": "flex", "alignItems": "center", "gap": "10px", "fontSize": "14px" }}>
              {(v.steps || []).map((st, $index) => (<React.Fragment key={$index}>
                <li aria-current={st.current} style={{ "display": "flex", "alignItems": "center", "gap": "10px", "color": st.color, "fontWeight": st.weight }}>
                  {st.notFirst ? (<><span aria-hidden="true" style={{ "width": "28px", "height": "1px", "background": "#3A3742" }}></span></>) : null}
                  <span style={{ "width": "28px", "height": "28px", "borderRadius": "50%", "border": `1px solid ${st.ring}`, "background": st.bg, "color": st.numColor, "display": "grid", "placeItems": "center", "fontFamily": "'Poppins',sans-serif", "fontSize": "13px" }}>{st.n}</span>{st.label}
                </li>
              </React.Fragment>))}
            </ol>
          </div>
          <div style={{ "display": "flex", "flexWrap": "wrap", "alignItems": "flex-start", "gap": "28px" }}>
            <div style={{ "flex": "1 1 560px", "minWidth": "0", "display": "flex", "flexDirection": "column", "gap": "20px" }}>
    
              <div style={{ "background": "var(--card)", "border": "1px solid #3A3742", "borderRadius": "16px", "padding": "24px", "display": "flex", "flexDirection": "column", "gap": "16px" }}>
                <h2 style={{ "margin": "0", "fontSize": "18px", "fontWeight": "700" }}>주문 상품 <span style={{ "color": "var(--sub)", "fontWeight": "500", "fontSize": "15px" }}>{v.checkedCount}개</span></h2>
                <ul style={{ "listStyle": "none", "margin": "0", "padding": "0", "display": "flex", "flexDirection": "column", "gap": "12px" }}>
                  {(v.orderLines || []).map((ol, $index) => (<React.Fragment key={$index}>
                    <li style={{ "display": "flex", "alignItems": "center", "gap": "14px" }}>
                      <img src={ol.img} alt="" style={{ "width": "56px", "height": "56px", "borderRadius": "8px", "objectFit": "cover", "display": "block", "flex": "none" }} />
                      <span style={{ "flex": "1", "minWidth": "0", "display": "flex", "flexDirection": "column", "gap": "2px" }}><strong style={{ "fontFamily": "'Poppins',sans-serif", "fontSize": "15px", "fontWeight": "600" }}>{ol.name}</strong><span style={{ "fontSize": "13px", "color": "var(--sub)" }}>{ol.sub}</span></span>
                      <span style={{ "fontWeight": "700" }}>{ol.lineLabel}</span>
                    </li>
                  </React.Fragment>))}
                </ul>
              </div>
    
              <div style={{ "background": "var(--card)", "border": "1px solid #3A3742", "borderRadius": "16px", "padding": "24px", "display": "flex", "flexDirection": "column", "gap": "16px" }}>
                <h2 style={{ "margin": "0", "fontSize": "18px", "fontWeight": "700" }}>배송 정보</h2>
                <div style={{ "display": "grid", "gridTemplateColumns": "repeat(auto-fit,minmax(220px,1fr))", "gap": "14px" }}>
                  <label style={{ "display": "flex", "flexDirection": "column", "gap": "8px", "fontSize": "13px", "color": "var(--sub)" }}>받는 분<input value={v.co.name} onChange={v.f.name} autoComplete="name" placeholder="이름" style={{ "height": "48px", "padding": "0 14px", "border": "1px solid #3A3742", "borderRadius": "4px", "background": "#0B0A10", "color": "var(--text)", "font": "inherit", "fontSize": "15px", "outlineColor": "#8CFF00", "width": "100%", "minWidth": "0" }} /></label>
                  <label style={{ "display": "flex", "flexDirection": "column", "gap": "8px", "fontSize": "13px", "color": "var(--sub)" }}>연락처<input value={v.co.phone} onChange={v.f.phone} inputMode="tel" autoComplete="tel" placeholder="010-0000-0000" style={{ "height": "48px", "padding": "0 14px", "border": "1px solid #3A3742", "borderRadius": "4px", "background": "#0B0A10", "color": "var(--text)", "font": "inherit", "fontSize": "15px", "outlineColor": "#8CFF00", "width": "100%", "minWidth": "0" }} /></label>
                </div>
                <label style={{ "display": "flex", "flexDirection": "column", "gap": "8px", "fontSize": "13px", "color": "var(--sub)" }}>주소<input value={v.co.addr} onChange={v.f.addr} autoComplete="street-address" placeholder="도로명 주소" style={{ "height": "48px", "padding": "0 14px", "border": "1px solid #3A3742", "borderRadius": "4px", "background": "#0B0A10", "color": "var(--text)", "font": "inherit", "fontSize": "15px", "outlineColor": "#8CFF00", "width": "100%", "minWidth": "0" }} /></label>
                <label style={{ "display": "flex", "flexDirection": "column", "gap": "8px", "fontSize": "13px", "color": "var(--sub)" }}>상세 주소<input value={v.co.addr2} onChange={v.f.addr2} placeholder="동·호수 (선택)" style={{ "height": "48px", "padding": "0 14px", "border": "1px solid #3A3742", "borderRadius": "4px", "background": "#0B0A10", "color": "var(--text)", "font": "inherit", "fontSize": "15px", "outlineColor": "#8CFF00", "width": "100%", "minWidth": "0" }} /></label>
              </div>
    
              <div style={{ "background": "var(--card)", "border": "1px solid #3A3742", "borderRadius": "16px", "padding": "24px", "display": "flex", "flexDirection": "column", "gap": "18px" }}>
                <h2 style={{ "margin": "0", "fontSize": "18px", "fontWeight": "700" }}>결제 수단</h2>
                <div role="radiogroup" aria-label="결제 수단" style={{ "display": "grid", "gridTemplateColumns": "repeat(auto-fit,minmax(150px,1fr))", "gap": "10px" }}>
                  {(v.payMethods || []).map((pm, $index) => (<React.Fragment key={$index}>
                    <button role="radio" aria-checked={pm.on} aria-disabled={pm.disabled} disabled={pm.disabled} onClick={pm.pick} style={{ "height": "56px", "padding": "0 14px", "border": pm.border, "borderRadius": "6px", "background": pm.bg, "color": "var(--text)", "fontWeight": pm.weight, "fontSize": "15px", "cursor": pm.cursor, "opacity": pm.opacity, "display": "flex", "alignItems": "center", "justifyContent": "center", "gap": "10px" }}>
                      <span aria-hidden="true" style={{ "width": "26px", "height": "18px", "borderRadius": "3px", "background": pm.chip, "color": pm.chipText, "fontFamily": "'Poppins',sans-serif", "fontSize": "9px", "fontWeight": "800", "display": "grid", "placeItems": "center" }}>{pm.mark}</span>{pm.label}
                      {pm.disabled ? (<><span style={{ "fontSize": "11px", "color": "var(--sub)", "fontWeight": "500" }}>준비 중</span></>) : null}
                    </button>
                  </React.Fragment>))}
                </div>
    
                {v.isCard ? (<>
                  <div style={{ "display": "flex", "flexDirection": "column", "gap": "14px", "padding": "20px", "borderRadius": "12px", "background": "#15111C" }}>
                    <strong style={{ "fontSize": "15px" }}>카드 등록</strong>
                    <label style={{ "display": "flex", "flexDirection": "column", "gap": "8px", "fontSize": "13px", "color": "var(--sub)" }}>카드 번호<input value={v.co.cardNo} onChange={v.f.cardNo} inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" style={{ "height": "48px", "padding": "0 14px", "border": "1px solid #3A3742", "borderRadius": "4px", "background": "#0B0A10", "color": "var(--text)", "font": "inherit", "fontSize": "15px", "outlineColor": "#8CFF00", "width": "100%", "minWidth": "0", "fontFamily": "'Poppins',sans-serif", "letterSpacing": "0.08em" }} /></label>
                    <div style={{ "display": "grid", "gridTemplateColumns": "repeat(auto-fit,minmax(140px,1fr))", "gap": "14px" }}>
                      <label style={{ "display": "flex", "flexDirection": "column", "gap": "8px", "fontSize": "13px", "color": "var(--sub)" }}>유효기간<input value={v.co.exp} onChange={v.f.exp} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" style={{ "height": "48px", "padding": "0 14px", "border": "1px solid #3A3742", "borderRadius": "4px", "background": "#0B0A10", "color": "var(--text)", "font": "inherit", "fontSize": "15px", "outlineColor": "#8CFF00", "width": "100%", "minWidth": "0" }} /></label>
                      <label style={{ "display": "flex", "flexDirection": "column", "gap": "8px", "fontSize": "13px", "color": "var(--sub)" }}>CVC<input value={v.co.cvc} onChange={v.f.cvc} inputMode="numeric" autoComplete="cc-csc" placeholder="3자리" type="password" style={{ "height": "48px", "padding": "0 14px", "border": "1px solid #3A3742", "borderRadius": "4px", "background": "#0B0A10", "color": "var(--text)", "font": "inherit", "fontSize": "15px", "outlineColor": "#8CFF00", "width": "100%", "minWidth": "0" }} /></label>
                      <label style={{ "display": "flex", "flexDirection": "column", "gap": "8px", "fontSize": "13px", "color": "var(--sub)" }}>생년월일 6자리<input value={v.co.birth} onChange={v.f.birth} inputMode="numeric" placeholder="YYMMDD" style={{ "height": "48px", "padding": "0 14px", "border": "1px solid #3A3742", "borderRadius": "4px", "background": "#0B0A10", "color": "var(--text)", "font": "inherit", "fontSize": "15px", "outlineColor": "#8CFF00", "width": "100%", "minWidth": "0" }} /></label>
                    </div>
                    <button onClick={v.toggleSaveCard} role="checkbox" aria-checked={v.co.saveCard} style={{ "alignSelf": "flex-start", "display": "flex", "alignItems": "center", "gap": "10px", "minHeight": "40px", "background": "none", "border": "0", "padding": "0", "color": "var(--sub)", "fontSize": "14px", "cursor": "pointer" }}>
                      <span aria-hidden="true" style={{ "width": "20px", "height": "20px", "borderRadius": "4px", "border": `2px solid ${v.saveBox.border}`, "background": v.saveBox.bg, "display": "grid", "placeItems": "center" }}>{v.co.saveCard ? (<><svg width="11" height="9" viewBox="0 0 12 10" fill="none" stroke="#0A0A0A" strokeWidth="2.4"><path d="M1 5l3.5 3.5L11 1"></path></svg></>) : null}</span>
                      다음 결제를 위해 이 카드 저장
                    </button>
                  </div>
                </>) : null}
                {v.isEasy ? (<>
                  <div style={{ "padding": "20px", "borderRadius": "12px", "background": "#15111C", "fontSize": "14px", "lineHeight": "1.6", "color": "var(--sub)" }}>[결제하기]를 누르면 <strong style={{ "color": "var(--text)" }}>{v.methodLabel}</strong> 결제창으로 연결됩니다. 앱에서 결제를 승인해 주세요.</div>
                </>) : null}
                {v.isBank ? (<>
                  <div style={{ "display": "flex", "flexDirection": "column", "gap": "14px", "padding": "20px", "borderRadius": "12px", "background": "#15111C" }}>
                    <strong style={{ "fontSize": "15px" }}>무통장입금</strong>
                    <div style={{ "display": "flex", "flexWrap": "wrap", "alignItems": "center", "justifyContent": "space-between", "gap": "12px", "padding": "14px 16px", "border": "1px solid #3A3742", "borderRadius": "8px" }}>
                      <span style={{ "display": "flex", "flexDirection": "column", "gap": "4px" }}><span style={{ "fontSize": "13px", "color": "var(--sub)" }}>{v.bank.bank} · 예금주 {v.bank.holder}</span><strong style={{ "fontFamily": "'Poppins',sans-serif", "fontSize": "18px", "letterSpacing": "0.04em" }}>{v.bank.number}</strong></span>
                      <button onClick={v.copyAccount} style={{ "height": "40px", "padding": "0 14px", "border": "1px solid var(--lime)", "borderRadius": "4px", "background": "transparent", "color": "var(--lime)", "fontSize": "14px", "fontWeight": "700", "cursor": "pointer" }}>계좌번호 복사</button>
                    </div>
                    <label style={{ "display": "flex", "flexDirection": "column", "gap": "8px", "fontSize": "13px", "color": "var(--sub)" }}>입금자명<input value={v.co.depositor} onChange={v.f.depositor} placeholder={v.depositorHint} style={{ "height": "48px", "padding": "0 14px", "border": "1px solid #3A3742", "borderRadius": "4px", "background": "#0B0A10", "color": "var(--text)", "font": "inherit", "fontSize": "15px", "outlineColor": "#8CFF00", "width": "100%", "minWidth": "0" }} /></label>
                    <p style={{ "margin": "0", "fontSize": "13px", "lineHeight": "1.6", "color": "var(--sub)" }}>주문 후 24시간 이내에 입금해 주세요. 미입금 시 주문이 자동 취소됩니다.</p>
                  </div>
                </>) : null}
              </div>
            </div>
    
            <aside aria-labelledby="co-sum" style={{ "flex": "0 1 340px", "minWidth": "280px", "position": "sticky", "top": "24px", "display": "flex", "flexDirection": "column", "gap": "14px" }}>
              <div style={{ "background": "var(--card)", "border": "1px solid #3A3742", "borderRadius": "16px", "padding": "24px" }}>
                <h2 id="co-sum" style={{ "margin": "0 0 18px", "fontSize": "18px", "fontWeight": "700" }}>최종 결제 금액</h2>
                <dl style={{ "margin": "0", "display": "flex", "flexDirection": "column", "gap": "12px", "fontSize": "15px" }}>
                  <div style={{ "display": "flex", "justifyContent": "space-between" }}><dt style={{ "color": "var(--sub)" }}>주문금액</dt><dd style={{ "margin": "0" }}>{v.sum.subtotal}</dd></div>
                  <div style={{ "display": "flex", "justifyContent": "space-between" }}><dt style={{ "color": "var(--sub)" }}>증정품</dt><dd style={{ "margin": "0" }}>{v.sum.gift}</dd></div>
                  <div style={{ "display": "flex", "justifyContent": "space-between" }}><dt style={{ "color": "var(--sub)" }}>배송비</dt><dd style={{ "margin": "0" }}>{v.sum.ship}</dd></div>
                  <div style={{ "display": "flex", "justifyContent": "space-between" }}><dt style={{ "color": "var(--sub)" }}>결제 수단</dt><dd style={{ "margin": "0" }}>{v.methodLabel}</dd></div>
                </dl>
                <div style={{ "marginTop": "18px", "paddingTop": "18px", "borderTop": "1px solid var(--line)", "display": "flex", "justifyContent": "space-between", "alignItems": "baseline", "gap": "12px" }}>
                  <span style={{ "fontSize": "15px", "fontWeight": "700" }}>총 결제 금액</span>
                  <strong style={{ "fontFamily": "'Poppins',sans-serif", "fontSize": "26px", "fontWeight": "700", "color": "var(--lime)" }}>{v.sum.total}</strong>
                </div>
              </div>
              {v.hasCoErr ? (<>
                <p role="alert" style={{ "margin": "0", "fontSize": "14px", "color": "#FF6B6B" }}>{v.coErr}</p>
              </>) : null}
              <button onClick={v.pay} style={{ "height": "60px", "border": "0", "borderRadius": "4px", "background": "var(--lime)", "color": "#0A0A0A", "fontWeight": "700", "fontSize": "18px", "cursor": "pointer" }}>{v.payLabel}</button>
              <button onClick={v.goCart} style={{ "height": "48px", "border": "1px solid #3A3742", "borderRadius": "4px", "background": "transparent", "color": "var(--text)", "fontSize": "15px", "cursor": "pointer" }}>장바구니로 돌아가기</button>
            </aside>
          </div>
        </section>
        </>) : null}
    
        {v.isDone ? (<>
        <section aria-labelledby="done-title" style={{ "maxWidth": "1320px", "margin": "0 auto", "padding": "56px var(--pad) 120px", "display": "flex", "flexDirection": "column", "gap": "40px" }}>
          <div style={{ "display": "flex", "justifyContent": "flex-end" }}><ol aria-label="주문 단계" style={{ "listStyle": "none", "margin": "0", "padding": "0", "display": "flex", "alignItems": "center", "gap": "10px", "fontSize": "14px" }}>
              {(v.steps || []).map((st, $index) => (<React.Fragment key={$index}>
                <li aria-current={st.current} style={{ "display": "flex", "alignItems": "center", "gap": "10px", "color": st.color, "fontWeight": st.weight }}>
                  {st.notFirst ? (<><span aria-hidden="true" style={{ "width": "28px", "height": "1px", "background": "#3A3742" }}></span></>) : null}
                  <span style={{ "width": "28px", "height": "28px", "borderRadius": "50%", "border": `1px solid ${st.ring}`, "background": st.bg, "color": st.numColor, "display": "grid", "placeItems": "center", "fontFamily": "'Poppins',sans-serif", "fontSize": "13px" }}>{st.n}</span>{st.label}
                </li>
              </React.Fragment>))}
            </ol></div>
          <div style={{ "maxWidth": "560px", "width": "100%", "margin": "0 auto", "background": "var(--card)", "border": "1px solid #3A3742", "borderRadius": "16px", "padding": "44px 32px 32px", "display": "flex", "flexDirection": "column", "alignItems": "center", "gap": "12px", "textAlign": "center" }}>
            <span aria-hidden="true" style={{ "width": "64px", "height": "64px", "borderRadius": "50%", "background": "var(--lime)", "display": "grid", "placeItems": "center" }}><svg width="28" height="22" viewBox="0 0 12 10" fill="none" stroke="#0A0A0A" strokeWidth="2"><path d="M1 5l3.5 3.5L11 1"></path></svg></span>
            <h1 id="done-title" style={{ "margin": "10px 0 0", "fontSize": "30px", "fontWeight": "700" }}>주문이 완료되었습니다!</h1>
            <p style={{ "margin": "0", "fontSize": "15px", "color": "var(--sub)" }}>주문번호 <strong style={{ "color": "var(--text)", "fontFamily": "'Poppins',sans-serif" }}>{v.order.no}</strong></p>
            <dl style={{ "width": "100%", "margin": "18px 0 0", "padding": "18px 0 0", "borderTop": "1px solid var(--line)", "display": "flex", "flexDirection": "column", "gap": "10px", "fontSize": "15px", "textAlign": "left" }}>
              <div style={{ "display": "flex", "justifyContent": "space-between" }}><dt style={{ "color": "var(--sub)" }}>주문 상품</dt><dd style={{ "margin": "0" }}>{v.order.summary}</dd></div>
              <div style={{ "display": "flex", "justifyContent": "space-between" }}><dt style={{ "color": "var(--sub)" }}>결제 수단</dt><dd style={{ "margin": "0" }}>{v.order.method}</dd></div>
              <div style={{ "display": "flex", "justifyContent": "space-between", "gap": "12px" }}><dt style={{ "color": "var(--sub)" }}>입금 계좌</dt><dd style={{ "margin": "0", "textAlign": "right" }}>{v.bank.bank} {v.bank.number}</dd></div>
              <div style={{ "display": "flex", "justifyContent": "space-between" }}><dt style={{ "color": "var(--sub)" }}>입금 기한</dt><dd style={{ "margin": "0" }}>{v.order.due}</dd></div>
              <div style={{ "display": "flex", "justifyContent": "space-between" }}><dt style={{ "color": "var(--sub)" }}>상태</dt><dd style={{ "margin": "0", "color": "var(--lime)", "fontWeight": "700" }}>입금 대기</dd></div>
              <div style={{ "display": "flex", "justifyContent": "space-between" }}><dt style={{ "color": "var(--sub)" }}>배송지</dt><dd style={{ "margin": "0", "maxWidth": "60%", "textAlign": "right" }}>{v.order.addr}</dd></div>
              <div style={{ "display": "flex", "justifyContent": "space-between", "alignItems": "baseline" }}><dt style={{ "color": "var(--sub)" }}>결제 금액</dt><dd style={{ "margin": "0", "fontFamily": "'Poppins',sans-serif", "fontSize": "22px", "fontWeight": "700", "color": "var(--lime)" }}>{v.order.total}</dd></div>
            </dl>
            <button onClick={v.onNavProducts} style={{ "marginTop": "18px", "width": "100%", "height": "52px", "border": "0", "borderRadius": "4px", "background": "var(--lime)", "color": "#0A0A0A", "fontWeight": "700", "fontSize": "16px", "cursor": "pointer" }}>쇼핑 계속하기</button>
          </div>
        </section>
        </>) : null}
        {v.isProduct ? (<>
        <section id="product-detail" aria-labelledby="pd-title" style={{ "maxWidth": "1320px", "margin": "0 auto", "padding": "28px var(--pad) 120px", "display": "flex", "flexDirection": "column", "gap": "56px" }}>
          <div style={{ "display": "flex", "flexDirection": "column", "gap": "20px" }}>
            <nav aria-label="현재 위치" style={{ "display": "flex", "flexWrap": "wrap", "alignItems": "center", "gap": "10px", "fontSize": "13px", "color": "var(--sub)" }}>
              <a href="#" onClick={v.onLogo} style={{ "color": "var(--sub)" }}>홈</a><span aria-hidden="true">›</span>
              <a href="#products" onClick={v.onNavProducts} style={{ "color": "var(--sub)" }}>New Arrivals</a><span aria-hidden="true">›</span>
              <span style={{ "color": "var(--sub)" }}>{v.pd.tag}</span><span aria-hidden="true">›</span>
              <span aria-current="page" style={{ "color": "var(--text)" }}>{v.pd.name}</span>
            </nav>
            <div style={{ "display": "grid", "gridTemplateColumns": "repeat(auto-fit,minmax(min(100%,440px),1fr))", "gap": "clamp(28px,4vw,56px)", "alignItems": "start" }}>
              <div style={{ "display": "flex", "flexDirection": "column", "gap": "12px" }}>
                <div style={{ "aspectRatio": "1", "borderRadius": "12px", "overflow": "hidden", "background": "#130F1A", "border": "1px solid #3A3742" }}>
                  <img src={v.pd.img} alt={v.pd.name} style={{ "width": "100%", "height": "100%", "objectFit": "cover", "display": "block" }} />
                </div>
                <p style={{ "margin": "0", "fontSize": "12px", "color": "var(--sub)", "textAlign": "center" }}>상품 이미지는 연출된 컷으로, 실제 상품과 다를 수 있습니다.</p>
              </div>
              <div style={{ "display": "flex", "flexDirection": "column" }}>
                <div style={{ "display": "flex", "flexWrap": "wrap", "alignItems": "center", "gap": "8px" }}>
                  <span style={{ "padding": "4px 10px", "borderRadius": "3px", "background": "var(--lime)", "color": "#0A0A0A", "fontSize": "12px", "fontWeight": "700" }}>NEW</span>
                  <span style={{ "padding": "4px 10px", "borderRadius": "3px", "border": "1px solid var(--purple-text)", "color": "var(--purple-text)", "fontSize": "12px", "fontWeight": "700" }}>{v.pd.tag}</span>
                  <span style={{ "fontSize": "13px", "color": "var(--sub)" }}>Paint The Acid</span>
                </div>
                <h1 id="pd-title" style={{ "margin": "14px 0 0", "fontFamily": "'Poppins',sans-serif", "fontSize": "clamp(24px,2.3vw,32px)", "fontWeight": "700", "lineHeight": "1.3" }}>{v.pd.name}</h1>
                <p style={{ "margin": "8px 0 0", "fontSize": "15px", "color": "var(--purple-text)" }}>{v.pd.tagline}</p>
                <p style={{ "margin": "10px 0 0", "fontSize": "13px", "color": "var(--sub)" }}>상품코드 {v.pd.code} · <span style={{ "color": "#FFD34D" }}>★</span> {v.pd.avg} · 리뷰 {v.pd.reviewCount}건</p>
    
                <div style={{ "marginTop": "22px", "padding": "22px 0", "borderTop": "2px solid var(--text)", "borderBottom": "1px solid var(--line)", "display": "flex", "alignItems": "baseline", "justifyContent": "space-between", "gap": "12px", "flexWrap": "wrap" }}>
                  <span style={{ "fontSize": "15px", "color": "var(--sub)" }}>판매가</span>
                  <span style={{ "fontSize": "32px", "fontWeight": "700", "color": "var(--lime)" }}>{v.pd.price}</span>
                </div>
                <dl style={{ "margin": "0", "fontSize": "14px" }}>
                  <div style={{ "display": "grid", "gridTemplateColumns": "96px 1fr", "gap": "12px", "padding": "12px 0", "borderBottom": "1px solid var(--line)" }}><dt style={{ "color": "var(--sub)" }}>배송비</dt><dd style={{ "margin": "0" }}>{v.pd.ship}</dd></div>
                  <div style={{ "display": "grid", "gridTemplateColumns": "96px 1fr", "gap": "12px", "padding": "12px 0", "borderBottom": "1px solid var(--line)" }}><dt style={{ "color": "var(--sub)" }}>배송 안내</dt><dd style={{ "margin": "0" }}>평일 오후 2시 이전 결제 시 당일 출고 <span style={{ "color": "var(--sub)" }}>(주말·공휴일 제외)</span></dd></div>
                  <div style={{ "display": "grid", "gridTemplateColumns": "96px 1fr", "gap": "12px", "padding": "12px 0", "borderBottom": "1px solid var(--line)" }}><dt style={{ "color": "var(--sub)" }}>결제 혜택</dt><dd style={{ "margin": "0" }}>무통장입금 가능 · TURF WAR 쿠폰 사용 가능</dd></div>
                  <div style={{ "display": "grid", "gridTemplateColumns": "96px 1fr", "gap": "12px", "padding": "12px 0", "borderBottom": "1px solid var(--line)" }}><dt style={{ "color": "var(--sub)" }}>적립금</dt><dd style={{ "margin": "0" }}><span style={{ "color": "var(--lime)", "fontWeight": "700" }}>{v.pd.point}</span> <span style={{ "color": "var(--sub)" }}>(구매금액의 1%)</span></dd></div>
                  <div style={{ "display": "grid", "gridTemplateColumns": "96px 1fr", "gap": "12px", "padding": "12px 0", "borderBottom": "1px solid var(--line)" }}><dt style={{ "color": "var(--sub)" }}>A/S</dt><dd style={{ "margin": "0" }}>구매일로부터 1년 무상 보증</dd></div>
                </dl>
    
                <div style={{ "marginTop": "18px", "padding": "18px 20px", "borderRadius": "8px", "background": "var(--card)", "border": "1px solid #3A3742", "display": "flex", "flexDirection": "column", "gap": "14px" }}>
                  <div style={{ "display": "flex", "alignItems": "center", "justifyContent": "space-between", "gap": "12px", "flexWrap": "wrap" }}>
                    <span style={{ "fontSize": "14px", "fontWeight": "500", "flex": "1", "minWidth": "0" }}>{v.pd.name}</span>
                    <div role="group" aria-label="수량 선택" style={{ "display": "flex", "alignItems": "center", "border": "1px solid #4A4652", "borderRadius": "4px", "overflow": "hidden", "background": "#000" }}>
                      <button onClick={v.pd.dec} aria-label="수량 줄이기" style={{ "width": "36px", "height": "36px", "border": "0", "background": "transparent", "color": "var(--text)", "fontSize": "18px", "cursor": "pointer" }}>−</button>
                      <span aria-live="polite" style={{ "minWidth": "40px", "textAlign": "center", "fontWeight": "700", "fontSize": "14px" }}>{v.pd.qty}</span>
                      <button onClick={v.pd.inc} aria-label="수량 늘리기" style={{ "width": "36px", "height": "36px", "border": "0", "background": "transparent", "color": "var(--text)", "fontSize": "18px", "cursor": "pointer" }}>+</button>
                    </div>
                  </div>
                </div>
                <div style={{ "marginTop": "16px", "display": "flex", "alignItems": "baseline", "justifyContent": "flex-end", "gap": "12px" }}>
                  <span style={{ "fontSize": "15px" }}>총 상품금액</span>
                  <strong style={{ "fontSize": "28px", "color": "var(--lime)" }}>{v.pd.total}</strong>
                </div>
                <div style={{ "marginTop": "16px", "display": "grid", "gridTemplateColumns": "56px 1fr 1fr", "gap": "10px" }}>
                  <button onClick={v.pd.wish} aria-label="관심상품 담기" style={{ "height": "56px", "border": "1px solid #4A4652", "borderRadius": "4px", "background": "transparent", "color": "var(--text)", "display": "grid", "placeItems": "center", "cursor": "pointer" }}><svg aria-hidden="true" width="22" height="20" viewBox="0 0 24 22" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 20s-9-5.6-9-12a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.4-9 12-9 12z"></path></svg></button>
                  <button onClick={v.pd.onAdd} style={{ "height": "56px", "border": "2px solid var(--lime)", "borderRadius": "4px", "background": "#000", "color": "var(--text)", "fontWeight": "600", "fontSize": "16px", "cursor": "pointer" }}>장바구니</button>
                  <button onClick={v.pd.onBuy} style={{ "height": "56px", "border": "0", "borderRadius": "4px", "background": "var(--lime)", "color": "#0A0A0A", "fontWeight": "700", "fontSize": "17px", "cursor": "pointer" }}>바로구매</button>
                </div>
              </div>
            </div>
          </div>
    
          <div style={{ "display": "flex", "flexDirection": "column" }}>
            <nav aria-label="상세 정보 메뉴" style={{ "position": "sticky", "top": "0", "zIndex": "20", "display": "grid", "gridTemplateColumns": "repeat(4,1fr)", "background": "var(--bg)", "borderTop": "2px solid var(--lime)", "borderBottom": "1px solid #3A3742" }}>
              {(v.pd.tabs || []).map((tb, $index) => (<React.Fragment key={$index}>
                <button onClick={tb.go} style={{ "height": "56px", "border": "0", "borderLeft": "1px solid var(--line)", "background": "transparent", "color": "var(--text)", "fontSize": "15px", "fontWeight": "600", "cursor": "pointer" }}>{tb.label}</button>
              </React.Fragment>))}
            </nav>
    
            <div id="pd-info" style={{ "paddingTop": "48px", "display": "flex", "flexDirection": "column", "gap": "48px" }}>
              <div style={{ "display": "flex", "flexDirection": "column", "gap": "16px" }}>
                <h2 style={{ "margin": "0", "fontSize": "20px", "fontWeight": "700" }}>요약 스펙</h2>
                <dl style={{ "margin": "0", "display": "grid", "gridTemplateColumns": "repeat(auto-fit,minmax(min(100%,420px),1fr))", "borderTop": "1px solid #4A4652" }}>
                  {(v.pd.specList || []).map((sp, $index) => (<React.Fragment key={$index}>
                    <div style={{ "display": "grid", "gridTemplateColumns": "140px 1fr", "borderBottom": "1px solid var(--line)" }}>
                      <dt style={{ "padding": "14px 16px", "background": "var(--card)", "fontSize": "14px", "color": "var(--sub)" }}>{sp.k}</dt>
                      <dd style={{ "margin": "0", "padding": "14px 16px", "fontSize": "14px", "fontWeight": "500" }}>{sp.v}</dd>
                    </div>
                  </React.Fragment>))}
                </dl>
              </div>
    
              <div style={{ "display": "flex", "flexDirection": "column", "alignItems": "center", "textAlign": "center", "gap": "18px", "padding": "64px clamp(16px,4vw,48px)", "borderRadius": "12px", "background": "radial-gradient(700px 360px at 50% 0%,rgba(111,36,184,0.28),rgba(111,36,184,0) 70%),#000" }}>
                <span style={{ "fontFamily": "'Poppins',sans-serif", "fontWeight": "600", "fontSize": "13px", "letterSpacing": "0.36em", "color": "var(--lime)" }}>{v.pd.tag}</span>
                <h2 style={{ "margin": "0", "fontSize": "clamp(26px,3vw,42px)", "fontWeight": "700", "lineHeight": "1.3" }}>{v.pd.tagline}</h2>
                <p style={{ "margin": "0", "maxWidth": "640px", "fontSize": "16px", "lineHeight": "1.8", "color": "var(--sub)", "textWrap": "pretty" }}>{v.pd.desc}</p>
                <img src={v.pd.img} alt="" style={{ "marginTop": "24px", "width": "min(100%,720px)", "aspectRatio": "1", "objectFit": "cover", "borderRadius": "12px", "display": "block" }} />
              </div>
    
              <ul style={{ "listStyle": "none", "margin": "0", "padding": "0", "display": "grid", "gridTemplateColumns": "repeat(auto-fit,minmax(240px,1fr))", "gap": "18px" }}>
                {(v.pd.pointList || []).map((pt, $index) => (<React.Fragment key={$index}>
                  <li style={{ "padding": "28px 26px", "border": "1px solid #3A3742", "borderRadius": "12px", "background": "var(--card)", "display": "flex", "flexDirection": "column", "gap": "12px" }}>
                    <span style={{ "fontFamily": "'Poppins',sans-serif", "fontWeight": "800", "fontStyle": "italic", "fontSize": "30px", "color": "var(--lime)", "lineHeight": "1" }}>{pt.n}</span>
                    <h3 style={{ "margin": "0", "fontSize": "19px", "fontWeight": "700" }}>{pt.t}</h3>
                    <p style={{ "margin": "0", "fontSize": "15px", "lineHeight": "1.7", "color": "var(--sub)" }}>{pt.d}</p>
                  </li>
                </React.Fragment>))}
              </ul>
            </div>
    
            <div id="pd-review" style={{ "paddingTop": "72px", "display": "flex", "flexDirection": "column", "gap": "16px" }}>
              <div style={{ "display": "flex", "alignItems": "center", "justifyContent": "space-between", "gap": "12px", "flexWrap": "wrap" }}>
                <h2 style={{ "margin": "0", "fontSize": "20px", "fontWeight": "700" }}>상품리뷰 <span style={{ "color": "var(--lime)" }}>{v.pd.reviewCount}</span> <span style={{ "marginLeft": "6px", "padding": "3px 8px", "border": "1px solid #4A4652", "borderRadius": "3px", "fontSize": "11px", "fontWeight": "500", "color": "var(--sub)", "verticalAlign": "middle" }}>시안용 예시</span></h2>
                <button onClick={v.pd.review} style={{ "height": "40px", "padding": "0 18px", "border": "1px solid #4A4652", "borderRadius": "4px", "background": "transparent", "color": "var(--text)", "fontSize": "14px", "cursor": "pointer" }}>리뷰 작성</button>
              </div>
              <div style={{ "padding": "28px 24px", "borderTop": "1px solid #4A4652", "background": "var(--card)", "display": "grid", "gridTemplateColumns": "repeat(auto-fit,minmax(240px,1fr))", "gap": "28px", "alignItems": "center" }}>
                <div style={{ "display": "flex", "flexDirection": "column", "alignItems": "center", "gap": "6px", "textAlign": "center" }}>
                  <span style={{ "fontSize": "14px", "color": "var(--sub)" }}>구매 만족도</span>
                  <strong style={{ "fontSize": "48px", "lineHeight": "1" }}>{v.pd.avg}</strong>
                  <span aria-label={`평균 별점 ${v.pd.avg}점`} style={{ "fontSize": "22px", "letterSpacing": "2px", "color": "#FFD34D" }}>{v.pd.avgStars}</span>
                  <span style={{ "fontSize": "13px", "color": "var(--sub)" }}>리뷰 {v.pd.reviewCount}건</span>
                </div>
                <ul style={{ "listStyle": "none", "margin": "0", "padding": "0", "display": "flex", "flexDirection": "column", "gap": "8px" }}>
                  {(v.pd.dist || []).map((d, $index) => (<React.Fragment key={$index}>
                    <li style={{ "display": "grid", "gridTemplateColumns": "36px 1fr 64px", "alignItems": "center", "gap": "10px", "fontSize": "13px" }}>
                      <span style={{ "color": "var(--sub)" }}>{d.label}</span>
                      <span aria-hidden="true" style={{ "height": "8px", "borderRadius": "4px", "background": "#2A2830", "overflow": "hidden" }}><span style={{ "display": "block", "height": "100%", "width": d.w, "background": "var(--lime)", "borderRadius": "4px" }}></span></span>
                      <span style={{ "textAlign": "right", "color": "var(--sub)" }}>{d.n}</span>
                    </li>
                  </React.Fragment>))}
                </ul>
              </div>
              <ul style={{ "listStyle": "none", "margin": "0", "padding": "0", "borderTop": "1px solid var(--line)" }}>
                {(v.pd.reviews || []).map((rv, $index) => (<React.Fragment key={$index}>
                  <li style={{ "padding": "22px 4px", "borderBottom": "1px solid var(--line)", "display": "flex", "flexDirection": "column", "gap": "8px" }}>
                    <div style={{ "display": "flex", "flexWrap": "wrap", "alignItems": "center", "gap": "12px" }}>
                      <span aria-label={rv.starLabel} style={{ "fontSize": "15px", "letterSpacing": "1px", "color": "#FFD34D" }}>{rv.stars}</span>
                      <span style={{ "fontSize": "13px", "fontWeight": "600" }}>{rv.who}</span>
                      <span style={{ "fontSize": "13px", "color": "var(--sub)" }}>{rv.date}</span>
                    </div>
                    <p style={{ "margin": "0", "fontSize": "15px", "lineHeight": "1.7" }}>{rv.text}</p>
                  </li>
                </React.Fragment>))}
              </ul>
              <button onClick={v.pd.moreReviews} style={{ "alignSelf": "center", "marginTop": "8px", "height": "46px", "padding": "0 28px", "border": "1px solid #4A4652", "borderRadius": "4px", "background": "transparent", "color": "var(--text)", "fontSize": "14px", "cursor": "pointer" }}>리뷰 더보기</button>
            </div>
    
            <div id="pd-qna" style={{ "paddingTop": "72px", "display": "flex", "flexDirection": "column", "gap": "16px" }}>
              <div style={{ "display": "flex", "alignItems": "center", "justifyContent": "space-between", "gap": "12px", "flexWrap": "wrap" }}>
                <h2 style={{ "margin": "0", "fontSize": "20px", "fontWeight": "700" }}>상품문의 <span style={{ "color": "var(--lime)" }}>0</span></h2>
                <button onClick={v.pd.ask} style={{ "height": "40px", "padding": "0 18px", "border": "1px solid #4A4652", "borderRadius": "4px", "background": "transparent", "color": "var(--text)", "fontSize": "14px", "cursor": "pointer" }}>문의하기</button>
              </div>
              <div style={{ "padding": "48px 20px", "borderTop": "1px solid #4A4652", "borderBottom": "1px solid var(--line)", "textAlign": "center", "fontSize": "15px", "color": "var(--sub)" }}>등록된 문의가 없습니다.</div>
            </div>
    
            <div id="pd-ship" style={{ "paddingTop": "72px", "display": "flex", "flexDirection": "column", "gap": "16px" }}>
              <h2 style={{ "margin": "0", "fontSize": "20px", "fontWeight": "700" }}>배송/교환/반품 안내</h2>
              <dl style={{ "margin": "0", "borderTop": "1px solid #4A4652", "fontSize": "14px", "lineHeight": "1.7" }}>
                <div style={{ "display": "grid", "gridTemplateColumns": "140px 1fr", "borderBottom": "1px solid var(--line)" }}><dt style={{ "padding": "14px 16px", "background": "var(--card)", "color": "var(--sub)" }}>배송 방법</dt><dd style={{ "margin": "0", "padding": "14px 16px" }}>택배 · 평일 오후 2시 이전 결제 시 당일 출고, 출고 후 영업일 기준 2~5일 소요</dd></div>
                <div style={{ "display": "grid", "gridTemplateColumns": "140px 1fr", "borderBottom": "1px solid var(--line)" }}><dt style={{ "padding": "14px 16px", "background": "var(--card)", "color": "var(--sub)" }}>배송비</dt><dd style={{ "margin": "0", "padding": "14px 16px" }}>3,000원 · 5만원 이상 구매 시 무료 (도서·산간 추가 비용 발생 가능)</dd></div>
                <div style={{ "display": "grid", "gridTemplateColumns": "140px 1fr", "borderBottom": "1px solid var(--line)" }}><dt style={{ "padding": "14px 16px", "background": "var(--card)", "color": "var(--sub)" }}>교환·반품 신청</dt><dd style={{ "margin": "0", "padding": "14px 16px" }}>상품 수령일로부터 7일 이내 고객센터(0321-****)로 신청</dd></div>
                <div style={{ "display": "grid", "gridTemplateColumns": "140px 1fr", "borderBottom": "1px solid var(--line)" }}><dt style={{ "padding": "14px 16px", "background": "var(--card)", "color": "var(--sub)" }}>교환·반품 비용</dt><dd style={{ "margin": "0", "padding": "14px 16px" }}>단순 변심: 왕복 배송비 고객 부담 · 초기 불량: 무료 교환</dd></div>
                <div style={{ "display": "grid", "gridTemplateColumns": "140px 1fr", "borderBottom": "1px solid var(--line)" }}><dt style={{ "padding": "14px 16px", "background": "var(--card)", "color": "var(--sub)" }}>교환·반품 불가</dt><dd style={{ "margin": "0", "padding": "14px 16px" }}>포장 개봉 후 사용 흔적이 있는 경우, 고객 과실로 상품이 훼손된 경우, 구성품이 누락된 경우</dd></div>
              </dl>
            </div>
          </div>
    
          <div style={{ "display": "flex", "flexDirection": "column", "gap": "24px" }}>
            <h2 style={{ "margin": "0", "fontSize": "22px", "fontWeight": "700" }}>함께 보면 좋은 제품</h2>
            <ul style={{ "listStyle": "none", "margin": "0", "padding": "0", "display": "grid", "gridTemplateColumns": "repeat(auto-fit,minmax(200px,1fr))", "gap": "18px" }}>
              {(v.related || []).map((r, $index) => (<React.Fragment key={$index}>
                <li>
                  <a href={r.href} onClick={r.onOpen} className="tile" style={{ "display": "flex", "flexDirection": "column", "gap": "12px", "color": "var(--text)" }}>
                    <span style={{ "display": "block", "aspectRatio": "1", "borderRadius": "12px", "overflow": "hidden", "background": "#130F1A", "border": "1px solid #3A3742" }}><img src={r.img} alt="" style={{ "width": "100%", "height": "100%", "objectFit": "cover", "display": "block" }} /></span>
                    <span style={{ "fontFamily": "'Poppins',sans-serif", "fontSize": "16px", "fontWeight": "600" }}>{r.name}</span>
                    <span style={{ "fontSize": "15px", "fontWeight": "700", "color": "var(--lime)" }}>{r.price}</span>
                  </a>
                </li>
              </React.Fragment>))}
            </ul>
          </div>
        </section>
        </>) : null}
        {v.isCommunity ? (<>
        <section id="community" aria-labelledby="cm-title" style={{ "maxWidth": "1100px", "margin": "0 auto", "padding": "64px var(--pad) 120px", "display": "flex", "flexDirection": "column", "gap": "40px" }}>
          <div style={{ "display": "flex", "flexDirection": "column", "gap": "10px" }}>
            <span style={{ "fontFamily": "'Poppins',sans-serif", "fontWeight": "600", "fontSize": "13px", "letterSpacing": "0.3em", "color": "var(--lime)" }}>COMMUNITY · SUPPORT</span>
            <h1 id="cm-title" style={{ "margin": "0", "fontSize": "36px", "fontWeight": "700", "lineHeight": "1.1" }}>고객센터</h1>
            <p style={{ "margin": "6px 0 0", "fontSize": "18px", "fontWeight": "500" }}>고객센터 문의처 <span style={{ "color": "var(--lime)" }}>(임시 0321-****)</span></p>
            <p style={{ "margin": "0", "fontSize": "14px", "color": "var(--sub)" }}>평일 10:00 – 18:00 · 점심시간 12:30 – 13:30 · 주말·공휴일 휴무</p>
          </div>
    
          <div className="faq" style={{ "display": "flex", "flexDirection": "column", "gap": "14px" }}>
            <h2 style={{ "margin": "0", "fontSize": "22px", "fontWeight": "700" }}>자주 묻는 질문</h2>
            <div style={{ "borderTop": "2px solid var(--lime)" }}>
              {(v.faqs || []).map((q, $index) => (<React.Fragment key={$index}>
                <details style={{ "borderBottom": "1px solid var(--line)" }}>
                  <summary style={{ "display": "flex", "alignItems": "center", "gap": "16px", "padding": "20px 4px", "cursor": "pointer" }}>
                    <span aria-hidden="true" className="tri" style={{ "flex": "none", "width": "0", "height": "0", "borderLeft": "11px solid var(--lime)", "borderTop": "7px solid transparent", "borderBottom": "7px solid transparent" }}></span>
                    <span aria-hidden="true" style={{ "flex": "none", "fontFamily": "'Poppins',sans-serif", "fontWeight": "700", "fontSize": "17px", "color": "var(--lime)" }}>Q.</span>
                    <span className="fq" style={{ "fontSize": "16px", "fontWeight": "500", "lineHeight": "1.5" }}>{q.q}</span>
                  </summary>
                  <div style={{ "display": "flex", "gap": "16px", "padding": "4px 4px 22px 31px" }}>
                    <span aria-hidden="true" style={{ "flex": "none", "fontFamily": "'Poppins',sans-serif", "fontWeight": "700", "fontSize": "17px", "color": "var(--purple-text)" }}>A.</span>
                    <p style={{ "margin": "0", "fontSize": "15px", "lineHeight": "1.7", "color": "var(--sub)", "textWrap": "pretty" }}>{q.a}</p>
                  </div>
                </details>
              </React.Fragment>))}
            </div>
          </div>
    
          <div style={{ "display": "flex", "flexDirection": "column", "gap": "16px" }}>
            <div style={{ "display": "flex", "flexDirection": "column", "gap": "6px" }}>
              <h2 style={{ "margin": "0", "fontSize": "22px", "fontWeight": "700" }}>원하는 답변을 찾지 못하셨나요?</h2>
              <p style={{ "margin": "0", "fontSize": "15px", "color": "var(--sub)" }}>아래 채널로 문의를 남겨 주시면 빠르게 도와드릴게요.</p>
            </div>
            <div style={{ "display": "grid", "gridTemplateColumns": "repeat(auto-fit,minmax(240px,1fr))", "gap": "14px" }}>
              {(v.contacts || []).map((c, $index) => (<React.Fragment key={$index}>
                <button onClick={c.go} style={{ "textAlign": "left", "padding": "24px", "border": "1px solid #3A3742", "borderRadius": "8px", "background": "var(--card)", "color": "var(--text)", "cursor": "pointer", "display": "flex", "flexDirection": "column", "gap": "8px" }}>
                  <span style={{ "fontFamily": "'Poppins',sans-serif", "fontWeight": "600", "fontSize": "12px", "letterSpacing": "0.24em", "color": "var(--lime)" }}>{c.tag}</span>
                  <span style={{ "fontSize": "19px", "fontWeight": "700" }}>{c.title}</span>
                  <span style={{ "fontSize": "14px", "lineHeight": "1.5", "color": "var(--sub)" }}>{c.desc}</span>
                </button>
              </React.Fragment>))}
            </div>
          </div>
        </section>
        </>) : null}
        {v.isCollab ? (<>
        <section id="collab" aria-labelledby="collab-title" style={{ "background": "#000" }}>
          <div style={{ "minHeight": "calc(100vh - 83px)", "maxWidth": "1100px", "margin": "0 auto", "padding": "80px var(--pad) 56px", "display": "flex", "flexDirection": "column", "alignItems": "center", "justifyContent": "center", "textAlign": "center", "gap": "22px" }}>
            <span style={{ "fontFamily": "'Poppins',sans-serif", "fontWeight": "600", "fontSize": "13px", "letterSpacing": "0.36em", "color": "var(--lime)" }}>COLLABORATION</span>
            <h1 id="collab-title" style={{ "margin": "0", "fontFamily": "'Noto Sans KR',sans-serif", "fontWeight": "700", "fontSize": "clamp(44px,6vw,84px)", "lineHeight": "1.1", "color": "var(--lime)" }}>콜라보레이션</h1>
            <p style={{ "margin": "6px 0 0", "maxWidth": "760px", "fontSize": "17px", "lineHeight": "1.7", "color": "var(--sub)", "textWrap": "pretty" }}>Paint The Acid는 게이머가 사랑하는 캐릭터·브랜드와 손잡고, 슬라임의 에너지를 담은 한정판 기어를 선보입니다. 이곳에서 콜라보로 탄생한 제품들을 만나보세요.</p>
            <button onClick={v.scrollCollab} aria-label="콜라보 제품 보기" style={{ "marginTop": "40px", "background": "none", "border": "0", "color": "var(--text)", "display": "flex", "flexDirection": "column", "alignItems": "center", "gap": "10px", "cursor": "pointer", "fontFamily": "'Poppins',sans-serif", "fontWeight": "600", "fontSize": "12px", "letterSpacing": "0.3em" }}>
              SCROLL
              <svg aria-hidden="true" width="22" height="34" viewBox="0 0 22 34" fill="none" stroke="#8CFF00" strokeWidth="2"><rect x="1" y="1" width="20" height="32" rx="10"></rect><line x1="11" y1="8" x2="11" y2="14"></line></svg>
            </button>
          </div>
        </section>
        <section id="collab-showcase" aria-labelledby="collab-kb-title" style={{ "background": "#000", "padding": "0 0 120px" }}>
          <div style={{ "maxWidth": "1672px", "margin": "0 auto", "padding": "0 var(--pad)" }}>
            <div style={{ "display": "flex", "flexDirection": "column", "alignItems": "center", "gap": "10px", "textAlign": "center", "padding": "24px 0 36px" }}>
              <h2 id="collab-kb-title" style={{ "margin": "0", "fontFamily": "'Poppins',sans-serif", "fontWeight": "600", "fontSize": "clamp(22px,2.4vw,34px)", "letterSpacing": "0.02em" }}>PAINT THE ACID <span aria-hidden="true" style={{ "color": "var(--sub)" }}>×</span> VIPER / JOKER</h2>
              <p style={{ "margin": "0", "fontFamily": "'Poppins',sans-serif", "fontWeight": "600", "fontSize": "15px", "letterSpacing": "0.12em", "color": "var(--sub)" }}>KEYBOARD · MOUSE · HEADSET · DESK PAD</p>
            </div>
            <img src="assets/collab/keyboard-collab.jpg" alt="Paint The Acid × VIPER 연두색 뱀 테마 키보드·마우스·헤드셋 세트와 Paint The Acid × JOKER 보라색 카드 테마 키보드·마우스·헤드셋 세트" style={{ "display": "block", "width": "100%", "height": "auto", "borderRadius": "8px" }} />
          </div>
        </section>
        </>) : null}
      </main>
    
      {v.mWin ? (<>
        <div role="dialog" aria-modal="true" aria-labelledby="win-title" style={{ "position": "fixed", "inset": "0", "zIndex": "50", "background": "rgba(5,4,8,0.72)", "backdropFilter": "blur(6px)", "WebkitBackdropFilter": "blur(6px)", "display": "grid", "placeItems": "center", "padding": "20px" }}>
          <div style={{ "width": "100%", "maxWidth": "440px", "background": "var(--card)", "border": "2px solid var(--lime)", "borderRadius": "16px", "padding": "40px 32px 32px", "display": "flex", "flexDirection": "column", "alignItems": "center", "gap": "12px", "textAlign": "center" }}>
            <svg aria-hidden="true" width="60" height="60" viewBox="0 0 60 60" fill="none" stroke="#8CFF00" strokeWidth="3.2" strokeLinejoin="round" strokeLinecap="round"><path d="M18 8h24v14a12 12 0 0 1-24 0z"></path><path d="M18 13H9c0 9 4 13 10 14M42 13h9c0 9-4 13-10 14"></path><line x1="30" y1="34" x2="30" y2="44"></line><path d="M20 52h20l-3-8H23z"></path></svg>
            <h2 id="win-title" style={{ "margin": "6px 0 0", "fontFamily": "'Poppins',sans-serif", "fontStyle": "italic", "fontWeight": "800", "fontSize": "32px" }}>ROUND {v.round} 승리!</h2>
            <p style={{ "margin": "0", "fontSize": "17px", "fontWeight": "700", "color": "var(--lime)" }}>[점령률: {v.result.my}%]</p>
            <p style={{ "margin": "0", "fontSize": "15px", "color": "var(--sub)" }}>다음 라운드로 진입합니다!</p>
            <button onClick={v.nextRound} style={{ "marginTop": "14px", "width": "100%", "height": "52px", "border": "0", "borderRadius": "4px", "background": "var(--lime)", "color": "#0A0A0A", "fontWeight": "700", "fontSize": "17px", "cursor": "pointer" }}>확인</button>
          </div>
        </div>
      </>) : null}
    
      {v.mLose ? (<>
        <div role="dialog" aria-modal="true" aria-labelledby="lose-title" style={{ "position": "fixed", "inset": "0", "zIndex": "50", "background": "rgba(5,4,8,0.72)", "backdropFilter": "blur(6px)", "WebkitBackdropFilter": "blur(6px)", "display": "grid", "placeItems": "center", "padding": "20px" }}>
          <div style={{ "width": "100%", "maxWidth": "560px", "maxHeight": "calc(100vh - 40px)", "background": "var(--card)", "border": "2px solid var(--pink)", "borderRadius": "16px", "padding": "32px 28px 28px", "display": "flex", "flexDirection": "column", "gap": "18px" }}>
            <div style={{ "display": "flex", "flexDirection": "column", "alignItems": "center", "gap": "8px", "textAlign": "center" }}>
              <img src="assets/temp/logo-skull.png" alt="" style={{ "width": "58px", "height": "54px", "mixBlendMode": "lighten", "filter": "hue-rotate(-140deg) saturate(1.4)" }} />
              <h2 id="lose-title" style={{ "margin": "0", "fontFamily": "'Poppins',sans-serif", "fontStyle": "italic", "fontWeight": "800", "fontSize": "30px" }}>DEFEAT & RANKINGS</h2>
              <p style={{ "margin": "0", "fontSize": "14px", "lineHeight": "1.5", "color": v.loseSubColor, "textWrap": "pretty" }}>{v.loseSub}</p>
            </div>
            <div style={{ "display": "flex", "justifyContent": "space-between", "flexWrap": "wrap", "gap": "8px", "padding": "14px 18px", "borderRadius": "10px", "background": "#18131F" }}>
              <span style={{ "fontSize": "15px" }}>내 최종 기록: <strong style={{ "color": "var(--lime)" }}>{v.result.my}% ({v.myPtsLabel} pts)</strong></span>
              <span style={{ "fontSize": "15px" }}>내 순위: <strong style={{ "color": "var(--lime)" }}>{v.myRank}위</strong></span>
            </div>
            <div style={{ "flex": "1 1 auto", "minHeight": "0", "overflowY": "auto", "maxHeight": "300px", "border": "1px solid var(--line)", "borderRadius": "10px" }}>
              <div style={{ "position": "sticky", "top": "0", "display": "grid", "gridTemplateColumns": "44px minmax(0,1fr) 108px 52px 76px", "gap": "8px", "padding": "10px 14px", "background": "#1B1824", "fontFamily": "'Poppins',sans-serif", "fontWeight": "600", "fontSize": "11px", "letterSpacing": "0.1em", "color": "var(--sub)" }}>
                <span>RANK</span><span>NICKNAME</span><span>TIER</span><span style={{ "textAlign": "right" }}>TURF</span><span style={{ "textAlign": "right" }}>PTS</span>
              </div>
              <ol style={{ "listStyle": "none", "margin": "0", "padding": "0" }}>
                {(v.board || []).map((r, $index) => (<React.Fragment key={$index}>
                  <li style={{ "display": "grid", "gridTemplateColumns": "44px minmax(0,1fr) 108px 52px 76px", "gap": "8px", "alignItems": "center", "padding": "10px 14px", "borderTop": "1px solid #1E1B25", "fontSize": "14px", "background": r.bg, "color": r.color }}>
                    <span style={{ "fontFamily": "'Poppins',sans-serif", "fontWeight": "700" }}>{r.rank}</span>
                    <span style={{ "fontWeight": r.weight, "overflow": "hidden", "textOverflow": "ellipsis", "whiteSpace": "nowrap" }}>{r.name}</span>
                    <span style={{ "fontSize": "12px", "color": "var(--sub)" }}>{r.tier}</span>
                    <span style={{ "textAlign": "right" }}>{r.pct}%</span>
                    <span style={{ "textAlign": "right", "fontFamily": "'Poppins',sans-serif", "fontWeight": "600" }}>{r.ptsLabel}</span>
                  </li>
                </React.Fragment>))}
              </ol>
            </div>
            <button onClick={v.retry} style={{ "width": "100%", "height": "52px", "border": "0", "borderRadius": "4px", "background": "var(--pink)", "color": "#0A0A0A", "fontWeight": "700", "fontSize": "17px", "cursor": "pointer" }}>다시 도전하기</button>
          </div>
        </div>
      </>) : null}
    
      {v.mClear ? (<>
        <div role="dialog" aria-modal="true" aria-labelledby="clear-title" style={{ "position": "fixed", "inset": "0", "zIndex": "50", "background": "rgba(5,4,8,0.72)", "backdropFilter": "blur(6px)", "WebkitBackdropFilter": "blur(6px)", "display": "grid", "placeItems": "center", "padding": "20px" }}>
          <canvas ref={v.confettiRef} aria-hidden="true" style={{ "position": "absolute", "inset": "0", "width": "100%", "height": "100%", "pointerEvents": "none" }}></canvas>
          <div style={{ "position": "relative", "width": "100%", "maxWidth": "480px", "background": "var(--card)", "border": "2px solid var(--lime)", "borderRadius": "16px", "padding": "40px 32px 32px", "display": "flex", "flexDirection": "column", "alignItems": "center", "gap": "12px", "textAlign": "center" }}>
            <p style={{ "margin": "0", "fontFamily": "'Poppins',sans-serif", "fontWeight": "600", "fontSize": "13px", "letterSpacing": "0.3em", "color": "var(--lime)" }}>ALL ROUNDS CLEAR</p>
            <h2 id="clear-title" style={{ "margin": "0", "fontSize": "30px", "fontWeight": "700" }}>슬라임 영역 점령!</h2>
            <p style={{ "margin": "0", "fontSize": "15px", "lineHeight": "1.6", "color": "var(--sub)" }}>TURF WAR 5라운드를 모두 클리어했습니다.<br />받고 싶은 보상을 선택하세요.</p>
            <div style={{ "width": "100%", "display": "flex", "flexDirection": "column", "gap": "10px", "marginTop": "14px" }}>
              <button onClick={v.getCoupon} style={{ "width": "100%", "height": "54px", "border": "0", "borderRadius": "4px", "background": "var(--lime)", "color": "#0A0A0A", "fontWeight": "700", "fontSize": "17px", "cursor": "pointer" }}>7% 할인쿠폰 받기</button>
              <button onClick={v.getGift} style={{ "width": "100%", "height": "54px", "border": "2px solid var(--lime)", "borderRadius": "4px", "background": "#000", "color": "var(--text)", "fontWeight": "500", "fontSize": "17px", "cursor": "pointer" }}>슬라임 실물 증정품 받기</button>
            </div>
          </div>
        </div>
      </>) : null}
    
      {v.mGift ? (<>
        <div role="dialog" aria-modal="true" aria-labelledby="gift-title" style={{ "position": "fixed", "inset": "0", "zIndex": "60", "background": "rgba(5,4,8,0.78)", "backdropFilter": "blur(6px)", "WebkitBackdropFilter": "blur(6px)", "display": "grid", "placeItems": "center", "padding": "20px" }}>
          <div style={{ "width": "100%", "maxWidth": "440px", "display": "flex", "flexDirection": "column", "alignItems": "center", "gap": "14px", "textAlign": "center" }}>
            <img ref={v.popImgRef} src="assets/products/slime-gift.jpg" alt="슬라임 실물 증정품" style={{ "width": "min(300px,70vw)", "aspectRatio": "1", "objectFit": "cover", "borderRadius": "24px", "border": "3px solid var(--lime)", "display": "block" }} />
            <h2 ref={v.popTextRef} id="gift-title" style={{ "margin": "10px 0 0", "fontFamily": "'Noto Sans KR',sans-serif", "fontWeight": "700", "fontSize": "40px", "color": "var(--lime)", "lineHeight": "1.1" }}>슬라임 증정!!</h2>
            <p style={{ "margin": "0", "fontSize": "15px", "lineHeight": "1.6", "color": "var(--sub)", "textWrap": "pretty" }}>증정품이 장바구니에 담깁니다.</p>
            <button onClick={v.giftReload} style={{ "marginTop": "12px", "width": "100%", "maxWidth": "320px", "height": "54px", "border": "0", "borderRadius": "4px", "background": "var(--lime)", "color": "#0A0A0A", "fontWeight": "700", "fontSize": "17px", "cursor": "pointer" }}>새로고침</button>
          </div>
        </div>
      </>) : null}
    
      {v.mNotice ? (<>
        <div role="dialog" aria-modal="true" aria-labelledby="notice-title" style={{ "position": "fixed", "inset": "0", "zIndex": "60", "background": "rgba(5,4,8,0.72)", "backdropFilter": "blur(6px)", "WebkitBackdropFilter": "blur(6px)", "display": "grid", "placeItems": "center", "padding": "20px" }}>
          <div style={{ "width": "100%", "maxWidth": "420px", "background": "var(--card)", "border": "2px solid var(--lime)", "borderRadius": "16px", "padding": "36px 30px 28px", "display": "flex", "flexDirection": "column", "alignItems": "center", "gap": "12px", "textAlign": "center" }}>
            <h2 id="notice-title" style={{ "margin": "0", "fontSize": "22px", "fontWeight": "700" }}>{v.notice.title}</h2>
            <p style={{ "margin": "0", "fontSize": "15px", "lineHeight": "1.6", "color": "var(--sub)", "textWrap": "pretty" }}>{v.notice.body}</p>
            <button onClick={v.notice.action} style={{ "marginTop": "14px", "width": "100%", "height": "52px", "border": "0", "borderRadius": "4px", "background": "var(--lime)", "color": "#0A0A0A", "fontWeight": "700", "fontSize": "17px", "cursor": "pointer" }}>{v.notice.label}</button>
          </div>
        </div>
      </>) : null}
    
      {v.mMy ? (<>
        <div role="dialog" aria-modal="true" aria-labelledby="my-title" style={{ "position": "fixed", "inset": "0", "zIndex": "55", "background": "rgba(5,4,8,0.72)", "backdropFilter": "blur(6px)", "WebkitBackdropFilter": "blur(6px)", "display": "grid", "placeItems": "center", "padding": "20px" }}>
          <div style={{ "width": "100%", "maxWidth": "520px", "maxHeight": "calc(100vh - 40px)", "overflowY": "auto", "background": "var(--card)", "border": "1px solid #3A3742", "borderRadius": "16px", "padding": "28px", "display": "flex", "flexDirection": "column", "gap": "20px" }}>
            <div style={{ "display": "flex", "alignItems": "flex-start", "justifyContent": "space-between", "gap": "16px" }}>
              <div style={{ "display": "flex", "flexDirection": "column", "gap": "4px" }}>
                <span style={{ "fontFamily": "'Poppins',sans-serif", "fontWeight": "600", "fontSize": "12px", "letterSpacing": "0.3em", "color": "var(--lime)" }}>MY PAGE</span>
                <h2 id="my-title" style={{ "margin": "0", "fontSize": "24px", "fontWeight": "700" }}>쿠폰함</h2>
              </div>
              <button onClick={v.closeMyPage} aria-label="닫기" style={{ "width": "44px", "height": "44px", "margin": "-8px -8px 0 0", "border": "0", "background": "none", "color": "var(--text)", "display": "grid", "placeItems": "center", "cursor": "pointer" }}>
                <svg width="18" height="18" viewBox="0 0 18 18" stroke="currentColor" strokeWidth="2"><line x1="2" y1="2" x2="16" y2="16"></line><line x1="16" y1="2" x2="2" y2="16"></line></svg>
              </button>
            </div>
            {v.noCoupons ? (<>
              <div style={{ "display": "flex", "flexDirection": "column", "alignItems": "center", "gap": "16px", "padding": "28px 8px 8px", "textAlign": "center" }}>
                <p style={{ "margin": "0", "fontSize": "15px", "lineHeight": "1.6", "color": "var(--sub)", "textWrap": "pretty" }}>보유한 쿠폰이 없습니다.<br />TURF WAR 5라운드를 클리어하고 쿠폰을 받아보세요!</p>
                <button onClick={v.goGameFromMy} style={{ "height": "50px", "padding": "0 28px", "border": "0", "borderRadius": "4px", "background": "var(--lime)", "color": "#0A0A0A", "fontWeight": "700", "fontSize": "16px", "cursor": "pointer" }}>게임하러 가기</button>
              </div>
            </>) : null}
            <ul style={{ "listStyle": "none", "margin": "0", "padding": "0", "display": "flex", "flexDirection": "column", "gap": "12px" }}>
              {(v.couponList || []).map((c, $index) => (<React.Fragment key={$index}>
                <li style={{ "display": "flex", "alignItems": "center", "gap": "18px", "padding": "18px 20px", "border": `1px solid ${c.border}`, "borderRadius": "12px", "background": "#15111C", "opacity": c.opacity }}>
                  <span style={{ "fontFamily": "'Poppins',sans-serif", "fontStyle": "italic", "fontWeight": "800", "fontSize": "28px", "color": "var(--lime)", "minWidth": "64px" }}>{c.rate}</span>
                  <div style={{ "flex": "1", "minWidth": "0", "display": "flex", "flexDirection": "column", "gap": "4px" }}>
                    <strong style={{ "fontSize": "16px" }}>{c.name}</strong>
                    <span style={{ "fontSize": "13px", "color": "var(--sub)" }}>발급일 {c.date} · {c.status}</span>
                  </div>
                  <button onClick={c.onUse} disabled={c.used} style={{ "height": "44px", "padding": "0 16px", "border": "0", "borderRadius": "4px", "background": c.btnBg, "color": c.btnColor, "fontWeight": "700", "fontSize": "14px", "cursor": c.cursor, "whiteSpace": "nowrap" }}>{c.btnLabel}</button>
                </li>
              </React.Fragment>))}
            </ul>
          </div>
        </div>
      </>) : null}
    
      {v.mBank ? (<>
        <div role="dialog" aria-modal="true" aria-labelledby="bank-title" style={{ "position": "fixed", "inset": "0", "zIndex": "75", "background": "rgba(5,4,8,0.78)", "backdropFilter": "blur(6px)", "WebkitBackdropFilter": "blur(6px)", "display": "grid", "placeItems": "center", "padding": "20px" }}>
          <div style={{ "width": "100%", "maxWidth": "460px", "maxHeight": "calc(100vh - 40px)", "overflowY": "auto", "background": "var(--card)", "border": "2px solid var(--lime)", "borderRadius": "16px", "padding": "32px 28px 28px", "display": "flex", "flexDirection": "column", "gap": "18px" }}>
            <div style={{ "display": "flex", "flexDirection": "column", "gap": "6px", "textAlign": "center" }}>
              <span style={{ "fontFamily": "'Poppins',sans-serif", "fontWeight": "600", "fontSize": "12px", "letterSpacing": "0.3em", "color": "var(--lime)" }}>BANK TRANSFER</span>
              <h2 id="bank-title" style={{ "margin": "0", "fontSize": "24px", "fontWeight": "700" }}>입금 계좌 안내</h2>
              <p style={{ "margin": "0", "fontSize": "14px", "color": "var(--sub)" }}>아래 계좌로 입금하시면 주문이 확정됩니다.</p>
            </div>
            <div style={{ "display": "flex", "flexDirection": "column", "gap": "10px", "padding": "20px", "borderRadius": "12px", "background": "#15111C", "textAlign": "center" }}>
              <span style={{ "fontSize": "14px", "color": "var(--sub)" }}>{v.bank.bank}</span>
              <strong style={{ "fontFamily": "'Poppins',sans-serif", "fontSize": "26px", "letterSpacing": "0.04em" }}>{v.bank.number}</strong>
              <span style={{ "fontSize": "14px", "color": "var(--sub)" }}>예금주 {v.bank.holder}</span>
              <button onClick={v.copyAccount} style={{ "alignSelf": "center", "marginTop": "6px", "height": "44px", "padding": "0 20px", "border": "1px solid var(--lime)", "borderRadius": "4px", "background": "transparent", "color": "var(--lime)", "fontSize": "15px", "fontWeight": "700", "cursor": "pointer" }}>계좌번호 복사</button>
            </div>
            <dl style={{ "margin": "0", "display": "flex", "flexDirection": "column", "gap": "10px", "fontSize": "15px" }}>
              <div style={{ "display": "flex", "justifyContent": "space-between" }}><dt style={{ "color": "var(--sub)" }}>입금 금액</dt><dd style={{ "margin": "0", "fontFamily": "'Poppins',sans-serif", "fontSize": "20px", "fontWeight": "700", "color": "var(--lime)" }}>{v.pendingOrder.total}</dd></div>
              <div style={{ "display": "flex", "justifyContent": "space-between" }}><dt style={{ "color": "var(--sub)" }}>입금자명</dt><dd style={{ "margin": "0" }}>{v.pendingOrder.depositor}</dd></div>
              <div style={{ "display": "flex", "justifyContent": "space-between" }}><dt style={{ "color": "var(--sub)" }}>입금 기한</dt><dd style={{ "margin": "0" }}>{v.pendingOrder.due}</dd></div>
            </dl>
            <div style={{ "display": "grid", "gridTemplateColumns": "1fr 2fr", "gap": "10px" }}>
              <button onClick={v.closeBank} style={{ "height": "52px", "border": "1px solid #3A3742", "borderRadius": "4px", "background": "transparent", "color": "var(--text)", "fontSize": "15px", "cursor": "pointer" }}>취소</button>
              <button onClick={v.confirmBank} style={{ "height": "52px", "border": "0", "borderRadius": "4px", "background": "var(--lime)", "color": "#0A0A0A", "fontWeight": "700", "fontSize": "16px", "cursor": "pointer" }}>확인하고 주문 완료</button>
            </div>
          </div>
        </div>
      </>) : null}
    
      {v.paying ? (<>
        <div role="status" aria-live="polite" style={{ "position": "fixed", "inset": "0", "zIndex": "80", "background": "rgba(5,4,8,0.78)", "backdropFilter": "blur(6px)", "WebkitBackdropFilter": "blur(6px)", "display": "grid", "placeItems": "center", "padding": "20px" }}>
          <div style={{ "background": "var(--card)", "border": "1px solid #3A3742", "borderRadius": "16px", "padding": "32px 40px", "display": "flex", "flexDirection": "column", "alignItems": "center", "gap": "14px" }}>
            <span ref={v.spinRef} aria-hidden="true" style={{ "width": "40px", "height": "40px", "borderRadius": "50%", "border": "4px solid #2A2830", "borderTopColor": "#8CFF00" }}></span>
            <strong style={{ "fontSize": "16px" }}>{v.methodLabel} 결제 진행 중…</strong>
          </div>
        </div>
      </>) : null}
    
      {v.hasToast ? (<>
        <div role="status" style={{ "position": "fixed", "left": "50%", "bottom": "32px", "transform": "translateX(-50%)", "zIndex": "70", "padding": "14px 22px", "borderRadius": "6px", "background": "var(--lime)", "color": "#0A0A0A", "fontWeight": "700", "fontSize": "15px", "whiteSpace": "nowrap" }}>{v.toast}</div>
      </>) : null}
    </div>
    );
  }
}
