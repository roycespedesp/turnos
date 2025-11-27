import logging
from typing import List, Dict, Tuple, Optional
from datetime import datetime, date, timedelta
from ortools.linear_solver import pywraplp
import pandas as pd
from models_turnos import (
    Configuracion, Ciclo, Posicion, Operador, AsignacionDiaria,
    SolicitudOptimizacionTurnos, ResultadoOptimizacionTurnos,
    EstadisticasOptimizacion, TipoTurno, EstadoOperador, EstadoOperadorCorto
)

logger = logging.getLogger(__name__)

class OptimizadorTurnos:
    def __init__(self):
        self.solver = None
        self.variables = {}
        self.configuracion = None
        self.ciclos = []
        self.posiciones = []
        self.operadores = []
        self.fechas = []
        
    def optimizar(self, solicitud: SolicitudOptimizacionTurnos) -> ResultadoOptimizacionTurnos:
        """
        Optimiza la asignación de turnos usando OR-Tools
        """
        try:
            logger.info("Iniciando optimización de turnos con OR-Tools")
            
            # Inicializar datos
            self._inicializar_datos(solicitud)
            
            # Generar fechas del período de análisis
            self._generar_fechas()
            
            # Crear solver
            self.solver = pywraplp.Solver.CreateSolver('SCIP')
            if not self.solver:
                raise Exception("No se pudo crear el solver SCIP")
            
            # Crear variables de decisión
            self._crear_variables()
            
            # Agregar restricciones
            self._agregar_restricciones()
            
            # Definir función objetivo
            self._definir_objetivo()
            
            # Resolver
            status = self.solver.Solve()
            
            if status == pywraplp.Solver.OPTIMAL or status == pywraplp.Solver.FEASIBLE:
                # Extraer solución
                cronograma = self._extraer_solucion()
                estadisticas = self._calcular_estadisticas(cronograma)
                
                return ResultadoOptimizacionTurnos(
                    cronograma=cronograma,
                    estadisticas=estadisticas,
                    advertencias=[],
                    errores=[],
                    factible=True,
                    mensaje=f"Optimización exitosa. Status: {status}"
                )
            else:
                return ResultadoOptimizacionTurnos(
                    cronograma=[],
                    estadisticas={},
                    advertencias=[],
                    errores=[f"No se encontró solución factible. Status: {status}"],
                    factible=False,
                    mensaje="Optimización fallida"
                )
                
        except Exception as e:
            logger.error(f"Error en optimización: {str(e)}")
            return ResultadoOptimizacionTurnos(
                cronograma=[],
                estadisticas={},
                advertencias=[],
                errores=[str(e)],
                factible=False,
                mensaje=f"Error en optimización: {str(e)}"
            )
    
    def _inicializar_datos(self, solicitud: SolicitudOptimizacionTurnos):
        """Inicializa los datos de la solicitud"""
        self.configuracion = solicitud.configuracion
        self.ciclos = solicitud.ciclos
        self.posiciones = solicitud.posiciones
        self.operadores = solicitud.operadores
        
        logger.info(f"Datos inicializados: {len(self.operadores)} operadores, "
                   f"{len(self.posiciones)} posiciones, {len(self.ciclos)} ciclos")
    
    def _generar_fechas(self):
        """Genera las fechas del período de análisis"""
        inicio = date(self.configuracion.ano_analisis, self.configuracion.mes_inicio_analisis, 1)
        
        # Calcular fecha de fin (fin del año)
        fin = date(self.configuracion.ano_analisis, 12, 31)
        
        # Guardar fecha de inicio para cálculos posteriores
        self.fecha_inicio = inicio
        
        self.fechas = []
        fecha_actual = inicio
        while fecha_actual <= fin:
            self.fechas.append(fecha_actual)
            fecha_actual += timedelta(days=1)
        
        logger.info(f"Período de análisis: {len(self.fechas)} días desde {inicio} hasta {fin}")
    
    def _crear_variables(self):
        """Crea las variables de decisión del modelo"""
        logger.info("Creando variables de decisión...")
        
        # Variables principales: x[operador][fecha][posicion][turno]
        self.variables['asignacion'] = {}
        
        for operador in self.operadores:
            self.variables['asignacion'][operador.id_operador] = {}
            for fecha in self.fechas:
                self.variables['asignacion'][operador.id_operador][fecha] = {}
                for posicion in self.posiciones:
                    self.variables['asignacion'][operador.id_operador][fecha][posicion.id_posicion] = {}
                    for turno in [TipoTurno.DIA, TipoTurno.NOCHE]:
                        var_name = f"x_{operador.id_operador}_{fecha}_{posicion.id_posicion}_{turno}"
                        self.variables['asignacion'][operador.id_operador][fecha][posicion.id_posicion][turno] = \
                            self.solver.BoolVar(var_name)
        
        # Variables auxiliares para vacaciones
        self.variables['vacaciones'] = {}
        for operador in self.operadores:
            self.variables['vacaciones'][operador.id_operador] = {}
            for fecha in self.fechas:
                var_name = f"vac_{operador.id_operador}_{fecha}"
                self.variables['vacaciones'][operador.id_operador][fecha] = \
                    self.solver.BoolVar(var_name)
        
        logger.info(f"Variables creadas: {len(self.operadores) * len(self.fechas) * len(self.posiciones) * 2} variables de asignación")
    
    def _agregar_restricciones(self):
        """Agrega todas las restricciones al modelo (versión simplificada)"""
        logger.info("Agregando restricciones...")
        
        # 1. Un operador puede tener máximo un turno por día
        self._restriccion_un_turno_por_dia()
        
        # 2. Restricciones de tipo de posición (solo operadores compatibles)
        self._restriccion_tipo_posicion()
        
        # 3. Restricciones de estado inicial basado en ciclo
        self._restriccion_estado_inicial()
        
        # 4. Cobertura mínima de posiciones (ACTIVADA)
        self._restriccion_cobertura_posiciones()
        
        # 5. Límite de horas anuales (ACTIVADA)
        self._restriccion_limite_horas()
        
        # 6. Restricciones de vacaciones (comentada por ahora)
        # self._restriccion_vacaciones()
        
        logger.info("Restricciones agregadas exitosamente")
    
    def _restriccion_un_turno_por_dia(self):
        """Un operador puede tener máximo un turno por día"""
        for operador in self.operadores:
            for fecha in self.fechas:
                # Suma de todas las asignaciones + vacaciones <= 1
                asignaciones = []
                for posicion in self.posiciones:
                    for turno in [TipoTurno.DIA, TipoTurno.NOCHE]:
                        asignaciones.append(
                            self.variables['asignacion'][operador.id_operador][fecha][posicion.id_posicion][turno]
                        )
                
                # Agregar variable de vacaciones
                asignaciones.append(self.variables['vacaciones'][operador.id_operador][fecha])
                
                self.solver.Add(sum(asignaciones) <= 1)
    
    def _restriccion_cobertura_posiciones(self):
        """Cada posición debe tener la cobertura mínima requerida (versión flexible)"""
        for posicion in self.posiciones:
            for fecha in self.fechas:
                for turno in [TipoTurno.DIA, TipoTurno.NOCHE]:
                    # Suma de operadores asignados >= operadores requeridos
                    operadores_asignados = []
                    for operador in self.operadores:
                        # Solo operadores que pueden trabajar en este tipo de posición
                        if operador.id_tipo_posicion == posicion.tipo_posicion:
                            operadores_asignados.append(
                                self.variables['asignacion'][operador.id_operador][fecha][posicion.id_posicion][turno]
                            )
                    
                    # Hacer la restricción más flexible: permitir al menos 1 operador si hay disponibles
                    if operadores_asignados:  # Solo si hay operadores disponibles
                        min_requeridos = min(1, posicion.op_requeridos)  # Al menos 1, máximo lo requerido
                        self.solver.Add(sum(operadores_asignados) >= min_requeridos)
    
    def _restriccion_limite_horas(self):
        """Límite de horas anuales por operador (versión flexible)"""
        for operador in self.operadores:
            horas_totales = []
            for fecha in self.fechas:
                for posicion in self.posiciones:
                    for turno in [TipoTurno.DIA, TipoTurno.NOCHE]:
                        # Cada turno son 12 horas
                        horas_totales.append(
                            12 * self.variables['asignacion'][operador.id_operador][fecha][posicion.id_posicion][turno]
                        )
            
            # Agregar horas ya laboradas con un margen de flexibilidad del 10%
            horas_previas = operador.horas_laboradas
            limite_flexible = int(self.configuracion.limite_horas_anuales * 1.1)  # 10% más flexible
            self.solver.Add(sum(horas_totales) + horas_previas <= limite_flexible)
    
    def _restriccion_tipo_posicion(self):
        """Los operadores solo pueden trabajar en su tipo de posición asignado"""
        for operador in self.operadores:
            for fecha in self.fechas:
                for posicion in self.posiciones:
                    if operador.id_tipo_posicion != posicion.tipo_posicion:
                        # Forzar a 0 las asignaciones a posiciones incompatibles
                        for turno in [TipoTurno.DIA, TipoTurno.NOCHE]:
                            self.solver.Add(
                                self.variables['asignacion'][operador.id_operador][fecha][posicion.id_posicion][turno] == 0
                            )
    
    def _restriccion_vacaciones(self):
        """Restricciones relacionadas con vacaciones"""
        # Por ahora, implementación básica
        # TODO: Implementar lógica completa de vacaciones según especificación
        pass
    
    def _definir_objetivo(self):
        """Define la función objetivo a minimizar"""
        logger.info("Definiendo función objetivo...")
        
        objetivo = []
        
        # Peso 1: Minimizar huecos (falta de cobertura)
        # Se implementa como penalización por no cumplir cobertura mínima
        peso_huecos = 1000
        
        # Peso 2: Minimizar duplicidades (exceso de cobertura)
        peso_duplicidades = 10
        
        for posicion in self.posiciones:
            for fecha in self.fechas:
                for turno in [TipoTurno.DIA, TipoTurno.NOCHE]:
                    operadores_asignados = []
                    for operador in self.operadores:
                        if operador.id_tipo_posicion == posicion.tipo_posicion:
                            operadores_asignados.append(
                                self.variables['asignacion'][operador.id_operador][fecha][posicion.id_posicion][turno]
                            )
                    
                    if operadores_asignados:
                        total_asignados = sum(operadores_asignados)
                        
                        # Penalizar duplicidades (exceso sobre lo requerido)
                        # Crear variable auxiliar para exceso
                        exceso_var = self.solver.IntVar(0, len(operadores_asignados), 
                                                       f"exceso_{posicion.id_posicion}_{fecha}_{turno}")
                        self.solver.Add(exceso_var >= total_asignados - posicion.op_requeridos)
                        objetivo.append(peso_duplicidades * exceso_var)
        
        # Establecer objetivo
        self.solver.Minimize(sum(objetivo))
        logger.info("Función objetivo definida")
    
    def _extraer_solucion(self) -> List[AsignacionDiaria]:
        """Extrae la solución del solver y genera el cronograma"""
        logger.info("Extrayendo solución...")
        
        cronograma = []
        
        for fecha in self.fechas:
            for operador in self.operadores:
                # Verificar si está en vacaciones
                en_vacaciones = self.variables['vacaciones'][operador.id_operador][fecha].solution_value() > 0.5
                
                if en_vacaciones:
                    asignacion = AsignacionDiaria(
                        fecha=fecha,
                        id_operador=operador.id_operador,
                        nombre=operador.nombre,
                        posicion="vacaciones",
                        estado=EstadoOperador.VACACIONES,
                        estado2=EstadoOperadorCorto.VC,
                        ciclo="vacaciones",
                        dia_ciclo="1/30",  # Simplificado
                        desc_pend=0,  # TODO: Calcular correctamente
                        vac_pend=operador.vac_pendientes,
                        horas_ciclo=0,
                        horas_ano=operador.horas_laboradas,
                        horas_dia=0,
                        porcentaje_dia=0.0,
                        horas_noche=0,
                        porcentaje_noche=0.0,
                        observaciones="",
                        merge1=f"vacaciones_{fecha.month}_{fecha.day}_VC",
                        merge2=f"{operador.nombre}_{fecha.month}_{fecha.day}",
                        prog=operador.id_cal
                    )
                    cronograma.append(asignacion)
                else:
                    # Buscar asignación de trabajo
                    asignado = False
                    for posicion in self.posiciones:
                        for turno in [TipoTurno.DIA, TipoTurno.NOCHE]:
                            if self.variables['asignacion'][operador.id_operador][fecha][posicion.id_posicion][turno].solution_value() > 0.5:
                                estado = EstadoOperador.TURNO_DIA if turno == TipoTurno.DIA else EstadoOperador.TURNO_NOCHE
                                estado2 = EstadoOperadorCorto.TD if turno == TipoTurno.DIA else EstadoOperadorCorto.TN
                                
                                asignacion = AsignacionDiaria(
                                    fecha=fecha,
                                    id_operador=operador.id_operador,
                                    nombre=operador.nombre,
                                    posicion=posicion.id_posicion,
                                    estado=estado,
                                    estado2=estado2,
                                    ciclo=operador.ciclo_inicial,  # Simplificado
                                    dia_ciclo="1/21",  # TODO: Calcular correctamente
                                    desc_pend=0,  # TODO: Calcular correctamente
                                    vac_pend=operador.vac_pendientes,
                                    horas_ciclo=12,  # Simplificado
                                    horas_ano=operador.horas_laboradas + 12,
                                    horas_dia=12 if turno == TipoTurno.DIA else 0,
                                    porcentaje_dia=100.0 if turno == TipoTurno.DIA else 0.0,
                                    horas_noche=12 if turno == TipoTurno.NOCHE else 0,
                                    porcentaje_noche=100.0 if turno == TipoTurno.NOCHE else 0.0,
                                    observaciones="",
                                    merge1=f"{posicion.id_posicion}_{fecha.month}_{fecha.day}_{estado2}",
                                    merge2=f"{operador.nombre}_{fecha.month}_{fecha.day}",
                                    prog=operador.id_cal
                                )
                                cronograma.append(asignacion)
                                asignado = True
                                break
                        if asignado:
                            break
                    
                    # Si no está asignado, verificar si debe estar descansando según su ciclo
                    if not asignado:
                        debe_trabajar, turno_esperado = self._calcular_estado_inicial_operador(operador, fecha)
                        
                        if debe_trabajar and turno_esperado != TipoTurno.DESCANSO:
                            # El operador debería estar trabajando pero no fue asignado
                            # Esto indica un problema en la optimización o falta de posiciones
                            observaciones = f"Debería trabajar turno {turno_esperado.value} pero no fue asignado"
                            estado = EstadoOperador.DESCANSANDO
                            estado2 = EstadoOperadorCorto.DE
                        else:
                            # El operador debe estar descansando según su ciclo
                            observaciones = "Descanso programado según ciclo"
                            estado = EstadoOperador.DESCANSANDO
                            estado2 = EstadoOperadorCorto.DE
                        
                        asignacion = AsignacionDiaria(
                            fecha=fecha,
                            id_operador=operador.id_operador,
                            nombre=operador.nombre,
                            posicion="descanso",
                            estado=estado,
                            estado2=estado2,
                            ciclo=operador.ciclo_inicial,
                            dia_ciclo="1/21",  # TODO: Calcular correctamente
                            desc_pend=0,
                            vac_pend=operador.vac_pendientes,
                            horas_ciclo=0,
                            horas_ano=operador.horas_laboradas,
                            horas_dia=0,
                            porcentaje_dia=0.0,
                            horas_noche=0,
                            porcentaje_noche=0.0,
                            observaciones=observaciones,
                            merge1=f"descanso_{fecha.month}_{fecha.day}_DE",
                            merge2=f"{operador.nombre}_{fecha.month}_{fecha.day}",
                            prog=operador.id_cal
                        )
                        cronograma.append(asignacion)
        
        logger.info(f"Solución extraída: {len(cronograma)} asignaciones")
        return cronograma
    
    def _calcular_estadisticas(self, cronograma: List[AsignacionDiaria]) -> Dict:
        """Calcula estadísticas de la optimización"""
        stats = {
            "total_operadores": len(self.operadores),
            "total_posiciones": len(self.posiciones),
            "total_dias_analizados": len(self.fechas),
            "total_asignaciones": len(cronograma),
            "turnos_dia": len([a for a in cronograma if a.estado == EstadoOperador.TURNO_DIA]),
            "turnos_noche": len([a for a in cronograma if a.estado == EstadoOperador.TURNO_NOCHE]),
            "dias_descanso": len([a for a in cronograma if a.estado == EstadoOperador.DESCANSANDO]),
            "dias_vacaciones": len([a for a in cronograma if a.estado == EstadoOperador.VACACIONES])
        }
        
        return stats
    
    def _calcular_estado_inicial_operador(self, operador, fecha):
        """
        Calcula el estado inicial de un operador para una fecha específica
        basado en su ciclo inicial, día de ciclo inicial y turno de ciclo inicial.
        
        Returns:
            tuple: (debe_trabajar: bool, turno_esperado: TipoTurno)
        """
        # Calcular días transcurridos desde el inicio del análisis
        dias_transcurridos = (fecha - self.fecha_inicio).days
        
        # Operadores de vacaciones (sin dia_ciclo_inicial) empiezan desde día 1
        dia_ciclo_inicial = operador.dia_ciclo_inicial if operador.dia_ciclo_inicial is not None else 1
        
        # Calcular días transcurridos desde el día inicial del ciclo del operador
        dias_desde_inicio_ciclo = dias_transcurridos + dia_ciclo_inicial - 1
        
        # Obtener el ciclo del operador
        ciclo = next((c for c in self.ciclos if c.id_ciclo == operador.ciclo_inicial), None)
        if not ciclo:
            # Si no hay ciclo definido, asumir descanso
            return False, TipoTurno.DESCANSO
        
        # Calcular la duración total del ciclo (siempre 21 días según el modelo)
        duracion_ciclo = ciclo.dias_trabajo + ciclo.dias_descanso
        
        # Calcular posición en el ciclo
        posicion_en_ciclo = dias_desde_inicio_ciclo % duracion_ciclo
        
        # Determinar si debe trabajar según el patrón del ciclo
        # Estructura del ciclo: Día → Noche → Descanso (bloques continuos)
        dias_trabajo = ciclo.dias_trabajo
        
        if posicion_en_ciclo < dias_trabajo:
            # Está en período de trabajo
            debe_trabajar = True
            
            # La estructura de un ciclo es SIEMPRE:
            # - Primera mitad (aprox): turnos DIA
            # - Segunda mitad: turnos NOCHE
            # - Resto: descanso
            # 
            # Ejemplo 14x7: días 1-7 DIA, días 8-14 NOCHE, días 15-21 DESCANSO
            
            # Calcular punto de cambio de DIA a NOCHE (aproximadamente la mitad de días de trabajo)
            # Debe empezar con al menos 1 día de DIA y terminar con al menos 1 día de NOCHE
            dias_dia = max(1, dias_trabajo // 2)
            
            if posicion_en_ciclo < dias_dia:
                turno_esperado = TipoTurno.DIA
            else:
                turno_esperado = TipoTurno.NOCHE
                
            return debe_trabajar, turno_esperado
        else:
            # Está en período de descanso
            return False, TipoTurno.DESCANSO
    
    def _restriccion_estado_inicial(self):
        """
        Restricción para respetar el estado inicial de los operadores basado en su ciclo.
        Versión flexible: permite que operadores trabajen en su turno esperado o descansen,
        pero no los fuerza estrictamente.
        """
        logger.info("Agregando restricciones de estado inicial...")
        
        for operador in self.operadores:
            # Verificar solo los primeros 30 días para no sobredeterminar el sistema
            fechas_verificar = self.fechas[:min(30, len(self.fechas))]
            
            for fecha in fechas_verificar:
                debe_trabajar, turno_esperado = self._calcular_estado_inicial_operador(operador, fecha)
                
                if debe_trabajar and turno_esperado != TipoTurno.DESCANSO:
                    # El operador DEBERÍA estar trabajando en el turno esperado
                    # Pero NO lo forzamos estrictamente - solo evitamos el turno opuesto
                    
                    # No puede trabajar en el turno opuesto
                    turno_opuesto = TipoTurno.NOCHE if turno_esperado == TipoTurno.DIA else TipoTurno.DIA
                    for posicion in self.posiciones:
                        if operador.id_tipo_posicion == posicion.tipo_posicion:
                            self.solver.Add(
                                self.variables['asignacion'][operador.id_operador][fecha][posicion.id_posicion][turno_opuesto] == 0
                            )
                else:
                    # Si está en período de descanso, no puede trabajar
                    for posicion in self.posiciones:
                        for turno in [TipoTurno.DIA, TipoTurno.NOCHE]:
                            self.solver.Add(
                                self.variables['asignacion'][operador.id_operador][fecha][posicion.id_posicion][turno] == 0
                            )