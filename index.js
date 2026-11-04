document.addEventListener('DOMContentLoaded', () => {
  let lastActiveElement = null;
  // --- Header Scroll Effect & Reading Progress Bar ---
  const header = document.querySelector('.global-header');
  const scrollProgress = document.getElementById('scroll-progress');
  
  function updateScrollState() {
    const scrollY = window.scrollY;
    if (scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }

    if (scrollProgress) {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progressPercent = totalHeight > 0 ? (scrollY / totalHeight) * 100 : 0;
      scrollProgress.style.width = `${Math.min(100, Math.max(0, progressPercent))}%`;
    }
  }

  window.addEventListener('scroll', updateScrollState, { passive: true });
  updateScrollState();

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
  const sections = document.querySelectorAll('section[id], header[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  const isBlogPage = window.location.pathname.endsWith('blog.html') || window.location.pathname.endsWith('/blog');
  
  window.addEventListener('scroll', () => {
    if (isBlogPage) return; // Keep "Blog" link highlighted on dedicated blog page
    let current = '';
    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      if (window.scrollY >= (sectionTop - 150)) {
        current = section.getAttribute('id');
      }
    });

    if (current) {
      navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href === `#${current}` || href.endsWith(`#${current}`)) {
          link.classList.add('active');
        } else {
          link.classList.remove('active');
        }
      });
    }
  });

  // --- Secure Consultation Form Validation ---
  const form = document.getElementById('consultation-form');
  if (form) {
    const nameInput = document.getElementById('full-name');
    const emailInput = document.getElementById('email-address');
    const phoneInput = document.getElementById('phone-number');
    const messageInput = document.getElementById('message');
    const smsYes = document.getElementById('sms-consent-yes');
    const smsNo = document.getElementById('sms-consent-no');
    
    const nameError = document.getElementById('name-error');
    const emailError = document.getElementById('email-error');
    const phoneError = document.getElementById('phone-error');
    const messageError = document.getElementById('message-error');
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
      if (smsYes && smsYes.checked && !val) {
        phoneError.textContent = 'Please provide a phone number to receive text messages.';
        phoneInput.classList.add('invalid');
        phoneInput.setAttribute('aria-invalid', 'true');
        return false;
      }
      if (val && !phoneRegex.test(val)) {
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

    function validateMessage() {
      if (messageInput && !messageInput.value.trim()) {
        messageError.textContent = 'Message is required.';
        messageInput.classList.add('invalid');
        messageInput.setAttribute('aria-invalid', 'true');
        return false;
      }
      if (messageError) messageError.textContent = '';
      if (messageInput) {
        messageInput.classList.remove('invalid');
        messageInput.setAttribute('aria-invalid', 'false');
      }
      return true;
    }

    function validateSMS() {
      if (smsYes && smsNo && !smsYes.checked && !smsNo.checked) {
        smsError.textContent = 'Please select whether you agree or do not want to receive text messages.';
        smsYes.setAttribute('aria-invalid', 'true');
        smsNo.setAttribute('aria-invalid', 'true');
        return false;
      }
      smsError.textContent = '';
      if (smsYes) smsYes.setAttribute('aria-invalid', 'false');
      if (smsNo) smsNo.setAttribute('aria-invalid', 'false');
      return true;
    }

    // Mutual exclusivity for SMS consent checkboxes
    if (smsYes && smsNo) {
      smsYes.addEventListener('change', () => {
        if (smsYes.checked) {
          smsNo.checked = false;
        }
        validateSMS();
        validatePhone();
      });

      smsNo.addEventListener('change', () => {
        if (smsNo.checked) {
          smsYes.checked = false;
        }
        validateSMS();
        validatePhone();
      });
    }

    // Stop phone links inside labels from triggering checkbox state change
    const smsPhoneLinks = form.querySelectorAll('.sms-consent-group a[href^="tel:"]');
    smsPhoneLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        e.stopPropagation();
      });
    });

    // Attach Validation on BLUR (when exiting field) to avoid premature warnings
    nameInput.addEventListener('blur', validateName);
    emailInput.addEventListener('blur', validateEmail);
    phoneInput.addEventListener('blur', validatePhone);
    if (messageInput) messageInput.addEventListener('blur', validateMessage);

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
      const val = phoneInput.value.trim();
      if (!val && (!smsYes || !smsYes.checked)) {
        phoneError.textContent = '';
        phoneInput.classList.remove('invalid');
        phoneInput.setAttribute('aria-invalid', 'false');
      } else if (phoneRegex.test(val)) {
        phoneError.textContent = '';
        phoneInput.classList.remove('invalid');
        phoneInput.setAttribute('aria-invalid', 'false');
      }
    });

    if (messageInput) {
      messageInput.addEventListener('input', () => {
        if (messageInput.value.trim()) {
          messageError.textContent = '';
          messageInput.classList.remove('invalid');
          messageInput.setAttribute('aria-invalid', 'false');
        }
      });
    }

    // Form Submission Handler
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      // Trigger all validations
      const isNameValid = validateName();
      const isEmailValid = validateEmail();
      const isPhoneValid = validatePhone();
      const isMessageValid = validateMessage();
      const isSMSValid = validateSMS();

      if (isNameValid && isEmailValid && isPhoneValid && isMessageValid && isSMSValid) {
        // Disable submit button to prevent double submission
        const submitBtn = form.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        const btnText = submitBtn.querySelector('span');
        const origText = btnText.textContent;
        btnText.textContent = 'Submitting Request...';

        // Submit form data to Web3Forms via AJAX POST
        const formData = new FormData(form);

        fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          body: formData
        })
        .then(async (response) => {
          const json = await response.json();
          if (response.status === 200 && json.success) {
            showToast();
            form.reset();
          } else {
            alert(json.message || 'Something went wrong. Please try again or call us directly.');
          }
        })
        .catch((error) => {
          console.error('Form submission error:', error);
          alert('Unable to send message at this time. Please call (877) 255-1919.');
        })
        .finally(() => {
          submitBtn.disabled = false;
          btnText.textContent = origText;
        });
      } else {
        // Focus on the first invalid field
        if (!isNameValid) {
          nameInput.focus();
        } else if (!isEmailValid) {
          emailInput.focus();
        } else if (!isPhoneValid) {
          phoneInput.focus();
        } else if (!isMessageValid && messageInput) {
          messageInput.focus();
        } else if (!isSMSValid && smsYes) {
          smsYes.focus();
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

  // --- Dynamic Spotlight Cursor Glow Handler ---
  const spotlightCards = document.querySelectorAll(
    '.service-card, .team-card, .testimonial-card, .coverage-card, .credential-item, .founder-spotlight, .blog-card'
  );
  
  spotlightCards.forEach(card => {
    card.classList.add('spotlight-card');
    let ticking = false;

    card.addEventListener('mousemove', (e) => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          card.style.setProperty('--mouse-x', `${x}px`);
          card.style.setProperty('--mouse-y', `${y}px`);
          ticking = false;
        });
        ticking = true;
      }
    });
  });
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

  // Auto-apply reveal to all service cards, team cards, credential items, testimonial cards, trust bar items, blog cards
  const revealTargets = document.querySelectorAll(
    '.service-card, .team-card, .credential-item, .testimonial-card, .trust-bar-item, .timeline-item, .coverage-card, .blog-card, .reveal-on-scroll'
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

  // Blog cards — staggered reveal
  document.querySelectorAll('.blog-card').forEach((card, i) => {
    card.style.transitionDelay = `${(i % 2) * 0.1}s`;
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

// ============================================================
// BLOG & INVESTIGATIVE INSIGHTS MODULE
// ============================================================
(function initBlogModule() {
  const BLOG_ARTICLES = {
    'tracing-hidden-assets-offshore-structures': {
      title: 'Tracing Hidden Assets & Offshore Corporate Shells in High-Stakes Disputes',
      category: 'Financial Forensics',
      categorySlug: 'asset-tracing',
      date: 'October 2026',
      readTime: '5 min read',
      author: 'Michael Compitiello',
      authorRole: 'Founder & Supervisory Special Agent (Ret.)',
      avatarInitials: 'MC',
      bodyHtml: `
        <p>In high-net-worth matrimonial dissolutions, commercial partnership battles, and post-judgment enforcement, the most valuable assets rarely appear on transparent balance sheets. Individuals facing multimillion-dollar liability frequently employ deliberate, multi-layered corporate obfuscation strategies designed to stonewall standard discovery requests.</p>
        
        <p>Throughout 26 years leading federal criminal and financial task forces at DHS/HSI—including supervising complex fraud rings and international kleptocracy asset seizures—our leadership proved one foundational rule: <em>money always leaves a digital and forensic footprint.</em></p>

        <div class="article-quote">
          "Asset concealment is not magic; it is merely an architectural puzzle built on shell entities, nominee agreements, and banking friction. Given methodical forensic tracing, every layer can be peeled back."
        </div>

        <h3>The Anatomy of Modern Asset Concealment</h3>
        <p>Sophisticated targets rarely rely on physical cash; instead, they construct intricate corporate shields across domestic and foreign jurisdictions:</p>
        <ul>
          <li><strong>Domestic Privacy LLCs:</strong> Formed in statutory secrecy states like Wyoming, Delaware, or Nevada, where ultimate beneficial ownership (UBO) is deliberately obscured from public secretary of state portals.</li>
          <li><strong>Offshore Asset Protection Trusts (APTs):</strong> Established in Nevis, the Cook Islands, or Belize, frequently drafted with "flee clauses" that mandate immediate trustee relocation upon court scrutiny.</li>
          <li><strong>Collusive Liens & Straw Encumbrances:</strong> Creating fictitious friendly loans and mortgages against prime real estate, making high-value assets appear underwater to creditors and spouses.</li>
          <li><strong>Digital Currency & Cold Storage Layering:</strong> Dispersing liquid wealth across unhosted hardware wallets, non-KYC decentralized liquidity pools, and peer-to-peer exchanges.</li>
        </ul>

        <h3>Federal-Grade Forensic Tracing Methodologies</h3>
        <p>Standard civil subpoenas only uncover assets counsel already knows to ask for. Federal-grade private investigation approaches the problem from the outside in:</p>
        
        <h4>1. Source-and-Application Expenditure Audits</h4>
        <p>By establishing a rigorous forensic baseline of historical declared income against verifiable lifestyle expenditures (private aviation, luxury automotive leases, country club memberships, and real estate upkeep), mathematical discrepancies emerge. When annual outlays surpass declared income by hundreds of thousands of dollars, courts are legally permitted to infer undisclosed revenue streams.</p>

        <h4>2. Piercing Nominee Corporate Veilings</h4>
        <p>We trace registered agent histories, commercial domain whois archives, UCC financing statements, and related entity filings. Nominee managers frequently recycle identical mail-drop addresses or signature patterns across dozens of holding entities, linking the target directly to concealed assets.</p>

        <h4>3. Correspondent Banking & SWIFT Wire Tracing</h4>
        <p>Financial institutions rely on domestic correspondent accounts to settle international wire transfers. Tracing recurring round-dollar transfers through intermediary banks allows us to identify offshore beneficiary accounts and locate hidden capital repositories.</p>

        <div class="article-takeaways">
          <div class="takeaways-heading">
            <i class="fa-solid fa-shield-halved" aria-hidden="true"></i> Strategic Takeaways for Litigants & Legal Counsel
          </div>
          <ul>
            <li><strong>Initiate asset tracing early:</strong> Move swiftly before assets can be layered through secondary Caribbean or South Pacific jurisdictions.</li>
            <li><strong>Challenge voluntary disclosure affidavits:</strong> Targets with intent to deceive routinely provide sworn affidavits omitting shell-held interests.</li>
            <li><strong>Leverage lifestyle audits in court:</strong> Demonstrating demonstrable lifestyle extravagance shifts the burden of proof to the concealing party under Arizona family and civil court standards.</li>
          </ul>
        </div>

        <p>Ultimately, raw financial intelligence is useless unless it withstands adversarial scrutiny. Every CAD Private Investigations asset tracing dossier is assembled to supervisory federal law enforcement standards—complete with certified document trails, timeline exhibits, and courtroom-ready expert witness testimony.</p>
      `
    },

    'arizona-surveillance-law-admissibility-standards': {
      title: 'Arizona Surveillance Law: Evidentiary Admissibility in Maricopa County Courts',
      category: 'Surveillance & Law',
      categorySlug: 'surveillance',
      date: 'September 2026',
      readTime: '4 min read',
      author: 'John Donofrio',
      authorRole: 'Operations Manager & Private Investigator',
      avatarInitials: 'JD',
      bodyHtml: `
        <p>Physical surveillance remains the most definitive evidentiary asset in domestic infidelity disputes, child custody hearings, personal injury defense, and corporate fraud litigation. However, a single statutory misstep can render hundreds of hours of high-definition video inadmissible under the Arizona Rules of Evidence—or worse, expose counsel and their clients to civil tort liability or criminal misdemeanor charges.</p>

        <p>Operating in Maricopa County, Phoenix, and across Arizona demands absolute precision regarding statutory surveillance boundaries.</p>

        <div class="article-quote">
          "Unassailable courtroom evidence requires both technical excellence in the field and strict adherence to Arizona privacy statutes. If evidence is gathered unlawfully, it is toxic to your case."
        </div>

        <h3>Arizona's One-Party Consent Rule (A.R.S. § 13-3005)</h3>
        <p>Arizona is statutory a "one-party consent" state for recording conversations under A.R.S. § 13-3005. This allows an individual to record an oral or wire communication provided at least one participating party consents.</p>
        <p><strong>The Critical Investigator Limitation:</strong> A private detective or client cannot plant an unattended audio recorder in a vehicle, office, or dining room where neither the investigator nor the client is physically present in the dialogue. Doing so constitutes felony eavesdropping. Video surveillance, however, operates under an entirely different legal standard: <em>the constitutional test of reasonable expectation of privacy.</em></p>

        <h3>The Reasonable Expectation of Privacy Test (A.R.S. § 13-3019)</h3>
        <p>Under A.R.S. § 13-3019 (Surreptitious Photographing, Videotaping, and Filming), capturing imagery of a person without consent is illegal only if the subject is in an area where they hold an objective, reasonable expectation of privacy.</p>
        <ul>
          <li><strong>Public Domains:</strong> Any individual walking down Camelback Road, dining at a public outdoor patio in Scottsdale, or entering an office complex has no reasonable expectation of privacy. Visual evidence gathered from public easements is 100% lawful and admissible.</li>
          <li><strong>Private Curtilage:</strong> Aiming lenses into residential bedroom windows, using ladders or drones to peer over privacy perimeter walls, or trespassing into backyards violates Arizona law. Elite investigators position vehicles lawfully on public thoroughfares, capturing subjects only when they enter plain view.</li>
        </ul>

        <h3>GPS Tracking Restrictions (A.R.S. § 13-2923)</h3>
        <p>One of the most frequent questions from prospective clients is whether a magnetic GPS tracker can be placed on an unfaithful spouse's vehicle. Under Arizona stalking statutes (A.R.S. § 13-2923), installing a tracking device on a vehicle without title ownership is unlawful.</p>
        <p>In Arizona, GPS tracking is legally permissible <em>only</em> if the client's name appears on the legal vehicle title or registration (such as marital joint property). If the vehicle is titled exclusively in the other party's name, GPS placement is strictly prohibited without a court order—making manual, discreet physical mobile surveillance the only legal recourse.</p>

        <div class="article-takeaways">
          <div class="takeaways-heading">
            <i class="fa-solid fa-scale-balanced" aria-hidden="true"></i> Best Practices for Surviving Motion in Limine Challenges
          </div>
          <ul>
            <li><strong>Preserve raw, unaltered native video files:</strong> Maintain digital master copies with embedded camera EXIF timestamps and SHA-256 hashes.</li>
            <li><strong>Maintain contemporaneous field logs:</strong> Every minute of surveillance must be recorded in an operational log detailing locations, weather, lighting, and investigator positioning.</li>
            <li><strong>Never use amateur GPS tracking:</strong> Tainted evidence can trigger severe judicial sanctions and compromise your entire legal strategy.</li>
          </ul>
        </div>

        <p>At CAD Private Investigations, all field surveillance operations are planned and executed to ensure that every minute of captured footage cleanly survives vigorous judicial cross-examination.</p>
      `
    },

    'corporate-mergers-due-diligence-red-flags': {
      title: 'Red Flags in Corporate Mergers: Vetting Beneficial Ownership Beyond the Balance Sheet',
      category: 'Corporate Vetting',
      categorySlug: 'due-diligence',
      date: 'August 2026',
      readTime: '6 min read',
      author: 'Michael Compitiello',
      authorRole: 'Founder & Supervisory Special Agent (Ret.)',
      avatarInitials: 'MC',
      bodyHtml: `
        <p>During the excitement of corporate acquisitions, joint ventures, and capital investments, executive teams and private equity partners routinely rely on traditional CPA auditing firms and commercial background database subscriptions. While these audits verify reported P&L statements and public corporate filings, they routinely miss hidden operational and reputational landmines.</p>

        <p>Commercial databases only scan what is already indexed. Deep corporate vetting is not an accounting exercise—it is an intelligence operation designed to uncover undisclosed liabilities, hidden regulatory sanctions, and shadow beneficial owners before capital is committed.</p>

        <div class="article-quote">
          "The greatest risks in corporate mergers are rarely on the balance sheet; they reside in what the founders and managing partners deliberately omitted from public view."
        </div>

        <h3>The Dangerous Blind Spots of Automated Screening Tools</h3>
        <p>Automated database portals aggregate public records through robotic scrapers. In practice, their structural blind spots include:</p>
        <ul>
          <li><strong>County-Level Docket Gaps:</strong> Thousands of municipal and county court jurisdictions across the United States do not syndicate civil dockets to commercial background databases. Active litigation can easily slip through automated checks.</li>
          <li><strong>Name Variation & Entity Alias Obfuscation:</strong> Automated tools fail when principals alter legal spellings, utilize middle names, or register assets through slightly varied entity names across state lines.</li>
          <li><strong>Inability to Penetrate Nominee Directorships:</strong> Automated platforms report only the registered agent service listed on a Secretary of State filing, failing to identify the true controlling beneficial interest.</li>
        </ul>

        <h3>Five Critical Red Flags Discovered in Pre-Deal Vetting</h3>
        <p>Our corporate investigations frequently expose warning signs that necessitate transaction restructuring or outright deal cancellation:</p>

        <h4>1. Rapid Jurisdictional Charter Migration</h4>
        <p>When an operating company repeatedly dissolves and re-incorporates in different states (e.g., Nevada to Delaware to Wyoming) within 24 to 36 months, the entity is almost always fleeing pending legal judgments, aggressive tax levies, or investigative scrutiny.</p>

        <h4>2. Circular Related-Party Vendor Transactions</h4>
        <p>Examining disbursement ledgers frequently uncovers substantial payments directed to secondary LLCs sharing registered agents, shared residential addresses, or common familial ties—effectively siphoning capital before acquisition.</p>

        <h4>3. Informal Regulatory Subpoenas & Warnings</h4>
        <p>Long before the SEC, CFTC, EPA, or State Attorney General files a formal public lawsuit, regulatory bodies issue warning letters, informal inquiries, and target notices. These never appear on public balance sheets, yet represent existential business risk.</p>

        <h4>4. Executive Pedigree & Resume Fabrication</h4>
        <p>Discrepancies in academic credentials, exaggerated previous executive tenures, or omitted bankruptcies and liquidated subsidiaries consistently correlate with broader managerial deception.</p>

        <h4>5. Secondary Factoring Liens & UCC Conflicts</h4>
        <p>Concealed high-interest merchant cash advances and secondary factoring liens that jeopardize collateral priority for acquiring lenders and investors.</p>

        <div class="article-takeaways">
          <div class="takeaways-heading">
            <i class="fa-solid fa-building-shield" aria-hidden="true"></i> Strategic Guidelines for Corporate Counsel & Acquirers
          </div>
          <ul>
            <li><strong>Initiate investigative due diligence concurrently:</strong> Run private investigative inquiries in tandem with financial audits, not as a last-minute check right before closing.</li>
            <li><strong>Investigate silent partners and beneficial owners:</strong> Uncover the ultimate beneficiaries behind holding companies to avoid OFAC and federal sanctions violations.</li>
            <li><strong>Conduct discreet human source inquiries:</strong> Lawful, confidential interviews with former executives and suppliers uncover cultural and operational truths no spreadsheet can reveal.</li>
          </ul>
        </div>

        <p>CAD Private Investigations provides deal teams with deep, discrete intelligence that protects balance sheets, corporate reputation, and shareholder equity.</p>
      `
    },

    'digital-forensics-insider-threat-data-theft': {
      title: 'Uncovering Insider Data Exfiltration: Digital Forensics in Corporate Trade Secret Theft',
      category: 'Digital Forensics',
      categorySlug: 'digital-forensics',
      date: 'July 2026',
      readTime: '5 min read',
      author: 'Alex Nader & Scott Unger',
      authorRole: 'Computer Forensic Specialists, CAD PI',
      avatarInitials: 'DF',
      bodyHtml: `
        <p>Over 70% of corporate trade secret and intellectual property thefts occur in the final 30 days preceding an employee’s departure. Whether a high-performing sales director downloading proprietary client pricing algorithms, an engineering lead copying confidential source code repositories, or an executive transferring strategic business plans to a competing venture, insider threats cost American enterprises billions in damages annually.</p>

        <p>When leadership suspects data exfiltration, the clock begins ticking immediately. Critical forensic artifacts can be overwritten within days, and improper internal IT tampering often compromises the evidence before court filings.</p>

        <div class="article-quote">
          "Departing employees believe that deleting browsing history or emptying the recycle bin erases their digital footprints. In modern operating systems, every file movement leaves an indelible forensic record."
        </div>

        <h3>Common Modern Data Exfiltration Vectors</h3>
        <p>Rogue insiders rarely trigger conventional DLP alerts by sending massive email attachments. Instead, they exploit stealthier channels:</p>
        <ul>
          <li><strong>High-Capacity USB & Portable SSD Drives:</strong> Rapid bulk transfers initiated during off-hours, weekend shifts, or work-from-home remote desktop sessions.</li>
          <li><strong>Personal Cloud Synchronization:</strong> Uploading proprietary folder hierarchies to personal Dropbox, Google Drive, or Microsoft OneDrive accounts via browser sessions or unapproved client sync utilities.</li>
          <li><strong>AirDrop & Wireless Peer-to-Peer Transfers:</strong> Direct transfers from corporate laptops to personal mobile devices, entirely bypassing local network perimeter firewalls.</li>
          <li><strong>Encrypted Archive Containers:</strong> Compressing corporate databases into multi-part, password-protected 7-Zip or RAR archives before transmitting via webmail.</li>
        </ul>

        <h3>Key Forensic Artifacts Examined in Digital Audits</h3>
        <p>Our certified digital forensics specialists uncover evidence through rigorous operating system analysis:</p>

        <h4>1. USB Registry Hives & Volume Serial Identifiers</h4>
        <p>Windows registry hives (<code>SYSTEM</code>, <code>SOFTWARE</code>) preserve an immutable log of every external USB drive ever connected to a machine—including manufacturer, model, unique device serial number, first connection date, and last disconnect timestamp.</p>

        <h4>2. LNK Files & Jump Lists</h4>
        <p>When a user opens a confidential document directly from a connected USB flash drive, Windows automatically generates shortcut (LNK) files. These files document the exact file path, drive letter, and timestamp—proving the document was accessed from an external medium.</p>

        <h4>3. Shellbags Analysis</h4>
        <p>Shellbags are registry records that track folder view settings. Even if the external drive has been removed and destroyed, the host machine's Shellbags prove that the suspect browsed and opened specific folders on that external device.</p>

        <div class="article-takeaways">
          <div class="takeaways-heading">
            <i class="fa-solid fa-laptop-code" aria-hidden="true"></i> Critical Protocol for Corporate Incident Response
          </div>
          <ul>
            <li><strong>Do not allow internal IT to 'browse' the suspect machine:</strong> Powering on a machine modifies thousands of system files and registry timestamps, handing opposing counsel grounds to claim evidence spoliation.</li>
            <li><strong>Isolate and preserve devices immediately:</strong> Quarantine the suspect laptop, phone, and company-issued tablets in secure physical custody.</li>
            <li><strong>Create bit-stream forensic images:</strong> Extract forensically verified bit-stream images with SHA-256 cryptographic hashes compliant with ISO/IEC 27037 standards.</li>
          </ul>
        </div>

        <p>Our forensic team provides sworn Rule 702 Expert Witness Reports detailing exact timelines and file movements, empowering legal counsel to secure emergency Temporary Restraining Orders (TROs) and preliminary injunctions.</p>
      `
    }
  };

  // --- Helper Functions for Blog & Dynamic Content ---
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getCategorySlug(cat) {
    const lower = (cat || '').toLowerCase();
    if (lower.includes('financ') || lower.includes('asset')) return 'asset-tracing';
    if (lower.includes('surveill')) return 'surveillance';
    if (lower.includes('vetting') || lower.includes('diligence') || lower.includes('merger') || lower.includes('corporate')) return 'due-diligence';
    if (lower.includes('cyber') || lower.includes('digital') || (lower.includes('forensic') && !lower.includes('financ'))) return 'digital-forensics';
    return lower.replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'general';
  }

  function getCategoryIcon(cat, slug) {
    const lower = ((cat || '') + ' ' + (slug || '')).toLowerCase();
    if (lower.includes('financ') || lower.includes('asset') || lower.includes('coin')) return 'fa-solid fa-coins';
    if (lower.includes('surveill') || lower.includes('law')) return 'fa-solid fa-scale-balanced';
    if (lower.includes('vetting') || lower.includes('diligence') || lower.includes('corporate') || lower.includes('merger')) return 'fa-solid fa-building-shield';
    if (lower.includes('digital') || lower.includes('cyber') || lower.includes('code') || (lower.includes('forensic') && !lower.includes('financ'))) return 'fa-solid fa-laptop-code';
    if (lower.includes('litigat') || lower.includes('court')) return 'fa-solid fa-gavel';
    return 'fa-solid fa-file-shield';
  }

  function attachSpotlightToCard(card) {
    card.classList.add('spotlight-card');
    let ticking = false;
    card.addEventListener('mousemove', (e) => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const rect = card.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          card.style.setProperty('--mouse-x', `${x}px`);
          card.style.setProperty('--mouse-y', `${y}px`);
          ticking = false;
        });
        ticking = true;
      }
    });
  }

  function createBlogCardElement(post, isAdmin) {
    const catSlug = post.categorySlug || getCategorySlug(post.category);
    const icon = getCategoryIcon(post.category, catSlug);
    const article = document.createElement('article');
    article.className = 'blog-card glass-card spotlight-card';
    article.setAttribute('data-category', catSlug);
    article.setAttribute('data-slug', post.slug);
    if (post.isCustom) {
      article.setAttribute('data-custom', 'true');
    }

    const deleteBtnHtml = isAdmin ? `
      <button type="button" class="btn-card-delete" data-delete-slug="${escapeHtml(post.slug)}" aria-label="Delete dispatch ${escapeHtml(post.title)}" title="Delete dispatch">
        <i class="fa-solid fa-trash-can" aria-hidden="true"></i>
      </button>
    ` : '';

    article.innerHTML = `
      ${deleteBtnHtml}
      <div class="blog-card-header">
        <span class="blog-tag"><i class="${icon}" aria-hidden="true"></i> ${escapeHtml(post.category)}</span>
        <div class="blog-read-meta">
          <span class="blog-date"><i class="fa-regular fa-calendar" aria-hidden="true"></i> ${escapeHtml(post.date)}</span>
          <span class="blog-read-time"><i class="fa-regular fa-clock" aria-hidden="true"></i> ${escapeHtml(post.readTime)}</span>
        </div>
      </div>
      <h3 class="blog-card-title">
        <a href="blog/${escapeHtml(post.slug)}.html" class="blog-card-link" data-open-slug="${escapeHtml(post.slug)}">
          ${escapeHtml(post.title)}
        </a>
      </h3>
      <p class="blog-card-excerpt">
        ${escapeHtml(post.excerpt)}
      </p>
      <div class="blog-card-footer">
        <div class="blog-author-meta">
          <div class="author-avatar-sm" aria-hidden="true">${escapeHtml(post.avatarInitials || 'PI')}</div>
          <div class="author-info">
            <span class="author-name">${escapeHtml(post.author)}</span>
            <span class="author-role">${escapeHtml(post.authorRole || 'Investigator')}</span>
          </div>
        </div>
        <button type="button" class="btn-read-dispatch" data-open-slug="${escapeHtml(post.slug)}" aria-label="Read full analysis on ${escapeHtml(post.title)}">
          <span>Read Analysis</span>
          <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>
        </button>
      </div>
    `;

    attachSpotlightToCard(article);
    return article;
  }

  // --- Category Filtering ---
  function getBlogCards() {
    return document.querySelectorAll('#blog-grid .blog-card');
  }

  function applyCurrentFilter() {
    const activeBtn = document.querySelector('.blog-filter-btn.active');
    const category = activeBtn ? activeBtn.getAttribute('data-category') : 'all';
    const cards = getBlogCards();

    cards.forEach(card => {
      const cardCat = card.getAttribute('data-category');
      if (category === 'all' || cardCat === category) {
        card.classList.remove('hidden');
      } else {
        card.classList.add('hidden');
      }
    });
  }

  const filterBtns = document.querySelectorAll('.blog-filter-btn');
  if (filterBtns.length) {
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        // Update active button state
        document.querySelectorAll('.blog-filter-btn').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');

        applyCurrentFilter();
      });
    });
  }

  function ensureCategoryFilter(categoryName, categorySlug) {
    const filterBar = document.querySelector('.blog-filter-bar');
    if (!filterBar) return;
    if (filterBar.querySelector(`[data-category="${categorySlug}"]`)) return;

    const newBtn = document.createElement('button');
    newBtn.type = 'button';
    newBtn.className = 'blog-filter-btn';
    newBtn.setAttribute('data-category', categorySlug);
    newBtn.setAttribute('aria-pressed', 'false');
    newBtn.textContent = categoryName;
    newBtn.addEventListener('click', () => {
      document.querySelectorAll('.blog-filter-btn').forEach(b => {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      });
      newBtn.classList.add('active');
      newBtn.setAttribute('aria-pressed', 'true');
      applyCurrentFilter();
    });
    filterBar.appendChild(newBtn);
  }

  // --- Live Search Bar Handler ---
  const searchInput = document.getElementById('blog-search-input');
  const emptyState = document.getElementById('blog-empty-state');
  const resultsCounter = document.getElementById('blog-results-counter');

  function updateSearch() {
    if (!searchInput) return;
    const query = searchInput.value.trim().toLowerCase();
    const cards = getBlogCards();
    let visibleCount = 0;

    if (query) {
      document.querySelectorAll('.blog-filter-btn').forEach(b => {
        const isAll = b.getAttribute('data-category') === 'all';
        b.classList.toggle('active', isAll);
        b.setAttribute('aria-pressed', isAll ? 'true' : 'false');
      });
    }

    cards.forEach(card => {
      const title = (card.querySelector('.blog-card-title')?.textContent || '').toLowerCase();
      const excerpt = (card.querySelector('.blog-card-excerpt')?.textContent || '').toLowerCase();
      const tag = (card.querySelector('.blog-tag')?.textContent || '').toLowerCase();
      const author = (card.querySelector('.author-name')?.textContent || '').toLowerCase();

      const matches = !query || title.includes(query) || excerpt.includes(query) || tag.includes(query) || author.includes(query);

      if (matches) {
        card.classList.remove('hidden');
        visibleCount++;
      } else {
        card.classList.add('hidden');
      }
    });

    if (resultsCounter) {
      resultsCounter.textContent = query 
        ? `Showing ${visibleCount} dispatch${visibleCount === 1 ? '' : 'es'} matching "${query}"`
        : `Showing all ${visibleCount} investigative dispatches`;
    }

    if (emptyState) {
      if (visibleCount === 0) {
        emptyState.classList.add('visible');
      } else {
        emptyState.classList.remove('visible');
      }
    }
  }

  if (searchInput) {
    searchInput.addEventListener('input', updateSearch);
  }

  // --- Article Modal Reader Logic ---
  const blogModal = document.getElementById('blog-modal');
  const blogModalClose = document.getElementById('blog-modal-close');
  const blogModalCategory = document.getElementById('blog-modal-category');
  const blogModalReadtime = document.getElementById('blog-modal-readtime');
  const blogModalDate = document.getElementById('blog-modal-date');
  const blogModalTitle = document.getElementById('blog-modal-title');
  const blogModalAuthor = document.getElementById('blog-modal-author');
  const blogModalRole = document.getElementById('blog-modal-role');
  const blogModalAvatar = document.getElementById('blog-modal-avatar');
  const blogModalBody = document.getElementById('blog-modal-body');
  const copyLinkBtn = document.getElementById('blog-copy-link-btn');

  let currentSlug = null;
  let blogLastActiveElement = null;

  function openBlogArticle(slug, updateUrlHash = true) {
    const article = BLOG_ARTICLES[slug];
    if (!article || !blogModal) return;

    currentSlug = slug;
    blogLastActiveElement = document.activeElement;

    // Populate modal contents
    if (blogModalCategory) blogModalCategory.textContent = article.category;
    if (blogModalReadtime) blogModalReadtime.innerHTML = `<i class="fa-regular fa-clock" aria-hidden="true"></i> ${article.readTime}`;
    if (blogModalDate) blogModalDate.innerHTML = `<i class="fa-regular fa-calendar" aria-hidden="true"></i> ${article.date}`;
    if (blogModalTitle) blogModalTitle.textContent = article.title;
    if (blogModalAuthor) blogModalAuthor.textContent = article.author;
    if (blogModalRole) blogModalRole.textContent = article.authorRole;
    if (blogModalAvatar) blogModalAvatar.textContent = article.avatarInitials;
    if (blogModalBody) blogModalBody.innerHTML = article.bodyHtml;

    const permalinkEl = document.getElementById('blog-modal-permalink');
    if (permalinkEl) {
      permalinkEl.href = `${window.location.origin}/blog/${slug}.html`;
    }

    // Open native dialog
    blogModal.showModal();
    document.body.classList.add('modal-open');

    // Scroll to top of article container
    const scrollContainer = blogModal.querySelector('.article-modal-scroll');
    if (scrollContainer) scrollContainer.scrollTop = 0;

    // Update URL hash cleanly
    if (updateUrlHash) {
      history.pushState(null, '', `#blog-${slug}`);
    }

    if (blogModalClose) blogModalClose.focus();
  }

  function closeBlogArticle() {
    if (!blogModal) return;

    // Stop any playing video iframes on modal close
    if (blogModalBody) {
      const iframes = blogModalBody.querySelectorAll('iframe');
      iframes.forEach(iframe => {
        const src = iframe.src;
        iframe.src = '';
        iframe.src = src;
      });
    }

    blogModal.close();
    document.body.classList.remove('modal-open');

    // If URL hash was set to this article, revert back to #blog
    if (window.location.hash.startsWith('#blog-')) {
      history.pushState(null, '', '#blog');
    }

    if (blogLastActiveElement) {
      blogLastActiveElement.focus();
      blogLastActiveElement = null;
    }
    currentSlug = null;
  }

  if (blogModalClose) {
    blogModalClose.addEventListener('click', closeBlogArticle);
  }

  if (blogModal) {
    blogModal.addEventListener('close', () => {
      document.body.classList.remove('modal-open');
      if (window.location.hash.startsWith('#blog-')) {
        history.pushState(null, '', '#blog');
      }
      if (blogLastActiveElement) {
        blogLastActiveElement.focus();
        blogLastActiveElement = null;
      }
    });

    // Light-dismiss click outside fallback
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      blogModal.addEventListener('click', (event) => {
        if (event.target !== blogModal) return;
        const rect = blogModal.getBoundingClientRect();
        const isInside = (
          rect.top <= event.clientY &&
          event.clientY <= rect.top + rect.height &&
          rect.left <= event.clientX &&
          event.clientX <= rect.left + rect.width
        );
        if (!isInside) {
          closeBlogArticle();
        }
      });
    }
  }

  // Intercept all triggers for opening articles
  document.addEventListener('click', (e) => {
    const trigger = e.target.closest('[data-open-slug]');
    if (trigger) {
      e.preventDefault();
      const slug = trigger.getAttribute('data-open-slug');
      if (slug) openBlogArticle(slug);
      return;
    }

    // Modal consultation CTA button: close modal and scroll smoothly to contact
    const modalContactBtn = e.target.closest('.modal-contact-btn');
    if (modalContactBtn) {
      closeBlogArticle();
    }
  });

  // Share / Copy Link Button
  if (copyLinkBtn) {
    const copyText = copyLinkBtn.querySelector('.copy-text');
    let isCopying = false;

    copyLinkBtn.addEventListener('click', async () => {
      if (isCopying || !currentSlug) return;
      isCopying = true;

      const permalink = `${window.location.origin}/blog/${currentSlug}.html`;

      try {
        await navigator.clipboard.writeText(permalink);
        copyLinkBtn.classList.add('copied');
        if (copyText) copyText.textContent = 'Copied!';

        setTimeout(() => {
          copyLinkBtn.classList.remove('copied');
          if (copyText) copyText.textContent = 'Share';
          isCopying = false;
        }, 2200);
      } catch (err) {
        console.error('Failed to copy link: ', err);
        isCopying = false;
      }
    });
  }

  // Check URL hash on initial page load (deep linking)
  function handleUrlHash() {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#blog-')) {
      const slug = hash.replace('#blog-', '');
      if (BLOG_ARTICLES[slug]) {
        // Scroll to blog section first, then open modal
        const blogSection = document.getElementById('blog');
        if (blogSection) {
          blogSection.scrollIntoView({ behavior: 'smooth' });
        }
        setTimeout(() => {
          openBlogArticle(slug, false);
        }, 300);
      }
    }
  }

  window.addEventListener('hashchange', () => {
    const hash = window.location.hash;
    if (hash && hash.startsWith('#blog-')) {
      const slug = hash.replace('#blog-', '');
      if (slug !== currentSlug) {
        openBlogArticle(slug, false);
      }
    } else if (blogModal && blogModal.open && !hash.startsWith('#blog-')) {
      blogModal.close();
    }
  });

  // --- Admin Mode Active Bar & Controls ---
  function setupAdminMode() {
    const adminToken = localStorage.getItem('cadpi_admin_token');
    const blogSection = document.getElementById('blog');
    if (!adminToken || !blogSection) return;

    let adminBar = document.getElementById('blog-admin-bar');
    if (!adminBar) {
      adminBar = document.createElement('div');
      adminBar.id = 'blog-admin-bar';
      adminBar.className = 'blog-admin-bar';
      adminBar.innerHTML = `
        <div class="blog-admin-info">
          <i class="fa-solid fa-shield-halved" aria-hidden="true"></i>
          <span><strong>Admin Mode Active:</strong> Authenticated as CAD PI Editor</span>
        </div>
        <div class="blog-admin-actions">
          <a href="admin.html" class="btn-admin-action btn-admin-primary">
            <i class="fa-solid fa-pen-to-square" aria-hidden="true"></i> Dispatch Studio
          </a>
          <button type="button" class="btn-admin-action btn-admin-outline" id="blog-admin-logout-btn">
            <i class="fa-solid fa-arrow-right-from-bracket" aria-hidden="true"></i> Sign Out
          </button>
        </div>
      `;

      const container = blogSection.querySelector('.section-container');
      if (container) {
        const insertTarget = container.querySelector('.blog-search-container') ||
                             container.querySelector('.blog-filter-bar') ||
                             document.getElementById('blog-grid');
        if (insertTarget) {
          container.insertBefore(adminBar, insertTarget);
        } else {
          container.prepend(adminBar);
        }
      }

      const logoutBtn = document.getElementById('blog-admin-logout-btn');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
          localStorage.removeItem('cadpi_admin_token');
          window.location.reload();
        });
      }
    }
  }

  // --- Dynamic Post Loading from Cloudflare KV ---
  async function loadDynamicPosts() {
    const grid = document.getElementById('blog-grid');
    if (!grid) return;

    try {
      const res = await fetch('/api/posts');
      if (!res.ok) return;
      const data = await res.json();
      if (!data.success || !Array.isArray(data.posts) || data.posts.length === 0) return;

      const isAdmin = Boolean(localStorage.getItem('cadpi_admin_token'));

      // Invert so newest post appears first
      const posts = [...data.posts].reverse();

      posts.forEach(post => {
        if (grid.querySelector(`[data-slug="${post.slug}"]`)) return;

        // Register in BLOG_ARTICLES for modal viewing
        BLOG_ARTICLES[post.slug] = {
          title: post.title,
          category: post.category,
          categorySlug: post.categorySlug || getCategorySlug(post.category),
          date: post.date,
          readTime: post.readTime,
          author: post.author,
          authorRole: post.authorRole || 'Investigator',
          avatarInitials: post.avatarInitials || 'PI',
          bodyHtml: post.bodyHtml,
          excerpt: post.excerpt,
          isCustom: true
        };

        const catSlug = post.categorySlug || getCategorySlug(post.category);
        ensureCategoryFilter(post.category, catSlug);

        const cardEl = createBlogCardElement(post, isAdmin);
        grid.prepend(cardEl);
      });

      applyCurrentFilter();
      if (typeof updateSearch === 'function') updateSearch();

      // Check hash again in case deep link was targeting a dynamic post
      handleUrlHash();
    } catch (err) {
      console.warn('Could not load dynamic dispatches:', err);
    }
  }

  // --- Admin Post Deletion Listener ---
  document.addEventListener('click', async (e) => {
    const deleteBtn = e.target.closest('.btn-card-delete');
    if (!deleteBtn) return;
    e.preventDefault();
    e.stopPropagation();

    const slug = deleteBtn.getAttribute('data-delete-slug');
    if (!slug) return;

    const token = localStorage.getItem('cadpi_admin_token');
    if (!token) {
      alert('You must be logged in as an administrator to delete dispatches.');
      return;
    }

    if (!confirm(`Are you sure you want to permanently delete and unpublish this dispatch (${slug})?`)) {
      return;
    }

    deleteBtn.disabled = true;
    deleteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

    try {
      const res = await fetch(`/api/admin/posts/${encodeURIComponent(slug)}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const card = deleteBtn.closest('.blog-card');
        if (card) card.remove();
        delete BLOG_ARTICLES[slug];
        if (typeof updateSearch === 'function') updateSearch();
      } else {
        alert(data.error || 'Failed to delete dispatch.');
        deleteBtn.disabled = false;
        deleteBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
      }
    } catch (err) {
      alert('Network error while deleting dispatch: ' + err.message);
      deleteBtn.disabled = false;
      deleteBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
    }
  });

  handleUrlHash();
  setupAdminMode();
  loadDynamicPosts();
})();


