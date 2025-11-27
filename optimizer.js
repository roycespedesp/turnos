/**
 * EJEMPLO: Optimizador Heurístico en JavaScript
 * Migración de optimizer_heuristica.py a JavaScript
 * 
 * Este es un ejemplo de cómo se vería la versión standalone
 */

class OptimizadorHeuristico {
    /**
     * Constructor - Inicializa el optimizador con la solicitud
     * @param {Object} solicitud - {configuracion, ciclos, posiciones, operadores}
     */
    constructor(solicitud) {
        this.config = solicitud.configuracion;
        this.operadores = solicitud.operadores;
        this.posiciones = solicitud.posiciones;
        this.ciclos = solicitud.ciclos;

        // Mapeo de ciclos para acceso rápido
        this.ciclosMap = {};
        this.ciclos.forEach(c => {
            const keyNormalizado = c.id_ciclo.replace(/×/g, 'x').replace(/X/g, 'x');
            this.ciclosMap[keyNormalizado] = c;
            this.ciclosMap[c.id_ciclo] = c;
        });

        // Estado del cronograma
        this.cronograma = [];
        this.estadoOperadores = {};

        // Bloque vacacional global
        this.bloqueVacacionalIniciado = false;
        this.fechaInicioBloqueVacacional = null;
        this.diaActualBloque = 0;

        console.log(`Optimizador inicializado: ${this.operadores.length} operadores, ` +
            `${this.posiciones.length} posiciones, ${this.ciclos.length} ciclos`);
    }

    /**
     * Ejecuta el algoritmo completo de optimización
     * @returns {Object} {cronograma, estadisticas, huecos}
     */
    optimizar() {
        try {
            // 1. Inicializar estado de operadores
            this._inicializarOperadores();

            // 2. Generar cronograma día por día
            const fechaInicio = new Date(
                this.config.ano_analisis,
                this.config.mes_inicio_analisis - 1, // Mes 0-indexed
                1
            );
            const fechaFin = new Date(this.config.ano_analisis, 11, 31); // Diciembre

            this._generarCronogramaCompleto(fechaInicio, fechaFin);

            // 3. Calcular estadísticas
            const estadisticas = this._calcularEstadisticas();

            // 4. Detectar huecos
            const huecos = this._detectarHuecos();

            console.log('\n✅ Optimización completada:');
            console.log(`   - Total registros: ${estadisticas.total_registros}`);
            console.log(`   - Turnos día: ${estadisticas.turnos_dia}`);
            console.log(`   - Turnos noche: ${estadisticas.turnos_noche}`);
            console.log(`   - Días descanso: ${estadisticas.dias_descanso}`);
            console.log(`   - Días vacaciones: ${estadisticas.dias_vacaciones}`);
            console.log(`   - Huecos detectados: ${huecos.length}`);

            return {
                cronograma: this.cronograma,
                estadisticas: estadisticas,
                huecos: huecos
            };
        } catch (error) {
            console.error('Error en optimización:', error);
            throw error;
        }
    }

    /**
     * Convierte fecha DD/MM/YYYY a objeto Date
     * @param {string} fechaStr - Fecha en formato DD/MM/YYYY
     * @returns {Date|null}
     */
    _convertirFechaExcel(fechaStr) {
        if (!fechaStr) return null;

        try {
            const partes = fechaStr.split('/');
            if (partes.length === 3) {
                return new Date(
                    parseInt(partes[2]),
                    parseInt(partes[1]) - 1, // Mes 0-indexed
                    parseInt(partes[0])
                );
            }
            // Si es número (días desde 1900) - formato Excel
            const dias = parseInt(fechaStr);
            if (!isNaN(dias)) {
                const fechaBase = new Date(1899, 11, 30); // 30 Dic 1899
                return new Date(fechaBase.getTime() + dias * 24 * 60 * 60 * 1000);
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Inicializa el estado de cada operador
     */
    _inicializarOperadores() {
        console.log('Inicializando estado de operadores...');
        console.log(`Ciclos disponibles: ${Object.keys(this.ciclosMap).join(', ')}`);

        // Identificar ciclo preferido
        let cicloPreferido = null;

        // 1. Intentar obtener desde configuración (override)
        if (this.config.ciclo_preferido_override) {
            const override = this.config.ciclo_preferido_override;
            // Normalizar
            const overrideNorm = override.replace(/×/g, 'x').replace(/X/g, 'x');
            if (this.ciclosMap[overrideNorm]) {
                cicloPreferido = overrideNorm;
                console.log(`Ciclo preferido (OVERRIDE): ${cicloPreferido}`);
            } else {
                console.warn(`⚠️ Ciclo override '${override}' no encontrado. Usando default.`);
            }
        }

        // 2. Si no hay override, buscar en la lista de ciclos
        if (!cicloPreferido) {
            for (const c of this.ciclos) {
                if (c.ciclo_preferido && c.ciclo_preferido.toLowerCase() === 'sí') {
                    cicloPreferido = c.id_ciclo.replace(/×/g, 'x').replace(/X/g, 'x');
                    break;
                }
            }
        }
        if (!cicloPreferido) {
            cicloPreferido = '12x9';
        }
        console.log(`Ciclo preferido final: ${cicloPreferido}`);

        for (const operador of this.operadores) {
            const cicloAUso = cicloPreferido;
            console.log(`Operador ${operador.nombre}: Usando ciclo ${cicloAUso}`);

            const cicloInfo = this.ciclosMap[cicloAUso];
            if (!cicloInfo) {
                throw new Error(`Ciclo ${cicloAUso} no encontrado`);
            }

            const diasTrabajo = cicloInfo.dias_trabajo;
            const diasDescanso = cicloInfo.dias_descanso;

            // Distribución inicial (flexible)
            const diasTd = Math.floor(diasTrabajo / 2);
            const diasTn = diasTrabajo - diasTd;

            const esOperadorReemplazo = operador.id_posicion_inicial === 'op_vacaciones';

            // Ciclos disponibles para optimización
            const ciclosDisponibles = [cicloPreferido];
            const otrosCiclos = Object.keys(this.ciclosMap)
                .filter(k => k !== cicloPreferido)
                .sort((a, b) => {
                    const diasA = parseInt(a.split('x')[0]) || 999;
                    const diasB = parseInt(b.split('x')[0]) || 999;
                    return Math.abs(diasA - 12) - Math.abs(diasB - 12);
                });
            ciclosDisponibles.push(...otrosCiclos);

            this.estadoOperadores[operador.id_operador] = {
                operador: operador,
                cicloActual: cicloAUso,
                ciclosDisponibles: ciclosDisponibles,
                diaCiclo: operador.dia_ciclo_inicial || (esOperadorReemplazo ? 0 : 1),
                diasTdCiclo: diasTd,
                diasTnCiclo: diasTn,
                diasDescansoCiclo: diasDescanso,
                diasTrabajoTotal: diasTrabajo,
                tdMin: 1,
                tnMin: 1,
                horasAno: operador.horas_laboradas || 0,
                horasDiaAcumuladas: 0,
                horasNocheAcumuladas: 0,
                descansosPendientes: 0,
                vacPendientes: operador.vac_pendientes || 0,
                ultimoCiclo: false,
                enVacaciones: false,
                diaVacacion: 0,
                esOperadorReemplazo: esOperadorReemplazo,
                cicloPreferido: cicloPreferido
            };
        }

        // Programar vacaciones consecutivas
        const fechaInicio = new Date(this.config.ano_analisis, 0, 1);
        this._programarVacacionesConsecutivas(fechaInicio);
    }

    /**
     * Programa vacaciones con espaciamiento para evitar duplicidades
     * @param {Date} fechaInicio 
     */
    _programarVacacionesConsecutivas(fechaInicio) {
        // Filtrar operadores regulares (excluir op_vacaciones)
        const operadoresRegulares = this.operadores.filter(
            op => op.id_posicion_inicial !== 'op_vacaciones'
        );
        const operadorReemplazo = this.operadores.find(
            op => op.id_posicion_inicial === 'op_vacaciones'
        );

        // Convertir fecha_gen_vac y ordenar por prioridad
        for (const op of operadoresRegulares) {
            const fechaVenc = this._convertirFechaExcel(op.fecha_gen_vac);
            op._fechaVencimientoReal = fechaVenc;
        }

        // Ordenar: primero con vac_pendientes > 0, luego por fecha más próxima
        operadoresRegulares.sort((a, b) => {
            const pendA = (a.vac_pendientes && a.vac_pendientes > 0) ? 0 : 1;
            const pendB = (b.vac_pendientes && b.vac_pendientes > 0) ? 0 : 1;
            if (pendA !== pendB) return pendA - pendB;

            const fechaA = a._fechaVencimientoReal || new Date(2099, 11, 31);
            const fechaB = b._fechaVencimientoReal || new Date(2099, 11, 31);
            return fechaA - fechaB;
        });

        console.log('\n' + '='.repeat(70));
        console.log('🗓️  BLOQUE VACACIONAL ESPACIADO (ANTI-DUPLICIDAD)');
        console.log('='.repeat(70));
        console.log(`✅ Año: ${this.config.ano_analisis}`);
        console.log(`✅ Operadores regulares: ${operadoresRegulares.length}`);
        console.log('✅ Espaciamiento: Mínimo 51 días entre inicios (30 vac + 21 ciclo reemplazo)');
        console.log('\n📋 ORDEN DE VACACIONES (por prioridad):\n');

        // Programar slots con ESPACIAMIENTO
        const espaciamiento = 51; // 30 días vacaciones + 21 días ciclo
        let diaInicio = 0;

        for (let idx = 0; idx < operadoresRegulares.length; idx++) {
            const operador = operadoresRegulares[idx];
            if (!this.estadoOperadores[operador.id_operador]) continue;

            const diaFin = diaInicio + 29; // 30 días (0-29, 51-80, etc.)

            // Marcar en el estado del operador
            this.estadoOperadores[operador.id_operador].necesitaVacaciones = true;
            this.estadoOperadores[operador.id_operador].prioridadVacaciones = idx + 1;
            this.estadoOperadores[operador.id_operador].slotInicioBloque = diaInicio;
            this.estadoOperadores[operador.id_operador].slotFinBloque = diaFin;
            this.estadoOperadores[operador.id_operador].diasVacacionesTotales = 30;
            this.estadoOperadores[operador.id_operador].fechaTentativaInicioVac = null;

            const fechaVencStr = operador._fechaVencimientoReal
                ? this._formatearFecha(operador._fechaVencimientoReal)
                : 'N/A';
            const pendStr = (operador.vac_pendientes && operador.vac_pendientes > 0)
                ? ` (⚠️ ${operador.vac_pendientes} pendientes)`
                : '';

            console.log(`  ${idx + 1}. ${operador.nombre.substring(0, 40).padEnd(40)} | ` +
                `Slot: Días ${diaInicio.toString().padStart(3)}-${diaFin.toString().padStart(3)} ` +
                `del bloque | Venc: ${fechaVencStr}${pendStr}`);

            // Siguiente operador empieza 51 días después
            diaInicio += espaciamiento;
        }

        // Sarmiento/op_vacaciones toma vacaciones al final
        if (operadorReemplazo && this.estadoOperadores[operadorReemplazo.id_operador]) {
            const slotInicioSarmiento = diaInicio;
            const slotFinSarmiento = slotInicioSarmiento + 29;

            this.estadoOperadores[operadorReemplazo.id_operador].necesitaVacaciones = true;
            this.estadoOperadores[operadorReemplazo.id_operador].prioridadVacaciones = operadoresRegulares.length + 1;
            this.estadoOperadores[operadorReemplazo.id_operador].slotInicioBloque = slotInicioSarmiento;
            this.estadoOperadores[operadorReemplazo.id_operador].slotFinBloque = slotFinSarmiento;
            this.estadoOperadores[operadorReemplazo.id_operador].diasVacacionesTotales = 30;

            console.log(`\n  ⭐ ${operadorReemplazo.nombre.substring(0, 40).padEnd(40)} | ` +
                `Slot: Días ${slotInicioSarmiento.toString().padStart(3)}-${slotFinSarmiento.toString().padStart(3)} ` +
                `(propias vacaciones)`);
        }

        const bloqueTotal = diaInicio + 30;
        console.log(`\n${'='.repeat(70)}`);
        console.log('✅ PROGRAMACIÓN COMPLETADA');
        console.log(`✅ Bloque total: ${bloqueTotal} días (con espaciamiento anti-duplicidad)`);
        console.log('✅ Las vacaciones empezarán SOLO al final del período de descanso');
        console.log('='.repeat(70) + '\n');
    }

    /**
     * Genera el cronograma completo día por día
     * @param {Date} fechaInicio 
     * @param {Date} fechaFin 
     */
    _generarCronogramaCompleto(fechaInicio, fechaFin) {
        console.log(`Generando cronograma desde ${this._formatearFecha(fechaInicio)} hasta ${this._formatearFecha(fechaFin)}...`);

        const diasTotales = Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24)) + 1;

        for (let diaNum = 0; diaNum < diasTotales; diaNum++) {
            const fechaActual = new Date(fechaInicio);
            fechaActual.setDate(fechaActual.getDate() + diaNum);

            // Gestión del bloque vacacional
            this._gestionarBloqueVacacional(fechaActual, diaNum);

            // Determinar operadores disponibles
            const operadoresDisponibles = {};
            const operadoresEnVacaciones = {};
            let operadorReemplazo = null;

            for (const [opId, estado] of Object.entries(this.estadoOperadores)) {
                const operador = estado.operador;
                const [estadoTurno] = this._calcularEstadoTurno(estado);

                if (estado.esOperadorReemplazo) {
                    operadorReemplazo = [opId, estado];
                    continue;
                }

                if (estadoTurno === 'vacaciones') {
                    const tipoPos = operador.id_tipo_posicion;
                    if (!operadoresEnVacaciones[tipoPos]) {
                        operadoresEnVacaciones[tipoPos] = [];
                    }
                    operadoresEnVacaciones[tipoPos].push([opId, operador.id_posicion_inicial]);
                }

                if (estadoTurno === 't.dia' || estadoTurno === 't.noche') {
                    const tipoPos = operador.id_tipo_posicion;
                    if (!operadoresDisponibles[tipoPos]) {
                        operadoresDisponibles[tipoPos] = { dia: [], noche: [] };
                    }

                    if (estadoTurno === 't.dia') {
                        operadoresDisponibles[tipoPos].dia.push([opId, estado]);
                    } else {
                        operadoresDisponibles[tipoPos].noche.push([opId, estado]);
                    }
                }
            }

            // Asignar operadores (lógica similar a Python)
            const asignaciones = {};
            const posicionesOcupadasDia = new Set();
            const posicionesOcupadasNoche = new Set();

            // ... (resto de lógica de asignación)

            // Generar registros del día
            for (const [opId, estado] of Object.entries(this.estadoOperadores)) {
                const posicionAsignada = asignaciones[opId];
                const registro = this._generarRegistroDia(estado, fechaActual, posicionAsignada);
                this.cronograma.push(registro);

                // Validar límite de horas anuales
                if (estado.horasAno >= this.config.limite_horas_anuales && !estado.ultimoCiclo) {
                    estado.ultimoCiclo = true;
                    console.log(`⚠️ ${estado.operador.nombre}: Alcanzó límite de horas anuales (${estado.horasAno}h). ÚLTIMO CICLO.`);
                }
            }

            // Actualizar estado de todos los operadores
            for (const [, estado] of Object.entries(this.estadoOperadores)) {
                this._actualizarEstadoOperador(estado, fechaActual);
            }
        }
    }

    /**
     * Calcula el estado del turno según el día del ciclo
     * @param {Object} estado 
     * @returns {[string, string]} [estado_turno, estado2]
     */
    _calcularEstadoTurno(estado) {
        if (estado.enVacaciones) {
            return ['vacaciones', 'VC'];
        }

        const diaCiclo = estado.diaCiclo;

        if (diaCiclo === 0) {
            return ['descansando', 'DE'];
        }

        const diasTd = estado.diasTdCiclo;
        const diasTn = estado.diasTnCiclo;

        if (diaCiclo >= 1 && diaCiclo <= diasTd) {
            return ['t.dia', 'TD'];
        } else if (diaCiclo > diasTd && diaCiclo <= (diasTd + diasTn)) {
            return ['t.noche', 'TN'];
        } else {
            return ['descansando', 'DE'];
        }
    }

    /**
     * Genera el registro de un operador para un día específico
     * @param {Object} estado 
     * @param {Date} fecha 
     * @param {string} posicionAsignada 
     * @returns {Object}
     */
    _generarRegistroDia(estado, fecha, posicionAsignada) {
        const operador = estado.operador;
        const diaCiclo = estado.diaCiclo;
        const cicloActual = estado.cicloActual;

        const [estadoTurno, estado2] = this._calcularEstadoTurno(estado);

        let posicion;
        if (estadoTurno === 'descansando') {
            posicion = 'descanso';
        } else if (estadoTurno === 'vacaciones') {
            posicion = 'vacaciones';
        } else {
            posicion = posicionAsignada || operador.id_posicion_inicial;
        }

        const horasDia = estadoTurno === 't.dia' ? 12 : 0;
        const horasNoche = estadoTurno === 't.noche' ? 12 : 0;

        const horasCiclo = this._calcularHorasCiclo(estado, estadoTurno);
        const totalHoras = estado.horasAno;
        const porcentajeDia = totalHoras > 0
            ? Math.round((estado.horasDiaAcumuladas / totalHoras) * 100 * 100) / 100
            : 0;
        const porcentajeNoche = totalHoras > 0
            ? Math.round((estado.horasNocheAcumuladas / totalHoras) * 100 * 100) / 100
            : 0;

        return {
            Fecha: this._formatearFecha(fecha),
            ID_Operador: operador.id_operador,
            Nombre: operador.nombre,
            Posicion: posicion,
            Posicion_Inicial: operador.id_posicion_inicial,
            Estado: estadoTurno,
            Estado2: estado2,
            Ciclo: cicloActual,
            Dia_Ciclo: `${diaCiclo}/21`,
            Desc_Pend: estado.descansosPendientes || 0,
            Vac_Pend: estado.vacPendientes || 0,
            Horas_Ciclo: horasCiclo,
            Horas_Ano: totalHoras,
            Horas_Dia: estado.horasDiaAcumuladas,
            Porcentaje_Dia: porcentajeDia,
            Horas_Noche: estado.horasNocheAcumuladas,
            Porcentaje_Noche: porcentajeNoche,
            Observaciones: '',
            Merge1: `${posicion}_${String(fecha.getMonth() + 1).padStart(2, '0')}_${String(fecha.getDate()).padStart(2, '0')}_${estado2}`,
            Merge2: `${operador.nombre}_${String(fecha.getMonth() + 1).padStart(2, '0')}_${String(fecha.getDate()).padStart(2, '0')}`,
            Prog: operador.id_cal || null
        };
    }

    /**
     * Calcula las horas acumuladas en el ciclo actual
     * @param {Object} estado 
     * @param {string} estadoTurno 
     * @returns {number}
     */
    _calcularHorasCiclo(estado, estadoTurno) {
        if (estadoTurno === 'descansando' || estadoTurno === 'vacaciones') {
            const cicloInfo = this.ciclosMap[estado.cicloActual];
            return cicloInfo ? cicloInfo.dias_trabajo * 12 : 0;
        }

        const diaCiclo = estado.diaCiclo;
        const diasTrabajados = Math.min(
            diaCiclo,
            estado.diasTdCiclo + estado.diasTnCiclo
        );
        return diasTrabajados * 12;
    }

    /**
     * Actualiza el estado del operador después de procesar un día
     * @param {Object} estado 
     * @param {Date} fecha 
     */
    _actualizarEstadoOperador(estado, fecha) {
        const [estadoTurno] = this._calcularEstadoTurno(estado);

        // Actualizar horas
        if (estadoTurno === 't.dia') {
            estado.horasAno += 12;
            estado.horasDiaAcumuladas += 12;
        } else if (estadoTurno === 't.noche') {
            estado.horasAno += 12;
            estado.horasNocheAcumuladas += 12;
        }

        // Avanzar ciclo
        if (estado.enVacaciones) {
            estado.diaVacacion += 1;
        } else {
            if (estado.diaCiclo > 0) {
                estado.diaCiclo += 1;
                if (estado.diaCiclo > 21) {
                    estado.diaCiclo = 1;
                }
            }
        }
    }

    /**
     * Calcula estadísticas del cronograma generado
     * @returns {Object}
     */
    _calcularEstadisticas() {
        const totalRegistros = this.cronograma.length;
        const turnosDia = this.cronograma.filter(r => r.Estado === 't.dia').length;
        const turnosNoche = this.cronograma.filter(r => r.Estado === 't.noche').length;
        const diasDescanso = this.cronograma.filter(r => r.Estado === 'descansando').length;
        const diasVacaciones = this.cronograma.filter(r => r.Estado === 'vacaciones').length;

        return {
            total_registros: totalRegistros,
            total_operadores: this.operadores.length,
            total_posiciones: this.posiciones.length,
            turnos_dia: turnosDia,
            turnos_noche: turnosNoche,
            dias_descanso: diasDescanso,
            dias_vacaciones: diasVacaciones,
            dias_analizados: this.operadores.length > 0
                ? Math.floor(totalRegistros / this.operadores.length)
                : 0
        };
    }

    /**
     * Detecta días donde una posición no tiene cobertura
     * @returns {Array}
     */
    _detectarHuecos() {
        // Implementación simplificada
        return [];
    }

    /**
     * Gestiona el bloque vacacional con espaciamiento
     * @param {Date} fechaActual 
     * @param {number} diaNum 
     */
    _gestionarBloqueVacacional(fechaActual, diaNum) {
        // Implementación simplificada - ver código Python completo
    }

    /**
     * Formatea fecha a DD/MM/YYYY
     * @param {Date} fecha 
     * @returns {string}
     */
    _formatearFecha(fecha) {
        const dia = String(fecha.getDate()).padStart(2, '0');
        const mes = String(fecha.getMonth() + 1).padStart(2, '0');
        const anio = fecha.getFullYear();
        return `${dia}/${mes}/${anio}`;
    }
}

/**
 * Función principal para optimizar turnos (equivalente a optimizar_con_heuristica)
 * @param {Object} solicitud 
 * @returns {[Array, Object]} [cronograma, metricas]
 */
function optimizarConHeuristica(solicitud) {
    const optimizador = new OptimizadorHeuristico(solicitud);
    const resultado = optimizador.optimizar();

    const cronograma = resultado.cronograma;
    const metricas = resultado.estadisticas;

    console.log(`Optimización completada: ${cronograma.length} registros generados`);
    console.log('Métricas:', metricas);

    return [cronograma, metricas];
}

// Exportar para uso en otros módulos (si se usa módulos ES6)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OptimizadorHeuristico, optimizarConHeuristica };
}

