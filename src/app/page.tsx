// src/page.tsx

// This page should rarely be rendered directly due to redirects
// in middleware and next.config.js.
export default function HomePage() {
  // Redirect logic is primarily handled by middleware and next.config.js
  // This component might render briefly before a redirect happens.
  // Returning null is sufficient.
  return null;
}
