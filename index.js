document.addEventListener('DOMContentLoaded', () => {
  let lastActiveElement = null;
  // --- Header Scroll Effect ---
  const header = document.querySelector('.global-header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // --- Mobile Navigation Menu Toggle ---
  const mobileToggle = document.querySelector('.mobile-toggle');
  const navMenu = document.querySelector('.nav-menu');
  
  if (mobileToggle && navMenu) {
    mobileToggle.addEventListener('click', () => {
      const isExpanded = mobileToggle.getAttribute('aria-expanded') === 'true';
      mobileToggle.setAttribute('aria-expanded', !isExpanded);
      navMenu.classList.toggle('open');
    });

    // Close menu when a link is clicked
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        mobileToggle.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('open');
      });
    });

    // Close menu when Escape key is pressed
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navMenu.classList.contains('open')) {
        mobileToggle.setAttribute('aria-expanded', 'false');
        navMenu.classList.remove('open');
        mobileToggle.focus();
      }
    });
  }

  // --- Active Nav Link Highlighting on Scroll ---
  const sections = document.querySelectorAll('section, header');
  const navLinks = document.querySelectorAll('.nav-link');
  
  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;
      // Offset to trigger earlier
      if (window.scrollY >= (sectionTop - 150)) {
        current = section.getAttribute('id');
      }
    });

    navLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href').slice(1) === current) {
        link.classList.add('active');
      }
    });
  });

  // --- Secure Consultation Form Validation ---
  const form = document.getElementById('consultation-form');
  if (form) {
    const nameInput = document.getElementById('full-name');
    const emailInput = document.getElementById('email-address');
    const phoneInput = document.getElementById('phone-number');
    const smsCheckbox = document.getElementById('sms-opt-in');
    
    const nameError = document.getElementById('name-error');
    const emailError = document.getElementById('email-error');
    const phoneError = document.getElementById('phone-error');
    const smsError = document.getElementById('sms-error');

    // Phone pattern validation: standard US phones 10+ digits
    const phoneRegex = /^[\d\-\*\+\(\)\s]{10,}$/;
    // Basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    // Field validation logic
    function validateName() {
      if (!nameInput.value.trim()) {
        nameError.textContent = 'Name is required.';
        nameInput.classList.add('invalid');
        nameInput.setAttribute('aria-invalid', 'true');
        return false;
      }
      nameError.textContent = '';
      nameInput.classList.remove('invalid');
      nameInput.setAttribute('aria-invalid', 'false');
      return true;
    }

    function validateEmail() {
      const val = emailInput.value.trim();
      if (!val) {
        emailError.textContent = 'Email is required.';
        emailInput.classList.add('invalid');
        emailInput.setAttribute('aria-invalid', 'true');
        return false;
      } else if (!emailRegex.test(val)) {
        emailError.textContent = 'Please enter a valid email address.';
        emailInput.classList.add('invalid');
        emailInput.setAttribute('aria-invalid', 'true');
        return false;
      }
      emailError.textContent = '';
      emailInput.classList.remove('invalid');
      emailInput.setAttribute('aria-invalid', 'false');
      return true;
    }

    function validatePhone() {
      const val = phoneInput.value.trim();
      if (!val) {
        phoneError.textContent = 'Phone number is required.';
        phoneInput.classList.add('invalid');
        phoneInput.setAttribute('aria-invalid', 'true');
        return false;
      } else if (!phoneRegex.test(val)) {
        phoneError.textContent = 'Please enter a valid phone number (minimum 10 digits).';
        phoneInput.classList.add('invalid');
        phoneInput.setAttribute('aria-invalid', 'true');
        return false;
      }
      phoneError.textContent = '';
      phoneInput.classList.remove('invalid');
      phoneInput.setAttribute('aria-invalid', 'false');
      return true;
    }

    function validateSMS() {
      if (!smsCheckbox.checked) {
        smsError.textContent = 'You must select one of the opt-in options to submit.';
        smsCheckbox.setAttribute('aria-invalid', 'true');
        return false;
      }
      smsError.textContent = '';
      smsCheckbox.setAttribute('aria-invalid', 'false');
      return true;
    }

    // Attach Validation on BLUR (when exiting field) to avoid premature warnings
    nameInput.addEventListener('blur', validateName);
    emailInput.addEventListener('blur', validateEmail);
    phoneInput.addEventListener('blur', validatePhone);
    smsCheckbox.addEventListener('change', validateSMS);

    // Clear Errors on INPUT as soon as user types to correct
    nameInput.addEventListener('input', () => {
      if (nameInput.value.trim()) {
        nameError.textContent = '';
        nameInput.classList.remove('invalid');
        nameInput.setAttribute('aria-invalid', 'false');
      }
    });
    
    emailInput.addEventListener('input', () => {
      if (emailRegex.test(emailInput.value.trim())) {
        emailError.textContent = '';
        emailInput.classList.remove('invalid');
        emailInput.setAttribute('aria-invalid', 'false');
      }
    });

    phoneInput.addEventListener('input', () => {
      if (phoneRegex.test(phoneInput.value.trim())) {
        phoneError.textContent = '';
        phoneInput.classList.remove('invalid');
        phoneInput.setAttribute('aria-invalid', 'false');
      }
    });

    // Form Submission Handler
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Trigger all validations
      const isNameValid = validateName();
      const isEmailValid = validateEmail();
      const isPhoneValid = validatePhone();
      const isSMSValid = validateSMS();

      if (isNameValid && isEmailValid && isPhoneValid && isSMSValid) {
        // Disable submit button to prevent double submission
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        const btnText = submitBtn.querySelector('span');
        const origText = btnText.textContent;
        btnText.textContent = 'Submitting Securing Request...';

        // Simulate form submission (e.g. AJAX POST)
        setTimeout(() => {
          // Success Action
          showToast();
          form.reset();
          submitBtn.disabled = false;
          btnText.textContent = origText;
        }, 1500);
      } else {
        // Focus on the first invalid field
        if (!isNameValid) {
          nameInput.focus();
        } else if (!isEmailValid) {
          emailInput.focus();
        } else if (!isPhoneValid) {
          phoneInput.focus();
        }
      }
    });
  }

  // --- Success Toast Notification Manager ---
  function showToast() {
    const toast = document.getElementById('toast-notification');
    if (toast) {
      toast.classList.add('show');
      toast.setAttribute('aria-hidden', 'false');
      
      // Auto-hide toast after 5 seconds
      setTimeout(() => {
        toast.classList.remove('show');
        toast.setAttribute('aria-hidden', 'true');
      }, 5000);
    }
  }

  // --- Dynamic Copyright Year ---
  const yearSpan = document.getElementById('current-year');
  if (yearSpan) {
    yearSpan.textContent = new Date().getFullYear();
  }

  // --- FAQ Accordion Interactive Logic ---
  const faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach(question => {
    question.addEventListener('click', () => {
      const item = question.closest('.faq-item');
      const answer = item.querySelector('.faq-answer');
      const isOpen = item.classList.contains('open');

      // Close other open FAQ items first (accordion behavior)
      document.querySelectorAll('.faq-item.open').forEach(openItem => {
        if (openItem !== item) {
          openItem.classList.remove('open');
          const openQuestion = openItem.querySelector('.faq-question');
          const openAnswer = openItem.querySelector('.faq-answer');
          openQuestion.setAttribute('aria-expanded', 'false');
          openAnswer.setAttribute('aria-hidden', 'true');
          openAnswer.style.maxHeight = null;
        }
      });

      // Toggle current item
      if (isOpen) {
        item.classList.remove('open');
        question.setAttribute('aria-expanded', 'false');
        answer.setAttribute('aria-hidden', 'true');
        answer.style.maxHeight = null;
      } else {
        item.classList.add('open');
        question.setAttribute('aria-expanded', 'true');
        answer.setAttribute('aria-hidden', 'false');
        // Retrieve internal scroll height and animate max-height dynamically
        const contentHeight = answer.scrollHeight;
        answer.style.maxHeight = contentHeight + 'px';
      }
    });
  });

  // --- Policy Modals Interactive Logic (HTML5 <dialog>) ---
  const policyModal = document.getElementById('policy-modal');
  const modalTitle = document.getElementById('modal-title');
  const modalBody = document.getElementById('modal-body');
  const closeBtn = document.getElementById('policy-modal-close');

  const policyTitles = {
    'privacy-policy': 'Privacy Policy',
    'terms-and-conditions': 'Terms and Conditions',
    'cookie-policy': 'Cookie Policy'
  };

  function openPolicy(hash) {
    const policyKey = hash.replace('#', '');
    const template = document.getElementById(`content-${policyKey}`);
    if (template && policyTitles[policyKey] && policyModal) {
      lastActiveElement = document.activeElement;
      modalTitle.textContent = policyTitles[policyKey];
      modalBody.innerHTML = template.innerHTML;
      policyModal.showModal();
      document.body.classList.add('modal-open');
      if (closeBtn) closeBtn.focus();
    }
  }

  function closePolicy() {
    if (policyModal) {
      policyModal.close();
      document.body.classList.remove('modal-open');
      if (window.location.hash) {
        history.replaceState(null, null, ' ');
      }
      if (lastActiveElement) {
        lastActiveElement.focus();
        lastActiveElement = null;
      }
    }
  }

  // Intercept clicks on policy links
  const policyLinks = document.querySelectorAll('a[href^="#privacy-policy"], a[href^="#terms-and-conditions"], a[href^="#cookie-policy"]');
  policyLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const hash = link.getAttribute('href');
      history.pushState(null, null, hash);
      openPolicy(hash);
    });
  });

  // Attach close event handlers
  if (closeBtn) closeBtn.addEventListener('click', closePolicy);

  // Close when native dialog fires 'close' event (e.g. via Esc key)
  if (policyModal) {
    policyModal.addEventListener('close', () => {
      document.body.classList.remove('modal-open');
    });
  }

  // Fallback for light-dismiss (clicking outside the dialog content box)
  if (policyModal && !('closedBy' in HTMLDialogElement.prototype)) {
    policyModal.addEventListener('click', (event) => {
      if (event.target !== policyModal) return;
      const rect = policyModal.getBoundingClientRect();
      const isInside = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );
      if (!isInside) {
        closePolicy();
      }
    });
  }

  // Check URL hash on page load to open directly if linked
  if (window.location.hash) {
    const hash = window.location.hash;
    if (hash === '#privacy-policy' || hash === '#terms-and-conditions' || hash === '#cookie-policy') {
      setTimeout(() => openPolicy(hash), 150);
    }
  }

  // --- Day / Night Theme Toggler ---
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    const storedTheme = localStorage.getItem('theme');
    const initialNightMode = storedTheme === 'dark';
    
    if (initialNightMode) {
      document.documentElement.classList.add('night-theme');
    }
    
    themeToggle.addEventListener('click', () => {
      const isNight = document.documentElement.classList.toggle('night-theme');
      localStorage.setItem('theme', isNight ? 'dark' : 'light');
    });
  }
});

// ============================================================
// SCROLL-REVEAL & TRUST BAR ANIMATION (IntersectionObserver)
// ============================================================
(function initScrollReveal() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  // Auto-apply reveal to all service cards, team cards, credential items, testimonial cards, trust bar items
  const revealTargets = document.querySelectorAll(
    '.service-card, .team-card, .credential-item, .testimonial-card, .trust-bar-item, .timeline-item, .coverage-card, .reveal-on-scroll'
  );
  revealTargets.forEach(el => {
    el.classList.add('reveal-on-scroll');
    observer.observe(el);
  });

  // Trust bar items — staggered reveal
  document.querySelectorAll('.trust-bar-item').forEach((item, i) => {
    item.style.transitionDelay = `${i * 0.1}s`;
    observer.observe(item);
  });

  // Timeline items — staggered reveal
  document.querySelectorAll('.timeline-item').forEach((item, i) => {
    item.style.transitionDelay = `${i * 0.15}s`;
  });

  // Coverage cards — staggered reveal
  document.querySelectorAll('.coverage-card').forEach((card, i) => {
    card.style.transitionDelay = `${(i % 4) * 0.08}s`; // Modulo to stagger by row
  });
})();

// ============================================================
// COUNT-UP ANIMATION FOR CREDENTIAL STATS
// ============================================================
(function initCountUp() {
  const stats = document.querySelectorAll('.credential-number');
  if (!stats.length) return;

  function countUp(el) {
    const text = el.textContent.trim();
    const numMatch = text.match(/[\d,]+/);
    if (!numMatch) return;
    const end = parseInt(numMatch[0].replace(',', ''), 10);
    const suffix = text.replace(/[\d,]+/, '');
    const duration = 1400;
    const step = Math.ceil(end / (duration / 16));
    let current = 0;
    const timer = setInterval(() => {
      current = Math.min(current + step, end);
      el.textContent = current + suffix;
      if (current >= end) clearInterval(timer);
    }, 16);
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        countUp(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  stats.forEach(stat => observer.observe(stat));
})();

// ============================================================
// TESTIMONIALS CAROUSEL
// ============================================================
(function initTestimonialsCarousel() {
  const track = document.getElementById('testimonial-track');
  const dotsContainer = document.getElementById('carousel-dots');
  const prevBtn = document.getElementById('testimonial-prev');
  const nextBtn = document.getElementById('testimonial-next');

  if (!track || !dotsContainer || !prevBtn || !nextBtn) return;

  const cards = Array.from(track.querySelectorAll('.testimonial-card'));
  let current = 0;
  let autoplayTimer;

  // Determine visible cards based on viewport
  function getVisibleCount() {
    if (window.innerWidth <= 600) return 1;
    if (window.innerWidth <= 900) return 2;
    return 3;
  }

  function getTotalSlides() {
    return Math.max(1, cards.length - getVisibleCount() + 1);
  }

  // Build dots
  function buildDots() {
    dotsContainer.innerHTML = '';
    const total = getTotalSlides();
    for (let i = 0; i < total; i++) {
      const dot = document.createElement('button');
      dot.className = 'carousel-dot' + (i === current ? ' active' : '');
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Go to testimonial ${i + 1}`);
      dot.setAttribute('aria-selected', i === current ? 'true' : 'false');
      dot.setAttribute('tabindex', i === current ? '0' : '-1');
      dot.addEventListener('click', () => goTo(i));
      dotsContainer.appendChild(dot);
    }
  }

  function updateDots() {
    const dots = dotsContainer.querySelectorAll('.carousel-dot');
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === current);
      dot.setAttribute('aria-selected', i === current ? 'true' : 'false');
      dot.setAttribute('tabindex', i === current ? '0' : '-1');
    });
  }

  function goTo(index) {
    const total = getTotalSlides();
    current = Math.max(0, Math.min(index, total - 1));
    const cardWidth = cards[0].offsetWidth + 24; // 24 = gap in px (1.5rem)
    track.style.transform = `translateX(-${current * cardWidth}px)`;
    updateDots();
    resetAutoplay();
  }

  function goNext() {
    const total = getTotalSlides();
    goTo(current < total - 1 ? current + 1 : 0);
  }

  function goPrev() {
    const total = getTotalSlides();
    goTo(current > 0 ? current - 1 : total - 1);
  }

  function resetAutoplay() {
    clearInterval(autoplayTimer);
    autoplayTimer = setInterval(goNext, 5500);
  }

  prevBtn.addEventListener('click', goPrev);
  nextBtn.addEventListener('click', goNext);

  // Touch/swipe support
  let touchStartX = 0;
  track.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? goNext() : goPrev();
  }, { passive: true });

  // Pause on hover
  track.addEventListener('mouseenter', () => clearInterval(autoplayTimer));
  track.addEventListener('mouseleave', resetAutoplay);

  // Pause on keyboard focus
  const carouselContainer = document.querySelector('.testimonials-carousel');
  if (carouselContainer) {
    carouselContainer.addEventListener('focusin', () => clearInterval(autoplayTimer));
    carouselContainer.addEventListener('focusout', resetAutoplay);
  }

  // Keyboard navigation for dots (arrow keys)
  dotsContainer.addEventListener('keydown', (e) => {
    const dots = Array.from(dotsContainer.querySelectorAll('.carousel-dot'));
    const activeIndex = dots.indexOf(document.activeElement);
    if (activeIndex === -1) return;
    
    let nextIndex;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      nextIndex = (activeIndex + 1) % dots.length;
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      nextIndex = (activeIndex - 1 + dots.length) % dots.length;
    } else {
      return;
    }
    
    dots[nextIndex].focus();
    goTo(nextIndex);
    e.preventDefault();
  });

  // Keyboard navigation for prev/next buttons
  prevBtn.addEventListener('keydown', e => e.key === 'Enter' && goPrev());
  nextBtn.addEventListener('keydown', e => e.key === 'Enter' && goNext());

  // Rebuild on resize
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      buildDots();
      goTo(0);
    }, 250);
  });

  // Init
  buildDots();
  resetAutoplay();
})();

// ============================================================
// SEAMLESS TICKER — clone items so loop never shows a gap
// ============================================================
(function initTicker() {
  const track = document.getElementById('ticker-track');
  if (!track) return;

  // Clone the entire inner content and append it
  // so translateX(-50%) lands exactly back at the start
  const clone = track.cloneNode(true);
  clone.setAttribute('aria-hidden', 'true');
  track.parentElement.appendChild(clone);

  // Combine both sets into one track for the CSS animation
  // by moving all clone children into the original track
  Array.from(clone.children).forEach(child => {
    const childClone = child.cloneNode(true);
    childClone.setAttribute('aria-hidden', 'true');
    track.appendChild(childClone);
  });
  clone.remove();
})();

// ============================================================
// PREMIUM ZELLE PAYMENT MODAL INTERACTION
// ============================================================
(function initZelleModal() {
  const triggerBtn = document.getElementById('zelle-trigger-btn');
  const modal = document.getElementById('zelle-modal');
  const closeBtn = document.getElementById('close-zelle-btn');
  const copyBtn = document.getElementById('copy-zelle-email-btn');
  const emailTextEl = document.getElementById('zelle-email-text');

  if (!triggerBtn || !modal || !closeBtn) return;

  // Open Modal
  triggerBtn.addEventListener('click', () => {
    lastActiveElement = document.activeElement;
    modal.showModal();
    document.body.classList.add('modal-open');
    if (closeBtn) closeBtn.focus();
  });

  // Close Modal Function
  const closeModal = () => {
    modal.close();
    document.body.classList.remove('modal-open');
    if (lastActiveElement) {
      lastActiveElement.focus();
      lastActiveElement = null;
    }
  };

  closeBtn.addEventListener('click', closeModal);

  // Close when native dialog fires 'close' event (e.g. via Esc key)
  modal.addEventListener('close', () => {
    document.body.classList.remove('modal-open');
    if (lastActiveElement) {
      lastActiveElement.focus();
      lastActiveElement = null;
    }
  });

  // Copy Email to Clipboard with micro-animation
  if (copyBtn && emailTextEl) {
    const copyText = copyBtn.querySelector('.copy-btn-text');
    let isCopying = false;

    copyBtn.addEventListener('click', async () => {
      if (isCopying) return;
      isCopying = true;

      const emailAddress = emailTextEl.textContent.trim();

      try {
        await navigator.clipboard.writeText(emailAddress);
        copyBtn.classList.add('copied');
        if (copyText) copyText.textContent = 'Copied!';

        setTimeout(() => {
          copyBtn.classList.remove('copied');
          if (copyText) copyText.textContent = 'Copy';
          isCopying = false;
        }, 2000);
      } catch (err) {
        console.error('Failed to copy text: ', err);
        isCopying = false;
      }
    });
  }

  // Fallback for light-dismiss (clicking outside the dialog content box)
  // for browsers that do not support native `closedby` attribute yet (like Safari)
  if (!('closedBy' in HTMLDialogElement.prototype)) {
    modal.addEventListener('click', (event) => {
      if (event.target !== modal) return;

      const rect = modal.getBoundingClientRect();
      const isInside = (
        rect.top <= event.clientY &&
        event.clientY <= rect.top + rect.height &&
        rect.left <= event.clientX &&
        event.clientX <= rect.left + rect.width
      );

      if (!isInside) {
        closeModal();
      }
    });
  }
})();

