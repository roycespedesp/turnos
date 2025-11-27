#!/usr/bin/env python3
"""
Optimizador Heurístico de Turnos
Implementación del algoritmo descrito en algoritmo.md
Sprint 1: Gestor de Ciclos Básico
"""

from datetime import date, timedelta
from typing import List, Dict, Tuple, Optional
from models_turnos import (
    SolicitudOptimizacionTurnos,
    Operador,
    Posicion,
    Ciclo,
    TipoTurno
)
import logging

logger = logging.getLogger(__name__)


class OptimizadorHeuristico:
    """
    Motor de optimización basado en heurística constructiva
    """
    
    def __init__(self, solicitud: SolicitudOptimizacionTurnos):
        self.config = solicitud.configuracion
        self.operadores = solicitud.operadores
        self.posiciones = solicitud.posiciones
        self.ciclos = solicitud.ciclos
        
        # Mapeo de ciclos para acceso rápido (con normalización de formato)
        self.ciclos_map = {}
        for c in self.ciclos:
            # Normalizar formato: 14×7 → 14x7 (reemplazar × por x)
            key_normalizado = c.id_ciclo.replace('×', 'x').replace('X', 'x')
            self.ciclos_map[key_normalizado] = c
            # También guardar con la clave original por si acaso
            self.ciclos_map[c.id_ciclo] = c
        
        # Estado del cronograma
        self.cronograma: List[Dict] = []
        
        # Estado de cada operador
        self.estado_operadores: Dict[str, Dict] = {}
        
        # ⭐ BLOQUE VACACIONAL GLOBAL
        self.bloque_vacacional_iniciado = False
        self.fecha_inicio_bloque_vacacional = None
        self.dia_actual_bloque = 0  # Día 0-209 dentro del bloque total
        
        logger.info(f"Optimizador inicializado: {len(self.operadores)} operadores, "
                   f"{len(self.posiciones)} posiciones, {len(self.ciclos)} ciclos")
        logger.info(f"Ciclos disponibles: {list(self.ciclos_map.keys())}")
    
    def optimizar(self) -> Dict:
        """
        Ejecuta el algoritmo completo de optimización
        """
        try:
            # 1. Inicializar estado de operadores
            self._inicializar_operadores()
            
            # 2. Generar cronograma día por día
            fecha_inicio = date(self.config.ano_analisis, self.config.mes_inicio_analisis, 1)
            fecha_fin = date(self.config.ano_analisis, 12, 31)
            
            self._generar_cronograma_completo(fecha_inicio, fecha_fin)
            
            # 3. Calcular estadísticas
            estadisticas = self._calcular_estadisticas()
            
            # 4. Detectar huecos
            huecos = self._detectar_huecos()
            
            logger.info(f"\n✅ Optimización completada:")
            logger.info(f"   - Total registros: {estadisticas['total_registros']}")
            logger.info(f"   - Turnos día: {estadisticas['turnos_dia']}")
            logger.info(f"   - Turnos noche: {estadisticas['turnos_noche']}")
            logger.info(f"   - Días descanso: {estadisticas['dias_descanso']}")
            logger.info(f"   - Días vacaciones: {estadisticas['dias_vacaciones']}")
            logger.info(f"   - Huecos detectados: {len(huecos)}")
            
            return {
                "cronograma": self.cronograma,
                "estadisticas": estadisticas,
                "huecos": huecos
            }
            
        except Exception as e:
            logger.error(f"Error en optimización: {e}", exc_info=True)
            raise
    
    def _convertir_fecha_excel(self, fecha_str: str) -> Optional[date]:
        """Convierte fecha DD/MM/YYYY a objeto date"""
        if not fecha_str:
            return None
        try:
            # Si es string formato DD/MM/YYYY
            partes = fecha_str.split('/')
            if len(partes) == 3:
                return date(int(partes[2]), int(partes[1]), int(partes[0]))
            # Si es número (días desde 1900)
            dias = int(float(fecha_str))
            fecha_base = date(1899, 12, 30)
            return fecha_base + timedelta(days=dias)
        except (ValueError, TypeError):
            return None
    
    def _programar_vacaciones_consecutivas(self, fecha_inicio: date):
        """
        🔥 IMPLEMENTACIÓN CRÍTICA: VACACIONES ESPACIADAS PARA EVITAR DUPLICIDADES
        
        Programa vacaciones de 30 días con ESPACIAMIENTO entre ellas:
        - Mínimo 21 días entre el inicio de una vacación y la siguiente
        - Esto permite que Sarmiento complete un ciclo completo antes de la siguiente vacación
        - El bloque total será más largo que 180 días debido al espaciamiento
        - Las vacaciones SOLO pueden empezar al final del período de descanso de un ciclo
        """
        # Filtrar operadores regulares (excluir op_vacaciones)
        operadores_regulares = [op for op in self.operadores if op.id_posicion_inicial != "op_vacaciones"]
        operador_reemplazo = next((op for op in self.operadores if op.id_posicion_inicial == "op_vacaciones"), None)
        
        # Convertir fecha_gen_vac y ordenar por prioridad
        for op in operadores_regulares:
            fecha_venc = self._convertir_fecha_excel(op.fecha_gen_vac)
            op._fecha_vencimiento_real = fecha_venc
        
        # Ordenar: primero con vac_pendientes > 0, luego por fecha más próxima
        operadores_regulares.sort(key=lambda op: (
            0 if (op.vac_pendientes and op.vac_pendientes > 0) else 1,
            op._fecha_vencimiento_real if op._fecha_vencimiento_real else date(2099, 12, 31)
        ))
        
        logger.info(f"\n{'='*70}")
        logger.info(f"🗓️  BLOQUE VACACIONAL ESPACIADO (ANTI-DUPLICIDAD)")
        logger.info(f"{'='*70}")
        logger.info(f"✅ Año: {self.config.ano_analisis}")
        logger.info(f"✅ Operadores regulares: {len(operadores_regulares)}")
        logger.info(f"✅ Espaciamiento: Mínimo 51 días entre inicios (30 vac + 21 ciclo reemplazo)")
        logger.info(f"\n📋 ORDEN DE VACACIONES (por prioridad):\n")
        
        # Programar slots con ESPACIAMIENTO
        # Cada operador: 30 días vacaciones + mínimo 21 días para que Sarmiento complete ciclo
        espaciamiento = 51  # 30 días vacaciones + 21 días ciclo
        dia_inicio = 0
        
        for idx, operador in enumerate(operadores_regulares, 1):
            if operador.id_operador not in self.estado_operadores:
                continue
            
            dia_fin = dia_inicio + 29  # 30 días (0-29, 51-80, 102-131, etc.)
            
            # Marcar en el estado del operador
            self.estado_operadores[operador.id_operador]["necesita_vacaciones"] = True
            self.estado_operadores[operador.id_operador]["prioridad_vacaciones"] = idx
            self.estado_operadores[operador.id_operador]["slot_inicio_bloque"] = dia_inicio
            self.estado_operadores[operador.id_operador]["slot_fin_bloque"] = dia_fin
            self.estado_operadores[operador.id_operador]["dias_vacaciones_totales"] = 30
            self.estado_operadores[operador.id_operador]["fecha_tentativa_inicio_vac"] = None  # Se determinará dinámicamente
            
            fecha_venc_str = operador._fecha_vencimiento_real.strftime('%d/%m/%Y') if operador._fecha_vencimiento_real else "N/A"
            pend_str = f" (⚠️ {operador.vac_pendientes} pendientes)" if operador.vac_pendientes and operador.vac_pendientes > 0 else ""
            
            logger.info(f"  {idx}. {operador.nombre[:40]:40} | Slot: Días {dia_inicio:3d}-{dia_fin:3d} del bloque | Venc: {fecha_venc_str}{pend_str}")
            
            # Siguiente operador empieza 51 días después (30 vac + 21 ciclo)
            dia_inicio += espaciamiento
        
        # Calcular el tamaño total del bloque
        bloque_total = dia_inicio + 30  # Último operador + sus vacaciones de Sarmiento
        
        # Sarmiento/op_vacaciones toma vacaciones al final
        if operador_reemplazo and operador_reemplazo.id_operador in self.estado_operadores:
            slot_inicio_sarmiento = dia_inicio
            slot_fin_sarmiento = slot_inicio_sarmiento + 29
            
            self.estado_operadores[operador_reemplazo.id_operador]["necesita_vacaciones"] = True
            self.estado_operadores[operador_reemplazo.id_operador]["prioridad_vacaciones"] = len(operadores_regulares) + 1
            self.estado_operadores[operador_reemplazo.id_operador]["slot_inicio_bloque"] = slot_inicio_sarmiento
            self.estado_operadores[operador_reemplazo.id_operador]["slot_fin_bloque"] = slot_fin_sarmiento
            self.estado_operadores[operador_reemplazo.id_operador]["dias_vacaciones_totales"] = 30
            
            logger.info(f"\n  ⭐ {operador_reemplazo.nombre[:40]:40} | Slot: Días {slot_inicio_sarmiento:3d}-{slot_fin_sarmiento:3d} (propias vacaciones)")
        
        logger.info(f"\n{'='*70}")
        logger.info(f"✅ PROGRAMACIÓN COMPLETADA")
        logger.info(f"✅ Bloque total: {bloque_total} días (con espaciamiento anti-duplicidad)")
        logger.info(f"✅ Las vacaciones empezarán SOLO al final del período de descanso")
        logger.info(f"{'='*70}\n")
    
    def _inicializar_operadores(self):
        """
        Inicializa el estado de cada operador
        """
        logger.info("Inicializando estado de operadores...")
        logger.info(f"Ciclos disponibles para optimización: {list(self.ciclos_map.keys())}")
        
        # Identificar ciclo preferido
        ciclo_preferido = None
        for c in self.ciclos:
            if c.ciclo_preferido.lower() in ["sí", "si", "yes"]:
                ciclo_preferido = c.id_ciclo.replace('×', 'x').replace('X', 'x')
                break
        if not ciclo_preferido:
            ciclo_preferido = "12x9"
        logger.info(f"Ciclo preferido para optimización: {ciclo_preferido}")
        
        for operador in self.operadores:
            # 🔥 FORZAR CICLO PREFERIDO 12x9 PARA TODOS
            ciclo_a_usar = ciclo_preferido
            logger.info(f"Operador {operador.nombre}: Usando ciclo {ciclo_a_usar}")
            
            ciclo_info = self.ciclos_map.get(ciclo_a_usar)
            if not ciclo_info:
                raise ValueError(f"Ciclo {ciclo_a_usar} no encontrado")
            
            dias_trabajo = ciclo_info.dias_trabajo
            dias_descanso = ciclo_info.dias_descanso
            
            # Distribución inicial (flexible)
            dias_td = dias_trabajo // 2
            dias_tn = dias_trabajo - dias_td
            
            es_operador_reemplazo = (operador.id_posicion_inicial == "op_vacaciones")
            
            # Ciclos disponibles para optimización
            ciclos_disponibles = [ciclo_preferido]
            for ciclo_id in sorted(self.ciclos_map.keys(), key=lambda x: abs(int(x.split('x')[0]) - 12) if 'x' in x else 999):
                ciclo_norm = ciclo_id.replace('×', 'x').replace('X', 'x')
                if ciclo_norm not in ciclos_disponibles:
                    ciclos_disponibles.append(ciclo_norm)
            
            self.estado_operadores[operador.id_operador] = {
                "operador": operador,
                "ciclo_actual": ciclo_a_usar,
                "ciclos_disponibles": ciclos_disponibles,
                "dia_ciclo": operador.dia_ciclo_inicial or 1 if not es_operador_reemplazo else 0,
                "dias_td_ciclo": dias_td,
                "dias_tn_ciclo": dias_tn,
                "dias_descanso_ciclo": dias_descanso,
                "dias_trabajo_total": dias_trabajo,
                "td_min": 1,
                "tn_min": 1,
                "horas_ano": operador.horas_laboradas or 0,
                "horas_dia_acumuladas": 0,
                "horas_noche_acumuladas": 0,
                "descansos_pendientes": 0,
                "vac_pendientes": operador.vac_pendientes or 0,
                "ultimo_ciclo": False,
                "en_vacaciones": False,
                "dia_vacacion": 0,
                "es_operador_reemplazo": es_operador_reemplazo,
                "ciclo_preferido": ciclo_preferido
            }
        
        # Programar vacaciones consecutivas
        self._programar_vacaciones_consecutivas(date(self.config.ano_analisis, 1, 1))
    
    def _generar_cronograma_completo(self, fecha_inicio: date, fecha_fin: date):
        """
        Genera el cronograma día por día
        """
        logger.info(f"Generando cronograma desde {fecha_inicio} hasta {fecha_fin}...")
        
        dias_totales = (fecha_fin - fecha_inicio).days + 1
        
        for dia_num in range(dias_totales):
            fecha_actual = fecha_inicio + timedelta(days=dia_num)
            
            # 🔥 PASO 0: GESTIÓN DEL BLOQUE VACACIONAL CONSECUTIVO
            self._gestionar_bloque_vacacional(fecha_actual, dia_num)
            
            # PASO 1: Determinar operadores disponibles
            operadores_disponibles = {}
            operadores_en_vacaciones = {}
            operador_reemplazo = None
            
            for op_id, estado in self.estado_operadores.items():
                operador = estado["operador"]
                estado_turno, _ = self._calcular_estado_turno(estado)
                
                if estado.get("es_operador_reemplazo"):
                    operador_reemplazo = (op_id, estado)
                    continue
                
                if estado_turno == "vacaciones":
                    tipo_pos = operador.id_tipo_posicion
                    if tipo_pos not in operadores_en_vacaciones:
                        operadores_en_vacaciones[tipo_pos] = []
                    operadores_en_vacaciones[tipo_pos].append((op_id, operador.id_posicion_inicial))
                
                if estado_turno in ["t.dia", "t.noche"]:
                    tipo_pos = operador.id_tipo_posicion
                    if tipo_pos not in operadores_disponibles:
                        operadores_disponibles[tipo_pos] = {"dia": [], "noche": []}
                    
                    if estado_turno == "t.dia":
                        operadores_disponibles[tipo_pos]["dia"].append((op_id, estado))
                    else:
                        operadores_disponibles[tipo_pos]["noche"].append((op_id, estado))
            
            # PASO 2: Asignar operadores (anti-duplicidad)
            asignaciones = {}
            posiciones_ocupadas_dia = set()
            posiciones_ocupadas_noche = set()
            
            # 2.1: Operador de reemplazo cubre vacaciones
            # ⚠️ CRÍTICO: Solo puede cubrir UNA posición a la vez
            if operador_reemplazo and operadores_en_vacaciones:
                op_reemplazo_id, estado_reemplazo = operador_reemplazo
                estado_turno_reemplazo, _ = self._calcular_estado_turno(estado_reemplazo)
                
                # Solo asignar si el reemplazo está trabajando (no descansando)
                if estado_turno_reemplazo in ["t.dia", "t.noche"]:
                    # Buscar SOLO UNA vacación para cubrir (la de mayor prioridad)
                    vacacionista_a_cubrir = None
                    posicion_a_cubrir = None
                    
                    for tipo_pos, vacacionistas in operadores_en_vacaciones.items():
                        if vacacionistas:
                            # Tomar solo el primero (mayor prioridad)
                            vacacionista_id, posicion_vacacionista = vacacionistas[0]
                            vacacionista_a_cubrir = vacacionista_id
                            posicion_a_cubrir = posicion_vacacionista
                            break
                    
                    if posicion_a_cubrir:
                        asignaciones[op_reemplazo_id] = posicion_a_cubrir
                        
                        # Marcar posición como ocupada
                        if estado_turno_reemplazo == "t.dia":
                            posiciones_ocupadas_dia.add(posicion_a_cubrir)
                            logger.debug(f"   ✅ Sarmiento cubre {posicion_a_cubrir} en TD (vacación de {vacacionista_a_cubrir})")
                        elif estado_turno_reemplazo == "t.noche":
                            posiciones_ocupadas_noche.add(posicion_a_cubrir)
                            logger.debug(f"   ✅ Sarmiento cubre {posicion_a_cubrir} en TN (vacación de {vacacionista_a_cubrir})")
            
            # 2.2: Asignar operadores regulares
            # ⚠️ CRÍTICO: Intentar usar operador de vacaciones para llenar huecos si no hay vacaciones activas
            if operador_reemplazo and not operadores_en_vacaciones:
                op_reemplazo_id, estado_reemplazo = operador_reemplazo
                
                if op_reemplazo_id not in asignaciones:
                    estado_turno_reemplazo, _ = self._calcular_estado_turno(estado_reemplazo)
                    
                    if estado_turno_reemplazo in ["t.dia", "t.noche"]:
                        # Buscar si hay huecos que llenar
                        for tipo_pos, turnos in operadores_disponibles.items():
                            posiciones_tipo = [p for p in self.posiciones if p.tipo_posicion == tipo_pos]
                            
                            if estado_turno_reemplazo == "t.dia":
                                # Verificar si hay posiciones sin asignar en turno día
                                for pos in posiciones_tipo:
                                    if pos.id_posicion not in posiciones_ocupadas_dia:
                                        # Contar cuántos operadores disponibles hay para esta posición
                                        ops_disponibles = len(turnos["dia"])
                                        if ops_disponibles < len(posiciones_tipo):
                                            # Hay un hueco, asignar Sarmiento
                                            asignaciones[op_reemplazo_id] = pos.id_posicion
                                            posiciones_ocupadas_dia.add(pos.id_posicion)
                                            logger.debug(f"   🔧 Sarmiento llena hueco en {pos.id_posicion} TD (sin vacaciones activas)")
                                            break
                            
                            elif estado_turno_reemplazo == "t.noche":
                                # Verificar si hay posiciones sin asignar en turno noche
                                for pos in posiciones_tipo:
                                    if pos.id_posicion not in posiciones_ocupadas_noche:
                                        ops_disponibles = len(turnos["noche"])
                                        if ops_disponibles < len(posiciones_tipo):
                                            asignaciones[op_reemplazo_id] = pos.id_posicion
                                            posiciones_ocupadas_noche.add(pos.id_posicion)
                                            logger.debug(f"   🔧 Sarmiento llena hueco en {pos.id_posicion} TN (sin vacaciones activas)")
                                            break
                            
                            if op_reemplazo_id in asignaciones:
                                break
            
            # Asignar operadores regulares con detección de conflictos
            operadores_sin_asignar_dia = []
            operadores_sin_asignar_noche = []
            
            for tipo_pos, turnos in operadores_disponibles.items():
                posiciones_tipo = [p for p in self.posiciones if p.tipo_posicion == tipo_pos]
                
                # TD - Primera pasada: asignar sin conflictos
                for op_id, estado in turnos["dia"]:
                    if op_id in asignaciones:
                        continue
                    
                    asignado = False
                    for pos in posiciones_tipo:
                        if pos.id_posicion not in posiciones_ocupadas_dia:
                            asignaciones[op_id] = pos.id_posicion
                            posiciones_ocupadas_dia.add(pos.id_posicion)
                            asignado = True
                            break
                    
                    if not asignado:
                        operadores_sin_asignar_dia.append((op_id, estado, tipo_pos))
                
                # TN - Primera pasada: asignar sin conflictos
                for op_id, estado in turnos["noche"]:
                    if op_id in asignaciones:
                        continue
                    
                    asignado = False
                    for pos in posiciones_tipo:
                        if pos.id_posicion not in posiciones_ocupadas_noche:
                            asignaciones[op_id] = pos.id_posicion
                            posiciones_ocupadas_noche.add(pos.id_posicion)
                            asignado = True
                            break
                    
                    if not asignado:
                        operadores_sin_asignar_noche.append((op_id, estado, tipo_pos))
            
            # 🔄 SEGUNDA PASADA: Probar TODOS los ciclos (OR lógico) para operadores sin asignar
            # ⚠️ REGLA CRÍTICA: Si ningún ciclo resuelve → DEJAR HUECO (nunca duplicidad)
            if operadores_sin_asignar_dia:
                logger.warning(f"⚠️ {len(operadores_sin_asignar_dia)} operadores TD sin asignar en {fecha_actual.strftime('%d/%m/%Y')}")
                for op_id, estado, tipo_pos in operadores_sin_asignar_dia:
                    # 🔍 OR LÓGICO: Probar CADA ciclo disponible hasta encontrar uno que funcione
                    ciclo_original = estado["ciclo_actual"]
                    ciclo_encontrado = None
                    
                    for ciclo_candidato in estado.get("ciclos_disponibles", []):
                        if ciclo_candidato == ciclo_original:
                            continue  # Ya probamos este
                        
                        # Simular cambio temporal
                        estado_temp = estado.copy()
                        if self._aplicar_ciclo_temporal(estado_temp, ciclo_candidato):
                            estado_turno_temp, _ = self._calcular_estado_turno(estado_temp)
                            
                            # Verificar si con este ciclo el operador NO trabaja (evita duplicidad)
                            if estado_turno_temp not in ["t.dia", "t.noche"]:
                                ciclo_encontrado = ciclo_candidato
                                break
                    
                    if ciclo_encontrado:
                        self._aplicar_ciclo_temporal(estado, ciclo_encontrado)
                        logger.info(f"   ✅ OR: {estado['operador'].nombre}: {ciclo_original} → {ciclo_encontrado} (evita duplicidad TD)")
                    else:
                        # ⚠️ NINGÚN CICLO RESUELVE → DEJAR HUECO (mejor que duplicidad)
                        logger.warning(f"   🔴 HUECO: {estado['operador'].nombre}: Ningún ciclo disponible evita duplicidad TD")
                        logger.warning(f"   → DECISIÓN: Dejar HUECO en vez de crear duplicidad (continuar análisis)")
                        # No hacer nada más - el operador simplemente no trabajará hoy (hueco)
            
            if operadores_sin_asignar_noche:
                logger.warning(f"⚠️ {len(operadores_sin_asignar_noche)} operadores TN sin asignar en {fecha_actual.strftime('%d/%m/%Y')}")
                for op_id, estado, tipo_pos in operadores_sin_asignar_noche:
                    # 🔍 OR LÓGICO: Probar CADA ciclo disponible
                    ciclo_original = estado["ciclo_actual"]
                    ciclo_encontrado = None
                    
                    for ciclo_candidato in estado.get("ciclos_disponibles", []):
                        if ciclo_candidato == ciclo_original:
                            continue
                        
                        estado_temp = estado.copy()
                        if self._aplicar_ciclo_temporal(estado_temp, ciclo_candidato):
                            estado_turno_temp, _ = self._calcular_estado_turno(estado_temp)
                            
                            if estado_turno_temp not in ["t.dia", "t.noche"]:
                                ciclo_encontrado = ciclo_candidato
                                break
                    
                    if ciclo_encontrado:
                        self._aplicar_ciclo_temporal(estado, ciclo_encontrado)
                        logger.info(f"   ✅ OR: {estado['operador'].nombre}: {ciclo_original} → {ciclo_encontrado} (evita duplicidad TN)")
                    else:
                        # ⚠️ NINGÚN CICLO RESUELVE → DEJAR HUECO (mejor que duplicidad)
                        logger.warning(f"   🔴 HUECO: {estado['operador'].nombre}: Ningún ciclo disponible evita duplicidad TN")
                        logger.warning(f"   → DECISIÓN: Dejar HUECO en vez de crear duplicidad (continuar análisis)")
                        # No hacer nada más - el operador simplemente no trabajará hoy (hueco)
            
            # PASO 3: Generar registros
            registros_dia = []
            for op_id, estado in self.estado_operadores.items():
                posicion_asignada = asignaciones.get(op_id)
                registro = self._generar_registro_dia(estado, fecha_actual, posicion_asignada)
                registros_dia.append(registro)
                
                # ✅ VALIDAR LÍMITE DE HORAS ANUALES
                if estado["horas_ano"] >= self.config.limite_horas_anuales and not estado.get("ultimo_ciclo"):
                    estado["ultimo_ciclo"] = True
                    logger.info(f"⚠️ {estado['operador'].nombre}: Alcanzó límite de horas anuales ({estado['horas_ano']}h). ÚLTIMO CICLO.")
            
            # ⚠️ VALIDACIÓN CRÍTICA: Detectar duplicidades antes de agregar al cronograma
            posiciones_usadas_dia = {}  # {posicion: operador_nombre}
            posiciones_usadas_noche = {}
            
            for registro in registros_dia:
                if registro["Estado"] == "t.dia":
                    posicion = registro["Posicion"]
                    if posicion in posiciones_usadas_dia:
                        logger.error(f"🚨 DUPLICIDAD DETECTADA en {registro['Fecha']}")
                        logger.error(f"   Posición: {posicion} - Turno: DÍA")
                        logger.error(f"   Operador 1: {posiciones_usadas_dia[posicion]}")
                        logger.error(f"   Operador 2: {registro['Nombre']}")
                        logger.error(f"   → REGISTRO 2 SE DESCARTA (evitando duplicidad)")
                        continue  # No agregar este registro
                    posiciones_usadas_dia[posicion] = registro["Nombre"]
                
                elif registro["Estado"] == "t.noche":
                    posicion = registro["Posicion"]
                    if posicion in posiciones_usadas_noche:
                        logger.error(f"🚨 DUPLICIDAD DETECTADA en {registro['Fecha']}")
                        logger.error(f"   Posición: {posicion} - Turno: NOCHE")
                        logger.error(f"   Operador 1: {posiciones_usadas_noche[posicion]}")
                        logger.error(f"   Operador 2: {registro['Nombre']}")
                        logger.error(f"   → REGISTRO 2 SE DESCARTA (evitando duplicidad)")
                        continue  # No agregar este registro
                    posiciones_usadas_noche[posicion] = registro["Nombre"]
                
                # Registro válido, agregar al cronograma
                self.cronograma.append(registro)
            
            # Actualizar estado de todos los operadores
            for op_id, estado in self.estado_operadores.items():
                self._actualizar_estado_operador(estado, fecha_actual)
    
    def _gestionar_bloque_vacacional(self, fecha_actual: date, dia_num: int):
        """
        Gestiona el bloque vacacional con espaciamiento y validación de ciclos
        
        REGLAS CRÍTICAS:
        1. Las vacaciones SOLO empiezan al final del período de descanso (último día del ciclo)
        2. Hay espaciamiento entre vacaciones para evitar duplicidades
        3. El operador de reemplazo debe completar su ciclo antes de la siguiente vacación
        """
        # Buscar si algún operador está listo para iniciar el bloque
        if not self.bloque_vacacional_iniciado:
            for op_id, estado in self.estado_operadores.items():
                if estado.get("necesita_vacaciones") and not estado.get("es_operador_reemplazo"):
                    estado_turno, _ = self._calcular_estado_turno(estado)
                    
                    # ✅ CRÍTICO: Verificar que está en el ÚLTIMO día de descanso
                    dias_td = estado["dias_td_ciclo"]
                    dias_tn = estado["dias_tn_ciclo"]
                    dias_descanso = estado["dias_descanso_ciclo"]
                    ultimo_dia_descanso = dias_td + dias_tn + dias_descanso  # Día 21 en ciclo 12x9
                    
                    # Solo iniciar si está en el último día de descanso
                    if estado_turno == "descansando" and estado["dia_ciclo"] == ultimo_dia_descanso:
                        # ✅ INICIAR BLOQUE VACACIONAL
                        self.bloque_vacacional_iniciado = True
                        self.fecha_inicio_bloque_vacacional = fecha_actual
                        self.dia_actual_bloque = 0
                        
                        logger.info(f"\n{'='*70}")
                        logger.info(f"🎯 BLOQUE VACACIONAL INICIADO: {fecha_actual.strftime('%d/%m/%Y')}")
                        logger.info(f"   Operador iniciador: {estado['operador'].nombre}")
                        logger.info(f"   Día del ciclo: {estado['dia_ciclo']}/{ultimo_dia_descanso} (ÚLTIMO día descanso)")
                        logger.info(f"{'='*70}\n")
                        break
        
        # Si el bloque está activo, gestionar vacaciones
        if self.bloque_vacacional_iniciado:
            # Activar/desactivar vacaciones según el slot de cada operador
            for op_id, estado in self.estado_operadores.items():
                slot_inicio = estado.get("slot_inicio_bloque")
                slot_fin = estado.get("slot_fin_bloque")
                
                if slot_inicio is None or slot_fin is None:
                    continue
                
                # Verificar si debe estar de vacaciones HOY según el slot
                debe_estar_vacaciones_segun_slot = slot_inicio <= self.dia_actual_bloque <= slot_fin
                esta_vacaciones = estado.get("en_vacaciones", False)
                
                # ✅ ACTIVAR VACACIONES (con validación de fin de ciclo)
                if debe_estar_vacaciones_segun_slot and not esta_vacaciones:
                    # ⚠️ VALIDACIÓN CRÍTICA: Solo activar si está al final del período de descanso
                    if not estado.get("es_operador_reemplazo"):
                        estado_turno, _ = self._calcular_estado_turno(estado)
                        dias_td = estado["dias_td_ciclo"]
                        dias_tn = estado["dias_tn_ciclo"]
                        dias_descanso = estado["dias_descanso_ciclo"]
                        ultimo_dia_descanso = dias_td + dias_tn + dias_descanso
                        
                        # Verificar que esté en último día de descanso
                        if estado_turno != "descansando" or estado["dia_ciclo"] != ultimo_dia_descanso:
                            logger.warning(f"⚠️ {estado['operador'].nombre}: Slot alcanzado pero NO está en fin de ciclo (día {estado['dia_ciclo']}, turno: {estado_turno})")
                            logger.warning(f"   Esperando hasta día {ultimo_dia_descanso} del ciclo...")
                            continue  # No activar aún
                    
                    # ✅ Activar vacaciones
                    estado["en_vacaciones"] = True
                    estado["dia_vacacion"] = 1
                    logger.info(f"✈️ {estado['operador'].nombre}: Inicia vacaciones (día {self.dia_actual_bloque} del bloque)")
                    logger.info(f"   Ciclo completado: {estado['dia_ciclo']}/{ultimo_dia_descanso if not estado.get('es_operador_reemplazo') else 'N/A'}")
                    
                    # Resetear op_vacaciones para que empiece a trabajar (si es operador regular)
                    if not estado.get("es_operador_reemplazo"):
                        for reemplazo_id, reemplazo_estado in self.estado_operadores.items():
                            if reemplazo_estado.get("es_operador_reemplazo"):
                                # Solo activar si no está ya cubriendo otra vacación
                                if reemplazo_estado["dia_ciclo"] == 0:
                                    reemplazo_estado["dia_ciclo"] = 1
                                    logger.info(f"   → Sarmiento inicia cobertura (ciclo día 1)")
                                break
                
                # ✅ DESACTIVAR VACACIONES
                elif not debe_estar_vacaciones_segun_slot and esta_vacaciones:
                    estado["en_vacaciones"] = False
                    estado["dia_vacacion"] = 0
                    estado["dia_ciclo"] = 1  # Reiniciar ciclo al volver
                    logger.info(f"🏠 {estado['operador'].nombre}: Termina vacaciones (vuelve a trabajar)")
                    
                    # Verificar si Sarmiento debe volver a espera (solo si no hay más vacaciones activas)
                    if not estado.get("es_operador_reemplazo"):
                        # Contar cuántos están de vacaciones actualmente
                        vacaciones_activas = sum(1 for s in self.estado_operadores.values() 
                                                if s.get("en_vacaciones") and not s.get("es_operador_reemplazo"))
                        
                        if vacaciones_activas == 0:
                            # No hay más vacaciones activas, Sarmiento vuelve a espera
                            for reemplazo_id, reemplazo_estado in self.estado_operadores.items():
                                if reemplazo_estado.get("es_operador_reemplazo"):
                                    reemplazo_estado["dia_ciclo"] = 0
                                    logger.info(f"   → Sarmiento vuelve a espera (sin vacaciones que cubrir)")
                                    break
            
            # Avanzar día del bloque
            self.dia_actual_bloque += 1
    
    def _generar_registro_dia(self, estado: Dict, fecha: date, posicion_asignada: str = None) -> Dict:
        """
        Genera el registro de un operador para un día específico
        """
        operador = estado["operador"]
        dia_ciclo = estado["dia_ciclo"]
        ciclo_actual = estado["ciclo_actual"]
        
        estado_turno, estado2 = self._calcular_estado_turno(estado)
        
        if estado_turno == "descansando":
            posicion = "descanso"
        elif estado_turno == "vacaciones":
            posicion = "vacaciones"
        else:
            posicion = posicion_asignada if posicion_asignada else operador.id_posicion_inicial
        
        horas_dia = 12 if estado_turno == "t.dia" else 0
        horas_noche = 12 if estado_turno == "t.noche" else 0
        
        ciclo_info = self.ciclos_map.get(ciclo_actual)
        horas_ciclo = self._calcular_horas_ciclo(estado, estado_turno)
        
        total_horas = estado["horas_ano"]
        porcentaje_dia = round((estado["horas_dia_acumuladas"] / total_horas * 100), 2) if total_horas > 0 else 0
        porcentaje_noche = round((estado["horas_noche_acumuladas"] / total_horas * 100), 2) if total_horas > 0 else 0
        
        registro = {
            "Fecha": fecha.strftime("%d/%m/%Y"),  # Convertir a string inmediatamente
            "ID_Operador": operador.id_operador,
            "Nombre": operador.nombre,
            "Posicion": posicion,
            "Posicion_Inicial": operador.id_posicion_inicial,
            "Estado": estado_turno,
            "Estado2": estado2,
            "Ciclo": ciclo_actual,
            "Dia_Ciclo": f"{dia_ciclo}/21",
            "Desc_Pend": estado.get("descansos_pendientes", 0),
            "Vac_Pend": estado.get("vac_pendientes", 0),
            "Horas_Ciclo": horas_ciclo,
            "Horas_Ano": total_horas,
            "Horas_Dia": estado["horas_dia_acumuladas"],
            "Porcentaje_Dia": porcentaje_dia,
            "Horas_Noche": estado["horas_noche_acumuladas"],
            "Porcentaje_Noche": porcentaje_noche,
            "Observaciones": "",
            "Merge1": f"{posicion}_{fecha.month:02d}_{fecha.day:02d}_{estado2}",
            "Merge2": f"{operador.nombre}_{fecha.month:02d}_{fecha.day:02d}",
            "Prog": operador.id_cal
        }
        
        return registro
    
    def _aplicar_ciclo_temporal(self, estado: Dict, ciclo_id: str) -> bool:
        """
        Aplica un ciclo a un estado (puede ser temporal para simulación o permanente)
        
        Args:
            estado: Estado del operador (será modificado)
            ciclo_id: ID del ciclo a aplicar
        
        Returns:
            True si se aplicó correctamente, False si el ciclo no existe
        """
        ciclo_info = self.ciclos_map.get(ciclo_id)
        
        if not ciclo_info:
            logger.error(f"❌ Ciclo {ciclo_id} no encontrado en mapa")
            return False
        
        # Aplicar el nuevo ciclo
        estado["ciclo_actual"] = ciclo_id
        estado["dias_td_ciclo"] = ciclo_info.dias_trabajo // 2
        estado["dias_tn_ciclo"] = ciclo_info.dias_trabajo - (ciclo_info.dias_trabajo // 2)
        estado["dias_descanso_ciclo"] = ciclo_info.dias_descanso
        estado["dias_trabajo_total"] = ciclo_info.dias_trabajo
        
        # NO resetear dia_ciclo aquí - mantener la posición actual en el ciclo
        # Esto permite simular qué pasaría con el ciclo actual
        
        return True
    
    def _intentar_cambiar_ciclo_operador(self, estado: Dict, razon: str = "optimización") -> bool:
        """
        Intenta cambiar el ciclo de un operador al siguiente disponible
        
        Returns:
            True si se cambió el ciclo, False si no hay más ciclos disponibles
        """
        ciclos_disponibles = estado.get("ciclos_disponibles", [])
        ciclo_actual = estado["ciclo_actual"]
        
        # Encontrar el índice del ciclo actual
        try:
            idx_actual = ciclos_disponibles.index(ciclo_actual)
        except ValueError:
            logger.warning(f"⚠️ Ciclo actual {ciclo_actual} no está en lista de disponibles")
            return False
        
        # Intentar con el siguiente ciclo
        if idx_actual + 1 < len(ciclos_disponibles):
            nuevo_ciclo = ciclos_disponibles[idx_actual + 1]
            
            if self._aplicar_ciclo_temporal(estado, nuevo_ciclo):
                logger.info(f"   🔄 {estado['operador'].nombre}: Ciclo cambiado {ciclo_actual} → {nuevo_ciclo} ({razon})")
                return True
        
        return False
    
    def _calcular_estado_turno(self, estado: Dict) -> Tuple[str, str]:
        """
        Determina el estado del turno según el día del ciclo
        """
        if estado["en_vacaciones"]:
            return "vacaciones", "VC"
        
        dia_ciclo = estado["dia_ciclo"]
        
        if dia_ciclo == 0:
            return "descansando", "DE"
        
        dias_td = estado["dias_td_ciclo"]
        dias_tn = estado["dias_tn_ciclo"]
        
        if 1 <= dia_ciclo <= dias_td:
            return "t.dia", "TD"
        elif dias_td < dia_ciclo <= (dias_td + dias_tn):
            return "t.noche", "TN"
        else:
            return "descansando", "DE"
    
    def _calcular_horas_ciclo(self, estado: Dict, estado_turno: str) -> int:
        """
        Calcula las horas acumuladas en el ciclo actual
        """
        if estado_turno in ["descansando", "vacaciones"]:
            ciclo_info = self.ciclos_map.get(estado["ciclo_actual"])
            return ciclo_info.dias_trabajo * 12 if ciclo_info else 0
        
        dia_ciclo = estado["dia_ciclo"]
        dias_trabajados = min(dia_ciclo, estado["dias_td_ciclo"] + estado["dias_tn_ciclo"])
        return dias_trabajados * 12
    
    def _actualizar_estado_operador(self, estado: Dict, fecha: date):
        """
        Actualiza el estado del operador después de procesar un día
        """
        estado_turno, _ = self._calcular_estado_turno(estado)
        
        # Actualizar horas
        if estado_turno == "t.dia":
            estado["horas_ano"] += 12
            estado["horas_dia_acumuladas"] += 12
        elif estado_turno == "t.noche":
            estado["horas_ano"] += 12
            estado["horas_noche_acumuladas"] += 12
        
        # ✅ NUNCA ROMPER CICLOS DE 21 DÍAS
        # El ciclo SIEMPRE avanza, incluso si el operador no trabajó (hueco)
        if estado["en_vacaciones"]:
            estado["dia_vacacion"] += 1
        else:
            if estado["dia_ciclo"] > 0:
                estado["dia_ciclo"] += 1
                
                if estado["dia_ciclo"] > 21:
                    estado["dia_ciclo"] = 1
    
    def _calcular_estadisticas(self) -> Dict:
        """
        Calcula estadísticas del cronograma generado
        """
        total_registros = len(self.cronograma)
        
        turnos_dia = sum(1 for r in self.cronograma if r["Estado"] == "t.dia")
        turnos_noche = sum(1 for r in self.cronograma if r["Estado"] == "t.noche")
        dias_descanso = sum(1 for r in self.cronograma if r["Estado"] == "descansando")
        dias_vacaciones = sum(1 for r in self.cronograma if r["Estado"] == "vacaciones")
        
        return {
            "total_registros": total_registros,
            "total_operadores": len(self.operadores),
            "total_posiciones": len(self.posiciones),
            "turnos_dia": turnos_dia,
            "turnos_noche": turnos_noche,
            "dias_descanso": dias_descanso,
            "dias_vacaciones": dias_vacaciones,
            "dias_analizados": total_registros // len(self.operadores) if len(self.operadores) > 0 else 0
        }
    
    def _detectar_huecos(self) -> List[Dict]:
        """
        Detecta días donde una posición no tiene cobertura
        """
        huecos = []
        return huecos
    
    def calcular_metricas(self) -> Dict:
        """
        Calcula métricas del cronograma generado (método público)
        """
        return self._calcular_estadisticas()


# ============================================================================
# FUNCIÓN DE ENTRADA PRINCIPAL (API)
# ============================================================================

def optimizar_con_heuristica(solicitud: SolicitudOptimizacionTurnos) -> Tuple[List[Dict], Dict]:
    """
    Función principal para optimizar turnos usando heurística constructiva
    
    Args:
        solicitud: Datos de configuración, operadores, posiciones y ciclos
        
    Returns:
        Tuple[cronograma, metricas]: Lista de registros del cronograma y métricas
    """
    optimizador = OptimizadorHeuristico(solicitud)
    resultado = optimizador.optimizar()
    
    cronograma = resultado["cronograma"]
    metricas = resultado["estadisticas"]
    
    logger.info(f"Optimización completada: {len(cronograma)} registros generados")
    logger.info(f"Métricas: {metricas}")
    
    return cronograma, metricas
