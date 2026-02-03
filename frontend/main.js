// ============================================
// OPTIFLEET - MAIN LANDING PAGE JAVASCRIPT
// ============================================

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initScrollEffects();
    initAnimations();
});

// ============================================
// NAVIGATION
// ============================================

function initNavigation() {
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.navbar-link');

    // Scroll effect for navbar
    let lastScroll = 0;
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        if (currentScroll > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        lastScroll = currentScroll;
    });

    // Smooth scroll for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');

            // Only handle hash links
            if (href && href.startsWith('#')) {
                e.preventDefault();

                const targetId = href.substring(1);
                const targetElement = document.getElementById(targetId);

                if (targetElement) {
                    // Remove active class from all links
                    navLinks.forEach(l => l.classList.remove('active'));

                    // Add active class to clicked link
                    link.classList.add('active');

                    // Smooth scroll to target
                    const navbarHeight = navbar.offsetHeight;
                    const targetPosition = targetElement.offsetTop - navbarHeight;

                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // Update active link on scroll
    const sections = document.querySelectorAll('section[id]');

    window.addEventListener('scroll', () => {
        const scrollPosition = window.pageYOffset + 150;

        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const sectionId = section.getAttribute('id');

            if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });
}

// ============================================
// SCROLL EFFECTS
// ============================================

function initScrollEffects() {
    // Intersection Observer for fade-in animations
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, observerOptions);

    // Observe all feature cards and stat cards
    const animatedElements = document.querySelectorAll('.feature-card, .stat-card, .card-glass');

    animatedElements.forEach((element, index) => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = `opacity 0.6s ease-out ${index * 0.1}s, transform 0.6s ease-out ${index * 0.1}s`;
        observer.observe(element);
    });
}

// ============================================
// ANIMATIONS
// ============================================

function initAnimations() {
    // Animate stats on scroll
    const statValues = document.querySelectorAll('.stat-value');

    const animateStats = (entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const text = target.textContent;

                // Extract number from text
                const match = text.match(/[\d.]+/);
                if (match) {
                    const finalValue = parseFloat(match[0]);
                    const suffix = text.replace(match[0], '').trim();
                    const isPercentage = suffix.includes('%');

                    animateValue(target, 0, finalValue, 1500, suffix, isPercentage);
                }

                observer.unobserve(target);
            }
        });
    };

    const statsObserver = new IntersectionObserver(animateStats, {
        threshold: 0.5
    });

    statValues.forEach(stat => {
        statsObserver.observe(stat);
    });
}

function animateValue(element, start, end, duration, suffix = '', isPercentage = false) {
    const startTime = performance.now();

    const update = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = start + (end - start) * easeOut;

        if (isPercentage) {
            element.textContent = `${Math.round(current)}${suffix}`;
        } else if (end >= 1000000) {
            element.textContent = `${(current / 1000000).toFixed(1)}M ${suffix}`;
        } else if (end >= 1000) {
            element.textContent = `${(current / 1000).toFixed(1)}K ${suffix}`;
        } else {
            element.textContent = `${current.toFixed(1)} ${suffix}`;
        }

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    };

    requestAnimationFrame(update);
}

// ============================================
// PARALLAX EFFECT
// ============================================

window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');

    if (hero) {
        const parallaxElements = hero.querySelectorAll('::before, ::after');
        // Note: Pseudo-elements can't be directly manipulated, 
        // but the animation is handled via CSS
    }
});

// ============================================
// BUTTON RIPPLE EFFECT
// ============================================

document.querySelectorAll('.btn').forEach(button => {
    button.addEventListener('click', function (e) {
        const ripple = document.createElement('span');
        const rect = this.getBoundingClientRect();
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;

        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.classList.add('ripple');

        this.appendChild(ripple);

        setTimeout(() => {
            ripple.remove();
        }, 600);
    });
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

// Debounce function for performance
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function for scroll events
function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// ============================================
// PERFORMANCE OPTIMIZATION
// ============================================

// Use throttled scroll handler
const optimizedScroll = throttle(() => {
    // Scroll-based animations handled here
}, 100);

window.addEventListener('scroll', optimizedScroll);

// ============================================
// CONSOLE BRANDING
// ============================================

console.log(
    '%c🚚 OptiFleet ',
    'background: linear-gradient(135deg, #22c55e 0%, #0284c7 100%); color: white; padding: 10px 20px; font-size: 20px; font-weight: bold; border-radius: 8px;'
);

console.log(
    '%cReducing carbon emissions, one optimized route at a time.',
    'color: #22c55e; font-size: 14px; font-style: italic;'
);

console.log(
    '%cInterested in our API? Check out the documentation at /api/docs',
    'color: #0284c7; font-size: 12px;'
);
