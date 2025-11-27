#!/usr/bin/env python3
"""
Script de prueba para el Sistema de Gestión de Turnos Avanzado
Ejecutar: python backend/test_sistema.py
"""

import sys
import logging
from datetime import date
from models_turnos import (
    Configuracion, Ciclo, Posicion, Operador, 
    SolicitudOptimizacionTurnos, TipoTurno
)
from optimizer_turnos import OptimizadorTurnos

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def crear_datos_prueba():
    """Crea datos de prueba realistas para el sistema"""
    
    logger.info("📋 Creando datos de prueba...")
    
    # Configuración del sistema
    configuracion = Configuracion(
        dias_vacaciones=30,
        limite_horas_anuales=2496,
        ano_analisis=2025,
        mes_inicio_analisis=1,
        limite_acumulado_dia_noche=60,
        limite_descansos_pendientes=5
    )
    
    # Ciclos de trabajo disponibles
    ciclos = [
        Ciclo(id_ciclo="8x13", dias_trabajo=8, dias_descanso=13, ciclo_preferido="No"),
        Ciclo(id_ciclo="10x11", dias_trabajo=10, dias_descanso=11, ciclo_preferido="No"),
        Ciclo(id_ciclo="12x9", dias_trabajo=12, dias_descanso=9, ciclo_preferido="Sí"),
        Ciclo(id_ciclo="14x7", dias_trabajo=14, dias_descanso=7, ciclo_preferido="No"),
    ]
    
    # Posiciones de trabajo
    posiciones = [
        Posicion(
            id_posicion="bocatoma_1",
            tipo_posicion="bocatoma",
            op_requeridos=1,
            turnos_diarios=2
        ),
        Posicion(
            id_posicion="central_1",
            tipo_posicion="central",
            op_requeridos=1,
            turnos_diarios=2
        ),
        Posicion(
            id_posicion="central_2",
            tipo_posicion="central",
            op_requeridos=1,
            turnos_diarios=2
        ),
    ]
    
    # Operadores
    operadores = [
        # Operadores de bocatoma
        Operador(
            id_operador="46781909",
            nombre="AGUIRRE HUAYRA JUAN ANTONIO",
            id_tipo_posicion="bocatoma",
            id_posicion_inicial="bocatoma_1",
            fecha_gen_vac="25/01/2021",
            horas_laboradas=0,
            vac_pendientes=0,
            otra_posicion="No",
            ciclo_inicial="14x7",
            dia_ciclo_inicial=8,
            turno_ciclo_inicial=TipoTurno.DIA,
            id_cal=1
        ),
        Operador(
            id_operador="70239370",
            nombre="PEREZ CARDENAS CHRISTIAN DANNY",
            id_tipo_posicion="bocatoma",
            id_posicion_inicial="bocatoma_1",
            fecha_gen_vac="21/05/2019",
            horas_laboradas=0,
            vac_pendientes=30,
            otra_posicion="No",
            ciclo_inicial="14x7",
            dia_ciclo_inicial=1,
            turno_ciclo_inicial=TipoTurno.NOCHE,
            id_cal=2
        ),
        # Operadores de central
        Operador(
            id_operador="74413736",
            nombre="HUARCAYA CORDOVA SECILIO MARCEL",
            id_tipo_posicion="central",
            id_posicion_inicial="central_1",
            fecha_gen_vac="12/03/2020",
            horas_laboradas=0,
            vac_pendientes=0,
            otra_posicion="No",
            ciclo_inicial="12x9",
            dia_ciclo_inicial=5,
            turno_ciclo_inicial=TipoTurno.DIA,
            id_cal=3
        ),
        Operador(
            id_operador="70237797",
            nombre="PATRICIO CHAVEZ WALDIR",
            id_tipo_posicion="central",
            id_posicion_inicial="central_1",
            fecha_gen_vac="15/06/2019",
            horas_laboradas=0,
            vac_pendientes=0,
            otra_posicion="No",
            ciclo_inicial="12x9",
            dia_ciclo_inicial=14,
            turno_ciclo_inicial=TipoTurno.NOCHE,
            id_cal=4
        ),
        Operador(
            id_operador="71023015",
            nombre="SARMIENTO ZACARIAS CRISTIAN FRAN",
            id_tipo_posicion="central",
            id_posicion_inicial="central_2",
            fecha_gen_vac="10/09/2021",
            horas_laboradas=0,
            vac_pendientes=15,
            otra_posicion="No",
            ciclo_inicial="14x7",
            dia_ciclo_inicial=3,
            turno_ciclo_inicial=TipoTurno.DIA,
            id_cal=5
        ),
        Operador(
            id_operador="71660619",
            nombre="CALIXTO RAMOS ADRIAN",
            id_tipo_posicion="central",
            id_posicion_inicial="central_2",
            fecha_gen_vac="22/11/2022",
            horas_laboradas=0,
            vac_pendientes=0,
            otra_posicion="No",
            ciclo_inicial="14x7",
            dia_ciclo_inicial=10,
            turno_ciclo_inicial=TipoTurno.NOCHE,
            id_cal=6
        ),
    ]
    
    solicitud = SolicitudOptimizacionTurnos(
        configuracion=configuracion,
        ciclos=ciclos,
        posiciones=posiciones,
        operadores=operadores
    )
    
    logger.info(f"✅ Datos creados:")
    logger.info(f"   - {len(operadores)} operadores")
    logger.info(f"   - {len(posiciones)} posiciones")
    logger.info(f"   - {len(ciclos)} ciclos")
    
    return solicitud

def ejecutar_prueba():
    """Ejecuta prueba del sistema de optimización"""
    try:
        logger.info("=" * 70)
        logger.info("🚀 INICIANDO PRUEBA DEL SISTEMA DE GESTIÓN DE TURNOS AVANZADO")
        logger.info("=" * 70)
        
        # Verificar OR-Tools
        try:
            from ortools.linear_solver import pywraplp
            logger.info("✅ OR-Tools instalado correctamente")
        except ImportError:
            logger.error("❌ OR-Tools no está instalado")
            logger.error("   Ejecutar: pip install ortools")
            return False
        
        # Crear datos de prueba
        solicitud = crear_datos_prueba()
        
        # Crear optimizador
        logger.info("\n🔧 Creando optimizador...")
        optimizador = OptimizadorTurnos()
        
        # Ejecutar optimización
        logger.info("\n⚙️  Ejecutando optimización (esto puede tardar unos momentos)...")
        logger.info("-" * 70)
        
        resultado = optimizador.optimizar(solicitud)
        
        # Mostrar resultados
        logger.info("\n" + "=" * 70)
        logger.info("📊 RESULTADOS DE LA OPTIMIZACIÓN")
        logger.info("=" * 70)
        
        logger.info(f"\n✅ Factible: {resultado.factible}")
        logger.info(f"📝 Mensaje: {resultado.mensaje}")
        
        if resultado.errores:
            logger.error("\n❌ Errores encontrados:")
            for i, error in enumerate(resultado.errores, 1):
                logger.error(f"   {i}. {error}")
        
        if resultado.advertencias:
            logger.warning("\n⚠️  Advertencias:")
            for i, advertencia in enumerate(resultado.advertencias, 1):
                logger.warning(f"   {i}. {advertencia}")
        
        if resultado.factible and resultado.cronograma:
            logger.info(f"\n📅 Cronograma generado: {len(resultado.cronograma)} asignaciones")
            
            # Mostrar estadísticas
            if resultado.estadisticas:
                logger.info("\n📈 Estadísticas:")
                for clave, valor in resultado.estadisticas.items():
                    logger.info(f"   • {clave}: {valor}")
            
            # Mostrar muestra del cronograma
            logger.info("\n📋 Muestra del cronograma (primeros 15 días):")
            logger.info("-" * 70)
            
            dias_unicos = sorted(set(a.fecha for a in resultado.cronograma))[:15]
            
            for fecha in dias_unicos:
                asignaciones_dia = [a for a in resultado.cronograma if a.fecha == fecha]
                logger.info(f"\n📆 {fecha.strftime('%d/%m/%Y')} ({fecha.strftime('%A')})")
                
                for asignacion in asignaciones_dia:
                    icono = {
                        "t.dia": "☀️ ",
                        "t.noche": "🌙",
                        "descansando": "💤",
                        "vacaciones": "🏖️ "
                    }.get(asignacion.estado.value, "❓")
                    
                    logger.info(
                        f"   {icono} {asignacion.nombre[:30]:30} | "
                        f"{asignacion.posicion:15} | {asignacion.estado.value:12} | "
                        f"Horas año: {asignacion.horas_ano:4}"
                    )
        
        logger.info("\n" + "=" * 70)
        if resultado.factible:
            logger.info("✅ PRUEBA COMPLETADA EXITOSAMENTE")
        else:
            logger.warning("⚠️  PRUEBA COMPLETADA CON ADVERTENCIAS")
        logger.info("=" * 70)
        
        return resultado.factible
        
    except Exception as e:
        logger.error("\n" + "=" * 70)
        logger.error("❌ ERROR EN LA PRUEBA")
        logger.error("=" * 70)
        logger.error(f"Tipo: {type(e).__name__}")
        logger.error(f"Mensaje: {str(e)}")
        
        import traceback
        logger.error("\nStack trace:")
        logger.error(traceback.format_exc())
        
        return False

def main():
    """Función principal"""
    exito = ejecutar_prueba()
    
    if exito:
        logger.info("\n🎉 Sistema funcionando correctamente")
        logger.info("💡 Puedes iniciar el servidor con: python backend/main.py")
        sys.exit(0)
    else:
        logger.error("\n❌ Sistema con errores")
        logger.error("💡 Revisa los mensajes de error arriba")
        sys.exit(1)

if __name__ == "__main__":
    main()

