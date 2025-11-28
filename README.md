# dictionary
dictionary app

## Troubleshooting: stylesheet refused (MIME type 'text/html')

If your browser console shows an error like:

```
Refused to apply style from 'http://127.0.0.1:5500/style.css' because its MIME type ('text/html') is not a supported stylesheet MIME type, and strict MIME checking is enabled.
```

This usually means the server returned an HTML page (often a 404 or fallback HTML) instead of the actual `style.css` file. Common causes and fixes:

- Ensure you're opening the app with a static server (for example, VS Code Live Server) and that the server root is the project folder containing `dictionary.html` and `style.css`.
- Verify the file name and extension are correct (e.g. not `style.css.txt`). On Windows, file extensions may be hidden.
- Try opening the stylesheet directly in the browser (or request its headers) — you should see CSS content and `Content-Type: text/css`.

Quick checks from PowerShell:

```powershell
# request headers for the stylesheet (PowerShell / curl alias):
Invoke-WebRequest -Uri "http://127.0.0.1:5500/style.css" -Method Get -UseBasicParsing | Select-Object -ExpandProperty Headers

# or using curl (if installed):
curl -I http://127.0.0.1:5500/style.css
```

If you see `Content-Type: text/html` in the response headers, your server is returning an HTML page instead of CSS. If you are using a dev server with SPA (history API) fallback configured, make sure it doesn't rewrite requests for static assets (CSS/JS/PNG/etc.) to your HTML file. For Live Server in VS Code, restarting the server or re-opening the page with "Open with Live Server" usually fixes incorrect routing.

If you run a custom server (Express, nginx, etc.) ensure static middleware is registered before any catch-all routes, e.g. in Express:

```js
app.use(express.static(path.join(__dirname, 'public')));
// then put SPA fallback after static middleware
app.get('*', (req,res) => { res.sendFile(path.join(__dirname, 'public','index.html')); });
```

If you need help diagnosing the response headers you get from your server, paste the headers here and I can help interpret them.

<!-- Previously an inline translate UI section was here, but the project was reverted to a simpler translate button beside the word input. -->
