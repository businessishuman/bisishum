/* =========================================================
   BUSINESS IS HUMAN — SCRIPT
========================================================= */

document.addEventListener('DOMContentLoaded', () => {


  /* -----------------------------------------------------
     2. MOBILE BURGER OVERLAY
  ----------------------------------------------------- */
  const burgerBtn = document.getElementById('burgerBtn');
  const overlay = document.getElementById('mobileOverlay');
  const mobileLinks = document.querySelectorAll('.js-mobile-link');

  function openOverlay() {
    overlay.classList.add('is-open');
    overlay.setAttribute('aria-hidden', 'false');
    burgerBtn.classList.add('is-active');
    burgerBtn.setAttribute('aria-expanded', 'true');
    document.body.classList.add('no-scroll');
  }

  function closeOverlay() {
    overlay.classList.remove('is-open');
    overlay.setAttribute('aria-hidden', 'true');
    burgerBtn.classList.remove('is-active');
    burgerBtn.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('no-scroll');
  }

  burgerBtn.addEventListener('click', () => {
    const isOpen = overlay.classList.contains('is-open');
    isOpen ? closeOverlay() : openOverlay();
  });

  mobileLinks.forEach(link => link.addEventListener('click', closeOverlay));

  // Escape key closes overlay
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay.classList.contains('is-open')) {
      closeOverlay();
    }
  });

  /* -----------------------------------------------------
     3. EXPLORE TABBED FILTER MENU
  ----------------------------------------------------- */
  const tabs = document.querySelectorAll('.explore__tab');
  const panels = document.querySelectorAll('.explore__panel');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-target');

      tabs.forEach(t => {
        t.classList.remove('is-active');
        t.setAttribute('aria-selected', 'false');
      });
      tab.classList.add('is-active');
      tab.setAttribute('aria-selected', 'true');

      panels.forEach(panel => {
        if (panel.id === targetId) {
          panel.hidden = false;
          panel.classList.add('is-active');
        } else {
          panel.hidden = true;
          panel.classList.remove('is-active');
        }
      });
    });
  });

  /* -----------------------------------------------------
     4. AIRTABLE FORM INTEGRATION
     Base ID:  app2NTrklLiQ54INc
     Table:    Requests
     Fields:   Full Name, Email address, Message, Timestamp
  ----------------------------------------------------- */
  const AIRTABLE_CONFIG = {
    baseId: 'app2NTrklLiQ54INc',
    table: 'Requests',
    // Submissions are proxied server-side via the Cloudflare Pages Function
    // at /api/submit so the Airtable token never reaches the browser.
    endpoint: '/api/submit'
  };

  function formatAUTimestamp(date) {
    // en-AU renders as DD/MM/YYYY, HH:mm
    return new Intl.DateTimeFormat('en-AU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false
    }).format(date);
  }

  function setFieldError(form, fieldId, message) {
    const errorEl = form.querySelector(`[data-error-for="${fieldId}"]`);
    const inputEl = form.querySelector(`#${fieldId}`);
    if (errorEl) errorEl.textContent = message || '';
    if (inputEl) inputEl.classList.toggle('is-invalid', Boolean(message));
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function setSubmitState(button, isLoading) {
    button.classList.toggle('is-loading', isLoading);
    button.disabled = isLoading;
  }

  function showStatus(form, message, type) {
    const statusEl = form.parentElement.querySelector('.form__status') || form.querySelector('.form__status');
    if (!statusEl) return;
    statusEl.textContent = message;
    statusEl.classList.remove('is-success', 'is-error');
    if (type) statusEl.classList.add(type === 'success' ? 'is-success' : 'is-error');
  }

  async function submitToAirtable(fields) {
    const response = await fetch(AIRTABLE_CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        baseId: AIRTABLE_CONFIG.baseId,
        table: AIRTABLE_CONFIG.table,
        fields
      })
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody.message || `Request failed (${response.status})`);
    }
    return response.json();
  }

  /* ---- Get Started form (Name, Email, Message) ---- */
  const getStartedForm = document.getElementById('getStartedForm');
  if (getStartedForm) {
    getStartedForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const nameInput = getStartedForm.querySelector('#gs-name');
      const emailInput = getStartedForm.querySelector('#gs-email');
      const messageInput = getStartedForm.querySelector('#gs-message');
      const submitBtn = getStartedForm.querySelector('.form__submit');

      let hasError = false;
      setFieldError(getStartedForm, 'gs-name', '');
      setFieldError(getStartedForm, 'gs-email', '');
      setFieldError(getStartedForm, 'gs-message', '');

      if (!nameInput.value.trim()) {
        setFieldError(getStartedForm, 'gs-name', 'Please share your first name.');
        hasError = true;
      }
      if (!isValidEmail(emailInput.value.trim())) {
        setFieldError(getStartedForm, 'gs-email', 'Please enter a valid email address.');
        hasError = true;
      }
      if (!messageInput.value.trim()) {
        setFieldError(getStartedForm, 'gs-message', 'Let us know what you need help with.');
        hasError = true;
      }
      if (hasError) return;

      setSubmitState(submitBtn, true);
      showStatus(getStartedForm, '', null);

      try {
        await submitToAirtable({
          'Full Name': nameInput.value.trim(),
          'Email address': emailInput.value.trim(),
          'Message': messageInput.value.trim(),
          'Timestamp': formatAUTimestamp(new Date())
        });
        showStatus(getStartedForm, "Thanks — you'll hear from us within 2 days.", 'success');
        getStartedForm.reset();
      } catch (err) {
        showStatus(getStartedForm, 'Something went wrong. Please try again.', 'error');
        console.error('Airtable submission error:', err);
      } finally {
        setSubmitState(submitBtn, false);
      }
    });
  }

  /* ---- Newsletter form (Email only) ---- */
  const newsletterForm = document.getElementById('newsletterForm');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const emailInput = newsletterForm.querySelector('#nl-email');
      const submitBtn = newsletterForm.querySelector('.form__submit');

      setFieldError(newsletterForm, 'nl-email', '');

      if (!isValidEmail(emailInput.value.trim())) {
        setFieldError(newsletterForm, 'nl-email', 'Please enter a valid email address.');
        return;
      }

      setSubmitState(submitBtn, true);
      showStatus(newsletterForm, '', null);

      try {
        await submitToAirtable({
          'Email address': emailInput.value.trim(),
          'Timestamp': formatAUTimestamp(new Date())
        });
        showStatus(newsletterForm, 'Subscribed — welcome aboard.', 'success');
        newsletterForm.reset();
      } catch (err) {
        showStatus(newsletterForm, 'Something went wrong. Please try again.', 'error');
        console.error('Airtable submission error:', err);
      } finally {
        setSubmitState(submitBtn, false);
      }
    });
  }

  /* -----------------------------------------------------
     5. SCROLL-REVEAL (GSAP + ScrollTrigger, with fallback)
  ----------------------------------------------------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    ScrollTrigger.normalizeScroll(true);   // ← add this line, fixes mobile viewport jumpiness

    const revealTargets = document.querySelectorAll(
      '.method-card, .service-card, .stands-card, .value-item, .explore__panel-media'
    );

    revealTargets.forEach((el) => {
      gsap.fromTo(el,
        { opacity: 0, y: 24 },
        {
          opacity: 1, y: 0, duration: 0.6, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true }
        }
      );
    });
  }
/* -----------------------------------------------------
   6. FOOTER REVEAL (footer slides up off a pinned stage)
----------------------------------------------------- */
if (window.gsap && window.ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.normalizeScroll(true);

  const footerEl = document.querySelector('.site-footer');
  const revealStageEl = document.querySelector('.reveal-stage');

  if (footerEl && revealStageEl) {
    const st = gsap.to(footerEl, {
      yPercent: -100,
      ease: 'none',
      scrollTrigger: {
        trigger: revealStageEl,
        start: 'top top',
        end: '+=100%',
        pin: true,
        scrub: true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          const spacer = self.pin ? self.pin.parentNode : null;
          const target = spacer && spacer.classList.contains('pin-spacer') ? spacer : revealStageEl;
          target.style.zIndex = self.progress < 0.999 ? '600' : '490';
        }
      }
    }).scrollTrigger;
  }
}

});
