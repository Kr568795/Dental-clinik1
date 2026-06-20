'use strict';

// Tiny in-memory cache for the flat settings object used when injecting them
// into server-rendered pages. Busted immediately when an admin saves settings,
// so edits show on the next page load (no stale window).

let cache = { ts: 0, data: null };
const TTL = 10000; // ms

module.exports = {
  get() {
    if (cache.data && Date.now() - cache.ts < TTL) return cache.data;
    return null;
  },
  set(data) {
    cache = { ts: Date.now(), data };
  },
  bust() {
    cache = { ts: 0, data: null };
  },
};
