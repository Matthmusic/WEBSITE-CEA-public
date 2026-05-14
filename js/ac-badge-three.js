(() => {
  const BADGE_SELECTOR = '.ac-iridescent-badge';
  const THREE_CDN = 'https://unpkg.com/three@0.160.0/build/three.module.min.js';
  const BADGE_TEXTURE = '/images/badges/h.webp';
  const instances = new Map();
  let rafId = null;
  let io = null;

  async function loadThree() {
    if (window.THREE) return window.THREE;
    const mod = await import(THREE_CDN);
    window.THREE = mod;
    return mod;
  }

  function cleanupBadge(el) {
    const state = instances.get(el);
    if (!state) return;
    try {
      state.renderer.dispose();
      state.renderer.forceContextLoss();
    } catch {}
    state.renderer.domElement.remove();
    el.classList.remove('ac-iridescent-badge--three');
    io?.unobserve(el);
    instances.delete(el);
  }

  function createBadgeScene(el) {
    if (!window.THREE || instances.has(el)) return;

    // Lire clientWidth après layout — s'il est encore 0, reporter après un frame
    const size = Math.max(32, Math.ceil(Math.max(el.clientWidth, el.clientHeight)));
    if (size === 32 && el.clientWidth === 0) {
      // Pas encore rendu — réessayer après layout
      requestAnimationFrame(() => {
        if (!instances.has(el)) createBadgeScene(el);
      });
      return;
    }

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(size, size, false);
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    renderer.domElement.className = 'ac-badge-three-canvas';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    el.classList.add('ac-iridescent-badge--three');
    el.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 10);
    camera.position.set(0, 0, 3.1);

    const group = new THREE.Group();
    scene.add(group);
    const textureLoader = new THREE.TextureLoader();
    const tex = textureLoader.load(BADGE_TEXTURE);
    tex.colorSpace = THREE.SRGBColorSpace || THREE.LinearSRGBColorSpace;
    tex.anisotropy = 4;
    tex.generateMipmaps = true;

    const badgePlane = new THREE.PlaneGeometry(1.55, 1.55);
    const sideMat = new THREE.MeshStandardMaterial({
      map: tex,
      alphaMap: tex,
      transparent: true,
      alphaTest: 0.08,
      color: new THREE.Color('#5b3aa3'),
      metalness: 0.6,
      roughness: 0.2,
      emissive: new THREE.Color('#4d2f94'),
      emissiveIntensity: 0.52
    });

    for (let i = 0; i < 7; i += 1) {
      const layer = new THREE.Mesh(badgePlane, sideMat);
      layer.position.z = -0.16 + i * 0.026;
      layer.scale.setScalar(1 - i * 0.012);
      group.add(layer);
    }

    const faceMat = new THREE.MeshPhysicalMaterial({
      map: tex,
      transparent: true,
      alphaTest: 0.08,
      side: THREE.DoubleSide,
      metalness: 0.32,
      roughness: 0.05,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      iridescence: 1,
      iridescenceIOR: 1.62,
      iridescenceThicknessRange: [180, 700],
      transmission: 0.18,
      thickness: 0.28
    });
    const face = new THREE.Mesh(badgePlane, faceMat);
    face.position.z = 0.05;
    group.add(face);

    const back = new THREE.Mesh(
      badgePlane,
      new THREE.MeshStandardMaterial({
        map: tex,
        alphaMap: tex,
        transparent: true,
        alphaTest: 0.08,
        color: new THREE.Color('#120a24'),
        metalness: 0.6,
        roughness: 0.4
      })
    );
    back.position.z = -0.22;
    back.rotation.y = Math.PI;
    group.add(back);

    const halo = new THREE.Mesh(
      new THREE.RingGeometry(0.68, 0.92, 64),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color('#d9a8ff'),
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      })
    );
    halo.position.z = -0.08;
    group.add(halo);

    scene.add(new THREE.AmbientLight(0xffffff, 1.38));
    const key = new THREE.DirectionalLight(0xc9ecff, 2.15);
    key.position.set(2.3, 1.8, 3.5);
    scene.add(key);
    const rim = new THREE.PointLight(0xffb3eb, 1.95, 13);
    rim.position.set(-2.2, -1.6, 2.5);
    scene.add(rim);
    const fill = new THREE.PointLight(0xcaa2ff, 1.45, 11);
    fill.position.set(0, 1.8, 2.1);
    scene.add(fill);

    const state = {
      renderer,
      scene,
      camera,
      group,
      halo,
      key,
      rim,
      hover: false,
      visible: true,
      targetX: 0,
      targetY: 0,
      rotX: 0,
      rotY: 0,
      glintOffset: Math.random() * Math.PI * 2
    };

    el.addEventListener('pointerenter', () => {
      state.hover = true;
      state.targetX = -0.35;
      state.targetY = 0.35;
    });
    el.addEventListener('pointerleave', () => {
      state.hover = false;
      state.targetX = 0;
      state.targetY = 0;
    });
    el.addEventListener('pointermove', (event) => {
      const rect = el.getBoundingClientRect();
      const nx = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      const ny = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      state.targetY = nx * 0.45;
      state.targetX = -ny * 0.45;
    });

    if (io) io.observe(el);
    instances.set(el, state);
    if (!rafId) rafId = requestAnimationFrame(tick);
  }

  function tick() {
    const t = performance.now() * 0.001;
    instances.forEach((state) => {
      if (!state.visible) return;
      state.rotX += (state.targetX - state.rotX) * 0.08;
      state.rotY += (state.targetY - state.rotY) * 0.08;
      state.group.rotation.x = state.rotX + (state.hover ? Math.sin(t * 1.4) * 0.02 : 0);
      state.group.rotation.y = state.rotY;
      state.group.rotation.z = state.hover ? Math.sin(t * 1.1) * 0.02 : 0;
      state.halo.rotation.z += state.hover ? 0.01 : 0.003;
      const glint = Math.pow(Math.max(0, Math.sin(t * 0.72 + state.glintOffset)), 18);
      state.halo.material.opacity = 0.24 + glint * 0.44 + (state.hover ? 0.12 : 0);
      state.key.intensity = 2 + glint * 1.25 + (state.hover ? 0.35 : 0);
      state.rim.intensity = 1.65 + glint * 1.05 + (state.hover ? 0.24 : 0);
      state.renderer.render(state.scene, state.camera);
    });
    rafId = requestAnimationFrame(tick);
  }

  function scanAndInit() {
    requestAnimationFrame(() => {
      document.querySelectorAll(BADGE_SELECTOR).forEach((el) => createBadgeScene(el));
    });
  }

  function start() {
    io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const state = instances.get(entry.target);
        if (state) state.visible = entry.isIntersecting;
      });
    }, { threshold: 0.05 });

    scanAndInit();

    const mo = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Nettoyer les badges supprimés pour libérer les contextes WebGL
        mutation.removedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches?.(BADGE_SELECTOR)) cleanupBadge(node);
          node.querySelectorAll?.(BADGE_SELECTOR).forEach(cleanupBadge);
        });
        // Initialiser les nouveaux badges après layout (requestAnimationFrame)
        mutation.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          requestAnimationFrame(() => {
            if (node.matches?.(BADGE_SELECTOR)) createBadgeScene(node);
            node.querySelectorAll?.(BADGE_SELECTOR).forEach((el) => createBadgeScene(el));
          });
        });
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });
  }

  function boot() {
    // Three.js WebGL trop lourd sur mobile — badge CSS uniquement
    if (window.matchMedia('(max-width: 768px)').matches) return;
    loadThree().then(start).catch(() => {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }

  // API publique pour forcer une réinitialisation (ex: preview admin React)
  window.AcBadgeThree = { reinit: scanAndInit, cleanup: cleanupBadge };
})();
