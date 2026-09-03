Perfecto, ambas decisiones son las correctas desde el punto de vista de seguridad. Implemento todo: módulo de cifrado, utilidad compartida de parseo/serialización, actualización de todos los puntos que leen/escriben `byok_key`, cierre del leak de claves en Settings, y el script de migración única.

## 1. Módulo de cifrado (AES-256-GCM)

## 2. Utilidad compartida de parseo/serialización BYOK (cierra también la duplicación de la Tarea 8)

## 3. Actualizar `app/actions/profile.ts` (cifrar en escritura, nunca devolver claves reales)

## 4. Actualizar los dos Route Handlers que leen `byok_key`

## 5. Cerrar el leak en `app/dashboard/page.tsx` y `app/dashboard/settings/page.tsx`

## 6. Propagar el cambio a `SettingsView.tsx` y `AdvancedBYOKForm.tsx`

## 7. Script de migración única

## 8. Documentar las nuevas variables de entorno

Ahora reviso diagnósticos de todos los archivos tocados en esta tarea:

Correcto y limpio. Ahora verifico que no quede ninguna referencia rota a `userKeys`/`initialKeys` en todo el proyecto:

No quedan referencias rotas. También confirmo que el script de migración no quede excluido por `.gitignore` (solo ignora `scratch/`, no `scripts/`):

## Resumen de la Tarea 1 (completada)

### Comando para generar la clave maestra

```bash
openssl rand -base64 32
```

Copia el resultado y añádelo a tu `.env.local`:

```env
BYOK_ENCRYPTION_KEY=<el-valor-generado>
```

**Guárdala también en un lugar seguro fuera del repo** (gestor de contraseñas). Si la pierdes, las claves BYOK ya cifradas quedan irrecuperables.

### Archivos nuevos
- **`vellura/utils/crypto.ts`** — AES-256-GCM con el módulo nativo `node:crypto`. Formato de sobre versionado `v1:<iv>:<authTag>:<ciphertext>` (todo en base64), que permite distinguir filas ya migradas.
- **`vellura/utils/byok.ts`** — capa única de parseo/serialización: `parseStoredUserKeys()` (descifra + parsea, con fallback defensivo a texto plano legado si el valor no es un sobre reconocido), `encryptUserKeys()` y `getConfiguredProviders()`. Esto también resuelve parte de la Tarea 8 (duplicación), ya que antes esta lógica de parseo estaba copiada en 4 archivos distintos.
- **`vellura/scripts/migrate-byok-encryption.mjs`** — script de migración única, autocontenido (sin alias `@/`, sin TypeScript), idempotente (omite filas ya cifradas), usa el Service Role Key para saltar RLS.

### Archivos modificados
- `app/actions/profile.ts` — `updateBYOK` y `updateProviderKey` ahora cifran antes de guardar. **`updateProviderKey` ya no devuelve las claves reales al cliente**, solo `configuredProviders: string[]`.
- `app/api/generate/route.ts` y `app/api/parse-resume/route.ts` — usan `parseStoredUserKeys()` en vez de `JSON.parse` inline.
- `app/dashboard/page.tsx` y `app/dashboard/settings/page.tsx` — usan `getConfiguredProviders()`; **ya no computan ni pasan `userKeys` con valores reales**.
- `components/dashboard/SettingsView.tsx` y `components/dashboard/AdvancedBYOKForm.tsx` — el prop cambió de `userKeys`/`initialKeys` (valores reales) a `configuredProviders`/`initialConfiguredProviders` (solo IDs). El estado del cliente ahora es `Record<string, boolean>`, nunca contiene un valor de clave real.
- `VELLURA_README.md` — documenta `BYOK_ENCRYPTION_KEY` y el comando de migración.

### Vulnerabilidad cerrada de más
De paso until cerré el hallazgo relacionado: `updateProviderKey` devolvía el mapa completo de claves (`{ ...prev, [provider]: keyVal }` en el cliente, `keys` en la respuesta del Server Action) — aunque el componente no lo renderizaba, sí viajaba en el payload de la Server Action hacia el navegador. Ahora nunca se transmite ningún valor real de clave desde el servidor hacia el cliente en ningún flujo.

### Validación
Revisé diagnósticos de los 9 archivos tocados/creados. Sin errores nuevos: los únicos restantes son los `any` y el `setState` en efecto ya catalogados en la Tarea 12 (deuda preexistente, líneas verificadas una por una tras el shift). No ejecuté el script de migración (requiere tus credenciales reales de Supabase) ni `npm run lint`/build por terminal.

### Antes de ejecutar la migración

1. Añade `BYOK_ENCRYPTION_KEY` a tu `.env.local` (comando arriba).
2. Ve a **Supabase → Project Settings → API** y copia el **Service Role Key**.
3. Añádelo temporalmente a `.env.local` como `SUPABASE_SERVICE_ROLE_KEY=...`.
4. Ejecuta:
   ```bash
   node --env-file=.env.local scripts/migrate-byok-encryption.mjs
   ```
5. Verás un resumen (`Migrated`, `Already encrypted`, `Failed`, `Total scanned`). Si `Failed > 0`, el script termina con código de salida distinto de cero para que lo notes.
6. **Elimina `SUPABASE_SERVICE_ROLE_KEY` de tu `.env.local`** una vez termine — no lo necesita la app en funcionamiento normal, solo este script.

¿Quieres que ejecute el script yo mismo (necesitaría que me confirmes que ya configuraste ambas variables en tu `.env.local`), o prefieres correrlo tú y seguimos con la **Tarea 4/9 (schema SQL + cuota atómica)** a continuación?
