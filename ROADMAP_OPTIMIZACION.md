# 🚀 ROADMAP DE OPTIMIZACIÓN - Sistema de Gestión de Turnos

## 📋 Resumen Ejecutivo

Este documento describe la implementación completa del algoritmo de optimización de turnos basado en `algoritmo.md`, con el objetivo de generar automáticamente cronogramas anuales que minimicen huecos, respeten límites de horas, y gestionen vacaciones de forma óptima.

---

## 🎯 Objetivos del Algoritmo (Por Prioridad)

### 1. **Restricciones Duras (MUST - No Negociables)**
- ✅ **Límite de horas anuales**: Máximo 2496h/año (nunca superar, excepto dentro del último ciclo)
- ✅ **Un operador = Un turno/día**: No puede trabajar TD y TN el mismo día
- ✅ **Balance 60%**: Ningún operador puede trabajar >60% en turno día o >60% en turno noche
- ✅ **Ciclos de 21 días**: Estructura fija (Día → Noche → Descanso)
- ✅ **Vacaciones 30 días corridos**: Solo interrupción permitida: cierre de año (31/12)

### 2. **Función Objetivo (Minimizar en Orden)**
1. **HUECOS** (Peso: 1000): Posición sin TD o TN en un día
2. **DUPLICIDADES** (Peso: 100): Más operadores que `op_requeridos`
3. **CAMBIOS DE CICLO** (Peso: 10): Desviaciones del ciclo preferido
4. **DESCANSOS PENDIENTES** (Peso: 1): Acumulación de deuda/crédito de descansos

---

## 🏗️ Arquitectura de la Solución

### Enfoque: **Heurística Constructiva + Reparación Greedy**

```
┌─────────────────────────────────────────────────────────────┐
│                    MOTOR DE OPTIMIZACIÓN                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. INICIALIZACIÓN                                          │
│     ├─ Calcular estado inicial (dia_ciclo_inicial)         │
│     ├─ Cargar horas previas (si mes_inicio ≠ 1)           │
│     └─ Identificar ventanas de vacaciones obligatorias     │
│                                                             │
│  2. GESTOR DE VACACIONES                                    │
│     ├─ Calcular fecha de generación (fecha_gen_vac)        │
│     ├─ Priorizar vac_pendientes                            │
│     ├─ Programar 30 días corridos                          │
│     └─ Activar operador de reemplazo (op_vacaciones)       │
│                                                             │
│  3. ASIGNACIÓN POR CICLOS (Iterativo)                       │
│     ├─ Para cada operador, para cada ciclo:                │
│     │   ├─ Evaluar todos los ciclos disponibles            │
│     │   ├─ Seleccionar ciclo óptimo (heurística)           │
│     │   ├─ Asignar TD/TN según estructura del ciclo        │
│     │   ├─ Calcular descansos pendientes                   │
│     │   └─ Validar límites (horas, 60%)                    │
│     └─ Repetir hasta cubrir 365 días                       │
│                                                             │
│  4. DETECCIÓN Y CORRECCIÓN DE HUECOS                        │
│     ├─ Identificar días sin cobertura TD/TN                │
│     ├─ Intentar cambio de ciclo de operador                │
│     ├─ Permitir duplicidad mínima si es necesario          │
│     └─ Registrar observaciones                             │
│                                                             │
│  5. GENERACIÓN DE OUTPUT                                    │
│     ├─ Crear cronograma con todas las columnas             │
│     ├─ Calcular métricas de calidad                        │
│     ├─ Generar Excel con 4 pestañas                        │
│     └─ Retornar resultado + estadísticas                   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Módulos Principales

### **Módulo 1: Gestor de Vacaciones**
```python
class GestorVacaciones:
    def calcular_ventanas_obligatorias(operador, ano_analisis):
        """
        Calcula cuándo el operador DEBE tomar vacaciones
        - Si fecha_gen_vac ya pasó en el año → 30 días nuevos
        - Si vac_pendientes > 0 → programar primero
        - Retorna: [(fecha_inicio, 30), ...]
        """
    
    def asignar_vacaciones(operador, fecha_inicio, cronograma):
        """
        Marca 30 días consecutivos como "vacaciones"
        Activa operador de reemplazo (op_vacaciones) en esa posición
        """
    
    def validar_cierre_anual(vacaciones_programadas, fecha_inicio):
        """
        Si vacaciones cruzan 31/12, permite interrupción
        Retorna días pendientes para año siguiente
        """
```

### **Módulo 2: Gestor de Ciclos**
```python
class GestorCiclos:
    CICLOS_DISPONIBLES = [
        "6x15", "7x14", "8x13", "9x12", "10x11",
        "11x10", "12x9", "13x8", "14x7", "15x6"
    ]
    
    def seleccionar_ciclo_optimo(operador, dia_actual, estado_actual):
        """
        Evalúa todos los ciclos y selecciona el mejor según:
        1. No exceder límite de horas anuales
        2. Cubrir huecos proyectados en posición
        3. Minimizar desviación de ciclo preferido
        4. Balancear descansos pendientes
        """
    
    def calcular_descansos_pendientes(ciclo_actual, ciclo_preferido):
        """
        Formula: dias_trabajo_preferido - dias_trabajo_actual
        - Resultado positivo: operador GANA descansos (debe recuperar con más trabajo)
        - Resultado negativo: operador DEBE descansos (debe recuperar con más descanso)
        """
    
    def distribuir_turnos_ciclo(ciclo, dia_inicio):
        """
        Dado un ciclo (ej: 14x7), retorna:
        - Días 1-7: TD
        - Días 8-14: TN
        - Días 15-21: DE (descanso)
        """
```

### **Módulo 3: Detector de Huecos**
```python
class DetectorHuecos:
    def identificar_huecos(cronograma, posiciones):
        """
        Para cada posición, cada día:
        - Verificar si tiene TD Y TN
        - Si falta alguno → registrar como hueco
        Retorna: [(posicion, fecha, turno_faltante), ...]
        """
    
    def calcular_cobertura_mensual(cronograma):
        """
        Agrupa por mes y calcula:
        - % de días sin huecos
        - Total de duplicidades
        """
    
    def sugerir_correccion(hueco, operadores_disponibles):
        """
        Intenta corregir hueco con:
        1. Cambio de ciclo de operador existente
        2. Duplicidad temporal
        3. Uso de op_vacaciones
        """
```

### **Módulo 4: Validador de Restricciones**
```python
class ValidadorRestricciones:
    def validar_limite_anual(operador, horas_acumuladas, ciclo_siguiente):
        """
        Si horas_actuales + horas_ciclo > 2496:
            calcular_ciclo_final_ajustado()
            marcar_como_ultimo = True
        """
    
    def validar_balance_60(operador, horas_dia, horas_noche):
        """
        %_dia = horas_dia / (horas_dia + horas_noche)
        %_noche = horas_noche / (horas_dia + horas_noche)
        Retorna: True si ambos <= 60%
        """
    
    def validar_estado_ciclo(dia_ciclo, turno_asignado):
        """
        Verifica que el turno corresponda al día del ciclo:
        - Días 1-X: Solo TD
        - Días X+1-Y: Solo TN
        - Días Y+1-21: Solo DE
        """
```

### **Módulo 5: Generador de Cronograma**
```python
class GeneradorCronograma:
    def generar_registro_dia(operador, fecha, posicion, estado, dia_ciclo, ...):
        """
        Crea registro con todas las columnas:
        - Fecha, ID_Operador, Nombre, Posición, Estado, Estado2
        - Ciclo, Día_Ciclo, Desc_Pend, Vac_Pend
        - Horas_Ciclo, Horas_Año, Horas_Día, %_Día
        - Horas_Noche, %_Noche, Observaciones
        """
    
    def exportar_a_excel(cronograma, archivo_salida):
        """
        Genera Excel con 4 pestañas:
        1. Cronograma (detalle completo)
        2. Calendario (vista operadores x días)
        3. Programación (vista posiciones x meses)
        4. Leyenda (mapeo operadores)
        """
```

---

## 🛠️ Implementación por Sprints

### **SPRINT 1: Fundamentos (Semana 1)** ⬅️ **COMPLETADO** ✅
- [x] Estructura Excel base (4 pestañas)
- [x] Formato visual y colores
- [x] **Gestor de Ciclos Básico**
  - [x] Selección de ciclo fijo por operador
  - [x] Distribución TD/TN/DE según ciclo
  - [x] Cálculo de descansos pendientes
- [x] **Generador de Cronograma v1**
  - [x] Iterar operadores x ciclos x días
  - [x] Asignar turnos según ciclo_inicial
  - [x] Calcular horas acumuladas
- [x] **Integración Backend-Frontend**
  - [x] Optimizador heurístico (`optimizer_heuristica.py`)
  - [x] API actualizada para usar nuevo optimizador
  - [x] Generación automática de Excel con 4 pestañas
  - [x] Endpoint de descarga funcionando

**Entregable:** ✅ Excel generado con ciclos fijos sin vacaciones

**Archivos Creados/Modificados:**
- ✅ `ROADMAP_OPTIMIZACION.md` - Documentación del plan
- ✅ `backend/optimizer_heuristica.py` - Motor de optimización
- ✅ `backend/api_turnos.py` - API actualizada

**Próximo Sprint:** Sprint 2 - Vacaciones y Reemplazos

---

### **SPRINT 2: Vacaciones y Reemplazos (Semana 2)** ⬅️ **EN PROGRESO** 🚀
- [ ] **Gestor de Vacaciones Completo**
  - [ ] Identificar fecha_gen_vac y calcular cuándo se generan vacaciones nuevas
  - [ ] Programar 30 días corridos ininterrumpidos
  - [ ] Gestionar vac_pendientes (siempre se consumen antes que las nuevas)
  - [ ] Validar cierre de año (única interrupción permitida: 31/12)
- [ ] **Activación de op_vacaciones**
  - [ ] Detectar cuando operador regular está de vacaciones
  - [ ] Asignar operador de reemplazo a posición
  - [ ] Mantener tipo de posición (central/bocatoma)
  - [ ] Marcar registros con Estado="vacaciones" y Estado2="VC"
- [ ] **Integración con Cronograma**
  - [ ] Generar columna "Vacaciones pendientes" en output
  - [ ] Mostrar formato Día_Ciclo como "X/30" durante vacaciones
  - [ ] Actualizar Excel con vacaciones visibles en todas las pestañas

**Entregable:** Excel con vacaciones programadas y reemplazos activos

**Archivos a Modificar:**
- `backend/optimizer_heuristica.py` - Agregar GestorVacaciones
- `backend/api_turnos.py` - Actualizar generación de Excel para vacaciones

---

### **SPRINT 3: Optimización de Huecos (Semana 3)**
- [ ] **Detector de Huecos**
  - [ ] Identificar días sin cobertura TD/TN
  - [ ] Calcular métricas por posición
  - [ ] Generar reportes de huecos
- [ ] **Cambio Dinámico de Ciclos**
  - [ ] Evaluar todos los ciclos (6x15 a 15x6)
  - [ ] Seleccionar ciclo que minimice huecos
  - [ ] Actualizar descansos pendientes
- [ ] **Corrección Greedy**
  - [ ] Permitir duplicidades mínimas
  - [ ] Reasignar operadores para cubrir huecos

**Entregable:** Excel con huecos minimizados

---

### **SPRINT 4: Restricciones Avanzadas (Semana 4)**
- [ ] **Validador de 60% Día/Noche**
  - [ ] Monitorear % en tiempo real
  - [ ] Ajustar asignaciones de turnos
  - [ ] Forzar balance si excede límite
- [ ] **Límite de Horas Anuales**
  - [ ] Proyectar horas futuras
  - [ ] Calcular ciclo final ajustado
  - [ ] Marcar último ciclo antes de exceder
- [ ] **Gestión de Descansos Pendientes**
  - [ ] Acumular crédito/deuda
  - [ ] Balancear en ciclos posteriores
  - [ ] Validar límite máximo (5 días según config)

**Entregable:** Excel cumpliendo todas las restricciones

---

### **SPRINT 5: Integración y Testing (Semana 5)**
- [ ] **Integración Backend-Frontend**
  - [ ] API endpoint `/turnos/optimizar/` completo
  - [ ] Generación de Excel en servidor
  - [ ] Descarga automática en cliente
- [ ] **Testing**
  - [ ] Casos de prueba con datos reales
  - [ ] Validación de restricciones
  - [ ] Benchmarking de rendimiento
- [ ] **Métricas y Dashboard**
  - [ ] Reporte de calidad (huecos, duplicidades)
  - [ ] Visualización de cobertura
  - [ ] Alertas de problemas

**Entregable:** Sistema completo en producción

---

## 📊 Métricas de Éxito

### **KPIs del Algoritmo**
| Métrica | Objetivo | Crítico |
|---------|----------|---------|
| **Huecos Totales** | < 5 días/año | < 10 días/año |
| **Duplicidades** | < 10 días/año | < 20 días/año |
| **Operadores > 60% TD/TN** | 0 | 0 |
| **Exceso de 2496h** | 0 | 0 (excepto último ciclo) |
| **Vacaciones sin programar** | 0 | 0 |
| **Descansos pendientes > 5** | 0 | 0 |
| **Tiempo de ejecución** | < 10 seg | < 30 seg |

---

## 🔧 Stack Tecnológico

### **Backend**
- **Lenguaje**: Python 3.13
- **Framework**: FastAPI
- **Optimización**: Heurística Constructiva + Greedy Repair
- **Excel**: pandas + openpyxl
- **Async**: asyncio para tareas largas

### **Frontend**
- **HTML5 + CSS3** (Tailwind CSS)
- **JavaScript** (vanilla)
- **XLSX.js** para lectura de Excel
- **Flowbite** para componentes UI

### **Infraestructura**
- **Servidor**: Uvicorn
- **CORS**: habilitado para desarrollo
- **Logs**: logging module de Python

---

## 🎯 Estado Actual y Próximo Paso

### ✅ **Completado (Sprint 1)**
- Estructura de datos (modelos Pydantic)
- API básica con FastAPI
- Frontend funcional con carga de datos
- Generador de Excel con 4 pestañas + separadores entre meses
- Formato visual optimizado
- Optimizador heurístico con ciclos fijos
- Ordenamiento cronológico correcto en todas las pestañas

### 🚀 **EN PROGRESO: SPRINT 2 - Vacaciones y Reemplazos**

#### **Objetivo:** 
Implementar gestión completa de vacaciones (30 días corridos) con operador de reemplazo automático

#### **Tareas:**
1. [ ] Crear clase `GestorVacaciones` en `optimizer_heuristica.py`
2. [ ] Implementar `calcular_fecha_vacaciones(operador, ano_analisis)`
   - Detectar si fecha_gen_vac ya pasó en el año
   - Identificar ventana óptima para vacaciones
   - Priorizar vac_pendientes
3. [ ] Implementar `programar_vacaciones(operador, fecha_inicio, dias=30)`
   - Marcar 30 días como Estado="vacaciones", Estado2="VC"
   - Formato Día_Ciclo como "X/30"
   - Validar interrupción por cierre de año (31/12)
4. [ ] Implementar `activar_operador_reemplazo(posicion, fecha_inicio, fecha_fin)`
   - Buscar op_vacaciones del mismo tipo_posicion
   - Asignar a la posición del operador de vacaciones
   - Mantener ciclo del operador de reemplazo
5. [ ] Integrar con `_generar_cronograma_completo()`
   - Detectar cuándo programar vacaciones
   - Activar reemplazo automáticamente
   - Actualizar vacaciones pendientes en output
6. [ ] Actualizar generación de Excel
   - Mostrar VC en calendarios
   - Incluir columna "Vacaciones pendientes"
   - Color específico para vacaciones

**Estimación:** 4-6 horas

---

## 📚 Referencias

- **Algoritmo Completo**: `algoritmo.md`
- **Modelos de Datos**: `backend/models_turnos.py`
- **Generador Excel**: `backend/generar_cronograma_simple.py`
- **API Actual**: `backend/api_turnos.py`
- **OR-Tools (futuro)**: `backend/optimizer_turnos.py`

---

## 🎉 RESUMEN EJECUTIVO

### **Estado Actual: SPRINT 1 COMPLETADO** ✅

El sistema ya está funcional con las siguientes capacidades:

#### **✅ Funcionalidades Implementadas**
1. **Optimizador Heurístico**: Genera cronogramas completos basados en ciclos fijos
2. **Generación de Excel Automática**: 4 pestañas (Cronograma, Calendario, Programación, Leyenda)
3. **API REST Completa**: Endpoints para optimizar y descargar
4. **Cálculo de Métricas**: Horas acumuladas, descansos pendientes, estadísticas

#### **📥 Cómo Usar el Sistema**

**1. Iniciar el servidor:**
```bash
cd backend
python main.py
# O directamente:
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

**2. Abrir el frontend:**
```
http://localhost:8000/
```

**3. Flujo de uso:**
1. Cargar operadores desde Excel (pestaña Operadores)
2. Configurar ciclo preferido y posiciones
3. Click en "Optimizar Turnos"
4. Esperar a que termine la optimización
5. Click en "Descargar Excel" para obtener el cronograma completo

#### **📊 Estructura del Excel Generado**

**Pestaña 1: Cronograma**
- Todas las columnas especificadas en `algoritmo.md`
- Datos diarios para todos los operadores
- Cálculos de horas y porcentajes

**Pestaña 2: Calendario**
- Vista visual por operador
- Días del año en columnas
- Colores por tipo de turno (TD/TN/DE/VC)

**Pestaña 3: Programación**
- Vista por posición
- Meses agrupados
- Número de operador en cada celda
- Colores por operador

**Pestaña 4: Leyenda**
- Mapeo número → nombre de operador
- Colores correspondientes

#### **⚠️ Limitaciones Actuales (Sprint 1)**
- ❌ **Sin gestión de vacaciones** (30 días corridos)
- ❌ **Sin operador de reemplazo** (op_vacaciones)
- ❌ **Sin cambio dinámico de ciclos** (usa ciclo_inicial fijo)
- ❌ **Sin detección/corrección de huecos** (puede haber días sin cobertura)
- ❌ **Sin validación de 60% día/noche**
- ❌ **Sin ajuste de ciclo final** para límite de horas

#### **🚀 Próximos Pasos (Sprint 2)**
1. Implementar gestor de vacaciones
2. Activar operador de reemplazo
3. Gestionar fecha_gen_vac y vac_pendientes

---

**Última actualización:** 2025-10-02  
**Versión:** 1.0 - Sprint 1 Completado  
**Autor:** Sistema de Optimización de Turnos

