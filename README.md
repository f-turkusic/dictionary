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

---

## Bookmarklet: Send selected word to Dictionary

Use this bookmarklet to send the currently selected word on any page to your Dictionary app.

- Create the bookmarklet
  - Chrome/Edge: Right-click the bookmarks bar → Add page…
  - Firefox: Right-click the bookmarks toolbar → New Bookmark…
  - Name: `Send to Dictionary`
  - URL (paste exactly, including the `javascript:` prefix):

```
javascript:(function(){const w=window.getSelection().toString().trim();if(!w){alert("Select a word first.");return;}const d=window.open("http://localhost:5500/dictionary.html","dictionary_app");setTimeout(()=>{d.postMessage({type:"SET_WORD",word:w},"*");},400);})();
```

- Use it
  - Start your local server and ensure the app is available at `http://localhost:5500/dictionary.html` (adjust if different)
  - Select a word on any webpage
  - Click the bookmarklet; it opens or focuses the Dictionary tab and sends the word

- Notes
  - Pop-up blockers may prevent opening the window. Allow pop-ups for the current site.
  - The window name `dictionary_app` keeps reusing the same tab.
  - For production, replace the localhost URL with your deployed URL.

- Receiving the message in the app (optional snippet)
  Add this listener to your app to receive the word and focus the input. You can further enhance it (e.g., show a toast, switch language, etc.).

```js
window.addEventListener('message', (event) => {
  // Optionally validate origin: if (event.origin !== 'http://localhost:5500') return;
  const data = event.data || {};
  if (data.type === 'SET_WORD' && typeof data.word === 'string') {
    const input = document.getElementById('wordInput');
    if (input) {
      input.value = data.word.trim();
      input.focus();
    }
  }
});
```
