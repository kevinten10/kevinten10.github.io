# Legacy JavaScript Files

This directory contains JavaScript modules that are no longer actively used in the current version of the website. They are preserved here for backup and reference purposes.

## Files

| File | Description | Reason for Archival |
|------|-------------|---------------------
| `particles.js` | Canvas-based background particle animation | Removed in UI modernization; replaced with cleaner design |
| `search.js` | Article search and filtering functionality | Articles page not part of current single-page design |
| `articles.js` | Articles page specific functionality | Articles page not part of current single-page design |
| `tech-cursor.js` | Custom tech-style cursor effects | Removed for better accessibility and mobile experience |

## Notes

- These files are not loaded by `index.html`
- Service Worker (`sw.js`) does not cache these files
- If you need to restore any functionality, move the file back to `/assets/js/` and add the script tag to `index.html`
