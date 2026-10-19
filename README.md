# RM Tours Costa Rica

## Organización de rutas del backend

Las rutas de Hono están agrupadas por recurso y superficie de acceso:

```text
back/src/routes/
├── public/
│   ├── catalog.ts    # tours, detalle y opciones de tour
│   ├── legal.ts      # privacidad y términos publicados
│   ├── settings.ts   # configuración pública de contacto
│   └── index.ts
└── admin/
    ├── auth.ts       # autenticación y autorización de la dueña
    ├── session.ts    # sesión administrativa
    ├── tours.ts      # CRUD y publicación de tours
    ├── media.ts      # cargas y lectura privada de imágenes vía API
    ├── settings.ts   # configuración editable
    ├── legal.ts      # páginas legales editables
    └── index.ts
```

Los prefijos públicos (`/api/v1`) y administrativos (`/api/v1/admin`) se mantienen sin cambios. `index.ts` compone los routers y el middleware común; cada módulo contiene únicamente los handlers de su categoría.

Catálogo bilingüe de tours con planes y precios orientativos opcionales en USD. El formulario prepara una solicitud de WhatsApp; el cliente la envía y la coordinadora confirma precio y disponibilidad. No se guardan cotizaciones ni datos personales del formulario.

## Estructura

- `front`: React 19, React Router 8, nuqs, shadcn/Radix, Tailwind 4, TanStack Query, React Hook Form, Zod e i18next.
- `back`: API Hono para Cloudflare Workers, Supabase Auth, PostgreSQL y Storage.
- `shared`: contratos TypeScript y reglas de publicación comunes.
- `back/supabase`: configuración local y migración de tablas, índices, RPC transaccional, políticas RLS y Storage privado.

Los dos proyectos conservan su propio `package.json` y lockfile. Ejecutar los comandos desde el directorio indicado. Requiere Node 24 y pnpm 12. Las referencias originales de Stitch están en `front/desing/stitch`.

La autoridad visual es el proyecto Stitch `4366171717337285856`, con referencias independientes para escritorio y móvil. Sus HTML y capturas completas se conservan localmente; las interfaces deben reproducir esas composiciones, no reinterpretarlas. Los tokens extraídos están en `front/src/stitch-tokens.css`, y el logotipo, fotografías e iconos locales en `front/public/brand`. Las procedencias están documentadas en `sources.json` y en los metadatos de las imágenes. Los datos operativos, reseñas y certificaciones ilustrativos de los diseños no se presentan como hechos del negocio.

## Desarrollo

1. Instalar dependencias con `pnpm install --frozen-lockfile` tanto en `front` como en `back`.
2. Copiar `back/.dev.vars.example` a `back/.dev.vars`. El frontend no necesita un archivo de variables de entorno.
3. Completar URL y clave **publishable** de Supabase únicamente en `back/.dev.vars` (la clave `anon` local también es compatible). El frontend no contiene variables ni SDK de Supabase.
4. Desde `back`, ejecutar `pnpm dev`; desde `front`, `pnpm dev`.
5. Abrir `http://localhost:5173`. Vite reenvía `/api/*` al backend en `http://localhost:8787`, conservando el origen y las cookies del sitio. El navegador solo consulta su propio origen.

### Catálogo desde el backend

El sitio consulta siempre `/api/v1`, también en desarrollo. No incluye un catálogo local ni datos de respaldo cuando la API falla. Los tours, planes, secciones, fotografías y datos de contacto se administran desde el backend y Supabase.

El proyecto conectado `rm-tours` contiene 20 tours de prueba de la península de Nicoya: cinco para Paquera, Tambor, Montezuma y Santa Teresa. Sus planes, secciones e imágenes se almacenan en Supabase; los avisos de cada tour identifican precios, horarios, servicios y fotografías como ilustrativos. No son una oferta comercial confirmada ni se cargan automáticamente al iniciar la aplicación.

## Conectar Supabase

### Local

Iniciar Docker Desktop. Desde `back`:

```sh
pnpm exec supabase start
pnpm exec supabase db reset
pnpm exec supabase status
```

`db reset` recrea **la base local**: usarlo únicamente en desarrollo. La configuración incluye registro público deshabilitado y redirección de recuperación a `http://localhost:5173/admin-tours/reset-password`. Las migraciones no crean cuentas ni incluyen información de clientes.

### Proyecto alojado

Crear un proyecto de Supabase vacío y ejecutar la migración SQL en su SQL Editor, o vincular el CLI al proyecto y revisar/aplicar las migraciones con `supabase db push`. Consultar `pnpm exec supabase <comando> --help` antes de operar sobre un proyecto remoto. No aplicar sobre una base existente sin revisar posibles conflictos de nombres.

En Auth, deshabilitar **Allow new users to sign up**, definir Site URL y agregar la URL exacta de recuperación `/admin-tours/reset-password` del dominio del front. Configurar SMTP de producción para entregar recuperaciones de contraseña.

Crear la única cuenta de la dueña desde el dashboard administrativo de Supabase. Asignarle el rol mediante SQL, sustituyendo el correo por el de esa cuenta:

```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"owner"}'::jsonb
where email = 'correo-de-la-duena@example.com';
```

Cerrar la sesión e iniciarla de nuevo después de cambiar el rol. No usar `user_metadata` para permisos. La API valida el usuario con Supabase y las operaciones de datos se ejecutan con su JWT y RLS, sin clave privilegiada. Las políticas basadas en JWT reflejan cambios de permisos al renovar el token; mantener una expiración corta para la cuenta administrativa.

## Administración y contenido

Entrar a `/admin-tours`. Crear un tour, editar el plan General o agregar opciones, cargar fotografías y organizar las secciones. Las flechas cambian el orden sin depender de arrastrar elementos. En Fotografías, elegir si la imagen pertenece a la galería principal o a una sección de galería; todas las imágenes de la galería principal aparecen en el detalle, incluida la portada. La primera imagen se usa como portada del catálogo, el inicio y el detalle en escritorio y móvil. Las flechas permiten cambiar el orden y elegir la portada. Los textos bilingües de las imágenes también aparecen como pies de foto en el detalle.

Se pueden guardar borradores incompletos. Para publicar se requieren nombre, resumen y punto de encuentro en ambos idiomas; al menos un plan activo con descripción y servicios traducidos; una portada; textos accesibles de imágenes; y traducciones completas de las secciones visibles. Las comprobaciones se aplican también en PostgreSQL al finalizar la transacción. El guardado detecta ediciones concurrentes mediante `updated_at`.

Configurar el WhatsApp de la coordinadora con código de país y dígitos, sin `+` ni espacios. Publicar privacidad y términos después de incorporar los textos reales en ambos idiomas. No se incluyen certificaciones, opiniones, garantías, disponibilidad ni condiciones legales inventadas.

Las fotografías nuevas se optimizan en el navegador hasta 1920 px y generan una miniatura WebP de hasta 640 px de ancho, sin ampliar imágenes pequeñas. Se conserva una imagen principal WebP que ya tenga dimensiones adecuadas; JPEG y PNG se convierten solo cuando el ahorro supera el 10 % y 2 KB, o necesitan reducir dimensiones. La principal admite hasta 5 MB y la miniatura hasta 1 MB. Las tarjetas públicas usan la miniatura y permiten que el navegador elija la principal en pantallas de mayor densidad. La galería utiliza la principal.

Las versiones se almacenan en el bucket privado `tour-media`: el original conserva su ruta, la miniatura usa el sufijo `.card.webp` y una principal convertida desde JPEG/PNG usa `.main.webp`. Las variantes solo se guardan si ahorran al menos el 10 % y 2 KB. Los originales WebP no se vuelven a convertir. En el administrador siguen siendo una sola fotografía. Se sirven por `/api/v1/media/:tourId/:file` (la API prefiere la principal WebP, si existe) y `?variant=card` (miniatura, con respaldo de principal WebP u original), con las mismas rutas administrativas y `private, no-store`. El tipo MIME refleja el archivo servido, aunque la URL de referencia conserve la extensión original. Las migraciones `media_thumbnails` y `media_webp_masters` permiten leer variantes únicamente cuando su original pertenece a un tour publicado y una sección visible. Las URLs firmadas nunca llegan al navegador; no se requieren transformaciones de pago.

La galería principal y el modal comparten la carga, decodificación y precarga de las fotos anterior y siguiente. La portada se solicita con prioridad alta y su precarga vecina empieza después de cargarla. Flechas, miniaturas y apertura del modal reutilizan las descargas en una caché en memoria de hasta seis fotos y 24 MB, conservando las fotos visibles en ambas superficies. Cerrar el modal permite seguir usando esa caché en la galería; al abandonar el tour, se cancelan descargas pendientes y se liberan las URLs temporales. Las flechas actualizan únicamente la galería o el visor. Esto también se aplica a la vista previa privada y no modifica las respuestas `no-store` del backend.

Al abrir el catálogo del administrador, se revisan las fotografías guardadas, incluidas las de borradores, y se generan las principales WebP y miniaturas que falten cuando el ahorro es útil. Se procesa una foto a la vez, se muestra el avance y la reducción de descarga de las principales convertidas; si se abandona el catálogo, se continúa al regresar. Los originales existentes quedan como respaldo y siguen ocupando almacenamiento: el ahorro indicado corresponde a los archivos que se descargan, no a espacio total liberado. Sus identificadores, traducciones, orden, portada y referencias no se modifican. Las versiones ya creadas se omiten; las conversiones descartadas por poco ahorro pueden revisarse de nuevo al volver a entrar. No se procesan archivos huérfanos. Al eliminar explícitamente fotografías o tours, la limpieza incluye originales y variantes. Las subidas abandonadas sin guardar permanecen privadas y se pueden retirar desde Storage, comprobando que su principal no esté referenciada en `tour_media`.

## i18n

La ruta `/es` o `/en` es la fuente de verdad; `/` redirige a `/es`. El selector conserva la ruta, filtros y selección. Los datos personales permanecen en memoria al cambiar de idioma. El panel tiene interfaz española.

`front/src/i18n/locales/{es,en}` contiene JSON por módulos: common, catalog, tour, quote, legal, auth y admin. Las claves están tipadas; los módulos secundarios se cargan bajo demanda. Las pruebas comprueban paridad de claves. El contenido comercial bilingüe se edita en Supabase, separado de las traducciones de interfaz. Las fechas usan `YYYY-MM-DD` y no se convierten a otro día por zona horaria; el día actual se determina en Costa Rica. Se formatean fechas y precios con `Intl`, siempre en USD.

## API

Prefijo `/api/v1`:

| Método y ruta | Función |
| --- | --- |
| `POST /auth/login`, `POST /auth/logout` | Inicio y cierre de sesión mediante cookies HttpOnly |
| `POST /auth/recover`, `GET /auth/callback`, `POST /auth/reset-password` | Recuperación PKCE y cambio de contraseña gestionados por el backend |
| `GET /media/:tourId/:file`, `GET /admin/media/:tourId/:file` | Lectura de imágenes públicas o privadas vía API |
| `GET /tours` | Catálogo paginado: `lang`, `q`, `destination`, `category`, `sort`, `page` |
| `GET /tours/:slug` | Tour publicado y sus planes, secciones y medios visibles |
| `GET /tour-options` | Nombres e identificadores para el formulario |
| `GET /settings` | Contacto público |
| `GET /legal/:slug` | Documento publicado: privacy o terms |
| `GET /admin/session` | Verificación de cuenta propietaria |
| `GET /admin/tours`, `GET /admin/tours/:id` | Gestión privada y vista previa |
| `PUT /admin/tours/:id` | Guardado completo transaccional |
| `DELETE /admin/tours/:id` | Eliminación del tour |
| `POST /admin/uploads` | Imagen multipart: file, tourId y thumbnail WebP opcional |
| `GET /admin/media-thumbnails` | Fotografías guardadas sin miniatura |
| `GET /admin/media-optimization` | Fotografías que requieren revisión de principal WebP o miniatura |
| `POST /admin/media-webp` | Principal WebP: multipart path y file; el servidor verifica el ahorro contra el original almacenado |
| `POST /admin/media-thumbnails` | Crear miniatura existente: multipart path y file; conserva el original |
| `PUT /admin/settings` | Contacto y datos del sitio |
| `GET /admin/legal`, `PUT /admin/legal/:slug` | Documentos legales |

Errores: `{ "error": { "code": "CODIGO_ESTABLE", "details": [] } }`. El front traduce los códigos. Las rutas administrativas requieren cookies de sesión y rol owner verificado por el backend con Supabase. Los tokens de acceso y renovación permanecen en cookies `HttpOnly`, `SameSite=Lax` y `Secure` en HTTPS; no se devuelven en JSON ni se guardan en localStorage. El backend renueva los tokens y conserva el JWT del usuario para aplicar RLS, sin `service_role`. Las mutaciones requieren `Origin` permitido y `X-RM-Request: 1` para prevenir CSRF. Respuestas privadas usan `no-store`. El catálogo filtra, ordena y pagina en PostgreSQL; los horarios no representan cupos.

La recuperación conserva la URL autorizada `/admin-tours/reset-password`: el frontend entrega el código de un solo uso a `/api/v1/auth/callback`, donde el backend lo intercambia mediante PKCE. El verificador permanece en una cookie HttpOnly durante diez minutos. El enlace debe abrirse en el mismo navegador que solicitó la recuperación. La sesión de recuperación tiene cookies separadas, no permite entrar al panel y se elimina al actualizar la contraseña. Las sesiones anteriores deben iniciar sesión de nuevo tras esta migración.

## Verificación

En `front`: `pnpm test`, `pnpm lint`, `pnpm build`, `pnpm test:e2e`. Instalar Chromium una vez con `pnpm exec playwright install chromium`.

En `back`: `pnpm test`, `pnpm typecheck`, `pnpm build`.

Las pruebas de datos ejecutan la migración real en PostgreSQL embebido (PGlite), con esquemas de soporte equivalentes para las referencias a Auth y Storage, y comprueban RLS con roles anon y authenticated. No requieren Docker. Las pruebas usan fixtures sintéticos aislados en `shared/testing` y respuestas de API interceptadas; esos datos no se importan desde la aplicación ni se distribuyen con el sitio. Verifican escritorio, móvil, formularios, idiomas, administración y accesibilidad. Esto no sustituye la comprobación de Auth, entrega de correo y Storage contra el proyecto Supabase conectado antes de publicar.

## Cloudflare Workers

No hay despliegue remoto automático. Primero configurar Supabase y contenido real.

1. En `back/wrangler.jsonc`, completar `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY` y `ALLOWED_ORIGINS` con los orígenes exactos del front, separados por comas. La clave publishable no es un secreto. Ejecutar `pnpm cf-typegen`, `pnpm typecheck`, `pnpm build` y `pnpm deploy` desde `back`.
2. El frontend no necesita variables de entorno para el catálogo. Su Worker usa el Service Binding `API` hacia `rm-tours-api`; ajustar el nombre si se renombra ese Worker. Ejecutar `pnpm cf-typegen`, `pnpm build` y después `pnpm deploy` desde `front`.
3. El Worker del front reenvía `/api/*` mediante Service Binding y sirve las demás rutas con Static Assets y fallback de SPA. La CSP limita `connect-src` e imágenes al mismo origen (más imágenes data/blob). No necesita permitir dominios de Supabase. Para probar ambos Workers localmente, ejecutar `pnpm preview` en `front`: inicia las dos configuraciones de Wrangler en una sola sesión y lee `back/.dev.vars`.
4. Actualizar URLs permitidas en Supabase Auth y CORS al asignar dominios. Los logs y trazas están activados y la API no registra cuerpos, tokens ni parámetros de cotización.
5. Comprobar el catálogo sin sesión, inicio/cierre de sesión, recuperación, publicación y carga/lectura de imágenes contra el entorno real. Confirmar la entrega de WhatsApp manualmente, sin confundir la apertura del enlace con una reserva confirmada.

La configuración local de Stitch `front/mcp.json` contiene credenciales y está excluida por `.gitignore`. No publicarla ni incorporarla al repositorio.
