// https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/configuration.md
module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      url: ['https://reddit-image-viewer.vercel.app']
    },
    assert: {
      preset: 'lighthouse:no-pwa',
      assertions: {
        'csp-xss': 'off',
        'legacy-javascript': 'off',
        'unused-javascript': 'warn',
        'uses-responsive-images': 'warn'
      }
    }
  }
}
