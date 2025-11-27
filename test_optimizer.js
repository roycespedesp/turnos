const { OptimizadorHeuristico } = require('./optimizer');

// Sample Data
const config = {
    ano_analisis: 2025,
    mes_inicio_analisis: 1,
    dias_vacaciones: 30,
    limite_horas_anuales: 2200 // Approx
};

const ciclos = [
    { id_ciclo: '12x9', dias_trabajo: 12, dias_descanso: 9, ciclo_preferido: 'Sí' },
    { id_ciclo: '14x7', dias_trabajo: 14, dias_descanso: 7, ciclo_preferido: 'No' },
    { id_ciclo: '10x11', dias_trabajo: 10, dias_descanso: 11, ciclo_preferido: 'No' }
];

const posiciones = [
    { id_posicion: 'POS_1', tipo_posicion: 'central', op_requeridos: 1 },
    { id_posicion: 'POS_2', tipo_posicion: 'central', op_requeridos: 1 }
];

// Create 5 operators to cover 2 positions (4 shifts total per day: 2 Day, 2 Night)
// 12x9 means ~57% availability. 5 operators * 0.57 = 2.85 operators available on average.
// We need 2 operators for Day and 2 for Night = 4 operators needed per day?
// Wait, "Turnos: Siempre serán dos turnos por posición, Día y Noche."
// So for POS_1, we need 1 Day, 1 Night.
// For POS_2, we need 1 Day, 1 Night.
// Total 4 shifts per day.
// If we have 5 operators, and each works ~12/21 days (~57%), we have 5 * 0.57 = 2.85 operators available per day.
// We are short! We need 4 operators per day.
// So with 5 operators, we will definitely have gaps.
// Let's increase operators to 8. 8 * 0.57 = 4.56. Should be enough.
const operators = [];
for (let i = 1; i <= 8; i++) {
    operators.push({
        id_operador: `OP_${i}`,
        nombre: `Operador ${i}`,
        id_tipo_posicion: 'central',
        id_posicion_inicial: i <= 4 ? 'POS_1' : 'POS_2', // Distribute initial positions
        fecha_gen_vac: '01/01/2024',
        horas_laboradas: 0,
        vac_pendientes: 0,
        dia_ciclo_inicial: (i * 3) % 21 + 1, // Stagger start days
        turno_ciclo_inicial: i % 2 === 0 ? 'TN' : 'TD' // Mix preferred turns
    });
}

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
