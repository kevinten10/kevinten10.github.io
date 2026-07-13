# Legacy JavaScript Files

This directory contains JavaScript modules that are no longer actively used in the current version of the website. They are preserved here for backup and reference purposes.

## Files

| File | Description | Reason for Archival |
|------|-------------|---------------------
| `particles.js` | Canvas-based background particle animation | Removed in UI modernization; replaced with cleaner design |
| `search.js` | Article search and filtering functionality | Articles page not part of current single-page design |
| `tech-cursor.js` | Custom tech-style cursor effects | Removed for better accessibility and mobile experience |

## Notes

- These files are not loaded by `index.html` or `articles.html`
- Service Worker (`sw.js`) does not cache these files
- The active article index module lives at `/assets/js/articles.js`; its generated data lives at `/assets/data/articles.json`.
- If you need to restore any archived functionality, move the file back to `/assets/js/` and add it only to the page that needs it.
