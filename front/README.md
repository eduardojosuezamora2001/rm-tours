# RM Tours — front

React, shadcn, React Router, nuqs e i18next. Sitio público en `/es` y `/en`; administración privada en `/admin-tours`.

La guía completa de configuración de Supabase y despliegue está en [README del proyecto](../README.md).

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm lint
pnpm test:e2e
pnpm build
```

Copiar `.env.example` a `.env.local`. El front no usa SDK, URL ni claves de Supabase: datos, autenticación, recuperación y fotografías pasan por `/api/v1` del mismo origen. Vite reenvía las peticiones al backend local en el puerto 8787; en producción, `worker.ts` usa el Service Binding `API`. Mantener `pnpm dev` en `back` al usar `pnpm dev` en `front`. `pnpm preview` inicia ambos Workers juntos en el puerto 8788 y lee las credenciales desde `back/.dev.vars`. Las sesiones usan cookies HttpOnly gestionadas por el backend.

El catálogo se obtiene siempre del backend. No existen datos locales de respaldo ni un modo de demostración. Los fixtures de `shared/testing` solo se usan en pruebas automatizadas y no se incluyen en el sitio.
