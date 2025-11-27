from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime, date
from enum import Enum

class TipoTurno(str, Enum):
    DIA = "DIA"
    NOCHE = "NOCHE"
    DESCANSO = "DESCANSO"

class EstadoOperador(str, Enum):
    TURNO_DIA = "t.dia"
    TURNO_NOCHE = "t.noche"
    DESCANSANDO = "descansando"
    VACACIONES = "vacaciones"

class EstadoOperadorCorto(str, Enum):
    TD = "TD"
    TN = "TN"
    DE = "DE"
    VC = "VC"

class Configuracion(BaseModel):
    dias_vacaciones: int = Field(default=30, description="Días de vacaciones ganadas por año laborado")
    limite_horas_anuales: int = Field(default=2496, description="Límite máximo de horas anuales por operador")
    ano_analisis: int = Field(default=2025, description="Año que se analizará")
    mes_inicio_analisis: int = Field(default=1, ge=1, le=12, description="Mes de inicio del análisis")
    limite_acumulado_dia_noche: int = Field(default=60, ge=50, le=80, description="Límite porcentual máximo de turnos día o noche (%)")
    limite_descansos_pendientes: int = Field(default=5, ge=1, le=15, description="Límite máximo de descansos pendientes")

class Ciclo(BaseModel):
    id_ciclo: str = Field(..., description="Identificador del ciclo (formato: XxY)")
    dias_trabajo: int = Field(..., ge=1, le=20, description="Cantidad de días de trabajo")
    dias_descanso: int = Field(..., ge=1, le=20, description="Cantidad de días de descanso")
    ciclo_preferido: str = Field(default="No", description="Indica si es el ciclo preferido")
    
    def model_post_init(self, __context: Any) -> None:
        # Validar que la suma sea exactamente 21
        if self.dias_trabajo + self.dias_descanso != 21:
            raise ValueError("La suma de días de trabajo y descanso debe ser exactamente 21")

class Posicion(BaseModel):
    id_posicion: str = Field(..., description="Identificador único de la posición")
    tipo_posicion: str = Field(..., description="Tipo que engloba las posiciones")
    op_requeridos: int = Field(..., ge=1, description="Operadores requeridos por posición")
    turnos_diarios: int = Field(default=2, description="Cantidad de turnos por día (siempre 2)")

class Operador(BaseModel):
    id_operador: str = Field(..., description="Identificador único (DNI)")
    nombre: str = Field(..., description="Nombre del operador")
    id_tipo_posicion: str = Field(..., description="Tipo de posición asignada")
    id_posicion_inicial: str = Field(..., description="Posición de trabajo inicial")
    fecha_gen_vac: Optional[str] = Field(None, description="Fecha de generación de nuevas vacaciones")
    horas_laboradas: int = Field(default=0, ge=0, description="Horas trabajadas previas")
    vac_pendientes: int = Field(default=0, ge=0, description="Vacaciones pendientes por recuperar")
    otra_posicion: str = Field(default="No", description="Puede trabajar en otros tipos de posición")
    ciclo_inicial: str = Field(..., description="Ciclo con el que inicia el análisis")
    dia_ciclo_inicial: Optional[int] = Field(None, ge=1, le=21, description="Día del ciclo inicial (no aplica para operadores de vacaciones)")
    turno_ciclo_inicial: TipoTurno = Field(..., description="Turno inicial (día o noche)")
    id_cal: Optional[int] = Field(None, description="Indicador para el calendario")

class AsignacionDiaria(BaseModel):
    fecha: date = Field(..., description="Fecha del día")
    id_operador: str = Field(..., description="Identificador del operador")
    nombre: str = Field(..., description="Nombre completo del operador")
    posicion: str = Field(..., description="Posición ocupada ese día")
    estado: EstadoOperador = Field(..., description="Estado del operador")
    estado2: EstadoOperadorCorto = Field(..., description="Estado abreviado")
    ciclo: str = Field(..., description="Tipo de ciclo actual")
    dia_ciclo: str = Field(..., description="Día del ciclo (ej: 6/21)")
    desc_pend: int = Field(..., description="Descansos pendientes acumulados")
    vac_pend: int = Field(..., description="Vacaciones pendientes")
    horas_ciclo: int = Field(..., description="Horas acumuladas en el ciclo actual")
    horas_ano: int = Field(..., description="Horas acumuladas en el año")
    horas_dia: int = Field(..., description="Horas acumuladas en turno día")
    porcentaje_dia: float = Field(..., description="Porcentaje de horas en turno día")
    horas_noche: int = Field(..., description="Horas acumuladas en turno noche")
    porcentaje_noche: float = Field(..., description="Porcentaje de horas en turno noche")
    observaciones: str = Field(default="", description="Duplicidades, advertencias, etc.")
    merge1: str = Field(..., description="Posición+Mes+Día+Estado2")
    merge2: str = Field(..., description="Nombre+Mes+Día")
    prog: Optional[int] = Field(None, description="ID_cal del operador")

class SolicitudOptimizacionTurnos(BaseModel):
    configuracion: Configuracion
    ciclos: List[Ciclo]
    posiciones: List[Posicion]
    operadores: List[Operador]

class ResultadoOptimizacionTurnos(BaseModel):
    cronograma: List[AsignacionDiaria]
    estadisticas: Dict[str, Any]
    advertencias: List[str]
    errores: List[str]
    factible: bool
    mensaje: str
    archivo_excel: Optional[str] = Field(None, description="Ruta del archivo Excel generado")

class EstadisticasOptimizacion(BaseModel):
    total_operadores: int
    total_posiciones: int
    total_dias_analizados: int
    huecos_detectados: int
    duplicidades_detectadas: int
    operadores_limite_horas: int
    operadores_limite_dia_noche: int
    cobertura_promedio: float