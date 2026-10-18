// Runs before the app paints, including under the site's script-src 'self' policy.
try {
  if (localStorage.getItem('rm-tours-theme') === 'dark') {
    document.documentElement.classList.add('dark')
    document.documentElement.style.colorScheme = 'dark'
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', '#0b1822')
  }
} catch {
  // Keep the default light theme if storage is unavailable.
}
