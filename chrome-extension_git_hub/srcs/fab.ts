// Floating Action Button content script for LinkedIn pages

interface FABPosition {
  x: number;
  y: number;
}

const FAB_SIZE = 48;
const FAB_MARGIN = 24;
const STORAGE_KEY = 'fabPosition';

// Default position (bottom-right)
const defaultPosition: FABPosition = {
  x: window.innerWidth - FAB_SIZE - FAB_MARGIN,
  y: window.innerHeight - FAB_SIZE - FAB_MARGIN
};

let fab: HTMLDivElement | null = null;
let overlay: HTMLDivElement | null = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };
let startX = 0;
let startY = 0;

// Load saved position from storage
async function loadPosition(): Promise<FABPosition> {
  return new Promise((resolve) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      if (result[STORAGE_KEY]) {
        // Validate position is still within viewport
        const pos = result[STORAGE_KEY] as FABPosition;
        pos.x = Math.min(Math.max(0, pos.x), window.innerWidth - FAB_SIZE);
        pos.y = Math.min(Math.max(0, pos.y), window.innerHeight - FAB_SIZE);
        resolve(pos);
      } else {
        resolve(defaultPosition);
      }
    });
  });
}

// Save position to storage
function savePosition(position: FABPosition): void {
  chrome.storage.local.set({ [STORAGE_KEY]: position });
}

// Create the FAB element
function createFAB(): HTMLDivElement {
  const button = document.createElement('div');
  button.id = 'palladio-fab';

  // Get the extension's icon URL
  const iconUrl = chrome.runtime.getURL('images/icon.png');

  button.innerHTML = `<img src="${iconUrl}" alt="Palladio" style="width: 24px; height: 24px; border-radius: 4px;">`;

  button.style.cssText = `
    position: fixed;
    width: ${FAB_SIZE}px;
    height: ${FAB_SIZE}px;
    border-radius: 50%;
    background-color: #fc5000;
    border: 1px solid #e0e0e0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    z-index: 2147483647;
    transition: transform 0.15s ease-out, box-shadow 0.15s ease-out;
    user-select: none;
  `;

  return button;
}

// Create the overlay popup
function createOverlay(): HTMLDivElement {
  const overlayDiv = document.createElement('div');
  overlayDiv.id = 'palladio-overlay';

  overlayDiv.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: stretch;
    justify-content: flex-end;
    z-index: 2147483646;
  `;

  // Create popup container
  const popupContainer = document.createElement('div');
  popupContainer.id = 'palladio-popup-container';
  popupContainer.style.cssText = `
    background: #ffffff;
    border-radius: 20px 0 0 20px;
    box-shadow: -8px 0 32px rgba(0,0,0,0.25);
    width: 400px;
    height: 100%;
    overflow: hidden;
  `;

  // Create iframe to load popup content
  const iframe = document.createElement('iframe');
  iframe.src = chrome.runtime.getURL('srcs/popup.html');
  iframe.style.cssText = `
    width: 100%;
    height: 100%;
    border: none;
    display: block;
  `;

  popupContainer.appendChild(iframe);
  overlayDiv.appendChild(popupContainer);

  // Close on backdrop click
  overlayDiv.addEventListener('click', (e) => {
    if (e.target === overlayDiv) {
      closeOverlay();
    }
  });

  // Close on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && overlay) {
      closeOverlay();
    }
  });

  return overlayDiv;
}

function closeOverlay(): void {
  if (overlay) {
    overlay.remove();
    overlay = null;
  }
}

function openOverlay(): void {
  if (overlay) {
    closeOverlay();
    return;
  }

  overlay = createOverlay();
  document.body.appendChild(overlay);
}

// Drag handlers
function onMouseDown(e: MouseEvent): void {
  if (!fab) return;

  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  const rect = fab.getBoundingClientRect();
  dragOffset.x = e.clientX - rect.left;
  dragOffset.y = e.clientY - rect.top;

  fab.style.transition = 'none';
  fab.style.cursor = 'grabbing';

  e.preventDefault();
}

function onMouseMove(e: MouseEvent): void {
  if (!isDragging || !fab) return;

  let newX = e.clientX - dragOffset.x;
  let newY = e.clientY - dragOffset.y;

  // Keep within viewport
  newX = Math.min(Math.max(0, newX), window.innerWidth - FAB_SIZE);
  newY = Math.min(Math.max(0, newY), window.innerHeight - FAB_SIZE);

  fab.style.left = `${newX}px`;
  fab.style.top = `${newY}px`;
}

function onMouseUp(e: MouseEvent): void {
  if (!fab) return;

  if (!isDragging) return;

  const rect = fab.getBoundingClientRect();

  isDragging = false;
  fab.style.transition = 'transform 0.15s ease-out, box-shadow 0.15s ease-out';
  fab.style.cursor = 'pointer';

  // Save new position
  savePosition({ x: rect.left, y: rect.top });

  // If we barely moved, treat as a click
  const moveDistance = Math.sqrt(
    Math.pow(e.clientX - startX, 2) +
    Math.pow(e.clientY - startY, 2)
  );

  if (moveDistance < 5) {
    openOverlay();
  }
}

// Hover effects
function onMouseEnter(): void {
  if (!fab || isDragging) return;
  fab.style.transform = 'scale(1.05)';
  fab.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
}

function onMouseLeave(): void {
  if (!fab || isDragging) return;
  fab.style.transform = 'scale(1)';
  fab.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
}

// Initialize FAB
async function initFAB(): Promise<void> {
  // Don't add FAB if it already exists
  if (document.getElementById('palladio-fab')) return;

  fab = createFAB();

  // Load saved position
  const position = await loadPosition();
  fab.style.left = `${position.x}px`;
  fab.style.top = `${position.y}px`;

  // Add event listeners
  fab.addEventListener('mousedown', onMouseDown);
  fab.addEventListener('mouseenter', onMouseEnter);
  fab.addEventListener('mouseleave', onMouseLeave);

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);

  // Handle window resize
  window.addEventListener('resize', async () => {
    if (!fab) return;
    const pos = await loadPosition();
    fab.style.left = `${Math.min(pos.x, window.innerWidth - FAB_SIZE)}px`;
    fab.style.top = `${Math.min(pos.y, window.innerHeight - FAB_SIZE)}px`;
  });

  document.body.appendChild(fab);
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initFAB);
} else {
  initFAB();
}
