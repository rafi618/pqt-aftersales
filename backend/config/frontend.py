from django.conf import settings
from django.http import HttpResponse, FileResponse, Http404
from django.views.generic import View


class FrontendAppView(View):
    """Serves the React app's index.html for any non-API route (SPA catch-all)."""

    def get(self, request, *args, **kwargs):
        index_file = settings.FRONTEND_DIST / 'index.html'
        if not index_file.exists():
            return HttpResponse(
                '<h1>Frontend not built</h1>'
                '<p>Run <code>cd frontend && npm run build</code> to build the React app.</p>',
                status=200,
            )
        return FileResponse(open(index_file, 'rb'), content_type='text/html')


class FrontendAssetView(View):
    """Serves files from frontend/dist (favicon.svg, icons.svg, etc)."""

    def get(self, request, path, *args, **kwargs):
        file = settings.FRONTEND_DIST / path
        if not file.exists() or not file.is_file():
            raise Http404
        # naive content-type guess
        ct = 'application/octet-stream'
        if path.endswith('.svg'): ct = 'image/svg+xml'
        elif path.endswith('.html'): ct = 'text/html'
        elif path.endswith('.css'): ct = 'text/css'
        elif path.endswith('.js'): ct = 'application/javascript'
        elif path.endswith('.json'): ct = 'application/json'
        return FileResponse(open(file, 'rb'), content_type=ct)
