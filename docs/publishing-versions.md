# Publicación de versiones (`@step-nc/*`)

Este repositorio usa **[Changesets](https://github.com/changesets/changesets)** para versionar y publicar los paquetes publicables del monorepo en npm. La rama de integración por defecto es **`master`** (configurada en `.changeset/config.json` como `baseBranch`).

Para que la publicación automática en GitHub Actions funcione, hace falta el secret **`NPM_TOKEN`**. Los pasos concretos están en [Configurar `NPM_TOKEN` en GitHub](./github-npm-token.md).

---

## Ideas clave

| Concepto | Qué es |
|----------|--------|
| **Changeset** | Un archivo en `.changeset/` que describe qué paquetes cambian y el tipo de bump (major / minor / patch). |
| **PR “Version Packages”** | Pull request que aplica esos bumps, actualiza `package.json`, changelogs y dependencias internas. |
| **Publicación a npm** | Ocurre cuando ese PR ya está mergeado en `master` y no quedan changesets pendientes: el workflow ejecuta `changeset publish`. |

El paquete **`@step-nc/examples`** está en la lista `ignore` de Changesets: no se versiona ni se publica.

---

## Cómo funciona el flujo (resumen)

1. **Desarrollo normal:** implementas cambios en ramas y abres PRs hacia `master` (el CI valida typecheck, lint, tests, etc., cuando exista el workflow de CI).
2. **Registrar la intención de release:** en una rama (o en `master` tras mergear), añades uno o más changesets con `pnpm changeset`. Haces commit y push de los archivos `.changeset/*.md`.
3. **Push a `master`:** el workflow de release (`.github/workflows/release.yml`, cuando esté en el repo) se ejecuta.
   - Si **hay** changesets pendientes, [changesets/action](https://github.com/changesets/action) crea o actualiza un PR titulado **“chore: version packages”** con los bumps y changelogs.
   - Si **no hay** changesets pendientes (porque ya mergeaste ese PR), la acción ejecuta **`pnpm run release`** (`changeset publish`) y publica en npm.
4. Antes de publicar, el workflow corre **`pnpm run prerelease`** (typecheck, `lint:check`, tests). Si falla, no se publica.

La autenticación con npm en CI usa el archivo **`.npmrc`** en la raíz:

```text
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

El valor real de `NPM_TOKEN` lo inyecta GitHub Actions desde los secrets del repositorio.

---

## Generar una nueva versión (paso a paso)

### 1. Crear el changeset

En la raíz del monorepo:

```bash
pnpm changeset
```

El asistente interactivo te pide:

- Qué paquetes afectan los cambios (puedes elegir varios).
- El tipo de versión por paquete: **major**, **minor** o **patch**.
- Un mensaje corto para el changelog (orientado a usuarios).

Se crean uno o más archivos bajo **`.changeset/`** (por ejemplo `brave-foxes-jump.md`). Esos archivos deben **commitearse** junto con el código relacionado, o en un commit dedicado antes del release.

Para un cambio que no requiere release (solo interno), puedes usar:

```bash
pnpm changeset --empty
```

### 2. Integrar en `master`

Abre un PR hacia **`master`**, pasa el CI y mergea. Alternativamente, si ya trabajas directamente en `master`, haz push tras el commit del changeset.

### 3. PR “chore: version packages”

Tras el push a `master` con changesets pendientes, el workflow debería abrir o actualizar el PR **“chore: version packages”**. Revísalo (versiones, changelogs) y **mergealo** cuando esté listo.

### 4. Publicación

Al mergear ese PR, el siguiente run en `master` ya no verá changesets “abiertos” y ejecutará la publicación con **`pnpm run release`**.

### 5. Comprobar en npm

Por ejemplo:

```bash
npm view @step-nc/express-parser version
npm view @step-nc/step-factory version
```

Lista de paquetes publicables del workspace: `express-parser`, `express-dictionary`, `p21-parser`, `p21-reader`, `p21-writer`, `step-factory`.

---

## Comandos útiles (referencia)

| Comando | Uso |
|---------|-----|
| `pnpm changeset` | Crear changesets nuevos. |
| `pnpm changeset status` | Ver estado respecto a la rama base (`master`). |
| `pnpm version-packages` | Aplica versiones y changelogs localmente (`changeset version`). Suele hacerlo la CI vía el PR automatizado. |
| `pnpm release` | Publica a npm (`changeset publish`). En la práctica lo ejecuta el workflow tras mergear el PR de versiones. |

**No publiques manualmente a npm** salvo emergencia y criterio del equipo: el flujo diseñado asume publicación desde Actions con el mismo proceso reproducible.

---

## Dependencias entre paquetes

En `.changeset/config.json`, `updateInternalDependencies` está en **`patch`**: cuando sube la versión de un paquete, las referencias internas (`workspace:*`) se actualizan con bumps de patch de forma coordinada en el PR de versiones.

---

## Más ayuda

- [Configurar `NPM_TOKEN` en GitHub](./github-npm-token.md)
- [Documentación de Changesets](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md)
