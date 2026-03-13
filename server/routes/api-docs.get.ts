/**
 * GET /api-docs — Swagger UI powered by Scalar CDN.
 * Renders the OpenAPI 3.1 spec defined in /openapi.json.
 * #93 — OpenAPI/Swagger spec
 */
export default defineEventHandler(() => {
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Tracciona API Docs</title>
  <style>body { margin: 0; }</style>
</head>
<body>
  <script
    id="api-reference"
    data-url="/openapi.json"
    data-configuration='{"theme":"saturn","hiddenClients":true}'
  ></script>
  <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
</body>
</html>`

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
})
