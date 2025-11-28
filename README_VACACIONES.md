# Optimizador de Turnos - Lógica de Vacaciones

## 📋 Resumen Ejecutivo

Este documento explica la lógica actual del optimizador de turnos y detalla la implementación de **vacaciones basadas en aniversarios**.

---

## 🔍 Lógica Actual (EJEMPLO_OPTIMIZADOR_JS.js)

### Sistema de Slots Espaciados

El optimizador actual programa vacaciones usando un sistema de "slots" espaciados:

1. **Espaciamiento**: 51 días entre inicios (30 días vacaciones + 21 días ciclo)
2. **Ordenamiento**: Por `vac_pendientes` (prioridad) y luego por `fecha_gen_vac` (más antigua primero)
3. **Asignación**: Cada operador recibe un slot de 30 días consecutivos
4. **Activación**: Las vacaciones se activan solo cuando el operador termina su período de descanso dentro del ciclo

```javascript
// Método actual: _programarVacacionesConsecutivas()
// Líneas 212-301 en optimizer.js

// Ejemplo de output:
  1. PEREZ CARDENAS (21/05 vencimiento, 30 pendientes) | Slot: Días 0-29
  2. PATRICIO CHAVEZ (21/05 vencimiento)              | Slot: Días 51-80
  3. AGUIRRE HUAYRA (25/01 vencimiento)               | Slot: Días 102-131
```

### Problema Identificado

❌ **No respeta aniversarios**: Un operador con aniversario el 25/01/2026 podría tomar vacaciones en enero (días 0-29 del bloque), antes de cumplir 1 año.

---

## ✅ Nueva Implementación Requerida

### Concepto de Aniversario

**Aniversario** = Fecha en la que el operador cumple 1 año más de servicios y genera derecho a 30 días de vacaciones.

```
Ejemplo:
- Operador: AGUIRRE HUAYRA JUAN ANTONIO
- fecha_gen_vac: 25/01/2021
- Año optimización: 2026
- Aniversario 2026: 25 de enero de 2026
```

### Reglas de Negocio (ACTUALIZADAS)

1. **Acumulación por Aniversario**
   - Al cumplir 1 año de trabajo (fecha de aniversario), el operador acumula 30 días de vacaciones
   - `fecha_gen_vac` define día y mes del aniversario anual
   - Ejemplo: `25/01/2021` → cada 25 de enero acumula 30 días

2. **Elegibilidad**
   - Solo puede tomar vacaciones DESPUÉS de su aniversario del año actual
   - **Excepción**: Si tiene `vac_pendientes > 0`, puede tomarlas en cualquier momento

3. **Condiciones para Inicio**
   Las vacaciones SOLO pueden iniciarse en estos momentos:
   - ✅ Después de **terminar un ciclo completo** de trabajo (12 días trabajo + descanso), O
   - ✅ Después de un **hueco** (día sin asignación/turno)

4. **Duración**
   - Siempre **30 días CONSECUTIVOS e ININTERRUMPIDOS**
   - No se pueden fragmentar

### Casos de Uso

#### Caso 1: Vacaciones Pendientes
```
Operador: PEREZ CARDENAS
- fecha_gen_vac: 21/05/2019
- vac_pendientes: 30
- Aniversario 2026: 21 de mayo

✅ Puede tomar vacaciones desde enero 2026 (tiene pendientes)
✅ Genera otras 30 después del 21 mayo 2026
```

#### Caso 2: Sin Vacaciones Pendientes
```
Operador: AGUIRRE HUAYRA
- fecha_gen_vac: 25/01/2021  
- vac_pendientes: 0
- Aniversario 2026: 25 de enero

❌ NO puede tomar vacaciones antes del 25 enero 2026
✅ SÍ puede tomar vacaciones después del 25 enero 2026
```

---

## 🎯 Plan de Implementación

### Paso 1: Calcular Fecha de Aniversario

Agregar método para calcular el aniversario en el año de optimización:

```javascript
_calcularFechaAniversario(operador, anoOptimizacion) {
    const fechaGen = this._convertirFechaExcel(operador.fecha_gen_vac);
    if (!fechaGen) return null;
    
    // Usar día y mes de fecha_gen_vac con año de optimización
    return new Date(
        anoOptimizacion,
        fechaGen.getMonth(),
        fechaGen.getDate()
    );
}
```

### Paso 2: Validar Elegibilidad

Verificar si un operador puede tomar vacaciones en una fecha:

```javascript
_puedeTomarVacaciones(operador, fechaPropuesta, anoOptimizacion) {
    // Si tiene pendientes, puede tomar en cualquier momento
    if (operador.vac_pendientes && operador.vac_pendientes > 0) {
        return true;
    }
    
    // Si no tiene pendientes, debe haber pasado su aniversario
    const fechaAniversario = this._calcularFechaAniversario(operador, anoOptimizacion);
    if (!fechaAniversario) return false;
    
    return fechaPropuesta >= fechaAniversario;
}
```

### Paso 3: Modificar Programación de Slots

Actualizar `_programarVacacionesConsecutivas()`:

1. Calcular aniversario de cada operador
2. Ordenar por:
   - Prioridad 1: `vac_pendientes > 0`
   - Prioridad 2: Aniversario más temprano en el año
3. Asignar slots respetando fecha mínima de inicio

### Paso 4: Actualizar Gestión de Bloque

Modificar `_gestionarBloqueVacacional()` para validar que las vacaciones solo se activen después del aniversario.

---

## 📊 Datos de Operadores (2026)

| Operador | Aniversario 2026 | vac_pendientes | Prioridad |
|---|---|---|---|
| PEREZ CARDENAS | 21 mayo | 30 | 1 (pendientes) |
| AGUIRRE HUAYRA | 25 enero | 0 | 2 (aniv. temprano) |
| TENORIO TENORIO | 22 febrero | 0 | 3 |
| SARMIENTO ZACARIAS | 13 marzo | 0 | 4 |
| PATRICIO CHAVEZ | 21 mayo | 0 | 5 |
| HUARCAYA CORDOVA | 3 julio | 0 | 6 |
| CALIXTO RAMOS | 18 diciembre | 0 | 7 |

---

## 🚀 Siguientes Pasos

1. [x] Documentar lógica actual
2. [ ] Implementar `_calcularFechaAniversario()`
3. [ ] Implementar `_puedeTomarVacaciones()`
4. [ ] Modificar `_programarVacacionesConsecutivas()`
5. [ ] Actualizar test con data real de operadores
6. [ ] Probar con año 2026
7. [ ] Validar que aniversarios se respeten

---

## 📝 Notas Técnicas

- **Archivo**: `optimizer.js`
- **Métodos afectados**:
  - `_programarVacacionesConsecutivas()` (líneas 212-301)
  - `_gestionarBloqueVacacional()` (línea 560)
  - `_inicializarOperadores()` (líneas 116-206)

- **Test file**: `test_optimizer.js` necesita actualización con data real
