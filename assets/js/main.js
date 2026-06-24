/* ── Booking Widget ── */
(function () {
    var videos = document.querySelectorAll('.hero__video, .rooms-intro__video');
    if (!videos.length) return;

    function prepareVideo(video) {
        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');
        video.setAttribute('preload', 'auto');
    }

    function playVideo(video) {
        prepareVideo(video);
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
            playPromise.catch(function () {});
        }
    }

    function playAllVideos() {
        videos.forEach(playVideo);
    }

    videos.forEach(function (video) {
        prepareVideo(video);
        video.addEventListener('loadeddata', function () {
            playVideo(video);
        }, { once: true });
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', playAllVideos, { once: true });
    } else {
        playAllVideos();
    }

    window.addEventListener('load', playAllVideos, { once: true });
    window.addEventListener('touchstart', playAllVideos, { once: true, passive: true });
    window.addEventListener('pointerdown', playAllVideos, { once: true, passive: true });
})();

(function () {
    var storageKey = 'bzommarSmoothScrollTarget';

    function scrollToTarget(selector) {
        var target = selector ? document.querySelector(selector) : null;
        if (!target) return;
        var offset = window.innerWidth <= 768 ? 96 : 110;
        var top = target.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    }

    document.addEventListener('click', function (event) {
        var link = event.target.closest('[data-smooth-page-target]');
        if (!link) return;

        var targetSelector = link.getAttribute('data-smooth-page-target');
        var url = new URL(link.getAttribute('href'), window.location.href);
        var current = new URL(window.location.href);

        event.preventDefault();

        if (url.pathname === current.pathname) {
            scrollToTarget(targetSelector);
            return;
        }

        sessionStorage.setItem(storageKey, targetSelector);
        window.location.href = url.href;
    });

    window.addEventListener('load', function () {
        var targetSelector = sessionStorage.getItem(storageKey);
        if (!targetSelector) return;
        sessionStorage.removeItem(storageKey);
        setTimeout(function () {
            scrollToTarget(targetSelector);
        }, 220);
    });
})();

(function () {
    var widget = document.getElementById('booking-widget');
    if (!widget) return;

    var steps = Array.from(widget.querySelectorAll('.booking-widget__step'));
    var checkinEl = document.getElementById('booking-checkin');
    var checkoutEl = document.getElementById('booking-checkout');
    var adultsEl = document.getElementById('booking-adults');
    var roomEl = document.getElementById('booking-room');
    var nameEl = document.getElementById('booking-name');
    var phoneEl = document.getElementById('booking-phone');
    var checkBtn = document.getElementById('booking-check-btn');
    var backBtn = document.getElementById('booking-back-btn');
    var submitBtn = document.getElementById('booking-submit-btn');
    var newBtn = document.getElementById('booking-new-btn');
    var errorStepOne = document.getElementById('booking-error');
    var errorStepTwo = document.getElementById('booking-error-2');
    var formspreeEndpoint = 'https://formspree.io/f/xvznerlr';
    var submitBtnText = submitBtn ? submitBtn.textContent : '';

    function formatDate(date) {
        var year = date.getFullYear();
        var month = String(date.getMonth() + 1).padStart(2, '0');
        var day = String(date.getDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
    }

    function showStep(stepNumber) {
        steps.forEach(function (step) {
            step.classList.toggle('booking-widget__step--active', step.getAttribute('data-step') === String(stepNumber));
        });
    }

    function setError(el, message) {
        if (el) {
            el.textContent = message;
        }
    }

    function clearErrors() {
        setError(errorStepOne, '');
        setError(errorStepTwo, '');
    }

    function getSelectedText(select) {
        if (!select || select.selectedIndex < 0) return '';
        return select.options[select.selectedIndex].textContent.trim();
    }

    function setSubmitLoading(isLoading) {
        if (!submitBtn) return;
        submitBtn.disabled = isLoading;
        submitBtn.textContent = isLoading ? 'Sending...' : submitBtnText;
    }

    function buildBookingPayload() {
        var payload = new FormData();
        payload.append('_subject', 'New Booking Request - Bzommar Palace Hotel');
        payload.append('Check In', checkinEl.value);
        payload.append('Check Out', checkoutEl.value);
        payload.append('Adults', adultsEl.value);
        payload.append('Room Type', getSelectedText(roomEl));
        payload.append('Full Name', nameEl.value.trim());
        payload.append('Phone Number', phoneEl.value.trim());
        return payload;
    }

    function syncDateInputs() {
        if (!checkinEl || !checkoutEl) return;

        var today = formatDate(new Date());
        checkinEl.min = today;
        checkoutEl.min = checkinEl.value || today;

        if (checkoutEl.value && checkinEl.value && checkoutEl.value <= checkinEl.value) {
            checkoutEl.value = '';
        }
    }

    function resetWidget() {
        if (checkinEl) checkinEl.value = '';
        if (checkoutEl) checkoutEl.value = '';
        if (adultsEl) adultsEl.value = '2';
        if (roomEl) roomEl.value = '';
        if (nameEl) nameEl.value = '';
        if (phoneEl) phoneEl.value = '';
        clearErrors();
        syncDateInputs();
        showStep(1);
        widget.classList.remove('booking-widget--card-visible');
    }

    if (checkinEl) {
        checkinEl.addEventListener('change', syncDateInputs);
    }

    if (checkBtn) {
        checkBtn.addEventListener('click', function () {
            clearErrors();

            if (window.innerWidth <= 768 && !widget.classList.contains('booking-widget--card-visible')) {
                widget.classList.add('booking-widget--card-visible');
                return;
            }

            if (!checkinEl.value || !checkoutEl.value || !roomEl.value || !adultsEl.value) {
                setError(errorStepOne, 'Please complete your stay details before continuing.');
                return;
            }

            if (checkoutEl.value <= checkinEl.value) {
                setError(errorStepOne, 'Check-out must be after check-in.');
                return;
            }

            showStep(2);
            if (nameEl) {
                nameEl.focus();
            }
        });
    }

    if (backBtn) {
        backBtn.addEventListener('click', function () {
            clearErrors();
            showStep(1);
        });
    }

    if (submitBtn) {
        submitBtn.addEventListener('click', function () {
            clearErrors();

            if (!nameEl.value.trim() || !phoneEl.value.trim()) {
                setError(errorStepTwo, 'Please enter your full name and phone number.');
                return;
            }

            setSubmitLoading(true);

            fetch(formspreeEndpoint, {
                method: 'POST',
                body: buildBookingPayload(),
                headers: {
                    Accept: 'application/json'
                }
            })
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error('Form submission failed');
                    }
                    showStep(3);
                })
                .catch(function () {
                    setError(errorStepTwo, 'Something went wrong. Please try again or contact us directly.');
                })
                .finally(function () {
                    setSubmitLoading(false);
                });
        });
    }

    if (newBtn) {
        newBtn.addEventListener('click', resetWidget);
    }

    syncDateInputs();
})();


/* ── Services Split View ── */
/* Booking Modal */
(function () {
    var bookingLinks = Array.from(document.querySelectorAll('.header .nav__cta[href$="booking.html"]'));
    if (!bookingLinks.length) return;

    var endpoint = 'https://formspree.io/f/xvznerlr';

    function formatDate(date) {
        var year = date.getFullYear();
        var month = String(date.getMonth() + 1).padStart(2, '0');
        var day = String(date.getDate()).padStart(2, '0');
        return year + '-' + month + '-' + day;
    }

    function createModal() {
        var modal = document.createElement('div');
        modal.className = 'booking-modal';
        modal.setAttribute('hidden', '');
        modal.innerHTML = [
            '<div class="booking-modal__backdrop" data-booking-modal-close></div>',
            '<div class="booking-modal__dialog" role="dialog" aria-modal="true" aria-labelledby="booking-modal-title">',
            '  <button type="button" class="booking-modal__close" data-booking-modal-close aria-label="Close booking modal">&times;</button>',
            '  <p class="booking-modal__eyebrow">Book Your Stay</p>',
            '  <h3 class="booking-modal__title" id="booking-modal-title">Choose what to book.</h3>',
            '  <div class="booking-modal__options">',
            '    <section class="booking-modal__item" data-booking-modal-item>',
            '      <button type="button" class="booking-modal__trigger" data-booking-modal-trigger aria-expanded="false">',
            '        <span class="booking-modal__icon"><i data-lucide="bed-double"></i></span>',
            '        <span><strong>Book Room</strong><small>Request your preferred stay dates</small></span>',
            '      </button>',
            '      <div class="booking-modal__panel">',
            '        <form class="booking-modal__form" data-booking-room-form>',
            '          <div class="booking-modal__grid">',
            '            <label class="booking-modal__field"><span>Check In</span><input type="date" name="Check In" required data-booking-modal-checkin></label>',
            '            <label class="booking-modal__field"><span>Check Out</span><input type="date" name="Check Out" required data-booking-modal-checkout></label>',
            '            <label class="booking-modal__field"><span>Adults</span><div class="booking-modal__select" data-booking-modal-select><input type="hidden" name="Adults" value="2"><button type="button" class="booking-modal__select-button" aria-expanded="false">2</button><div class="booking-modal__select-options"><button type="button" data-value="1">1</button><button type="button" data-value="2" class="is-active">2</button><button type="button" data-value="3">3</button><button type="button" data-value="4">4</button><button type="button" data-value="5">5</button><button type="button" data-value="6">6</button></div></div></label>',
            '            <label class="booking-modal__field"><span>Room Type</span><div class="booking-modal__select" data-booking-modal-select><input type="hidden" name="Room Type" value="" data-booking-modal-room><button type="button" class="booking-modal__select-button is-placeholder" aria-expanded="false">Select</button><div class="booking-modal__select-options"><button type="button" data-value="Twin Room">Twin Room</button><button type="button" data-value="Studio">Studio</button><button type="button" data-value="Family Room">Family Room</button><button type="button" data-value="Junior Suite">Junior Suite</button><button type="button" data-value="Executive Suite">Executive Suite</button><button type="button" data-value="Deluxe Sea View">Deluxe Sea View</button><button type="button" data-value="Standard Mountain View">Standard Mountain View</button></div></div></label>',
            '            <label class="booking-modal__field"><span>Full Name</span><input type="text" name="Full Name" placeholder="Your name" required></label>',
            '            <label class="booking-modal__field"><span>Phone Number</span><input type="tel" name="Phone Number" placeholder="+961 XX XXX XXX" inputmode="numeric" pattern="[0-9]*" required data-booking-modal-phone></label>',
            '          </div>',
            '          <p class="booking-modal__message" data-booking-modal-message></p>',
            '          <button type="submit" class="btn btn--primary booking-modal__submit">Submit Request</button>',
            '        </form>',
            '      </div>',
            '    </section>',
            '    <section class="booking-modal__item" data-booking-modal-item>',
            '      <button type="button" class="booking-modal__trigger" data-booking-modal-trigger aria-expanded="false">',
            '        <span class="booking-modal__icon"><i data-lucide="concierge-bell"></i></span>',
            '        <span><strong>Book Service</strong><small>Choose a restaurant or hosted experience</small></span>',
            '      </button>',
            '      <div class="booking-modal__panel">',
            '        <div class="booking-modal__service-list">',
            '          <a href="tilalbzommar.html" data-smooth-page-target="#reserve">Tilal Bzommar Restaurant</a>',
            '          <a href="pianobar.html" data-smooth-page-target="#reserve">Piano Bar</a>',
            '          <a href="garden.html" data-smooth-page-target="#reserve">Garden</a>',
            '          <a href="conference-hall.html" data-smooth-page-target="#reserve">Conference Hall</a>',
            '        </div>',
            '      </div>',
            '    </section>',
            '    <section class="booking-modal__item" data-booking-modal-item>',
            '      <a class="booking-modal__trigger booking-modal__trigger--link" href="wedding-packages.html" data-smooth-page-target="#wedding-venues-counter">',
            '        <span class="booking-modal__icon"><i data-lucide="landmark"></i></span>',
            '        <span><strong>Book Venue</strong><small>Choose your venue and guest count</small></span>',
            '      </a>',
            '    </section>',
            '  </div>',
            '</div>'
        ].join('');

        document.body.appendChild(modal);
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
        return modal;
    }

    var modal = createModal();
    var successModal = document.createElement('div');
    successModal.className = 'booking-success-modal';
    successModal.setAttribute('hidden', '');
    successModal.innerHTML = [
        '<div class="booking-success-modal__backdrop"></div>',
        '<div class="booking-success-modal__dialog" role="status" aria-live="polite">',
        '  <div class="booking-success-modal__icon"><i data-lucide="check"></i></div>',
        '  <p class="booking-success-modal__eyebrow">Request Sent</p>',
        '  <h3 class="booking-success-modal__title">Thank you!</h3>',
        '  <p class="booking-success-modal__text">We will reach out shortly to confirm your request.</p>',
        '</div>'
    ].join('');
    document.body.appendChild(successModal);
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }

    var form = modal.querySelector('[data-booking-room-form]');
    var checkinEl = modal.querySelector('[data-booking-modal-checkin]');
    var checkoutEl = modal.querySelector('[data-booking-modal-checkout]');
    var roomTypeEl = modal.querySelector('[data-booking-modal-room]');
    var phoneEl = modal.querySelector('[data-booking-modal-phone]');
    var messageEl = modal.querySelector('[data-booking-modal-message]');
    var submitBtn = modal.querySelector('.booking-modal__submit');
    var defaultSubmitText = submitBtn ? submitBtn.textContent : 'Submit Request';
    var successCloseTimer = null;
    var lockedScrollY = 0;
    var isPageLocked = false;

    function lockPageScroll() {
        if (isPageLocked) return;
        lockedScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
        document.documentElement.classList.add('modal-open');
        document.body.classList.add('modal-open');
        document.body.style.position = 'fixed';
        document.body.style.top = '-' + lockedScrollY + 'px';
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.width = '100%';
        isPageLocked = true;
    }

    function unlockPageScroll() {
        if (!isPageLocked) return;
        document.documentElement.classList.remove('modal-open');
        document.body.classList.remove('modal-open');
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.left = '';
        document.body.style.right = '';
        document.body.style.width = '';
        window.scrollTo(0, lockedScrollY);
        isPageLocked = false;
    }

    function preventBackgroundScroll(event) {
        if (event.target.closest('.booking-modal__dialog, .booking-success-modal__dialog')) return;
        event.preventDefault();
    }

    function setDateLimits() {
        if (!checkinEl || !checkoutEl) return;
        var today = formatDate(new Date());
        checkinEl.min = today;
        checkoutEl.min = checkinEl.value || today;
        if (checkoutEl.value && checkinEl.value && checkoutEl.value <= checkinEl.value) {
            checkoutEl.value = '';
        }
    }

    function openModal() {
        if (successCloseTimer) {
            clearTimeout(successCloseTimer);
            successCloseTimer = null;
        }
        if (messageEl) {
            messageEl.textContent = '';
            messageEl.classList.remove('is-visible', 'is-success');
        }
        modal.removeAttribute('hidden');
        lockPageScroll();
        setDateLimits();
        modal.querySelectorAll('[data-booking-modal-item]').forEach(function (item) {
            item.classList.remove('is-open');
            var trigger = item.querySelector('[data-booking-modal-trigger]');
            if (trigger) {
                trigger.setAttribute('aria-expanded', 'false');
            }
        });
    }

    function closeModal() {
        modal.setAttribute('hidden', '');
        if (successModal.hasAttribute('hidden')) {
            unlockPageScroll();
        }
        if (successCloseTimer) {
            clearTimeout(successCloseTimer);
            successCloseTimer = null;
        }
    }

    function openSuccessModal() {
        successModal.removeAttribute('hidden');
        lockPageScroll();
        successCloseTimer = setTimeout(function () {
            successModal.setAttribute('hidden', '');
            unlockPageScroll();
            successCloseTimer = null;
        }, 2000);
    }

    window.BzommarBookingSuccess = openSuccessModal;

    function openItem(targetItem, allowToggle) {
        var shouldClose = allowToggle && targetItem.classList.contains('is-open');

        modal.querySelectorAll('[data-booking-modal-item]').forEach(function (item) {
            var isOpen = item === targetItem && !shouldClose;
            item.classList.toggle('is-open', isOpen);
            var trigger = item.querySelector('[data-booking-modal-trigger]');
            if (trigger) {
                trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
            }
        });
    }

    function closeCustomSelects(except) {
        modal.querySelectorAll('[data-booking-modal-select]').forEach(function (select) {
            if (select === except) return;
            select.classList.remove('is-open');
            var button = select.querySelector('.booking-modal__select-button');
            if (button) {
                button.setAttribute('aria-expanded', 'false');
            }
        });
    }

    function resetCustomSelects() {
        modal.querySelectorAll('[data-booking-modal-select]').forEach(function (select) {
            var input = select.querySelector('input[type="hidden"]');
            var button = select.querySelector('.booking-modal__select-button');
            var options = Array.from(select.querySelectorAll('.booking-modal__select-options button'));
            var active = options.find(function (option) {
                return option.classList.contains('is-active');
            });

            if (input && input.getAttribute('name') === 'Adults') {
                input.value = '2';
                if (button) {
                    button.textContent = '2';
                    button.classList.remove('is-placeholder');
                }
                options.forEach(function (option) {
                    option.classList.toggle('is-active', option.getAttribute('data-value') === '2');
                });
                return;
            }

            if (input) input.value = '';
            if (button) {
                button.textContent = 'Select';
                button.classList.add('is-placeholder');
            }
            if (active) active.classList.remove('is-active');
        });
    }

    bookingLinks.forEach(function (link) {
        link.addEventListener('click', function (event) {
            event.preventDefault();
            openModal();
        });
    });

    modal.querySelectorAll('[data-booking-modal-close]').forEach(function (button) {
        button.addEventListener('click', closeModal);
    });

    modal.addEventListener('touchmove', preventBackgroundScroll, { passive: false });
    modal.addEventListener('wheel', preventBackgroundScroll, { passive: false });
    successModal.addEventListener('touchmove', preventBackgroundScroll, { passive: false });
    successModal.addEventListener('wheel', preventBackgroundScroll, { passive: false });

    modal.querySelectorAll('[data-booking-modal-trigger]').forEach(function (trigger) {
        trigger.addEventListener('click', function () {
            var item = trigger.closest('[data-booking-modal-item]');
            if (item) openItem(item, true);
        });
    });

    modal.querySelectorAll('[data-booking-modal-select]').forEach(function (select) {
        var input = select.querySelector('input[type="hidden"]');
        var button = select.querySelector('.booking-modal__select-button');
        var options = Array.from(select.querySelectorAll('.booking-modal__select-options button'));

        button.addEventListener('click', function (event) {
            event.stopPropagation();
            var willOpen = !select.classList.contains('is-open');
            closeCustomSelects(willOpen ? select : null);
            select.classList.toggle('is-open', willOpen);
            button.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        });

        options.forEach(function (option) {
            option.addEventListener('click', function () {
                input.value = option.getAttribute('data-value') || '';
                button.textContent = option.textContent.trim();
                button.classList.remove('is-placeholder');
                options.forEach(function (item) {
                    item.classList.toggle('is-active', item === option);
                });
                closeCustomSelects();
            });
        });
    });

    modal.querySelectorAll('.booking-modal__service-list a, .booking-modal__trigger--link').forEach(function (link) {
        link.addEventListener('click', closeModal);
    });

    document.addEventListener('click', function () {
        closeCustomSelects();
    });

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && !modal.hasAttribute('hidden')) {
            closeModal();
        }
    });

    if (checkinEl) {
        checkinEl.addEventListener('change', setDateLimits);
    }

    if (phoneEl) {
        phoneEl.addEventListener('input', function () {
            phoneEl.value = phoneEl.value.replace(/\D/g, '');
        });
    }

    if (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            if (messageEl) messageEl.textContent = '';

            if (checkoutEl.value <= checkinEl.value) {
                if (messageEl) messageEl.textContent = 'Check-out must be after check-in.';
                return;
            }

            if (!roomTypeEl.value) {
                if (messageEl) messageEl.textContent = 'Please choose a room type.';
                return;
            }

            var payload = new FormData(form);
            payload.append('_subject', 'New Room Booking Request - Bzommar Palace Hotel');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            fetch(endpoint, {
                method: 'POST',
                body: payload,
                headers: {
                    Accept: 'application/json'
                }
            })
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error('Form submission failed');
                    }
                    form.reset();
                    resetCustomSelects();
                    setDateLimits();
                    closeModal();
                    openSuccessModal();
                })
                .catch(function () {
                    if (messageEl) messageEl.textContent = 'Something went wrong. Please try again or contact us directly.';
                })
                .finally(function () {
                    submitBtn.disabled = false;
                    submitBtn.textContent = defaultSubmitText;
                });
        });
    }
})();

(function () {
    var forms = Array.from(document.querySelectorAll('.footer-newsletter__form'));
    if (!forms.length) return;

    forms.forEach(function (form) {
        var emailEl = form.querySelector('.footer-newsletter__input');
        var checkboxEl = form.querySelector('.footer-newsletter__checkbox input[type="checkbox"]');
        var submitBtn = form.querySelector('.footer-newsletter__btn');
        var defaultLabel = submitBtn ? submitBtn.getAttribute('aria-label') || 'Subscribe' : 'Subscribe';

        form.setAttribute('action', 'https://formspree.io/f/xjgqvlpk');
        form.setAttribute('method', 'post');

        if (emailEl) {
            emailEl.name = 'Email';
            emailEl.required = true;
        }
        if (checkboxEl) {
            checkboxEl.name = 'Privacy Policy Agreement';
            checkboxEl.value = 'Agreed';
            checkboxEl.required = true;
        }

        form.addEventListener('submit', function (event) {
            event.preventDefault();

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.setAttribute('aria-label', 'Subscribing');
            }

            var payload = new FormData(form);
            payload.append('_subject', 'New Newsletter Subscription - Bzommar Palace Hotel');

            fetch(form.getAttribute('action'), {
                method: 'POST',
                body: payload,
                headers: {
                    Accept: 'application/json'
                }
            })
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error('Newsletter submission failed');
                    }
                    form.reset();
                    if (typeof window.BzommarBookingSuccess === 'function') {
                        window.BzommarBookingSuccess();
                    } else {
                        window.alert('Thank you for subscribing.');
                    }
                })
                .catch(function () {
                    window.alert('Something went wrong. Please try again.');
                })
                .finally(function () {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.setAttribute('aria-label', defaultLabel);
                    }
                });
        });
    });
})();

(function () {
    var form = document.querySelector('.contact-reserve__form');
    if (!form) return;

    var submitBtn = form.querySelector('.contact-reserve__submit');
    var messageEl = form.querySelector('.contact-reserve__message');
    var phoneEl = form.querySelector('input[name="phone"]');
    var defaultText = submitBtn ? submitBtn.textContent : 'Make a Reservation';

    if (phoneEl) {
        phoneEl.addEventListener('input', function () {
            phoneEl.value = phoneEl.value.replace(/\D/g, '');
        });
    }

    form.addEventListener('submit', function (event) {
        event.preventDefault();
        if (messageEl) {
            messageEl.textContent = '';
            messageEl.classList.remove('is-error');
        }

        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';
        }

        var payload = new FormData(form);
        payload.append('_subject', 'New Contact Reservation - Bzommar Palace Hotel');

        fetch(form.getAttribute('action'), {
            method: 'POST',
            body: payload,
            headers: {
                Accept: 'application/json'
            }
        })
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('Form submission failed');
                }
                form.reset();
                if (typeof window.BzommarBookingSuccess === 'function') {
                    window.BzommarBookingSuccess();
                } else if (messageEl) {
                    messageEl.textContent = 'Thank you! We will reach out shortly.';
                }
            })
            .catch(function () {
                if (messageEl) {
                    messageEl.textContent = 'Something went wrong. Please try again or contact us directly.';
                    messageEl.classList.add('is-error');
                }
            })
            .finally(function () {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = defaultText;
                }
            });
    });
})();

(function () {
    var forms = Array.from(document.querySelectorAll('.tilal-reserve__form'));
    if (!forms.length) return;

    forms.forEach(function (form) {
        var submitBtn = form.querySelector('.tilal-reserve__btn');
        var defaultText = submitBtn ? submitBtn.textContent : 'Make a Reservation';
        var heading = form.closest('.tilal-reserve') ? form.closest('.tilal-reserve').querySelector('.tilal-reserve__heading') : null;
        var serviceName = heading ? heading.textContent.replace(/\s+/g, ' ').trim() : document.title;
        var fields = Array.from(form.querySelectorAll('.tilal-reserve__input'));
        var guestsEl = fields[0];
        var dateEl = fields[1];
        var timeEl = fields[2];
        var nameEl = fields[3];
        var emailEl = fields[4];
        var phoneEl = fields[5];
        var requestsEl = fields[6];

        if (guestsEl) {
            guestsEl.name = 'Party Size';
            guestsEl.required = true;
        }
        if (dateEl) {
            dateEl.name = 'Date';
            dateEl.required = true;
        }
        if (timeEl) {
            timeEl.name = 'Time';
            timeEl.required = true;
        }
        if (nameEl) {
            nameEl.name = 'Name';
            nameEl.required = true;
        }
        if (emailEl) {
            emailEl.name = 'Email';
            emailEl.required = true;
        }
        if (phoneEl) {
            phoneEl.name = 'Phone';
            phoneEl.required = true;
            phoneEl.setAttribute('inputmode', 'numeric');
            phoneEl.setAttribute('pattern', '[0-9]*');
            phoneEl.addEventListener('input', function () {
                phoneEl.value = phoneEl.value.replace(/\D/g, '');
            });
        }
        if (requestsEl) {
            requestsEl.name = 'Special Requests';
        }

        form.setAttribute('action', 'https://formspree.io/f/mykqybrg');
        form.setAttribute('method', 'post');

        form.addEventListener('submit', function (event) {
            event.preventDefault();

            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Sending...';
            }

            var payload = new FormData(form);
            payload.append('_subject', 'New Service Reservation - Bzommar Palace Hotel');
            payload.append('Service', serviceName);

            fetch(form.getAttribute('action'), {
                method: 'POST',
                body: payload,
                headers: {
                    Accept: 'application/json'
                }
            })
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error('Form submission failed');
                    }
                    form.reset();
                    if (typeof window.BzommarBookingSuccess === 'function') {
                        window.BzommarBookingSuccess();
                    } else {
                        window.alert('Thank you! We will reach out shortly.');
                    }
                })
                .catch(function () {
                    window.alert('Something went wrong. Please try again or contact us directly.');
                })
                .finally(function () {
                    if (submitBtn) {
                        submitBtn.disabled = false;
                        submitBtn.textContent = defaultText;
                    }
                });
        });
    });
})();

(function () {
    var section = document.querySelector('.services-sv');
    if (!section) return;

    var svEl = section;
    var track = svEl.querySelector('.services-sv__track');
    var sourceTrack = document.querySelector('.services-carousel__body .services-carousel__track');
    var leftEl = svEl.querySelector('.services-sv__left');
    var curEl = svEl.querySelector('.services-sv__cur');
    var totEl = svEl.querySelector('.services-sv__tot');
    var eyeEl = svEl.querySelector('.services-sv__eyebrow');
    var titleEl = svEl.querySelector('.services-sv__title');
    var descEl = svEl.querySelector('.services-sv__desc');
    var prevBtn = svEl.querySelector('.services-sv__btn--prev');
    var nextBtn = svEl.querySelector('.services-sv__btn--next');

    if (!track || !sourceTrack || !leftEl) return;

    var origCards = Array.from(sourceTrack.children);
    var slides = [];

    track.innerHTML = '';

    for (var i = 0; i < origCards.length; i++) {
        var card = origCards[i];
        var imgEl = card.querySelector('.service-card__image');

        slides.push({
            image: imgEl ? imgEl.style.backgroundImage : '',
            eyebrow: (card.querySelector('.service-card__subtitle') || {}).textContent || '',
            title: (card.querySelector('.service-card__title') || {}).textContent || '',
            desc: (card.querySelector('.service-card__description') || {}).textContent || '',
            link: card.getAttribute('data-link') || '#'
        });
    }

    if (!slides.length) return;

    /* Build absolutely-positioned slide elements */
    var slideEls = [];
    for (var j = 0; j < slides.length; j++) {
        var div = document.createElement('div');
        div.className = 'services-sv__slide';
        div.style.backgroundImage = slides[j].image;
        track.appendChild(div);
        slideEls.push(div);
    }

    var total       = slides.length;
    var current     = 0;
    var isAnim      = false;
    var leftPeekEl  = null; /* tracks which slide is currently peeking left */

    if (totEl) totEl.textContent = total < 10 ? '0' + total : '' + total;

    /* ── Assign a single state class (or none for idle) ── */
    function setSlideClass(el, cls) {
        el.className = 'services-sv__slide' + (cls ? ' ' + cls : '');
    }

    /* Replace the left-peek slide — resets the old one to idle first */
    function setLeftPeek(el) {
        if (leftPeekEl && leftPeekEl !== el) setSlideClass(leftPeekEl, '');
        setSlideClass(el, 'is-left-peek');
        leftPeekEl = el;
    }

    /* ── Update left-column text with cross-fade ── */
    var ctaEl  = svEl.querySelector('.services-sv__cta');

    function updateText(idx) {
        leftEl.classList.add('is-updating');
        setTimeout(function () {
            if (curEl)   curEl.textContent   = (idx + 1) < 10 ? '0' + (idx + 1) : '' + (idx + 1);
            if (eyeEl)   eyeEl.textContent   = slides[idx].eyebrow;
            if (titleEl) titleEl.textContent = slides[idx].title;
            if (descEl)  descEl.textContent  = slides[idx].desc;
            if (ctaEl)   ctaEl.href          = slides[idx].link;
            leftEl.classList.remove('is-updating');
        }, 260);
    }

    /* ── Direction-aware navigation ── */
    function goTo(newIdx, dir, dragDelta) {
        if (isAnim) return;
        newIdx = ((newIdx % total) + total) % total;
        if (newIdx === current) return;

        var forward = (dir === 'next') ||
            (dir !== 'prev' && ((newIdx - current + total) % total) <= Math.floor(total / 2));

        isAnim = true;
        var prev     = current;
        current      = newIdx;
        var outgoing = slideEls[prev];
        var incoming = slideEls[current];

        /* If called from a drag release, seed --drag-start so the exit
           keyframe continues from the current drag position */
        if (dragDelta !== undefined) {
            outgoing.style.setProperty('--drag-start', dragDelta + 'px');
            outgoing.style.transform = ''; /* clear inline, let animation take over */
        }

        updateText(current);

        if (forward) {
            /* Outgoing exits left; incoming (was preview) slides in from right */
            setSlideClass(outgoing, 'is-exit-next');
            setSlideClass(incoming, 'is-enter-next');

            /* Reveal new preview slide from off-screen right */
            var newPreviewIdx = (current + 1) % total;
            var newPreview    = slideEls[newPreviewIdx];
            if (newPreview !== incoming && newPreview !== outgoing) {
                setSlideClass(newPreview, 'is-preview-reveal');
            }

            setTimeout(function () {
                outgoing.style.removeProperty('--drag-start');
                setLeftPeek(outgoing);
                setSlideClass(incoming, 'is-current');
                if (newPreview !== incoming && newPreview !== outgoing) {
                    setSlideClass(newPreview, 'is-preview');
                }
                isAnim = false;
            }, 920);

        } else {
            /* Going backward: outgoing drifts right to preview; incoming enters from left */

            /* incoming was leftPeekEl — clear the reference now so setLeftPeek
               doesn't reset it after we've already set it to is-current */
            if (leftPeekEl === incoming) leftPeekEl = null;

            setSlideClass(outgoing, 'is-to-preview');
            setSlideClass(incoming, 'is-enter-prev');

            /* Clear the old right-preview (no longer the next slide) */
            var oldPreviewIdx = (prev + 1) % total;
            var oldPreview    = slideEls[oldPreviewIdx];
            if (oldPreview !== incoming && oldPreview !== outgoing) {
                setSlideClass(oldPreview, '');
            }

            /* New left-peek is the slide before the newly current one */
            var newLeftPeekIdx = (current - 1 + total) % total;
            var newLeftPeek    = slideEls[newLeftPeekIdx];

            /* Animate it in from off-screen left now (concurrent with main transition) */
            if (newLeftPeek !== incoming && newLeftPeek !== outgoing) {
                if (leftPeekEl && leftPeekEl !== newLeftPeek) {
                    setSlideClass(leftPeekEl, '');
                    leftPeekEl = null;
                }
                setSlideClass(newLeftPeek, 'is-left-peek-reveal');
            }

            setTimeout(function () {
                outgoing.style.removeProperty('--drag-start');
                setSlideClass(incoming, 'is-current');
                setSlideClass(outgoing, 'is-preview');
                /* Lock the revealed left-peek into its static position */
                if (newLeftPeek !== incoming && newLeftPeek !== outgoing) {
                    leftPeekEl = newLeftPeek;
                    setSlideClass(newLeftPeek, 'is-left-peek');
                } else {
                    if (leftPeekEl && leftPeekEl !== incoming && leftPeekEl !== outgoing) {
                        setSlideClass(leftPeekEl, '');
                        leftPeekEl = null;
                    }
                }
                isAnim = false;
            }, 920);
        }
    }

    if (prevBtn) prevBtn.addEventListener('click', function () { stopAuto(); goTo(current - 1, 'prev'); startAuto(); });
    if (nextBtn) nextBtn.addEventListener('click', function () { stopAuto(); goTo(current + 1, 'next'); startAuto(); });

    /* Touch swipe on right image panel */
    var rightEl    = svEl.querySelector('.services-sv__right') || svEl;
    var touchStart = 0;
    rightEl.addEventListener('touchstart', function (e) {
        touchStart = e.touches[0].clientX;
    }, { passive: true });
    rightEl.addEventListener('touchend', function (e) {
        var diff = touchStart - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 48) {
            stopAuto();
            goTo(diff > 0 ? current + 1 : current - 1, diff > 0 ? 'next' : 'prev');
            startAuto();
        }
    }, { passive: true });

    /* Mouse drag with live image movement */
    var dragStartX  = 0;
    var isDragging  = false;
    var dragMoved   = false;

    /* Apply a live offset to the dragged slide only */
    function setDragTransform(delta) {
        var cur = slideEls[current];
        cur.style.transition = 'none';
        cur.style.transform  = 'translateX(' + delta + 'px)';
    }

    /* Clear inline override — optionally with a snap-back transition */
    function clearDragTransform(snap) {
        var cur = slideEls[current];
        if (snap) cur.style.transition = 'transform 0.45s cubic-bezier(0.22, 1, 0.36, 1)';
        cur.style.transform = '';
        if (snap) {
            setTimeout(function () { cur.style.transition = ''; }, 450);
        } else {
            cur.style.transition = '';
        }
    }

    /* Only initiate drag when clicking directly on a visible slide */
    section.addEventListener('mousedown', function (e) {
        if (e.button !== 0) return;
        var tgt = e.target.closest ? e.target.closest('.services-sv__slide') : null;
        if (!tgt) return;
        var cls = tgt.className;
        if (cls.indexOf('is-current') === -1 &&
            cls.indexOf('is-preview')  === -1 &&
            cls.indexOf('is-left-peek') === -1) return;
        dragStartX  = e.clientX;
        isDragging  = true;
        dragMoved   = false;
        document.body.style.cursor = 'grabbing';
        e.preventDefault();
    });

    window.addEventListener('mousemove', function (e) {
        if (!isDragging) return;
        var delta = e.clientX - dragStartX;
        if (Math.abs(delta) > 4) dragMoved = true;
        setDragTransform(delta);
    });

    window.addEventListener('mouseup', function (e) {
        if (!isDragging) return;
        isDragging = false;
        document.body.style.cursor = '';
        var delta = e.clientX - dragStartX;
        if (dragMoved && Math.abs(delta) > 72) {
            /* Pass delta so goTo seeds --drag-start and animation starts from here */
            stopAuto();
            goTo(delta < 0 ? current + 1 : current - 1, delta < 0 ? 'next' : 'prev', delta);
            startAuto();
        } else {
            clearDragTransform(true);
        }
    });

    /* Auto-advance */
    var autoTimer;
    function startAuto() {
        stopAuto();
        autoTimer = setInterval(function () { goTo(current + 1, 'next'); }, 5500);
    }
    function stopAuto() { clearInterval(autoTimer); }

    svEl.addEventListener('pointerenter', stopAuto);
    svEl.addEventListener('pointerleave', startAuto);

    /* Init: slide 0 = current, slide 1 = right-preview, last slide = left-peek */
    updateText(0);
    setSlideClass(slideEls[0], 'is-current');
    if (slideEls[1]) setSlideClass(slideEls[1], 'is-preview');
    leftPeekEl = slideEls[total - 1];
    setSlideClass(leftPeekEl, 'is-left-peek');
    startAuto();
})();


/* ── Reviews Carousel ── */
(function () {
    var section = document.querySelector('.reviews');
    if (!section) return;

    var track = section.querySelector('.reviews__track');
    var dotsWrap = section.querySelector('.reviews__dots');
    if (!track || !dotsWrap) return;

    var slides = Array.from(track.children);
    var total = slides.length;
    if (!total) return;

    var current = 0;

    /* Create dot buttons */
    for (var i = 0; i < total; i++) {
        var dot = document.createElement('button');
        dot.className = 'reviews__dot';
        dot.setAttribute('aria-label', 'Go to review ' + (i + 1));
        if (i === 0) dot.classList.add('is-active');
        dot.dataset.index = i;
        dotsWrap.appendChild(dot);
    }

    var dots = Array.from(dotsWrap.children);

    function goTo(idx) {
        current = ((idx % total) + total) % total;
        track.style.transform = 'translateX(-' + (current * 100) + '%)';
        for (var d = 0; d < dots.length; d++) {
            dots[d].classList.toggle('is-active', d === current);
        }
    }

    dotsWrap.addEventListener('click', function (e) {
        var dot = e.target.closest('.reviews__dot');
        if (!dot) return;
        stopAuto();
        goTo(parseInt(dot.dataset.index, 10));
        startAuto();
    });

    /* Auto-advance */
    var autoTimer;
    function startAuto() {
        stopAuto();
        autoTimer = setInterval(function () {
            goTo(current + 1);
        }, 6000);
    }
    function stopAuto() {
        clearInterval(autoTimer);
    }

    section.addEventListener('pointerenter', stopAuto);
    section.addEventListener('pointerleave', startAuto);

    /* ── Drag / swipe ── */
    var isDragging = false;
    var dragStartX = 0;
    var dragCurrentX = 0;
    var activePointerId = null;
    var SWIPE_THRESHOLD = 50;

    track.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        isDragging = true;
        activePointerId = e.pointerId;
        dragStartX = e.clientX;
        dragCurrentX = e.clientX;
        track.classList.add('is-dragging');
        if (track.setPointerCapture) track.setPointerCapture(e.pointerId);
        stopAuto();
    });

    track.addEventListener('pointermove', function (e) {
        if (!isDragging || e.pointerId !== activePointerId) return;
        dragCurrentX = e.clientX;
        var delta = dragCurrentX - dragStartX;
        var basePx = -(current * track.parentElement.offsetWidth);
        track.style.transform = 'translateX(' + (basePx + delta) + 'px)';
    });

    track.addEventListener('pointerup', function (e) {
        if (!isDragging || e.pointerId !== activePointerId) return;
        isDragging = false;
        activePointerId = null;
        track.classList.remove('is-dragging');
        if (track.releasePointerCapture && track.hasPointerCapture && track.hasPointerCapture(e.pointerId)) {
            track.releasePointerCapture(e.pointerId);
        }
        var diff = dragCurrentX - dragStartX;
        if (diff < -SWIPE_THRESHOLD) {
            goTo(current + 1);
        } else if (diff > SWIPE_THRESHOLD) {
            goTo(current - 1);
        } else {
            goTo(current);
        }
        startAuto();
    });

    track.addEventListener('pointercancel', function (e) {
        if (activePointerId !== null && e.pointerId !== activePointerId) return;
        isDragging = false;
        activePointerId = null;
        track.classList.remove('is-dragging');
        goTo(current);
        startAuto();
    });

    track.addEventListener('dragstart', function (e) { e.preventDefault(); });

    startAuto();
})();

/* ── Rooms Mobile Carousel ── */
(function () {
    var section = document.querySelector('.rooms-available');
    if (!section) return;

    var track = section.querySelector('.rooms-mobile__track');
    var pagination = section.querySelector('.rooms-mobile__pagination');
    if (!track) return;

    /* Populate track by cloning all room cards from the grid */
    var gridCards = section.querySelectorAll('.rooms-available__grid .room-card');
    if (!gridCards.length) return;

    for (var c = 0; c < gridCards.length; c++) {
        var clone = gridCards[c].cloneNode(true);
        clone.classList.remove('room-card--horizontal');
        track.appendChild(clone);
    }

    var origCards = Array.from(track.children);
    var total = origCards.length;

    /* Clone for infinite loop */
    var CLONES = total;
    for (var i = 0; i < CLONES; i++) {
        var cloneEnd = origCards[i % total].cloneNode(true);
        cloneEnd.setAttribute('aria-hidden', 'true');
        track.appendChild(cloneEnd);
    }
    for (var j = total - 1; j >= total - CLONES; j--) {
        var cloneStart = origCards[((j % total) + total) % total].cloneNode(true);
        cloneStart.setAttribute('aria-hidden', 'true');
        track.insertBefore(cloneStart, track.firstChild);
    }

    var allCards = Array.from(track.children);
    var index = CLONES;
    var isTransitioning = false;
    var isWrapping = false;

    function getCardWidth() {
        var gap = parseFloat(getComputedStyle(track).gap) || 0;
        return allCards[0].offsetWidth + gap;
    }

    function getViewportCenter() {
        return section.querySelector('.rooms-mobile__viewport').offsetWidth / 2;
    }

    function getRealIndex() {
        return ((index - CLONES) % total + total) % total;
    }

    function updateClasses() {
        for (var i = 0; i < allCards.length; i++) {
            allCards[i].classList.remove('is-center');
        }
        if (allCards[index]) allCards[index].classList.add('is-center');
        var real = getRealIndex();
        for (var d = 0; d < dots.length; d++) {
            dots[d].classList.toggle('active', d === real);
        }
    }

    function positionTrack(animate, skipClasses) {
        var cardW = getCardWidth();
        var center = getViewportCenter();
        var gap = parseFloat(getComputedStyle(track).gap) || 0;
        var cardCenter = cardW / 2 - gap / 2;
        var offset = -(index * cardW) + center - cardCenter;

        if (!animate) {
            track.classList.add('no-transition');
        } else {
            track.classList.remove('no-transition');
        }
        track.style.transform = 'translateX(' + offset + 'px)';
        if (!skipClasses) updateClasses();

        if (!animate) {
            void track.offsetHeight;
            track.classList.remove('no-transition');
        }
    }

    function normalizeIndexAfterLoop() {
        if (index >= CLONES + total) {
            index -= total;
            return true;
        }
        if (index < CLONES) {
            index += total;
            return true;
        }
        return false;
    }

    function snapLoopPosition() {
        if (!normalizeIndexAfterLoop()) return;
        isWrapping = true;
        positionTrack(false, true);
        requestAnimationFrame(function () {
            updateClasses();
            isWrapping = false;
        });
    }

    function goTo(newIndex, animate) {
        if (isWrapping) return;
        if (isTransitioning) {
            track.classList.add('no-transition');
            normalizeIndexAfterLoop();
            positionTrack(false);
            void track.offsetHeight;
            track.classList.remove('no-transition');
        }
        index = newIndex;
        if (animate) isTransitioning = true;
        positionTrack(animate !== false);
    }

    /* Pagination dots */
    var dots = [];
    if (pagination) {
        for (var d = 0; d < total; d++) {
            (function (di) {
                var dot = document.createElement('button');
                dot.className = 'rooms-mobile__dot' + (di === 0 ? ' active' : '');
                dot.setAttribute('aria-label', 'Go to slide ' + (di + 1));
                dot.addEventListener('click', function () {
                    goTo(CLONES + di, true);
                });
                pagination.appendChild(dot);
                dots.push(dot);
            })(d);
        }
    }

    track.addEventListener('transitionend', function (e) {
        if (e.target !== track) return;
        isTransitioning = false;
        snapLoopPosition();
    });

    /* Swipe / drag */
    var isDragging = false;
    var dragStartX = 0;
    var dragCurrentX = 0;
    var dragBaseOffset = 0;
    var pointerHistory = [];

    function getCurrentOffset() {
        var cardW = getCardWidth();
        var center = getViewportCenter();
        var gap = parseFloat(getComputedStyle(track).gap) || 0;
        var cardCenter = cardW / 2 - gap / 2;
        return -(index * cardW) + center - cardCenter;
    }

    function getIndexFromOffset(px) {
        var cardW = getCardWidth();
        var center = getViewportCenter();
        var gap = parseFloat(getComputedStyle(track).gap) || 0;
        var cardCenter = cardW / 2 - gap / 2;
        return Math.round((center - cardCenter - px) / cardW);
    }

    function snapToNearest(currentPx) {
        var nearest = getIndexFromOffset(currentPx);
        nearest = Math.max(0, Math.min(nearest, allCards.length - 1));
        index = nearest;
        isTransitioning = true;
        track.classList.remove('no-transition', 'is-dragging');
        positionTrack(true);
    }

    track.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (isWrapping) return;
        if (isTransitioning) {
            var mx = new DOMMatrix(getComputedStyle(track).transform);
            dragBaseOffset = mx.m41;
            isTransitioning = false;
        } else {
            dragBaseOffset = getCurrentOffset();
        }
        isDragging = true;
        dragStartX = e.clientX;
        dragCurrentX = e.clientX;
        pointerHistory = [{ x: e.clientX, t: performance.now() }];
        track.classList.add('is-dragging');
        track.setPointerCapture(e.pointerId);
    });

    track.addEventListener('pointermove', function (e) {
        if (!isDragging) return;
        dragCurrentX = e.clientX;
        pointerHistory.push({ x: dragCurrentX, t: performance.now() });
        if (pointerHistory.length > 5) pointerHistory.shift();
        var delta = dragCurrentX - dragStartX;
        track.style.transform = 'translateX(' + (dragBaseOffset + delta) + 'px)';
    });

    track.addEventListener('pointerup', function () {
        if (!isDragging) return;
        isDragging = false;
        track.classList.remove('is-dragging');

        var velocityX = 0;
        if (pointerHistory.length >= 2) {
            var oldest = pointerHistory[0];
            var newest = pointerHistory[pointerHistory.length - 1];
            var dt = newest.t - oldest.t;
            if (dt > 0 && dt < 300) {
                velocityX = (newest.x - oldest.x) / (dt / 16);
            }
        }
        var currentPx = dragBaseOffset + (dragCurrentX - dragStartX);
        if (Math.abs(velocityX) > 2) {
            /* Simple momentum: project final position */
            var projected = currentPx + velocityX * 8;
            snapToNearest(projected);
        } else {
            snapToNearest(currentPx);
        }
    });

    track.addEventListener('pointercancel', function () {
        isDragging = false;
        track.classList.remove('is-dragging');
        positionTrack(true);
    });

    track.addEventListener('dragstart', function (e) { e.preventDefault(); });

    /* Auto-advance */
    var autoTimer;
    function startAuto() {
        clearInterval(autoTimer);
        autoTimer = setInterval(function () {
            if (!isDragging && !isTransitioning) goTo(index + 1, true);
        }, 5000);
    }
    section.addEventListener('pointerenter', function () { clearInterval(autoTimer); });
    section.addEventListener('pointerleave', startAuto);

    /* Resize */
    var resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () { positionTrack(false); }, 150);
    });

    /* Init */
    positionTrack(false);
    startAuto();

    /* Re-init Lucide icons on cloned cards */
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
})();

/* ── Scroll Button ── */
(function () {
    var scrollButtons = document.querySelectorAll('.scroll-down .circle');
    var isAutoScrolling = false;

    function easeInOutQuad(t) {
        return t < 0.5
            ? 2 * t * t
            : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    function easeOutQuad(t) {
        return 1 - (1 - t) * (1 - t);
    }

    function smoothScrollTo(targetY, durationMultiplier, minDuration, maxDuration, easingFn) {
    if (isAutoScrolling) return;
    isAutoScrolling = true;

    var ease = easingFn || easeInOutQuad;
    var startY = window.pageYOffset;
    var distance = targetY - startY;

    var duration = Math.min(
        maxDuration || 3000,
        Math.max(minDuration || 1400, Math.abs(distance) * (durationMultiplier || 1.4))
    );

    var startTime = performance.now();

    function step(now) {
        var elapsed = now - startTime;
        var progress = Math.min(elapsed / duration, 1);
        var eased = ease(progress);

        window.scrollTo(0, startY + distance * eased);

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            isAutoScrolling = false;
        }
    }

        requestAnimationFrame(step);
    }   

    scrollButtons.forEach(function (button) {
    button.addEventListener('click', function () {
        var section = button.closest('section');
        if (!section) return;

        var next = section.nextElementSibling;
        while (next && next.tagName.toLowerCase() !== 'section' && next.tagName.toLowerCase() !== 'footer') {
            next = next.nextElementSibling;
        }
        if (!next) return;

        var targetY = next.offsetTop;
        var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
        targetY = Math.max(0, Math.min(targetY, maxScroll));

        if (section.classList.contains('rooms-intro')) {
            smoothScrollTo(targetY, 1.4, 1400, 2000, easeOutQuad);
        } else {
            smoothScrollTo(targetY, 1.4, 1400, 2800);
        }
    });
});     
})();

/* ── Rooms Intro Reveal ── */
(function () {
    var section = document.querySelector('.rooms-intro');
    if (!section) return;

    var isRevealed = false;
    var revealFrameOne = 0;
    var revealFrameTwo = 0;
    var isTicking = false;

    function clearPendingReveal() {
        if (revealFrameOne) {
            cancelAnimationFrame(revealFrameOne);
            revealFrameOne = 0;
        }

        if (revealFrameTwo) {
            cancelAnimationFrame(revealFrameTwo);
            revealFrameTwo = 0;
        }
    }

    function getVisibleHeight(rect) {
        var bounds = rect || section.getBoundingClientRect();
        var visibleTop = Math.max(bounds.top, 0);
        var visibleBottom = Math.min(bounds.bottom, window.innerHeight);

        return Math.max(0, visibleBottom - visibleTop);
    }

    function getEnterThreshold() {
        return Math.min(section.offsetHeight * 0.28, window.innerHeight * 0.4);
    }

    function getExitThreshold() {
        return Math.min(section.offsetHeight * 0.12, window.innerHeight * 0.18);
    }

    function shouldReveal(rect) {
        return getVisibleHeight(rect) >= getEnterThreshold();
    }

    function shouldReset(rect) {
        var bounds = rect || section.getBoundingClientRect();

        if (bounds.bottom <= 0 || bounds.top >= window.innerHeight) {
            return true;
        }

        return getVisibleHeight(bounds) <= getExitThreshold();
    }

    function revealSection() {
        if (isRevealed) return;
        isRevealed = true;

        clearPendingReveal();

        revealFrameOne = requestAnimationFrame(function () {
            revealFrameOne = 0;

            revealFrameTwo = requestAnimationFrame(function () {
                revealFrameTwo = 0;
                if (!isRevealed) return;

                section.classList.add('is-visible');
            });
        });
    }

    function resetSection() {
        if (!isRevealed && !section.classList.contains('is-visible')) return;

        isRevealed = false;
        clearPendingReveal();
        section.classList.remove('is-visible');
    }

    function syncSectionState() {
        var rect = section.getBoundingClientRect();

        if (shouldReveal(rect)) {
            revealSection();
            return;
        }

        if (shouldReset(rect)) {
            resetSection();
        }
    }

    function requestSync() {
        if (isTicking) return;
        isTicking = true;

        requestAnimationFrame(function () {
            isTicking = false;
            syncSectionState();
        });
    }

    window.addEventListener('scroll', requestSync, { passive: true });
    window.addEventListener('resize', requestSync);
    window.addEventListener('load', requestSync, { once: true });
    requestSync();
})();

/* ── Wedding Venue Auto-Scroll On Re-Entry From Above ── */
(function () {
    var section = document.querySelector('.wedding-venue');
    if (!section) return;

    var hasAutoPlayed = false;
    var isAnimating = false;
    var lastScrollY = window.pageYOffset;

    function easeInOutQuad(t) {
        return t < 0.5
            ? 2 * t * t
            : 1 - Math.pow(-2 * t + 2, 2) / 2;
    }

    function animateScrollTo(targetY, duration) {
        if (isAnimating) return;
        isAnimating = true;

        var startY = window.pageYOffset;
        var distance = targetY - startY;
        var startTime = performance.now();

        function step(now) {
            var elapsed = now - startTime;
            var progress = Math.min(elapsed / duration, 1);
            var eased = easeInOutQuad(progress);

            window.scrollTo(0, startY + distance * eased);

            if (progress < 1) {
                requestAnimationFrame(step);
            } else {
                isAnimating = false;
            }
        }

        requestAnimationFrame(step);
    }

    function checkWeddingAutoScroll() {
        var currentScrollY = window.pageYOffset;
        var scrollingDown = currentScrollY > lastScrollY;
        lastScrollY = currentScrollY;

        if (isAnimating) return;

        var rect = section.getBoundingClientRect();

        /* Reset only after user has gone back above the section */
        if (window.pageYOffset < section.offsetTop - window.innerHeight * 0.15) {
            hasAutoPlayed = false;
        }

        /* Trigger when section starts entering from bottom while scrolling down */
        if (
            scrollingDown &&
            !hasAutoPlayed &&
            rect.top <= window.innerHeight * 0.35 &&
            rect.top > 0 &&
            rect.bottom > window.innerHeight
        ) {
            hasAutoPlayed = true;

            var targetY = section.offsetTop + section.offsetHeight - window.innerHeight;
            animateScrollTo(targetY, 3200);
        }
    }

    var ticking = false;
    window.addEventListener('scroll', function () {
        if (!ticking) {
            requestAnimationFrame(function () {
                checkWeddingAutoScroll();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    checkWeddingAutoScroll();
})();

/* ── Rooms Flicker Bars – Scroll-Driven ── */
(function () {
    var sections = document.querySelectorAll('.rooms-available, .rooms-list, .services-carousel, .reviews, .tilal-dining, .about-history, .about-map, .wedding-testimonials, .wedding-promise, .wedding-venues, .wedding-cuisine, .tilal-menu-grid, .tilal-menu-preview, .tilal-events, .tilal-testimonials, .tilal-gallery, .tilal-reserve');
    if (!sections.length) return;

    var sharedBarSource = document.querySelector('.wedding-venues');
    var sharedBarTargets = document.querySelectorAll('.wedding-cuisine');

    var ticking = false;

    function updateBars() {
        sections.forEach(function (section) {
            var rect = section.getBoundingClientRect();
            var sectionH = section.offsetHeight;
            var progress = -rect.top / sectionH;
            var offset = progress * -50;
            section.style.setProperty('--bar-offset', offset + 'vh');
        });

        if (sharedBarSource && sharedBarTargets.length) {
            var sharedOffset = sharedBarSource.style.getPropertyValue('--bar-offset');

            sharedBarTargets.forEach(function (section) {
                section.style.setProperty('--bar-offset', sharedOffset);
            });
        }
    }

    window.addEventListener('scroll', function () {
        if (!ticking) {
            requestAnimationFrame(function () {
                updateBars();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    updateBars();
})();

/* ── Wedding Venue Scroll Animation ── */
(function () {
    var section = document.querySelector('.wedding-venue');
    if (!section) return;

    var sticky = section.querySelector('.wedding-venue__sticky');
    var imageWrap = section.querySelector('.wedding-venue__image-wrap');
    var image = section.querySelector('.wedding-venue__image');
    var overlay = section.querySelector('.wedding-venue__overlay');
    var content = section.querySelector('.wedding-venue__content');
    var header = section.querySelector('.wedding-venue__header');
    var cards = section.querySelectorAll('.wedding-venue__card');
    var cta = section.querySelector('.wedding-venue__cta');

    /* Scroll phases (fraction of total scroll through section):
       0.00 – 0.30 : mask reveal (half-circle expands to full image)
       0.25 – 0.40 : header slides up into view from below
       0.35 – 0.75 : cards slide up into view with stagger
       0.72 – 0.82 : CTA button slides up
       0.82 – 1.00 : exit zone, section scrolls away naturally
    */

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function clamp(val, min, max) {
        return Math.max(min, Math.min(max, val));
    }

    function easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    function easeInOutCubic(t) {
        return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    }

    function update() {
        var rect = section.getBoundingClientRect();
        var totalTravel = section.offsetHeight;
        if (totalTravel <= 0) return;

        /* Start animation as soon as rooms-intro starts scrolling away */
        var earlyOffset = window.innerHeight;
        var rawProgress = (window.innerHeight + earlyOffset - rect.top) / (totalTravel + earlyOffset);
        var progress = clamp(rawProgress, 0, 1);

        /* ── Phase 1: Trigger reveal (CSS transition handles animation) ── */
        if (progress >= 0.15) {
            imageWrap.classList.add('is-revealed');
        } else {
            imageWrap.classList.remove('is-revealed');
        }

        /* ── Expansion: triggers when section top reaches top 7% of viewport ── */
        if (rect.top <= window.innerHeight * 0.07) {
            imageWrap.classList.add('is-expanded');
        } else {
            imageWrap.classList.remove('is-expanded');
        }

        /* ── Overlay: only darkens gradually when the title comes into view ── */
        if (overlay) {
            var overlayT = clamp((progress - 0.40) / 0.30, 0, 1);
            var overlayEased = easeOutCubic(overlayT);
            overlay.style.opacity = lerp(0, 0.8, overlayEased);
        }

        /* ── Phase 2: Toggle header visibility ── */
        if (progress >= 0.60) {
            header.classList.add('is-visible');
        } else {
            header.classList.remove('is-visible');
        }

        /* ── Phase 3: Toggle cards visibility ── */
        if (progress >= 0.72) {
            for (var i = 0; i < cards.length; i++) {
                cards[i].classList.add('is-visible');
            }
        } else {
            for (var i = 0; i < cards.length; i++) {
                cards[i].classList.remove('is-visible');
            }
        }

        /* ── Phase 4: Toggle CTA visibility ── */
        if (cta) {
            if (progress >= 0.82) {
                cta.classList.add('is-visible');
            } else {
                cta.classList.remove('is-visible');
            }
        }
    }

    /* Throttled scroll listener */
    var ticking = false;
    window.addEventListener('scroll', function () {
        if (!ticking) {
            requestAnimationFrame(function () {
                update();
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });

    /* Initial call */
    update();
})();

/* ── Golden Droplets Effect ── */
(function () {
    var canvas = document.getElementById('golden-droplets');
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var hero = document.querySelector('.hero');
    var footer = document.querySelector('.footer');
    var particles = [];
    var PARTICLE_COUNT = 60;
    var dpr = window.devicePixelRatio || 1;
    var REPEL_RADIUS = 80;
    var REPEL_STRENGTH = 3;
    var mouseX = -9999;
    var mouseY = -9999;

    document.addEventListener('mousemove', function (e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    document.addEventListener('mouseleave', function () {
        mouseX = -9999;
        mouseY = -9999;
    });

    function resize() {
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = window.innerWidth + 'px';
        canvas.style.height = window.innerHeight + 'px';
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function createParticle(startAtTop) {
        var size = Math.random() * 2.5 + 1;
        return {
            x: Math.random() * window.innerWidth,
            y: startAtTop ? -10 : Math.random() * window.innerHeight,
            r: size,
            speedY: Math.random() * 0.4 + 0.15,
            speedX: (Math.random() - 0.5) * 0.3,
            vx: 0,
            vy: 0,
            wobbleAmp: Math.random() * 0.5 + 0.2,
            wobbleSpeed: Math.random() * 0.02 + 0.005,
            phase: Math.random() * Math.PI * 2,
            opacity: Math.random() * 0.35 + 0.1,
            glow: size > 2
        };
    }

    function init() {
        resize();
        particles = [];
        for (var i = 0; i < PARTICLE_COUNT; i++) {
            particles.push(createParticle(false));
        }
    }

    function getHeroBottom() {
        if (!hero) return 0;
        var rect = hero.getBoundingClientRect();
        return rect.bottom;
    }

    var tick = 0;
    function animate() {
        tick++;
        ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
        var heroBottom = getHeroBottom();

        for (var i = 0; i < particles.length; i++) {
            var p = particles[i];

            /* Mouse repulsion */
            var dx = p.x - mouseX;
            var dy = p.y - mouseY;
            var dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < REPEL_RADIUS && dist > 0) {
                var force = (1 - dist / REPEL_RADIUS) * REPEL_STRENGTH;
                p.vx += (dx / dist) * force;
                p.vy += (dy / dist) * force;
            }

            /* Apply velocity with friction */
            p.vx *= 0.92;
            p.vy *= 0.92;

            p.y += p.speedY + p.vy;
            p.x += p.speedX + Math.sin(p.phase + tick * p.wobbleSpeed) * p.wobbleAmp * 0.3 + p.vx;

            /* Respawn if out of viewport */
            if (p.y > window.innerHeight + 10) {
                particles[i] = createParticle(true);
                continue;
            }

            /* Skip drawing if inside hero or footer area */
            if (p.y < heroBottom) continue;
            if (footer) {
                var footerTop = footer.getBoundingClientRect().top;
                if (p.y > footerTop) continue;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);

            if (p.glow) {
                ctx.shadowBlur = 6;
                ctx.shadowColor = 'rgba(216, 155, 80, ' + (p.opacity * 0.5) + ')';
            } else {
                ctx.shadowBlur = 0;
            }

            ctx.fillStyle = 'rgba(216, 155, 80, ' + p.opacity + ')';
            ctx.fill();
        }

        ctx.shadowBlur = 0;
        requestAnimationFrame(animate);
    }

    init();
    animate();

    var resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resize, 150);
    });
})();

/* ── Events Showcase Mobile Carousel ── */
(function () {
    var section = document.querySelector('.events-showcase');
    if (!section) return;

    var track = section.querySelector('.events-showcase__mobile-track');
    var pagination = section.querySelector('.events-showcase__pagination');
    if (!track) return;

    /* Clone cards from the desktop grid into the mobile track */
    var gridCards = section.querySelectorAll('.events-showcase__grid .events-showcase__card');
    if (!gridCards.length) return;

    for (var c = 0; c < gridCards.length; c++) {
        var clone = gridCards[c].cloneNode(true);
        track.appendChild(clone);
    }

    var origCards = Array.from(track.children);
    var total = origCards.length;

    /* Clone for infinite loop */
    var CLONES = total;
    for (var i = 0; i < CLONES; i++) {
        var cloneEnd = origCards[i % total].cloneNode(true);
        cloneEnd.setAttribute('aria-hidden', 'true');
        track.appendChild(cloneEnd);
    }
    for (var j = total - 1; j >= total - CLONES; j--) {
        var cloneStart = origCards[((j % total) + total) % total].cloneNode(true);
        cloneStart.setAttribute('aria-hidden', 'true');
        track.insertBefore(cloneStart, track.firstChild);
    }

    var allCards = Array.from(track.children);
    var index = CLONES;
    var isTransitioning = false;

    function getCardWidth() {
        var gap = parseFloat(getComputedStyle(track).gap) || 0;
        return allCards[0].offsetWidth + gap;
    }

    function getViewportCenter() {
        return section.querySelector('.events-showcase__mobile-viewport').offsetWidth / 2;
    }

    function getRealIndex() {
        return ((index - CLONES) % total + total) % total;
    }

    function updateClasses() {
        for (var i = 0; i < allCards.length; i++) {
            allCards[i].classList.remove('is-center');
        }
        if (allCards[index]) allCards[index].classList.add('is-center');
        var real = getRealIndex();
        for (var d = 0; d < dots.length; d++) {
            dots[d].classList.toggle('active', d === real);
        }
    }

    function positionTrack(animate) {
        var cardW = getCardWidth();
        var center = getViewportCenter();
        var gap = parseFloat(getComputedStyle(track).gap) || 0;
        var cardCenter = cardW / 2 - gap / 2;
        var offset = -(index * cardW) + center - cardCenter;

        if (!animate) {
            track.classList.add('no-transition');
        } else {
            track.classList.remove('no-transition');
        }
        track.style.transform = 'translateX(' + offset + 'px)';
        updateClasses();

        if (!animate) {
            void track.offsetHeight;
            track.classList.remove('no-transition');
        }
    }

    function goTo(newIndex, animate) {
        if (isTransitioning) {
            track.classList.add('no-transition');
            if (index >= CLONES + total) index -= total;
            else if (index < CLONES) index += total;
            positionTrack(false);
            void track.offsetHeight;
            track.classList.remove('no-transition');
        }
        index = newIndex;
        if (animate) isTransitioning = true;
        positionTrack(animate !== false);
    }

    /* Pagination dots */
    var dots = [];
    if (pagination) {
        for (var d = 0; d < total; d++) {
            (function (di) {
                var dot = document.createElement('button');
                dot.className = 'events-showcase__dot' + (di === 0 ? ' active' : '');
                dot.setAttribute('aria-label', 'Go to slide ' + (di + 1));
                dot.addEventListener('click', function () {
                    goTo(CLONES + di, true);
                });
                pagination.appendChild(dot);
                dots.push(dot);
            })(d);
        }
    }

    track.addEventListener('transitionend', function (e) {
        if (e.target !== track) return;
        isTransitioning = false;
        if (index >= CLONES + total) {
            index = index - total;
            positionTrack(false);
        } else if (index < CLONES) {
            index = index + total;
            positionTrack(false);
        }
    });

    /* Swipe / drag */
    var isDragging = false;
    var dragStartX = 0;
    var dragCurrentX = 0;
    var dragBaseOffset = 0;
    var pointerHistory = [];

    function getCurrentOffset() {
        var cardW = getCardWidth();
        var center = getViewportCenter();
        var gap = parseFloat(getComputedStyle(track).gap) || 0;
        var cardCenter = cardW / 2 - gap / 2;
        return -(index * cardW) + center - cardCenter;
    }

    function getIndexFromOffset(px) {
        var cardW = getCardWidth();
        var center = getViewportCenter();
        var gap = parseFloat(getComputedStyle(track).gap) || 0;
        var cardCenter = cardW / 2 - gap / 2;
        return Math.round((center - cardCenter - px) / cardW);
    }

    function snapToNearest(currentPx) {
        var nearest = getIndexFromOffset(currentPx);
        nearest = Math.max(0, Math.min(nearest, allCards.length - 1));
        index = nearest;
        isTransitioning = true;
        track.classList.remove('no-transition', 'is-dragging');
        positionTrack(true);
    }

    track.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (isWrapping) return;
        if (isTransitioning) {
            var mx = new DOMMatrix(getComputedStyle(track).transform);
            dragBaseOffset = mx.m41;
            isTransitioning = false;
        } else {
            dragBaseOffset = getCurrentOffset();
        }
        isDragging = true;
        dragStartX = e.clientX;
        dragCurrentX = e.clientX;
        pointerHistory = [{ x: e.clientX, t: performance.now() }];
        track.classList.add('is-dragging');
        track.setPointerCapture(e.pointerId);
    });

    track.addEventListener('pointermove', function (e) {
        if (!isDragging) return;
        dragCurrentX = e.clientX;
        pointerHistory.push({ x: dragCurrentX, t: performance.now() });
        if (pointerHistory.length > 5) pointerHistory.shift();
        var delta = dragCurrentX - dragStartX;
        track.style.transform = 'translateX(' + (dragBaseOffset + delta) + 'px)';
    });

    track.addEventListener('pointerup', function () {
        if (!isDragging) return;
        isDragging = false;
        track.classList.remove('is-dragging');

        var velocityX = 0;
        if (pointerHistory.length >= 2) {
            var oldest = pointerHistory[0];
            var newest = pointerHistory[pointerHistory.length - 1];
            var dt = newest.t - oldest.t;
            if (dt > 0 && dt < 300) {
                velocityX = (newest.x - oldest.x) / (dt / 16);
            }
        }
        var currentPx = dragBaseOffset + (dragCurrentX - dragStartX);
        if (Math.abs(velocityX) > 2) {
            var projected = currentPx + velocityX * 8;
            snapToNearest(projected);
        } else {
            snapToNearest(currentPx);
        }
    });

    track.addEventListener('pointercancel', function () {
        isDragging = false;
        track.classList.remove('is-dragging');
        positionTrack(true);
    });

    track.addEventListener('dragstart', function (e) { e.preventDefault(); });

    /* Auto-advance */
    var autoTimer;
    function startAuto() {
        clearInterval(autoTimer);
        autoTimer = setInterval(function () {
            if (!isDragging && !isTransitioning) goTo(index + 1, true);
        }, 5000);
    }
    section.addEventListener('pointerenter', function () { clearInterval(autoTimer); });
    section.addEventListener('pointerleave', startAuto);

    /* Resize */
    var resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () { positionTrack(false); }, 150);
    });

    /* Init */
    positionTrack(false);
    startAuto();
})();

/* ── Services Mobile Carousel ── */
(function () {
    var section = document.querySelector('.services-carousel');
    if (!section) return;

    var track = section.querySelector('.services-carousel__mobile-track');
    var pagination = section.querySelector('.services-carousel__mobile-pagination');
    if (!track) return;

    /* Clone cards from the desktop track into the mobile track */
    var desktopCards = section.querySelectorAll('.services-carousel__track .service-card');
    if (!desktopCards.length) return;

    for (var c = 0; c < desktopCards.length; c++) {
        var clone = desktopCards[c].cloneNode(true);
        clone.classList.remove('is-center', 'is-adjacent');
        track.appendChild(clone);
    }

    var origCards = Array.from(track.children);
    var total = origCards.length;

    /* Clone for infinite loop */
    var CLONES = total;
    for (var i = 0; i < CLONES; i++) {
        var cloneEnd = origCards[i % total].cloneNode(true);
        cloneEnd.setAttribute('aria-hidden', 'true');
        track.appendChild(cloneEnd);
    }
    for (var j = total - 1; j >= total - CLONES; j--) {
        var cloneStart = origCards[((j % total) + total) % total].cloneNode(true);
        cloneStart.setAttribute('aria-hidden', 'true');
        track.insertBefore(cloneStart, track.firstChild);
    }

    var allCards = Array.from(track.children);
    var index = CLONES;
    var isTransitioning = false;
    var isWrapping = false;
    var dots = [];

    function getCardWidth() {
        var gap = parseFloat(getComputedStyle(track).gap) || 0;
        return allCards[0].offsetWidth + gap;
    }

    function getViewportCenter() {
        return section.querySelector('.services-carousel__mobile-viewport').offsetWidth / 2;
    }

    function getRealIndex() {
        return ((index - CLONES) % total + total) % total;
    }

    function updateClasses() {
        for (var i = 0; i < allCards.length; i++) {
            allCards[i].classList.remove('is-center', 'is-adjacent');
        }
        if (allCards[index]) allCards[index].classList.add('is-center');
        var real = getRealIndex();
        for (var d = 0; d < dots.length; d++) {
            dots[d].classList.toggle('active', d === real);
        }
    }

    function positionTrack(animate, skipClasses) {
        var cardW = getCardWidth();
        var center = getViewportCenter();
        var gap = parseFloat(getComputedStyle(track).gap) || 0;
        var cardCenter = cardW / 2 - gap / 2;
        var offset = -(index * cardW) + center - cardCenter;

        if (!animate) {
            track.classList.add('no-transition');
        } else {
            track.classList.remove('no-transition');
        }
        track.style.transform = 'translateX(' + offset + 'px)';
        if (!skipClasses) updateClasses();

        if (!animate) {
            void track.offsetHeight;
            track.classList.remove('no-transition');
        }
    }

    function normalizeIndexAfterLoop() {
        if (index >= CLONES + total) {
            index -= total;
            return true;
        }
        if (index < CLONES) {
            index += total;
            return true;
        }
        return false;
    }

    function snapLoopPosition() {
        if (!normalizeIndexAfterLoop()) return;
        isWrapping = true;
        positionTrack(false, true);
        requestAnimationFrame(function () {
            updateClasses();
            isWrapping = false;
        });
    }

    function goTo(newIndex, animate) {
        if (isWrapping) return;
        if (isTransitioning) {
            track.classList.add('no-transition');
            normalizeIndexAfterLoop();
            positionTrack(false);
            void track.offsetHeight;
            track.classList.remove('no-transition');
        }
        index = newIndex;
        if (animate) isTransitioning = true;
        positionTrack(animate !== false);
    }

    /* Pagination dots */
    if (pagination) {
        for (var d = 0; d < total; d++) {
            (function (di) {
                var dot = document.createElement('button');
                dot.className = 'services-carousel__dot' + (di === 0 ? ' active' : '');
                dot.setAttribute('aria-label', 'Go to experience ' + (di + 1));
                dot.addEventListener('click', function () {
                    goTo(CLONES + di, true);
                });
                pagination.appendChild(dot);
                dots.push(dot);
            })(d);
        }
    }

    track.addEventListener('transitionend', function (e) {
        if (e.target !== track) return;
        isTransitioning = false;
        snapLoopPosition();
    });

    /* Swipe / drag */
    var isDragging = false;
    var dragStartX = 0;
    var dragCurrentX = 0;
    var dragBaseOffset = 0;
    var pointerHistory = [];

    function getCurrentOffset() {
        var cardW = getCardWidth();
        var center = getViewportCenter();
        var gap = parseFloat(getComputedStyle(track).gap) || 0;
        var cardCenter = cardW / 2 - gap / 2;
        return -(index * cardW) + center - cardCenter;
    }

    function getIndexFromOffset(px) {
        var cardW = getCardWidth();
        var center = getViewportCenter();
        var gap = parseFloat(getComputedStyle(track).gap) || 0;
        var cardCenter = cardW / 2 - gap / 2;
        return Math.round((center - cardCenter - px) / cardW);
    }

    function snapToNearest(currentPx) {
        var nearest = getIndexFromOffset(currentPx);
        nearest = Math.max(0, Math.min(nearest, allCards.length - 1));
        index = nearest;
        isTransitioning = true;
        track.classList.remove('no-transition', 'is-dragging');
        positionTrack(true);
    }

    track.addEventListener('pointerdown', function (e) {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        if (isTransitioning) {
            var mx = new DOMMatrix(getComputedStyle(track).transform);
            dragBaseOffset = mx.m41;
            isTransitioning = false;
        } else {
            dragBaseOffset = getCurrentOffset();
        }
        isDragging = true;
        dragStartX = e.clientX;
        dragCurrentX = e.clientX;
        pointerHistory = [{ x: e.clientX, t: performance.now() }];
        track.classList.add('is-dragging');
        track.setPointerCapture(e.pointerId);
    });

    track.addEventListener('pointermove', function (e) {
        if (!isDragging) return;
        dragCurrentX = e.clientX;
        pointerHistory.push({ x: dragCurrentX, t: performance.now() });
        if (pointerHistory.length > 5) pointerHistory.shift();
        var delta = dragCurrentX - dragStartX;
        track.style.transform = 'translateX(' + (dragBaseOffset + delta) + 'px)';
    });

    track.addEventListener('pointerup', function () {
        if (!isDragging) return;
        isDragging = false;
        track.classList.remove('is-dragging');

        var velocityX = 0;
        if (pointerHistory.length >= 2) {
            var oldest = pointerHistory[0];
            var newest = pointerHistory[pointerHistory.length - 1];
            var dt = newest.t - oldest.t;
            if (dt > 0 && dt < 300) {
                velocityX = (newest.x - oldest.x) / (dt / 16);
            }
        }
        var currentPx = dragBaseOffset + (dragCurrentX - dragStartX);
        if (Math.abs(velocityX) > 2) {
            var projected = currentPx + velocityX * 8;
            snapToNearest(projected);
        } else {
            snapToNearest(currentPx);
        }
    });

    track.addEventListener('pointercancel', function () {
        isDragging = false;
        track.classList.remove('is-dragging');
        positionTrack(true);
    });

    track.addEventListener('dragstart', function (e) { e.preventDefault(); });

    /* Auto-advance */
    var autoTimer;
    function startAuto() {
        clearInterval(autoTimer);
        autoTimer = setInterval(function () {
            if (!isDragging && !isTransitioning) goTo(index + 1, true);
        }, 5000);
    }
    section.addEventListener('pointerenter', function () { clearInterval(autoTimer); });
    section.addEventListener('pointerleave', startAuto);

    /* Resize */
    var resizeTimer;
    window.addEventListener('resize', function () {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function () { positionTrack(false); }, 150);
    });

    /* Init */
    positionTrack(false);
    startAuto();
})();

/* ── Preloader ── */
(function () {
    var el = document.getElementById('preloader');
    if (!el) return;
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';
    setTimeout(function () {
        el.classList.add('is-hidden');
        document.documentElement.style.overflow = '';
        document.body.style.overflow = '';
        /* Remove from DOM after fade completes */
        setTimeout(function () { el.parentNode && el.parentNode.removeChild(el); }, 650);
    }, 2500);
})();

/* ── Initialize Lucide Icons ── */
if (typeof lucide !== 'undefined') {
    lucide.createIcons();
}

/* ── Mobile Navigation ── */
(function () {
    var body = document.body;
    var toggle = document.querySelector('.nav__toggle');
    var menu = document.querySelector('.nav__menu');
    var closeBtn = document.querySelector('.nav__close');
    var backdrop = document.querySelector('.nav__backdrop');
    var dropdownItems = Array.prototype.slice.call(document.querySelectorAll('.nav__item--dropdown'));

    if (!body || !toggle || !menu) return;

    function resetDropdowns() {
        dropdownItems.forEach(function (item) {
            item.classList.remove('nav__item--mobile-open');
            var trigger = item.querySelector('.nav__link');
            if (trigger) {
                trigger.setAttribute('aria-expanded', 'false');
            }
        });
    }

    function setMenuOpen(isOpen) {
        body.classList.toggle('menu-open', isOpen);
        toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');

        if (!isOpen) {
            resetDropdowns();
        }
    }

    toggle.addEventListener('click', function () {
        setMenuOpen(!body.classList.contains('menu-open'));
    });

    if (closeBtn) {
        closeBtn.addEventListener('click', function () {
            setMenuOpen(false);
        });
    }

    if (backdrop) {
        backdrop.addEventListener('click', function () {
            setMenuOpen(false);
        });
    }

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape') {
            setMenuOpen(false);
        }
    });

    Array.prototype.slice.call(menu.querySelectorAll('a[href]')).forEach(function (link) {
        link.addEventListener('click', function () {
            setMenuOpen(false);
        });
    });

    dropdownItems.forEach(function (item) {
        var trigger = item.querySelector('.nav__link');
        if (!trigger) return;

        trigger.setAttribute('aria-expanded', 'false');

        trigger.addEventListener('click', function (event) {
            if (window.innerWidth >= 1200) return;

            event.preventDefault();

            var willOpen = !item.classList.contains('nav__item--mobile-open');
            resetDropdowns();
            item.classList.toggle('nav__item--mobile-open', willOpen);
            trigger.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
        });
    });

    window.addEventListener('resize', function () {
        if (window.innerWidth >= 1200) {
            setMenuOpen(false);
        }
    });
})();

/* ── Desktop Dropdown Hover Delay ── */
(function () {
    if (window.innerWidth < 1200) return;

    var dropdownItems = document.querySelectorAll('.nav__item--dropdown');

    function closeOtherMenus(currentItem) {
        dropdownItems.forEach(function (item) {
            if (item !== currentItem) {
                item.classList.remove('nav__item--open');
            }
        });
    }

    dropdownItems.forEach(function (item) {
        var closeTimer = null;
        var trigger = item.querySelector('.nav__link');
        var menu = item.querySelector('.nav__dropdown-menu');

        function openMenu() {
            clearTimeout(closeTimer);
            closeOtherMenus(item);
            item.classList.add('nav__item--open');
        }

        function closeMenuWithDelay() {
            clearTimeout(closeTimer);
            closeTimer = setTimeout(function () {
                item.classList.remove('nav__item--open');
            }, 500);
        }

        if (trigger) {
            trigger.addEventListener('mouseenter', openMenu);
            trigger.addEventListener('mouseleave', closeMenuWithDelay);
        }

        if (menu) {
            menu.addEventListener('mouseenter', openMenu);
            menu.addEventListener('mouseleave', closeMenuWithDelay);
        }

        item.addEventListener('mouseleave', closeMenuWithDelay);
    });
})();

/* ── Star Border Animation ── */
/* Pure CSS — rotating conic-gradient border. No JS needed. */

/* ── Header Hide on Scroll Down / Show on Scroll Up ── */
(function () {
    var header = document.querySelector('.header');
    if (!header) return;

    var lastScrollY = window.pageYOffset;
    var ticking = false;

    window.addEventListener('scroll', function () {
        if (!ticking) {
            requestAnimationFrame(function () {
                var currentScrollY = window.pageYOffset;
                if (window.innerWidth < 1200) {
                    header.classList.remove('header--hidden');
                    lastScrollY = currentScrollY;
                    ticking = false;
                    return;
                }

                if (currentScrollY > lastScrollY && currentScrollY > 80) {
                    header.classList.add('header--hidden');
                } else {
                    header.classList.remove('header--hidden');
                }
                lastScrollY = currentScrollY;
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
})();

/* ── Rooms Mobile Hero Scroll ── */
(function () {
    var hero = document.querySelector('.hero--rooms');
    if (!hero) return;

    var roomsList = hero.nextElementSibling;
    var ticking = false;

    function update() {
        ticking = false;

        if (window.innerWidth > 768) {
            hero.style.removeProperty('--rooms-hero-progress');
            hero.style.removeProperty('--rooms-background-opacity');
            return;
        }

        var progress = Math.max(0, Math.min(window.pageYOffset / (window.innerHeight * 0.72), 1));
        hero.style.setProperty('--rooms-hero-progress', progress.toFixed(3));

        if (roomsList && roomsList.classList.contains('rooms-list')) {
            var sectionHeight = Math.max(roomsList.offsetHeight, window.innerHeight * 1.25);
            var releaseAt = roomsList.offsetTop + sectionHeight - window.innerHeight;
            var fadeDistance = Math.max(window.innerHeight * 0.65, 360);
            var fadeProgress = Math.max(0, Math.min((window.pageYOffset - (releaseAt - fadeDistance)) / fadeDistance, 1));
            hero.style.setProperty('--rooms-background-opacity', (1 - fadeProgress).toFixed(3));
        }
    }

    function requestUpdate() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();
})();

/* About Mobile Hero Scroll */
(function () {
    var hero = document.querySelector('.hero--about');
    if (!hero) return;

    var showcase = hero.nextElementSibling;
    var showcaseEyebrow = showcase ? showcase.querySelector('.tilal-dining__eyebrow') : null;
    var showcaseBody = showcase ? showcase.querySelector('.tilal-dining__body') : null;
    var ticking = false;

    function update() {
        ticking = false;

        if (window.innerWidth > 768) {
            hero.style.removeProperty('--about-hero-progress');
            hero.style.removeProperty('--about-background-opacity');
          
            return;
        }

        var progress = Math.max(0, Math.min(window.pageYOffset / (window.innerHeight * 0.72), 1));
        hero.style.setProperty('--about-hero-progress', progress.toFixed(3));

        if (showcase && showcase.classList.contains('tilal-dining--about-showcase')) {
            var fadeStartSource = showcaseEyebrow || showcase;
            var fadeEndSource = showcaseBody || showcase;
            var fadeStart = window.pageYOffset + fadeStartSource.getBoundingClientRect().top - (window.innerHeight * 0.58);
            var fadeEnd = window.pageYOffset + fadeEndSource.getBoundingClientRect().bottom - (window.innerHeight * 0.52);
            var fadeDistance = Math.max(fadeEnd - fadeStart, 180);
            var fadeProgress = Math.max(0, Math.min((window.pageYOffset - fadeStart) / fadeDistance, 1));

            hero.style.setProperty('--about-background-opacity', (1 - fadeProgress).toFixed(3));
         
        }
    }

    function requestUpdate() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();
})();

/* Events Mobile Hero Scroll */
(function () {
    var hero = document.querySelector('.hero--events');
    if (!hero) return;

    var ticking = false;

    function update() {
        ticking = false;

        if (window.innerWidth > 768) {
            hero.style.removeProperty('--events-hero-progress');
            hero.style.removeProperty('--events-background-opacity');
            return;
        }

        var progress = Math.max(0, Math.min(window.pageYOffset / (window.innerHeight * 0.72), 1));
        hero.style.setProperty('--events-hero-progress', progress.toFixed(3));

        var fadeDistance = Math.max(window.innerHeight * 0.72, 340);
        var fadeProgress = Math.max(0, Math.min(window.pageYOffset / fadeDistance, 1));
        hero.style.setProperty('--events-background-opacity', (1 - fadeProgress).toFixed(3));
    }

    function requestUpdate() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();
})();

/* Wedding Mobile Hero Scroll */
(function () {
    var hero = document.querySelector('.hero--wedding');
    if (!hero) return;

    var ticking = false;

    function update() {
        ticking = false;

        if (window.innerWidth > 768) {
            hero.style.removeProperty('--wedding-hero-progress');
            hero.style.removeProperty('--wedding-background-opacity');
            return;
        }

        var progress = Math.max(0, Math.min(window.pageYOffset / (window.innerHeight * 0.72), 1));
        hero.style.setProperty('--wedding-hero-progress', progress.toFixed(3));

        var fadeDistance = Math.max(window.innerHeight * 0.72, 340);
        var fadeProgress = Math.max(0, Math.min(window.pageYOffset / fadeDistance, 1));
        hero.style.setProperty('--wedding-background-opacity', (1 - fadeProgress).toFixed(3));
    }

    function requestUpdate() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();
})();

/* Tilal Mobile Hero Scroll */
(function () {
    var hero = document.querySelector('.hero--tilal');
    if (!hero) return;

    var intro = hero.nextElementSibling;
    var ticking = false;

    function update() {
        ticking = false;

        if (window.innerWidth > 768) {
            hero.style.removeProperty('--tilal-hero-progress');
            hero.style.removeProperty('--tilal-background-opacity');
            return;
        }

        var progress = Math.max(0, Math.min(window.pageYOffset / (window.innerHeight * 0.72), 1));
        hero.style.setProperty('--tilal-hero-progress', progress.toFixed(3));

        if (intro && intro.classList.contains('tilal-dining--tilal-intro')) {
            var fadeDistance = Math.max(window.innerHeight * 0.72, 340);
            var fadeProgress = Math.max(0, Math.min(window.pageYOffset / fadeDistance, 1));

            hero.style.setProperty('--tilal-background-opacity', (1 - fadeProgress).toFixed(3));
        }
    }

    function requestUpdate() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();
})();

/* Piano Bar Mobile Hero Scroll */
(function () {
    var hero = document.querySelector('.hero--piano');
    if (!hero) return;

    var intro = hero.nextElementSibling;
    var ticking = false;

    function update() {
        ticking = false;

        if (window.innerWidth > 768) {
            hero.style.removeProperty('--piano-hero-progress');
            hero.style.removeProperty('--piano-background-opacity');
            return;
        }

        var progress = Math.max(0, Math.min(window.pageYOffset / (window.innerHeight * 0.72), 1));
        hero.style.setProperty('--piano-hero-progress', progress.toFixed(3));

        if (intro && intro.classList.contains('tilal-dining--piano-intro')) {
            var fadeDistance = Math.max(window.innerHeight * 0.72, 340);
            var fadeProgress = Math.max(0, Math.min(window.pageYOffset / fadeDistance, 1));

            hero.style.setProperty('--piano-background-opacity', (1 - fadeProgress).toFixed(3));
        }
    }

    function requestUpdate() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();
})();

/* Pool Mobile Hero Scroll */
(function () {
    var hero = document.querySelector('.hero--pool');
    if (!hero) return;

    var intro = hero.nextElementSibling;
    var ticking = false;

    function update() {
        ticking = false;

        if (window.innerWidth > 768) {
            hero.style.removeProperty('--pool-hero-progress');
            hero.style.removeProperty('--pool-background-opacity');
            return;
        }

        var progress = Math.max(0, Math.min(window.pageYOffset / (window.innerHeight * 0.72), 1));
        hero.style.setProperty('--pool-hero-progress', progress.toFixed(3));

        if (intro && intro.classList.contains('tilal-dining--pool-intro')) {
            var fadeDistance = Math.max(window.innerHeight * 0.72, 340);
            var fadeProgress = Math.max(0, Math.min(window.pageYOffset / fadeDistance, 1));

            hero.style.setProperty('--pool-background-opacity', (1 - fadeProgress).toFixed(3));
        }
    }

    function requestUpdate() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();
})();

/* Garden Mobile Hero Scroll */
(function () {
    var hero = document.querySelector('.hero--garden');
    if (!hero) return;

    var intro = hero.nextElementSibling;
    var ticking = false;

    function update() {
        ticking = false;

        if (window.innerWidth > 768) {
            hero.style.removeProperty('--garden-hero-progress');
            hero.style.removeProperty('--garden-background-opacity');
            return;
        }

        var progress = Math.max(0, Math.min(window.pageYOffset / (window.innerHeight * 0.72), 1));
        hero.style.setProperty('--garden-hero-progress', progress.toFixed(3));

        if (intro && intro.classList.contains('tilal-dining--garden-intro')) {
            var fadeDistance = Math.max(window.innerHeight * 0.72, 340);
            var fadeProgress = Math.max(0, Math.min(window.pageYOffset / fadeDistance, 1));

            hero.style.setProperty('--garden-background-opacity', (1 - fadeProgress).toFixed(3));
        }
    }

    function requestUpdate() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();
})();

/* Conference Hall Mobile Hero Scroll */
(function () {
    var hero = document.querySelector('.hero--conference');
    if (!hero) return;

    var intro = hero.nextElementSibling;
    var ticking = false;

    function update() {
        ticking = false;

        if (window.innerWidth > 768) {
            hero.style.removeProperty('--conference-hero-progress');
            hero.style.removeProperty('--conference-background-opacity');
            return;
        }

        var progress = Math.max(0, Math.min(window.pageYOffset / (window.innerHeight * 0.72), 1));
        hero.style.setProperty('--conference-hero-progress', progress.toFixed(3));

        if (intro && intro.classList.contains('tilal-dining--conference-intro')) {
            var fadeDistance = Math.max(window.innerHeight * 0.72, 340);
            var fadeProgress = Math.max(0, Math.min(window.pageYOffset / fadeDistance, 1));

            hero.style.setProperty('--conference-background-opacity', (1 - fadeProgress).toFixed(3));
        }
    }

    function requestUpdate() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();
})();

/* Terrace Mobile Hero Scroll */
(function () {
    var hero = document.querySelector('.hero--terrace');
    if (!hero) return;

    var intro = hero.nextElementSibling;
    var ticking = false;

    function update() {
        ticking = false;

        if (window.innerWidth > 768) {
            hero.style.removeProperty('--terrace-hero-progress');
            hero.style.removeProperty('--terrace-background-opacity');
            return;
        }

        var progress = Math.max(0, Math.min(window.pageYOffset / (window.innerHeight * 0.72), 1));
        hero.style.setProperty('--terrace-hero-progress', progress.toFixed(3));

        if (intro && intro.classList.contains('tilal-dining--terrace-intro')) {
            var fadeDistance = Math.max(window.innerHeight * 0.72, 340);
            var fadeProgress = Math.max(0, Math.min(window.pageYOffset / fadeDistance, 1));

            hero.style.setProperty('--terrace-background-opacity', (1 - fadeProgress).toFixed(3));
        }
    }

    function requestUpdate() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();
})();

/* Gym Mobile Hero Scroll */
(function () {
    var hero = document.querySelector('.hero--gym');
    if (!hero) return;

    var intro = hero.nextElementSibling;
    var ticking = false;

    function update() {
        ticking = false;

        if (window.innerWidth > 768) {
            hero.style.removeProperty('--gym-hero-progress');
            hero.style.removeProperty('--gym-background-opacity');
            return;
        }

        var progress = Math.max(0, Math.min(window.pageYOffset / (window.innerHeight * 0.72), 1));
        hero.style.setProperty('--gym-hero-progress', progress.toFixed(3));

        if (intro && intro.classList.contains('tilal-dining--gym-intro')) {
            var fadeDistance = Math.max(window.innerHeight * 0.72, 340);
            var fadeProgress = Math.max(0, Math.min(window.pageYOffset / fadeDistance, 1));

            hero.style.setProperty('--gym-background-opacity', (1 - fadeProgress).toFixed(3));
        }
    }

    function requestUpdate() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();
})();

/* Games Lounge Mobile Hero Scroll */
(function () {
    var hero = document.querySelector('.hero--games');
    if (!hero) return;

    var intro = hero.nextElementSibling;
    var ticking = false;

    function update() {
        ticking = false;

        if (window.innerWidth > 768) {
            hero.style.removeProperty('--games-hero-progress');
            hero.style.removeProperty('--games-background-opacity');
            return;
        }

        var progress = Math.max(0, Math.min(window.pageYOffset / (window.innerHeight * 0.72), 1));
        hero.style.setProperty('--games-hero-progress', progress.toFixed(3));

        if (intro && intro.classList.contains('tilal-dining--games-intro')) {
            var fadeDistance = Math.max(window.innerHeight * 0.72, 340);
            var fadeProgress = Math.max(0, Math.min(window.pageYOffset / fadeDistance, 1));

            hero.style.setProperty('--games-background-opacity', (1 - fadeProgress).toFixed(3));
        }
    }

    function requestUpdate() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(update);
    }

    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);
    requestUpdate();
})();

/* ---------------------------------------------------------------- */
/* Rooms Listing accordion + expand/collapse                        */
/* ---------------------------------------------------------------- */
(function () {
    var root = document.getElementById('rooms-accordion');
    if (!root) return;

    var items = Array.prototype.slice.call(root.querySelectorAll('.rooms-list__item'));
    if (!items.length) return;
    var isRoomsPage = !!document.querySelector('.hero--rooms');

    function clampScrollAfterCollapse(item) {
        if (!isRoomsPage || window.innerWidth > 768) return;

        function clamp() {
            var doc = document.documentElement;
            var maxScroll = Math.max(0, doc.scrollHeight - window.innerHeight);
            if (window.pageYOffset > maxScroll) {
                window.scrollTo({ top: maxScroll, behavior: 'auto' });
                return;
            }

            if (item) {
                var rect = item.getBoundingClientRect();
                var itemTop = window.pageYOffset + rect.top;
                var comfortableTop = Math.max(0, itemTop - 96);
                if (rect.top < 80 || rect.top > window.innerHeight * 0.58) {
                    window.scrollTo({ top: comfortableTop, behavior: 'auto' });
                }
            }
        }

        requestAnimationFrame(clamp);
        window.setTimeout(clamp, 260);
        window.setTimeout(clamp, 560);
    }

    function setActive(target, opts) {
        opts = opts || {};
        if (target.classList.contains('is-active')) return;

        items.forEach(function (item) {
            if (item === target) return;
            item.classList.remove('is-active');
            item.classList.remove('is-expanded');
            var hdr = item.querySelector('.rooms-list__header');
            var tgl = item.querySelector('[data-toggle]');
            if (hdr) hdr.setAttribute('aria-expanded', 'false');
            if (tgl) {
                tgl.setAttribute('aria-expanded', 'false');
                var lbl = tgl.querySelector('.rooms-list__toggle-label');
                if (lbl) lbl.textContent = 'More Details';
            }
        });

        target.classList.add('is-active');
        var hdr = target.querySelector('.rooms-list__header');
        if (hdr) hdr.setAttribute('aria-expanded', 'true');

        if (opts.scroll) {
            // Smooth scroll the activated room into comfortable view
            var rect = target.getBoundingClientRect();
            var top = window.pageYOffset + rect.top - 100;
            window.scrollTo({ top: top, behavior: 'smooth' });
        }
    }

    function collapse(item) {
        item.classList.remove('is-active');
        item.classList.remove('is-expanded');
        var hdr = item.querySelector('.rooms-list__header');
        var tgl = item.querySelector('[data-toggle]');
        if (hdr) hdr.setAttribute('aria-expanded', 'false');
        if (tgl) {
            tgl.setAttribute('aria-expanded', 'false');
            var lbl = tgl.querySelector('.rooms-list__toggle-label');
            if (lbl) lbl.textContent = 'More Details';
        }
        clampScrollAfterCollapse(item);
    }

    function toggleDetails(item) {
        var willExpand = !item.classList.contains('is-expanded');
        item.classList.toggle('is-expanded', willExpand);
        var tgl = item.querySelector('[data-toggle]');
        if (tgl) {
            tgl.setAttribute('aria-expanded', willExpand ? 'true' : 'false');
            var lbl = tgl.querySelector('.rooms-list__toggle-label');
            if (lbl) lbl.textContent = willExpand ? 'Less Details' : 'More Details';
        }
        if (!willExpand) clampScrollAfterCollapse(item);
    }

    items.forEach(function (item) {
        var header = item.querySelector('.rooms-list__header');
        var toggle = item.querySelector('[data-toggle]');

        if (header) {
            header.addEventListener('click', function () {
                if (item.classList.contains('is-active')) {
                    collapse(item);
                    return;
                }
                setActive(item, { scroll: true });
            });
        }

        if (toggle) {
            toggle.addEventListener('click', function (e) {
                e.stopPropagation();
                if (!item.classList.contains('is-active')) {
                    setActive(item);
                }
                toggleDetails(item);
                // Re-render lucide icons that may have appeared
                if (window.lucide && typeof window.lucide.createIcons === 'function') {
                    window.lucide.createIcons();
                }
            });
        }
    });

    root.querySelectorAll('.room-booking').forEach(function (booking) {
        var inputs = booking.querySelectorAll('.room-booking__input');
        var checkinEl = inputs[0];
        var checkoutEl = inputs[1];
        var guestsEl = inputs[2];
        var submitBtn = booking.querySelector('.room-booking__cta');
        var roomItem = booking.closest('.rooms-list__item');
        var roomNameEl = roomItem ? roomItem.querySelector('.rooms-list__name') : null;
        var roomName = roomNameEl ? roomNameEl.textContent.trim() : 'Room';
        var defaultText = submitBtn ? submitBtn.textContent : 'Check Availability';

        if (!submitBtn || !checkinEl || !checkoutEl || !guestsEl) return;

        submitBtn.addEventListener('click', function () {
            var checkin = checkinEl.value;
            var checkout = checkoutEl.value;
            var guests = guestsEl.value;

            if (!checkin || !checkout || !guests) {
                window.alert('Please enter check-in, check-out, and guests.');
                return;
            }

            if (checkout <= checkin) {
                window.alert('Check-out must be after check-in.');
                return;
            }

            var payload = new FormData();
            payload.append('_subject', 'Room Availability Request - Bzommar Palace Hotel');
            payload.append('Room', roomName);
            payload.append('Check In', checkin);
            payload.append('Check Out', checkout);
            payload.append('Guests', guests);

            submitBtn.disabled = true;
            submitBtn.textContent = 'Sending...';

            fetch('https://formspree.io/f/xvznerlr', {
                method: 'POST',
                body: payload,
                headers: {
                    Accept: 'application/json'
                }
            })
                .then(function (response) {
                    if (!response.ok) {
                        throw new Error('Form submission failed');
                    }
                    if (typeof window.BzommarBookingSuccess === 'function') {
                        window.BzommarBookingSuccess();
                    } else {
                        window.alert('Thank you! We will reach out shortly to confirm your request.');
                    }
                })
                .catch(function () {
                    window.alert('Something went wrong. Please try again or contact us directly.');
                })
                .finally(function () {
                    submitBtn.disabled = false;
                    submitBtn.textContent = defaultText;
                });
        });
    });

    function activateFromHash() {
        var hash = (window.location.hash || '').replace('#', '');
        if (!hash) return;
        var target = root.querySelector('.rooms-list__item[data-room="' + hash + '"]');
        if (!target) return;
        if (!target.classList.contains('is-active')) {
            // Collapse current active without animation lock
            items.forEach(function (item) {
                if (item !== target) {
                    item.classList.remove('is-active');
                    item.classList.remove('is-expanded');
                }
            });
            target.classList.add('is-active');
            var hdr = target.querySelector('.rooms-list__header');
            if (hdr) hdr.setAttribute('aria-expanded', 'true');
        }
        // Defer scroll so layout settles
        setTimeout(function () {
            var rect = target.getBoundingClientRect();
            var top = window.pageYOffset + rect.top - 100;
            window.scrollTo({ top: top, behavior: 'smooth' });
        }, 50);
    }

    activateFromHash();
    window.addEventListener('hashchange', activateFromHash);
})();

/* Rooms mobile thumbnail carousel */
(function () {
    var groups = Array.prototype.slice.call(document.querySelectorAll('.rooms-list__thumbs'));
    if (!groups.length) return;

    groups.forEach(function (group) {
        var images = Array.prototype.slice.call(group.querySelectorAll('img'));
        if (images.length < 2 || group.querySelector('.rooms-list__thumbs-dots')) return;

        var current = 0;
        var startX = 0;
        var startY = 0;
        var dragging = false;
        var moved = false;

        var dotsWrap = document.createElement('div');
        dotsWrap.className = 'rooms-list__thumbs-dots';
        dotsWrap.setAttribute('role', 'tablist');
        dotsWrap.setAttribute('aria-label', 'Room image pagination');

        var dots = images.map(function (_, index) {
            var dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'rooms-list__thumbs-dot';
            dot.setAttribute('aria-label', 'Show room image ' + (index + 1));
            dot.addEventListener('click', function (event) {
                event.stopPropagation();
                show(index);
            });
            dotsWrap.appendChild(dot);
            return dot;
        });

        group.appendChild(dotsWrap);

        function isMobile() {
            return window.innerWidth <= 768;
        }

        function show(index) {
            current = (index + images.length) % images.length;
            group.style.setProperty('--rooms-thumbs-index', current);
            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === current);
                dot.setAttribute('aria-selected', dotIndex === current ? 'true' : 'false');
            });
        }

        function pointerStart(event) {
            if (!isMobile()) return;
            dragging = true;
            moved = false;
            startX = event.clientX;
            startY = event.clientY;
            group.classList.add('is-dragging');
            if (group.setPointerCapture) group.setPointerCapture(event.pointerId);
        }

        function pointerMove(event) {
            if (!dragging || !isMobile()) return;
            var dx = event.clientX - startX;
            var dy = event.clientY - startY;
            if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy)) {
                moved = true;
            }
        }

        function pointerEnd(event) {
            if (!dragging) return;
            dragging = false;
            group.classList.remove('is-dragging');

            var dx = event.clientX - startX;
            var dy = event.clientY - startY;
            if (isMobile() && Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) {
                show(current + (dx < 0 ? 1 : -1));
                group.dataset.swiped = 'true';
                window.setTimeout(function () {
                    delete group.dataset.swiped;
                }, 250);
            }
        }

        group.addEventListener('pointerdown', pointerStart);
        group.addEventListener('pointermove', pointerMove);
        group.addEventListener('pointerup', pointerEnd);
        group.addEventListener('pointercancel', pointerEnd);
        group.addEventListener('click', function (event) {
            if (moved || group.dataset.swiped === 'true') {
                event.preventDefault();
                event.stopPropagation();
                moved = false;
            }
        }, true);

        show(0);
    });
})();

/* Rooms thumbnail lightbox */
(function () {
    var thumbsRoot = document.querySelector('.rooms-list__thumbs');
    if (!thumbsRoot) return;

    var lightbox = document.createElement('div');
    lightbox.className = 'lightbox';
    lightbox.id = 'rooms-lightbox';
    lightbox.hidden = true;
    lightbox.innerHTML =
        '<button type="button" class="lightbox__close" aria-label="Close room image viewer">' +
            '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
        '</button>' +
        '<button type="button" class="lightbox__nav lightbox__nav--prev" aria-label="Previous image">' +
            '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>' +
        '</button>' +
        '<figure class="lightbox__figure">' +
            '<img class="lightbox__img" alt="">' +
            '<figcaption class="lightbox__caption"><span></span><span class="lightbox__counter"></span></figcaption>' +
        '</figure>' +
        '<button type="button" class="lightbox__nav lightbox__nav--next" aria-label="Next image">' +
            '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>' +
        '</button>';
    document.body.appendChild(lightbox);

    var lbImg = lightbox.querySelector('.lightbox__img');
    var lbTitle = lightbox.querySelector('.lightbox__caption span:first-child');
    var lbCounter = lightbox.querySelector('.lightbox__counter');
    var lbClose = lightbox.querySelector('.lightbox__close');
    var lbPrev = lightbox.querySelector('.lightbox__nav--prev');
    var lbNext = lightbox.querySelector('.lightbox__nav--next');
    var list = [];
    var index = 0;

    document.querySelectorAll('.rooms-list__thumbs img').forEach(function (img) {
        img.setAttribute('tabindex', '0');
        img.setAttribute('role', 'button');
        img.setAttribute('aria-label', 'Open ' + (img.alt || 'room image'));
    });

    function show() {
        if (!list.length) return;
        var item = list[index];
        lbImg.src = item.src;
        lbImg.alt = item.alt;
        lbTitle.textContent = item.alt || item.room || 'Room image';
        lbCounter.textContent = (index + 1) + ' / ' + list.length;
        lightbox.hidden = false;
        document.body.classList.add('no-scroll');
    }

    function close() {
        lightbox.hidden = true;
        document.body.classList.remove('no-scroll');
        lbImg.src = '';
    }

    function next() {
        if (!list.length) return;
        index = (index + 1) % list.length;
        show();
    }

    function prev() {
        if (!list.length) return;
        index = (index - 1 + list.length) % list.length;
        show();
    }

    document.addEventListener('click', function (e) {
        var img = e.target.closest('.rooms-list__thumbs img');
        if (!img) return;

        var room = img.closest('.rooms-list__item');
        var roomName = room ? room.querySelector('.rooms-list__name') : null;
        var images = Array.prototype.slice.call((room || document).querySelectorAll('.rooms-list__thumbs img'));

        list = images.map(function (thumb) {
            return {
                src: thumb.currentSrc || thumb.src,
                alt: thumb.alt || (roomName ? roomName.textContent : 'Room image'),
                room: roomName ? roomName.textContent : ''
            };
        });
        index = Math.max(0, images.indexOf(img));
        show();
    });

    document.addEventListener('keydown', function (e) {
        var img = e.target.closest ? e.target.closest('.rooms-list__thumbs img') : null;
        if (!img || (e.key !== 'Enter' && e.key !== ' ')) return;
        e.preventDefault();
        img.click();
    });

    lbClose.addEventListener('click', close);
    lbNext.addEventListener('click', next);
    lbPrev.addEventListener('click', prev);
    lightbox.addEventListener('click', function (e) {
        if (e.target === lightbox) close();
    });
    document.addEventListener('keydown', function (e) {
        if (lightbox.hidden) return;
        if (e.key === 'Escape') close();
        else if (e.key === 'ArrowRight') next();
        else if (e.key === 'ArrowLeft') prev();
    });
})();


/* ========== Wedding Testimonials Carousel ========== */
(function () {
    var carousels = document.querySelectorAll('[data-testimonials]');
    if (!carousels.length) return;

    carousels.forEach(function (carousel) {
        var slides = carousel.querySelectorAll('[data-testimonial]');
        var dots = carousel.querySelectorAll('.wedding-testimonials__dot');
        if (!slides.length) return;

        var current = 0;
        var timer = null;

        function show(i) {
            current = (i + slides.length) % slides.length;
            slides.forEach(function (s, idx) {
                s.classList.toggle('is-active', idx === current);
            });
            dots.forEach(function (d, idx) {
                d.classList.toggle('is-active', idx === current);
            });
        }

        function start() {
            stop();
            timer = setInterval(function () { show(current + 1); }, 7000);
        }

        function stop() {
            if (timer) { clearInterval(timer); timer = null; }
        }

        dots.forEach(function (dot) {
            dot.addEventListener('click', function () {
                var idx = parseInt(dot.getAttribute('data-index'), 10) || 0;
                show(idx);
                start();
            });
        });

        carousel.addEventListener('mouseenter', stop);
        carousel.addEventListener('mouseleave', start);

        // Drag / swipe support
        var track = carousel.querySelector('[data-testimonials-track]') || carousel;
        var dragStartX = 0;
        var dragDx = 0;
        var dragging = false;
        var SWIPE_THRESHOLD = 50;

        track.style.touchAction = 'pan-y';
        track.style.cursor = 'grab';

        track.addEventListener('pointerdown', function (e) {
            if (e.pointerType === 'mouse' && e.button !== 0) return;
            dragging = true;
            dragStartX = e.clientX;
            dragDx = 0;
            track.style.cursor = 'grabbing';
            stop();
            try { track.setPointerCapture(e.pointerId); } catch (err) {}
        });

        track.addEventListener('pointermove', function (e) {
            if (!dragging) return;
            dragDx = e.clientX - dragStartX;
        });

        function endDrag(e) {
            if (!dragging) return;
            dragging = false;
            track.style.cursor = 'grab';
            try { if (e && e.pointerId != null) track.releasePointerCapture(e.pointerId); } catch (err) {}
            if (dragDx <= -SWIPE_THRESHOLD) {
                show(current + 1);
            } else if (dragDx >= SWIPE_THRESHOLD) {
                show(current - 1);
            }
            start();
        }

        track.addEventListener('pointerup', endDrag);
        track.addEventListener('pointercancel', endDrag);
        track.addEventListener('pointerleave', function (e) {
            if (dragging) endDrag(e);
        });

        // Prevent native image drag from hijacking the gesture
        track.querySelectorAll('img').forEach(function (img) {
            img.setAttribute('draggable', 'false');
        });

        show(0);
        start();
    });
})();

/* ========== Wedding Promise Timeline ========== */
(function () {
    var timeline = document.querySelector('[data-promise-timeline]');
    if (!timeline) return;

    var progress = timeline.querySelector('[data-promise-progress]');
    var steps = Array.prototype.slice.call(timeline.querySelectorAll('[data-promise-step]'));
    if (!steps.length) return;

    var total = steps.length;
    var ticking = false;
    var mobileSvg = null;
    var mobileBasePath = null;
    var mobileProgressPath = null;
    var mobilePathLength = 0;
    var mobileStepPercents = [];

    function isMobileTimeline() {
        return window.innerWidth <= 768;
    }

    function ensureMobileLine() {
        if (mobileSvg) return;

        mobileSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        mobileBasePath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        mobileProgressPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');

        mobileSvg.classList.add('wedding-promise__mobile-line');
        mobileSvg.setAttribute('aria-hidden', 'true');
        mobileBasePath.classList.add('wedding-promise__mobile-line-base');
        mobileProgressPath.classList.add('wedding-promise__mobile-line-progress');

        mobileSvg.appendChild(mobileBasePath);
        mobileSvg.appendChild(mobileProgressPath);
        timeline.insertBefore(mobileSvg, timeline.firstChild);
    }

    function buildMobileLine() {
        if (!isMobileTimeline()) return;

        ensureMobileLine();

        var timelineRect = timeline.getBoundingClientRect();
        var points = steps.map(function (step) {
            var icon = step.querySelector('.wedding-promise__icon') || step;
            var rect = icon.getBoundingClientRect();

            return {
                x: rect.left - timelineRect.left + rect.width / 2,
                y: rect.top - timelineRect.top + rect.height / 2
            };
        });

        if (!points.length) return;

        mobileSvg.setAttribute('viewBox', '0 0 ' + timelineRect.width + ' ' + timelineRect.height);

        var pathData = points.map(function (point, index) {
            if (index === 0) {
                return 'M ' + point.x + ' ' + point.y;
            }

            var previousPoint = points[index - 1];
            var midX = (previousPoint.x + point.x) / 2;
            var midY = (previousPoint.y + point.y) / 2;
            var dx = point.x - previousPoint.x;
            var dy = point.y - previousPoint.y;
            var length = Math.max(Math.sqrt(dx * dx + dy * dy), 1);
            var curve = Math.min(42, length * 0.18);
            var direction = index % 2 === 0 ? 1 : -1;
            var controlX = midX + (-dy / length) * curve * direction;
            var controlY = midY + (dx / length) * curve * direction;

            return 'Q ' + controlX + ' ' + controlY + ' ' + point.x + ' ' + point.y;
        }).join(' ');

        var cumulativeLength = 0;
        var pointLengths = [0];
        points.slice(0, -1).forEach(function (point, index) {
            var nextPoint = points[index + 1];
            var dx = nextPoint.x - point.x;
            var dy = nextPoint.y - point.y;

            cumulativeLength += Math.sqrt(dx * dx + dy * dy);
            pointLengths.push(cumulativeLength);
        });

        mobileBasePath.setAttribute('d', pathData);
        mobileProgressPath.setAttribute('d', pathData);
        mobilePathLength = mobileProgressPath.getTotalLength();
        mobileStepPercents = pointLengths.map(function (length) {
            return mobilePathLength ? (length / mobilePathLength) * 100 : 0;
        });
        mobileProgressPath.style.strokeDasharray = mobilePathLength;
        mobileProgressPath.style.strokeDashoffset = mobilePathLength;
    }

    function setMobileLine(linePercent) {
        if (!mobileProgressPath || !mobilePathLength) return;

        var pct = Math.max(0, Math.min(linePercent, 100));
        mobileProgressPath.style.strokeDashoffset = mobilePathLength - (mobilePathLength * pct / 100);
    }

    // Cumulative activation: step 0 is always active (first ~16.666% always filled).
    // Each step adds another 1/6 (~16.666%) to the progress bar, capped at 100%.
    function setActive(index, linePercent) {
        var hasActiveStep = index >= 0;
        if (index < -1) index = -1;
        if (index > total - 1) index = total - 1;

        steps.forEach(function (s, i) {
            s.classList.toggle('is-active', hasActiveStep && i <= index);
        });

        if (progress) {
            var pct = typeof linePercent === 'number'
                ? Math.max(0, Math.min(linePercent, 100))
                : Math.min(100, (Math.max(index + 1, 0) / total) * 100);
            if (isMobileTimeline()) {
                buildMobileLine();
                setMobileLine(pct);
            } else {
                progress.style.width = pct + '%';
                progress.style.height = '100%';
            }
        }
    }

    function updateOnScroll() {
        ticking = false;

        if (!isMobileTimeline()) {
            setActive(0);
            return;
        }

        var rect = timeline.getBoundingClientRect();
        var travel = Math.max(rect.height, 1);
        var raw = (window.innerHeight * 0.58 - rect.top) / travel;
        var scrollProgress = Math.max(0, Math.min(raw, 1));
        var activeIndex = scrollProgress <= 0
            ? -1
            : Math.min(total - 1, Math.ceil(scrollProgress * total) - 1);

        setActive(activeIndex, scrollProgress * 100);
    }

    function requestScrollUpdate() {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(updateOnScroll);
    }

    steps.forEach(function (step, i) {
        step.addEventListener('mouseenter', function () {
            if (!isMobileTimeline()) setActive(i);
        });
        step.addEventListener('focusin', function () {
            if (!isMobileTimeline()) setActive(i);
        });
        step.addEventListener('click', function () {
            if (isMobileTimeline()) {
                return;
            }

            setActive(i);
        });
    });

    window.addEventListener('scroll', requestScrollUpdate, { passive: true });
    window.addEventListener('resize', requestScrollUpdate);
    updateOnScroll();
})();


/* ========== Wedding Venues (tabs + gallery + guest slider) ========== */
(function () {
    var section = document.querySelector('.wedding-venues');
    if (!section) return;

    /* --- Tabs --- */
    var tabs = section.querySelectorAll('[data-venue-tab]');
    var panels = section.querySelectorAll('[data-venue-panel]');
    var mobileSelects = [];

    function isMobileVenueView() {
        return window.innerWidth <= 600;
    }

    function scrollToVenueHeading() {
        var heading = section.querySelector('.wedding-venues__heading');
        if (!heading) return;

        var headerOffset = 96;
        var target = heading.getBoundingClientRect().top + window.pageYOffset - headerOffset;
        window.scrollTo({
            top: Math.max(0, target),
            behavior: 'smooth'
        });
    }

    function syncMobileSelects(key) {
        mobileSelects.forEach(function (dropdown) {
            var selected = dropdown.options.find(function (option) {
                return option.key === key;
            });
            if (selected) {
                dropdown.button.textContent = selected.label;
            }
            dropdown.items.forEach(function (item) {
                var on = item.getAttribute('data-venue-mobile-option') === key;
                item.classList.toggle('is-active', on);
                item.setAttribute('aria-selected', on ? 'true' : 'false');
            });
        });
    }

    function closeMobileVenueDropdowns(except) {
        mobileSelects.forEach(function (dropdown) {
            if (dropdown.wrap === except) return;
            dropdown.wrap.classList.remove('is-open');
            dropdown.button.setAttribute('aria-expanded', 'false');
        });
    }

    function activateVenue(key, shouldScroll) {
        tabs.forEach(function (t) {
            var on = t.getAttribute('data-venue-tab') === key;
            t.classList.toggle('is-active', on);
            t.setAttribute('aria-selected', on ? 'true' : 'false');
        });
        panels.forEach(function (p) {
            var match = p.getAttribute('data-venue-panel') === key;
            p.classList.toggle('is-active', match);
            if (match) { p.removeAttribute('hidden'); } else { p.setAttribute('hidden', ''); }
        });
        syncMobileSelects(key);

        if (shouldScroll && isMobileVenueView()) {
            setTimeout(scrollToVenueHeading, 80);
        }
    }

    function buildMobileVenueDropdowns() {
        var options = Array.from(tabs).map(function (tab) {
            return {
                key: tab.getAttribute('data-venue-tab'),
                label: tab.textContent.trim()
            };
        });
        var active = section.querySelector('[data-venue-tab].is-active');
        var activeKey = active ? active.getAttribute('data-venue-tab') : (options[0] && options[0].key);

        section.querySelectorAll('.wedding-venues__enquiry').forEach(function (enquiry) {
            if (enquiry.querySelector('[data-venue-mobile-select]')) return;

            var wrap = document.createElement('div');
            wrap.className = 'wedding-venues__mobile-select-wrap';

            var label = document.createElement('span');
            label.className = 'wedding-venues__mobile-select-label';
            label.textContent = 'Venue';

            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'wedding-venues__mobile-select';
            button.setAttribute('data-venue-mobile-select', '');
            button.setAttribute('aria-label', 'Choose venue');
            button.setAttribute('aria-expanded', 'false');

            var list = document.createElement('div');
            list.className = 'wedding-venues__mobile-options';
            list.setAttribute('role', 'listbox');

            options.forEach(function (option) {
                var item = document.createElement('button');
                item.type = 'button';
                item.className = 'wedding-venues__mobile-option';
                item.setAttribute('data-venue-mobile-option', option.key);
                item.setAttribute('role', 'option');
                item.textContent = option.label;
                item.addEventListener('click', function () {
                    closeMobileVenueDropdowns();
                    activateVenue(option.key, true);
                });
                list.appendChild(item);
            });

            button.addEventListener('click', function (event) {
                event.stopPropagation();
                var willOpen = !wrap.classList.contains('is-open');
                closeMobileVenueDropdowns(willOpen ? wrap : null);
                wrap.classList.toggle('is-open', willOpen);
                button.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
            });

            wrap.appendChild(label);
            wrap.appendChild(button);
            wrap.appendChild(list);

            var notice = enquiry.querySelector('.wedding-venues__notice');
            if (notice && notice.nextSibling) {
                enquiry.insertBefore(wrap, notice.nextSibling);
            } else {
                enquiry.appendChild(wrap);
            }

            mobileSelects.push({
                wrap: wrap,
                button: button,
                items: Array.from(list.querySelectorAll('[data-venue-mobile-option]')),
                options: options
            });
        });

        syncMobileSelects(activeKey);
    }

    tabs.forEach(function (tab) {
        tab.addEventListener('click', function () {
            var key = tab.getAttribute('data-venue-tab');
            activateVenue(key, false);
        });
    });

    buildMobileVenueDropdowns();

    document.addEventListener('click', function () {
        closeMobileVenueDropdowns();
    });

    /* --- Thumbnail swap (per gallery) --- */
    section.querySelectorAll('[data-venue-gallery]').forEach(function (gallery) {
        var mainImg = gallery.querySelector('[data-venue-main]');
        if (!mainImg) return;

        gallery.querySelectorAll('[data-venue-thumb]').forEach(function (thumb) {
            thumb.addEventListener('click', function () {
                var thumbImg = thumb.querySelector('img');
                if (!thumbImg) return;
                var prevMainSrc = mainImg.getAttribute('src');
                var prevMainAlt = mainImg.getAttribute('alt') || '';
                mainImg.setAttribute('src', thumbImg.getAttribute('src'));
                thumbImg.setAttribute('src', prevMainSrc);
                // keep alt on main meaningful (don't swap)
                thumbImg.setAttribute('alt', '');
                mainImg.setAttribute('alt', prevMainAlt);
            });
        });
    });

    /* --- Guest counter slider (per panel) --- */
    section.querySelectorAll('[data-venue-counter]').forEach(function (counter) {
        var slider = counter.querySelector('[data-venue-slider]');
        var dotsWrap = counter.querySelector('[data-venue-dots]');
        var countEl = counter.querySelector('[data-venue-count]');
        if (!slider || !dotsWrap || !countEl) return;

        var min = parseInt(slider.getAttribute('min'), 10) || 0;
        var max = parseInt(slider.getAttribute('max'), 10) || 200;
        var seatsPerTable = 10;
        var tableCount = Math.ceil(max / seatsPerTable); // 20 tables for max 200
        var isEditingCount = false;
        var layout = counter.getAttribute('data-venue-layout') || '';
        var terraceTablePositions = [
            [7, 5], [8, 5], [6, 5], [6, 6], [6, 7],
            [7, 4], [8, 4],
            [5, 6], [5, 7],
            [7, 3], [8, 3],
            [5, 5], [4, 7],
            [7, 2], [8, 2],
            [4, 6], [4, 5]
        ];
     
        // Build tables (each = a "dot" container with 10 seats around it)
        for (var t = 0; t < tableCount; t++) {
            var table = document.createElement('span');
            table.className = 'wedding-venues__dot';
            if (layout === 'terrace' && terraceTablePositions[t]) {
                table.style.gridRow = terraceTablePositions[t][0];
                table.style.gridColumn = terraceTablePositions[t][1];
            }
            for (var s = 0; s < seatsPerTable; s++) {
                var seat = document.createElement('span');
                seat.className = 'wedding-venues__seat';
                seat.style.setProperty('--i', s);
                table.appendChild(seat);
            }
            dotsWrap.appendChild(table);
        }
        var tables = dotsWrap.querySelectorAll('.wedding-venues__dot');

        function clampValue(value) {
            value = parseInt(value, 10);
            if (Number.isNaN(value)) return min;
            return Math.max(min, Math.min(max, value));
        }

        function updateSeats(value) {
            value = parseInt(value, 10) || 0;
            // Light up `value` seats one-by-one across all tables (10 seats per table).
            for (var k = 0; k < tables.length; k++) {
                var table = tables[k];
                var seats = table.children;
                var litInTable = Math.max(0, Math.min(seatsPerTable, value - k * seatsPerTable));
                for (var s = 0; s < seats.length; s++) {
                    seats[s].classList.toggle('is-on', s < litInTable);
                }
                table.classList.toggle('is-on', litInTable > 0);
            }
        }

        function render(value) {
            value = clampValue(value);
            slider.value = value;
            countEl.setAttribute('aria-valuenow', value);
            if (!isEditingCount) {
                countEl.textContent = value;
            }
            updateSeats(value);
        }

        function placeCaretAtEnd(element) {
            var range = document.createRange();
            var selection = window.getSelection();

            range.selectNodeContents(element);
            range.collapse(false);
            selection.removeAllRanges();
            selection.addRange(range);
        }

        function canBecomeValid(valueText) {
            if (!valueText) return true;

            var minText = String(min);
            var maxText = String(max);
            var maxLength = maxText.length;
            var value = parseInt(valueText, 10);

            if (valueText.length > maxLength) return false;
            if (value > max) return false;
            if (value >= min) return true;

            for (var length = valueText.length + 1; length <= maxLength; length++) {
                var candidate = parseInt(valueText + '0'.repeat(length - valueText.length), 10);
                if (candidate >= min && candidate <= max) return true;
            }

            return minText.indexOf(valueText) === 0 || maxText.indexOf(valueText) === 0;
        }

        countEl.setAttribute('contenteditable', 'true');
        countEl.setAttribute('role', 'spinbutton');
        countEl.setAttribute('tabindex', '0');
        countEl.setAttribute('inputmode', 'numeric');
        countEl.setAttribute('aria-label', 'Edit guest count');
        countEl.setAttribute('aria-valuemin', min);
        countEl.setAttribute('aria-valuemax', max);

        slider.addEventListener('input', function () {
            isEditingCount = false;
            render(slider.value);
        });

        countEl.addEventListener('focus', function () {
            isEditingCount = true;
        });

        countEl.addEventListener('beforeinput', function (event) {
            if (event.data && /\D/.test(event.data)) {
                event.preventDefault();
                return;
            }

            if (!event.data || !/^\d+$/.test(event.data)) return;

            var selection = window.getSelection();
            var currentText = countEl.textContent.replace(/\D/g, '');
            var nextText = currentText + event.data;

            if (
                selection &&
                selection.rangeCount &&
                countEl.contains(selection.anchorNode) &&
                countEl.contains(selection.focusNode)
            ) {
                var range = selection.getRangeAt(0);
                var textNode = countEl.firstChild;
                var start = textNode ? Math.min(range.startOffset, range.endOffset) : currentText.length;
                var end = textNode ? Math.max(range.startOffset, range.endOffset) : currentText.length;
                nextText = currentText.slice(0, start) + event.data + currentText.slice(end);
            }

            if (!canBecomeValid(nextText)) {
                event.preventDefault();
            }
        });

        countEl.addEventListener('input', function () {
            var digits = countEl.textContent.replace(/\D/g, '');
            if (countEl.textContent !== digits) {
                countEl.textContent = digits;
                placeCaretAtEnd(countEl);
            }

            if (!digits) {
                updateSeats(0);
                return;
            }

            var typedValue = parseInt(digits, 10);
            var value = typedValue > max ? max : typedValue;
            if (typedValue > max || !canBecomeValid(digits)) {
                countEl.textContent = value;
                placeCaretAtEnd(countEl);
            }

            var renderedValue = Math.max(min, value);
            slider.value = renderedValue;
            countEl.setAttribute('aria-valuenow', renderedValue);
            updateSeats(renderedValue);
        });

        countEl.addEventListener('blur', function () {
            isEditingCount = false;
            render(countEl.textContent);
        });

        countEl.addEventListener('keydown', function (event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                countEl.blur();
            }

            if (event.key === 'Escape') {
                event.preventDefault();
                isEditingCount = false;
                render(slider.value);
                countEl.blur();
            }
        });

        render(slider.value);
    });

    /* --- Venue enquiry confirmation modal --- */
    var modal = section.querySelector('[data-venue-modal]');
    var modalText = modal ? modal.querySelector('[data-venue-modal-text]') : null;
    var modalYes = modal ? modal.querySelector('[data-venue-modal-yes]') : null;
    var modalCloseTriggers = modal ? modal.querySelectorAll('[data-venue-modal-close]') : [];
    var lastModalTrigger = null;
    var whatsappPhone = '96171828929';

    function getActiveVenueName(panel) {
        var activeTab = section.querySelector('[data-venue-tab].is-active');
        var title = panel ? panel.querySelector('.wedding-venues__title') : null;
        var venueName = (activeTab && activeTab.textContent.trim()) ||
            (title && title.textContent.trim()) ||
            'this venue';

        return venueName.toLowerCase().replace(/\b\w/g, function (letter) {
            return letter.toUpperCase();
        });
    }

    function getActiveVenuePanel() {
        return (lastModalTrigger && lastModalTrigger.closest('[data-venue-panel]')) ||
            section.querySelector('[data-venue-panel].is-active');
    }

    function getVenueGuestCount(panel) {
        var countEl = panel ? panel.querySelector('[data-venue-count]') : null;
        return countEl ? countEl.textContent.trim() : '';
    }

    function getVenueMessage(panel, includeSketchNote) {
        var venueName = getActiveVenueName(panel);
        var guestCount = getVenueGuestCount(panel);
        var message = 'hello i want to inquire about the "' + venueName + '" For "' + guestCount + '" guests, can i get more information';

        if (includeSketchNote) {
            message += '\n\nI generated the seating sketch from the selected guest count and will attach it here.';
        }

        return message;
    }

    function drawRoundedRect(ctx, x, y, width, height, radius) {
        var r = Math.min(radius, width / 2, height / 2);

        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + r);
        ctx.lineTo(x + width, y + height - r);
        ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
        ctx.lineTo(x + r, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    function createVenueSketchBlob(panel) {
        return new Promise(function (resolve) {
            var dotsWrap = panel ? panel.querySelector('[data-venue-dots]') : null;
            if (!dotsWrap) {
                resolve(null);
                return;
            }

            var rect = dotsWrap.getBoundingClientRect();
            var scale = Math.min(window.devicePixelRatio || 1, 2);
            var padding = 22;
            var canvas = document.createElement('canvas');
            var ctx = canvas.getContext('2d');

            canvas.width = Math.max(1, Math.round((rect.width + padding * 2) * scale));
            canvas.height = Math.max(1, Math.round((rect.height + padding * 2) * scale));
            ctx.scale(scale, scale);

            ctx.fillStyle = '#161616';
            ctx.fillRect(0, 0, rect.width + padding * 2, rect.height + padding * 2);
            ctx.strokeStyle = 'rgba(216, 155, 80, 0.28)';
            ctx.lineWidth = 1;
            drawRoundedRect(ctx, 8, 8, rect.width + padding * 2 - 16, rect.height + padding * 2 - 16, 4);
            ctx.stroke();

            function childRect(el) {
                var child = el.getBoundingClientRect();
                return {
                    x: child.left - rect.left + padding,
                    y: child.top - rect.top + padding,
                    width: child.width,
                    height: child.height
                };
            }

            function drawLabelBox(el, label, fill, stroke) {
                var box = childRect(el);
                if (box.width <= 0 || box.height <= 0) return;

                ctx.fillStyle = fill;
                ctx.strokeStyle = stroke;
                ctx.lineWidth = 1;
                drawRoundedRect(ctx, box.x, box.y, box.width, box.height, 3);
                ctx.fill();
                ctx.stroke();

                if (label) {
                    ctx.fillStyle = 'rgba(242, 192, 113, 0.92)';
                    ctx.font = '700 9px sans-serif';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(label, box.x + box.width / 2, box.y + box.height / 2);
                }
            }

            var dancefloor = dotsWrap.querySelector('.wedding-venues__dancefloor');
            var sweetheart = dotsWrap.querySelector('.wedding-venues__sweetheart');
            var pool = dotsWrap.querySelector('.wedding-venues__pool');
            var arch = dotsWrap.querySelector('.wedding-venues__arch');
            var greenery = dotsWrap.querySelector('.wedding-venues__greenery');
            var stairs = dotsWrap.querySelector('.wedding-venues__stairs');
            var bathStairs = dotsWrap.querySelector('.wedding-venues__bath-stairs');

            if (greenery) {
                drawLabelBox(greenery,  'GREENERY', 'rgba(85, 135, 64, 0.14)', 'rgba(85, 135, 64, 0.72)');
            }

            if (pool) {
                drawLabelBox(pool, 'POOL', 'rgba(216, 155, 80, 0.04)', 'rgba(216, 155, 80, 0.48)');
            }

            if (arch) {
                var archBox = childRect(arch);
                ctx.fillStyle = 'rgba(242, 192, 113, 0.9)';
                ctx.font = '700 9px sans-serif';
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText('ARCH', archBox.x, Math.max(12, archBox.y - 6));
                ctx.strokeStyle = 'rgba(216, 155, 80, 0.68)';
                ctx.lineWidth = 2;
                arch.querySelectorAll('i').forEach(function (mark) {
                    var markBox = childRect(mark);
                    var cx = markBox.x + markBox.width / 2;
                    var cy = markBox.y + markBox.height;
                    var radius = markBox.width / 2;
                    ctx.beginPath();
                    ctx.arc(cx, cy, radius, Math.PI, 0);
                    ctx.moveTo(markBox.x, cy);
                    ctx.lineTo(markBox.x, markBox.y + markBox.height);
                    ctx.moveTo(markBox.x + markBox.width, cy);
                    ctx.lineTo(markBox.x + markBox.width, markBox.y + markBox.height);
                    ctx.stroke();
                });
            }

            if (stairs) {
                drawLabelBox(stairs, 'STAIRS', 'rgba(216, 155, 80, 0.04)', 'rgba(216, 155, 80, 0.36)');
            }

            if (bathStairs) {
                drawLabelBox(bathStairs, 'BATHROOM STAIRS', 'rgba(216, 155, 80, 0.04)', 'rgba(216, 155, 80, 0.36)');
            }

            if (dancefloor) {
                drawLabelBox(dancefloor, dancefloor.textContent.trim() || 'DANCE FLOOR', 'rgba(216, 155, 80, 0.08)', 'rgba(216, 155, 80, 0.52)');
            }

            if (sweetheart) {
                drawLabelBox(sweetheart, sweetheart.textContent.trim(), 'rgba(216, 155, 80, 0.22)', 'rgba(216, 155, 80, 0.72)');
            }

            dotsWrap.querySelectorAll('.wedding-venues__dot.is-on').forEach(function (table) {
                var box = childRect(table);
                if (box.width <= 0 || box.height <= 0) return;

                var cx = box.x + box.width / 2;
                var cy = box.y + box.height / 2;
                var radius = Math.min(box.width, box.height) * 0.23;

                ctx.beginPath();
                ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(216, 155, 80, 0.12)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(216, 155, 80, 0.58)';
                ctx.stroke();

                table.querySelectorAll('.wedding-venues__seat.is-on').forEach(function (seat) {
                    var seatBox = childRect(seat);
                    var sx = seatBox.x + seatBox.width / 2;
                    var sy = seatBox.y + seatBox.height / 2;

                    ctx.beginPath();
                    ctx.arc(sx, sy, Math.max(2.2, seatBox.width / 2), 0, Math.PI * 2);
                    ctx.fillStyle = '#d89b50';
                    ctx.fill();
                });
            });

            canvas.toBlob(resolve, 'image/png');
        });
    }

    function downloadVenueSketch(blob) {
        if (!blob) return;

        var link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'wedding-venue-sketch.png';
        document.body.appendChild(link);
        link.click();
        link.remove();

        setTimeout(function () {
            URL.revokeObjectURL(link.href);
        }, 1000);
    }

    async function uploadVenueSketch(blob) {
        var endpoint = window.BZOMMAR_IMAGE_UPLOAD_ENDPOINT;
        if (!blob || !endpoint) return '';

        var formData = new FormData();
        formData.append('image', blob, 'wedding-venue-sketch.png');

        try {
            var response = await fetch(endpoint, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) return '';

            var result = await response.json();
            return result.url || result.imageUrl || result.directLink || '';
        } catch (error) {
            return '';
        }
    }

    function sendVenueWhatsappEnquiry() {
        var panel = getActiveVenuePanel();
        var message = getVenueMessage(panel, false);
        var whatsappUrl = 'https://wa.me/' + whatsappPhone + '?text=' + encodeURIComponent(message);

        window.open(whatsappUrl, '_blank');
        closeVenueModal();
    }

    function closeVenueModal() {
        if (!modal) return;

        modal.hidden = true;
        document.body.classList.remove('modal-open');

        if (lastModalTrigger) {
            lastModalTrigger.focus();
            lastModalTrigger = null;
        }
    }

    function openVenueModal(trigger) {
        if (!modal || !modalText) return;

        var panel = trigger.closest('[data-venue-panel]') || section.querySelector('[data-venue-panel].is-active');
        var venueName = getActiveVenueName(panel);
        var countEl = panel ? panel.querySelector('[data-venue-count]') : null;
        var guestCount = countEl ? countEl.textContent.trim() : '';

        lastModalTrigger = trigger;
        modalText.textContent = 'Are you sure you want to Inquire about ' + venueName + ' for ' + guestCount + ' guests?';
        modal.hidden = false;
        document.body.classList.add('modal-open');

        requestAnimationFrame(function () {
            if (modalYes) modalYes.focus();
        });
    }

    section.querySelectorAll('[data-venue-enquire]').forEach(function (button) {
        button.addEventListener('click', function () {
            openVenueModal(button);
        });
    });

    document.querySelectorAll('[data-scroll-venue-enquiry]').forEach(function (link) {
        link.addEventListener('click', function (event) {
            event.preventDefault();

            var activePanel = section.querySelector('[data-venue-panel].is-active') || section.querySelector('[data-venue-panel]');
            var countTarget = activePanel ? activePanel.querySelector('.wedding-venues__count') : null;
            var enquiryButton = activePanel ? activePanel.querySelector('[data-venue-enquire]') : null;
            if (!enquiryButton) return;

            var offset = window.innerWidth <= 768 ? 96 : 120;
            var scrollTarget = countTarget || enquiryButton;
            var top = scrollTarget.getBoundingClientRect().top + window.pageYOffset - offset;
            window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });

            window.setTimeout(function () {
                var pulseTarget = enquiryButton.closest('.star-border') || enquiryButton;
                pulseTarget.classList.remove('is-attention-pulse');
                void pulseTarget.offsetWidth;
                pulseTarget.classList.add('is-attention-pulse');
            }, 650);
        });
    });

    modalCloseTriggers.forEach(function (trigger) {
        trigger.addEventListener('click', closeVenueModal);
    });

    if (modalYes) {
        modalYes.addEventListener('click', function () {
            sendVenueWhatsappEnquiry();
        });
    }

    document.addEventListener('keydown', function (event) {
        if (event.key === 'Escape' && modal && !modal.hidden) {
            closeVenueModal();
        }
    });
})();

/* ── About Panorama Image Sync ── */
(function () {
    var viewport = document.querySelector('.about-panorama__viewport');
    var image = document.querySelector('.about-panorama__image');
    if (!viewport || !image) return;

    function syncPanoramaImage() {
        var src = image.currentSrc || image.src;
        if (!src) return;

        viewport.style.setProperty('--about-panorama-image', 'url("' + src.replace(/"/g, '\\"') + '")');
    }

    syncPanoramaImage();

    if (!image.complete) {
        image.addEventListener('load', syncPanoramaImage, { once: true });
    }
})();

/* ── Floating Call Button ── */
(function () {
    if (!document.body) return;

    var button = document.createElement('a');
    button.className = 'floating-call';
    button.href = 'tel:+9619240640';
    button.setAttribute('aria-label', 'Call Bzommar Palace Hotel');
    button.innerHTML = [
        '<span class="floating-call__icon" aria-hidden="true">',
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">',
        '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.12.9.35 1.77.68 2.6a2 2 0 0 1-.45 2.11L8.07 9.91a16 16 0 0 0 6 6l1.48-1.27a2 2 0 0 1 2.11-.45c.83.33 1.7.56 2.6.68A2 2 0 0 1 22 16.92z"></path>',
        '</svg>',
        '</span>'
    ].join('');

    document.body.appendChild(button);

    var triggerSection = document.querySelector('.hero, .gallery-page__header, .contact-page__intro, .policy, main > section');

    if (!triggerSection) {
        button.classList.add('is-raised');
        return;
    }

    triggerSection.classList.add('floating-call-trigger');

    function setRaised(isRaised) {
        button.classList.toggle('is-raised', !!isRaised);
    }

    function updateOnScroll() {
        var triggerRect = triggerSection.getBoundingClientRect();
        var buttonRect = button.getBoundingClientRect();
        setRaised(triggerRect.bottom <= buttonRect.top + 8);
    }

    window.addEventListener('scroll', updateOnScroll, { passive: true });
    document.addEventListener('scroll', updateOnScroll, { passive: true });
    window.addEventListener('resize', updateOnScroll);
    window.addEventListener('load', updateOnScroll);
    updateOnScroll();
    requestAnimationFrame(updateOnScroll);
})();

/* ── About Nearby Carousel ── */
(function () {
    var section = document.querySelector('.about-nearby');
    if (!section) return;

    var viewport = section.querySelector('.about-nearby__viewport');
    var track = section.querySelector('.about-nearby__grid');
    var pagination = section.querySelector('.about-nearby__pagination');
    if (!viewport || !track || !pagination) return;

    var cards = Array.from(track.querySelectorAll('.about-nearby__card'));
    if (!cards.length) return;

    var index = 0;
    var position = cards.length > 1 ? 1 : 0;
    var startX = 0;
    var currentX = 0;
    var baseOffset = 0;
    var isDragging = false;
    var didDrag = false;
    var autoTimer;
    var dots;
    var hasTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);

    if (cards.length > 1) {
        var firstClone = cards[0].cloneNode(true);
        var lastClone = cards[cards.length - 1].cloneNode(true);

        firstClone.classList.add('about-nearby__card--clone');
        lastClone.classList.add('about-nearby__card--clone');
        firstClone.setAttribute('aria-hidden', 'true');
        lastClone.setAttribute('aria-hidden', 'true');
        firstClone.tabIndex = -1;
        lastClone.tabIndex = -1;

        track.insertBefore(lastClone, cards[0]);
        track.appendChild(firstClone);
    }

    var slides = Array.from(track.querySelectorAll('.about-nearby__card'));

    function isCarousel() {
        return window.innerWidth <= 1080;
    }

    function getStep() {
        var gap = parseFloat(getComputedStyle(track).gap) || 0;
        return slides[0].offsetWidth + gap;
    }

    function getOffset() {
        return -(position * getStep());
    }

    function normalizeIndex(nextIndex) {
        return ((nextIndex % cards.length) + cards.length) % cards.length;
    }

    function update(animate) {
        if (!isCarousel()) {
            track.style.transform = '';
            return;
        }

        track.classList.toggle('is-dragging', animate === false);
        track.style.transform = 'translateX(' + getOffset() + 'px)';
        dots.forEach(function (dot, dotIndex) {
            dot.classList.toggle('active', dotIndex === index);
        });
    }

    function goTo(nextIndex) {
        if (cards.length <= 1) {
            index = 0;
            position = 0;
            update(true);
            return;
        }

        if ((nextIndex >= cards.length || nextIndex === 0) && index === cards.length - 1) {
            position = cards.length + 1;
        } else if ((nextIndex < 0 || nextIndex === cards.length - 1) && index === 0) {
            position = 0;
        } else {
            position = normalizeIndex(nextIndex) + 1;
        }

        index = normalizeIndex(nextIndex);
        track.classList.remove('is-dragging');
        update(true);
    }

    function snapAfterWrap() {
        if (cards.length <= 1 || !isCarousel()) return;

        if (position === cards.length + 1) {
            position = 1;
        } else if (position === 0) {
            position = cards.length;
        } else {
            return;
        }

        update(false);
        requestAnimationFrame(function () {
            track.classList.remove('is-dragging');
        });
    }

    function startAuto() {
        clearInterval(autoTimer);
        if (!isCarousel()) return;
        autoTimer = setInterval(function () {
            goTo(index + 1);
        }, 5000);
    }

    function restartAuto() {
        clearInterval(autoTimer);
        startAuto();
    }

    dots = cards.map(function (_, dotIndex) {
        var dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'about-nearby__dot' + (dotIndex === 0 ? ' active' : '');
        dot.setAttribute('aria-label', 'Go to nearby experience ' + (dotIndex + 1));
        dot.addEventListener('click', function () {
            goTo(dotIndex);
            restartAuto();
        });
        pagination.appendChild(dot);
        return dot;
    });

    slides.forEach(function (slide) {
        slide.addEventListener('dragstart', function (event) {
            event.preventDefault();
        });
        var image = slide.querySelector('img');
        if (image) {
            image.setAttribute('draggable', 'false');
        }
    });

    track.addEventListener('pointerdown', function (event) {
        if (!isCarousel() || hasTouchDevice || event.pointerType === 'touch') return;
        isDragging = true;
        didDrag = false;
        startX = event.clientX;
        currentX = startX;
        baseOffset = getOffset();
        track.classList.add('is-dragging');
        if (track.setPointerCapture) {
            track.setPointerCapture(event.pointerId);
        }
    });

    track.addEventListener('pointermove', function (event) {
        if (!isDragging || hasTouchDevice || event.pointerType === 'touch') return;
        currentX = event.clientX;
        var delta = currentX - startX;
        if (Math.abs(delta) > 8) didDrag = true;
        track.style.transform = 'translateX(' + (baseOffset + delta) + 'px)';
    });

    track.addEventListener('pointerup', function (event) {
        if (hasTouchDevice || event.pointerType === 'touch') return;
        if (!isDragging) return;
        isDragging = false;
        var delta = currentX - startX;
        if (Math.abs(delta) > 50) {
            goTo(index + (delta < 0 ? 1 : -1));
        } else {
            goTo(index);
        }
        restartAuto();
    });

    track.addEventListener('transitionend', function (event) {
        if (event.propertyName !== 'transform') return;
        snapAfterWrap();
    });

    track.addEventListener('pointercancel', function (event) {
        if (hasTouchDevice || event.pointerType === 'touch') return;
        isDragging = false;
        goTo(index);
    });

    function handleTouchStart(event) {
        if (!isCarousel() || !event.touches.length) return;
        isDragging = true;
        didDrag = false;
        startX = event.touches[0].clientX;
        currentX = startX;
        baseOffset = getOffset();
        track.classList.add('is-dragging');
        clearInterval(autoTimer);
    }

    function handleTouchMove(event) {
        if (!isDragging || !event.touches.length) return;
        currentX = event.touches[0].clientX;
        var delta = currentX - startX;
        if (Math.abs(delta) > 8) {
            didDrag = true;
            event.preventDefault();
        }
        track.style.transform = 'translateX(' + (baseOffset + delta) + 'px)';
    }

    function handleTouchEnd(event) {
        if (!isDragging) return;
        isDragging = false;
        track.classList.remove('is-dragging');

        if (event.changedTouches && event.changedTouches.length) {
            currentX = event.changedTouches[0].clientX;
        }

        var delta = currentX - startX;
        if (Math.abs(delta) > 50) {
            goTo(index + (delta < 0 ? 1 : -1));
        } else {
            goTo(index);
        }
        restartAuto();
        window.setTimeout(function () {
            didDrag = false;
        }, 260);
    }

    function handleTouchCancel() {
        if (!isDragging) return;
        isDragging = false;
        track.classList.remove('is-dragging');
        goTo(index);
        restartAuto();
        window.setTimeout(function () {
            didDrag = false;
        }, 260);
    }

    viewport.addEventListener('touchstart', handleTouchStart, { passive: true });
    viewport.addEventListener('touchmove', handleTouchMove, { passive: false });
    viewport.addEventListener('touchend', handleTouchEnd, { passive: true });
    viewport.addEventListener('touchcancel', handleTouchCancel, { passive: true });

    track.addEventListener('click', function (event) {
        if (!didDrag) return;
        event.preventDefault();
        event.stopPropagation();
        didDrag = false;
    }, true);

    window.addEventListener('resize', function () {
        update(false);
        restartAuto();
    });

    update(false);
    startAuto();
})();

/* ── About Map (MapLibre + OpenFreeMap) ── */
(function () {
    var mapEl = document.getElementById('about-map-canvas');
    if (!mapEl) return;

    var fallback = mapEl.querySelector('.about-map__fallback');
    if (typeof maplibregl === 'undefined') {
        if (fallback) {
            fallback.textContent = 'Interactive map preview is unavailable right now.';
        }
        return;
    }

    var lat = parseFloat(mapEl.getAttribute('data-lat'));
    var lng = parseFloat(mapEl.getAttribute('data-lng'));
    var zoom = parseFloat(mapEl.getAttribute('data-zoom')) || 14.2;
    var label = mapEl.getAttribute('data-name') || 'Bzommar Palace Hotel';

    if (Number.isNaN(lat) || Number.isNaN(lng)) return;

    var compact = window.matchMedia('(max-width: 768px)').matches;
    var map = new maplibregl.Map({
        container: mapEl,
        style: 'https://tiles.openfreemap.org/styles/dark',
        center: [lng, lat],
        zoom: zoom,
        attributionControl: false
    });

    mapEl.__maplibre = map;

    function HomeControl() {}

    HomeControl.prototype.onAdd = function () {
        var container = document.createElement('div');
        container.className = 'maplibregl-ctrl maplibregl-ctrl-group';

        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'about-map__home-control';
        button.setAttribute('aria-label', 'Recenter map on Bzommar Palace Hotel');
        button.innerHTML = [
            '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">',
            '<path d="M4.5 10.75 12 4.5l7.5 6.25"></path>',
            '<path d="M7.25 9.9V19.5h9.5V9.9"></path>',
            '<path d="M10 19.5v-4.75h4v4.75"></path>',
            '</svg>'
        ].join('');

        button.addEventListener('click', function () {
            map.easeTo({
                center: [lng, lat],
                zoom: zoom,
                duration: 1400,
                essential: true
            });
        });

        container.appendChild(button);
        this._container = container;
        return container;
    };

    HomeControl.prototype.onRemove = function () {
        if (this._container && this._container.parentNode) {
            this._container.parentNode.removeChild(this._container);
        }
        this._container = null;
    };

    map.scrollZoom.disable();
    map.dragRotate.disable();
    map.touchZoomRotate.disableRotation();
    map.addControl(new HomeControl(), 'top-right');
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');

    if (compact) {
        map.dragPan.disable();
    }

    var hoverMask = null;

    function ensureHoverMask() {
        if (hoverMask && hoverMask.isConnected) {
            return hoverMask;
        }

        var canvasContainer = mapEl.querySelector('.maplibregl-canvas-container');
        if (!canvasContainer) {
            return null;
        }

        hoverMask = canvasContainer.querySelector('.about-map__hover-mask');
        if (!hoverMask) {
            hoverMask = document.createElement('div');
            hoverMask.className = 'about-map__hover-mask';
            canvasContainer.appendChild(hoverMask);
        }

        return hoverMask;
    }

    function updateMapHoverPosition(event) {
        var rect = mapEl.getBoundingClientRect();
        var x = Math.max(0, Math.min(rect.width, event.clientX - rect.left));
        var y = Math.max(0, Math.min(rect.height, event.clientY - rect.top));
        var activeHoverMask = ensureHoverMask();

        if (!activeHoverMask) {
            return;
        }

        activeHoverMask.style.setProperty('--about-map-hover-x', x + 'px');
        activeHoverMask.style.setProperty('--about-map-hover-y', y + 'px');
    }

    mapEl.addEventListener('pointerenter', function (event) {
        var activeHoverMask = ensureHoverMask();
        if (activeHoverMask) {
            activeHoverMask.style.opacity = '1';
        }
        updateMapHoverPosition(event);
    });

    mapEl.addEventListener('pointermove', function (event) {
        updateMapHoverPosition(event);
    });

    mapEl.addEventListener('pointerleave', function () {
        var activeHoverMask = ensureHoverMask();
        if (activeHoverMask) {
            activeHoverMask.style.opacity = '0';
        }
    });

    map.on('load', ensureHoverMask);

    function escapeHtml(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function buildMapPointCard(point) {
        return [
            '<div class="about-map__poi-card">',
            '<p class="about-map__poi-eyebrow">' + escapeHtml(point.kind) + '</p>',
            '<h3 class="about-map__poi-title">' + escapeHtml(point.name) + '</h3>',
            '<p class="about-map__poi-text">' + escapeHtml(point.summary) + '</p>',
            '<a class="about-map__poi-btn" href="https://www.google.com/maps/dir/?api=1&destination=' + point.lat + ',' + point.lng + '" target="_blank" rel="noopener noreferrer">Directions</a>',
            '</div>'
        ].join('');
    }

    function attachMapPointInteractions(markerEl) {
        var closeTimer = null;
        var interactiveChildren = Array.from(markerEl.querySelectorAll('.about-map__pin-label, .about-map__poi-card'));

        function clearCloseTimer() {
            if (!closeTimer) return;
            window.clearTimeout(closeTimer);
            closeTimer = null;
        }

        function openMarker() {
            clearCloseTimer();
            markerEl.classList.add('is-open');
        }

        function scheduleClose() {
            clearCloseTimer();
            closeTimer = window.setTimeout(function () {
                closeTimer = null;

                if (!markerEl.matches(':hover') && !markerEl.matches(':focus-within')) {
                    markerEl.classList.remove('is-open');
                }
            }, 2000);
        }

        markerEl.addEventListener('pointerenter', openMarker);
        markerEl.addEventListener('pointerleave', scheduleClose);
        markerEl.addEventListener('focusin', openMarker);
        markerEl.addEventListener('focusout', function () {
            window.requestAnimationFrame(function () {
                if (!markerEl.matches(':focus-within')) {
                    scheduleClose();
                }
            });
        });

        interactiveChildren.forEach(function (childEl) {
            childEl.addEventListener('pointerenter', openMarker);
            childEl.addEventListener('pointerleave', scheduleClose);
        });

        markerEl.addEventListener('click', function (event) {
            if (event.target.closest('a')) {
                return;
            }

            openMarker();
            markerEl.focus();
        });

        markerEl.addEventListener('keydown', function (event) {
            if (event.key !== 'Escape') {
                return;
            }

            clearCloseTimer();
            markerEl.classList.remove('is-open');

            var activeElement = document.activeElement;
            if (activeElement && markerEl.contains(activeElement) && typeof activeElement.blur === 'function') {
                activeElement.blur();
            }

            if (document.activeElement === markerEl) {
                markerEl.blur();
            }
        });
    }

    var hotelPoint = {
        name: label,
        kind: 'Hotel',
        summary: 'Use this marker for direct directions to ' + label + '.',
        lat: lat,
        lng: lng
    };

    var interestPoints = [
        {
            name: 'Our Lady Of Bzommar',
            kind: 'Landmark',
            summary: 'A nearby spiritual landmark in the Bzommar area.',
            lat: 33.98450645676165,
            lng: 35.684518381304635
        },
        {
            name: 'Awad Ice Cream',
            kind: 'Dessert Stop',
            summary: 'A nearby sweet stop for a quick break in the mountains.',
            lat: 33.984685787510884,
            lng: 35.70183551281091
        },
        {
            name: 'Pulse Achkout',
            kind: 'Nearby Destination',
            summary: 'A nearby Achkout stop in the surrounding mountain corridor.',
            lat: 33.99127350524978,
            lng: 35.696991839539265
        },
        {
            name: 'Ain Warka Monastery',
            kind: 'Monastery',
            summary: 'A nearby hillside monastery and heritage landmark.',
            lat: 33.996939559930524,
            lng: 35.67962056602402
        },
        {
            name: 'Saint Simon Church',
            kind: 'Church',
            summary: 'A nearby church and local heritage stop.',
            lat: 33.989618075234176,
            lng: 35.6737031483859
        }
    ];

    var markerEl = document.createElement('div');
    markerEl.className = 'about-map__pin';
    markerEl.tabIndex = 0;
    markerEl.setAttribute('aria-label', label);
    markerEl.innerHTML = [
        '<span class="about-map__pin-inner" aria-hidden="true"></span>',
        '<span class="about-map__pin-label">' + escapeHtml(label) + '</span>',
        buildMapPointCard(hotelPoint)
    ].join('');
    attachMapPointInteractions(markerEl);

    new maplibregl.Marker({
        element: markerEl,
        anchor: 'center'
    }).setLngLat([lng, lat]).addTo(map);

    interestPoints.forEach(function (point) {
        var pointEl = document.createElement('div');
        pointEl.className = 'about-map__poi';
        pointEl.tabIndex = 0;
        pointEl.setAttribute('aria-label', point.name);
        pointEl.innerHTML = [
            '<span class="about-map__poi-dot" aria-hidden="true"></span>',
            buildMapPointCard(point)
        ].join('');
        attachMapPointInteractions(pointEl);

        new maplibregl.Marker({
            element: pointEl,
            anchor: 'center'
        }).setLngLat([point.lng, point.lat]).addTo(map);
    });

    var baseStyleApplied = false;

    function applyBaseMapStyle() {
        if (baseStyleApplied) return;
        if (!map.getLayer('background')) return;

        baseStyleApplied = true;

        if (fallback && fallback.parentNode) {
            fallback.parentNode.removeChild(fallback);
        }

        mapEl.dataset.mapReady = '1';

        [
            ['background', 'background-color', 'rgba(0, 0, 0, 0)'],
            ['background', 'background-opacity', 0],
            ['water', 'fill-color', 'rgba(0, 0, 0, 0)'],
            ['water', 'fill-opacity', 0],
            ['waterway', 'line-color', '#1d1d1d'],
            ['highway_path', 'line-color', 'rgba(216, 155, 80, 0.18)'],
            ['highway_minor', 'line-color', 'rgba(216, 155, 80, 0.22)'],
            ['highway_major_inner', 'line-color', '#ab7944'],
            ['highway_major_subtle', 'line-color', '#664a2f'],
            ['highway_motorway_inner', 'line-color', '#b98346'],
            ['highway_motorway_subtle', 'line-color', '#795734'],
            ['highway_major_casing', 'line-color', 'rgba(63, 44, 25, 0.82)'],
            ['highway_motorway_casing', 'line-color', 'rgba(67, 47, 27, 0.88)']
        ].forEach(function (entry) {
            var layerId = entry[0];
            var paintProp = entry[1];
            var value = entry[2];

            if (!map.getLayer(layerId)) return;

            try {
                if (map.getPaintProperty(layerId, paintProp) !== undefined) {
                    map.setPaintProperty(layerId, paintProp, value);
                }
            } catch (error) {
                // Keep the map usable even if a provider style changes layer paint definitions.
            }
        });

        [
            ['highway_path', 'line-width', ['interpolate', ['exponential', 1.2], ['zoom'], 14, 0.4, 20, 4]],
            ['highway_minor', 'line-width', ['interpolate', ['exponential', 1.4], ['zoom'], 13, 0.8, 20, 8]],
            ['highway_major_inner', 'line-width', ['interpolate', ['exponential', 1.3], ['zoom'], 10, 2.45, 20, 24]],
            ['highway_major_subtle', 'line-width', ['interpolate', ['linear'], ['zoom'], 6, 0, 8, 2.3]],
            ['highway_motorway_inner', 'line-width', ['interpolate', ['exponential', 1.4], ['zoom'], 4, 2.2, 6, 1.55, 20, 34]],
            ['highway_motorway_subtle', 'line-width', ['interpolate', ['exponential', 1.4], ['zoom'], 4, 2.05, 6, 1.5]]
        ].forEach(function (entry) {
            var layerId = entry[0];
            var paintProp = entry[1];
            var value = entry[2];

            if (!map.getLayer(layerId)) return;

            try {
                if (map.getPaintProperty(layerId, paintProp) !== undefined) {
                    map.setPaintProperty(layerId, paintProp, value);
                }
            } catch (error) {
                // Keep the map usable even if a provider style changes layer paint definitions.
            }
        });

        map.jumpTo({
            center: [lng, lat],
            zoom: zoom
        });

    }

    map.on('styledata', applyBaseMapStyle);
    map.on('idle', applyBaseMapStyle);

    function syncMapSize() {
        map.resize();
    }

    window.addEventListener('load', syncMapSize);
    window.addEventListener('resize', syncMapSize);
    requestAnimationFrame(syncMapSize);
})();
