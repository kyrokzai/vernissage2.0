/**
 * Квиз-калькулятор: 5 шагов, проверка ответов, маска телефона +7, сводка,
 * ориентировочный расчёт по ставке из данных сайта и готовое сообщение для WhatsApp.
 * Сервера заявок нет: заявка уходит только через WhatsApp по кнопке посетителя.
 */
export function initQuiz() {
  const d = document;
  const card = d.getElementById('quiz-card');
  const form = d.getElementById('quiz-form') as HTMLFormElement | null;
  if (!card || !form) return;
  const RATE = Number(card.dataset.rate) || 0;
  const WA = card.dataset.wa || '';
  const $ = <T extends HTMLElement>(id: string) => d.getElementById(id) as T;
  const steps = [...form.querySelectorAll<HTMLFieldSetElement>('.qstep')];
  const prog = $('q-prog'), bar = prog.parentElement!, label = $('q-label');
  const back = $<HTMLButtonElement>('q-back'), next = $<HTMLButtonElement>('q-next');
  const area = $<HTMLInputElement>('area'), areaNum = $<HTMLInputElement>('area-num');
  const nameEl = $<HTMLInputElement>('q-name'), phoneEl = $<HTMLInputElement>('q-phone'), consent = $<HTMLInputElement>('q-consent');
  const svcAll = $<HTMLInputElement>('svc-all');
  const svcs = [...form.querySelectorAll<HTMLInputElement>('input[name=service]')];
  let cur = 0;

  const digits = (s: string) => (s || '').replace(/\D/g, '');
  function fmtPhone(dg: string) {
    if (!dg) return '';
    if (dg[0] === '8') dg = '7' + dg.slice(1);
    if (dg[0] !== '7') dg = '7' + dg;
    // после автоподстановки «+7 (» посетитель часто вводит номер целиком: 8 707… или 7 707…
    if (dg[1] === '8' || (dg.length > 11 && dg[1] === '7')) dg = '7' + dg.slice(2);
    dg = dg.slice(0, 11);
    let o = '+7';
    if (dg.length > 1) o += ' (' + dg.slice(1, 4);
    if (dg.length >= 4) o += ') ' + dg.slice(4, 7);
    if (dg.length >= 7) o += '-' + dg.slice(7, 9);
    if (dg.length >= 9) o += '-' + dg.slice(9, 11);
    return o;
  }
  const checkedVal = (name: string) => (form.querySelector<HTMLInputElement>(`input[name=${name}]:checked`)?.value) || '';
  const services = () => svcs.filter((s) => s.checked).map((s) => s.value);

  /** Ошибки шага: пустой массив — шаг заполнен верно. */
  function errors(i: number): [string, string][] {
    const e: [string, string][] = [];
    if (i === 0 && !checkedVal('object')) e.push(['', 'Выберите тип объекта']);
    if (i === 1 && !services().length) e.push(['', 'Отметьте хотя бы одну услугу']);
    if (i === 2) { const a = Number(areaNum.value); if (!(a >= 20 && a <= 1000)) e.push(['area-err', 'Укажите площадь от 20 до 1000 м²']); }
    if (i === 3 && !checkedVal('when')) e.push(['', 'Выберите срок начала']);
    if (i === 4) {
      if (nameEl.value.trim().length < 2) e.push(['name-err', 'Введите имя, хотя бы две буквы']);
      if (digits(phoneEl.value).length !== 11) e.push(['phone-err', 'Введите номер полностью: +7 и 10 цифр']);
      if (!consent.checked) e.push(['', 'Нужно согласие на обработку данных']);
    }
    return e;
  }
  const isValid = (i: number) => errors(i).length === 0;
  function clearErr() { form!.querySelectorAll('.q-err').forEach((p) => (p.textContent = '')); form!.querySelectorAll('[aria-invalid]').forEach((n) => n.removeAttribute('aria-invalid')); hint.textContent = ''; }
  const hint = d.createElement('p'); hint.className = 'q-err q-err-nav'; hint.setAttribute('aria-live', 'polite');
  $('q-nav').after(hint);
  function showErr() {
    clearErr();
    const e = errors(cur);
    const general: string[] = [];
    e.forEach(([id, msg]) => {
      if (id) { $(id).textContent = msg; const inp = $(id).closest('.field, .area-box')?.querySelector('input'); inp?.setAttribute('aria-invalid', 'true'); }
      else general.push(msg);
    });
    hint.textContent = general.join('. ');
    const firstBad = form!.querySelector<HTMLElement>('[aria-invalid=true]');
    if (firstBad) firstBad.focus();
    card!.classList.remove('shake'); void card!.offsetWidth; card!.classList.add('shake');
  }
  function refresh() { next.setAttribute('aria-disabled', String(!isValid(cur))); }
  function show(i: number, focus: boolean) {
    cur = i;
    clearErr();
    steps.forEach((s, k) => { s.hidden = k !== i; });
    prog.style.width = ((i + 1) / steps.length) * 100 + '%';
    bar.setAttribute('aria-valuenow', String(i + 1));
    label.textContent = 'Шаг ' + (i + 1) + ' из ' + steps.length;
    back.hidden = i === 0;
    next.textContent = i === steps.length - 1 ? 'Получить расчёт' : 'Далее';
    refresh();
    if (focus) steps[i].querySelector<HTMLElement>('legend')?.focus({ preventScroll: true });
  }

  form.addEventListener('change', (e) => {
    const t = e.target as HTMLInputElement;
    if (t === svcAll) svcs.forEach((s) => { s.checked = svcAll.checked; });
    else if (t.name === 'service') svcAll.checked = svcs.every((s) => s.checked);
    refresh();
    if (errors(cur).length === 0) clearErr();
    // одиночный выбор — автоматически на следующий шаг
    if (t.type === 'radio' && isValid(cur)) {
      const at = cur;
      setTimeout(() => { if (cur === at && isValid(cur) && cur < steps.length - 1) show(cur + 1, true); }, 280);
    }
  });
  form.addEventListener('input', (e) => {
    const t = e.target as HTMLInputElement;
    if (t === area) areaNum.value = area.value;
    if (t === areaNum) { const v = Number(areaNum.value); if (v) area.value = String(Math.min(400, Math.max(20, v))); }
    if (t === phoneEl) {
      const dg = digits(phoneEl.value);
      phoneEl.value = dg === '7' && (e as InputEvent).inputType === 'deleteContentBackward' ? '' : fmtPhone(dg);
    }
    refresh();
    const ownErr = t.getAttribute('aria-describedby');
    if (ownErr && t.hasAttribute('aria-invalid') && !errors(cur).some(([id]) => id === ownErr)) { $(ownErr).textContent = ''; t.removeAttribute('aria-invalid'); }
  });
  phoneEl.addEventListener('focus', () => { if (!phoneEl.value) phoneEl.value = '+7 ('; });
  phoneEl.addEventListener('blur', () => { if (digits(phoneEl.value).length <= 1) phoneEl.value = ''; });
  back.addEventListener('click', () => { if (cur > 0) show(cur - 1, true); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!isValid(cur)) { showErr(); return; }
    if (cur < steps.length - 1) { show(cur + 1, true); return; }
    finish();
  });

  const money = (n: number) => (Math.round(n / 1000) * 1000).toLocaleString('ru-RU').replace(/ /g, ' ') + ' ₸';

  function finish() {
    const data = {
      object: checkedVal('object'),
      services: services(),
      area: Number(areaNum.value),
      when: checkedVal('when'),
      name: nameEl.value.trim(),
      phone: fmtPhone(digits(phoneEl.value)),
    };
    const rows: [string, string][] = [
      ['Объект', data.object], ['Что нужно', data.services.join(', ')], ['Площадь', data.area + ' м²'],
      ['Старт', data.when], ['Имя', data.name], ['Телефон', data.phone],
    ];
    const sum = $('r-sum');
    sum.replaceChildren(...rows.map(([k, v]) => {
      const row = d.createElement('div'), dt = d.createElement('dt'), dd = d.createElement('dd');
      dt.textContent = k; dd.textContent = v; row.append(dt, dd); return row;
    }));
    const est = $('r-est');
    let estLine = '';
    if (data.services.includes('Ремонт') && RATE) {
      const v = 'Ремонт от ' + money(data.area * RATE);
      $('r-est-val').textContent = v;
      $('r-est-note').textContent = `Ориентир по минимальной ставке от ${money(RATE)} за м². Это не окончательная смета: точную стоимость подготовим после бесплатного замера и зафиксируем в договоре.`;
      est.hidden = false;
      estLine = '\nОриентир с сайта: ' + v.toLowerCase() + ' (предварительно)';
    } else est.hidden = true;
    const msg = 'Здравствуйте! Заявка с сайта Vernissage.\n' +
      'Объект: ' + data.object + '\n' + 'Что нужно: ' + data.services.join(', ') + '\n' +
      'Площадь: ' + data.area + ' м²\n' + 'Старт: ' + data.when + '\n' +
      'Имя: ' + data.name + '\n' + 'Телефон: ' + data.phone + estLine;
    ($('r-wa') as HTMLAnchorElement).href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(msg);
    $('r-title').textContent = data.name + ', ответы приняты';
    $('r-text').textContent = 'Отправьте заявку в WhatsApp, и менеджер пришлёт предварительную смету и подборку похожих проектов.';
    form!.hidden = true; hint.textContent = '';
    $('q-result').hidden = false;
    card!.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    $('r-title').focus({ preventScroll: true });
  }

  $('r-again').addEventListener('click', () => {
    form.reset();
    area.value = '80'; areaNum.value = '80';
    $('q-result').hidden = true; form.hidden = false;
    show(0, true);
  });

  /** Выбор услуги извне (полоса услуг, карточки, галерея). */
  d.addEventListener('vn:pick', (e) => {
    const pick = (e as CustomEvent<{ value: string; text: string }>).detail;
    if (!$('q-result').hidden) $('r-again').click();
    let target: HTMLInputElement | null = null;
    svcs.forEach((b) => { b.checked = b.value === pick.value; if (b.checked) target = b; });
    svcAll.checked = false;
    if (target) (target as HTMLInputElement).dispatchEvent(new Event('change', { bubbles: true }));
    let chip = d.getElementById('q-pick');
    if (!chip) { chip = d.createElement('p'); chip.id = 'q-pick'; chip.className = 'q-pick'; card.insertBefore(chip, card.firstChild); }
    chip.textContent = 'Вы выбрали: ' + pick.text;
    chip.classList.remove('flash'); void chip.offsetWidth; chip.classList.add('flash');
    card.classList.remove('pulse'); void card.offsetWidth; card.classList.add('pulse');
    setTimeout(() => card.classList.remove('pulse'), 2300);
  });

  show(0, false);
}
