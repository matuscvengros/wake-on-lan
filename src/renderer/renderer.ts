let hosts: Host[] = [];
let editingId: string | null = null;

const hostList = document.getElementById('host-list')!;
const emptyState = document.getElementById('empty-state')!;
const modalOverlay = document.getElementById('modal-overlay')!;
const modalTitle = document.getElementById('modal-title')!;
const hostForm = document.getElementById('host-form') as HTMLFormElement;
const btnAdd = document.getElementById('btn-add')!;
const btnCancel = document.getElementById('btn-cancel')!;

const fieldName = document.getElementById('field-name') as HTMLInputElement;
const fieldMac = document.getElementById('field-mac') as HTMLInputElement;
const fieldIp = document.getElementById('field-ip') as HTMLInputElement;
const fieldBroadcast = document.getElementById('field-broadcast') as HTMLInputElement;
const fieldPort = document.getElementById('field-port') as HTMLInputElement;
const fieldDirectIp = document.getElementById('field-direct-ip') as HTMLInputElement;

function generateId(): string {
  return crypto.randomUUID();
}

function validateMac(mac: string): boolean {
  return /^([0-9A-Fa-f]{2}:){5}[0-9A-Fa-f]{2}$/.test(mac);
}

function validateIp(ip: string): boolean {
  const parts = ip.split('.');
  if (parts.length !== 4) return false;
  return parts.every(p => {
    const n = parseInt(p, 10);
    return !isNaN(n) && n >= 0 && n <= 255 && String(n) === p;
  });
}

function clearErrors(): void {
  document.querySelectorAll('.field-error').forEach(el => { el.textContent = ''; });
}

function setError(field: string, msg: string): void {
  const el = document.getElementById(`error-${field}`);
  if (el) el.textContent = msg;
}

function createHostRow(host: Host): HTMLElement {
  const row = document.createElement('div');
  row.className = 'host-row';
  row.dataset.id = host.id;

  const info = document.createElement('div');
  info.className = 'host-info';

  const name = document.createElement('div');
  name.className = 'host-name';
  name.textContent = host.name;

  const details = document.createElement('div');
  details.className = 'host-details';
  details.textContent = `${host.mac} \u2014 ${host.ip}`;

  info.appendChild(name);
  info.appendChild(details);

  const actions = document.createElement('div');
  actions.className = 'host-actions';

  const status = document.createElement('span');
  status.className = 'host-status';
  status.id = `status-${host.id}`;

  const wakeBtn = document.createElement('button');
  wakeBtn.className = 'btn btn-wake';
  wakeBtn.dataset.wake = host.id;
  wakeBtn.textContent = 'Wake';

  const deleteBtn = document.createElement('button');
  deleteBtn.className = 'btn btn-delete';
  deleteBtn.dataset.delete = host.id;
  deleteBtn.title = 'Delete';
  deleteBtn.textContent = '\u2715';

  actions.appendChild(status);
  actions.appendChild(wakeBtn);
  actions.appendChild(deleteBtn);

  row.appendChild(info);
  row.appendChild(actions);

  row.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-wake]') || target.closest('[data-delete]')) return;
    openModal(host);
  });

  return row;
}

function renderHosts(): void {
  document.querySelectorAll('.host-row').forEach(el => el.remove());

  if (hosts.length === 0) {
    emptyState.style.display = '';
    return;
  }

  emptyState.style.display = 'none';

  hosts.forEach(host => {
    hostList.appendChild(createHostRow(host));
  });
}

function openModal(host?: Host): void {
  clearErrors();
  if (host) {
    editingId = host.id;
    modalTitle.textContent = 'Edit Host';
    fieldName.value = host.name;
    fieldMac.value = host.mac;
    fieldIp.value = host.ip;
    fieldBroadcast.value = host.broadcastAddress;
    fieldPort.value = String(host.port);
    fieldDirectIp.checked = host.useDirectIp;
  } else {
    editingId = null;
    modalTitle.textContent = 'Add Host';
    hostForm.reset();
    fieldPort.value = '9';
  }
  modalOverlay.classList.remove('hidden');
  fieldName.focus();
}

function closeModal(): void {
  modalOverlay.classList.add('hidden');
  editingId = null;
}

function validateForm(): boolean {
  clearErrors();
  let valid = true;

  if (!fieldName.value.trim()) {
    setError('name', 'Hostname is required');
    valid = false;
  }

  if (!validateMac(fieldMac.value.trim())) {
    setError('mac', 'Invalid MAC (use AA:BB:CC:DD:EE:FF format)');
    valid = false;
  }

  if (!validateIp(fieldIp.value.trim())) {
    setError('ip', 'Invalid IPv4 address');
    valid = false;
  }

  if (!validateIp(fieldBroadcast.value.trim())) {
    setError('broadcast', 'Invalid IPv4 address');
    valid = false;
  }

  const port = parseInt(fieldPort.value, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    setError('port', 'Port must be 1-65535');
    valid = false;
  }

  return valid;
}

async function saveHost(): Promise<void> {
  if (!validateForm()) return;

  const host: Host = {
    id: editingId || generateId(),
    name: fieldName.value.trim(),
    mac: fieldMac.value.trim().toUpperCase(),
    ip: fieldIp.value.trim(),
    broadcastAddress: fieldBroadcast.value.trim(),
    port: parseInt(fieldPort.value, 10),
    useDirectIp: fieldDirectIp.checked,
  };

  if (editingId) {
    const idx = hosts.findIndex(h => h.id === editingId);
    if (idx >= 0) hosts[idx] = host;
  } else {
    hosts.push(host);
  }

  await window.api.saveHosts(hosts);
  renderHosts();
  closeModal();
}

async function deleteHost(id: string): Promise<void> {
  const host = hosts.find(h => h.id === id);
  if (!host) return;
  if (!confirm(`Delete "${host.name}"?`)) return;

  hosts = hosts.filter(h => h.id !== id);
  await window.api.saveHosts(hosts);
  renderHosts();
}

async function wakeHost(id: string): Promise<void> {
  const host = hosts.find(h => h.id === id);
  if (!host) return;

  const statusEl = document.getElementById(`status-${id}`);
  if (!statusEl) return;

  const result = await window.api.sendWol(host);

  statusEl.className = 'host-status visible ' + (result.success ? 'success' : 'error');
  statusEl.textContent = result.success ? 'Packet sent' : 'Failed';

  setTimeout(() => {
    statusEl.classList.remove('visible');
  }, 2000);
}

// Event listeners
btnAdd.addEventListener('click', () => openModal());
btnCancel.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', (e) => {
  if (e.target === modalOverlay) closeModal();
});

hostForm.addEventListener('submit', (e) => {
  e.preventDefault();
  saveHost().catch(console.error);
});

hostList.addEventListener('click', (e) => {
  const target = e.target as HTMLElement;
  const wakeBtn = target.closest('[data-wake]') as HTMLElement | null;
  const deleteBtn = target.closest('[data-delete]') as HTMLElement | null;

  if (wakeBtn) {
    e.stopPropagation();
    wakeHost(wakeBtn.dataset.wake!).catch(console.error);
  } else if (deleteBtn) {
    e.stopPropagation();
    deleteHost(deleteBtn.dataset.delete!).catch(console.error);
  }
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

// Init
(async () => {
  hosts = await window.api.loadHosts();
  renderHosts();
})();
