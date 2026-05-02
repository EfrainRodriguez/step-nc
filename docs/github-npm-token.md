# Configurar `NPM_TOKEN` en GitHub Actions

El workflow de release usa **Changesets** para publicar los paquetes `@step-nc/*` en el registro público de npm. La autenticación se hace con un **token de npm** guardado como secret en GitHub, expuesto a Actions como la variable de entorno **`NPM_TOKEN`**.

En la raíz del repositorio, **`.npmrc`** contiene:

```text
//registry.npmjs.org/:_authToken=${NPM_TOKEN}
```

pnpm y `npm publish` leen esa línea; el valor lo reemplaza el entorno en CI. **No** debes commitear el token en texto claro.

Para el flujo completo de versiones y PRs, ver [Publicación de versiones](./publishing-versions.md).

---

## 1. Crear un token en npmjs.com

1. Inicia sesión en [https://www.npmjs.com/](https://www.npmjs.com/).
2. Abre tu avatar → **Access Tokens** (o directamente [https://www.npmjs.com/settings/~/tokens](https://www.npmjs.com/settings/~/tokens)).
3. **Generate New Token** → elige tipo **Automation** (recomendado para CI: publicar paquetes y omitir 2FA en ese flujo, según la política actual de npm).
4. Asigna un nombre reconocible (por ejemplo `step-nc-github-actions`).
5. Copia el token **una sola vez**; npm no lo volverá a mostrar.

Requisitos:

- La cuenta (o la organización npm) debe tener **permiso de publicación** en los paquetes bajo el scope **`@step-nc`**. Si es la primera publicación, puede hacer falta crear la organización o el scope en npm y vincular el usuario con permisos de **owner** o **maintainer** en esos paquetes.

---

## 2. Añadir el secret en GitHub

1. Abre el repositorio en GitHub.
2. **Settings** → **Secrets and variables** → **Actions**.
3. **New repository secret**.
4. **Name:** exactamente `NPM_TOKEN` (el workflow espera este nombre en `secrets.NPM_TOKEN`).
5. **Secret:** pega el token de npm (Automation).
6. Guarda.

Opcional:

- En organizaciones, puedes usar **Organization secrets** y restringir qué repos los ven, siempre que el nombre siga siendo `NPM_TOKEN` para este repo.

---

## 3. Cómo lo usa el workflow

En el job de release (por ejemplo `.github/workflows/release.yml`), el paso de Changesets suele incluir:

```yaml
env:
  GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  NPM_TOKEN: ${{ secrets.NPM_TOKEN }}
```

- **`GITHUB_TOKEN`**: lo proporciona GitHub; sirve para crear/actualizar el PR “chore: version packages” y hacer commits (requiere `permissions: contents: write` y `pull-requests: write` en el job).
- **`NPM_TOKEN`**: tu secret; lo lee `.npmrc` durante `pnpm install` / `changeset publish`.

---

## 4. Comprobar que funciona

1. Asegúrate de que el workflow de release está en la rama **`master`** (o la rama que dispare `on.push`).
2. Configura un changeset y sigue el flujo descrito en [Publicación de versiones](./publishing-versions.md).
3. Si la publicación falla con **401** o **OTP**, revisa:
   - que el secret se llama **`NPM_TOKEN`** sin typos;
   - que el token no ha expirado ni fue revocado;
   - que la cuenta tiene derechos de publicación en `@step-nc/*`;
   - que usas token **Automation** para CI (no un token de solo lectura).

---

## 5. Desarrollo local y avisos de pnpm

En tu máquina, si no defines `NPM_TOKEN`, pnpm puede mostrar avisos al leer `.npmrc` (sustitución de variable). Para publicar **localmente** (no recomendado como flujo habitual) podrías exportar el token en la sesión; en la práctica conviene dejar la publicación a GitHub Actions.

---

## Enlaces útiles

- [Tokens de acceso npm](https://docs.npmjs.com/about-access-tokens)
- [Secrets en GitHub Actions](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
- [changesets/action](https://github.com/changesets/action)
