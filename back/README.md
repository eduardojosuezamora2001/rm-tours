# RM Tours — API

API Hono desplegable en Cloudflare Workers, con Supabase Auth, PostgreSQL y Storage privado. Contratos compartidos en `../shared`.

Este backend es el único cliente de Supabase. Gestiona inicio/cierre de sesión, renovación de cookies HttpOnly, recuperación PKCE y streaming de imágenes. Las operaciones privadas usan el JWT verificado de la propietaria y RLS, sin clave privilegiada. El frontend accede por un proxy del mismo origen; las mutaciones requieren un origen permitido y `X-RM-Request: 1`.

Consultar la [guía completa](../README.md) para migraciones, creación de la cuenta de la dueña, permisos y despliegue.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm test
pnpm typecheck
pnpm build
```

Copiar `.dev.vars.example` a `.dev.vars` y completar la URL y clave publishable de Supabase. La API local usa el puerto 8787. Las pruebas de migración/RLS usan PostgreSQL embebido y no requieren Docker. `pnpm build` valida el empaquetado sin desplegar.
