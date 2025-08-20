## TaskMaster — Gestor de tareas moderno

TaskMaster es una app de tareas innovadora y sobria, creada con Angular 19 y preparada para ejecutarse como app móvil nativa mediante Capacitor. Su arquitectura modular aplica SOLID y el patrón Repository para facilitar mantenimiento y futura conexión a API.

### Características clave
- Gestión de tareas con título, descripción, prioridad, categoría y fechas
- Filtros avanzados y búsqueda en tiempo real
- Estadísticas compactas y sección de completadas colapsable (divulgación progresiva)
- UI responsive con Tailwind CSS v4
- Preparada para Android/iOS con Capacitor

## Especificaciones del proyecto
- Angular 19 (standalone components)
- TypeScript, RxJS
- Tailwind CSS v4 (import v4 en `styles.css`)
- Persistencia local con LocalStorage
- Patrón Repository + SOLID
- Compatibilidad Capacitor (android/ios)

## Estructura principal
```
src/
├─ app/
│  ├─ components/
│  │  ├─ todo-list/
│  │  ├─ todo-item/
│  │  ├─ todo-form/
│  │  ├─ todo-filters/
│  │  ├─ todo-stats/
│  │  ├─ todo-stats-compact/      # chips de estadísticas
│  │  ├─ ui-toolbar/              # toolbar sticky
│  │  └─ ui-filters-drawer/       # drawer lateral de filtros
│  ├─ core/
│  │  ├─ interfaces/
│  │  ├─ repositories/
│  │  ├─ services/
│  │  │  └─ ui-preferences.service.ts   # preferencias UI (persistencia)
│  │  └─ providers/
│  └─ models/
└─ styles.css
```

## Instalación y scripts
```bash
# Instalar dependencias
npm install

# Desarrollo
npm start

# Build producción (Angular)
npm run build:prod

# Otros scripts útiles
npm run build          # build estándar
npm run watch          # build en watch
npm test               # pruebas
```

## Capacitor (Android/iOS)

Capacitor ya está integrado. Archivo: `capacitor.config.ts` con `webDir: dist/todo-app/browser`.

### Instalación inicial de plataformas (una sola vez)
```bash
npm i @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
```

### Flujo de actualización tras cambios en la web
```bash
# 1) Compilar Angular a producción
npm run build:prod

# 2) Sincronizar Capacitor (ambas plataformas)
npx cap sync

# (opcional) Si no cambian plugins nativos, solo copiar assets
npx cap copy
```

### Abrir proyectos nativos
```bash
npm run cap:android   # abre Android Studio
npm run cap:ios       # abre Xcode (en macOS)
```

### Diagnóstico
```bash
npx cap doctor
```

### Notas para Windows
- Ejecutar comandos de Capacitor en PowerShell o CMD (evitar Git Bash) para prevenir errores como `spawn EINVAL`.
- Si aparece `The web assets directory must contain an index.html`, asegúrate de:
  - `webDir` = `dist/todo-app/browser` en `capacitor.config.ts`
  - Ejecutar `npm run build:prod` antes de `npx cap sync`.

### Requisitos iOS (en macOS)
- Instalar Xcode y abrirlo al menos una vez
- Instalar CocoaPods: `sudo gem install cocoapods` o `brew install cocoapods`
- Luego: `npx cap sync ios && npm run cap:ios`

## Arquitectura (resumen)
- Repository Pattern: capa de acceso a datos desacoplada (LocalStorage por defecto)
- `TodoService`: orquesta estado y operaciones (RxJS)
- Standalone Components modulares, UI limpia y accesible

## Roadmap breve
- Modo oscuro
- Subtareas y etiquetas
- Notificaciones push (Capacitor)
- Sincronización con API y modo offline

---

TaskMaster — Organiza tu vida, una tarea a la vez ✨
