# TropelCare Control Room

Frontend para la Hackathon TropelCare Pizza Protocol. La app consume la API cerrada entregada por el TA y cubre los cinco checkpoints: autenticacion, dashboard, atlas paginado, feed infinito, detalle de senal y scrollytelling de sectores.

## Integrantes

- Leonardo Daniel Panduro Chinchay
- Valentina Alvarez Beraun
- Steven Daniel Norena Paredes

## Stack

- React + TypeScript estricto
- Vite
- React Router
- Tailwind CSS
- Fetch API

No usa React Query, SWR, TanStack Query, RTK Query, Material UI, Ant Design, Chakra, Mantine, NextUI ni templates de dashboard.

## Variables

Crear `.env` a partir de `.env.example`:

```properties
VITE_API_BASE_URL=https://<backend-url>/api/v1
VITE_TEAM_CODE=TEAM-0XX
VITE_EMAIL=operator@tuckersoft.com
```

El password no se guarda en el repositorio.

## Comandos

```bash
npm install
npm run dev
npm run typecheck
npm run lint
npm run build
```

## Rutas

- `/login`
- `/dashboard`
- `/tropels`
- `/signals`
- `/signals/:id`
- `/sectors`
- `/sectors/:id/story`

## Decisiones Tecnicas

- Las respuestas de API estan tipadas en `src/api/types.ts`; no se usa `any` para DTOs.
- El cliente HTTP central agrega `Authorization: Bearer <jwt>` y normaliza errores del backend.
- La sesion se restaura con `/auth/me` al recargar.
- Tropeles usa paginacion real del servidor y mantiene filtros, busqueda, pagina, size y sort en la URL.
- Requests antiguas de Tropeles se cancelan con `AbortController` y se descartan con un contador de secuencia.
- El feed de Senales usa cursor real, `IntersectionObserver`, deduplicacion por ID y una sola request adicional en vuelo.
- El feed conserva paginas cargadas y scroll al abrir/cerrar detalle mediante memoria local por filtros.
- PATCH de Senal deshabilita acciones mientras la request esta en vuelo, conserva el estado anterior si falla y actualiza el feed memorizado si funciona.
- Sector Story usa las 8 etapas del endpoint, visual persistente, progreso, `IntersectionObserver`, soporte de teclado, `prefers-reduced-motion`, CSS Scroll-driven Animations con `@supports` y View Transition API cuando existe.
- `public/_redirects` y `vercel.json` cubren refresco directo en rutas internas para Netlify/Vercel.

## Deploy

Configurar `VITE_API_BASE_URL` en el proveedor de deploy. El build genera una SPA en `dist/`.
