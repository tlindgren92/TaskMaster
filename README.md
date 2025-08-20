# TaskMaster - Aplicación de Gestión de Tareas

Una aplicación moderna y profesional para la gestión de tareas, construida con Angular 19 y diseñada para ser convertida en una aplicación móvil con Capacitor.

## 🚀 Características

### ✨ Funcionalidades Principales
- **Gestión completa de tareas** con título, descripción, prioridad y categorías
- **Sistema de prioridades** (Baja, Media, Alta, Urgente) con indicadores visuales
- **Categorización** de tareas para mejor organización
- **Fechas límite** con alertas de vencimiento
- **Filtros avanzados** por estado, prioridad, categoría y búsqueda de texto
- **Estadísticas en tiempo real** del progreso de tareas
- **Interfaz responsive** optimizada para móviles y desktop

### 🎨 Diseño y UX
- **Diseño moderno y sobrio** con gradientes sutiles
- **Animaciones fluidas** y transiciones suaves
- **Indicadores visuales** para prioridades y estados
- **Modo oscuro** preparado para futuras implementaciones
- **Accesibilidad** con soporte para lectores de pantalla

### 🏗️ Arquitectura
- **Patrón Repository** para abstracción de datos
- **Principios SOLID** aplicados en toda la estructura
- **Servicios centralizados** para lógica de negocio
- **Componentes reutilizables** y modulares
- **Preparado para Capacitor** para conversión a app móvil

## 🛠️ Tecnologías Utilizadas

- **Angular 19** - Framework principal
- **TypeScript** - Lenguaje de programación
- **Tailwind CSS v4** - Framework de estilos
- **RxJS** - Programación reactiva
- **LocalStorage** - Persistencia de datos local

## 📁 Estructura del Proyecto

```
src/
├── app/
│   ├── components/           # Componentes de la interfaz
│   │   ├── todo-list/       # Lista principal de tareas
│   │   ├── todo-item/       # Item individual de tarea
│   │   ├── todo-form/       # Formulario de creación/edición
│   │   ├── todo-filters/    # Filtros y búsqueda
│   │   └── todo-stats/      # Estadísticas y métricas
│   ├── core/                # Lógica de negocio centralizada
│   │   ├── interfaces/      # Interfaces y contratos
│   │   ├── repositories/    # Implementaciones de repositorios
│   │   ├── services/        # Servicios de aplicación
│   │   └── providers/       # Configuración de inyección
│   └── models/              # Modelos de datos
├── styles.css               # Estilos globales
└── main.ts                  # Punto de entrada
```

## 🚀 Instalación y Uso

### Prerrequisitos
- Node.js 18+ 
- npm o yarn

### Instalación
```bash
# Clonar el repositorio
git clone <repository-url>
cd todo-app

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm start

# Construir para producción
npm run build
```

### Scripts Disponibles
- `npm start` - Servidor de desarrollo
- `npm run build` - Construcción para producción
- `npm run test` - Ejecutar pruebas
- `npm run watch` - Construcción en modo watch

## 🏗️ Arquitectura de la Aplicación

### Patrón Repository
La aplicación utiliza el patrón Repository para abstraer la fuente de datos:

```typescript
// Interfaz del repositorio
interface ITodoRepository {
  getAll(filters?: TodoFilters): Observable<Todo[]>;
  create(todo: TodoCreateRequest): Observable<Todo>;
  update(id: string, todo: TodoUpdateRequest): Observable<Todo>;
  delete(id: string): Observable<boolean>;
  // ... más métodos
}
```

### Servicios Centralizados
- **TodoService**: Gestiona toda la lógica de negocio
- **Estado reactivo**: Utiliza RxJS para manejo de estado
- **Filtros en tiempo real**: Actualización automática de vistas

### Componentes Modulares
- **Standalone Components**: Cada componente es independiente
- **Comunicación por eventos**: Input/Output para comunicación
- **Reutilización**: Componentes diseñados para ser reutilizables

## 📱 Preparación para Capacitor

La aplicación está diseñada pensando en la conversión a app móvil:

### Características Mobile-First
- **Diseño responsive** con breakpoints móviles
- **Touch-friendly** con áreas de toque apropiadas
- **Gestos nativos** preparados para implementación
- **Optimización de rendimiento** para dispositivos móviles

### Futuras Implementaciones
- **Sincronización con API** backend
- **Notificaciones push** para tareas vencidas
- **Modo offline** con sincronización automática
- **Integración con calendario** del dispositivo

## 🎯 Funcionalidades Detalladas

### Gestión de Tareas
- ✅ Crear tareas con título, descripción, prioridad y categoría
- ✅ Marcar tareas como completadas
- ✅ Editar tareas existentes
- ✅ Eliminar tareas con confirmación
- ✅ Fechas límite con alertas visuales

### Filtros y Búsqueda
- 🔍 Búsqueda por texto en título y descripción
- 🏷️ Filtro por categorías
- ⚡ Filtro por prioridad
- 📊 Filtro por estado (completadas/pendientes)
- 🧹 Limpiar filtros activos

### Estadísticas
- 📈 Progreso general de completación
- 📊 Contador de tareas por estado
- ⚠️ Tareas urgentes pendientes
- 📅 Tareas próximas a vencer

## 🔧 Configuración para Desarrollo

### Variables de Entorno
```bash
# Crear archivo .env para configuración local
API_URL=http://localhost:3000/api
ENVIRONMENT=development
```

### Configuración de Tailwind
La aplicación utiliza Tailwind CSS v4 con configuración personalizada en `styles.css`.

## 🧪 Testing

```bash
# Ejecutar pruebas unitarias
npm run test

# Ejecutar pruebas con coverage
npm run test:coverage

# Ejecutar pruebas e2e
npm run e2e
```

## 📦 Despliegue

### Producción
```bash
# Construir para producción
npm run build

# Los archivos se generan en dist/todo-app/
```

### Docker (Opcional)
```dockerfile
FROM nginx:alpine
COPY dist/todo-app /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🤝 Contribución

1. Fork el proyecto
2. Crear una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 🆘 Soporte

Para soporte y preguntas:
- 📧 Email: soporte@taskmaster.com
- 📱 Discord: [Servidor de la comunidad]
- 📖 Documentación: [Wiki del proyecto]

## 🗺️ Roadmap

### Versión 1.1
- [ ] Modo oscuro
- [ ] Exportar/importar tareas
- [ ] Subtareas y dependencias
- [ ] Etiquetas personalizadas

### Versión 1.2
- [ ] Integración con Capacitor
- [ ] Notificaciones push
- [ ] Sincronización con API
- [ ] Modo offline

### Versión 2.0
- [ ] Colaboración en tiempo real
- [ ] Proyectos y equipos
- [ ] Integración con calendarios
- [ ] Analytics avanzados

---

**TaskMaster** - Organiza tu vida, una tarea a la vez ✨
