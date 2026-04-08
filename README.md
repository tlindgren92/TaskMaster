# TaskMaster — Plataforma de Habitos con IA y Gamificacion

TaskMaster es una plataforma inteligente para adoptar buenos habitos y dejar malos habitos, potenciada con IA (Anthropic Claude / Google Gemini) y un sistema de gamificacion con puntos canjeables por premios reales. Construida con Angular 19 y preparada para ejecutarse como app movil nativa con Capacitor.

## Estado del proyecto

| Fase | Descripcion | Estado |
|------|-------------|--------|
| Fase 1 | Fundacion (arquitectura, routing, modelos) | Completada |
| Fase 2 | Sistema de habitos (CRUD, rachas, calendario) | Completada |
| Fase 3 | Gamificacion (XP, niveles, logros, desafios) | Completada |
| Fase 4 | Integracion IA (Anthropic Claude + Google Gemini) | Completada |
| Fase 5 | Backend NestJS + Tienda de premios | Pendiente |
| Fase 6 | Rendimiento, PWA y polish | Pendiente |

## Caracteristicas implementadas

### Sistema de habitos
- Crear, editar, archivar y eliminar habitos
- Tipos: **construir** buenos habitos o **dejar** malos habitos
- Frecuencias: diario, entre semana, fines de semana, semanal
- 7 categorias: salud, ejercicio, productividad, mindfulness, social, aprendizaje, custom
- Tracking de completados con historial
- Rachas (streaks) con calculo inteligente por frecuencia
- Calendario heatmap estilo GitHub
- Tasa de completado y estadisticas

### Gamificacion
- **Sistema de XP**: gana experiencia al completar habitos
- **Niveles**: del Novato (1) al Leyenda (10) con progresion exponencial
- **16 logros** predefinidos en 6 categorias (rachas, consistencia, variedad, hitos, explorador, nivel)
- **Desafios semanales** generados automaticamente
- **Puntos canjeables** que se ganan al subir de nivel
- **Feedback visual**: popups de XP flotantes, modal de level-up con particulas, toasts de logros desbloqueados

### Inteligencia Artificial
- **Multi-proveedor**: Anthropic Claude y Google Gemini con cambio dinamico
- **Insight diario**: analisis personalizado de tus habitos generado por IA
- **Sugerencias IA**: recomendaciones de nuevos habitos basadas en tu perfil
- **Coach IA**: chat conversacional para motivacion, consejos y analisis
- **Fallback offline**: mensajes motivacionales y insights pre-construidos cuando no hay conexion
- **Configuracion flexible**: elige proveedor, modelo y API key desde el perfil
- **Modelos soportados**: Claude Sonnet 4, Claude Haiku 4.5, Gemini 2.0 Flash, Gemini 2.5 Pro/Flash

### Dashboard
- Saludo personalizado con hora del dia
- Barra de XP con nivel actual
- Estadisticas rapidas (habitos hoy, completados, puntos, mejor racha)
- Barra de progreso diario
- Desafios activos
- Lista de habitos de hoy con toggle rapido
- Vista de mejores rachas

### UI/UX
- Navegacion con sidebar (desktop) y bottom nav (mobile)
- Routing lazy-loaded para cada seccion
- Animaciones fluidas (fade-in, slide-up, bounce, shimmer)
- Sistema de notificaciones toast
- Modales reutilizables
- Soporte para accesibilidad (prefers-reduced-motion)
- Componentes responsivos

## Stack tecnologico

| Tecnologia | Uso |
|------------|-----|
| Angular 19.2 | Framework frontend (standalone components, Signals, OnPush) |
| TypeScript | Tipado estatico end-to-end |
| Tailwind CSS v4 | Estilos utility-first |
| Angular Signals | Estado reactivo (reemplaza BehaviorSubjects gradualmente) |
| RxJS | Capa de repositorios (Observable-based) |
| localStorage | Persistencia temporal (hasta Fase 5) |
| Capacitor | Apps nativas Android/iOS |

## Arquitectura

```
src/app/
  core/
    interfaces/          # Contratos de repositorios (InjectionToken)
    repositories/        # Implementaciones localStorage
    services/            # Logica de negocio (Signals-based)
    utils/               # Utilidades (fechas, rachas, XP)
    providers/           # Providers consolidados
  models/                # Interfaces y tipos del dominio
  shared/
    components/
      layout/            # App shell, sidebar, bottom nav
      ui/                # Componentes reutilizables (toast, modal, progress-bar, etc.)
    pipes/               # Pipes personalizados
  features/
    dashboard/           # Pagina principal con widgets
    habits/              # CRUD y detalle de habitos
    achievements/        # Logros y desafios
    rewards/             # Tienda de premios (proximamente)
    profile/             # Perfil de usuario
  legacy/
    todo/                # Componentes originales (migracion)
```

### Patrones clave
- **Repository Pattern**: capa de datos desacoplada, permite swap localStorage -> API
- **Signals + OnPush**: reactividad fine-grained sin zone.js overhead
- **Lazy loading**: cada feature se carga bajo demanda
- **Standalone components**: sin NgModules, imports explicitos

## Instalacion y scripts

```bash
# Instalar dependencias
npm install

# Desarrollo
npm start

# Build produccion
npm run build:prod

# Otros scripts
npm run build          # build estandar
npm run watch          # build en watch
npm test               # pruebas
```

## Capacitor (Android/iOS)

Capacitor esta integrado. Archivo: `capacitor.config.ts` con `webDir: dist/todo-app/browser`.

```bash
# Instalacion inicial de plataformas (una sola vez)
npm i @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios

# Flujo de actualizacion
npm run build:prod
npx cap sync

# Abrir proyectos nativos
npm run cap:android   # Android Studio
npm run cap:ios       # Xcode (macOS)

# Diagnostico
npx cap doctor
```

### Notas para Windows
- Ejecutar comandos de Capacitor en PowerShell o CMD (evitar Git Bash)
- Si aparece `spawn EINVAL`, asegurarse de no usar Git Bash
- `webDir` = `dist/todo-app/browser` en `capacitor.config.ts`

## Roadmap

### Fase 4 — Integracion IA (Completada)
- Multi-proveedor: Anthropic Claude + Google Gemini
- Insight diario personalizado, sugerencias IA, coach chat
- Configuracion de API keys desde el perfil
- Fallback offline con templates pre-construidos

### Fase 5 — Backend NestJS + Tienda de premios
- API REST con NestJS y PostgreSQL
- Autenticacion JWT con Passport.js (local + Google OAuth)
- Tienda de premios reales canjeables con puntos
- Sincronizacion cloud con migracion desde localStorage
- Historial de canjes con estados

### Fase 6 — Rendimiento, PWA y polish
- Zoneless change detection (experimental)
- @defer blocks para lazy load de componentes pesados
- PWA con Service Worker (cache-first + network-first)
- Modo oscuro (dark mode)
- Push notifications para recordatorios (Capacitor)
- Virtual scrolling para listas largas

## Contribuir

1. Fork el repositorio
2. Crea una branch (`git checkout -b feature/nueva-feature`)
3. Commit tus cambios (`git commit -m 'Add nueva feature'`)
4. Push a la branch (`git push origin feature/nueva-feature`)
5. Abre un Pull Request

---

TaskMaster — Transforma tus habitos, transforma tu vida

---

## ☕ Apoya el proyecto / Support the project

TaskMaster es y seguirá siendo un proyecto de código abierto. Sin embargo, mantener la infraestructura, cubrir los costos de las APIs de Inteligencia Artificial (Claude y Gemini) y dedicar tiempo a desarrollar nuevas funciones como la **Tienda de Premios Reales** requiere recursos.

Si encuentras valor en esta herramienta y quieres ayudar a que siga creciendo, cualquier donación es enormemente agradecida.

| Plataforma | Enlace |
|------------|--------|
| **PayPal** | [Haz una donación aquí](https://www.paypal.com/donate/?hosted_button_id=DQ6ZXFQMBALKL) |

> **Nota:** Tu apoyo ayuda directamente a financiar los créditos de IA para que más usuarios puedan disfrutar de los insights personalizados y el Coach IA.

---
