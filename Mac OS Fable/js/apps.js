/**
 * Fable OS - Applications
 * Defines OS.Apps and registers all apps with Dock/Desktop.
 */

window.OS.Apps = {};

// ============================================================
// App 1: Finder
// ============================================================
OS.Apps.Finder = {
  label: 'Finder',
  icon: `<svg viewBox="0 0 60 60" width="48" height="48">
    <rect width="60" height="60" rx="14" fill="url(#fg)"/>
    <defs><linearGradient id="fg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3faeff"/>
      <stop offset="100%" stop-color="#0066cc"/>
    </linearGradient></defs>
    <circle cx="22" cy="26" r="5" fill="white"/>
    <circle cx="38" cy="26" r="5" fill="white"/>
    <path d="M18 40 Q30 50 42 40" stroke="white" stroke-width="3" fill="none" stroke-linecap="round"/>
    <circle cx="22" cy="26" r="2" fill="#3faeff"/>
    <circle cx="38" cy="26" r="2" fill="#3faeff"/>
  </svg>`,

  open() {
    if (OS.WM.isOpen('finder')) { OS.WM.focus('finder'); return; }

    OS.WM.open({
      id: 'finder',
      title: 'Finder',
      width: 720,
      height: 460,
      icon: '📁',
      render(container) {
        let cwd = '/Users/guest';
        let history = ['/Users/guest'];
        let histIdx = 0;
        let viewMode = 'icons';

        container.style.cssText = 'display:flex;height:100%;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,sans-serif;';

        // Sidebar
        const sidebar = document.createElement('div');
        sidebar.style.cssText = 'width:160px;min-width:120px;background:rgba(230,230,230,0.6);border-right:1px solid rgba(0,0,0,0.1);padding:8px 0;overflow-y:auto;flex-shrink:0;';
        sidebar.innerHTML = `
          <div style="padding:4px 12px;font-size:10px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;margin-bottom:2px;">Favorites</div>
        `;

        const favorites = [
          { label: 'Desktop', path: '/Users/guest/Desktop', icon: '🖥️' },
          { label: 'Documents', path: '/Users/guest/Documents', icon: '📄' },
          { label: 'Downloads', path: '/Users/guest/Downloads', icon: '⬇️' },
          { label: 'Applications', path: '/Users/guest/Applications', icon: '📦' },
        ];

        favorites.forEach(fav => {
          const item = document.createElement('div');
          item.style.cssText = 'padding:5px 14px;font-size:12px;cursor:pointer;border-radius:6px;margin:1px 4px;display:flex;align-items:center;gap:6px;';
          item.innerHTML = `<span style="font-size:14px;">${fav.icon}</span><span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${fav.label}</span>`;
          item.addEventListener('click', () => navigateTo(fav.path));
          item.addEventListener('mouseenter', () => item.style.background = 'rgba(0,0,0,0.08)');
          item.addEventListener('mouseleave', () => { if (cwd !== fav.path) item.style.background = ''; });
          sidebar.appendChild(item);
        });

        // Devices section
        const devLabel = document.createElement('div');
        devLabel.style.cssText = 'padding:10px 12px 4px;font-size:10px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:.5px;';
        devLabel.textContent = 'Devices';
        sidebar.appendChild(devLabel);

        const guestHome = document.createElement('div');
        guestHome.style.cssText = 'padding:5px 14px;font-size:12px;cursor:pointer;border-radius:6px;margin:1px 4px;display:flex;align-items:center;gap:6px;';
        guestHome.innerHTML = `<span style="font-size:14px;">💻</span><span>guest's Mac</span>`;
        guestHome.addEventListener('click', () => navigateTo('/Users/guest'));
        sidebar.appendChild(guestHome);

        // Main area
        const main = document.createElement('div');
        main.style.cssText = 'flex:1;display:flex;flex-direction:column;overflow:hidden;';

        // Toolbar
        const toolbar = document.createElement('div');
        toolbar.style.cssText = 'display:flex;align-items:center;padding:6px 10px;gap:6px;border-bottom:1px solid rgba(0,0,0,0.1);background:rgba(245,245,245,0.8);flex-shrink:0;';

        const btnStyle = 'border:none;background:rgba(0,0,0,0.07);border-radius:6px;padding:4px 8px;cursor:pointer;font-size:14px;line-height:1;';
        const backBtn = document.createElement('button');
        backBtn.style.cssText = btnStyle;
        backBtn.textContent = '‹';
        backBtn.title = 'Back';

        const fwdBtn = document.createElement('button');
        fwdBtn.style.cssText = btnStyle;
        fwdBtn.textContent = '›';
        fwdBtn.title = 'Forward';

        const breadcrumb = document.createElement('div');
        breadcrumb.style.cssText = 'flex:1;font-size:12px;color:#555;padding:0 8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';

        const viewIcons = document.createElement('button');
        viewIcons.style.cssText = btnStyle + 'font-size:12px;';
        viewIcons.textContent = '⊞';
        viewIcons.title = 'Icon view';

        const viewList = document.createElement('button');
        viewList.style.cssText = btnStyle + 'font-size:12px;';
        viewList.textContent = '☰';
        viewList.title = 'List view';

        toolbar.append(backBtn, fwdBtn, breadcrumb, viewIcons, viewList);

        // Content area
        const content = document.createElement('div');
        content.style.cssText = 'flex:1;overflow:auto;padding:10px;';

        main.append(toolbar, content);
        container.append(sidebar, main);

        // Navigation
        function navigateTo(path) {
          if (!OS.VFS.isDir(path)) return;
          if (path !== cwd) {
            history = history.slice(0, histIdx + 1);
            history.push(path);
            histIdx = history.length - 1;
          }
          cwd = path;
          renderContent();
          updateNav();
        }

        function updateNav() {
          backBtn.disabled = histIdx <= 0;
          fwdBtn.disabled = histIdx >= history.length - 1;
          backBtn.style.opacity = backBtn.disabled ? '0.3' : '1';
          fwdBtn.style.opacity = fwdBtn.disabled ? '0.3' : '1';

          const parts = cwd.split('/').filter(Boolean);
          breadcrumb.textContent = parts.join(' › ');

          // Highlight active sidebar item
          sidebar.querySelectorAll('[data-fav-path]').forEach(el => {
            el.style.background = el.getAttribute('data-fav-path') === cwd ? 'rgba(0,122,255,0.15)' : '';
          });
        }

        // Re-attach data-fav-path for sidebar highlight
        let sideFavEls = sidebar.querySelectorAll('div');
        favorites.forEach((fav, i) => {
          // find by position offset +1 (skip header)
          const el = sidebar.children[i + 1];
          if (el) el.setAttribute('data-fav-path', fav.path);
        });

        backBtn.addEventListener('click', () => {
          if (histIdx > 0) { histIdx--; cwd = history[histIdx]; renderContent(); updateNav(); }
        });
        fwdBtn.addEventListener('click', () => {
          if (histIdx < history.length - 1) { histIdx++; cwd = history[histIdx]; renderContent(); updateNav(); }
        });

        viewIcons.addEventListener('click', () => { viewMode = 'icons'; renderContent(); });
        viewList.addEventListener('click', () => { viewMode = 'list'; renderContent(); });

        function getFileIcon(item) {
          if (item.type === 'dir') return '📁';
          if (item.name.endsWith('.txt') || item.name.endsWith('.md')) return '📄';
          if (item.name.endsWith('.js') || item.name.endsWith('.json')) return '📝';
          if (item.name.endsWith('.png') || item.name.endsWith('.jpg')) return '🖼️';
          return '📎';
        }

        function showContextMenu(e, item) {
          e.preventDefault();
          const existing = document.getElementById('finder-ctx');
          if (existing) existing.remove();

          const menu = document.createElement('div');
          menu.id = 'finder-ctx';
          menu.style.cssText = `position:fixed;left:${e.clientX}px;top:${e.clientY}px;background:#fff;border:1px solid rgba(0,0,0,0.15);border-radius:8px;box-shadow:0 4px 20px rgba(0,0,0,0.2);z-index:99999;min-width:160px;padding:4px;font-size:13px;font-family:-apple-system,sans-serif;`;

          const menuItems = [];

          if (item) {
            menuItems.push({ label: 'Open', action: () => openItem(item) });
            menuItems.push({ label: 'Rename', action: () => renameItem(item) });
            menuItems.push({ label: 'Delete', action: () => deleteItem(item) });
            menuItems.push({ separator: true });
          }
          menuItems.push({ label: 'New Folder', action: () => newFolder() });

          menuItems.forEach(mi => {
            if (mi.separator) {
              const sep = document.createElement('div');
              sep.style.cssText = 'height:1px;background:rgba(0,0,0,0.1);margin:3px 0;';
              menu.appendChild(sep);
              return;
            }
            const el = document.createElement('div');
            el.style.cssText = 'padding:5px 12px;cursor:pointer;border-radius:5px;';
            el.textContent = mi.label;
            el.addEventListener('mouseenter', () => { el.style.background = '#007AFF'; el.style.color = '#fff'; });
            el.addEventListener('mouseleave', () => { el.style.background = ''; el.style.color = ''; });
            el.addEventListener('click', () => { menu.remove(); mi.action(); });
            menu.appendChild(el);
          });

          document.body.appendChild(menu);
          const closeMenu = (ev) => { if (!menu.contains(ev.target)) { menu.remove(); document.removeEventListener('mousedown', closeMenu); } };
          setTimeout(() => document.addEventListener('mousedown', closeMenu), 0);
        }

        function openItem(item) {
          const itemPath = cwd + '/' + item.name;
          if (item.type === 'dir') {
            navigateTo(itemPath);
          } else if (item.name.endsWith('.txt') || item.name.endsWith('.md') || item.name.endsWith('.js') || item.name.endsWith('.json')) {
            const content = OS.VFS.read(itemPath) || '';
            OS.WM.open({
              id: 'textview-' + item.name.replace(/[^a-z0-9]/gi, '_'),
              title: item.name,
              width: 500,
              height: 400,
              render(c) {
                c.innerHTML = `<pre style="padding:16px;margin:0;white-space:pre-wrap;word-break:break-all;font-family:monospace;font-size:13px;overflow:auto;height:100%;box-sizing:border-box;">${content.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</pre>`;
              }
            });
          }
        }

        function renameItem(item) {
          const newName = prompt('Rename to:', item.name);
          if (!newName || newName === item.name) return;
          const oldPath = cwd + '/' + item.name;
          const newPath = cwd + '/' + newName;
          if (item.type === 'dir') {
            const entries = OS.VFS.ls(oldPath) || [];
            OS.VFS.mkdir(newPath);
            entries.forEach(e => {
              if (e.type === 'file') {
                const fc = OS.VFS.read(oldPath + '/' + e.name);
                OS.VFS.write(newPath + '/' + e.name, fc || '');
              }
            });
            OS.VFS.rm(oldPath, true);
          } else {
            const fc = OS.VFS.read(oldPath);
            OS.VFS.write(newPath, fc || '');
            OS.VFS.rm(oldPath, false);
          }
          renderContent();
        }

        function deleteItem(item) {
          if (!confirm('Delete "' + item.name + '"?')) return;
          OS.VFS.rm(cwd + '/' + item.name, item.type === 'dir');
          renderContent();
        }

        function newFolder() {
          const name = prompt('New folder name:', 'New Folder');
          if (!name) return;
          OS.VFS.mkdir(cwd + '/' + name);
          renderContent();
        }

        function renderContent() {
          content.innerHTML = '';
          const entries = OS.VFS.ls(cwd) || [];

          // Context menu on empty space
          content.oncontextmenu = (e) => {
            if (e.target === content) showContextMenu(e, null);
          };

          if (viewMode === 'icons') {
            content.style.display = 'flex';
            content.style.flexWrap = 'wrap';
            content.style.alignContent = 'flex-start';
            content.style.gap = '8px';
            content.style.padding = '10px';

            entries.forEach(item => {
              const tile = document.createElement('div');
              tile.style.cssText = 'display:flex;flex-direction:column;align-items:center;width:72px;padding:6px;border-radius:8px;cursor:pointer;text-align:center;user-select:none;';
              tile.innerHTML = `<span style="font-size:36px;">${getFileIcon(item)}</span><span style="font-size:11px;margin-top:4px;word-break:break-all;overflow:hidden;max-height:32px;">${item.name}</span>`;
              tile.addEventListener('mouseenter', () => tile.style.background = 'rgba(0,122,255,0.1)');
              tile.addEventListener('mouseleave', () => tile.style.background = '');
              tile.addEventListener('dblclick', () => openItem(item));
              tile.addEventListener('contextmenu', (e) => { e.stopPropagation(); showContextMenu(e, item); });
              content.appendChild(tile);
            });

            if (entries.length === 0) {
              content.style.display = 'flex';
              content.style.alignItems = 'center';
              content.style.justifyContent = 'center';
              const empty = document.createElement('div');
              empty.style.cssText = 'color:#aaa;font-size:13px;';
              empty.textContent = 'This folder is empty';
              content.appendChild(empty);
            }

          } else {
            // List view
            content.style.display = 'block';
            content.style.padding = '0';

            const table = document.createElement('table');
            table.style.cssText = 'width:100%;border-collapse:collapse;font-size:12px;';
            table.innerHTML = `<thead><tr style="border-bottom:1px solid rgba(0,0,0,0.1);background:rgba(0,0,0,0.04);">
              <th style="text-align:left;padding:6px 10px;font-weight:600;color:#555;">Name</th>
              <th style="text-align:left;padding:6px 10px;font-weight:600;color:#555;">Kind</th>
              <th style="text-align:left;padding:6px 10px;font-weight:600;color:#555;">Size</th>
              <th style="text-align:left;padding:6px 10px;font-weight:600;color:#555;">Modified</th>
            </tr></thead>`;
            const tbody = document.createElement('tbody');

            entries.forEach(item => {
              const tr = document.createElement('tr');
              tr.style.cssText = 'border-bottom:1px solid rgba(0,0,0,0.05);cursor:pointer;';
              const kind = item.type === 'dir' ? 'Folder' : 'Document';
              const size = item.type === 'file' ? (item.size != null ? item.size + ' B' : '—') : '—';
              const mod = item.modified ? new Date(item.modified).toLocaleDateString() : '—';
              tr.innerHTML = `<td style="padding:5px 10px;">${getFileIcon(item)} ${item.name}</td>
                <td style="padding:5px 10px;color:#777;">${kind}</td>
                <td style="padding:5px 10px;color:#777;">${size}</td>
                <td style="padding:5px 10px;color:#777;">${mod}</td>`;
              tr.addEventListener('mouseenter', () => tr.style.background = 'rgba(0,122,255,0.07)');
              tr.addEventListener('mouseleave', () => tr.style.background = '');
              tr.addEventListener('dblclick', () => openItem(item));
              tr.addEventListener('contextmenu', (e) => { e.stopPropagation(); showContextMenu(e, item); });
              tbody.appendChild(tr);
            });

            table.appendChild(tbody);
            content.appendChild(table);

            if (entries.length === 0) {
              const empty = document.createElement('div');
              empty.style.cssText = 'color:#aaa;font-size:13px;text-align:center;padding:40px;';
              empty.textContent = 'This folder is empty';
              content.appendChild(empty);
            }
          }
        }

        // VFS change listener
        const vfsListener = (type, path) => {
          if (path.startsWith(cwd)) renderContent();
        };
        OS.VFS.onChange(vfsListener);

        renderContent();
        updateNav();
      }
    });

    OS.Menu.setApp('finder', 'Finder', [
      { label: 'File', items: [
        { label: 'New Folder', action: () => {
          const name = prompt('New folder name:', 'New Folder');
          if (name) OS.VFS.mkdir('/Users/guest/' + name);
        }},
        { separator: true },
        { label: 'Close Window', action: () => OS.WM.close('finder') }
      ]},
      { label: 'View', items: [
        { label: 'as Icons', action: () => {} },
        { label: 'as List', action: () => {} }
      ]}
    ]);
    OS.Dock.setRunning('finder', true);
  }
};

// ============================================================
// App 2: Terminal
// ============================================================
OS.Apps.Terminal = {
  label: 'Terminal',
  icon: `<svg viewBox="0 0 60 60" width="48" height="48">
    <rect width="60" height="60" rx="14" fill="#1a1a1a"/>
    <rect x="8" y="8" width="44" height="30" rx="4" fill="#0d0d0d"/>
    <text x="12" y="28" font-family="monospace" font-size="11" fill="#4cd964">$ ./run</text>
    <rect x="8" y="44" width="44" height="8" rx="4" fill="#2a2a2a"/>
  </svg>`,

  open() {
    if (OS.WM.isOpen('terminal')) { OS.WM.focus('terminal'); return; }

    OS.WM.open({
      id: 'terminal',
      title: 'Terminal — guest@fable',
      width: 680,
      height: 420,
      icon: '💻',
      render(container) {
        const uid = Date.now();
        container.style.cssText = 'background:#1a1a1a;height:100%;display:flex;flex-direction:column;overflow:hidden;';

        container.innerHTML = `
          <style>
            .term-out-${uid} { flex:1;overflow-y:auto;padding:10px 14px 4px;font-family:"SF Mono",Menlo,monospace;font-size:13px;line-height:1.5;color:#f0f0f0;word-break:break-all; }
            .term-row-${uid} { display:flex;align-items:center;padding:4px 14px 8px;flex-shrink:0; }
            .term-prompt-${uid} { font-family:"SF Mono",Menlo,monospace;font-size:13px;color:#4cd964;white-space:nowrap;margin-right:6px; }
            .term-input-${uid} { flex:1;background:transparent;border:none;outline:none;font-family:"SF Mono",Menlo,monospace;font-size:13px;color:#f0f0f0;caret-color:#f0f0f0; }
            .term-line { margin:0;padding:1px 0; }
            .term-err { color:#ff6b6b; }
            .term-ok { color:#4cd964; }
            .term-info { color:#74b9ff; }
            .term-warn { color:#fdcb6e; }
          </style>
          <div class="term-out-${uid}" id="tout-${uid}"></div>
          <div class="term-row-${uid}">
            <span class="term-prompt-${uid}" id="tprompt-${uid}">guest@fable:~$ </span>
            <input class="term-input-${uid}" id="tinput-${uid}" autocomplete="off" autocorrect="off" spellcheck="false" autofocus/>
          </div>
        `;

        const out = container.querySelector(`#tout-${uid}`);
        const input = container.querySelector(`#tinput-${uid}`);
        const promptEl = container.querySelector(`#tprompt-${uid}`);

        let cmdHistory = [];
        let histPos = -1;

        function updatePrompt() {
          let p = OS.VFS._cwd;
          p = p.replace('/Users/guest', '~');
          promptEl.textContent = `guest@fable:${p}$ `;
        }

        function appendLine(text, cls = '') {
          const p = document.createElement('p');
          p.className = 'term-line' + (cls ? ' ' + cls : '');
          p.innerHTML = text;
          out.appendChild(p);
          out.scrollTop = out.scrollHeight;
        }

        function appendRaw(html) {
          const div = document.createElement('div');
          div.innerHTML = html;
          out.appendChild(div);
          out.scrollTop = out.scrollHeight;
        }

        function esc(s) {
          return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
        }

        // Print welcome
        appendLine('<span class="term-info">Fable OS Terminal v1.0 — Type <b>help</b> for available commands.</span>');

        function runCommand(raw) {
          const trimmed = raw.trim();
          if (!trimmed) return;

          appendLine(`<span style="color:#4cd964">${esc(promptEl.textContent)}</span><span>${esc(trimmed)}</span>`);

          // Parse: handle echo X > file
          let cmd, args;
          const echoRedir = trimmed.match(/^echo\s+(.*?)\s*>\s*(.+)$/);
          if (echoRedir) {
            const text = echoRedir[1].replace(/^["']|["']$/g, '');
            const filePath = echoRedir[2].trim();
            const abs = OS.VFS.absPath(filePath);
            if (OS.VFS.write(abs, text)) {
              appendLine(`<span class="term-ok">Written to ${esc(abs)}</span>`);
            } else {
              appendLine(`<span class="term-err">Error: cannot write to ${esc(filePath)}</span>`);
            }
            return;
          }

          const parts = trimmed.split(/\s+/);
          cmd = parts[0];
          args = parts.slice(1);

          switch (cmd) {
            case 'clear':
              out.innerHTML = '';
              break;

            case 'help':
              appendRaw(`<p class="term-line term-info">Available commands:</p>
                <p class="term-line">  <b>ls</b> [-l] [path]   &nbsp; List directory</p>
                <p class="term-line">  <b>cd</b> [path]        &nbsp; Change directory</p>
                <p class="term-line">  <b>pwd</b>              &nbsp; Print working directory</p>
                <p class="term-line">  <b>cat</b> [file]       &nbsp; Print file contents</p>
                <p class="term-line">  <b>mkdir</b> [name]     &nbsp; Create directory</p>
                <p class="term-line">  <b>touch</b> [name]     &nbsp; Create empty file</p>
                <p class="term-line">  <b>rm</b> [-r] [name]   &nbsp; Remove file/directory</p>
                <p class="term-line">  <b>echo</b> [text]      &nbsp; Print text (or echo text > file)</p>
                <p class="term-line">  <b>date</b>             &nbsp; Current date/time</p>
                <p class="term-line">  <b>whoami</b>           &nbsp; Print current user</p>
                <p class="term-line">  <b>uname -a</b>         &nbsp; System info</p>
                <p class="term-line">  <b>open</b> [appname]   &nbsp; Open an app</p>
                <p class="term-line">  <b>neofetch</b>         &nbsp; System info art</p>
                <p class="term-line">  <b>clear</b>            &nbsp; Clear terminal</p>`);
              break;

            case 'pwd':
              appendLine(esc(OS.VFS._cwd));
              break;

            case 'whoami':
              appendLine('guest');
              break;

            case 'date':
              appendLine(new Date().toString());
              break;

            case 'uname':
              appendLine('Fable OS 1.0 fable-kernel #1 SMP x86_64');
              break;

            case 'ls': {
              const hasL = args.includes('-l');
              const pathArg = args.filter(a => !a.startsWith('-'))[0];
              const target = pathArg ? OS.VFS.absPath(pathArg) : OS.VFS._cwd;
              const entries = OS.VFS.ls(target);
              if (!entries) { appendLine(`<span class="term-err">ls: ${esc(target)}: No such directory</span>`); break; }
              if (entries.length === 0) { appendLine('<span class="term-info">(empty)</span>'); break; }
              if (hasL) {
                entries.forEach(e => {
                  const icon = e.type === 'dir' ? '📁' : '📄';
                  const size = e.type === 'file' ? (e.size != null ? e.size : 0) + 'B' : '-';
                  appendLine(`${icon} ${e.type === 'dir' ? '<span class="term-info">dir </span>' : 'file'} &nbsp;${size.toString().padStart(8)} &nbsp;${esc(e.name)}`);
                });
              } else {
                const line = entries.map(e => (e.type === 'dir' ? '📁 ' : '📄 ') + esc(e.name)).join('&nbsp;&nbsp; ');
                appendLine(line);
              }
              break;
            }

            case 'cd': {
              let target;
              if (!args[0] || args[0] === '~') {
                target = '/Users/guest';
              } else if (args[0] === '..') {
                const parts2 = OS.VFS._cwd.split('/').filter(Boolean);
                parts2.pop();
                target = '/' + parts2.join('/') || '/';
              } else {
                target = OS.VFS.absPath(args[0]);
              }
              if (!OS.VFS.isDir(target)) {
                appendLine(`<span class="term-err">cd: ${esc(args[0])}: No such directory</span>`);
              } else {
                OS.VFS._cwd = target;
                updatePrompt();
              }
              break;
            }

            case 'cat': {
              if (!args[0]) { appendLine('<span class="term-err">cat: missing operand</span>'); break; }
              const fp = OS.VFS.absPath(args[0]);
              const fc = OS.VFS.read(fp);
              if (fc === null) { appendLine(`<span class="term-err">cat: ${esc(args[0])}: No such file</span>`); break; }
              const pre = document.createElement('pre');
              pre.style.cssText = 'margin:0;padding:2px 0;white-space:pre-wrap;word-break:break-all;font-family:inherit;font-size:inherit;color:#f0f0f0;';
              pre.textContent = fc;
              out.appendChild(pre);
              out.scrollTop = out.scrollHeight;
              break;
            }

            case 'mkdir': {
              if (!args[0]) { appendLine('<span class="term-err">mkdir: missing operand</span>'); break; }
              const mp = OS.VFS.absPath(args[0]);
              if (OS.VFS.mkdir(mp)) {
                appendLine(`<span class="term-ok">Directory created: ${esc(mp)}</span>`);
              } else {
                appendLine(`<span class="term-err">mkdir: cannot create directory: ${esc(args[0])}</span>`);
              }
              break;
            }

            case 'touch': {
              if (!args[0]) { appendLine('<span class="term-err">touch: missing operand</span>'); break; }
              const tp = OS.VFS.absPath(args[0]);
              OS.VFS.touch(tp);
              appendLine(`<span class="term-ok">${esc(tp)}</span>`);
              break;
            }

            case 'rm': {
              const recur = args.includes('-r') || args.includes('-rf');
              const nameArg = args.filter(a => !a.startsWith('-'))[0];
              if (!nameArg) { appendLine('<span class="term-err">rm: missing operand</span>'); break; }
              const rp = OS.VFS.absPath(nameArg);
              if (!OS.VFS.exists(rp)) { appendLine(`<span class="term-err">rm: ${esc(nameArg)}: No such file or directory</span>`); break; }
              if (OS.VFS.isDir(rp) && !recur) { appendLine(`<span class="term-err">rm: ${esc(nameArg)}: is a directory (use -r)</span>`); break; }
              if (OS.VFS.rm(rp, recur)) {
                appendLine(`<span class="term-ok">Removed: ${esc(rp)}</span>`);
              } else {
                appendLine(`<span class="term-err">rm: failed to remove ${esc(nameArg)}</span>`);
              }
              break;
            }

            case 'echo': {
              appendLine(esc(args.join(' ')));
              break;
            }

            case 'open': {
              const appMap = {
                finder: 'Finder', terminal: 'Terminal', browser: 'Browser',
                music: 'Music', settings: 'Settings', mario: 'Mario'
              };
              const appKey = appMap[args[0] && args[0].toLowerCase()];
              if (appKey && OS.Apps[appKey]) {
                OS.Apps[appKey].open();
                appendLine(`<span class="term-ok">Opening ${esc(appKey)}...</span>`);
              } else {
                appendLine(`<span class="term-err">open: unknown app "${esc(args[0])}". Try: finder, terminal, browser, music, settings, mario</span>`);
              }
              break;
            }

            case 'neofetch': {
              const mode = OS.Theme._mode === 'dark' ? 'Dark' : 'Light';
              appendRaw(`<pre class="term-line" style="color:#74b9ff;font-family:monospace;font-size:12px;line-height:1.4;">          <span style="color:#ff7675">██████</span>         <span style="color:#f0f0f0">guest@fable</span>
         <span style="color:#ff7675">████████</span>        <span style="color:#555">-----------</span>
        <span style="color:#ff7675">██</span>  <span style="color:#ff7675">██</span>  <span style="color:#ff7675">██</span>       <span style="color:#74b9ff">OS:</span> Fable OS 1.0
       <span style="color:#ff7675">████████████</span>      <span style="color:#74b9ff">Host:</span> Fable Silicon Mac
      <span style="color:#ff7675">██████████████</span>     <span style="color:#74b9ff">Kernel:</span> fable-6.0.0
     <span style="color:#ff7675">████████████████</span>    <span style="color:#74b9ff">Shell:</span> zsh 5.9
    <span style="color:#ff7675">██████████████████</span>   <span style="color:#74b9ff">Resolution:</span> 1440x900
                         <span style="color:#74b9ff">Theme:</span> ${mode}
   <span style="color:#ff7675">████</span>  <span style="color:#ff7675">████</span>  <span style="color:#ff7675">████</span>      <span style="color:#74b9ff">Colors:</span> 🟥🟧🟨🟩🟦🟪</pre>`);
              break;
            }

            default:
              appendLine(`<span class="term-err">zsh: command not found: ${esc(cmd)}</span>`);
          }
        }

        input.addEventListener('keydown', e => {
          if (e.key === 'Enter') {
            const val = input.value;
            if (val.trim()) {
              cmdHistory.unshift(val);
              histPos = -1;
            }
            runCommand(val);
            input.value = '';
            e.preventDefault();
          } else if (e.key === 'ArrowUp') {
            if (histPos < cmdHistory.length - 1) histPos++;
            input.value = cmdHistory[histPos] || '';
            e.preventDefault();
          } else if (e.key === 'ArrowDown') {
            if (histPos > 0) histPos--;
            else { histPos = -1; input.value = ''; }
            input.value = histPos >= 0 ? cmdHistory[histPos] : '';
            e.preventDefault();
          }
        });

        // Click anywhere to focus input
        container.addEventListener('click', () => input.focus());
        input.focus();
        updatePrompt();
      }
    });
    OS.Dock.setRunning('terminal', true);
  }
};

// ============================================================
// App 3: Browser
// ============================================================
OS.Apps.Browser = {
  label: 'Browser',
  icon: `<svg viewBox="0 0 60 60" width="48" height="48">
    <rect width="60" height="60" rx="14" fill="url(#browserbg)"/>
    <defs><linearGradient id="browserbg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#1C7FE0"/>
      <stop offset="100%" stop-color="#23B5D3"/>
    </linearGradient></defs>
    <circle cx="30" cy="30" r="18" stroke="white" stroke-width="2" fill="none"/>
    <ellipse cx="30" cy="30" rx="8" ry="18" stroke="white" stroke-width="1.5" fill="none"/>
    <line x1="12" y1="30" x2="48" y2="30" stroke="white" stroke-width="1.5"/>
    <line x1="30" y1="12" x2="30" y2="48" stroke="white" stroke-width="1.5"/>
  </svg>`,

  open() {
    if (OS.WM.isOpen('browser')) { OS.WM.focus('browser'); return; }

    OS.WM.open({
      id: 'browser',
      title: 'Fable Browser',
      width: 800,
      height: 540,
      icon: '🌐',
      render(container) {
        container.style.cssText = 'display:flex;flex-direction:column;height:100%;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,sans-serif;';

        let tabs = [{ id: 1, url: 'fable://newtab', title: 'New Tab', histIdx: 0, history: ['fable://newtab'] }];
        let activeTab = 0;
        let nextTabId = 2;

        // Tab bar
        const tabBar = document.createElement('div');
        tabBar.style.cssText = 'display:flex;align-items:center;background:#e8e8e8;border-bottom:1px solid rgba(0,0,0,0.12);padding:4px 8px 0;gap:2px;flex-shrink:0;overflow-x:auto;';

        // Toolbar
        const toolbar = document.createElement('div');
        toolbar.style.cssText = 'display:flex;align-items:center;padding:6px 8px;gap:6px;background:#f5f5f5;border-bottom:1px solid rgba(0,0,0,0.1);flex-shrink:0;';

        const btnS = 'border:none;background:rgba(0,0,0,0.07);border-radius:6px;padding:4px 8px;cursor:pointer;font-size:14px;line-height:1;';
        const backBtn = document.createElement('button');
        backBtn.style.cssText = btnS;
        backBtn.textContent = '‹';

        const fwdBtn = document.createElement('button');
        fwdBtn.style.cssText = btnS;
        fwdBtn.textContent = '›';

        const refBtn = document.createElement('button');
        refBtn.style.cssText = btnS;
        refBtn.textContent = '↻';

        const urlBar = document.createElement('input');
        urlBar.style.cssText = 'flex:1;border:1px solid rgba(0,0,0,0.15);border-radius:8px;padding:5px 10px;font-size:13px;outline:none;background:#fff;';
        urlBar.placeholder = 'Enter URL or search...';

        toolbar.append(backBtn, fwdBtn, refBtn, urlBar);

        // Viewport
        const viewport = document.createElement('div');
        viewport.style.cssText = 'flex:1;overflow:auto;background:#fff;position:relative;';

        container.append(tabBar, toolbar, viewport);

        function getNewtabHTML() {
          return `<div style="min-height:100%;background:linear-gradient(135deg,#1a1a2e,#16213e);display:flex;flex-direction:column;align-items:center;justify-content:center;font-family:-apple-system,sans-serif;color:#fff;padding:40px;">
            <div style="font-size:48px;margin-bottom:8px;">🌐</div>
            <h1 style="margin:0 0 4px;font-size:28px;font-weight:300;">Fable Browser</h1>
            <p style="color:rgba(255,255,255,0.5);margin:0 0 28px;font-size:14px;">Your gateway to the web</p>
            <div style="display:flex;gap:10px;margin-bottom:36px;">
              <input id="newtab-search" placeholder="Search or enter URL..." style="border:none;border-radius:12px;padding:10px 18px;font-size:15px;width:340px;outline:none;background:rgba(255,255,255,0.15);color:#fff;" />
              <button onclick="document.getElementById('newtab-search') && (function(v){if(v)window._browserNav('fable://search?q='+encodeURIComponent(v));})(document.getElementById('newtab-search').value)" style="border:none;border-radius:12px;padding:10px 18px;font-size:14px;background:#007AFF;color:#fff;cursor:pointer;">Go</button>
            </div>
            <div style="display:flex;gap:16px;flex-wrap:wrap;justify-content:center;">
              ${[['📁','Finder','finder'],['⚙️','Settings','settings'],['🎵','Music','music'],['💻','Terminal','terminal']].map(([ico,lbl,app])=>`<div onclick="OS.Apps.${app.charAt(0).toUpperCase()+app.slice(1)}.open()" style="background:rgba(255,255,255,0.1);border-radius:14px;padding:18px 22px;cursor:pointer;text-align:center;min-width:80px;transition:background 0.2s;" onmouseover="this.style.background='rgba(255,255,255,0.2)'" onmouseout="this.style.background='rgba(255,255,255,0.1)'"><div style="font-size:28px;">${ico}</div><div style="font-size:12px;margin-top:6px;opacity:0.8;">${lbl}</div></div>`).join('')}
            </div>
          </div>`;
        }

        function getSearchHTML(q) {
          const query = decodeURIComponent(q || '');
          const results = [
            { title: query + ' - Wikipedia', url: 'https://en.wikipedia.org', desc: 'The free encyclopedia has an article on ' + query + '. Read more about this topic...' },
            { title: 'Learn about ' + query, url: 'https://www.google.com/search?q=' + encodeURIComponent(query), desc: 'Search results for ' + query + ' from across the web.' },
            { title: query + ' News', url: '#', desc: 'Latest news and updates about ' + query + '.' },
          ];
          return `<div style="font-family:-apple-system,sans-serif;padding:24px;max-width:700px;margin:0 auto;">
            <div style="font-size:22px;font-weight:300;margin-bottom:4px;color:#333;">Results for: <b>${query.replace(/</g,'&lt;')}</b></div>
            <div style="color:#999;font-size:13px;margin-bottom:24px;">About 3 results (simulated)</div>
            ${results.map(r=>`<div style="margin-bottom:20px;"><div style="color:#1a73e8;font-size:16px;cursor:pointer;text-decoration:underline;" onclick="window._browserNav('${r.url}')">${r.title}</div><div style="color:#006621;font-size:12px;margin:2px 0;">${r.url}</div><div style="color:#555;font-size:13px;">${r.desc}</div></div>`).join('')}
          </div>`;
        }

        function getAboutHTML() {
          return `<div style="font-family:-apple-system,sans-serif;min-height:100%;background:linear-gradient(135deg,#667eea,#764ba2);display:flex;align-items:center;justify-content:center;color:#fff;">
            <div style="text-align:center;padding:40px;">
              <div style="font-size:64px;margin-bottom:16px;">🍎</div>
              <h1 style="margin:0 0 8px;font-size:36px;font-weight:200;">Fable OS</h1>
              <p style="margin:4px 0;opacity:0.7;">Version 1.0</p>
              <p style="margin:4px 0;opacity:0.7;">Fable Browser 1.0</p>
              <p style="margin:20px 0 0;opacity:0.5;font-size:13px;">A macOS-inspired web operating system.</p>
            </div>
          </div>`;
        }

        function getErrorHTML(url) {
          return `<div style="font-family:-apple-system,sans-serif;min-height:100%;display:flex;align-items:center;justify-content:center;background:#f5f5f5;">
            <div style="text-align:center;padding:40px;">
              <div style="font-size:48px;margin-bottom:12px;">🚫</div>
              <h2 style="margin:0 0 8px;color:#333;">Can't connect to this page</h2>
              <p style="color:#888;font-size:14px;margin:0;">${(url||'').replace(/</g,'&lt;')}</p>
              <p style="color:#aaa;font-size:12px;margin:12px 0 0;">The page may have blocked embedding, or check your URL.</p>
            </div>
          </div>`;
        }

        function renderViewport() {
          viewport.innerHTML = '';
          const tab = tabs[activeTab];
          if (!tab) return;

          const url = tab.url;
          urlBar.value = url;

          if (url === 'fable://newtab') {
            viewport.innerHTML = getNewtabHTML();
            const si = viewport.querySelector('#newtab-search');
            if (si) {
              si.addEventListener('keydown', e => {
                if (e.key === 'Enter' && si.value) navigate('fable://search?q=' + encodeURIComponent(si.value));
              });
            }
          } else if (url.startsWith('fable://search?q=')) {
            const q = url.slice('fable://search?q='.length);
            viewport.innerHTML = getSearchHTML(q);
          } else if (url === 'fable://about') {
            viewport.innerHTML = getAboutHTML();
          } else if (url === 'fable://error') {
            viewport.innerHTML = getErrorHTML('');
          } else {
            // External URL — load in iframe
            const loadingDiv = document.createElement('div');
            loadingDiv.style.cssText = 'display:flex;align-items:center;justify-content:center;height:100%;color:#999;font-size:14px;font-family:-apple-system,sans-serif;';
            loadingDiv.textContent = 'Loading...';
            viewport.appendChild(loadingDiv);

            const iframe = document.createElement('iframe');
            iframe.style.cssText = 'width:100%;height:100%;border:none;display:none;';
            iframe.sandbox = 'allow-scripts allow-same-origin allow-forms allow-popups';
            viewport.appendChild(iframe);

            iframe.addEventListener('load', () => {
              loadingDiv.remove();
              iframe.style.display = '';
              try {
                const t = iframe.contentDocument && iframe.contentDocument.title;
                if (t) updateTabTitle(t);
              } catch(e) {}
            });

            iframe.addEventListener('error', () => {
              viewport.innerHTML = getErrorHTML(url);
            });

            iframe.src = url;

            // If blocked by X-Frame-Options, the load event fires but content is replaced
            setTimeout(() => {
              try {
                if (iframe.contentDocument && iframe.contentDocument.body && !iframe.contentDocument.body.children.length) {
                  viewport.innerHTML = getErrorHTML(url);
                }
              } catch(e) {
                viewport.innerHTML = getErrorHTML(url);
              }
            }, 3000);
          }
        }

        function updateTabTitle(t) {
          if (tabs[activeTab]) tabs[activeTab].title = t;
          renderTabs();
        }

        function navigate(url) {
          let finalUrl = url.trim();
          if (!finalUrl) return;
          if (!finalUrl.startsWith('fable://') && !finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
            if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
              finalUrl = 'https://' + finalUrl;
            } else {
              finalUrl = 'fable://search?q=' + encodeURIComponent(finalUrl);
            }
          }
          const tab = tabs[activeTab];
          if (!tab) return;
          tab.history = tab.history.slice(0, tab.histIdx + 1);
          tab.history.push(finalUrl);
          tab.histIdx = tab.history.length - 1;
          tab.url = finalUrl;

          // Update title from URL
          if (finalUrl === 'fable://newtab') tab.title = 'New Tab';
          else if (finalUrl.startsWith('fable://search')) tab.title = 'Search';
          else if (finalUrl === 'fable://about') tab.title = 'About';
          else tab.title = finalUrl.replace(/^https?:\/\//, '').split('/')[0] || finalUrl;

          renderTabs();
          renderViewport();
        }

        // Expose for newtab onclick
        window._browserNav = navigate;

        function renderTabs() {
          tabBar.innerHTML = '';
          tabs.forEach((tab, i) => {
            const tabEl = document.createElement('div');
            const isActive = i === activeTab;
            tabEl.style.cssText = `display:flex;align-items:center;gap:6px;padding:5px 10px 6px;border-radius:8px 8px 0 0;cursor:pointer;font-size:12px;min-width:80px;max-width:160px;white-space:nowrap;overflow:hidden;flex-shrink:0;${isActive ? 'background:#fff;border:1px solid rgba(0,0,0,0.1);border-bottom:none;color:#333;' : 'background:transparent;color:#666;'}`;
            const title = document.createElement('span');
            title.style.cssText = 'overflow:hidden;text-overflow:ellipsis;flex:1;';
            title.textContent = tab.title;

            const closeBtn = document.createElement('span');
            closeBtn.style.cssText = 'font-size:11px;opacity:0.5;flex-shrink:0;line-height:1;padding:1px 2px;border-radius:3px;';
            closeBtn.textContent = '×';
            closeBtn.addEventListener('mouseenter', () => closeBtn.style.opacity = '1');
            closeBtn.addEventListener('mouseleave', () => closeBtn.style.opacity = '0.5');
            closeBtn.addEventListener('click', (e) => {
              e.stopPropagation();
              if (tabs.length <= 1) { tabs = [{ id: nextTabId++, url: 'fable://newtab', title: 'New Tab', histIdx: 0, history: ['fable://newtab'] }]; activeTab = 0; }
              else { tabs.splice(i, 1); if (activeTab >= tabs.length) activeTab = tabs.length - 1; }
              renderTabs(); renderViewport();
            });

            tabEl.append(title, closeBtn);
            tabEl.addEventListener('click', () => { activeTab = i; renderTabs(); renderViewport(); });
            tabBar.appendChild(tabEl);
          });

          // Add tab button
          const addBtn = document.createElement('button');
          addBtn.style.cssText = 'border:none;background:transparent;font-size:18px;cursor:pointer;padding:2px 8px;color:#666;border-radius:6px;flex-shrink:0;';
          addBtn.textContent = '+';
          addBtn.addEventListener('click', () => {
            tabs.push({ id: nextTabId++, url: 'fable://newtab', title: 'New Tab', histIdx: 0, history: ['fable://newtab'] });
            activeTab = tabs.length - 1;
            renderTabs(); renderViewport();
          });
          tabBar.appendChild(addBtn);
        }

        backBtn.addEventListener('click', () => {
          const tab = tabs[activeTab];
          if (tab && tab.histIdx > 0) { tab.histIdx--; tab.url = tab.history[tab.histIdx]; renderTabs(); renderViewport(); }
        });
        fwdBtn.addEventListener('click', () => {
          const tab = tabs[activeTab];
          if (tab && tab.histIdx < tab.history.length - 1) { tab.histIdx++; tab.url = tab.history[tab.histIdx]; renderTabs(); renderViewport(); }
        });
        refBtn.addEventListener('click', () => renderViewport());

        urlBar.addEventListener('keydown', e => {
          if (e.key === 'Enter') navigate(urlBar.value);
        });

        renderTabs();
        renderViewport();
      }
    });
    OS.Dock.setRunning('browser', true);
  }
};

// ============================================================
// App 4: Settings
// ============================================================
OS.Apps.Settings = {
  label: 'System Preferences',
  icon: `<svg viewBox="0 0 60 60" width="48" height="48">
    <rect width="60" height="60" rx="14" fill="#8e8e93"/>
    <circle cx="30" cy="30" r="14" stroke="white" stroke-width="3" fill="none"/>
    <circle cx="30" cy="30" r="5" fill="white"/>
    <rect x="28" y="10" width="4" height="8" rx="2" fill="white" transform="rotate(0 30 30)"/>
    <rect x="28" y="10" width="4" height="8" rx="2" fill="white" transform="rotate(45 30 30)"/>
    <rect x="28" y="10" width="4" height="8" rx="2" fill="white" transform="rotate(90 30 30)"/>
    <rect x="28" y="10" width="4" height="8" rx="2" fill="white" transform="rotate(135 30 30)"/>
    <rect x="28" y="10" width="4" height="8" rx="2" fill="white" transform="rotate(180 30 30)"/>
    <rect x="28" y="10" width="4" height="8" rx="2" fill="white" transform="rotate(225 30 30)"/>
    <rect x="28" y="10" width="4" height="8" rx="2" fill="white" transform="rotate(270 30 30)"/>
    <rect x="28" y="10" width="4" height="8" rx="2" fill="white" transform="rotate(315 30 30)"/>
  </svg>`,

  open() {
    if (OS.WM.isOpen('settings')) { OS.WM.focus('settings'); return; }

    OS.WM.open({
      id: 'settings',
      title: 'System Preferences',
      width: 620,
      height: 450,
      icon: '⚙️',
      render(container) {
        container.style.cssText = 'display:flex;height:100%;overflow:hidden;font-family:-apple-system,BlinkMacSystemFont,sans-serif;';

        const navItems = ['Appearance', 'Wallpaper', 'Sound', 'Dock', 'About This Mac'];
        let activeSection = 'Appearance';

        // Sidebar
        const sidebar = document.createElement('div');
        sidebar.style.cssText = 'width:160px;background:rgba(230,230,230,0.6);border-right:1px solid rgba(0,0,0,0.1);padding:12px 8px;overflow-y:auto;flex-shrink:0;';

        // Main panel
        const panel = document.createElement('div');
        panel.style.cssText = 'flex:1;overflow-y:auto;padding:24px;';

        container.append(sidebar, panel);

        function renderSidebar() {
          sidebar.innerHTML = '';
          navItems.forEach(item => {
            const el = document.createElement('div');
            const isActive = item === activeSection;
            el.style.cssText = `padding:7px 12px;border-radius:8px;cursor:pointer;font-size:13px;margin:1px 0;${isActive ? 'background:#007AFF;color:#fff;' : 'color:#333;'}`;
            el.textContent = item;
            el.addEventListener('click', () => { activeSection = item; renderSidebar(); renderPanel(); });
            sidebar.appendChild(el);
          });
        }

        function sectionTitle(t) {
          return `<h2 style="margin:0 0 20px;font-size:18px;font-weight:600;color:#333;">${t}</h2>`;
        }

        function row(label, control) {
          return `<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(0,0,0,0.07);">
            <span style="font-size:14px;color:#333;">${label}</span>
            <div>${control}</div>
          </div>`;
        }

        function renderPanel() {
          panel.innerHTML = '';

          if (activeSection === 'Appearance') {
            panel.innerHTML = sectionTitle('Appearance');

            // Light/Dark toggle
            const modeRow = document.createElement('div');
            modeRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(0,0,0,0.07);';
            modeRow.innerHTML = '<span style="font-size:14px;color:#333;">Appearance</span>';
            const modeGroup = document.createElement('div');
            modeGroup.style.cssText = 'display:flex;gap:4px;';
            ['Light', 'Dark'].forEach(m => {
              const btn = document.createElement('button');
              const isActive = OS.Theme._mode === m.toLowerCase();
              btn.style.cssText = `border:1px solid rgba(0,0,0,0.2);border-radius:8px;padding:5px 14px;font-size:13px;cursor:pointer;${isActive ? 'background:#007AFF;color:#fff;border-color:#007AFF;' : 'background:#fff;color:#333;'}`;
              btn.textContent = m;
              btn.addEventListener('click', () => {
                if (OS.Theme._mode !== m.toLowerCase()) { OS.Theme.toggle(); renderPanel(); }
              });
              modeGroup.appendChild(btn);
            });
            modeRow.appendChild(modeGroup);
            panel.appendChild(modeRow);

            // Accent colors
            const accentRow = document.createElement('div');
            accentRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(0,0,0,0.07);';
            accentRow.innerHTML = '<span style="font-size:14px;color:#333;">Accent Color</span>';
            const swatches = document.createElement('div');
            swatches.style.cssText = 'display:flex;gap:8px;';
            const colors = ['#007AFF','#FF3B30','#FF9500','#34C759','#AF52DE','#FF2D55'];
            colors.forEach(c => {
              const sw = document.createElement('div');
              const isSelected = OS.Theme._accent === c;
              sw.style.cssText = `width:22px;height:22px;border-radius:50%;background:${c};cursor:pointer;border:${isSelected ? '3px solid #fff' : '2px solid transparent'};box-shadow:${isSelected ? '0 0 0 2px '+c : 'none'};transition:all 0.15s;`;
              sw.addEventListener('click', () => { OS.Theme.setAccent(c); renderPanel(); });
              swatches.appendChild(sw);
            });
            accentRow.appendChild(swatches);
            panel.appendChild(accentRow);

          } else if (activeSection === 'Wallpaper') {
            panel.innerHTML = sectionTitle('Wallpaper');
            const grid = document.createElement('div');
            grid.style.cssText = 'display:grid;grid-template-columns:repeat(4,1fr);gap:10px;';
            OS.Theme._wallpapers.forEach((wp, i) => {
              const thumb = document.createElement('div');
              const isSelected = OS.Theme._wIdx === i;
              thumb.style.cssText = `height:70px;border-radius:10px;background:${wp};cursor:pointer;border:3px solid ${isSelected ? '#007AFF' : 'transparent'};box-sizing:border-box;transition:border-color 0.15s;`;
              thumb.addEventListener('click', () => { OS.Theme.setWallpaper(i); renderPanel(); });
              grid.appendChild(thumb);
            });
            panel.appendChild(grid);

          } else if (activeSection === 'Sound') {
            panel.innerHTML = sectionTitle('Sound');

            const soundRow = document.createElement('div');
            soundRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(0,0,0,0.07);';
            soundRow.innerHTML = '<span style="font-size:14px;color:#333;">System Sounds</span>';
            const toggle = document.createElement('button');
            toggle.style.cssText = `border:none;border-radius:14px;padding:4px;width:50px;height:28px;cursor:pointer;transition:background 0.2s;position:relative;background:${OS.Audio._enabled ? '#34C759' : '#ccc'};`;
            const knob = document.createElement('div');
            knob.style.cssText = `width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,0.3);position:absolute;top:3px;transition:left 0.2s;left:${OS.Audio._enabled ? '24px' : '3px'};`;
            toggle.appendChild(knob);
            toggle.addEventListener('click', () => {
              OS.Audio._enabled = !OS.Audio._enabled;
              toggle.style.background = OS.Audio._enabled ? '#34C759' : '#ccc';
              knob.style.left = OS.Audio._enabled ? '24px' : '3px';
            });
            soundRow.appendChild(toggle);
            panel.appendChild(soundRow);

            const volRow = document.createElement('div');
            volRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(0,0,0,0.07);';
            volRow.innerHTML = '<span style="font-size:14px;color:#333;">Volume</span>';
            const vol = document.createElement('input');
            vol.type = 'range'; vol.min = '0'; vol.max = '100'; vol.value = '70';
            vol.style.cssText = 'width:160px;accent-color:#007AFF;';
            volRow.appendChild(vol);
            panel.appendChild(volRow);

          } else if (activeSection === 'Dock') {
            panel.innerHTML = sectionTitle('Dock');

            const dockRow = document.createElement('div');
            dockRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:12px 0;border-bottom:1px solid rgba(0,0,0,0.07);';
            dockRow.innerHTML = '<span style="font-size:14px;color:#333;">Dock Size</span>';
            const sizeGroup = document.createElement('div');
            sizeGroup.style.cssText = 'display:flex;gap:4px;';
            ['small','medium','large'].forEach(s => {
              const btn = document.createElement('button');
              const isActive = OS.Theme._dockSizeCur === s;
              btn.style.cssText = `border:1px solid rgba(0,0,0,0.2);border-radius:8px;padding:5px 12px;font-size:13px;cursor:pointer;text-transform:capitalize;${isActive ? 'background:#007AFF;color:#fff;border-color:#007AFF;' : 'background:#fff;color:#333;'}`;
              btn.textContent = s.charAt(0).toUpperCase() + s.slice(1);
              btn.addEventListener('click', () => { OS.Theme.setDockSize(s); renderPanel(); });
              sizeGroup.appendChild(btn);
            });
            dockRow.appendChild(sizeGroup);
            panel.appendChild(dockRow);

          } else if (activeSection === 'About This Mac') {
            panel.innerHTML = sectionTitle('About This Mac');

            const logo = document.createElement('div');
            logo.style.cssText = 'text-align:center;margin-bottom:24px;';
            logo.innerHTML = '<div style="font-size:64px;">🍎</div><div style="font-size:20px;font-weight:300;color:#333;margin-top:8px;">Fable OS</div>';
            panel.appendChild(logo);

            const specs = [
              ['macOS Version', 'Fable OS 1.0'],
              ['Processor', 'Fable Silicon'],
              ['Memory', '8 GB'],
              ['Storage', '256 GB SSD'],
              ['Serial Number', 'FABLE-2025'],
            ];
            const tbl = document.createElement('table');
            tbl.style.cssText = 'width:100%;border-collapse:collapse;font-size:13px;';
            specs.forEach(([k,v]) => {
              const tr = document.createElement('tr');
              tr.innerHTML = `<td style="padding:8px 12px 8px 0;color:#888;font-weight:500;white-space:nowrap;">${k}</td><td style="padding:8px 0;color:#333;">${v}</td>`;
              tbl.appendChild(tr);
            });
            panel.appendChild(tbl);
          }
        }

        renderSidebar();
        renderPanel();
      }
    });
    OS.Dock.setRunning('settings', true);
  }
};

// ============================================================
// App 5: Music Player
// ============================================================
OS.Apps.Music = {
  label: 'Music',
  icon: `<svg viewBox="0 0 60 60" width="48" height="48">
    <rect width="60" height="60" rx="14" fill="url(#mg)"/>
    <defs><linearGradient id="mg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fc3d7e"/>
      <stop offset="100%" stop-color="#c22050"/>
    </linearGradient></defs>
    <circle cx="22" cy="38" r="6" fill="white" opacity="0.9"/>
    <circle cx="40" cy="34" r="6" fill="white" opacity="0.9"/>
    <rect x="26" y="10" width="20" height="24" rx="3" fill="none" stroke="white" stroke-width="2.5"/>
    <line x1="28" y1="16" x2="44" y2="16" stroke="white" stroke-width="2" opacity="0.7"/>
    <line x1="28" y1="21" x2="44" y2="21" stroke="white" stroke-width="2" opacity="0.7"/>
  </svg>`,

  open() {
    if (OS.WM.isOpen('music')) { OS.WM.focus('music'); return; }

    OS.WM.open({
      id: 'music',
      title: 'Music',
      width: 340,
      height: 500,
      icon: '🎵',
      render(container) {
        const songs = [
          { title: 'Neon Dreams', artist: 'Fable Beats', duration: 30, colors: ['#ff6b6b','#feca57'], wave: 'square', notes: [261.63,329.63,392.00,493.88], tempo: 120 },
          { title: 'Crystal Cave', artist: 'SynthWave', duration: 28, colors: ['#48dbfb','#0abde3'], wave: 'triangle', notes: [220.00,261.63,329.63,440.00], tempo: 100 },
          { title: 'Purple Rain', artist: 'Chiptune', duration: 32, colors: ['#a29bfe','#6c5ce7'], wave: 'sine', notes: [293.66,349.23,440.00,587.33], tempo: 140 }
        ];

        let currentSong = 0;
        let isPlaying = false;
        let currentTime = 0;
        let volume = 0.7;
        let progressTimer = null;
        let audioNodes = [];
        let masterGain = null;
        let audioCtx = null;
        let loopTimeout = null;

        container.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:20px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;overflow:hidden;height:100%;box-sizing:border-box;';

        container.innerHTML = `
          <style>
            @keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
            .music-spinning { animation:spin 3s linear infinite; }
          </style>
          <div id="music-disc" style="width:160px;height:160px;border-radius:50%;background:linear-gradient(135deg,#ff6b6b,#feca57);display:flex;align-items:center;justify-content:center;margin-bottom:20px;box-shadow:0 8px 32px rgba(0,0,0,0.2);flex-shrink:0;">
            <div style="width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;font-size:18px;">🎵</div>
          </div>
          <div id="music-title" style="font-size:18px;font-weight:600;color:#333;margin-bottom:4px;text-align:center;"></div>
          <div id="music-artist" style="font-size:14px;color:#888;margin-bottom:20px;text-align:center;"></div>
          <div style="width:100%;margin-bottom:8px;">
            <input type="range" id="music-seek" min="0" max="30" value="0" step="0.1" style="width:100%;accent-color:#fc3d7e;cursor:pointer;"/>
          </div>
          <div style="display:flex;justify-content:space-between;width:100%;font-size:12px;color:#aaa;margin-bottom:16px;">
            <span id="music-cur">0:00</span>
            <span id="music-dur">0:30</span>
          </div>
          <div style="display:flex;gap:16px;align-items:center;margin-bottom:20px;">
            <button id="music-prev" style="border:none;background:none;font-size:24px;cursor:pointer;padding:8px;">⏮</button>
            <button id="music-play" style="border:none;background:#fc3d7e;border-radius:50%;width:52px;height:52px;font-size:22px;cursor:pointer;color:#fff;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 16px rgba(252,61,126,0.4);">▶</button>
            <button id="music-next" style="border:none;background:none;font-size:24px;cursor:pointer;padding:8px;">⏭</button>
          </div>
          <div style="display:flex;align-items:center;gap:10px;width:100%;">
            <span style="font-size:16px;">🔈</span>
            <input type="range" id="music-vol" min="0" max="1" step="0.05" value="0.7" style="flex:1;accent-color:#fc3d7e;"/>
            <span style="font-size:16px;">🔊</span>
          </div>
        `;

        const disc = container.querySelector('#music-disc');
        const titleEl = container.querySelector('#music-title');
        const artistEl = container.querySelector('#music-artist');
        const seekBar = container.querySelector('#music-seek');
        const curEl = container.querySelector('#music-cur');
        const durEl = container.querySelector('#music-dur');
        const playBtn = container.querySelector('#music-play');
        const prevBtn = container.querySelector('#music-prev');
        const nextBtn = container.querySelector('#music-next');
        const volBar = container.querySelector('#music-vol');

        function fmtTime(s) {
          const m = Math.floor(s / 60);
          const sec = Math.floor(s % 60);
          return m + ':' + sec.toString().padStart(2,'0');
        }

        function updateDisplay() {
          const song = songs[currentSong];
          titleEl.textContent = song.title;
          artistEl.textContent = song.artist;
          seekBar.max = song.duration;
          seekBar.value = currentTime;
          curEl.textContent = fmtTime(currentTime);
          durEl.textContent = fmtTime(song.duration);
          disc.style.background = `linear-gradient(135deg,${song.colors[0]},${song.colors[1]})`;
          playBtn.textContent = isPlaying ? '⏸' : '▶';
          if (isPlaying) disc.classList.add('music-spinning');
          else disc.classList.remove('music-spinning');
        }

        function stopAudio() {
          audioNodes.forEach(n => { try { n.stop(); n.disconnect(); } catch(e){} });
          audioNodes = [];
          if (loopTimeout) { clearTimeout(loopTimeout); loopTimeout = null; }
        }

        function scheduleMusic() {
          if (!OS.Audio._enabled) return;
          try {
            audioCtx = OS.Audio._getCtx();
            if (!masterGain) {
              masterGain = audioCtx.createGain();
              masterGain.connect(audioCtx.destination);
            }
            masterGain.gain.setValueAtTime(volume * 0.2, audioCtx.currentTime);

            const song = songs[currentSong];
            const noteDur = 60 / song.tempo / 2;
            const totalNotes = 16;
            const loopDur = noteDur * totalNotes;
            const startTime = audioCtx.currentTime + 0.05;

            for (let i = 0; i < totalNotes; i++) {
              const noteFreq = song.notes[i % song.notes.length];
              const t = startTime + i * noteDur;

              // Melodic note
              const osc = audioCtx.createOscillator();
              const gain = audioCtx.createGain();
              osc.type = song.wave;
              osc.frequency.setValueAtTime(noteFreq, t);
              gain.gain.setValueAtTime(0, t);
              gain.gain.linearRampToValueAtTime(0.5, t + 0.01);
              gain.gain.exponentialRampToValueAtTime(0.001, t + noteDur - 0.01);
              osc.connect(gain);
              gain.connect(masterGain);
              osc.start(t);
              osc.stop(t + noteDur);
              audioNodes.push(osc);

              // Bass note (every 4 notes)
              if (i % 4 === 0) {
                const bass = audioCtx.createOscillator();
                const bassGain = audioCtx.createGain();
                bass.type = 'sine';
                bass.frequency.setValueAtTime(noteFreq / 2, t);
                bassGain.gain.setValueAtTime(0, t);
                bassGain.gain.linearRampToValueAtTime(0.3, t + 0.01);
                bassGain.gain.exponentialRampToValueAtTime(0.001, t + noteDur * 2);
                bass.connect(bassGain);
                bassGain.connect(masterGain);
                bass.start(t);
                bass.stop(t + noteDur * 2);
                audioNodes.push(bass);
              }
            }

            // Loop
            loopTimeout = setTimeout(() => {
              if (isPlaying) {
                stopAudio();
                scheduleMusic();
              }
            }, loopDur * 1000 - 50);

          } catch(e) { console.warn('Music audio error:', e); }
        }

        function startPlayback() {
          scheduleMusic();
          progressTimer = setInterval(() => {
            currentTime += 0.1;
            if (currentTime >= songs[currentSong].duration) currentTime = 0;
            seekBar.value = currentTime;
            curEl.textContent = fmtTime(currentTime);
          }, 100);
        }

        function stopPlayback() {
          stopAudio();
          if (progressTimer) { clearInterval(progressTimer); progressTimer = null; }
        }

        function togglePlay() {
          isPlaying = !isPlaying;
          if (isPlaying) startPlayback();
          else stopPlayback();
          updateDisplay();
        }

        function changeSong(idx) {
          stopPlayback();
          currentSong = ((idx % songs.length) + songs.length) % songs.length;
          currentTime = 0;
          updateDisplay();
          OS.Notify.show('Now Playing', songs[currentSong].title + ' — ' + songs[currentSong].artist, { icon: '🎵' });
          if (isPlaying) startPlayback();
        }

        playBtn.addEventListener('click', togglePlay);
        prevBtn.addEventListener('click', () => changeSong(currentSong - 1));
        nextBtn.addEventListener('click', () => changeSong(currentSong + 1));

        seekBar.addEventListener('input', () => {
          currentTime = parseFloat(seekBar.value);
          curEl.textContent = fmtTime(currentTime);
          if (isPlaying) { stopPlayback(); isPlaying = true; startPlayback(); }
        });

        volBar.addEventListener('input', () => {
          volume = parseFloat(volBar.value);
          if (masterGain && audioCtx) masterGain.gain.setValueAtTime(volume * 0.2, audioCtx.currentTime);
        });

        // Cleanup
        container._cleanup = () => {
          stopPlayback();
          if (masterGain) { try { masterGain.disconnect(); } catch(e){} masterGain = null; }
        };

        updateDisplay();
      }
    });
    OS.Dock.setRunning('music', true);
  }
};

// ============================================================
// App 6: Super Mario
// ============================================================
OS.Apps.Mario = {
  label: 'Super Mario',
  icon: `<svg viewBox="0 0 60 60" width="48" height="48">
    <rect width="60" height="60" rx="14" fill="#e74c3c"/>
    <rect x="18" y="18" width="24" height="6" rx="3" fill="#cc0000"/>
    <rect x="14" y="24" width="32" height="5" rx="2" fill="#cc0000"/>
    <rect x="20" y="28" width="20" height="12" rx="3" fill="#ffcc99"/>
    <rect x="24" y="30" width="4" height="4" rx="1" fill="black"/>
    <rect x="32" y="30" width="4" height="4" rx="1" fill="black"/>
    <rect x="22" y="36" width="16" height="3" rx="1" fill="#8B4513"/>
    <rect x="18" y="40" width="24" height="10" rx="2" fill="#3498db"/>
  </svg>`,

  open() {
    if (OS.WM.isOpen('mario')) { OS.WM.focus('mario'); return; }

    OS.WM.open({
      id: 'mario',
      title: 'Super Mario',
      width: 640,
      height: 480,
      minWidth: 400,
      minHeight: 320,
      icon: '🍄',
      render(container) {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 400;
        canvas.style.cssText = 'display:block;background:#5c94fc;width:100%;height:100%;image-rendering:pixelated;';
        container.appendChild(canvas);
        const ctx = canvas.getContext('2d');

        const TILE = 32;
        const GRAVITY = 0.55;
        const JUMP_FORCE = -13;
        const MOVE_SPEED = 4;
        const LEVEL_W = 100 * TILE;

        let mario = { x:80, y:300, w:28, h:32, vx:0, vy:0, onGround:false, facing:1, frame:0, dead:false, deadVy:-10 };
        let camera = { x:0 };
        let score = 0, coins = 0, lives = 3;
        let gameState = 'playing';
        let keys = {};
        let animFrame = null;
        let frameCount = 0;
        let deathTimer = 0;
        let winTimer = 0;

        // Fireworks for win screen
        let fireworks = [];

        // Build platforms (ground + floating)
        const platforms = [];

        // Ground: row at y=13 tiles (y_px = 13*32 = 416 → but canvas is 400, ground at y=368)
        const GROUND_Y = 368;

        // Ground segments (x_tile_start, x_tile_end)
        const groundSegs = [[0,30],[32,60],[62,80],[82,100]];
        groundSegs.forEach(([xs,xe]) => {
          platforms.push({ x:xs*TILE, y:GROUND_Y, w:(xe-xs)*TILE, h:64, type:'ground' });
        });

        // Floating brick/question platforms
        const floaters = [
          // {x_tile, y_tile, count, type}
          { x:5, y:8, count:1, type:'question' },
          { x:8, y:8, count:3, type:'brick' },
          { x:9, y:8, count:1, type:'question' },
          { x:13, y:6, count:1, type:'question' },
          { x:17, y:8, count:2, type:'brick' },
          { x:20, y:8, count:1, type:'question' },
          { x:24, y:7, count:4, type:'brick' },
          { x:28, y:8, count:1, type:'question' },
          { x:33, y:6, count:3, type:'brick' },
          { x:38, y:8, count:1, type:'question' },
          { x:40, y:8, count:2, type:'brick' },
          { x:45, y:7, count:1, type:'question' },
          { x:50, y:8, count:3, type:'brick' },
          { x:55, y:6, count:2, type:'question' },
          { x:60, y:8, count:1, type:'question' },
          { x:65, y:7, count:4, type:'brick' },
          { x:70, y:8, count:2, type:'question' },
          { x:75, y:6, count:3, type:'brick' },
        ];
        const questionBlocks = [];
        floaters.forEach(f => {
          for (let i = 0; i < f.count; i++) {
            const block = { x:(f.x+i)*TILE, y:f.y*TILE, w:TILE, h:TILE, type:f.type, hit:false, coinAnim:null };
            platforms.push(block);
            if (f.type === 'question') questionBlocks.push(block);
          }
        });

        // Coins
        const coinsArr = [];
        [[6,7],[7,7],[10,5],[14,5],[18,7],[22,7],[25,6],[29,7],[35,5],[39,7],[42,7],[46,6],[51,7],[56,5],[61,7],[66,6],[71,7],[76,5]].forEach(([cx,cy]) => {
          coinsArr.push({ x:cx*TILE+8, y:cy*TILE, w:16, h:16, collected:false });
        });

        // Goombas
        const goombas = [
          { x:12*TILE, y:GROUND_Y-28, w:28, h:28, vx:-1.5, dead:false, deadTimer:0 },
          { x:25*TILE, y:GROUND_Y-28, w:28, h:28, vx:-1.5, dead:false, deadTimer:0 },
          { x:40*TILE, y:GROUND_Y-28, w:28, h:28, vx:-2, dead:false, deadTimer:0 },
          { x:58*TILE, y:GROUND_Y-28, w:28, h:28, vx:-1.5, dead:false, deadTimer:0 },
          { x:72*TILE, y:GROUND_Y-28, w:28, h:28, vx:-2, dead:false, deadTimer:0 },
        ];

        // Flagpole
        const flagpole = { x:88*TILE, y:GROUND_Y-260, poleHeight:260 };

        function aabb(a, b) {
          return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
        }

        function resetMario() {
          mario = { x:80, y:200, w:28, h:32, vx:0, vy:0, onGround:false, facing:1, frame:0, dead:false, deadVy:-10 };
          camera.x = 0;
        }

        function resetGame() {
          score = 0; coins = 0; lives = 3;
          gameState = 'playing';
          questionBlocks.forEach(b => { b.hit = false; b.type = 'question'; b.coinAnim = null; });
          coinsArr.forEach(c => c.collected = false);
          goombas.forEach((g,i) => {
            g.dead = false; g.deadTimer = 0;
            const xs = [12,25,40,58,72];
            g.x = xs[i]*TILE; g.y = GROUND_Y-28; g.vx = i===2||i===4 ? -2 : -1.5;
          });
          fireworks = [];
          resetMario();
        }

        function update() {
          frameCount++;

          // Input
          const left = keys['ArrowLeft'] || keys['KeyA'];
          const right = keys['ArrowRight'] || keys['KeyD'];
          const jump = keys['ArrowUp'] || keys['Space'] || keys['KeyW'];

          if (mario.dead) {
            mario.y += mario.deadVy;
            mario.deadVy += GRAVITY;
            if (mario.y > canvas.height + 100) {
              lives--;
              if (lives <= 0) { gameState = 'gameover'; }
              else { mario.dead = false; resetMario(); }
            }
            return;
          }

          mario.vx = 0;
          if (left) { mario.vx = -MOVE_SPEED; mario.facing = -1; mario.frame = Math.floor(frameCount/6)%2; }
          if (right) { mario.vx = MOVE_SPEED; mario.facing = 1; mario.frame = Math.floor(frameCount/6)%2; }
          if (!left && !right) mario.frame = 0;

          if (jump && mario.onGround) {
            mario.vy = JUMP_FORCE;
            mario.onGround = false;
            OS.Audio.play('jump');
          }

          mario.vy += GRAVITY;
          mario.x += mario.vx;
          mario.y += mario.vy;

          // Clamp left
          if (mario.x < 0) mario.x = 0;

          mario.onGround = false;

          // Platform collision
          platforms.forEach(p => {
            if (!aabb(mario, p)) return;

            const overlapX = Math.min(mario.x+mario.w, p.x+p.w) - Math.max(mario.x, p.x);
            const overlapY = Math.min(mario.y+mario.h, p.y+p.h) - Math.max(mario.y, p.y);

            if (overlapX > overlapY) {
              // Vertical collision
              if (mario.vy > 0 && mario.y + mario.h - mario.vy <= p.y + 1) {
                mario.y = p.y - mario.h;
                mario.vy = 0;
                mario.onGround = true;
              } else if (mario.vy < 0) {
                mario.y = p.y + p.h;
                mario.vy = 0;
                // Hit from below - question block?
                if (p.type === 'question' && !p.hit) {
                  p.hit = true;
                  p.coinAnim = { y: p.y, vy: -6 };
                  score += 100;
                  coins++;
                  OS.Audio.play('coin');
                }
              }
            } else {
              // Horizontal collision
              if (mario.vx > 0) mario.x = p.x - mario.w;
              else if (mario.vx < 0) mario.x = p.x + p.w;
            }
          });

          // Coin anim update
          questionBlocks.forEach(b => {
            if (b.coinAnim) {
              b.coinAnim.y += b.coinAnim.vy;
              b.coinAnim.vy += 0.6;
              if (b.coinAnim.y > b.y) b.coinAnim = null;
            }
          });

          // Coin collection
          coinsArr.forEach(c => {
            if (c.collected) return;
            if (aabb(mario, c)) {
              c.collected = true;
              score += 100;
              coins++;
              OS.Audio.play('coin');
            }
          });

          // Goomba update
          goombas.forEach(g => {
            if (g.dead) {
              g.deadTimer++;
              return;
            }
            g.x += g.vx;
            g.y += GRAVITY;
            // Goomba ground collision
            platforms.forEach(p => {
              if (aabb(g, p)) {
                const overY = Math.min(g.y+g.h, p.y+p.h) - Math.max(g.y, p.y);
                const overX = Math.min(g.x+g.w, p.x+p.w) - Math.max(g.x, p.x);
                if (overX > overY && g.y + g.h - g.vx <= p.y + 2) {
                  g.y = p.y - g.h;
                }
              }
            });
            // Reverse at edges
            if (g.x <= 0 || g.x + g.w >= LEVEL_W) g.vx *= -1;
            // Check platform edges
            let onPlat = false;
            platforms.forEach(p => {
              if (g.x + g.w > p.x && g.x < p.x + p.w && Math.abs(g.y + g.h - p.y) < 4) onPlat = true;
            });

            // Mario vs goomba
            if (aabb(mario, { x:g.x, y:g.y, w:g.w, h:g.h })) {
              // Stomp?
              if (mario.vy > 0 && mario.y + mario.h < g.y + g.h * 0.5 + 8) {
                g.dead = true;
                mario.vy = -8;
                score += 100;
                OS.Audio.play('stomp');
              } else if (!mario.dead) {
                // Hit from side - die
                mario.dead = true;
                mario.deadVy = -11;
                OS.Audio.play('death');
              }
            }
          });

          // Fall off bottom
          if (mario.y > canvas.height + 100 && !mario.dead) {
            mario.dead = true;
            mario.deadVy = 0;
          }

          // Flagpole
          if (!mario.dead && mario.x + mario.w >= flagpole.x && mario.x < flagpole.x + 8) {
            gameState = 'win';
            OS.Audio.play('win');
          }

          // Camera
          camera.x = mario.x - canvas.width * 0.35;
          camera.x = Math.max(0, Math.min(camera.x, LEVEL_W - canvas.width));
        }

        function drawMario(mx, my) {
          const facing = mario.facing;
          ctx.save();
          if (facing === -1) {
            ctx.translate(mx + mario.w, my);
            ctx.scale(-1, 1);
            ctx.translate(-mario.w, 0);
          } else {
            ctx.translate(mx, my);
          }

          const f = mario.frame;

          // Hat (red)
          ctx.fillStyle = '#cc0000';
          ctx.fillRect(4, 0, 20, 6);
          ctx.fillRect(0, 6, 28, 4);

          // Face
          ctx.fillStyle = '#ffcc99';
          ctx.fillRect(4, 10, 20, 10);

          // Eyes
          ctx.fillStyle = '#000';
          ctx.fillRect(8, 12, 4, 4);
          ctx.fillRect(18, 12, 4, 4);

          // Mustache
          ctx.fillStyle = '#8B4513';
          ctx.fillRect(6, 17, 16, 3);

          // Overalls (blue)
          ctx.fillStyle = '#3498db';
          ctx.fillRect(4, 20, 20, 12);

          // Shirt (red sides)
          ctx.fillStyle = '#cc0000';
          ctx.fillRect(0, 20, 4, 10);
          ctx.fillRect(24, 20, 4, 10);

          // Legs (alternate)
          ctx.fillStyle = '#cc0000';
          if (f === 0) {
            ctx.fillRect(4, 26, 8, 6);
            ctx.fillRect(16, 26, 8, 6);
          } else {
            ctx.fillRect(2, 26, 8, 6);
            ctx.fillRect(18, 26, 8, 6);
          }
          // Shoes (dark)
          ctx.fillStyle = '#4a2800';
          ctx.fillRect(4, 28, 8, 4);
          ctx.fillRect(16, 28, 8, 4);

          ctx.restore();
        }

        function drawDeadMario(mx, my) {
          ctx.save();
          ctx.translate(mx, my);
          ctx.fillStyle = '#cc0000';
          ctx.fillRect(2, 6, 24, 6);
          ctx.fillStyle = '#ffcc99';
          ctx.fillRect(2, 12, 24, 8);
          ctx.fillStyle = '#3498db';
          ctx.fillRect(2, 20, 24, 8);
          ctx.restore();
        }

        function drawGoomba(g) {
          const gx = g.x - camera.x;
          const gy = g.y;
          ctx.save();
          ctx.translate(gx, gy);
          if (g.dead) {
            // Squished
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(0, g.h-8, g.w, 8);
            ctx.fillStyle = '#a0522d';
            ctx.fillRect(2, g.h-6, g.w-4, 4);
          } else {
            // Body
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(2, 8, g.w-4, g.h-8);
            // Head
            ctx.fillStyle = '#a0522d';
            ctx.fillRect(0, 0, g.w, 12);
            // Eyes
            ctx.fillStyle = '#fff';
            ctx.fillRect(4, 2, 6, 5);
            ctx.fillRect(g.w-10, 2, 6, 5);
            ctx.fillStyle = '#000';
            ctx.fillRect(6, 3, 3, 4);
            ctx.fillRect(g.w-8, 3, 3, 4);
            // Feet
            ctx.fillStyle = '#4a2800';
            const fOff = frameCount%16 < 8 ? 0 : 2;
            ctx.fillRect(0, g.h-6, 10, 6);
            ctx.fillRect(g.w-10, g.h-6, 10, 6);
          }
          ctx.restore();
        }

        function drawPlatform(p) {
          const px = p.x - camera.x;
          if (px + p.w < 0 || px > canvas.width) return;

          if (p.type === 'ground') {
            ctx.fillStyle = '#228B22';
            ctx.fillRect(px, p.y, p.w, 6);
            ctx.fillStyle = '#8B4513';
            ctx.fillRect(px, p.y+6, p.w, p.h-6);
            // Tile lines
            ctx.fillStyle = 'rgba(0,0,0,0.1)';
            for (let tx = 0; tx < p.w; tx += TILE) {
              ctx.fillRect(px+tx, p.y+6, 1, p.h-6);
            }
          } else if (p.type === 'brick') {
            ctx.fillStyle = '#c84b0f';
            ctx.fillRect(px, p.y, p.w, p.h);
            ctx.fillStyle = '#8B3009';
            ctx.fillRect(px, p.y+TILE/2-2, p.w, 4);
            ctx.fillRect(px+TILE/2, p.y, 4, TILE/2-2);
            ctx.fillRect(px, p.y+TILE/2+2, TILE/2, TILE/2-2);
          } else if (p.type === 'question') {
            ctx.fillStyle = p.hit ? '#888' : '#f0c000';
            ctx.fillRect(px, p.y, p.w, p.h);
            ctx.fillStyle = p.hit ? '#666' : '#cc9900';
            ctx.fillRect(px+1, p.y+1, p.w-2, 3);
            ctx.fillRect(px+1, p.y+p.h-4, p.w-2, 3);
            if (!p.hit) {
              ctx.fillStyle = '#fff';
              ctx.font = 'bold 18px monospace';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('?', px+p.w/2, p.y+p.h/2);
            }
          }
        }

        function drawCoin(c) {
          if (c.collected) return;
          const cx = c.x - camera.x;
          if (cx < -20 || cx > canvas.width+20) return;
          ctx.fillStyle = '#ffd700';
          ctx.beginPath();
          ctx.arc(cx+8, c.y+8, 7, 0, Math.PI*2);
          ctx.fill();
          ctx.fillStyle = '#ffec80';
          ctx.beginPath();
          ctx.arc(cx+6, c.y+6, 3, 0, Math.PI*2);
          ctx.fill();
        }

        function drawFlagpole() {
          const fpx = flagpole.x - camera.x;
          if (fpx < -10 || fpx > canvas.width+10) return;
          // Pole
          ctx.fillStyle = '#aaa';
          ctx.fillRect(fpx, flagpole.y, 6, flagpole.poleHeight);
          // Ball
          ctx.fillStyle = '#ffd700';
          ctx.beginPath();
          ctx.arc(fpx+3, flagpole.y, 7, 0, Math.PI*2);
          ctx.fill();
          // Flag (waving)
          ctx.fillStyle = '#4CAF50';
          const wave = Math.sin(frameCount * 0.1) * 3;
          ctx.beginPath();
          ctx.moveTo(fpx+6, flagpole.y+10);
          ctx.lineTo(fpx+36+wave, flagpole.y+20);
          ctx.lineTo(fpx+6, flagpole.y+34);
          ctx.closePath();
          ctx.fill();
        }

        function drawHUD() {
          ctx.fillStyle = 'rgba(0,0,0,0.5)';
          ctx.fillRect(0, 0, canvas.width, 30);
          ctx.fillStyle = '#fff';
          ctx.font = 'bold 14px monospace';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(`❤ x${lives}`, 10, 15);
          ctx.textAlign = 'center';
          ctx.fillText(`SCORE: ${String(score).padStart(6,'0')}`, canvas.width/2, 15);
          ctx.textAlign = 'right';
          ctx.fillText(`🪙 x${String(coins).padStart(2,'0')}`, canvas.width-10, 15);
        }

        function render() {
          // Sky background
          ctx.fillStyle = '#5c94fc';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Clouds (decorative, parallax)
          ctx.fillStyle = 'rgba(255,255,255,0.8)';
          [[100,60],[280,80],[500,55],[720,70],[950,65],[1200,75],[1500,60],[1800,80],[2100,65]].forEach(([cx,cy]) => {
            const cloudX = cx - camera.x * 0.3;
            if (cloudX < -80 || cloudX > canvas.width+80) return;
            ctx.beginPath();
            ctx.arc(cloudX, cy, 22, 0, Math.PI*2);
            ctx.arc(cloudX+25, cy-8, 18, 0, Math.PI*2);
            ctx.arc(cloudX+45, cy, 20, 0, Math.PI*2);
            ctx.fill();
          });

          // Platforms
          platforms.forEach(drawPlatform);

          // Question block coin animations
          questionBlocks.forEach(b => {
            if (b.coinAnim) {
              const cx = b.x - camera.x + TILE/2;
              ctx.fillStyle = '#ffd700';
              ctx.beginPath();
              ctx.arc(cx, b.coinAnim.y, 7, 0, Math.PI*2);
              ctx.fill();
            }
          });

          // Coins
          coinsArr.forEach(drawCoin);

          // Goombas
          goombas.forEach(g => { if (!g.dead || g.deadTimer < 40) drawGoomba(g); });

          // Flagpole
          drawFlagpole();

          // Mario
          if (!mario.dead) {
            drawMario(mario.x - camera.x, mario.y);
          } else {
            drawDeadMario(mario.x - camera.x, mario.y);
          }

          // HUD
          drawHUD();
        }

        function renderWin() {
          ctx.fillStyle = '#1a1a2e';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Update fireworks
          if (frameCount % 8 === 0) {
            for (let i = 0; i < 3; i++) {
              fireworks.push({
                x: Math.random() * canvas.width,
                y: canvas.height,
                vx: (Math.random()-0.5)*4,
                vy: -(8+Math.random()*6),
                color: `hsl(${Math.random()*360},80%,60%)`,
                life: 60+Math.random()*40,
                exploded: false,
                particles: []
              });
            }
          }
          fireworks = fireworks.filter(f => f.life > 0);
          fireworks.forEach(f => {
            f.life--;
            if (!f.exploded) {
              f.x += f.vx; f.y += f.vy; f.vy += 0.2;
              ctx.fillStyle = f.color;
              ctx.fillRect(f.x-2, f.y-2, 4, 4);
              if (f.vy >= 0 || f.life < 30) {
                f.exploded = true;
                for (let p = 0; p < 12; p++) {
                  const a = (p/12)*Math.PI*2;
                  f.particles.push({ x:f.x, y:f.y, vx:Math.cos(a)*3, vy:Math.sin(a)*3, life:30 });
                }
              }
            } else {
              f.particles.forEach(p => {
                p.x+=p.vx; p.y+=p.vy; p.vy+=0.15; p.life--;
                if (p.life>0) { ctx.fillStyle=f.color; ctx.fillRect(p.x-1,p.y-1,3,3); }
              });
              f.particles = f.particles.filter(p=>p.life>0);
            }
          });

          ctx.fillStyle = '#fff';
          ctx.font = 'bold 42px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('YOU WIN!', canvas.width/2, canvas.height/2-40);
          ctx.font = '22px monospace';
          ctx.fillText('Score: ' + score, canvas.width/2, canvas.height/2+10);
          ctx.font = '16px monospace';
          ctx.fillStyle = 'rgba(255,255,255,0.7)';
          ctx.fillText('Press Enter to play again', canvas.width/2, canvas.height/2+50);
        }

        function renderGameOver() {
          ctx.fillStyle = '#1a1a1a';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = '#ff4757';
          ctx.font = 'bold 48px monospace';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('GAME OVER', canvas.width/2, canvas.height/2-40);
          ctx.fillStyle = '#fff';
          ctx.font = '22px monospace';
          ctx.fillText('Score: ' + score, canvas.width/2, canvas.height/2+10);
          ctx.font = '16px monospace';
          ctx.fillStyle = 'rgba(255,255,255,0.6)';
          ctx.fillText('Press Enter to restart', canvas.width/2, canvas.height/2+50);
        }

        function gameLoop() {
          frameCount++;
          if (gameState === 'playing') {
            update();
            render();
          } else if (gameState === 'win') {
            renderWin();
          } else if (gameState === 'gameover') {
            renderGameOver();
          }
          animFrame = requestAnimationFrame(gameLoop);
        }

        // Input handlers
        const keyDown = (e) => {
          keys[e.code] = true;
          if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code)) e.preventDefault();
          if (e.code === 'Enter' && (gameState === 'gameover' || gameState === 'win')) resetGame();
        };
        const keyUp = (e) => { keys[e.code] = false; };

        document.addEventListener('keydown', keyDown);
        document.addEventListener('keyup', keyUp);

        // Cleanup
        container._cleanup = () => {
          document.removeEventListener('keydown', keyDown);
          document.removeEventListener('keyup', keyUp);
          if (animFrame) cancelAnimationFrame(animFrame);
        };

        gameLoop();
      }
    });
  }
};

// ============================================================
// Init: Register all apps with Dock and Desktop, then boot
// ============================================================
(function initApps() {
  OS.Dock.register('finder', 'Finder', OS.Apps.Finder.icon, () => OS.Apps.Finder.open());
  OS.Dock.register('terminal', 'Terminal', OS.Apps.Terminal.icon, () => OS.Apps.Terminal.open());
  OS.Dock.register('browser', 'Browser', OS.Apps.Browser.icon, () => OS.Apps.Browser.open());
  OS.Dock.register('music', 'Music', OS.Apps.Music.icon, () => OS.Apps.Music.open());
  OS.Dock.register('settings', 'Settings', OS.Apps.Settings.icon, () => OS.Apps.Settings.open());

  OS.Desktop.addIcon('finder', 'Finder', OS.Apps.Finder.icon, () => OS.Apps.Finder.open());
  OS.Desktop.addIcon('terminal', 'Terminal', OS.Apps.Terminal.icon, () => OS.Apps.Terminal.open());
  OS.Desktop.addIcon('browser', 'Safari', OS.Apps.Browser.icon, () => OS.Apps.Browser.open());
  OS.Desktop.addIcon('music', 'Music', OS.Apps.Music.icon, () => OS.Apps.Music.open());
  OS.Desktop.addIcon('mario', 'Super Mario', OS.Apps.Mario.icon, () => OS.Apps.Mario.open());
  OS.Desktop.addIcon('settings', 'Settings', OS.Apps.Settings.icon, () => OS.Apps.Settings.open());

  OS.Boot.start();
})();
