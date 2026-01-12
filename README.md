<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1kXzjx7RjiXRDHbDlioE0MmgqqQVc37hY

## Configuración del Entorno

Esta aplicación requiere ciertas claves de API para funcionar. La configuración se gestiona a través de variables de entorno.

1.  **Crear un archivo de entorno local**:
    Copia el archivo de ejemplo `.env.example` y renómbralo a `.env.local`:
    ```bash
    cp .env.example .env.local
    ```

2.  **Añadir las claves de API**:
    Abre el archivo `.env.local` y añade tus credenciales para Supabase y Gemini API.

    ```
    # Credenciales de Supabase del dashboard de tu proyecto
    VITE_SUPABASE_URL="https://xxxxxxxxxxxxxxxxxxxx.supabase.co"
    VITE_SUPABASE_ANON_KEY="ey...xxxxxxxx"

    # Tu clave de API de Google Gemini
    GEMINI_API_KEY="AI...xxxxxxxx"
    ```
    **Importante:** El prefijo `VITE_` en las variables de Supabase es necesario para que sean accesibles desde el código del cliente.

## Ejecutar Localmente

**Requisitos:** [Node.js](https://nodejs.org/)

1.  **Instalar dependencias**:
    ```bash
    npm install
    ```

2.  **Configurar variables de entorno**:
    Asegúrate de haber completado los pasos en la sección "Configuración del Entorno".

3.  **Ejecutar la aplicación**:
    ```bash
    npm run dev
    ```

## Despliegue en Vercel

Cuando despliegues esta aplicación en Vercel, necesitarás configurar las mismas variables de entorno que definiste en tu archivo `.env.local`.

1.  Ve al dashboard de tu proyecto en Vercel.
2.  Navega a **Settings > Environment Variables**.
3.  Añade las siguientes variables:
    *   `VITE_SUPABASE_URL`
    *   `VITE_SUPABASE_ANON_KEY`
    *   `GEMINI_API_KEY`

Con esto, tu aplicación desplegada podrá conectarse a Supabase y a la API de Gemini correctamente.
