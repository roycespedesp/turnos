# Sistema de Gestión de Turnos Avanzado

Sistema especializado de optimización de turnos con **ciclos de trabajo de 21 días**, usando Google OR-Tools para maximizar eficiencia y cumplir restricciones laborales complejas.

## 🚀 Características Avanzadas

### Optimización Inteligente
- **OR-Tools de Google**: Programación lineal entera mixta para optimización matemática
- **Ciclos de 21 días**: Días trabajo + días descanso = 21 (flexible: 6x15, 7x14, 8x13, etc.)
- **Turnos de 12 horas**: Día y Noche con secuencia obligatoria Día→Noche→Descanso
- **Límite de horas**: Máximo 2496 horas anuales por operador

### Gestión Completa
- **Vacaciones**: 30 días corridos, generación automática anual
- **Descansos pendientes**: Balance automático según ciclo preferido (±5 días)
- **Múltiples posiciones**: Bocatoma, Central, etc. con operadores específicos
- **Límite día/noche**: Máximo 60% en un tipo de turno

### Interfaz Moderna
- **Importación Excel**: Carga masiva de operadores con plantilla
- **Exportación Excel**: Cronograma completo con estadísticas
- **Validación en tiempo real**: Datos validados antes de optimizar
- **Notificaciones**: Feedback instantáneo de operaciones

## 📁 Estructura del Proyecto

```
Verlat/
├── backend/
│   ├── main.py                  # API FastAPI principal
│   ├── api_turnos.py            # Endpoints de optimización
│   ├── models_turnos.py         # Modelos de datos Pydantic
│   ├── optimizer_turnos.py      # Algoritmo OR-Tools
│   └── requirements.txt         # Dependencias Python
├── frontend/
│   ├── index.html              # Interfaz web moderna
│   ├── styles.css              # Estilos Tailwind CSS
│   └── script.js               # Lógica de aplicación
├── start.py                    # Script de inicio rápido
└── README.md                   # Documentación
```

## 🛠️ Instalación y Configuración

### Prerrequisitos

- Python 3.8 o superior
- pip (gestor de paquetes Python)

### Instalación Rápida

**Opción 1: Script de inicio automático**
```bash
python start.py
```

**Opción 2: Instalación manual**
```bash
# 1. Instalar dependencias
cd backend
pip install -r requirements.txt

# 2. Iniciar servidor
python main.py

# 3. Abrir navegador en http://localhost:8000
```

### Verificar Instalación

```bash
# Verificar salud del servidor
curl http://localhost:8000/health

# Debería retornar:
# {
#   "status": "healthy",
#   "service": "turnos-api-avanzado", 
#   "version": "2.0.0",
#   "ortools_disponible": true
# }
```

## 📖 Uso del Sistema

### 1. Configuraciones Generales

Ajusta los parámetros del sistema:
- **Días de vacaciones**: 30 días por año (estándar)
- **Límite de horas anuales**: 2496 horas máximo
- **Año de análisis**: 2025
- **Mes de inicio**: Enero (o cualquier mes)
- **Límite día/noche**: 60% máximo en un turno
- **Descansos pendientes**: ±5 días permitidos

### 2. Gestión de Ciclos

Selecciona el **ciclo preferido** (base para cálculo de descansos):
- 6×15, 7×14, 8×13, 9×12, 10×11, 11×10
- **12×9** (recomendado) ✓
- 13×8, 14×7, 15×6

### 3. Gestión de Posiciones

Define las posiciones de trabajo:
- **ID Posición**: `bocatoma_1`, `central_1`, etc.
- **Tipo**: `bocatoma`, `central`, etc.
- **Operadores requeridos**: Cantidad por turno
- **Turnos diarios**: Siempre 2 (día y noche)

### 4. Gestión de Operadores

**Opción A: Importar desde Excel**
1. Descargar plantilla Excel
2. Llenar datos de operadores
3. Importar archivo (validación automática)

**Opción B: Agregar manualmente**
- ID Operador (DNI)
- Nombre completo
- Tipo de posición
- Posición inicial
- Fecha generación vacaciones
- Horas laboradas previas
- Vacaciones pendientes
- Ciclo inicial
- Día del ciclo inicial
- Turno del ciclo inicial (DIA/NOCHE/DESCANSO)

### 5. Optimización

1. **Click en botón "Optimizar"**
2. Sistema valida datos automáticamente
3. OR-Tools ejecuta optimización en background
4. **Visualizar resultados**:
   - Estadísticas generales
   - Cronograma por operador
   - Horas acumuladas
   - Descansos pendientes
5. **Descargar Excel** con cronograma completo

## 🔧 API Endpoints

### Optimización de Turnos
- `POST /turnos/optimizar/` - Iniciar optimización (asíncrona)
  - Parámetros: configuración, ciclos, posiciones, operadores
  - Retorna: `tarea_id` para seguimiento

- `GET /turnos/estado/{tarea_id}` - Verificar progreso de optimización
  - Retorna: estado actual, completado, mensaje

- `GET /turnos/resultado/{tarea_id}` - Obtener resultado completo
  - Retorna: cronograma, estadísticas, advertencias, errores

- `GET /turnos/descargar/{tarea_id}` - Descargar cronograma en Excel
  - Retorna: archivo .xlsx con cronograma completo

### Validación
- `POST /turnos/configuracion/validar` - Validar configuración
  - Retorna: errores y advertencias

- `POST /turnos/datos/validar` - Validar datos de entrada
  - Retorna: validación de operadores, posiciones, ciclos

### Gestión
- `GET /turnos/resultados/` - Listar todas las optimizaciones
- `DELETE /turnos/resultado/{tarea_id}` - Eliminar resultado

### Sistema
- `GET /` - Servir frontend principal
- `GET /health` - Estado del servidor y OR-Tools
- `GET /info` - Información del sistema y características
- `GET /api/docs` - Documentación interactiva Swagger
- `GET /api/redoc` - Documentación ReDoc

## 🧠 Algoritmo de Optimización

El sistema utiliza **Google OR-Tools** con programación lineal entera mixta:

### Variables de Decisión
- `x[operador][fecha][posicion][turno]` - Asignación binaria (0/1)
- `vacaciones[operador][fecha]` - Operador en vacaciones (0/1)

### Restricciones Principales

1. **Un turno por día**: Operador trabaja máximo un turno por día
   ```
   ∑(posición,turno) x[op][día][pos][turno] ≤ 1
   ```

2. **Cobertura de posiciones**: Mínimo operadores requeridos por turno
   ```
   ∑(operador) x[op][día][pos][turno] ≥ op_requeridos[pos]
   ```

3. **Límite de horas anuales**: No superar 2496 horas
   ```
   ∑(día,pos,turno) x[op][día][pos][turno] * 12 ≤ 2496
   ```

4. **Tipo de posición**: Solo operadores compatibles con posición

5. **Secuencia de ciclo**: Día → Noche → Descanso (obligatorio)

6. **Límite día/noche**: Máximo 60% en un tipo de turno

### Función Objetivo

Minimizar:
```
W1 * (Huecos totales) + 
W2 * (Duplicidades) + 
W3 * (Violaciones límite día/noche)

Donde: W1 >> W2 >> W3 (pesos por prioridad)
```

### Características Avanzadas

- ✅ Optimización matemática con OR-Tools (SCIP solver)
- ✅ Respeta estructura de ciclos de 21 días
- ✅ Gestión automática de vacaciones
- ✅ Balance de descansos pendientes
- ✅ Minimiza huecos de programación
- ✅ Ejecución asíncrona en background
- ✅ Validación completa antes de optimizar

## 🎨 Interfaz de Usuario

### Características del Frontend

- **Diseño Responsivo**: Adaptable a diferentes tamaños de pantalla
- **Navegación Intuitiva**: Sistema de pestañas para diferentes secciones
- **Formularios Dinámicos**: Validación en tiempo real
- **Feedback Visual**: Notificaciones toast y estados de carga
- **Tablas Interactivas**: Visualización clara de datos
- **Controles Modernos**: Botones, inputs y selectores estilizados

### Tecnologías Frontend

- **HTML5**: Estructura semántica
- **CSS3**: Estilos modernos con Flexbox y Grid
- **JavaScript ES6+**: Lógica de aplicación
- **Font Awesome**: Iconografía
- **Fetch API**: Comunicación con backend

## 🔒 Validación y Seguridad

### Backend (FastAPI)
- Validación de datos con Pydantic
- Manejo de errores HTTP
- CORS configurado para desarrollo
- Logging de operaciones

### Frontend
- Validación de formularios
- Sanitización de inputs
- Manejo de errores de API
- Estados de carga

## 🚀 Extensiones Futuras

### Funcionalidades Planeadas

1. **Google OR-Tools Integration**: Implementar optimización avanzada
2. **Base de Datos**: Persistencia con PostgreSQL/MySQL
3. **Autenticación**: Sistema de usuarios y roles
4. **Reportes**: Generación de reportes PDF/Excel
5. **Notificaciones**: Email/SMS para empleados
6. **Dashboard**: Métricas y análisis avanzados
7. **API Móvil**: Aplicación móvil complementaria

### Mejoras Técnicas

- Tests unitarios y de integración
- Containerización con Docker
- CI/CD pipeline
- Monitoreo y logging avanzado
- Cache con Redis
- WebSockets para actualizaciones en tiempo real

## 🐛 Solución de Problemas

### Problemas Comunes

1. **Error de CORS**: Verificar configuración en `main.py`
2. **Puerto ocupado**: Cambiar puerto en `uvicorn.run()`
3. **Dependencias faltantes**: Ejecutar `pip install -r requirements.txt`
4. **JavaScript no carga**: Verificar ruta de archivos estáticos

### Logs y Debugging

- Logs del servidor en consola
- Errores de JavaScript en DevTools del navegador
- Respuestas de API en Network tab

## 📄 Licencia

Este proyecto es de código abierto y está disponible bajo la licencia MIT.

## 👥 Contribución

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crear rama para feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

## 📞 Soporte

Para soporte técnico o preguntas:
- Crear issue en el repositorio
- Revisar documentación de API en `/docs` (FastAPI auto-docs)

---

**Desarrollado con ❤️ usando FastAPI y tecnologías web modernas**