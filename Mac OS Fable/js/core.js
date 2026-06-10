/**
 * Fable OS - Core System
 * Defines window.OS with all subsystems: VFS, WM, Notify, Audio, Theme, Dock, Menu, Desktop, Boot
 */

window.OS = {};

// ============================================================
// VFS — Virtual File System
// ============================================================
OS.VFS = {
  _tree: {
    type: 'dir', name: '', children: {
      'Users': { type: 'dir', name: 'Users', children: {
        'guest': { type: 'dir', name: 'guest', children: {
          'Desktop': { type: 'dir', name: 'Desktop', children: {} },
          'Documents': { type: 'dir', name: 'Documents', children: {
            'readme.txt': {
              type: 'file', name: 'readme.txt',
              content: 'Welcome to Fable OS!\n\nThis is your Documents folder.',
              size: 51,
              modified: new Date()
            }
          }},
          'Downloads': { type: 'dir', name: 'Downloads', children: {} },
          'Applications': { type: 'dir', name: 'Applications', children: {} }
        }}
      }}
    }
  },
  _cwd: '/Users/guest',
  _listeners: [],

  /**
   * Normalize a path string: collapse //, handle . and .., strip trailing slash.
   * Returns an array of path segments (absolute).
   */
  _normalize(path) {
    // Resolve relative paths against _cwd
    if (!path.startsWith('/')) {
      path = this._cwd.replace(/\/$/, '') + '/' + path;
    }
    const parts = path.split('/').filter(p => p !== '');
    const resolved = [];
    for (const part of parts) {
      if (part === '.') continue;
      if (part === '..') {
        if (resolved.length > 0) resolved.pop();
      } else {
        resolved.push(part);
      }
    }
    return resolved;
  },

  /**
   * Resolve a path to its node object. Returns null if not found.
   */
  resolve(path) {
    if (path === '/') return this._tree;
    const segments = this._normalize(path);
    let node = this._tree;
    for (const seg of segments) {
      if (!node || node.type !== 'dir' || !node.children || !(seg in node.children)) {
        return null;
      }
      node = node.children[seg];
    }
    return node || null;
  },

  /**
   * List directory contents. Returns array of {name, type, size, modified} or null.
   */
  ls(path) {
    const node = this.resolve(path);
    if (!node || node.type !== 'dir') return null;
    return Object.values(node.children).map(child => ({
      name: child.name,
      type: child.type,
      size: child.type === 'file' ? (child.size || (child.content ? child.content.length : 0)) : null,
      modified: child.modified || null
    }));
  },

  /**
   * Make directory (creates intermediate dirs). Returns true/false.
   */
  mkdir(path) {
    const segments = this._normalize(path);
    let node = this._tree;
    let currentPath = '';
    for (const seg of segments) {
      currentPath += '/' + seg;
      if (!node.children) node.children = {};
      if (!(seg in node.children)) {
        node.children[seg] = { type: 'dir', name: seg, children: {} };
        this._emit('mkdir', currentPath);
      } else if (node.children[seg].type !== 'dir') {
        return false; // Exists as a file
      }
      node = node.children[seg];
    }
    return true;
  },

  /**
   * Create or update a file. Returns true/false.
   */
  write(path, content = '') {
    const segments = this._normalize(path);
    if (segments.length === 0) return false;
    const filename = segments[segments.length - 1];
    const dirSegments = segments.slice(0, -1);

    // Ensure parent dir exists
    let node = this._tree;
    let currentPath = '';
    for (const seg of dirSegments) {
      currentPath += '/' + seg;
      if (!node.children) node.children = {};
      if (!(seg in node.children)) {
        node.children[seg] = { type: 'dir', name: seg, children: {} };
      } else if (node.children[seg].type !== 'dir') {
        return false;
      }
      node = node.children[seg];
    }

    if (!node.children) node.children = {};
    const absPath = '/' + segments.join('/');
    const isNew = !(filename in node.children);
    node.children[filename] = {
      type: 'file',
      name: filename,
      content: content,
      size: content.length,
      modified: new Date()
    };
    this._emit(isNew ? 'create' : 'update', absPath);
    return true;
  },

  touch(path) { return this.write(path, this.read(path) || ''); },

  /**
   * Read a file. Returns string content or null.
   */
  read(path) {
    const node = this.resolve(path);
    if (!node || node.type !== 'file') return null;
    return node.content || '';
  },

  /**
   * Delete file or directory. recursive=true for dirs. Returns true/false.
   */
  rm(path, recursive = false) {
    const segments = this._normalize(path);
    if (segments.length === 0) return false; // Cannot remove root
    const name = segments[segments.length - 1];
    const parentSegments = segments.slice(0, -1);

    let parent = this._tree;
    for (const seg of parentSegments) {
      if (!parent || parent.type !== 'dir' || !parent.children || !(seg in parent.children)) return false;
      parent = parent.children[seg];
    }
    if (!parent.children || !(name in parent.children)) return false;

    const target = parent.children[name];
    if (target.type === 'dir' && !recursive) return false;

    const absPath = '/' + segments.join('/');
    delete parent.children[name];
    this._emit('rm', absPath);
    return true;
  },

  exists(path) { return this.resolve(path) !== null; },

  isDir(path) {
    const n = this.resolve(path);
    return n !== null && n.type === 'dir';
  },

  /**
   * Returns absolute path for a potentially-relative path.
   */
  absPath(path) {
    const segments = this._normalize(path);
    return '/' + segments.join('/');
  },

  onChange(cb) { this._listeners.push(cb); },

  _emit(type, path) { this._listeners.forEach(fn => fn(type, path)); }
};


// ============================================================
// WM — Window Manager
// ============================================================
OS.WM = {
  _wins: {},   // id -> { el, opts, state }
  _z: 200,
  _focused: null,

  /**
   * Open a window.
   * opts: { id, title, width=700, height=500, x, y, icon='🖥️', minWidth=300, minHeight=200, render(container) }
   * Returns the window DOM element.
   */
  open(opts) {
    const id = opts.id || ('win-' + Date.now());
    opts.id = id;

    // If already open, just focus
    if (this._wins[id] && this._wins[id].el.isConnected) {
      this.focus(id);
      return this._wins[id].el;
    }

    const width = opts.width || 700;
    const height = opts.height || 500;
    const minWidth = opts.minWidth || 300;
    const minHeight = opts.minHeight || 200;
    const icon = opts.icon || '🖥️';

    const layer = document.getElementById('window-layer');
    const layerRect = layer ? layer.getBoundingClientRect() : { width: window.innerWidth, height: window.innerHeight, left: 0, top: 0 };

    let x = opts.x;
    let y = opts.y;
    if (x === undefined) x = Math.max(0, Math.floor((layerRect.width - width) / 2));
    if (y === undefined) y = Math.max(0, Math.floor((layerRect.height - height) / 2));

    // Clamp within layer
    x = Math.max(0, Math.min(x, Math.max(0, layerRect.width - width)));
    y = Math.max(0, Math.min(y, Math.max(0, layerRect.height - height)));

    const win = document.createElement('div');
    win.className = 'window';
    win.setAttribute('data-id', id);
    win.style.width = width + 'px';
    win.style.height = height + 'px';
    win.style.left = x + 'px';
    win.style.top = y + 'px';
    win.style.zIndex = ++this._z;
    win.style.position = 'absolute';

    win.innerHTML = `
      <div class="window-titlebar">
        <div class="window-traffic-lights">
          <button class="traffic-light tl-close" title="Close"><span class="tl-icon">✕</span></button>
          <button class="traffic-light tl-min" title="Minimize"><span class="tl-icon">−</span></button>
          <button class="traffic-light tl-max" title="Maximize"><span class="tl-icon">+</span></button>
        </div>
        <span class="window-title">${opts.title || id}</span>
        <div style="width:46px;flex-shrink:0"></div>
      </div>
      <div class="window-body"></div>
      <div class="resize-handle rh-n"></div>
      <div class="resize-handle rh-s"></div>
      <div class="resize-handle rh-e"></div>
      <div class="resize-handle rh-w"></div>
      <div class="resize-handle rh-ne"></div>
      <div class="resize-handle rh-nw"></div>
      <div class="resize-handle rh-se"></div>
      <div class="resize-handle rh-sw"></div>
    `;

    const titlebar = win.querySelector('.window-titlebar');
    const body = win.querySelector('.window-body');

    // Traffic light actions
    win.querySelector('.tl-close').addEventListener('click', (e) => {
      e.stopPropagation();
      this.close(id);
    });
    win.querySelector('.tl-min').addEventListener('click', (e) => {
      e.stopPropagation();
      this.minimize(id);
    });
    win.querySelector('.tl-max').addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMaximize(id);
    });

    // Focus on click
    win.addEventListener('pointerdown', () => this.focus(id));

    // Make draggable by titlebar
    this._makeDraggable(win, titlebar);

    // Make resizable
    this._makeResizable(win, minWidth, minHeight);

    // Add to layer
    if (layer) layer.appendChild(win);
    else document.body.appendChild(win);

    // Call render function
    if (opts.render) {
      try { opts.render(body); } catch (e) { console.error('Window render error:', e); }
    }

    this._wins[id] = {
      el: win,
      opts,
      state: { minimized: false, maximized: false, restoreRect: null }
    };

    // Focus
    this.focus(id);

    // Mark running on dock
    if (OS.Dock) OS.Dock.setRunning(id, true);

    // Update menu bar
    if (OS.Menu && OS.Apps && OS.Apps[id]) {
      const app = OS.Apps[id];
      OS.Menu.setApp(id, app.label || opts.title, app.menus || []);
    }

    return win;
  },

  close(id) {
    const win = this._wins[id];
    if (!win) return;
    win.el.remove();
    delete this._wins[id];
    if (this._focused === id) {
      this._focused = null;
      // Focus last remaining window
      const ids = Object.keys(this._wins);
      if (ids.length > 0) this.focus(ids[ids.length - 1]);
    }
    if (OS.Dock) OS.Dock.setRunning(id, false);
    // Reset menu bar to Finder
    if (OS.Menu) {
      const remaining = Object.keys(this._wins);
      if (remaining.length === 0) {
        OS.Menu.setApp('Finder', 'Finder', []);
      }
    }
  },

  focus(id) {
    if (!this._wins[id]) return;

    // Remove focused from previous
    if (this._focused && this._wins[this._focused]) {
      this._wins[this._focused].el.classList.remove('focused');
    }

    const win = this._wins[id];
    win.el.style.zIndex = ++this._z;
    win.el.classList.add('focused');
    this._focused = id;

    // Show minimized window if needed
    if (win.state.minimized) {
      this._unminimize(id);
    }

    // Update menu bar
    if (OS.Menu && OS.Apps && OS.Apps[id]) {
      const app = OS.Apps[id];
      OS.Menu.setApp(id, app.label || win.opts.title, app.menus || []);
    }
  },

  minimize(id) {
    const win = this._wins[id];
    if (!win || win.state.minimized) return;

    win.state.minimized = true;
    win.el.classList.add('minimizing');

    win.el.addEventListener('animationend', () => {
      win.el.classList.remove('minimizing');
      win.el.style.display = 'none';
    }, { once: true });

    // Fallback if animation doesn't fire
    setTimeout(() => {
      if (win.state.minimized) {
        win.el.classList.remove('minimizing');
        win.el.style.display = 'none';
      }
    }, 500);

    if (this._focused === id) {
      this._focused = null;
      // Focus next window
      const ids = Object.keys(this._wins).filter(k => k !== id && !this._wins[k].state.minimized);
      if (ids.length > 0) this.focus(ids[ids.length - 1]);
    }
  },

  _unminimize(id) {
    const win = this._wins[id];
    if (!win || !win.state.minimized) return;
    win.state.minimized = false;
    win.el.style.display = '';
    win.el.classList.add('unminimizing');
    win.el.addEventListener('animationend', () => {
      win.el.classList.remove('unminimizing');
    }, { once: true });
  },

  toggleMaximize(id) {
    const win = this._wins[id];
    if (!win) return;

    const layer = document.getElementById('window-layer');
    const layerW = layer ? layer.clientWidth : window.innerWidth;
    const layerH = layer ? layer.clientHeight : window.innerHeight;

    if (!win.state.maximized) {
      // Save restore rect
      win.state.restoreRect = {
        width: win.el.style.width,
        height: win.el.style.height,
        left: win.el.style.left,
        top: win.el.style.top
      };
      win.el.style.width = layerW + 'px';
      win.el.style.height = layerH + 'px';
      win.el.style.left = '0px';
      win.el.style.top = '0px';
      win.state.maximized = true;
      win.el.classList.add('maximized');
    } else {
      const r = win.state.restoreRect;
      if (r) {
        win.el.style.width = r.width;
        win.el.style.height = r.height;
        win.el.style.left = r.left;
        win.el.style.top = r.top;
      }
      win.state.maximized = false;
      win.el.classList.remove('maximized');
    }
  },

  isOpen(id) {
    return id in this._wins && this._wins[id].el.isConnected;
  },

  /**
   * Make el draggable by handle.
   */
  _makeDraggable(el, handle) {
    let dragging = false;
    let startX, startY, startLeft, startTop;

    handle.addEventListener('pointerdown', (e) => {
      if (e.target.classList.contains('traffic-light') ||
          e.target.closest('.traffic-light')) return;
      if (e.button !== 0) return;

      const win = this._wins[el.getAttribute('data-id')];
      if (win && win.state.maximized) return;

      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      startLeft = parseInt(el.style.left) || 0;
      startTop = parseInt(el.style.top) || 0;

      handle.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    handle.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;

      const layer = document.getElementById('window-layer');
      const layerW = layer ? layer.clientWidth : window.innerWidth;
      const layerH = layer ? layer.clientHeight : window.innerHeight;
      const winW = el.offsetWidth;
      const winH = el.offsetHeight;

      let newLeft = startLeft + dx;
      let newTop = startTop + dy;

      // Clamp so window doesn't go fully off-screen
      newLeft = Math.max(-winW + 80, Math.min(newLeft, layerW - 80));
      newTop = Math.max(0, Math.min(newTop, layerH - 40));

      el.style.left = newLeft + 'px';
      el.style.top = newTop + 'px';
    });

    handle.addEventListener('pointerup', () => { dragging = false; });
    handle.addEventListener('pointercancel', () => { dragging = false; });
  },

  /**
   * Add 8 resize handles to el.
   */
  _makeResizable(el, minWidth, minHeight) {
    minWidth = minWidth || 300;
    minHeight = minHeight || 200;

    const handles = el.querySelectorAll('.resize-handle');
    handles.forEach(handle => {
      const dir = Array.from(handle.classList)
        .find(c => c.startsWith('rh-') && c !== 'rh-')
        ?.replace('rh-', '') || '';

      let resizing = false;
      let startX, startY, startW, startH, startL, startT;

      handle.addEventListener('pointerdown', (e) => {
        if (e.button !== 0) return;
        resizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startW = el.offsetWidth;
        startH = el.offsetHeight;
        startL = parseInt(el.style.left) || 0;
        startT = parseInt(el.style.top) || 0;
        handle.setPointerCapture(e.pointerId);
        e.preventDefault();
        e.stopPropagation();
      });

      handle.addEventListener('pointermove', (e) => {
        if (!resizing) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;

        let newW = startW;
        let newH = startH;
        let newL = startL;
        let newT = startT;

        if (dir.includes('e')) newW = Math.max(minWidth, startW + dx);
        if (dir.includes('s')) newH = Math.max(minHeight, startH + dy);
        if (dir.includes('w')) {
          newW = Math.max(minWidth, startW - dx);
          newL = startL + (startW - newW);
        }
        if (dir.includes('n')) {
          newH = Math.max(minHeight, startH - dy);
          newT = startT + (startH - newH);
        }

        el.style.width = newW + 'px';
        el.style.height = newH + 'px';
        el.style.left = newL + 'px';
        el.style.top = newT + 'px';
      });

      handle.addEventListener('pointerup', () => { resizing = false; });
      handle.addEventListener('pointercancel', () => { resizing = false; });
    });
  }
};


// ============================================================
// Notify — Notification System
// ============================================================
OS.Notify = {
  show(title, body = '', { icon = '🔔', duration = 4000 } = {}) {
    const container = document.getElementById('notifications');
    if (!container) return;

    const notif = document.createElement('div');
    notif.className = 'notif';
    notif.innerHTML = `
      <div class="notif-icon">${icon}</div>
      <div class="notif-content">
        <div class="notif-title">${title}</div>
        <div class="notif-body">${body}</div>
      </div>
      <button class="notif-close" aria-label="Close">✕</button>
    `;

    container.appendChild(notif);

    // Trigger entrance animation
    requestAnimationFrame(() => notif.classList.add('notif-visible'));

    const dismiss = () => {
      notif.classList.remove('notif-visible');
      notif.classList.add('notif-hiding');
      notif.addEventListener('transitionend', () => notif.remove(), { once: true });
      setTimeout(() => notif.remove(), 600); // Fallback
    };

    notif.querySelector('.notif-close').addEventListener('click', dismiss);

    if (duration > 0) setTimeout(dismiss, duration);
  }
};


// ============================================================
// Audio — Web Audio API Sounds
// ============================================================
OS.Audio = {
  _ctx: null,
  _enabled: true,

  _getCtx() {
    if (!this._ctx) {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this._ctx;
  },

  play(sound) {
    if (!this._enabled) return;
    try {
      const ctx = this._getCtx();

      const makeNote = (freq, type, startTime, duration, gainPeak = 0.3) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, startTime);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(gainPeak, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + duration + 0.05);
      };

      const now = ctx.currentTime;

      switch (sound) {
        case 'click':
          makeNote(440, 'sine', now, 0.05, 0.15);
          break;

        case 'notify':
          makeNote(523, 'sine', now, 0.15, 0.2);
          makeNote(659, 'sine', now + 0.15, 0.15, 0.2);
          break;

        case 'startup': {
          // C-E-G-C5 ascending, sine + triangle layered, 0.3s each with overlap
          const notes = [261.63, 329.63, 392.00, 523.25];
          notes.forEach((freq, i) => {
            const t = now + i * 0.25;
            makeNote(freq, 'sine', t, 0.3, 0.18);
            makeNote(freq, 'triangle', t, 0.3, 0.08);
          });
          break;
        }

        case 'error':
          makeNote(220, 'sawtooth', now, 0.2, 0.25);
          break;

        default:
          break;
      }
    } catch (e) {
      // Audio context may fail in some environments; silently ignore
      console.warn('OS.Audio.play error:', e);
    }
  }
};


// ============================================================
// Theme — Theming System
// ============================================================
OS.Theme = {
  _mode: 'light',
  _accent: '#007AFF',
  _wallpapers: [
    'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    'linear-gradient(135deg, #0f2027, #203a43, #2c5364)',
    'linear-gradient(135deg, #4a00e0, #8e2de2)',
    'linear-gradient(160deg, #0093E9 0%, #80D0C7 100%)',
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    'radial-gradient(ellipse at top, #1a1a2e, #16213e)',
    'linear-gradient(180deg, #2d1b69 0%, #11998e 100%)',
  ],
  _wIdx: 0,
  _dockSize: { small: 40, medium: 52, large: 64 },
  _dockSizeCur: 'medium',

  get mode() { return this._mode; },

  toggle() {
    this._mode = this._mode === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', this._mode);
    this.save();
  },

  setAccent(color) {
    this._accent = color;
    document.documentElement.style.setProperty('--accent', color);
    this.save();
  },

  setWallpaper(idx) {
    this._wIdx = ((idx % this._wallpapers.length) + this._wallpapers.length) % this._wallpapers.length;
    const desktop = document.getElementById('desktop');
    if (desktop) desktop.style.background = this._wallpapers[this._wIdx];
    this.save();
  },

  setDockSize(size) {
    if (!(size in this._dockSize)) return;
    this._dockSizeCur = size;
    const px = this._dockSize[size];
    document.querySelectorAll('.dock-icon-wrap').forEach(el => {
      el.style.width = px + 'px';
      el.style.height = px + 'px';
    });
    this.save();
  },

  save() {
    try {
      localStorage.setItem('os-theme', JSON.stringify({
        mode: this._mode,
        accent: this._accent,
        wIdx: this._wIdx,
        dockSize: this._dockSizeCur
      }));
    } catch (e) { /* storage might be unavailable */ }
  },

  load() {
    try {
      const d = JSON.parse(localStorage.getItem('os-theme') || '{}');
      if (d.mode) {
        this._mode = d.mode;
        document.documentElement.setAttribute('data-theme', d.mode);
      }
      if (d.accent) this.setAccent(d.accent);
      if (d.wIdx !== undefined) this.setWallpaper(d.wIdx);
      else this.setWallpaper(0);
      if (d.dockSize) this.setDockSize(d.dockSize);
    } catch (e) {
      this.setWallpaper(0);
    }
  }
};


// ============================================================
// Dock — Application Dock
// ============================================================
OS.Dock = {
  _apps: [], // [{id, label, iconSVG, openFn}]

  init() {
    const dockInner = document.getElementById('dock-inner');
    if (!dockInner) return;

    dockInner.addEventListener('mousemove', (e) => {
      const items = dockInner.querySelectorAll('.dock-item');
      const mouseX = e.clientX;

      items.forEach(item => {
        const rect = item.getBoundingClientRect();
        const itemCenterX = rect.left + rect.width / 2;
        const dist = Math.abs(mouseX - itemCenterX);
        // Max scale 1.6, falloff over 120px
        const scale = 1 + 0.6 * Math.max(0, 1 - dist / 120);
        const translateY = (scale - 1) * 10;
        item.style.transform = `scale(${scale}) translateY(-${translateY}px)`;
        item.style.transition = 'transform 0.1s ease';
        item.style.transformOrigin = 'bottom center';
      });
    });

    dockInner.addEventListener('mouseleave', () => {
      const items = dockInner.querySelectorAll('.dock-item');
      items.forEach(item => {
        item.style.transform = 'scale(1) translateY(0)';
        item.style.transition = 'transform 0.2s ease';
      });
    });
  },

  register(id, label, iconSVG, openFn) {
    this._apps.push({ id, label, iconSVG, openFn });

    const dockApps = document.getElementById('dock-apps');
    if (!dockApps) return;

    const item = document.createElement('div');
    item.className = 'dock-item';
    item.setAttribute('data-app-id', id);
    item.setAttribute('title', label);

    const iconWrap = document.createElement('div');
    iconWrap.className = 'dock-icon-wrap';
    iconWrap.innerHTML = iconSVG;

    const labelEl = document.createElement('span');
    labelEl.className = 'dock-label';
    labelEl.textContent = label;

    const dot = document.createElement('span');
    dot.className = 'dock-running-dot';
    dot.style.display = 'none';

    item.appendChild(iconWrap);
    item.appendChild(labelEl);
    item.appendChild(dot);

    item.addEventListener('click', () => {
      OS.Audio.play('click');
      openFn();
    });

    // Bounce animation on launch
    item.addEventListener('click', () => {
      item.classList.add('dock-bounce');
      item.addEventListener('animationend', () => item.classList.remove('dock-bounce'), { once: true });
    });

    dockApps.appendChild(item);

    // Apply current dock size
    const px = OS.Theme._dockSize[OS.Theme._dockSizeCur] || 52;
    iconWrap.style.width = px + 'px';
    iconWrap.style.height = px + 'px';
  },

  setRunning(id, running) {
    const item = document.querySelector(`.dock-item[data-app-id="${id}"]`);
    if (!item) return;
    const dot = item.querySelector('.dock-running-dot');
    if (dot) dot.style.display = running ? 'block' : 'none';
  }
};


// ============================================================
// Menu — Menu Bar
// ============================================================
OS.Menu = {
  _currentApp: 'Finder',
  _menus: {},
  _dropdownOpen: false,

  init() {
    this._startClock();
    this._setupAppleMenu();
    this._setupCalendar();

    // Close dropdown on outside click via overlay
    const overlay = document.getElementById('dropdown-overlay');
    if (overlay) {
      overlay.addEventListener('click', () => this._hideDropdown());
    }
  },

  setApp(appId, appName, menus = []) {
    this._currentApp = appId;
    this._menus[appId] = menus;

    const nameEl = document.getElementById('menubar-app-name');
    if (nameEl) nameEl.textContent = appName;

    const appMenusEl = document.getElementById('menubar-app-menus');
    if (!appMenusEl) return;

    appMenusEl.innerHTML = '';

    menus.forEach(menu => {
      const menuBtn = document.createElement('div');
      menuBtn.className = 'menubar-item';
      menuBtn.textContent = menu.label;

      menuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (this._dropdownOpen) {
          this._hideDropdown();
        } else {
          this._showDropdown(menu.items || [], menuBtn);
        }
      });

      appMenusEl.appendChild(menuBtn);
    });
  },

  _startClock() {
    const clockEl = document.getElementById('menubar-clock');
    if (!clockEl) return;

    const update = () => {
      const now = new Date();
      const h = now.getHours().toString().padStart(2, '0');
      const m = now.getMinutes().toString().padStart(2, '0');
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      clockEl.textContent = `${days[now.getDay()]} ${months[now.getMonth()]} ${now.getDate()} ${h}:${m}`;
    };
    update();
    setInterval(update, 1000);
  },

  _setupCalendar() {
    const clockEl = document.getElementById('menubar-clock');
    if (!clockEl) return;

    clockEl.style.cursor = 'pointer';
    clockEl.addEventListener('click', (e) => {
      e.stopPropagation();
      const now = new Date();
      const months = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];

      // Build a simple calendar popover
      const items = [{
        label: `${months[now.getMonth()]} ${now.getFullYear()}`,
        action: null,
        disabled: true
      }];

      this._showDropdown(items, clockEl);
    });
  },

  _setupAppleMenu() {
    const appleBtn = document.getElementById('apple-menu-btn');
    if (!appleBtn) return;

    appleBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (this._dropdownOpen) {
        this._hideDropdown();
        return;
      }

      const items = [
        {
          label: 'About Fable OS',
          action: () => {
            OS.Notify.show('Fable OS', 'Version 1.0 — A macOS-inspired web OS built with love.', { icon: '🍎', duration: 5000 });
          }
        },
        { separator: true },
        {
          label: 'System Preferences',
          action: () => {
            if (OS.Apps && OS.Apps.Settings) OS.Apps.Settings.open();
          }
        },
        { separator: true },
        {
          label: 'Sleep',
          action: () => {
            const overlay = document.createElement('div');
            overlay.id = 'sleep-overlay';
            overlay.style.cssText = `
              position:fixed;top:0;left:0;width:100%;height:100%;
              background:rgba(0,0,0,0.92);z-index:99999;
              display:flex;align-items:center;justify-content:center;
              cursor:pointer;transition:opacity 0.5s;
            `;
            overlay.innerHTML = '<div style="color:rgba(255,255,255,0.15);font-size:48px;font-family:sans-serif;">💤</div>';
            document.body.appendChild(overlay);
            overlay.addEventListener('click', () => {
              overlay.style.opacity = '0';
              setTimeout(() => overlay.remove(), 500);
            });
          }
        },
        {
          label: 'Restart',
          action: () => {
            if (confirm('Are you sure you want to restart Fable OS?')) location.reload();
          }
        },
        {
          label: 'Shut Down',
          action: () => {
            if (confirm('Are you sure you want to shut down?')) {
              document.body.innerHTML = `
                <div style="
                  position:fixed;top:0;left:0;width:100%;height:100%;
                  background:#000;display:flex;align-items:center;justify-content:center;
                  color:rgba(255,255,255,0.3);font-family:sans-serif;font-size:24px;
                  letter-spacing:2px;
                ">System Shut Down</div>
              `;
            }
          }
        }
      ];

      this._showDropdown(items, appleBtn);
    });
  },

  _showDropdown(items, anchorEl) {
    const overlay = document.getElementById('dropdown-overlay');
    const menu = document.getElementById('dropdown-menu');
    if (!overlay || !menu) return;

    menu.innerHTML = '';

    items.forEach(item => {
      if (item.separator) {
        const sep = document.createElement('div');
        sep.className = 'dropdown-separator';
        menu.appendChild(sep);
        return;
      }

      const el = document.createElement('div');
      el.className = 'dropdown-item' + (item.disabled ? ' disabled' : '');
      el.textContent = item.label;

      if (item.action && !item.disabled) {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          this._hideDropdown();
          try { item.action(); } catch (err) { console.error('Menu action error:', err); }
        });
      }

      menu.appendChild(el);
    });

    // Position menu below anchor
    const rect = anchorEl.getBoundingClientRect();
    menu.style.left = rect.left + 'px';
    menu.style.top = rect.bottom + 'px';
    menu.style.minWidth = Math.max(180, rect.width) + 'px';

    overlay.style.display = 'block';
    menu.style.display = 'block';

    // Animate in
    requestAnimationFrame(() => {
      menu.classList.add('dropdown-visible');
    });

    this._dropdownOpen = true;
  },

  _hideDropdown() {
    const overlay = document.getElementById('dropdown-overlay');
    const menu = document.getElementById('dropdown-menu');
    if (overlay) overlay.style.display = 'none';
    if (menu) {
      menu.classList.remove('dropdown-visible');
      menu.style.display = 'none';
    }
    this._dropdownOpen = false;
  }
};


// ============================================================
// Desktop — Desktop Icons and Context Menu
// ============================================================
OS.Desktop = {
  _icons: [],

  init() {
    const desktop = document.getElementById('desktop');
    if (!desktop) return;

    // Right-click context menu
    desktop.addEventListener('contextmenu', (e) => {
      // Only trigger on the desktop itself, not on icons
      if (e.target.closest('.desktop-icon')) return;
      e.preventDefault();

      const items = [
        {
          label: 'Change Wallpaper',
          action: () => {
            OS.Theme.setWallpaper(OS.Theme._wIdx + 1);
          }
        },
        {
          label: 'New Folder',
          action: () => {
            const name = prompt('Folder name:', 'New Folder');
            if (!name) return;
            const path = '/Users/guest/Desktop/' + name;
            OS.VFS.mkdir(path);
            this.addIcon(
              'folder-' + Date.now(),
              name,
              `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="18" width="60" height="40" rx="6" fill="#FFD54F"/>
                <rect x="2" y="14" width="28" height="8" rx="4" fill="#FFB300"/>
              </svg>`,
              () => {
                if (OS.Apps && OS.Apps.Finder) OS.Apps.Finder.open(path);
              }
            );
          }
        },
        { separator: true },
        {
          label: 'Arrange Icons',
          action: () => {
            // Re-arrange icons in a grid
            const iconEls = document.querySelectorAll('#desktop-icons .desktop-icon');
            let col = 0, row = 0;
            const colGap = 90, rowGap = 100;
            const startX = 20, startY = 20;
            iconEls.forEach(el => {
              el.style.left = (startX + col * colGap) + 'px';
              el.style.top = (startY + row * rowGap) + 'px';
              row++;
              if ((row + 1) * rowGap > (window.innerHeight - 80)) {
                row = 0;
                col++;
              }
            });
          }
        }
      ];

      // Show as a context menu at mouse position
      this._showContextMenu(items, e.clientX, e.clientY);
    });

    // Click on desktop deselects icons
    desktop.addEventListener('click', (e) => {
      if (!e.target.closest('.desktop-icon')) {
        document.querySelectorAll('.desktop-icon.selected').forEach(el => el.classList.remove('selected'));
      }
      // Close any open context menus
      const ctxMenu = document.getElementById('desktop-context-menu');
      if (ctxMenu) ctxMenu.remove();
    });
  },

  _showContextMenu(items, x, y) {
    // Remove existing
    const existing = document.getElementById('desktop-context-menu');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.id = 'desktop-context-menu';
    menu.className = 'context-menu';
    menu.style.position = 'fixed';
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    menu.style.zIndex = '10000';

    items.forEach(item => {
      if (item.separator) {
        const sep = document.createElement('div');
        sep.className = 'context-menu-separator';
        menu.appendChild(sep);
        return;
      }
      const el = document.createElement('div');
      el.className = 'context-menu-item';
      el.textContent = item.label;
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.remove();
        if (item.action) item.action();
      });
      menu.appendChild(el);
    });

    document.body.appendChild(menu);

    // Clamp to viewport
    const rect = menu.getBoundingClientRect();
    if (rect.right > window.innerWidth) menu.style.left = (x - rect.width) + 'px';
    if (rect.bottom > window.innerHeight) menu.style.top = (y - rect.height) + 'px';

    // Close on outside click
    const dismiss = (e) => {
      if (!menu.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', dismiss, true);
      }
    };
    setTimeout(() => document.addEventListener('click', dismiss, true), 0);
  },

  addIcon(id, label, iconSVG, openFn) {
    this._icons.push({ id, label, iconSVG, openFn });

    const container = document.getElementById('desktop-icons');
    if (!container) return;

    const icon = document.createElement('div');
    icon.className = 'desktop-icon';
    icon.setAttribute('data-id', id);

    // Auto-position: stack down left side
    const existingCount = container.querySelectorAll('.desktop-icon').length;
    const startX = 20, startY = 20;
    const rowGap = 100;
    const maxRows = Math.floor((window.innerHeight - 100) / rowGap);
    const col = Math.floor(existingCount / maxRows);
    const row = existingCount % maxRows;
    icon.style.position = 'absolute';
    icon.style.left = (startX + col * 90) + 'px';
    icon.style.top = (startY + row * rowGap) + 'px';

    icon.innerHTML = `
      <div class="icon-img">${iconSVG}</div>
      <span class="icon-label">${label}</span>
    `;

    // Single click: select
    icon.addEventListener('click', (e) => {
      e.stopPropagation();
      document.querySelectorAll('.desktop-icon.selected').forEach(el => el.classList.remove('selected'));
      icon.classList.add('selected');
    });

    // Double click: open
    icon.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      OS.Audio.play('click');
      openFn();
    });

    // Make desktop icons draggable
    let dragging = false;
    let dragStartX, dragStartY, iconStartLeft, iconStartTop;

    icon.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      dragging = true;
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      iconStartLeft = parseInt(icon.style.left) || 0;
      iconStartTop = parseInt(icon.style.top) || 0;
      icon.setPointerCapture(e.pointerId);
      // Don't prevent default so clicks still work
    });

    icon.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - dragStartX;
      const dy = e.clientY - dragStartY;
      if (Math.abs(dx) > 4 || Math.abs(dy) > 4) {
        icon.style.left = (iconStartLeft + dx) + 'px';
        icon.style.top = (iconStartTop + dy) + 'px';
      }
    });

    icon.addEventListener('pointerup', () => { dragging = false; });
    icon.addEventListener('pointercancel', () => { dragging = false; });

    container.appendChild(icon);
  }
};


// ============================================================
// Boot — Boot Sequence
// ============================================================
OS.Boot = {
  start() {
    OS.Theme.load();
    OS.Menu.init();
    OS.Dock.init();
    OS.Desktop.init();

    const bar = document.getElementById('boot-bar');
    if (!bar) {
      // No boot screen — just show shell
      const shell = document.getElementById('os-shell');
      if (shell) shell.style.display = 'flex';
      return;
    }

    let progress = 0;

    const step = () => {
      progress += Math.random() * 15 + 5;

      if (progress >= 100) {
        bar.style.width = '100%';
        setTimeout(() => {
          // Play startup sound
          OS.Audio.play('startup');

          // Fade out boot screen
          const boot = document.getElementById('boot-screen');
          if (boot) {
            boot.style.transition = 'opacity 1s';
            boot.style.opacity = '0';
            setTimeout(() => {
              boot.style.display = 'none';
              const shell = document.getElementById('os-shell');
              if (shell) shell.style.display = 'flex';

              // Welcome notification
              setTimeout(() => {
                OS.Notify.show('Fable OS', 'Welcome! Your system is ready.', { icon: '🍎', duration: 4000 });
              }, 500);

              // Launch Finder by default
              setTimeout(() => {
                if (OS.Apps && OS.Apps.Finder) OS.Apps.Finder.open();
              }, 800);

            }, 1000);
          }
        }, 300);
        return;
      }

      bar.style.width = Math.min(progress, 99) + '%';
      setTimeout(step, Math.random() * 200 + 100);
    };

    setTimeout(step, 500);
  }
};


// ============================================================
// Don't auto-init here; apps.js will call OS.Boot.start() after registering all apps
// ============================================================
