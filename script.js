'use strict';

/* ============================================================
   SMOOTH SCROLL — all internal anchors
   ============================================================ */
document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
  anchor.addEventListener('click', function (e) {
    var href = this.getAttribute('href');
    if (href === '#' || !href) return;

    var target = document.querySelector(href);
    if (!target) return;

    e.preventDefault();

    var headerH = document.querySelector('.header').offsetHeight;
    var top = target.getBoundingClientRect().top + window.pageYOffset - headerH - 16;

    window.scrollTo({ top: top, behavior: 'smooth' });
    closeMobileMenu();
  });
});

/* ============================================================
   HEADER — scroll effect
   ============================================================ */
var header = document.getElementById('header');

window.addEventListener('scroll', function () {
  header.classList.toggle('scrolled', window.scrollY > 24);
}, { passive: true });

/* ============================================================
   MOBILE MENU — burger toggle
   ============================================================ */
var burger = document.getElementById('burger');
var nav    = document.getElementById('nav');

function closeMobileMenu() {
  burger.classList.remove('active');
  nav.classList.remove('active');
  document.body.style.overflow = '';
}

burger.addEventListener('click', function () {
  var isOpen = nav.classList.contains('active');
  if (isOpen) {
    closeMobileMenu();
  } else {
    burger.classList.add('active');
    nav.classList.add('active');
    document.body.style.overflow = 'hidden';
  }
});

/* ============================================================
   SCROLL-IN ANIMATION — IntersectionObserver
   ============================================================ */
if ('IntersectionObserver' in window) {
  var animObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        animObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  document.querySelectorAll('[data-animate]').forEach(function (el) {
    animObserver.observe(el);
  });
} else {
  /* Fallback: show all immediately */
  document.querySelectorAll('[data-animate]').forEach(function (el) {
    el.classList.add('visible');
  });
}

/* ============================================================
   CALCULATOR — price coefficients
   ============================================================ */
var BASE_PRICES = {
  cosmetic: 35000,
  capital:  60000,
  designer: 85000,
  premium:  120000
};

var OBJECT_COEFF = {
  apartment:  1,
  house:      1.15,
  office:     1.1,
  commercial: 1.1
};

var DESIGN_COEFF = {
  yes: 1.1,
  no:  1
};

var MATERIALS_COEFF = {
  work_only:  1,
  work_rough: 1.2,
  work_all:   1.45
};

var URGENCY_COEFF = {
  standard: 1,
  fast:     1.15
};

/* Human-readable labels for CRM payload */
var REPAIR_LABELS = {
  cosmetic: 'Косметический',
  capital:  'Капитальный',
  designer: 'Дизайнерский',
  premium:  'Премиум'
};

var OBJECT_LABELS = {
  apartment:  'Квартира',
  house:      'Дом',
  office:     'Офис',
  commercial: 'Коммерческое помещение'
};

var MATERIALS_LABELS = {
  work_only:  'Только работа',
  work_rough: 'Работа + черновые материалы',
  work_all:   'Работа + все материалы'
};

var URGENCY_LABELS = {
  standard: 'Стандартные сроки',
  fast:     'Нужно быстрее'
};

var DESIGN_LABELS = {
  yes: 'Да',
  no:  'Нет'
};

/* Snapshot of current calculation — used when submitting the lead form */
var calcSnapshot = {
  objectType:     'Квартира',
  area:           60,
  repairType:     'Косметический',
  designProject:  'Нет',
  materials:      'Только работа',
  urgency:        'Стандартные сроки',
  pricePerMeter:  35000,
  estimatedTotal: 2100000
};

function getRadioValue(name) {
  var el = document.querySelector('input[name="' + name + '"]:checked');
  return el ? el.value : null;
}

function formatPrice(num) {
  return num.toLocaleString('ru-RU') + ' ₸';
}

function calculatePrice() {
  var area          = Math.max(0, parseInt(document.getElementById('areaInput').value) || 0);
  var objectType    = getRadioValue('objectType')    || 'apartment';
  var repairType    = getRadioValue('repairType')    || 'cosmetic';
  var designProject = getRadioValue('designProject') || 'no';
  var materials     = getRadioValue('materials')     || 'work_only';
  var urgency       = getRadioValue('urgency')       || 'standard';

  var base        = BASE_PRICES[repairType]    || 35000;
  var objC        = OBJECT_COEFF[objectType]   || 1;
  var designC     = DESIGN_COEFF[designProject]|| 1;
  var matC        = MATERIALS_COEFF[materials] || 1;
  var urgC        = URGENCY_COEFF[urgency]     || 1;

  var pricePerMeter  = Math.round(base * objC * designC * matC * urgC);
  var estimatedTotal = Math.round(pricePerMeter * area);

  /* Update result card */
  document.getElementById('resultTotal').textContent    = formatPrice(estimatedTotal);
  document.getElementById('resultPerM').textContent     = formatPrice(pricePerMeter) + ' / м²';
  document.getElementById('resultArea').textContent     = area + ' м²';
  document.getElementById('resultRepair').textContent   = REPAIR_LABELS[repairType];
  document.getElementById('resultMaterials').textContent= MATERIALS_LABELS[materials];

  /* Snapshot for form submission */
  calcSnapshot = {
    objectType:     OBJECT_LABELS[objectType],
    area:           area,
    repairType:     REPAIR_LABELS[repairType],
    designProject:  DESIGN_LABELS[designProject],
    materials:      MATERIALS_LABELS[materials],
    urgency:        URGENCY_LABELS[urgency],
    pricePerMeter:  pricePerMeter,
    estimatedTotal: estimatedTotal
  };
}

/* Attach calculator listeners */
document.getElementById('areaInput').addEventListener('input', calculatePrice);
document.querySelectorAll('#calculatorForm input[type="radio"]').forEach(function (radio) {
  radio.addEventListener('change', calculatePrice);
});

/* Run once on load */
calculatePrice();

/* ============================================================
   PHONE FORMAT — auto-format as user types
   ============================================================ */
document.getElementById('leadPhone').addEventListener('input', function () {
  var raw    = this.value.replace(/\D/g, '');
  var result = '';

  if (raw.startsWith('8')) raw = '7' + raw.slice(1);
  if (!raw.startsWith('7') && raw.length > 0) raw = '7' + raw;

  if (raw.length === 0) { this.value = ''; return; }

  result = '+' + raw.charAt(0);
  if (raw.length > 1)  result += ' (' + raw.substring(1, 4);
  if (raw.length >= 4) result += ') ' + raw.substring(4, 7);
  if (raw.length >= 7) result += '-' + raw.substring(7, 9);
  if (raw.length >= 9) result += '-' + raw.substring(9, 11);

  this.value = result;
});

/* ============================================================
   LEAD FORM — duplicate protection via localStorage
   ============================================================ */
var STORAGE_KEY = 'sm_submitted_phones';

function getSubmittedPhones() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
  catch (e) { return []; }
}

function markPhoneSubmitted(phone) {
  var normalized = phone.replace(/\D/g, '');
  var phones     = getSubmittedPhones();
  if (!phones.includes(normalized)) {
    phones.push(normalized);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(phones)); } catch (e) {}
  }
}

function isPhoneAlreadySubmitted(phone) {
  var normalized = phone.replace(/\D/g, '');
  return getSubmittedPhones().includes(normalized);
}

/* ============================================================
   LEAD FORM — validation helpers
   ============================================================ */
function validateName(name) {
  return name.trim().length >= 2;
}

function validatePhone(phone) {
  return phone.replace(/\D/g, '').length >= 10;
}

function setFieldError(inputId, errorId, hasError) {
  var input = document.getElementById(inputId);
  var error = document.getElementById(errorId);
  if (hasError) {
    input.classList.add('error');
    error.classList.add('visible');
  } else {
    input.classList.remove('error');
    error.classList.remove('visible');
  }
}

function hideAllMessages() {
  ['formSuccess', 'formError', 'formDuplicate'].forEach(function (id) {
    document.getElementById(id).style.display = 'none';
  });
}

function showMessage(id) {
  hideAllMessages();
  document.getElementById(id).style.display = 'flex';
}

/* ============================================================
   LEAD FORM — submit handler
   ============================================================ */
document.getElementById('leadForm').addEventListener('submit', async function (e) {
  e.preventDefault();

  var nameVal    = document.getElementById('leadName').value.trim();
  var phoneVal   = document.getElementById('leadPhone').value.trim();
  var commentVal = document.getElementById('leadComment').value.trim();

  /* Validate */
  var nameOk  = validateName(nameVal);
  var phoneOk = validatePhone(phoneVal);

  setFieldError('leadName',  'nameError',  !nameOk);
  setFieldError('leadPhone', 'phoneError', !phoneOk);

  if (!nameOk || !phoneOk) return;

  /* Duplicate guard */
  if (isPhoneAlreadySubmitted(phoneVal)) {
    showMessage('formDuplicate');
    return;
  }

  /* Loading state */
  var submitBtn = document.getElementById('leadSubmit');
  submitBtn.querySelector('.btn__text').style.display   = 'none';
  submitBtn.querySelector('.btn__loader').style.display = 'inline';
  submitBtn.disabled = true;
  hideAllMessages();

  var payload = {
    name:           nameVal,
    phone:          phoneVal,
    comment:        commentVal,
    objectType:     calcSnapshot.objectType,
    area:           calcSnapshot.area,
    repairType:     calcSnapshot.repairType,
    designProject:  calcSnapshot.designProject,
    materials:      calcSnapshot.materials,
    urgency:        calcSnapshot.urgency,
    pricePerMeter:  calcSnapshot.pricePerMeter,
    estimatedTotal: calcSnapshot.estimatedTotal,
    source:         'website_calculator',
    createdAt:      new Date().toISOString()
  };

  try {
    var res  = await fetch('/api/save-lead', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload)
    });

    var data = await res.json();

    if (data.success) {
      markPhoneSubmitted(phoneVal);
      document.getElementById('leadForm').style.display = 'none';
      showMessage('formSuccess');
    } else {
      showMessage('formError');
    }
  } catch (err) {
    showMessage('formError');
  } finally {
    submitBtn.querySelector('.btn__text').style.display   = 'inline';
    submitBtn.querySelector('.btn__loader').style.display = 'none';
    submitBtn.disabled = false;
  }
});

/* Clear field errors on input */
document.getElementById('leadName').addEventListener('input', function () {
  if (validateName(this.value)) setFieldError('leadName', 'nameError', false);
});
document.getElementById('leadPhone').addEventListener('input', function () {
  if (validatePhone(this.value)) setFieldError('leadPhone', 'phoneError', false);
});

/* ============================================================
   FAQ ACCORDION
   ============================================================ */
document.querySelectorAll('.faq-item__q').forEach(function (btn) {
  btn.addEventListener('click', function () {
    var item   = this.closest('.faq-item');
    var isOpen = item.classList.contains('open');

    /* Close all items */
    document.querySelectorAll('.faq-item').forEach(function (i) {
      i.classList.remove('open');
      i.querySelector('.faq-item__q').setAttribute('aria-expanded', 'false');
    });

    /* Open the clicked item unless it was already open */
    if (!isOpen) {
      item.classList.add('open');
      this.setAttribute('aria-expanded', 'true');
    }
  });
});
