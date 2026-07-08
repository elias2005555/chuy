// globalThis polyfill — needed by some libraries on very old iOS
if (typeof globalThis === 'undefined') {
  (window as any).globalThis = window;
}

// crypto.randomUUID — added in iOS 15.4; polyfill for older devices
if (typeof crypto !== 'undefined' && !crypto.randomUUID) {
  (crypto as any).randomUUID = function (): string {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0'));
    return (
      hex.slice(0, 4).join('') + '-' +
      hex.slice(4, 6).join('') + '-' +
      hex.slice(6, 8).join('') + '-' +
      hex.slice(8, 10).join('') + '-' +
      hex.slice(10).join('')
    );
  };
}

// structuredClone — not available on Safari < 15.4
if (typeof structuredClone === 'undefined') {
  (window as any).structuredClone = (obj: unknown) => JSON.parse(JSON.stringify(obj));
}

// queueMicrotask — not available on Safari < 12.1
if (typeof queueMicrotask === 'undefined') {
  (window as any).queueMicrotask = (fn: () => void) => Promise.resolve().then(fn);
}

// Object.hasOwn — not available on Safari < 15.4
if (!Object.hasOwn) {
  Object.defineProperty(Object, 'hasOwn', {
    value: (obj: object, key: PropertyKey) => Object.prototype.hasOwnProperty.call(obj, key),
    configurable: true,
    writable: true,
  });
}

// Array.at — not available on Safari < 15.4
if (!Array.prototype.at) {
  Array.prototype.at = function (index: number) {
    return index < 0 ? this[this.length + index] : this[index];
  };
}
