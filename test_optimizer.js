const { OptimizadorHeuristico } = require('./optimizer');

// Sample Data - Updated for 2026 with real operators
const config = {
    ano_analisis: 2026,
    mes_inicio_analisis: 1,
    dias_vacaciones: 30,
    limite_horas_anuales: 2208
};

const ciclos = [
    { id_ciclo: '12x9', dias_trabajo: 12, dias_descanso: 9, ciclo_preferido: 'Sí' },
    { id_ciclo: '14x7', dias_trabajo: 14, dias_descanso: 7, ciclo_preferido: 'No' },
    { id_ciclo: '10x11', dias_trabajo: 10, dias_descanso: 11, ciclo_preferido: 'No' }
];

const posiciones = [
    { id_posicion: 'central_1', tipo_posicion: 'central', op_requeridos: 1 },
    { id_posicion: 'central_2', tipo_posicion: 'central', op_requeridos: 1 }
];

// Datos reales de operadores
const operators = [
    {
        id_operador: '46781909',
        nombre: 'AGUIRRE HUAYRA JUAN ANTONIO',
        id_tipo_posicion: 'central',
        id_posicion_inicial: 'central_1',
        fecha_gen_vac: '25/01/2021',
        horas_laboradas: 0,
        vac_pendientes: 0,
        otra_posicion: 'no',
        ciclo_inicial: '12x9',
        dia_ciclo_inicial: 19,
        turno_ciclo_inicial: 'DESCANSO'
    },
    {
        id_operador: '71023970',
        nombre: 'PEREZ CARDENAS CHRISTIAN DANNY',
        id_tipo_posicion: 'central',
        id_posicion_inicial: 'central_1',
        fecha_gen_vac: '21/05/2019',
        horas_laboradas: 0,
        vac_pendientes: 30,
        otra_posicion: 'no',
        ciclo_inicial: '12x9',
        dia_ciclo_inicial: 12,
        turno_ciclo_inicial: 'NOCHE'
    },
    {
        id_operador: '70237797',
        nombre: 'PATRICIO CHAVEZ WALDIR',
        id_tipo_posicion: 'central',
        id_posicion_inicial: 'central_1',
        fecha_gen_vac: '21/05/2019',
        horas_laboradas: 0,
        vac_pendientes: 0,
        otra_posicion: 'no',
        ciclo_inicial: '12x9',
        dia_ciclo_inicial: 5,
        turno_ciclo_inicial: 'DIA'
    },
    {
        id_operador: '71660619',
        nombre: 'CALIXTO RAMOS ADRIAN',
        id_tipo_posicion: 'central',
        id_posicion_inicial: 'central_2',
        fecha_gen_vac: '18/12/2024',
        horas_laboradas: 0,
        vac_pendientes: 0,
        otra_posicion: 'no',
        ciclo_inicial: '12x9',
        dia_ciclo_inicial: 19,
        turno_ciclo_inicial: 'DESCANSO'
    },
    {
        id_operador: '46539662',
        nombre: 'TENORIO TENORIO ROSSMELL JAVIER',
        id_tipo_posicion: 'central',
        id_posicion_inicial: 'central_2',
        fecha_gen_vac: '22/02/2024',
        horas_laboradas: 0,
        vac_pendientes: 0,
        otra_posicion: 'no',
        ciclo_inicial: '12x9',
        dia_ciclo_inicial: 5,
        turno_ciclo_inicial: 'NOCHE'
    },
    {
        id_operador: '70431736',
        nombre: 'HUARCAYA CORDOVA SECILIO MARCELINO',
        id_tipo_posicion: 'central',
        id_posicion_inicial: 'central_2',
        fecha_gen_vac: '3/07/2024',
        horas_laboradas: 0,
        vac_pendientes: 0,
        otra_posicion: 'no',
        ciclo_inicial: '12x9',
        dia_ciclo_inicial: 12,
        turno_ciclo_inicial: 'DIA'
    },
    {
        id_operador: '70320115',
        nombre: 'SARMIENTO ZACARIAS CRISTIAN FRANK',
        id_tipo_posicion: 'central',
        id_posicion_inicial: 'op_vacaciones',
        fecha_gen_vac: '13/03/2024',
        horas_laboradas: 0,
        vac_pendientes: 0,
        otra_posicion: 'no',
        ciclo_inicial: '12x9',
        dia_ciclo_inicial: 0,
        turno_ciclo_inicial: 'DIA'
    }
];

const solicitud = {
    configuracion: config,
    ciclos: ciclos,
    posiciones: posiciones,
    operadores: operators
};

console.log('Running Optimizer Test...');
const optimizador = new OptimizadorHeuristico(solicitud);
const resultado = optimizador.optimizar();

console.log('Huecos:', resultado.huecos.length);
if (resultado.huecos.length > 0) {
    console.log('First 5 huecos:', resultado.huecos.slice(0, 5));
}
