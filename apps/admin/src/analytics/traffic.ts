// // src/analytics/traffic.ts
// import { api } from '../api/admin';
//
// const VISITOR_KEY = 'aa_visitor_id';
//
// function getVisitorId(): string {
//     let id = localStorage.getItem(VISITOR_KEY);
//     if (!id) {
//         id = crypto.randomUUID();
//         localStorage.setItem(VISITOR_KEY, id);
//     }
//     return id;
// }
//
// export function trackPageview(path: string, referrer?: string | null) {
//     const visitorId = getVisitorId();
//     const payload = {
//         visitorId,
//         path,
//         referrer: (referrer ?? document.referrer) || null,
//         userAgent: navigator.userAgent,
//     };
//
//     // fire-and-forget; do NOT block navigation
//     if (navigator.sendBeacon) {
//         const url = `${api.defaults.baseURL}/analytics/pageview`;
//         const blob = new Blob([JSON.stringify(payload)], {
//             type: 'application/json',
//         });
//         navigator.sendBeacon(url, blob);
//     } else {
//         api.post('/analytics/pageview', payload).catch(() => {});
//     }
// }