// Theme Management
class ThemeManager {
    constructor() {
        const savedTheme = localStorage.getItem('theme');
        const systemTheme = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
        this.currentTheme = savedTheme === 'dark' || savedTheme === 'light' ? savedTheme : systemTheme;
        this.themeToggle = document.querySelector('.theme-toggle');
        this.init();
    }

    init() {
        this.setTheme(this.currentTheme);
        this.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Update icon based on current theme
        this.updateThemeIcon();
    }

    setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        this.currentTheme = theme;
        this.updateThemeIcon();
        this.updateLogos();
    }

    toggleTheme() {
        const newTheme = this.currentTheme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);

        // Add animation class to the toggle buttons
        this.themeToggle.classList.add('animating');
        this.themeToggle.addEventListener('animationend', () => this.themeToggle.classList.remove('animating'), { once: true });
    }

    updateThemeIcon() {
        const icon = this.themeToggle.querySelector('i');
        if (this.currentTheme === 'dark') {
            icon.className = 'fas fa-moon';
        } else {
            icon.className = 'fas fa-sun';
        }
    }

    updateLogos() {
        const navLogo = document.getElementById('navLogo');
        const footerLogo = document.getElementById('footerLogo');

        if (this.currentTheme === 'dark') {
            // Mode sombre : utiliser CEAOB.svg
            if (navLogo) navLogo.src = 'ico/CEAOB.webp';
            if (footerLogo) footerLogo.src = 'ico/CEAOB.webp';
        } else {
            // Mode clair : utiliser CEAON.svg
            if (navLogo) navLogo.src = 'ico/CEAON.webp';
            if (footerLogo) footerLogo.src = 'ico/CEAON.webp';
        }
    }
}

// Navigation Management
class NavigationManager {
    constructor() {
        this.navbar = document.querySelector('.navbar');
        this.hamburger = document.querySelector('.hamburger');
        this.navMenu = document.querySelector('#nav-menu-list'); // Cible le menu unique
        this.navLinks = document.querySelectorAll('.nav-link'); // Cible tous les liens
        this.init();
    }

    init() {
        // Hamburger menu toggle
        this.hamburger.addEventListener('click', () => this.toggleMobileMenu());

        // Close mobile menu when clicking on links (pas le trigger dropdown)
        this.navLinks.forEach(link => {
            if (!link.classList.contains('nav-link--dropdown')) {
                link.addEventListener('click', () => this.closeMobileMenu());
            }
        });

        // Close mobile menu when clicking outside
        document.addEventListener('click', (e) => this.handleOutsideClick(e));

        // Navbar scroll effect
        window.addEventListener('scroll', Utils.throttle(() => this.handleScroll(), 50));

        // Smooth scrolling for navigation links
        this.setupSmoothScrolling();

        // État initial : étendu si on est tout en haut
        this.updateHeroNavbar();
    }

    toggleMobileMenu() {
        this.navMenu.classList.toggle('active');
        this.hamburger.classList.toggle('active');
        const isExpanded = this.navMenu.classList.contains('active');
        this.hamburger.setAttribute('aria-expanded', isExpanded);
    }

    closeMobileMenu() {
        if (this.navMenu.classList.contains('active')) {
            this.navMenu.classList.remove('active');
            this.hamburger.classList.remove('active');
            this.hamburger.setAttribute('aria-expanded', 'false');
        }
    }

    handleOutsideClick(e) {
        // Vérifie si le menu est ouvert
        if (!this.navMenu.classList.contains('active')) {
            return;
        }

        // Vérifie si le clic est à l'extérieur du menu et du hamburger
        const isClickInsideMenu = this.navMenu.contains(e.target);
        const isClickOnHamburger = this.hamburger.contains(e.target);

        if (!isClickInsideMenu && !isClickOnHamburger) {
            this.closeMobileMenu();
        }
    }

    handleScroll() {
        this.updateActiveNavLink();
        this.updateHeroNavbar();
    }

    updateHeroNavbar() {
        const isAtTop = window.scrollY < 60;
        this.navbar.classList.toggle('navbar--hero', isAtTop);
    }

    updateActiveNavLink() {
        const sectionNavMap = { 'references': 'clients' };
        const dropdownSections = new Set(['expertise', 'equipe', 'moyens-techniques']);
        const sections = Array.from(document.querySelectorAll('section[id]')).filter(s => s.offsetHeight > 0);
        const scrollPos = window.scrollY + window.innerHeight * 0.5;
        const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 10;

        sections.forEach((section, index) => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.offsetHeight;
            const isLast = index === sections.length - 1;

            const inSection = isLast
                ? (atBottom || (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight))
                : (scrollPos >= sectionTop && scrollPos < sectionTop + sectionHeight);

            if (inSection) {
                this.navLinks.forEach(link => link.classList.remove('active'));
                if (dropdownSections.has(section.id)) {
                    document.querySelector('.nav-link--dropdown')?.classList.add('active');
                } else {
                    const mappedId = sectionNavMap[section.id] || section.id;
                    document.querySelector(`.nav-link[href="#${mappedId}"]`)?.classList.add('active');
                }
            }
        });
    }

    navbarHeight() {
        return this.navbar ? this.navbar.offsetHeight : 80;
    }

    setupSmoothScrolling() {
        // Keep scroll-padding-top in sync with actual navbar height for hash navigation
        const syncScrollPadding = () => {
            document.documentElement.style.scrollPaddingTop = `${this.navbarHeight()}px`;
        };
        syncScrollPadding();
        window.addEventListener('resize', Utils.debounce(syncScrollPadding, 150));

        this.navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const targetId = link.getAttribute('href');
                if (!targetId || !targetId.startsWith('#')) return;
                e.preventDefault();
                const targetSection = document.querySelector(targetId);
                if (targetSection) {
                    const offsetTop = targetSection.offsetTop - this.navbarHeight();
                    window.scrollTo({ top: offsetTop, behavior: 'smooth' });
                }
            });
        });
    }
}

// Contact Form Management
class ContactFormManager {
    constructor() {
        this.form = document.querySelector('.contact-form');
        this.init();
    }

    init() {
        if (this.form) {
            this.form.addEventListener('submit', (e) => this.handleSubmit(e));
            this.setupFormValidation();
        }
    }

    async handleSubmit(e) {
        e.preventDefault();

        // Validate all fields
        const inputs = this.form.querySelectorAll('input, textarea');
        let isFormValid = true;
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isFormValid = false;
            }
        });

        if (!isFormValid) return;

        // Show loading state
        const submitBtn = this.form.querySelector('button[type="submit"]');
        const originalChildren = Array.from(submitBtn.childNodes).filter(n => !n.classList?.contains('ripple'));
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Envoi en cours...';
        submitBtn.disabled = true;

        try {
            const formData = new FormData(this.form);
            const response = await fetch(this.form.action, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });

            const result = await response.json();

            if (response.ok) {
                this.showSuccessMessage();
                this.form.reset();
                // Effacer les messages d'erreur des champs après succès
                inputs.forEach(input => this.clearFieldError(input));
            } else {
                // Affiche l'erreur renvoyée par le serveur PHP
                this.showErrorMessage(result.message || 'Une erreur serveur est survenue.');
            }

        } catch (error) {
            console.error('Erreur lors de l\'envoi du formulaire:', error);
            this.showErrorMessage('Impossible de contacter le serveur. Veuillez réessayer.');
        } finally {
            submitBtn.innerHTML = '';
            originalChildren.forEach(n => submitBtn.appendChild(n));
            submitBtn.disabled = false;
        }
    }

    setupFormValidation() {
        const inputs = this.form.querySelectorAll('input, textarea');

        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));
            input.addEventListener('input', () => this.clearFieldError(input));
        });
    }

    validateField(field) {
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Remove existing error
        this.clearFieldError(field);

        // Validation rules
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'Ce champ est requis';
        } else if (field.type === 'email' && value && !this.isValidEmail(value)) {
            isValid = false;
            errorMessage = 'Veuillez entrer une adresse email valide';
        }

        if (!isValid) {
            this.showFieldError(field, errorMessage);
        }

        return isValid;
    }

    showFieldError(field, message) {
        field.closest('.form-group').classList.add('has-error');

        // Create error message element
        const errorEl = document.createElement('div');
        errorEl.className = 'field-error';
        errorEl.textContent = message;

        field.parentNode.appendChild(errorEl);
    }

    clearFieldError(field) {
        field.closest('.form-group').classList.remove('has-error');
        const errorEl = field.parentNode.querySelector('.field-error');
        if (errorEl) {
            errorEl.remove();
        }
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showSuccessMessage() {
        const rawName = this.form.querySelector('#name').value.trim() || 'Mr/Mme';

        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <div class="success-content">
                <strong></strong>
                <p>Merci de nous avoir contactés !</p>
                <p>Nous reviendrons très vite vers vous.</p>
                <p>Bonne journée,<br><em>L'équipe CEA Ingénierie</em></p>
            </div>
        `;
        successDiv.querySelector('strong').textContent = `Bonjour ${rawName},`;

        this.form.insertBefore(successDiv, this.form.firstChild);

        this.launchConfetti();

        // Remove success message after 5 seconds
        setTimeout(() => {
            successDiv.remove();
        }, 5000);
    }

    showErrorMessage(message = 'Une erreur est survenue. Veuillez réessayer.') {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        const icon = document.createElement('i');
        icon.className = 'fas fa-exclamation-circle';
        const text = document.createTextNode(' ' + message);
        errorDiv.appendChild(icon);
        errorDiv.appendChild(text);

        this.form.insertBefore(errorDiv, this.form.firstChild);

        // Remove error message after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    launchConfetti() {
        const colors = ['#ff914d', '#ff751f', '#7a2f00', '#00ff00', '#74b9ff'];
        let count = 0;
        const timer = setInterval(() => {
            this.createConfetti(colors);
            if (++count >= 100) clearInterval(timer);
        }, 30);
    }

    createConfetti(colors) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';

        // Position aléatoire en haut de l'écran
        const startX = Math.random() * window.innerWidth;
        const endX = startX + (Math.random() - 0.5) * 200;
        const rotation = Math.random() * 360;
        const color = colors[Math.floor(Math.random() * colors.length)];
        const size = Math.random() * 10 + 5;
        const duration = Math.random() * 2 + 2;

        confetti.style.left = startX + 'px';
        confetti.style.width = size + 'px';
        confetti.style.height = size + 'px';
        confetti.style.backgroundColor = color;
        confetti.style.setProperty('--end-x', endX + 'px');
        confetti.style.setProperty('--rotation', rotation + 'deg');
        confetti.style.setProperty('--duration', duration + 's');

        document.body.appendChild(confetti);

        // Retirer le confetti après l'animation
        setTimeout(() => {
            confetti.remove();
        }, duration * 1000);
    }
}

// Utility Functions
class Utils {
    static throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    static debounce(func, wait, immediate) {
        let timeout;
        return function() {
            const context = this, args = arguments;
            const later = function() {
                timeout = null;
                if (!immediate) func.apply(context, args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func.apply(context, args);
        };
    }

    static getRandomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    static getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

// Page Performance Management
class PerformanceManager {
    constructor() {
        this.init();
    }

    init() {
        this.optimizeImages();
        this.setupLazyLoading();
        this.handleImageErrors();
    }

    optimizeImages() {
        document.querySelectorAll('img').forEach(img => {
            if (!img.hasAttribute('loading')) {
                img.setAttribute('loading', 'lazy');
            }
        });
    }

    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const lazyElements = document.querySelectorAll('[data-src]');
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        img.src = img.dataset.src;
                        img.classList.remove('lazy');
                        imageObserver.unobserve(img);
                    }
                });
            });

            lazyElements.forEach(img => imageObserver.observe(img));
        }
    }

    handleImageErrors() {
        document.addEventListener('error', (e) => {
            if (e.target.tagName === 'IMG') {
                e.target.classList.add('img-error');
                console.warn(`Image non trouvée, affichage du placeholder : ${e.target.src}`);
            }
        }, true);
    }
}

// Gallery Management
class GalleryManager {
    constructor() {
        this.modal = document.getElementById('gallery-modal');
        if (!this.modal) return;

        this.modalImg = document.getElementById('gallery-image');
        this.closeBtn = this.modal.querySelector('.gallery-close');
        this.prevBtn = this.modal.querySelector('.gallery-prev');
        this.nextBtn = this.modal.querySelector('.gallery-next');
        this.counter = document.getElementById('gallery-counter');

        this.galleryImages = [];
        this.currentIndex = 0;

        this.init();
    }

    init() {
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.project-card[data-gallery], .ref-card[data-gallery], .reference-detail-card[data-gallery]');
            if (!card) return;

            // Évite d'ouvrir la galerie si on clique sur un lien ou bouton
            if (e.target.closest('a, button')) return;

            // Sur les cartes du carousel (swiper-slide): la galerie s'ouvre uniquement via la photo.
            if (card.classList.contains('swiper-slide')) {
                if (!e.target.closest('.ref-image')) return;
            }

            this.openCardGallery(card);
        });

        this.closeBtn.addEventListener('click', () => this.close());
        this.prevBtn.addEventListener('click', () => this.showPrev());
        this.nextBtn.addEventListener('click', () => this.showNext());

        // Navigation clavier
        document.addEventListener('keydown', (e) => {
            if (!this.modal.classList.contains('visible')) return;

            if (e.key === 'Escape') this.close();
            if (e.key === 'ArrowLeft') this.showPrev();
            if (e.key === 'ArrowRight') this.showNext();
        });

        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
    }

    parseGalleryData(rawValue) {
        if (!rawValue) return [];
        try {
            return JSON.parse(rawValue);
        } catch (firstError) {
            try {
                return JSON.parse(String(rawValue).replace(/'/g, '"'));
            } catch (secondError) {
                return [];
            }
        }
    }

    openCardGallery(card) {
        const galleryData = card.getAttribute('data-gallery');
        if (!galleryData) {
            console.warn('Aucune donnée de galerie trouvée pour cette carte');
            this.showError(card, 'Galerie non disponible');
            return;
        }

        this.galleryImages = this.parseGalleryData(galleryData);

        if (!Array.isArray(this.galleryImages) || this.galleryImages.length === 0) {
            this.showError(card, 'Aucune image disponible');
            return;
        }

        this.preloadImage(this.galleryImages[0])
            .then(() => this.open(0))
            .catch(err => {
                console.error('Erreur de chargement de l\'image:', err);
                this.showError(card, 'Image non disponible');
            });
    }

    open(index) {
        this.currentIndex = index;
        this.updateImage();
        this.modal.classList.add('visible');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.modal.classList.remove('visible');
        this.modal.classList.remove('gallery-modal--portrait');
        document.body.style.overflow = 'auto';
    }

    showPrev() {
        this.currentIndex = (this.currentIndex > 0) ? this.currentIndex - 1 : this.galleryImages.length - 1;
        this.updateImage();
    }

    showNext() {
        this.currentIndex = (this.currentIndex < this.galleryImages.length - 1) ? this.currentIndex + 1 : 0;
        this.updateImage();
    }

    updateImage() {
        const newSrc = this.galleryImages[this.currentIndex];

        // Afficher un loader pendant le chargement
        this.showLoader();

        this.preloadImage(newSrc)
            .then((loadedImage) => {
                const isPortrait = loadedImage.naturalHeight > loadedImage.naturalWidth * 1.05;
                this.modal.classList.toggle('gallery-modal--portrait', isPortrait);
                this.modalImg.src = newSrc;
                this.hideLoader();
                this.counter.textContent = `${this.currentIndex + 1} / ${this.galleryImages.length}`;
            })
            .catch(err => {
                console.error('Erreur de chargement de l\'image:', err);
                this.hideLoader();
                this.modal.classList.remove('gallery-modal--portrait');
                this.modalImg.alt = 'Image non disponible';
                this.counter.textContent = `Image ${this.currentIndex + 1} non disponible`;
            });
    }

    preloadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error(`Impossible de charger: ${src}`));
            img.src = src;
        });
    }

    showLoader() {
        if (!this.loader) {
            this.loader = document.createElement('div');
            this.loader.className = 'gallery-loader';
            this.loader.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
            this.modal.querySelector('.gallery-content').appendChild(this.loader);
        }
        this.loader.style.display = 'flex';
    }

    hideLoader() {
        if (this.loader) {
            this.loader.style.display = 'none';
        }
    }

    showError(card, message) {
        const errorEl = document.createElement('div');
        errorEl.className = 'gallery-error-toast';
        errorEl.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${message}`;
        card.appendChild(errorEl);

        setTimeout(() => {
            errorEl.classList.add('show');
        }, 10);

        setTimeout(() => {
            errorEl.classList.remove('show');
            setTimeout(() => errorEl.remove(), 300);
        }, 3000);
    }
}

function getExperienceYears(startYear = 2001) {
    const currentYear = new Date().getFullYear();
    const start = Number(startYear);
    if (!Number.isFinite(start)) return 0;
    return Math.max(0, currentYear - start);
}

function initializeExperienceYears() {
    const experienceTextElements = document.querySelectorAll('[data-experience-years-text]');
    experienceTextElements.forEach((element) => {
        const startYear = Number(element.getAttribute('data-start-year') || 2001);
        const years = getExperienceYears(startYear);
        element.textContent = `+${years} ans d'expertise`;
    });

    const counterElements = document.querySelectorAll('[data-experience-years-counter]');
    counterElements.forEach((element) => {
        const startYear = Number(element.getAttribute('data-start-year') || 2001);
        const years = getExperienceYears(startYear);
        element.setAttribute('data-target', String(years));
    });
}

// Positions des hotspots en % (x=gauche, y=haut) — à réajuster avec la vraie image
const HOTSPOT_POSITIONS = {
    aeroportuaire: { x: 78, y: 22 },
    hospitalier:   { x: 25, y: 35 },
    portuaire:     { x: 60, y: 65 },
    transports:    { x: 45, y: 50 },
    public:        { x: 30, y: 70 },
    hotellerie:    { x: 55, y: 30 },
    commerces:     { x: 20, y: 55 },
    bureaux:       { x: 70, y: 45 },
    parking:       { x: 40, y: 78 },
    datacenter:    { x: 85, y: 60 },
};

async function initDomainesHotspots() {
    const scene = document.getElementById('hotspot-scene');
    if (!scene) return;

    let refs, savedPositions;
    try {
        [refs, savedPositions] = await Promise.all([
            fetch('data/references.json').then((r) => r.json()),
            fetch('data/hotspots.json').then((r) => r.json()).catch(() => ({}))
        ]);
    } catch { return; }

    // Fusionner positions sauvegardées sur les défauts
    const positions = { ...HOTSPOT_POSITIONS, ...savedPositions };

    // references.json est un objet { categorie: [refs...] }
    const populated = new Set(
        Object.entries(refs)
            .filter(([, items]) => Array.isArray(items) && items.length > 0)
            .map(([cat]) => cat)
    );

    Object.entries(positions).forEach(([cat, pos]) => {
        if (!populated.has(cat)) return;

        const point = document.createElement('div');
        point.className = 'hotspot-point';
        point.style.left = `${pos.x}%`;
        point.style.top  = `${pos.y}%`;
        point.setAttribute('aria-label', categoryLabels[cat] ?? cat);
        point.innerHTML = `
            <div class="hotspot-dot"></div>
            <div class="hotspot-badge">${categoryLabels[cat] ?? cat}</div>
        `;
        point.addEventListener('click', () => {
            window.location.href = `references.html?category=${encodeURIComponent(cat)}`;
        });
        scene.appendChild(point);
    });
}

// Outil de repositionnement : tape hotspotEdit() dans la console pour activer
function hotspotEdit() {
    const scene = document.getElementById('hotspot-scene');
    if (!scene) { console.warn('hotspot-scene introuvable'); return; }

    const tip = document.createElement('div');
    tip.style.cssText = 'position:absolute;background:rgba(0,0,0,.8);color:#ff914d;font:bold 13px monospace;padding:4px 10px;border-radius:8px;pointer-events:none;z-index:999;white-space:nowrap;transform:translate(-50%,-130%)';
    scene.appendChild(tip);

    scene.style.cursor = 'crosshair';
    scene.addEventListener('mousemove', (e) => {
        const r = scene.getBoundingClientRect();
        const x = +((e.clientX - r.left) / r.width * 100).toFixed(1);
        const y = +((e.clientY - r.top)  / r.height * 100).toFixed(1);
        tip.style.left = `${x}%`;
        tip.style.top  = `${y}%`;
        tip.textContent = `x:${x} y:${y}`;
    });
    scene.addEventListener('click', (e) => {
        if (e.target.closest('.hotspot-point')) return;
        const r = scene.getBoundingClientRect();
        const x = +((e.clientX - r.left) / r.width * 100).toFixed(1);
        const y = +((e.clientY - r.top)  / r.height * 100).toFixed(1);
        console.log(`{ x: ${x}, y: ${y} }`);
    });
    console.log('Mode édition hotspot actif — survole pour voir les coords, clique pour les copier dans la console.');
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize all managers
    const themeManager = new ThemeManager();
    const navigationManager = new NavigationManager();
    const contactFormManager = new ContactFormManager();
    const performanceManager = new PerformanceManager();
    const galleryManager = new GalleryManager();

    // Load trust section (partners + metrics)
    loadTrustShowcase();

    // Load references from JSON and initialize Swiper carousels
    loadReferencesFromJSON();

    // Init hotspot image in #domaines section
    initDomainesHotspots();

    // Load team section
    loadTeam();

    // Load testimonials section
    loadTestimonials();

    // Auto-update experience years from base year (2001)
    initializeExperienceYears();

    // Initialize stats counter animation
    initializeStatsCounter();
    initNarrativeCounters();

    // Initialize "Notre entreprise" dropdown
    initNavDropdown();

    // Add additional interactive features
    initializeInteractiveFeatures();

    // Add scroll-to-top button
    addScrollToTopButton();

    // Cursor glow (dark mode)
    const glow = document.createElement('div');
    glow.id = 'cursor-glow';
    document.body.appendChild(glow);
    document.addEventListener('mousemove', (e) => {
        glow.style.left = `${e.clientX}px`;
        glow.style.top  = `${e.clientY}px`;
    });

    if (window.AOS) AOS.init({ duration: 700, easing: 'ease-out-cubic', once: true, offset: 60 });

    fetch('data/version.json').then(r => r.json()).then(d => {
        console.log(`🚀 CEA Ingénierie website loaded successfully! — v${d.version}`);
    }).catch(() => {
        console.log('🚀 CEA Ingénierie website loaded successfully!');
    });
});

// Logo Nebula Collision System
class NebulaCollisionManager {
    constructor() {
        this.logos = [];
        this.animationId = null;
        this.isActive = false;
        this.collisionDistance = 250; // Distance de détection (augmentée pour éviter les chevauchements)
        this.minDistance = 180; // Distance minimale absolue entre logos
        this.repulsionForce = 0.5; // Force de répulsion (fortement augmentée)
        this.damping = 0.88; // Amortissement (friction)
        this.init();
    }

    init() {
        const logoOrbs = document.querySelectorAll('.logo-orb');
        if (logoOrbs.length === 0) return;

        // Initialiser les données pour chaque logo
        logoOrbs.forEach((orb, index) => {
            this.logos.push({
                element: orb,
                index: index,
                velocity: { x: 0, y: 0 },
                offset: { x: 0, y: 0 }, // Déplacement par rapport à la position orbitale
                mass: 1,
                colliding: false,
                baseTransform: '' // Pour stocker la transformation d'orbite
            });
        });

        // Observer la section pour activer/désactiver les collisions
        this.setupIntersectionObserver();
    }

    setupIntersectionObserver() {
        const nebulaSection = document.querySelector('.logo-nebula');
        if (!nebulaSection) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    this.start();
                } else {
                    this.stop();
                }
            });
        }, { threshold: 0.1 });

        observer.observe(nebulaSection);
    }

    start() {
        if (this.isActive) return;
        this.isActive = true;
        this.animate();
    }

    stop() {
        this.isActive = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }

        // Réinitialiser tous les logos
        this.logos.forEach(logo => {
            logo.offset = { x: 0, y: 0 };
            logo.velocity = { x: 0, y: 0 };
            logo.element.style.filter = '';
            logo.element.style.transform = '';
        });
    }

    getLogoPosition(logo) {
        const rect = logo.element.getBoundingClientRect();
        return {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2
        };
    }

    calculateDistance(pos1, pos2) {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    handleCollision(logo1, logo2, distance) {
        const pos1 = this.getLogoPosition(logo1);
        const pos2 = this.getLogoPosition(logo2);

        // Calculer la direction de la répulsion
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const angle = Math.atan2(dy, dx);

        // Calculer la force de répulsion (inversement proportionnelle à la distance)
        let force = (this.collisionDistance - distance) / this.collisionDistance;

        // Si très proche (chevauchement imminent), force extrême
        if (distance < this.minDistance) {
            force = force * 2.5; // Triple la force si trop proche
        }

        const repulsion = force * this.repulsionForce;

        // Appliquer la force de répulsion aux vélocités
        logo1.velocity.x -= Math.cos(angle) * repulsion;
        logo1.velocity.y -= Math.sin(angle) * repulsion;
        logo2.velocity.x += Math.cos(angle) * repulsion;
        logo2.velocity.y += Math.sin(angle) * repulsion;

        // Effet visuel minimal (seulement pour les collisions très proches)
        const visualIntensity = Math.min(force * 2, 1);
        const showGlow = distance < this.collisionDistance * 0.6; // Glow visible seulement si très proche

        if (showGlow) {
            const glowSize = 8 * visualIntensity;
            const glowOpacity = 0.3 * visualIntensity;

            logo1.element.style.filter = `brightness(${1 + visualIntensity * 0.15}) drop-shadow(0 0 ${glowSize}px rgba(255, 117, 31, ${glowOpacity}))`;
            logo2.element.style.filter = `brightness(${1 + visualIntensity * 0.15}) drop-shadow(0 0 ${glowSize}px rgba(255, 117, 31, ${glowOpacity}))`;
        }

        // Marquer comme en collision
        logo1.colliding = true;
        logo2.colliding = true;
    }

    applyPhysics(logo) {
        // Appliquer la vélocité au déplacement
        logo.offset.x += logo.velocity.x;
        logo.offset.y += logo.velocity.y;

        // Appliquer l'amortissement (friction)
        logo.velocity.x *= this.damping;
        logo.velocity.y *= this.damping;

        // Ramener progressivement vers la position d'orbite (plus lent)
        const returnForce = 0.03;
        logo.offset.x *= (1 - returnForce);
        logo.offset.y *= (1 - returnForce);

        // Limiter le déplacement maximum pour éviter qu'ils sortent trop de l'orbite
        const maxOffset = 120;
        const offsetMagnitude = Math.sqrt(logo.offset.x ** 2 + logo.offset.y ** 2);
        if (offsetMagnitude > maxOffset) {
            const scale = maxOffset / offsetMagnitude;
            logo.offset.x *= scale;
            logo.offset.y *= scale;
        }

        // Arrêter le mouvement si trop faible
        if (Math.abs(logo.velocity.x) < 0.001) logo.velocity.x = 0;
        if (Math.abs(logo.velocity.y) < 0.001) logo.velocity.y = 0;
        if (Math.abs(logo.offset.x) < 0.1) logo.offset.x = 0;
        if (Math.abs(logo.offset.y) < 0.1) logo.offset.y = 0;

        // Appliquer le déplacement visuel sans scale
        logo.element.style.transform = `translate(${logo.offset.x}px, ${logo.offset.y}px)`;
    }

    resetLogo(logo) {
        if (!logo.colliding) return;

        // Réinitialiser les effets visuels progressivement
        const hasMovement = Math.abs(logo.offset.x) > 0.1 || Math.abs(logo.offset.y) > 0.1;

        if (!hasMovement) {
            logo.element.style.filter = '';
        }

        logo.colliding = false;
    }

    animate() {
        if (!this.isActive) return;

        // Réinitialiser tous les états de collision
        this.logos.forEach(logo => {
            logo.colliding = false;
        });

        // Vérifier les collisions entre tous les logos
        for (let i = 0; i < this.logos.length; i++) {
            for (let j = i + 1; j < this.logos.length; j++) {
                const logo1 = this.logos[i];
                const logo2 = this.logos[j];

                const pos1 = this.getLogoPosition(logo1);
                const pos2 = this.getLogoPosition(logo2);
                const distance = this.calculateDistance(pos1, pos2);

                if (distance < this.collisionDistance) {
                    this.handleCollision(logo1, logo2, distance);
                }
            }
        }

        // Appliquer la physique et réinitialiser les logos non en collision
        this.logos.forEach(logo => {
            this.applyPhysics(logo);
            if (!logo.colliding) {
                this.resetLogo(logo);
            }
        });

        this.animationId = requestAnimationFrame(() => this.animate());
    }
}

// Category icons mapping
const categoryIcons = {
    aeroportuaire: 'fa-plane-departure',
    portuaire: 'fa-anchor',
    transports: 'fa-bus',
    hospitalier: 'fa-hospital',
    datacenter: 'fa-server',
    public: 'fa-landmark',
    parking: 'fa-parking',
    hotellerie: 'fa-hotel',
    commerces: 'fa-store',
    bureaux: 'fa-briefcase'
};

const categoryLabels = {
    aeroportuaire: 'Aéroportuaire',
    portuaire: 'Portuaire',
    transports: 'Transports',
    hospitalier: 'Hospitalier',
    datacenter: 'Data Center',
    public: 'Établissement Public',
    parking: 'Parking',
    hotellerie: 'Hôtellerie',
    commerces: 'Commerces',
    bureaux: 'Bureaux'
};

const categoryTieBreakOrder = [
    'aeroportuaire',
    'hospitalier',
    'portuaire',
    'transports',
    'public',
    'hotellerie',
    'commerces',
    'bureaux',
    'parking',
    'datacenter'
];

const categoryAliases = {
    aeroport: 'aeroportuaire',
    port: 'portuaire'
};

function getCategoryOrderRank(category) {
    const index = categoryTieBreakOrder.indexOf(category);
    return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

let referencesMap = null;
let referencesMapLayer = null;
let referencesMapTile = null;

const MAP_TILES = {
    light: { url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',             attribution: '&copy; OpenStreetMap' },
    dark:  { url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',  attribution: '&copy; OpenStreetMap &copy; CARTO' }
};

function getMapTileConfig() {
    return document.documentElement.getAttribute('data-theme') === 'dark' ? MAP_TILES.dark : MAP_TILES.light;
}

function applyMapTile(map, tileRef) {
    if (!map) return null;
    if (tileRef) map.removeLayer(tileRef);
    const { url, attribution } = getMapTileConfig();
    return L.tileLayer(url, { maxZoom: 19, attribution }).addTo(map);
}
const referencesOrangeMarkerIcon = L.divIcon({
    className: 'cea-map-marker',
    html: '<i class="fas fa-map-marker-alt" aria-hidden="true"></i>',
    iconSize: [24, 30],
    iconAnchor: [12, 30],
    popupAnchor: [0, -28]
});

function getReferenceImages(ref) {
    if (Array.isArray(ref.images) && ref.images.length) {
        return ref.images.filter(Boolean);
    }
    if (ref.imageUrl) {
        return [ref.imageUrl];
    }
    return [];
}

function formatCount(value, suffix = '') {
    const number = Number(value);
    if (!Number.isFinite(number) || number < 0) return `0${suffix}`;
    return `${Math.round(number)}${suffix}`;
}

function computeExperienceYears() {
    const foundingYear = 2004;
    const currentYear = new Date().getFullYear();
    return Math.max(1, currentYear - foundingYear);
}

function updateTrustMetrics({ partnersCount = null, sectorsCount = null } = {}) {
    const clientsEl = document.getElementById('trustMetricClients');
    const sectorsEl = document.getElementById('trustMetricSectors');
    const yearsEl = document.getElementById('trustMetricYears');

    if (clientsEl && Number.isFinite(partnersCount)) {
        clientsEl.textContent = formatCount(partnersCount, '+');
    }

    if (sectorsEl && Number.isFinite(sectorsCount)) {
        sectorsEl.textContent = formatCount(sectorsCount);
    }

    if (yearsEl) {
        yearsEl.textContent = formatCount(computeExperienceYears(), '+');
    }
}

function renderCertifiedPartners(partners, partnerIdsWithProjects = new Set()) {
    const block = document.getElementById('certifiedPartnersBlock');
    const grid = document.getElementById('certifiedPartnersGrid');
    if (!block || !grid) return;

    const certified = partners
        .filter((p) => p.certified && p.name && p.logo)
        .sort((a, b) => b.weight - a.weight || a.name.localeCompare(b.name, 'fr'));

    if (!certified.length) return;

    block.style.display = 'block';
    grid.innerHTML = certified.map((p) => {
        const logoSrc = escapeHtml(p.logo);
        const name = escapeHtml(p.name);
        const desc = p.certifiedDescription ? `<p class="certified-partner-desc">${escapeHtml(p.certifiedDescription)}</p>` : '';
        const hasProjects = partnerIdsWithProjects.has(String(p.id));
        const href = `partner.html?partner=${encodeURIComponent(p.slug || p.name)}`;
        const inner = `
            <span class="ac-badge-tooltip-wrap" data-tooltip="Accord cadre"><div class="certified-badge ac-iridescent-badge" aria-label="Partenaire certifié"><span class="ac-iridescent-badge__core">AC</span></div></span>
            <div class="certified-partner-logo">
                <img src="${logoSrc}" alt="${name}" loading="lazy">
            </div>
            <p class="certified-partner-name">${name}</p>
            ${desc}`;
        return hasProjects
            ? `<a class="certified-partner-card" href="${href}">${inner}</a>`
            : `<div class="certified-partner-card">${inner}</div>`;
    }).join('');
}

function createTrustLogoCard(partner, ariaHidden = false) {
    const hiddenAttr = ariaHidden ? ' aria-hidden="true" tabindex="-1"' : '';
    const tooltipAttr = ariaHidden ? '' : ` data-tooltip="${escapeHtml(partner.name)}"`;
    const logoImg = `<img src="${escapeHtml(partner.logo)}" alt="${ariaHidden ? '' : escapeHtml(partner.name)}" loading="lazy" width="120" height="60">`;

    if (partner.hasProjects && partner.slug) {
        const href = `partner.html?partner=${encodeURIComponent(partner.slug)}`;
        return `<a class="trust-logo-card" href="${href}"${hiddenAttr}${tooltipAttr}>${logoImg}</a>`;
    }

    return `<span class="trust-logo-card trust-logo-card--disabled"${ariaHidden ? ' aria-hidden="true"' : ''}${tooltipAttr}>${logoImg}</span>`;
}

function renderTrustLogos(partners, partnerIdsWithProjects = new Set()) {
    const trackFwd = document.getElementById('trustTrackFwd');
    const trackRev = document.getElementById('trustTrackRev');
    const trackMid = document.getElementById('trustTrackMid');
    if (!trackFwd || !Array.isArray(partners) || !partners.length) return;

    const validPartners = partners
        .map((partner) => ({
            id: String(partner?.id || '').trim(),
            name: String(partner?.name || '').trim(),
            logo: String(partner?.logo || '').trim(),
            slug: String(partner?.slug || '').trim() || String(partner?.name || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'),
            weight: Number.isFinite(Number(partner?.weight)) ? Number(partner.weight) : 5,
            hasProjects: partnerIdsWithProjects.has(String(partner?.id || '').trim())
        }))
        .filter((partner) => partner.name && partner.logo);

    if (!validPartners.length) return;

    const sorted = validPartners.sort((a, b) => b.weight - a.weight || a.name.localeCompare(b.name, 'fr'));
    const rowA = sorted.filter((p) => p.weight >= 7 && p.weight <= 10);
    const rowB = sorted.filter((p) => p.weight >= 4 && p.weight <= 6);
    const rowC = sorted.filter((p) => p.weight >= 1 && p.weight <= 3);

    const rows = [rowA, rowB, rowC];
    [trackFwd, trackRev, trackMid].forEach((track, i) => {
        const base = rows[i].length ? rows[i] : sorted;
        const loop = [...base, ...base];
        track.innerHTML = loop.map((partner, index) => createTrustLogoCard(partner, index >= base.length)).join('');
    });

    initTrustTooltip();
}

function initTrustTooltip() {
    if (document.getElementById('trust-tooltip')) return;

    const tooltip = document.createElement('div');
    tooltip.id = 'trust-tooltip';
    tooltip.className = 'trust-tooltip';
    document.body.appendChild(tooltip);

    const marquee = document.querySelector('.trust-marquee');
    if (!marquee) return;

    marquee.addEventListener('mouseover', (e) => {
        const card = e.target.closest('.trust-logo-card[data-tooltip]');
        if (!card) return;
        tooltip.textContent = card.dataset.tooltip;
        const rect = card.getBoundingClientRect();
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        tooltip.style.left = (rect.left + rect.width / 2) + 'px';
        tooltip.style.top = (rect.top + scrollY) + 'px';
        tooltip.classList.add('trust-tooltip--visible');
    });

    marquee.addEventListener('mouseout', (e) => {
        const card = e.target.closest('.trust-logo-card[data-tooltip]');
        if (!card) return;
        if (e.relatedTarget && card.contains(e.relatedTarget)) return;
        tooltip.classList.remove('trust-tooltip--visible');
    });
}

async function loadTestimonials() {
    try {
        const res = await fetch('data/testimonials.json');
        if (!res.ok) return;
        const all = await res.json();
        const data = Array.isArray(all) ? all.filter(t => t.status === 'published') : [];
        if (!data.length) return;
        const section = document.getElementById('temoignages');
        const grid = document.getElementById('temoignagesGrid');
        if (!section || !grid) return;
        grid.innerHTML = data.map((t, i) => `
            <div class="temoignage-card" style="--card-index:${i % 4}">
                <div class="temoignage-quote-icon"><i class="fas fa-quote-left"></i></div>
                <p class="temoignage-text">${escapeHtml(t.text)}</p>
                <div class="temoignage-footer">
                    ${t.role ? `<span class="temoignage-role">${escapeHtml(t.role)}</span>` : ''}
                    ${t.sector ? `<span class="temoignage-sector">${escapeHtml(t.sector)}</span>` : ''}
                </div>
            </div>
        `).join('');
        section.style.display = 'block';
    } catch {}
}

async function loadTeam() {
    try {
        const res = await fetch('data/team.json');
        if (!res.ok) return;
        const data = await res.json();
        const subtitle = document.getElementById('team-subtitle');
        const grid = document.getElementById('team-grid');
        if (subtitle && data.subtitle) subtitle.textContent = data.subtitle;
        if (grid && Array.isArray(data.members)) {
            grid.innerHTML = data.members.map((m, i) => {
                const fullName = `${m.firstName || ''} ${m.lastName || ''}`.trim();
                const photoHtml = m.photo
                    ? `
                        <img
                            class="member-photo-img"
                            src="${m.photo}"
                            alt="${escapeHtml(fullName)}"
                            loading="lazy"
                            decoding="async"
                        >
                        <div class="photo-placeholder" role="img" aria-label="Icône utilisateur ${escapeHtml(fullName)}"><i class="fas fa-user"></i></div>
                    `
                    : `<div class="photo-placeholder" role="img" aria-label="Icône utilisateur ${escapeHtml(fullName)}"><i class="fas fa-user"></i></div>`;
                return `
                <div class="team-member" data-team-index="${i}">
                    <div class="member-photo-shell team-anim-photo">
                        <div class="member-shape team-anim-shape" aria-hidden="true"></div>
                        <div class="member-photo">${photoHtml}</div>
                        <div class="member-text-overlay team-anim-name">
                            <div class="member-name-overlay">
                                <span class="member-firstname">${escapeHtml(m.firstName || '')}</span>
                                <span class="member-lastname">${escapeHtml(m.lastName || '')}</span>
                            </div>
                            <p class="member-role team-anim-role">${escapeHtml(m.role || '')}</p>
                            ${m.description ? `<p class="member-description-overlay">${escapeHtml(m.description)}</p>` : ''}
                        </div>
                    </div>
                </div>`;
            }).join('');
            initTeamCascadeAnimations();
        }
    } catch {}
}

function initTeamCascadeAnimations() {
    const cards = Array.from(document.querySelectorAll('.team-member'));
    if (!cards.length) return;

    const runCascade = (card) => {
        if (card.dataset.animated === 'true') return;
        card.dataset.animated = 'true';

        const baseDelay = Number(card.dataset.teamIndex || 0) * 170;
        const photo = card.querySelector('.team-anim-photo');
        const shape = card.querySelector('.team-anim-shape');
        const name = card.querySelector('.team-anim-name');
        const role = card.querySelector('.team-anim-role');

        const queue = [
            { el: photo, delay: baseDelay + 0, anim: 'animate__fadeInUp' },
            { el: shape, delay: baseDelay + 170, anim: 'animate__fadeIn' },
            { el: name, delay: baseDelay + 560, anim: 'animate__fadeInUp' },
            { el: role, delay: baseDelay + 980, anim: 'animate__fadeInUp' }
        ];

        queue.forEach(({ el, delay, anim }) => {
            if (!el) return;
            window.setTimeout(() => {
                el.classList.add('animate__animated', anim);
                el.classList.add('is-visible');
            }, delay);
        });
    };

    if (!('IntersectionObserver' in window)) {
        cards.forEach(runCascade);
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            runCascade(entry.target);
            observer.unobserve(entry.target);
        });
    }, { threshold: 0.28 });

    cards.forEach((card) => observer.observe(card));
}

async function loadTrustShowcase() {
    try {
        const [partnersResponse, referencesResponse] = await Promise.all([
            fetch('data/partners.json'),
            fetch('data/references.json')
        ]);

        let partners = [];
        let sectorsCount = null;
        const partnerIdsWithProjects = new Set();

        if (referencesResponse.ok) {
            const referencesPayload = await referencesResponse.json();
            if (referencesPayload && typeof referencesPayload === 'object') {
                sectorsCount = Object.keys(referencesPayload).length;
                Object.keys(referencesPayload).forEach((category) => {
                    const refs = Array.isArray(referencesPayload[category]) ? referencesPayload[category] : [];
                    refs.forEach((reference) => {
                        const partnerId = String(reference?.partnerId || '').trim();
                        if (partnerId) partnerIdsWithProjects.add(partnerId);
                    });
                });
            }
        }

        if (partnersResponse.ok) {
            const payload = await partnersResponse.json();
            partners = Array.isArray(payload) ? payload : [];
            renderCertifiedPartners(partners, partnerIdsWithProjects);
            renderTrustLogos(partners, partnerIdsWithProjects);
        }

        updateTrustMetrics({
            partnersCount: partners.length,
            sectorsCount
        });
    } catch (error) {
        console.warn('Trust showcase: chargement dynamique indisponible, fallback statique.', error);
        updateTrustMetrics();
    }
}

function toCoordinate(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function isValidCoordinatePair(latitude, longitude) {
    if (latitude === null || longitude === null) return false;
    if (latitude < -90 || latitude > 90) return false;
    if (longitude < -180 || longitude > 180) return false;

    // Ignore le point nul (0,0), souvent signe d'un geocodage invalide.
    if (Math.abs(latitude) < 0.000001 && Math.abs(longitude) < 0.000001) return false;

    return true;
}

function splitTransportCategory(reference) {
    const title = String(reference?.title || '').toLowerCase();
    const address = String(reference?.address || '').toLowerCase();
    const merged = `${title} ${address}`;
    if (/a[eé]roport|airport/.test(merged)) return 'aeroportuaire';
    if (/\bport\b|dock|harbor/.test(merged)) return 'portuaire';
    return 'transports';
}

function slugifySiteKey(value) {
    return String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'site';
}

function normalizeRefCategory(reference, rawCategory) {
    const category = String(reference?.category || rawCategory || '').trim();
    const normalized = categoryAliases[category] || category;
    if (normalized === 'transports') return splitTransportCategory(reference);
    return normalized;
}

function formatBudgetShort(amount) {
    const n = Number(amount);
    if (!Number.isFinite(n) || n < 0) return '';
    if (n >= 1000000) return `${(n / 1000000).toFixed(n % 1000000 === 0 ? 0 : 1)} M€`;
    if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)} k€`;
    return `${new Intl.NumberFormat('fr-FR').format(n)} €`;
}

function getReferenceWeight(reference) {
    const value = Number(reference?.weight);
    return Number.isFinite(value) ? value : 0;
}

function getPartnerWeight(partner) {
    const value = Number(partner?.weight);
    return Number.isFinite(value) ? value : 0;
}

function computeGlobalScore(reference, partnerById) {
    const partner = reference?.partnerId ? partnerById.get(String(reference.partnerId)) : null;
    return getReferenceWeight(reference) + getPartnerWeight(partner);
}

function isDeliveredReference(reference) {
    return getProjectStatus(reference?.endDate).key === 'delivered';
}

function sortByGlobalScoreDesc(a, b) {
    if (a.globalScore !== b.globalScore) return b.globalScore - a.globalScore;
    return new Date(b.date || 0) - new Date(a.date || 0);
}

function applyTopFiveDeliveredCapByCategory(itemsByCategory, maxTop = 5, maxDelivered = 2) {
    const output = new Map();

    itemsByCategory.forEach((items, category) => {
        const sorted = [...items].sort(sortByGlobalScoreDesc);
        const top = [];
        let deliveredInTop = 0;

        for (const ref of sorted) {
            if (top.length >= maxTop) break;
            const delivered = isDeliveredReference(ref);
            if (delivered && deliveredInTop >= maxDelivered) continue;
            top.push(ref);
            if (delivered) deliveredInTop += 1;
        }

        const topRefs = new Set(top);
        const rest = sorted.filter((ref) => !topRefs.has(ref));
        output.set(category, [...top, ...rest]);
    });

    return output;
}

// Load references from JSON and render project cards by category
async function loadReferencesFromJSON() {
    try {
        const [referencesResponse, sitesResponse, partnersResponse] = await Promise.all([
            fetch('data/references.json'),
            fetch('data/sites.json'),
            fetch('data/partners.json')
        ]);
        const data = await referencesResponse.json();
        const sites = sitesResponse.ok ? await sitesResponse.json() : [];
        const partners = partnersResponse.ok ? await partnersResponse.json() : [];
        const partnerById = new Map((Array.isArray(partners) ? partners : []).map((p) => [String(p.id), p]));
        const categoriesContainer = document.querySelector('.references-categories');
        const mapReferences = [];

        const normalizedRefs = [];
        Object.keys(data || {}).forEach((rawCategory) => {
            (Array.isArray(data[rawCategory]) ? data[rawCategory] : []).forEach((reference) => {
                const category = normalizeRefCategory(reference, rawCategory);
                if (!category) return;
                normalizedRefs.push({
                    ...reference,
                    category,
                    weight: Number.isFinite(Number(reference?.weight)) ? Number(reference.weight) : 5,
                    globalScore: 0
                });
            });
        });

        const siteById = new Map((Array.isArray(sites) ? sites : []).map((site) => [String(site.id), site]));
        normalizedRefs.forEach((reference) => {
            reference.globalScore = computeGlobalScore(reference, partnerById);
        });

        const sortedRefs = normalizedRefs.sort((a, b) => {
            const rankA = getCategoryOrderRank(a.category);
            const rankB = getCategoryOrderRank(b.category);
            if (rankA !== rankB) return rankA - rankB;
            return sortByGlobalScoreDesc(a, b);
        });

        const mapGrouped = new Map();
        sortedRefs.forEach((reference) => {
            const key = reference.siteId ? `site:${reference.siteId}` : `title:${String(reference.title || '').trim().toLowerCase()}`;
            if (!mapGrouped.has(key)) mapGrouped.set(key, []);
            mapGrouped.get(key).push(reference);
        });

        Array.from(mapGrouped.values()).forEach((items) => {
            const sample = items[0];
            const site = sample.siteId ? siteById.get(String(sample.siteId)) : null;
            const images = items.flatMap((it) => getReferenceImages(it)).filter(Boolean).slice(0, 8);
            mapReferences.push({
                title: site?.name || sample.title,
                description: sample.description || '',
                latitude: toCoordinate(site?.latitude ?? sample.latitude),
                longitude: toCoordinate(site?.longitude ?? sample.longitude),
                address: site?.address || sample.address || '',
                geocodedAddress: site?.address || sample.address || '',
                images,
                siteId: sample.siteId || null,
                id: sample.id || null,
                projectCount: items.length
            });
        });

        if (categoriesContainer) {
            const byCategory = new Map();
            sortedRefs.forEach((reference) => {
                if (!byCategory.has(reference.category)) byCategory.set(reference.category, []);
                byCategory.get(reference.category).push(reference);
            });
            const rankedByCategory = applyTopFiveDeliveredCapByCategory(byCategory, 5, 2);

            const orderedKnownCategories = categoryTieBreakOrder
                .filter((category) => rankedByCategory.has(category) && rankedByCategory.get(category).length > 0);
            const orderedExtraCategories = [...rankedByCategory.keys()]
                .filter((category) => !orderedKnownCategories.includes(category) && (rankedByCategory.get(category) || []).length > 0);
            const orderedCategories = [...orderedKnownCategories, ...orderedExtraCategories];

            categoriesContainer.innerHTML = orderedCategories.map((category) => {
                const items = rankedByCategory.get(category) || [];
                return `
                <div class="ref-category" id="ref-${category}">
                    <h3><i class="fas ${categoryIcons[category] || 'fa-folder-open'}"></i> ${escapeHtml(categoryLabels[category] || category)}</h3>
                    <div class="ref-carousel swiper" data-carousel>
                        <div class="ref-track swiper-wrapper">
                            ${items.map((reference) => {
                                const partner = reference.partnerId ? partnerById.get(String(reference.partnerId)) : null;
                                const site = reference.siteId ? siteById.get(String(reference.siteId)) : null;
                                return RefCard.buildHTML(reference, partner, site, { extraClass: 'swiper-slide' });
                            }).join('')}
                        </div>
                    </div>
                </div>`;
            }).join('');

            // Clic sur la partie blanche => page projet dédiée.
            categoriesContainer.querySelectorAll('.ref-content[data-project-url]').forEach((panel) => {
                panel.addEventListener('click', (event) => {
                    if (event.target.closest('a, button')) return;
                    const url = panel.getAttribute('data-project-url');
                    if (url) window.location.href = url;
                });
            });

            initCarousels();
        }

        await initReferencesMap(mapReferences);
    } catch (error) {
        console.error('Erreur lors du chargement des références:', error);
        updateMapHint('Carte indisponible: impossible de charger les references.');
    }
}

function getProjectStatus(endDate) {
    const raw = String(endDate || '').trim();
    if (!raw) return { key: 'ongoing', label: 'En cours' };

    const end = new Date(raw);
    if (Number.isNaN(end.getTime())) return { key: 'ongoing', label: 'En cours' };

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    if (end <= today) {
        return { key: 'delivered', label: 'Livré' };
    }
    return { key: 'ongoing', label: 'En cours' };
}

function formatProjectPeriod(startDate, endDate) {
    const start = String(startDate || '').trim();
    const end = String(endDate || '').trim();
    if (!start && !end) return '';

    const formatSafe = (value) => {
        try {
            return new Date(value).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        } catch (error) {
            return value;
        }
    };

    if (start && end) return `${formatSafe(start)} → ${formatSafe(end)}`;
    return `Début: ${formatSafe(start)}`;
}

function formatProjectDate(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;
    return d.toLocaleDateString('fr-FR', {
        month: 'long',
        year: 'numeric'
    });
}
// Escape HTML function
function budgetShort(amount) {
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) return '';
    if (n >= 1e6) return `${(n / 1e6).toFixed(n % 1e6 ? 1 : 0)} M€`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(n % 1e3 ? 1 : 0)} k€`;
    return `${new Intl.NumberFormat('fr-FR').format(n)} €`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function updateMapHint(message) {
    const hint = document.getElementById('references-map-hint');
    if (hint) {
        hint.textContent = message;
    }
}

function extractReferenceCity(reference) {
    const sanitizeCity = (value) => String(value || '')
        .replace(/\b\d{5}\b/g, '')
        .replace(/\b(france)\b/ig, '')
        .replace(/\s+/g, ' ')
        .trim();

    const addressCandidates = [
        reference?.geocodedAddress,
        reference?.address
    ].filter((value) => typeof value === 'string' && value.trim().length > 0);

    for (const candidate of addressCandidates) {
        const parts = candidate.split(',').map((part) => part.trim()).filter(Boolean);
        if (!parts.length) continue;

        const postalPart = parts.find((part) => /\b\d{5}\b/.test(part));
        if (postalPart) {
            const cityFromPostal = sanitizeCity(postalPart);
            if (cityFromPostal) return cityFromPostal;
        }

        if (parts.length >= 2) {
            const last = parts[parts.length - 1];
            const beforeLast = parts[parts.length - 2];
            if (/^france$/i.test(last) && beforeLast) return sanitizeCity(beforeLast);
            return sanitizeCity(last);
        }

        return sanitizeCity(parts[0]);
    }

    return '';
}

function buildPopupHtml(reference) {
    const images = getReferenceImages(reference).slice(0, 6);
    const city = extractReferenceCity(reference);
    const galleryHtml = images.length
        ? `<div class="map-popup-gallery">${images.map((imagePath, index) => `<img src="${imagePath}" alt="${escapeHtml(reference.title || `Photo ${index + 1}`)}" loading="lazy">`).join('')}</div>`
        : '<p>Aucune photo disponible.</p>';

    return `
        <div class="map-popup">
            <h4>${escapeHtml(reference.title || 'Reference')}</h4>
            <p>${escapeHtml(reference.description || '')}</p>
            ${city ? `<p><i class="fas fa-map-marker-alt"></i> ${escapeHtml(city)}</p>` : ''}
            ${galleryHtml}
        </div>
    `;
}

function createReferenceMarker(reference) {
    const latitude = toCoordinate(reference.latitude);
    const longitude = toCoordinate(reference.longitude);
    if (!isValidCoordinatePair(latitude, longitude)) {
        return null;
    }

    const marker = L.marker([latitude, longitude], {
        title: reference.title || 'Reference',
        icon: referencesOrangeMarkerIcon
    });

    const popup = L.popup({
        maxWidth: 320,
        closeButton: false,
        closeOnClick: false,
        autoClose: true,
        offset: [0, -10]
    }).setContent(buildPopupHtml(reference));

    let closeTimer = null;
    const scheduleClose = (map) => { closeTimer = setTimeout(() => map.closePopup(popup), 120); };
    const cancelClose  = () => clearTimeout(closeTimer);

    marker.on('mouseover', () => {
        if (!referencesMap) return;
        cancelClose();
        popup.setLatLng(marker.getLatLng());
        popup.openOn(referencesMap);
    });

    marker.on('mouseout', () => {
        if (!referencesMap) return;
        scheduleClose(referencesMap);
    });

    popup.on('add', () => {
        const el = popup.getElement();
        if (!el) return;
        el.addEventListener('mouseenter', cancelClose);
        el.addEventListener('mouseleave', () => scheduleClose(referencesMap));
    });

    marker.on('click', () => {
        if (reference.siteId && reference.projectCount > 1) {
            window.location.href = `site.html?site=${reference.siteId}`;
        } else if (reference.id) {
            window.location.href = `project.html?project=${reference.id}`;
        }
    });

    return marker;
}

async function initReferencesMap(references) {
    const mapContainer = document.getElementById('references-map');
    if (!mapContainer || !window.L) return;

    const mapReferences = (references || []).filter((reference) => {
        if (!reference || typeof reference !== 'object') return false;
        if (!String(reference.title || '').trim()) return false;
        const latitude = toCoordinate(reference.latitude);
        const longitude = toCoordinate(reference.longitude);
        return isValidCoordinatePair(latitude, longitude);
    });

    if (!referencesMap) {
        referencesMap = L.map(mapContainer, {
            scrollWheelZoom: true
        });

        referencesMapTile = applyMapTile(referencesMap, null);

        // Observer thème → swap tiles carte principale
        new MutationObserver(() => {
            referencesMapTile = applyMapTile(referencesMap, referencesMapTile);
        }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        // Marker siège CEA Ingénierie
        const ceaIcon = L.divIcon({
            className: '',
            html: `<div class="cea-office-marker"><div class="cea-office-marker__pin"><img src="ico/favicon.ico" alt="CEA Ingénierie"></div></div>`,
            iconSize: [52, 62],
            iconAnchor: [26, 62],
            popupAnchor: [0, -64]
        });
        L.marker([43.6888260, 7.2301827], { icon: ceaIcon, zIndexOffset: 1000 })
            .bindPopup('<strong>CEA Ingénierie</strong><br>44 Boulevard Napoléon III<br>06200 Nice')
            .addTo(referencesMap);

        initMapEasterEggs(referencesMap);
    }

    if (referencesMapLayer) {
        referencesMap.removeLayer(referencesMapLayer);
    }
    referencesMapLayer = L.layerGroup().addTo(referencesMap);

    if (!mapReferences.length) {
        referencesMap.setView([43.7102, 7.262], 9);
        updateMapHint('Ajoutez une adresse dans l\'admin pour afficher les references sur la carte.');
        return;
    }

    // Bornes de la France métropolitaine (+ Corse)
    const METRO_BOUNDS = { latMin: 41.2, latMax: 51.2, lonMin: -5.5, lonMax: 10.0 };
    const isMetro = ({ lat, lng }) =>
        lat >= METRO_BOUNDS.latMin && lat <= METRO_BOUNDS.latMax &&
        lng >= METRO_BOUNDS.lonMin && lng <= METRO_BOUNDS.lonMax;

    const metroBounds = L.latLngBounds([]);
    const overseaRefs = [];

    mapReferences.forEach((reference) => {
        const marker = createReferenceMarker(reference);
        if (!marker) return;
        marker.addTo(referencesMapLayer);
        const ll = marker.getLatLng();
        if (isMetro(ll)) metroBounds.extend(ll);
        else overseaRefs.push(reference);
    });

    const defaultBounds = metroBounds.isValid() ? metroBounds
        : overseaRefs.length ? L.latLngBounds(overseaRefs.map((r) => [toCoordinate(r.latitude), toCoordinate(r.longitude)]))
        : null;

    const resetMainMap = () => {
        if (defaultBounds) referencesMap.fitBounds(defaultBounds, { padding: [40, 40], maxZoom: 14 });
        else referencesMap.setView([43.7102, 7.262], 9);
    };

    resetMainMap();

    // Reset vue par défaut 4s après que la souris quitte la carte
    let mainResetTimer = null;
    mapContainer.addEventListener('mouseenter', () => clearTimeout(mainResetTimer));
    mapContainer.addEventListener('mouseleave', () => {
        mainResetTimer = setTimeout(resetMainMap, 4000);
    });

    // Mini-carte outre-mer incrustée
    const existingInset = document.getElementById('map-inset');
    if (existingInset) { window._insetMap?.remove(); window._insetMap = null; existingInset.remove(); }
    document.getElementById('map-inset-label')?.remove();

    if (overseaRefs.length) {
        const mapContainer = document.getElementById('references-map');
        const inset = document.createElement('div');
        inset.id = 'map-inset';
        mapContainer.appendChild(inset);

        const insetMap = L.map(inset, {
            scrollWheelZoom: false,
            zoomControl: false,
            attributionControl: false
        });
        window._insetMap = insetMap;

        let insetTile = applyMapTile(insetMap, null);

        const insetLayer = L.layerGroup().addTo(insetMap);
        overseaRefs.forEach((reference) => {
            const lat = toCoordinate(reference.latitude);
            const lng = toCoordinate(reference.longitude);
            const marker = L.marker([lat, lng], { icon: referencesOrangeMarkerIcon, title: reference.title || '' });

            const popup = L.popup({ maxWidth: 320, closeButton: false, closeOnClick: false, autoClose: true, offset: [0, -10] })
                .setContent(buildPopupHtml(reference));

            let iCloseTimer = null;
            const iScheduleClose = () => { iCloseTimer = setTimeout(() => insetMap.closePopup(popup), 120); };
            const iCancelClose  = () => clearTimeout(iCloseTimer);

            marker.on('mouseover', () => { iCancelClose(); popup.setLatLng(marker.getLatLng()); popup.openOn(insetMap); });
            marker.on('mouseout', iScheduleClose);
            popup.on('add', () => {
                const el = popup.getElement();
                if (!el) return;
                el.addEventListener('mouseenter', iCancelClose);
                el.addEventListener('mouseleave', iScheduleClose);
            });
            marker.on('click', () => {
                if (reference.siteId && reference.projectCount > 1) window.location.href = `site.html?site=${reference.siteId}`;
                else if (reference.id) window.location.href = `project.html?project=${reference.id}`;
            });

            marker.addTo(insetLayer);
        });

        const ob = L.latLngBounds(overseaRefs.map((r) => [toCoordinate(r.latitude), toCoordinate(r.longitude)]));
        insetMap.fitBounds(ob, { padding: [30, 30], maxZoom: 10 });

        // Reset vue par défaut 4s après que la souris quitte l'inset
        let insetResetTimer = null;
        inset.addEventListener('mouseenter', () => clearTimeout(insetResetTimer));
        inset.addEventListener('mouseleave', () => {
            insetResetTimer = setTimeout(() => insetMap.fitBounds(ob, { padding: [30, 30], maxZoom: 10 }), 4000);
        });

        // Observer thème → swap tiles inset
        new MutationObserver(() => {
            insetTile = applyMapTile(insetMap, insetTile);
        }).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        inset.addEventListener('transitionend', () => {
            insetMap.invalidateSize();
            if (!inset.matches(':hover')) {
                insetMap.fitBounds(ob, { padding: [30, 30], maxZoom: 10, animate: false });
            }
        });

        const label = document.createElement('div');
        label.id = 'map-inset-label';
        label.textContent = 'Outre-mer';
        inset.appendChild(label);
    }

    updateMapHint(`${mapReferences.length} site(s) de reference affiche(s). Survolez un point pour voir le client et les photos.`);
}

// Nebula: center logo + hover name tooltips
function initNebulaEnhancements() {
    const nebula = document.querySelector('.logo-nebula');
    if (!nebula) return;

    // Inject CEA logo at the orbital center
    const centerImg = document.createElement('img');
    centerImg.src = 'ico/CEAON.webp';
    centerImg.alt = 'CEA Ingénierie';
    centerImg.className = 'nebula-center-logo';
    nebula.appendChild(centerImg);

    // Update center logo when theme switches
    const observer = new MutationObserver(() => {
        const dark = document.documentElement.getAttribute('data-theme') === 'dark';
        centerImg.src = dark ? 'ico/CEAOB.webp' : 'ico/CEAON.webp';
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

    // Set data-name on each orb from the img alt text (used by CSS ::after tooltip)
    nebula.querySelectorAll('.logo-orb').forEach(orb => {
        const name = orb.querySelector('img')?.getAttribute('alt');
        if (name) orb.dataset.name = name;
    });
}

// Carousel Manager for References using Swiper
function initCarousels() {
    document.querySelectorAll('.ref-carousel').forEach((carousel) => {
        // Wrap carousel in outer flex container for external nav buttons
        const outer = document.createElement('div');
        outer.className = 'ref-carousel-outer';
        carousel.parentNode.insertBefore(outer, carousel);
        outer.appendChild(carousel);

        // Inject prev / next buttons outside the swiper container
        const prevBtn = document.createElement('button');
        prevBtn.className = 'ref-nav-btn ref-nav-prev';
        prevBtn.setAttribute('aria-label', 'Précédent');
        prevBtn.innerHTML = '<i class="fas fa-chevron-left"></i>';
        outer.insertBefore(prevBtn, carousel);

        const nextBtn = document.createElement('button');
        nextBtn.className = 'ref-nav-btn ref-nav-next';
        nextBtn.setAttribute('aria-label', 'Suivant');
        nextBtn.innerHTML = '<i class="fas fa-chevron-right"></i>';
        outer.appendChild(nextBtn);

        // Pagination below the outer wrapper
        const pagination = document.createElement('div');
        pagination.className = 'ref-pagination';
        outer.insertAdjacentElement('afterend', pagination);

        const slideCount = carousel.querySelectorAll('.swiper-slide').length;

        if (slideCount < 3) {
            prevBtn.style.display = 'none';
            nextBtn.style.display = 'none';
            pagination.style.display = 'none';
            carousel.classList.add(`ref-carousel--count-${slideCount}`);
        }

        const swiper = new Swiper(carousel, {
            slidesPerView: 1,
            spaceBetween: 24,
            rewind: slideCount > 2,
            grabCursor: slideCount > 2,
            speed: 500,
            autoplay: false, // started only when the carousel enters the viewport
            breakpoints: {
                640: {
                    slidesPerView: 2,
                    spaceBetween: 24,
                },
                1024: {
                    slidesPerView: 3,
                    spaceBetween: 32,
                },
            },
            navigation: {
                nextEl: nextBtn,
                prevEl: prevBtn,
                disabledClass: 'ref-nav-disabled',
            },
            pagination: {
                el: pagination,
                clickable: true,
                bulletClass: 'ref-bullet',
                bulletActiveClass: 'ref-bullet-active',
            },
        });

        // Start autoplay only when the carousel is actually visible
        if (slideCount > 2) {
            const visibilityObserver = new IntersectionObserver((entries) => {
                if (entries[0].isIntersecting) {
                    swiper.params.autoplay = { delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true };
                    swiper.autoplay.start();
                } else {
                    swiper.autoplay.stop();
                }
            }, { threshold: 0.4 });
            visibilityObserver.observe(carousel);
        }
    });

    // Show placeholder icon when image is broken or missing
    document.querySelectorAll('.ref-image .ref-img').forEach(img => {
        const markError = () => img.classList.add('img-error');
        img.addEventListener('error', markError);
        if (img.complete && img.naturalWidth === 0) markError();
    });
}

// Animate inline stat numbers inside the narrative hero card
function initNarrativeCounters() {
    const section = document.querySelector('.expertise-stats');
    if (!section) return;

    const els = [...section.querySelectorAll('.stat-num-inline')];
    els.forEach((el) => {
        let target = el.dataset.statTarget ? parseInt(el.dataset.statTarget) : null;
        if (el.dataset.startYear) target = getExperienceYears(parseInt(el.dataset.startYear));
        if (target === null) return;
        const prefix = el.dataset.prefix || '';
        el._narTarget = target;
        el._narPrefix = prefix;
        el.textContent = prefix + '0';
    });

    const observer = new IntersectionObserver((entries) => {
        if (!entries.some((e) => e.isIntersecting) || section._narDone) return;
        section._narDone = true;
        observer.disconnect();
        els.forEach((el, i) => {
            if (el._narTarget == null) return;
            setTimeout(() => animateNarrativeEl(el), i * 140);
        });
    }, { threshold: 0.4 });

    observer.observe(section);
}

function animateNarrativeEl(el) {
    const target = el._narTarget;
    const prefix = el._narPrefix;
    const totalMs = Math.min(1400, Math.max(400, target * 55));
    let current = 0;
    const tick = () => {
        el.textContent = prefix + current;
        if (current >= target) return;
        const ratio = current / target;
        const interval = ratio < 0.75 ? totalMs / target * 0.5 : totalMs / target * 2.4;
        current++;
        setTimeout(tick, interval);
    };
    tick();
}

// Animated stats counter
function initializeStatsCounter() {
    const animatedCounters = new Set(); // Pour suivre les compteurs déjà animés

    const animateCounter = (element) => {
        // Si déjà animé, ne pas réanimer
        if (animatedCounters.has(element)) {
            return;
        }

        // Support both data-target and data-count attributes
        const target = parseInt(element.getAttribute('data-target') || element.getAttribute('data-count'));

        if (isNaN(target)) {
            return; // Skip if target is not a number
        }

        // Marquer comme animé
        animatedCounters.add(element);

        const prefix = element.getAttribute('data-prefix') || '';
        const suffix = element.getAttribute('data-suffix') || '';
        const duration = 2000; // 2 seconds
        const increment = target / (duration / 16); // 60fps
        let current = 0;

        const updateCounter = () => {
            current += increment;
            if (current < target) {
                element.textContent = prefix + Math.floor(current) + suffix;
                requestAnimationFrame(updateCounter);
            } else {
                element.textContent = prefix + target + suffix;
            }
        };

        updateCounter();
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                // Animer tous les compteurs visibles dans cette section
                const counters = entry.target.querySelectorAll('.stat-number');
                counters.forEach((stat) => {
                    animateCounter(stat);
                });
            }
        });
    }, { threshold: 0.3 });

    // Observer toutes les sections contenant des statistiques
    const statsSections = document.querySelectorAll('.expertise-stats, .stats-container');
    statsSections.forEach((section) => {
        observer.observe(section);
    });
}

function initNavDropdown() {
    const dropdown = document.getElementById('entreprise-dropdown');
    if (!dropdown) return;

    const trigger = dropdown.querySelector('.nav-link--dropdown');
    const SECTIONS = ['expertise', 'equipe', 'moyens-techniques'];

    // Toggle ouvert/fermé au clic sur le trigger
    trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdown.classList.toggle('open');
        trigger.setAttribute('aria-expanded', isOpen);
    });

    // Smooth scroll + fermeture au clic sur un lien dropdown
    const navbar = document.querySelector('.navbar');
    dropdown.querySelectorAll('.nav-dropdown-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const target = document.querySelector(link.getAttribute('href'));
            if (target) window.scrollTo({ top: target.offsetTop - (navbar?.offsetHeight || 80), behavior: 'smooth' });
            dropdown.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
            // Fermer le menu mobile si ouvert
            const menu = document.getElementById('nav-menu-list');
            const hamburger = document.querySelector('.hamburger');
            if (menu?.classList.contains('active')) {
                menu.classList.remove('active');
                hamburger?.classList.remove('active');
                hamburger?.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // Fermer sur clic extérieur
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('open');
            trigger.setAttribute('aria-expanded', 'false');
        }
    });

    // Activer le trigger quand on scrolle dans une section de l'entreprise
    window.addEventListener('scroll', Utils.throttle(() => {
        const scrollPos = window.scrollY + 100;
        const inSection = SECTIONS.some(id => {
            const el = document.getElementById(id);
            return el && scrollPos >= el.offsetTop && scrollPos < el.offsetTop + el.offsetHeight;
        });
        trigger.classList.toggle('active', inSection);
    }, 50));
}

function initializeInteractiveFeatures() {
    // Add hover effects to cards
    // Cet effet est maintenant géré par la pseudo-classe CSS :hover pour de meilleures performances.

    // Add click effect to buttons
    const buttons = document.querySelectorAll('.btn');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // Create ripple effect
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
}

function addScrollToTopButton() {
    // Create scroll to top button
    const scrollTopBtn = document.createElement('button');
    scrollTopBtn.innerHTML = '<i class="fas fa-arrow-up"></i>';
    scrollTopBtn.className = 'scroll-top-btn';

    document.body.appendChild(scrollTopBtn);

    // Show/hide button based on scroll position
    window.addEventListener('scroll', Utils.throttle(() => {
        if (window.scrollY > 300) {
            scrollTopBtn.classList.add('visible');
        } else {
            scrollTopBtn.classList.remove('visible');
        }
    }, 100));

    // Scroll to top when clicked
    scrollTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // Add floating call button
    const callBtn = document.createElement('a');
    callBtn.href = 'tel:+33493872517';
    callBtn.className = 'floating-call-btn';
    callBtn.innerHTML = '<i class="fas fa-phone"></i>';
    callBtn.setAttribute('aria-label', 'Appeler CEA Ingénierie');

    document.body.appendChild(callBtn);
}

const EASTER_EGGS = [
    { name: 'Arlo',    lat: 43.688651, lng: 7.230173,  img: 'images/arlo.jpg'  },
    { name: 'Le Chat', lat: 43.690028, lng: 7.229250,  img: 'images/chat.jpg'  },
];
const EASTER_EGG_RADIUS_M = 80;
const easterEggsFound = new Set();

function initMapEasterEggs(map) {
    const overlay = document.createElement('div');
    overlay.id = 'easter-egg-overlay';
    overlay.innerHTML = `
        <div id="easter-egg-box">
            <button id="easter-egg-close" aria-label="Fermer">✕</button>
            <img id="easter-egg-img" src="" alt="">
            <p id="easter-egg-msg"></p>
        </div>`;
    document.body.appendChild(overlay);

    const style = document.createElement('style');
    style.textContent = `
        #easter-egg-overlay {
            display: none; position: fixed; inset: 0;
            background: rgba(0,0,0,.7); z-index: 99999;
            align-items: center; justify-content: center;
        }
        #easter-egg-overlay.visible { display: flex; }
        #easter-egg-box {
            background: #1a1a1a; border: 2px solid var(--primary-orange, #ff9d5c);
            border-radius: 16px; padding: 2rem; max-width: 420px; width: 90%;
            text-align: center; position: relative; animation: eggPop .35s cubic-bezier(.16,1,.3,1);
        }
        @keyframes eggPop { from { transform: scale(.7); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        #easter-egg-img { max-width: 100%; max-height: 300px; border-radius: 10px; margin-bottom: 1rem; object-fit: cover; }
        #easter-egg-msg { color: #fff; font-size: 1.2rem; font-weight: 600; margin: 0; }
        #easter-egg-msg span { color: var(--primary-orange, #ff9d5c); }
        #easter-egg-close {
            position: absolute; top: .75rem; right: .75rem;
            background: none; border: none; color: #aaa; font-size: 1.2rem; cursor: pointer;
        }
        #easter-egg-close:hover { color: #fff; }
    `;
    document.head.appendChild(style);

    document.getElementById('easter-egg-close').addEventListener('click', () => overlay.classList.remove('visible'));
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.classList.remove('visible'); });

    map.on('click', (e) => {
        for (const egg of EASTER_EGGS) {
            const dist = e.latlng.distanceTo(L.latLng(egg.lat, egg.lng));
            if (dist <= EASTER_EGG_RADIUS_M) {
                const isNew = !easterEggsFound.has(egg.name);
                if (isNew) easterEggsFound.add(egg.name);
                document.getElementById('easter-egg-img').src = egg.img;
                document.getElementById('easter-egg-img').alt = egg.name;
                document.getElementById('easter-egg-msg').innerHTML =
                    isNew ? `🎉 Bravo tu as trouvé <span>${egg.name}</span> !`
                           : `Tu as encore trouvé <span>${egg.name}</span> !`;
                overlay.classList.add('visible');
                launchConfetti();
                break;
            }
        }
    });
}

function launchConfetti() {
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:100000';
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    document.body.appendChild(canvas);
    const ctx = canvas.getContext('2d');

    const COLORS = ['#ff9d5c','#ff6b35','#ffd700','#ff4d6d','#7fff00','#00cfff','#ff69b4','#fff'];
    const particles = Array.from({ length: 140 }, () => ({
        x: Math.random() * canvas.width,
        y: -10 - Math.random() * 200,
        r: 5 + Math.random() * 7,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        angle: Math.random() * Math.PI * 2,
        spin: (Math.random() - .5) * .2,
        vx: (Math.random() - .5) * 4,
        vy: 2 + Math.random() * 4,
        shape: Math.random() > .5 ? 'rect' : 'circle',
    }));

    let frame;
    const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        let alive = false;
        for (const p of particles) {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += .12;
            p.angle += p.spin;
            if (p.y < canvas.height + 20) alive = true;
            ctx.save();
            ctx.translate(p.x, p.y);
            ctx.rotate(p.angle);
            ctx.fillStyle = p.color;
            ctx.globalAlpha = Math.max(0, 1 - p.y / canvas.height);
            if (p.shape === 'rect') ctx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r);
            else { ctx.beginPath(); ctx.arc(0, 0, p.r / 2, 0, Math.PI * 2); ctx.fill(); }
            ctx.restore();
        }
        if (alive) frame = requestAnimationFrame(draw);
        else canvas.remove();
    };
    frame = requestAnimationFrame(draw);
    setTimeout(() => { cancelAnimationFrame(frame); canvas.remove(); }, 4000);
}
