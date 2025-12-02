/**
 * Aplicación Standalone - Manejo de UI y datos
 */

// Datos globales
let cronogramaOptimizado = [];
let estadisticas = {};
let ciclos = [];
let posiciones = [];
let operadores = [];

// Inicializar datos vacíos (se llenan desde la interfaz)
function inicializarDatos() {
    // Cargar desde localStorage si existe
    const datosGuardados = localStorage.getItem('datosTurnos');
    if (datosGuardados) {
        try {
            const datos = JSON.parse(datosGuardados);
            ciclos = datos.ciclos || [];
            posiciones = datos.posiciones || [];
            operadores = datos.operadores || [];
            console.log('✅ Datos cargados desde localStorage:');
            console.log(`   - Ciclos: ${ciclos.length}`);
            console.log(`   - Posiciones: ${posiciones.length}`);
            console.log(`   - Operadores: ${operadores.length}`);
        } catch (e) {
            console.error('Error cargando datos guardados:', e);
        }
    }

    // Si no hay datos, inicializar con datos por defecto de central
    if (ciclos.length === 0 && posiciones.length === 0 && operadores.length === 0) {
        console.log('📋 Inicializando datos por defecto de central...');
        inicializarDatosCentral();
    } else {
        // Si hay algunos datos pero faltan elementos, completar
        if (ciclos.length === 0) {
            ciclos = [
                { id_ciclo: "12x9", dias_trabajo: 12, dias_descanso: 9, ciclo_preferido: "Sí" },
                { id_ciclo: "14x7", dias_trabajo: 14, dias_descanso: 7, ciclo_preferido: "No" }
            ];
        }
        if (posiciones.length === 0) {
            posiciones = [
                { id_posicion: "central_1", tipo_posicion: "central", op_requeridos: 1, turnos_diarios: 2 },
                { id_posicion: "central_2", tipo_posicion: "central", op_requeridos: 1, turnos_diarios: 2 },
                { id_posicion: "op_vacaciones", tipo_posicion: "central", op_requeridos: 1, turnos_diarios: 2 }
            ];
        }

        // Si hay menos de 7 operadores, completar con los faltantes
        const operadoresCentral = [
            { id_operador: "46781909", nombre: "AGUIRRE HUAYRA JUAN ANTONIO", id_tipo_posicion: "central", id_posicion_inicial: "central_1", ciclo_inicial: "14x7", dia_ciclo_inicial: 19, turno_ciclo_inicial: "DESCANSO", fecha_gen_vac: "25/01/2021", vac_pendientes: 0, horas_laboradas: 0, otra_posicion: "No", id_cal: null },
            { id_operador: "71023970", nombre: "PEREZ CARDENAS CHRISTIAN DANNY", id_tipo_posicion: "central", id_posicion_inicial: "central_1", ciclo_inicial: "14x7", dia_ciclo_inicial: 12, turno_ciclo_inicial: "NOCHE", fecha_gen_vac: "21/05/2019", vac_pendientes: 30, horas_laboradas: 0, otra_posicion: "No", id_cal: null },
            { id_operador: "70237797", nombre: "PATRICIO CHAVEZ WALDIR", id_tipo_posicion: "central", id_posicion_inicial: "central_1", ciclo_inicial: "14x7", dia_ciclo_inicial: 5, turno_ciclo_inicial: "DIA", fecha_gen_vac: "21/05/2019", vac_pendientes: 0, horas_laboradas: 0, otra_posicion: "No", id_cal: null },
            { id_operador: "71660619", nombre: "CALIXTO RAMOS ADRIAN", id_tipo_posicion: "central", id_posicion_inicial: "central_2", ciclo_inicial: "14x7", dia_ciclo_inicial: 19, turno_ciclo_inicial: "DESCANSO", fecha_gen_vac: "18/12/2024", vac_pendientes: 0, horas_laboradas: 0, otra_posicion: "No", id_cal: null },
            { id_operador: "46539662", nombre: "TENORIO TENORIO ROSSMELL JAVIER", id_tipo_posicion: "central", id_posicion_inicial: "central_2", ciclo_inicial: "14x7", dia_ciclo_inicial: 5, turno_ciclo_inicial: "NOCHE", fecha_gen_vac: "22/02/2024", vac_pendientes: 0, horas_laboradas: 0, otra_posicion: "No", id_cal: null },
            { id_operador: "70431736", nombre: "HUARCAYA CORDOVA SECILIO MARCELINO", id_tipo_posicion: "central", id_posicion_inicial: "central_2", ciclo_inicial: "14x7", dia_ciclo_inicial: 12, turno_ciclo_inicial: "DIA", fecha_gen_vac: "3/07/2024", vac_pendientes: 0, horas_laboradas: 0, otra_posicion: "No", id_cal: null },
            { id_operador: "70320115", nombre: "SARMIENTO ZACARIAS CRISTIAN FRANK", id_tipo_posicion: "central", id_posicion_inicial: "op_vacaciones", ciclo_inicial: "12x9", dia_ciclo_inicial: 1, turno_ciclo_inicial: "DIA", fecha_gen_vac: "13/03/2024", vac_pendientes: 0, horas_laboradas: 0, otra_posicion: "No", id_cal: null }
        ];

        // Agregar operadores faltantes (sin duplicar)
        let operadoresAgregados = 0;
        for (const opCentral of operadoresCentral) {
            const existe = operadores.find(o => o.id_operador === opCentral.id_operador);
            if (!existe) {
                operadores.push(opCentral);
                operadoresAgregados++;
            }
        }

        if (operadoresAgregados > 0) {
            console.log(`✅ Se agregaron ${operadoresAgregados} operadores faltantes de central`);
            guardarDatos();
        }

        guardarDatos();
    }

    actualizarVistaListas();
}

// Inicializar datos por defecto de central
function inicializarDatosCentral() {
    // 1. Inicializar ciclos
    ciclos = [
        { id_ciclo: "12x9", dias_trabajo: 12, dias_descanso: 9, ciclo_preferido: "Sí" },
        { id_ciclo: "14x7", dias_trabajo: 14, dias_descanso: 7, ciclo_preferido: "No" }
    ];

    // 2. Inicializar posiciones
    posiciones = [
        { id_posicion: "central_1", tipo_posicion: "central", op_requeridos: 1, turnos_diarios: 2 },
        { id_posicion: "central_2", tipo_posicion: "central", op_requeridos: 1, turnos_diarios: 2 },
        { id_posicion: "op_vacaciones", tipo_posicion: "central", op_requeridos: 1, turnos_diarios: 2 }
    ];

    // 3. Inicializar operadores
    operadores = [
        {
            id_operador: "46781909",
            nombre: "AGUIRRE HUAYRA JUAN ANTONIO",
            id_tipo_posicion: "central",
            id_posicion_inicial: "central_1",
            ciclo_inicial: "14x7",
            dia_ciclo_inicial: 19,
            turno_ciclo_inicial: "DESCANSO",
            fecha_gen_vac: "25/01/2021",
            vac_pendientes: 0,
            horas_laboradas: 0,
            otra_posicion: "No",
            id_cal: null
        },
        {
            id_operador: "71023970",
            nombre: "PEREZ CARDENAS CHRISTIAN DANNY",
            id_tipo_posicion: "central",
            id_posicion_inicial: "central_1",
            ciclo_inicial: "14x7",
            dia_ciclo_inicial: 12,
            turno_ciclo_inicial: "NOCHE",
            fecha_gen_vac: "21/05/2019",
            vac_pendientes: 30,
            horas_laboradas: 0,
            otra_posicion: "No",
            id_cal: null
        },
        {
            id_operador: "70237797",
            nombre: "PATRICIO CHAVEZ WALDIR",
            id_tipo_posicion: "central",
            id_posicion_inicial: "central_1",
            ciclo_inicial: "14x7",
            dia_ciclo_inicial: 5,
            turno_ciclo_inicial: "DIA",
            fecha_gen_vac: "21/05/2019",
            vac_pendientes: 0,
            horas_laboradas: 0,
            otra_posicion: "No",
            id_cal: null
        },
        {
            id_operador: "71660619",
            nombre: "CALIXTO RAMOS ADRIAN",
            id_tipo_posicion: "central",
            id_posicion_inicial: "central_2",
            ciclo_inicial: "14x7",
            dia_ciclo_inicial: 19,
            turno_ciclo_inicial: "DESCANSO",
            fecha_gen_vac: "18/12/2024",
            vac_pendientes: 0,
            horas_laboradas: 0,
            otra_posicion: "No",
            id_cal: null
        },
        {
            id_operador: "46539662",
            nombre: "TENORIO TENORIO ROSSMELL JAVIER",
            id_tipo_posicion: "central",
            id_posicion_inicial: "central_2",
            ciclo_inicial: "14x7",
            dia_ciclo_inicial: 5,
            turno_ciclo_inicial: "NOCHE",
            fecha_gen_vac: "22/02/2024",
            vac_pendientes: 0,
            horas_laboradas: 0,
            otra_posicion: "No",
            id_cal: null
        },
        {
            id_operador: "70431736",
            nombre: "HUARCAYA CORDOVA SECILIO MARCELINO",
            id_tipo_posicion: "central",
            id_posicion_inicial: "central_2",
            ciclo_inicial: "14x7",
            dia_ciclo_inicial: 12,
            turno_ciclo_inicial: "DIA",
            fecha_gen_vac: "3/07/2024",
            vac_pendientes: 0,
            horas_laboradas: 0,
            otra_posicion: "No",
            id_cal: null
        },
        {
            id_operador: "70320115",
            nombre: "SARMIENTO ZACARIAS CRISTIAN FRANK",
            id_tipo_posicion: "central",
            id_posicion_inicial: "op_vacaciones",
            ciclo_inicial: "12x9",
            dia_ciclo_inicial: 1,
            turno_ciclo_inicial: "DIA",
            fecha_gen_vac: "13/03/2024",
            vac_pendientes: 0,
            horas_laboradas: 0,
            otra_posicion: "No",
            id_cal: null
        }
    ];

    guardarDatos();
    console.log('✅ Datos de central inicializados:');
    console.log(`   - ${ciclos.length} ciclos (12x9, 14x7)`);
    console.log(`   - ${posiciones.length} posiciones (central_1, central_2, op_vacaciones)`);
    console.log(`   - ${operadores.length} operadores (6 regulares + 1 operador de vacaciones)`);
    console.log('📝 Nota: Todos los 6 trabajadores regulares deben programar su mes de vacaciones completo.');
    console.log('🔄 El operador de vacaciones (op_vacaciones) será el pivote que reemplazará a los que salen de vacaciones.');
}

// Guardar datos en localStorage
function guardarDatos() {
    try {
        localStorage.setItem('datosTurnos', JSON.stringify({
            ciclos: ciclos,
            posiciones: posiciones,
            operadores: operadores
        }));
        console.log('💾 Datos guardados en localStorage');
        console.log(`   - Ciclos: ${ciclos.length}`);
        console.log(`   - Posiciones: ${posiciones.length}`);
        console.log(`   - Operadores: ${operadores.length}`);
    } catch (e) {
        console.error('Error guardando datos:', e);
        alert('Error al guardar datos. Algunos navegadores bloquean localStorage en modo privado.');
    }
}

// Mostrar/ocultar pestañas
function mostrarTab(tab) {
    // Ocultar todos los contenidos
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-button').forEach(el => el.classList.remove('active'));

    // Mostrar el contenido seleccionado
    document.getElementById(`content-${tab}`).classList.remove('hidden');
    document.getElementById(`tab-${tab}`).classList.add('active');
}

// Agregar ciclo
function agregarCiclo() {
    const id = document.getElementById('cicloId').value.trim();
    const diasTrabajo = parseInt(document.getElementById('cicloDiasTrabajo').value);
    const diasDescanso = parseInt(document.getElementById('cicloDiasDescanso').value);
    const preferido = document.getElementById('cicloPreferido').checked;

    if (!id || !diasTrabajo || !diasDescanso) {
        alert('Por favor completa todos los campos');
        return;
    }

    if (diasTrabajo + diasDescanso !== 21) {
        alert('La suma de días trabajo + días descanso debe ser 21');
        return;
    }

    // Quitar preferido de otros ciclos si este es preferido
    if (preferido) {
        ciclos.forEach(c => c.ciclo_preferido = "No");
    }

    ciclos.push({
        id_ciclo: id,
        dias_trabajo: diasTrabajo,
        dias_descanso: diasDescanso,
        ciclo_preferido: preferido ? "Sí" : "No"
    });

    // Limpiar formulario
    document.getElementById('cicloId').value = '';
    document.getElementById('cicloDiasTrabajo').value = '';
    document.getElementById('cicloDiasDescanso').value = '';
    document.getElementById('cicloPreferido').checked = false;

    guardarDatos();
    actualizarVistaListas();
}

// Agregar posición
function agregarPosicion() {
    const id = document.getElementById('posicionId').value.trim();
    const tipo = document.getElementById('posicionTipo').value.trim();
    const opRequeridos = parseInt(document.getElementById('posicionOpRequeridos').value);

    if (!id || !tipo || !opRequeridos) {
        alert('Por favor completa todos los campos');
        return;
    }

    posiciones.push({
        id_posicion: id,
        tipo_posicion: tipo,
        op_requeridos: opRequeridos,
        turnos_diarios: 2
    });

    // Limpiar formulario
    document.getElementById('posicionId').value = '';
    document.getElementById('posicionTipo').value = '';
    document.getElementById('posicionOpRequeridos').value = '1';

    guardarDatos();
    actualizarVistaListas();
}

// Agregar operador
function agregarOperador() {
    const op = {
        id_operador: document.getElementById('opId').value.trim(),
        nombre: document.getElementById('opNombre').value.trim(),
        id_tipo_posicion: document.getElementById('opTipoPosicion').value.trim(),
        id_posicion_inicial: document.getElementById('opPosicionInicial').value.trim(),
        ciclo_inicial: document.getElementById('opCicloInicial').value.trim(),
        dia_ciclo_inicial: parseInt(document.getElementById('opDiaCicloInicial').value),
        turno_ciclo_inicial: document.getElementById('opTurnoCicloInicial').value,
        fecha_gen_vac: document.getElementById('opFechaGenVac').value.trim() || null,
        vac_pendientes: parseInt(document.getElementById('opVacPendientes').value) || 0,
        horas_laboradas: parseInt(document.getElementById('opHorasLaboradas').value) || 0,
        otra_posicion: "No",
        id_cal: null
    };

    if (!op.id_operador || !op.nombre || !op.id_tipo_posicion || !op.id_posicion_inicial) {
        alert('Por favor completa los campos obligatorios: ID, Nombre, Tipo Posición y Posición Inicial');
        return;
    }

    // Verificar si ya existe
    const existe = operadores.find(o => o.id_operador === op.id_operador);
    if (existe) {
        if (!confirm(`Ya existe un operador con ID ${op.id_operador} (${existe.nombre}). ¿Deseas reemplazarlo?`)) {
            return;
        }
        // Eliminar el existente
        const idx = operadores.findIndex(o => o.id_operador === op.id_operador);
        operadores.splice(idx, 1);
    }

    operadores.push(op);

    // Limpiar formulario
    document.getElementById('opId').value = '';
    document.getElementById('opNombre').value = '';
    document.getElementById('opTipoPosicion').value = '';
    document.getElementById('opPosicionInicial').value = '';
    document.getElementById('opCicloInicial').value = '';
    document.getElementById('opDiaCicloInicial').value = '1';
    document.getElementById('opTurnoCicloInicial').value = 'DIA';
    document.getElementById('opFechaGenVac').value = '';
    document.getElementById('opVacPendientes').value = '0';
    document.getElementById('opHorasLaboradas').value = '0';

    guardarDatos();
    actualizarVistaListas();

    // Mostrar confirmación
    console.log(`✅ Operador agregado: ${op.nombre} (Total: ${operadores.length})`);
}

// Actualizar vistas de listas
function actualizarVistaListas() {
    // Lista de ciclos
    const listaCiclos = document.getElementById('listaCiclos');
    listaCiclos.innerHTML = ciclos.map((c, idx) => `
        <div class="bg-gray-700 p-3 rounded flex justify-between items-center">
            <div>
                <span class="font-medium">${c.id_ciclo}</span>
                <span class="text-gray-400 ml-2">${c.dias_trabajo} días trabajo, ${c.dias_descanso} días descanso</span>
                ${c.ciclo_preferido === "Sí"
            ? '<span class="ml-2 bg-yellow-600 px-2 py-1 rounded text-xs">⭐ Preferido</span>'
            : `<button onclick="marcarCicloPreferido(${idx})" class="ml-2 bg-gray-600 hover:bg-gray-500 px-2 py-1 rounded text-xs text-gray-300">☆ Marcar como preferido</button>`
        }
            </div>
            <button onclick="eliminarCiclo(${idx})" class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm">
                🗑️ Eliminar
            </button>
        </div>
    `).join('');

    // Lista de posiciones
    const listaPosiciones = document.getElementById('listaPosiciones');
    listaPosiciones.innerHTML = posiciones.map((p, idx) => `
        <div class="bg-gray-700 p-3 rounded flex justify-between items-center">
            <div>
                <span class="font-medium">${p.id_posicion}</span>
                <span class="text-gray-400 ml-2">Tipo: ${p.tipo_posicion}, Requeridos: ${p.op_requeridos}</span>
            </div>
            <button onclick="eliminarPosicion(${idx})" class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm">
                🗑️ Eliminar
            </button>
        </div>
    `).join('');

    // Lista de operadores
    const listaOperadores = document.getElementById('listaOperadores');
    const contadorOperadores = document.getElementById('contadorOperadores');

    if (operadores.length === 0) {
        listaOperadores.innerHTML = '<div class="bg-gray-700 p-4 rounded text-center text-gray-400">No hay operadores registrados. Agrega uno usando el formulario de arriba.</div>';
    } else {
        listaOperadores.innerHTML = operadores.map((op, idx) => `
            <div class="bg-gray-700 p-3 rounded flex justify-between items-center">
                <div class="flex-1">
                    <span class="font-medium">${op.nombre}</span>
                    <span class="text-gray-400 ml-2">ID: ${op.id_operador}, Posición: ${op.id_posicion_inicial}</span>
                    ${op.id_posicion_inicial === 'op_vacaciones' ? '<span class="ml-2 bg-orange-600 px-2 py-1 rounded text-xs">Reemplazo</span>' : ''}
                    <div class="text-xs text-gray-500 mt-1">
                        Ciclo: ${op.ciclo_inicial}, Horas: ${op.horas_laboradas}h
                    </div>
                </div>
                <div class="flex gap-2">
                    <button onclick="editarOperador(${idx})" class="bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded text-sm">
                        ✏️ Editar
                    </button>
                    <button onclick="eliminarOperador(${idx})" class="bg-red-600 hover:bg-red-700 px-3 py-1 rounded text-sm">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        `).join('');
    }

    if (contadorOperadores) {
        contadorOperadores.textContent = operadores.length;
    }
}

// Editar operador
function editarOperador(idx) {
    if (idx < 0 || idx >= operadores.length) return;

    const op = operadores[idx];

    // Llenar formulario con datos del operador
    document.getElementById('opId').value = op.id_operador;
    document.getElementById('opNombre').value = op.nombre;
    document.getElementById('opTipoPosicion').value = op.id_tipo_posicion;
    document.getElementById('opPosicionInicial').value = op.id_posicion_inicial;
    document.getElementById('opCicloInicial').value = op.ciclo_inicial;
    document.getElementById('opDiaCicloInicial').value = op.dia_ciclo_inicial || 1;
    document.getElementById('opTurnoCicloInicial').value = op.turno_ciclo_inicial || 'DIA';
    document.getElementById('opFechaGenVac').value = op.fecha_gen_vac || '';
    document.getElementById('opVacPendientes').value = op.vac_pendientes || 0;
    document.getElementById('opHorasLaboradas').value = op.horas_laboradas || 0;

    // Guardar índice para actualización
    window.operadorEditando = idx;

    // Cambiar texto del botón
    const btnAgregar = document.getElementById('btnAgregarOperador');
    if (btnAgregar) {
        btnAgregar.textContent = '💾 Guardar Cambios';
        btnAgregar.onclick = () => guardarOperadorEditado();
    }

    const btnCancelar = document.getElementById('btnCancelarEdicion');
    if (btnCancelar) {
        btnCancelar.classList.remove('hidden');
    }

    // Scroll al formulario
    const formOperador = document.getElementById('formOperador') || document.querySelector('[id*="operador"]');
    if (formOperador) {
        formOperador.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Guardar operador editado
function guardarOperadorEditado() {
    const idx = window.operadorEditando;
    if (idx === undefined || idx < 0 || idx >= operadores.length) {
        alert('Error: No se puede guardar. Vuelve a intentar.');
        return;
    }

    const op = {
        id_operador: document.getElementById('opId').value.trim(),
        nombre: document.getElementById('opNombre').value.trim(),
        id_tipo_posicion: document.getElementById('opTipoPosicion').value.trim(),
        id_posicion_inicial: document.getElementById('opPosicionInicial').value.trim(),
        ciclo_inicial: document.getElementById('opCicloInicial').value.trim(),
        dia_ciclo_inicial: parseInt(document.getElementById('opDiaCicloInicial').value),
        turno_ciclo_inicial: document.getElementById('opTurnoCicloInicial').value,
        fecha_gen_vac: document.getElementById('opFechaGenVac').value.trim() || null,
        vac_pendientes: parseInt(document.getElementById('opVacPendientes').value) || 0,
        horas_laboradas: parseInt(document.getElementById('opHorasLaboradas').value) || 0,
        otra_posicion: "No",
        id_cal: null
    };

    if (!op.id_operador || !op.nombre || !op.id_tipo_posicion || !op.id_posicion_inicial) {
        alert('Por favor completa los campos obligatorios: ID, Nombre, Tipo Posición y Posición Inicial');
        return;
    }

    // Verificar si el ID cambió y ya existe
    if (op.id_operador !== operadores[idx].id_operador) {
        const existe = operadores.find(o => o.id_operador === op.id_operador && operadores.indexOf(o) !== idx);
        if (existe) {
            alert(`Ya existe un operador con ID ${op.id_operador} (${existe.nombre}).`);
            return;
        }
    }

    // Actualizar operador
    operadores[idx] = op;

    // Limpiar y restaurar formulario
    cancelarEdicionOperador();

    guardarDatos();
    actualizarVistaListas();

    console.log(`✅ Operador actualizado: ${op.nombre}`);
}

// Cancelar edición de operador
function cancelarEdicionOperador() {
    // Limpiar formulario
    document.getElementById('opId').value = '';
    document.getElementById('opNombre').value = '';
    document.getElementById('opTipoPosicion').value = '';
    document.getElementById('opPosicionInicial').value = '';
    document.getElementById('opCicloInicial').value = '';
    document.getElementById('opDiaCicloInicial').value = '1';
    document.getElementById('opTurnoCicloInicial').value = 'DIA';
    document.getElementById('opFechaGenVac').value = '';
    document.getElementById('opVacPendientes').value = '0';
    document.getElementById('opHorasLaboradas').value = '0';

    // Restaurar botones
    const btnAgregar = document.getElementById('btnAgregarOperador');
    if (btnAgregar) {
        btnAgregar.textContent = '➕ Agregar Operador';
        btnAgregar.onclick = () => agregarOperador();
    }

    const btnCancelar = document.getElementById('btnCancelarEdicion');
    if (btnCancelar) {
        btnCancelar.classList.add('hidden');
    }

    window.operadorEditando = undefined;
}

// Cargar datos por defecto de central
function cargarDatosCentral() {
    if (confirm('¿Deseas cargar los datos por defecto de central?\n\nEsto agregará:\n- 2 ciclos (12x9, 14x7)\n- 3 posiciones (central_1, central_2, op_vacaciones)\n- 7 operadores (6 regulares + 1 operador de vacaciones)\n\nLos operadores existentes se mantendrán, solo se agregarán los faltantes.')) {
        // Asegurar que existan los ciclos
        const ciclosNecesarios = [
            { id_ciclo: "12x9", dias_trabajo: 12, dias_descanso: 9, ciclo_preferido: "Sí" },
            { id_ciclo: "14x7", dias_trabajo: 14, dias_descanso: 7, ciclo_preferido: "No" }
        ];

        for (const cicloNecesario of ciclosNecesarios) {
            const existe = ciclos.find(c => c.id_ciclo === cicloNecesario.id_ciclo);
            if (!existe) {
                ciclos.push(cicloNecesario);
            } else {
                // Actualizar ciclo preferido si es necesario
                if (cicloNecesario.ciclo_preferido === "Sí") {
                    existe.ciclo_preferido = "Sí";
                    // Quitar preferido de otros
                    ciclos.forEach(c => {
                        if (c.id_ciclo !== cicloNecesario.id_ciclo) {
                            c.ciclo_preferido = "No";
                        }
                    });
                }
            }
        }

        // Asegurar que existan las posiciones
        const posicionesNecesarias = [
            { id_posicion: "central_1", tipo_posicion: "central", op_requeridos: 1, turnos_diarios: 2 },
            { id_posicion: "central_2", tipo_posicion: "central", op_requeridos: 1, turnos_diarios: 2 },
            { id_posicion: "op_vacaciones", tipo_posicion: "central", op_requeridos: 1, turnos_diarios: 2 }
        ];

        for (const posicionNecesaria of posicionesNecesarias) {
            const existe = posiciones.find(p => p.id_posicion === posicionNecesaria.id_posicion);
            if (!existe) {
                posiciones.push(posicionNecesaria);
            }
        }

        // Agregar operadores faltantes
        const operadoresCentral = [
            { id_operador: "46781909", nombre: "AGUIRRE HUAYRA JUAN ANTONIO", id_tipo_posicion: "central", id_posicion_inicial: "central_1", ciclo_inicial: "14x7", dia_ciclo_inicial: 19, turno_ciclo_inicial: "DESCANSO", fecha_gen_vac: "25/01/2021", vac_pendientes: 0, horas_laboradas: 0, otra_posicion: "No", id_cal: null },
            { id_operador: "71023970", nombre: "PEREZ CARDENAS CHRISTIAN DANNY", id_tipo_posicion: "central", id_posicion_inicial: "central_1", ciclo_inicial: "14x7", dia_ciclo_inicial: 12, turno_ciclo_inicial: "NOCHE", fecha_gen_vac: "21/05/2019", vac_pendientes: 30, horas_laboradas: 0, otra_posicion: "No", id_cal: null },
            { id_operador: "70237797", nombre: "PATRICIO CHAVEZ WALDIR", id_tipo_posicion: "central", id_posicion_inicial: "central_1", ciclo_inicial: "14x7", dia_ciclo_inicial: 5, turno_ciclo_inicial: "DIA", fecha_gen_vac: "21/05/2019", vac_pendientes: 0, horas_laboradas: 0, otra_posicion: "No", id_cal: null },
            { id_operador: "71660619", nombre: "CALIXTO RAMOS ADRIAN", id_tipo_posicion: "central", id_posicion_inicial: "central_2", ciclo_inicial: "14x7", dia_ciclo_inicial: 19, turno_ciclo_inicial: "DESCANSO", fecha_gen_vac: "18/12/2024", vac_pendientes: 0, horas_laboradas: 0, otra_posicion: "No", id_cal: null },
            { id_operador: "46539662", nombre: "TENORIO TENORIO ROSSMELL JAVIER", id_tipo_posicion: "central", id_posicion_inicial: "central_2", ciclo_inicial: "14x7", dia_ciclo_inicial: 5, turno_ciclo_inicial: "NOCHE", fecha_gen_vac: "22/02/2024", vac_pendientes: 0, horas_laboradas: 0, otra_posicion: "No", id_cal: null },
            { id_operador: "70431736", nombre: "HUARCAYA CORDOVA SECILIO MARCELINO", id_tipo_posicion: "central", id_posicion_inicial: "central_2", ciclo_inicial: "14x7", dia_ciclo_inicial: 12, turno_ciclo_inicial: "DIA", fecha_gen_vac: "3/07/2024", vac_pendientes: 0, horas_laboradas: 0, otra_posicion: "No", id_cal: null },
            { id_operador: "70320115", nombre: "SARMIENTO ZACARIAS CRISTIAN FRANK", id_tipo_posicion: "central", id_posicion_inicial: "op_vacaciones", ciclo_inicial: "12x9", dia_ciclo_inicial: 1, turno_ciclo_inicial: "DIA", fecha_gen_vac: "13/03/2024", vac_pendientes: 0, horas_laboradas: 0, otra_posicion: "No", id_cal: null }
        ];

        let operadoresAgregados = 0;
        for (const opCentral of operadoresCentral) {
            const existe = operadores.find(o => o.id_operador === opCentral.id_operador);
            if (!existe) {
                operadores.push(opCentral);
                operadoresAgregados++;
            }
        }

        guardarDatos();
        actualizarVistaListas();

        alert(`✅ Datos de central cargados:\n\n` +
            `- Ciclos: ${ciclos.length}\n` +
            `- Posiciones: ${posiciones.length}\n` +
            `- Operadores agregados: ${operadoresAgregados}\n` +
            `- Total operadores: ${operadores.length}\n\n` +
            `Los ${operadoresAgregados > 0 ? operadoresAgregados : '7'} operadores de central están listos.`);
    }
}

// Limpiar todos los datos
function limpiarTodosDatos() {
    if (confirm('¿Estás seguro de eliminar TODOS los datos (ciclos, posiciones y operadores)?\n\nEsta acción no se puede deshacer.')) {
        if (confirm('¿Realmente quieres eliminar todo? Esto borrará todos los datos guardados.')) {
            ciclos = [];
            posiciones = [];
            operadores = [];
            localStorage.removeItem('datosTurnos');
            actualizarVistaListas();
            alert('Todos los datos han sido eliminados.');
        }
    }
}

// Eliminar funciones
function eliminarCiclo(idx) {
    if (confirm('¿Eliminar este ciclo?')) {
        ciclos.splice(idx, 1);
        guardarDatos();
        actualizarVistaListas();
    }
}

// Marcar ciclo como preferido
function marcarCicloPreferido(idx) {
    if (idx < 0 || idx >= ciclos.length) return;

    // Actualizar todos los ciclos
    ciclos.forEach((c, index) => {
        c.ciclo_preferido = (index === idx) ? "Sí" : "No";
    });

    guardarDatos();
    actualizarVistaListas();
    console.log(`✅ Ciclo preferido actualizado: ${ciclos[idx].id_ciclo}`);
}

function eliminarPosicion(idx) {
    if (confirm('¿Eliminar esta posición?')) {
        posiciones.splice(idx, 1);
        guardarDatos();
        actualizarVistaListas();
    }
}

function eliminarOperador(idx) {
    if (confirm('¿Eliminar este operador?')) {
        operadores.splice(idx, 1);
        guardarDatos();
        actualizarVistaListas();
    }
}

// Función principal de optimización
async function optimizar() {
    try {
        // Validar que hay datos ANTES de deshabilitar botón
        if (ciclos.length === 0) {
            alert('Por favor agrega al menos un ciclo en la pestaña "Ciclos"');
            return;
        }
        if (posiciones.length === 0) {
            alert('Por favor agrega al menos una posición en la pestaña "Posiciones"');
            return;
        }
        if (operadores.length === 0) {
            alert('Por favor agrega al menos un operador en la pestaña "Operadores"');
            return;
        }

        // Mostrar loading con mensaje
        const btnOptimizar = document.getElementById('btnOptimizar');
        if (btnOptimizar) {
            btnOptimizar.disabled = true;
        }

        const loadingDiv = document.getElementById('loading');
        if (loadingDiv) {
            loadingDiv.classList.remove('hidden');
        }

        // Obtener configuración
        const configuracion = {
            dias_vacaciones: parseInt(document.getElementById('diasVacaciones').value) || 30,
            limite_horas_anuales: parseInt(document.getElementById('limiteHoras').value),
            ano_analisis: parseInt(document.getElementById('anoAnalisis').value),
            mes_inicio_analisis: parseInt(document.getElementById('mesInicio').value),
            limite_acumulado_dia_noche: 60,
            limite_descansos_pendientes: 5
        };

        // Marcar ciclo preferido (usar el que está marcado como preferido)
        const cicloPreferidoObj = ciclos.find(c => c.ciclo_preferido === "Sí");
        const cicloPreferido = cicloPreferidoObj ? cicloPreferidoObj.id_ciclo : ciclos[0].id_ciclo;

        const ciclosConPreferido = ciclos.map(c => ({
            ...c,
            ciclo_preferido: c.id_ciclo === cicloPreferido ? "Sí" : "No"
        }));

        // Preparar solicitud
        const solicitud = {
            configuracion: configuracion,
            ciclos: ciclosConPreferido,
            posiciones: posiciones,
            operadores: operadores
        };

        console.log('Iniciando optimización...', solicitud);
        console.log(`Operadores: ${operadores.length}, Posiciones: ${posiciones.length}, Ciclos: ${ciclos.length}`);

        // Ejecutar optimización en un timeout para no bloquear UI
        // Usar Web Worker sería mejor, pero para ahora esto funciona
        setTimeout(() => {
            try {
                // Actualizar texto de loading
                const loadingTextEl = document.getElementById('loadingText');
                if (loadingTextEl) {
                    loadingTextEl.textContent = 'Procesando días...';
                }

                const inicio = Date.now();
                const [cronograma, metricas] = optimizarConHeuristica(solicitud);
                const fin = Date.now();
                const tiempo = ((fin - inicio) / 1000).toFixed(2);

                console.log(`Optimización completada en ${tiempo} segundos`);
                console.log(`Registros generados: ${cronograma.length}`);

                cronogramaOptimizado = cronograma;
                estadisticas = metricas;

                // Mostrar resultados
                mostrarResultados(cronograma, metricas);

                // Cambiar a pestaña de resultados
                mostrarResultadosEnTab();

                // Ocultar loading
                if (loadingDiv) {
                    loadingDiv.classList.add('hidden');
                }
                const btnOptimizar = document.getElementById('btnOptimizar');
                if (btnOptimizar) {
                    btnOptimizar.disabled = false;
                }

                // Mostrar mensaje de éxito
                alert(`✅ Optimización completada exitosamente!\n\n` +
                    `Registros generados: ${cronograma.length}\n` +
                    `Tiempo: ${tiempo} segundos\n\n` +
                    `Ve a la pestaña "Resultados" para ver el cronograma.`);
            } catch (error) {
                console.error('Error durante optimización:', error);
                alert('Error durante la optimización: ' + error.message + '\n\nRevisa la consola para más detalles.');
                if (loadingDiv) {
                    loadingDiv.classList.add('hidden');
                }
                const btnOptimizar = document.getElementById('btnOptimizar');
                if (btnOptimizar) {
                    btnOptimizar.disabled = false;
                }
            }
        }, 100);

    } catch (error) {
        console.error('Error en optimización:', error);
        alert('Error: ' + error.message);
        const loadingDiv = document.getElementById('loading');
        if (loadingDiv) {
            loadingDiv.classList.add('hidden');
        }
        const btnOptimizar = document.getElementById('btnOptimizar');
        if (btnOptimizar) {
            btnOptimizar.disabled = false;
        }
    }
}

// Mostrar resultados
function mostrarResultados(cronograma, metricas) {
    // Mostrar estadísticas
    const huecosTotales = metricas.huecos_totales || 0;
    const operadoresExcedidos = metricas.operadores_excedidos || 0;

    document.getElementById('estadisticasContent').innerHTML = `
        <div class="bg-gray-700 p-4 rounded">
            <div class="text-2xl font-bold">${metricas.total_registros}</div>
            <div class="text-sm text-gray-300">Total registros</div>
        </div>
        <div class="bg-gray-700 p-4 rounded">
            <div class="text-2xl font-bold">${metricas.turnos_dia}</div>
            <div class="text-sm text-gray-300">Turnos día</div>
        </div>
        <div class="bg-gray-700 p-4 rounded">
            <div class="text-2xl font-bold">${metricas.turnos_noche}</div>
            <div class="text-sm text-gray-300">Turnos noche</div>
        </div>
        <div class="bg-gray-700 p-4 rounded ${huecosTotales > 0 ? 'bg-red-900' : ''}">
            <div class="text-2xl font-bold ${huecosTotales > 0 ? 'text-red-300' : ''}">${huecosTotales}</div>
            <div class="text-sm text-gray-300">Huecos detectados</div>
        </div>
        ${operadoresExcedidos > 0 ? `
        <div class="bg-red-900 p-4 rounded">
            <div class="text-2xl font-bold text-red-300">${operadoresExcedidos}</div>
            <div class="text-sm text-red-300">Operadores excedieron horas</div>
        </div>
        ` : ''}
    `;

    // Mostrar advertencias si hay
    if (metricas.advertencias && metricas.advertencias.length > 0) {
        console.warn('⚠️ ADVERTENCIAS:', metricas.advertencias);
    }
    document.getElementById('estadisticas').classList.remove('hidden');

    // Llenar selector de operadores
    const operadoresUnicos = [...new Set(cronograma.map(r => r.Nombre))].sort();
    const selectOperador = document.getElementById('filtroOperador');
    if (selectOperador) {
        selectOperador.innerHTML = '<option value="">Todos los operadores</option>';
        operadoresUnicos.forEach(op => {
            const option = document.createElement('option');
            option.value = op;
            option.textContent = op;
            selectOperador.appendChild(option);
        });
    }

    // Mostrar ambas vistas
    mostrarVistaCalendario(cronograma);
    mostrarTabla(cronograma);

    // Generar matriz de análisis
    generarMatrizAnalisis();

    // Generar semáforo de cobertura
    generarSemaforo();

    // Mostrar vista calendario por defecto
    mostrarVista('calendario');

    if (document.getElementById('totalRegistros')) {
        document.getElementById('totalRegistros').textContent = cronograma.length;
    }
}

// Generar matriz de análisis
function generarMatrizAnalisis() {
    if (!cronogramaOptimizado || cronogramaOptimizado.length === 0) {
        document.getElementById('matrizContenedor').innerHTML =
            '<div class="text-center text-gray-400 p-8">Primero optimiza los turnos para generar la matriz de análisis.</div>';
        return;
    }

    const ano = parseInt(document.getElementById('anoAnalisis').value) || 2025;
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const diasPorMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // Ajustar febrero si es bisiesto
    if ((ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0) {
        diasPorMes[1] = 29;
    }

    // Obtener todas las posiciones únicas
    const posicionesUnicas = [...new Set(cronogramaOptimizado.map(r => r.Posicion))].sort();

    // Crear mapa de datos por fecha y posición
    const matrizPorFecha = {};
    const errores = [];
    const huecos = [];

    cronogramaOptimizado.forEach(r => {
        if (!matrizPorFecha[r.Fecha]) {
            matrizPorFecha[r.Fecha] = {};
        }
        if (!matrizPorFecha[r.Fecha][r.Posicion]) {
            matrizPorFecha[r.Fecha][r.Posicion] = { dia: null, noche: null };
        }

        if (r.Estado === 't.dia') {
            if (matrizPorFecha[r.Fecha][r.Posicion].dia) {
                errores.push({
                    fecha: r.Fecha,
                    posicion: r.Posicion,
                    tipo: 'DUPLICIDAD_TD',
                    operador1: matrizPorFecha[r.Fecha][r.Posicion].dia,
                    operador2: r.Nombre
                });
            }
            matrizPorFecha[r.Fecha][r.Posicion].dia = r.Nombre;
        } else if (r.Estado === 't.noche') {
            if (matrizPorFecha[r.Fecha][r.Posicion].noche) {
                errores.push({
                    fecha: r.Fecha,
                    posicion: r.Posicion,
                    tipo: 'DUPLICIDAD_TN',
                    operador1: matrizPorFecha[r.Fecha][r.Posicion].noche,
                    operador2: r.Nombre
                });
            }
            matrizPorFecha[r.Fecha][r.Posicion].noche = r.Nombre;
        }
    });

    // Detectar huecos
    for (const fecha in matrizPorFecha) {
        for (const posicion of posicionesUnicas) {
            if (!matrizPorFecha[fecha][posicion]) {
                matrizPorFecha[fecha][posicion] = { dia: null, noche: null };
            }

            if (!matrizPorFecha[fecha][posicion].dia) {
                huecos.push({ fecha, posicion, turno: 'TD' });
            }
            if (!matrizPorFecha[fecha][posicion].noche) {
                huecos.push({ fecha, posicion, turno: 'TN' });
            }
        }
    }

    // Mostrar estadísticas
    const estadisticasHTML = `
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div class="bg-gray-700 p-3 rounded">
                <div class="text-lg font-bold">${posicionesUnicas.length}</div>
                <div class="text-sm text-gray-300">Posiciones</div>
            </div>
            <div class="bg-gray-700 p-3 rounded">
                <div class="text-lg font-bold">${Object.keys(matrizPorFecha).length}</div>
                <div class="text-sm text-gray-300">Días Analizados</div>
            </div>
            <div class="bg-${huecos.length > 0 ? 'red' : 'green'}-900 p-3 rounded">
                <div class="text-lg font-bold">${huecos.length}</div>
                <div class="text-sm text-gray-300">Huecos Detectados</div>
            </div>
            <div class="bg-${errores.length > 0 ? 'red' : 'green'}-900 p-3 rounded">
                <div class="text-lg font-bold">${errores.length}</div>
                <div class="text-sm text-gray-300">Errores Detectados</div>
            </div>
        </div>
    `;
    document.getElementById('matrizEstadisticas').innerHTML = estadisticasHTML;

    // Guardar datos para exportación
    window.matrizAnalisis = {
        matrizPorFecha,
        posicionesUnicas,
        errores,
        huecos,
        ano
    };

    // Generar tabla HTML
    generarTablaMatriz(matrizPorFecha, posicionesUnicas, errores, huecos, ano, meses, diasPorMes);
}

// Generar semáforo de cobertura (NUEVA FUNCIÓN)
function generarSemaforo() {
    const contenedor = document.getElementById('semaforoContenedor');
    if (!contenedor) return;

    if (!cronogramaOptimizado || cronogramaOptimizado.length === 0) {
        contenedor.innerHTML = '<div class="text-center text-gray-400 p-8">Optimiza primero para ver el semáforo.</div>';
        return;
    }

    const ano = parseInt(document.getElementById('anoAnalisis').value) || 2025;
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const diasPorMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // Ajustar febrero si es bisiesto
    if ((ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0) {
        diasPorMes[1] = 29;
    }

    // Obtener datos de la matriz ya generada (o generarla si no existe)
    if (!window.matrizAnalisis) {
        generarMatrizAnalisis();
    }
    const { matrizPorFecha, posicionesUnicas } = window.matrizAnalisis;

    // Filtrar solo posiciones "central"
    const posicionesCentral = posicionesUnicas.filter(p => p.startsWith('central_'));

    let htmlGlobal = '';

    // Generar calendario por meses
    meses.forEach((mes, mesIdx) => {
        const diasEnMes = diasPorMes[mesIdx];

        let htmlMes = `
            <div class="bg-gray-800 rounded-lg p-4 mb-4">
                <h3 class="text-lg font-semibold mb-3 border-b border-gray-700 pb-2">${mes} ${ano}</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        `;

        for (let dia = 1; dia <= diasEnMes; dia++) {
            const fecha = new Date(ano, mesIdx, dia);
            const fechaStr = formatearFecha(fecha);
            const datosDia = matrizPorFecha[fechaStr] || {};

            // Verificar cobertura TOTAL del día para TODAS las posiciones centrales
            let totalPosiciones = posicionesCentral.length;
            let posicionesCubiertasCompletas = 0;
            let posicionesCubiertasParcial = 0;
            let posicionesVacias = 0;

            let detalleTooltip = `${fechaStr}\n`;

            posicionesCentral.forEach(pos => {
                const turno = datosDia[pos] || { dia: null, noche: null };
                const tieneDia = !!turno.dia;
                const tieneNoche = !!turno.noche;

                detalleTooltip += `${pos}: ${tieneDia ? 'TD✅' : 'TD❌'} | ${tieneNoche ? 'TN✅' : 'TN❌'}\n`;

                if (tieneDia && tieneNoche) {
                    posicionesCubiertasCompletas++;
                } else if (tieneDia || tieneNoche) {
                    posicionesCubiertasParcial++;
                } else {
                    posicionesVacias++;
                }
            });

            // Determinar color del día
            let claseColor = 'semaforo-negro'; // Por defecto negro (vacío)
            if (posicionesCubiertasCompletas === totalPosiciones) {
                claseColor = 'semaforo-verde'; // Todo cubierto
            } else if (posicionesCubiertasCompletas > 0 || posicionesCubiertasParcial > 0) {
                // Si hay algo cubierto pero no todo, es naranja
                claseColor = 'semaforo-naranja';
            }

            // Si hay CERO cobertura (todo vacío) se queda negro.

            htmlMes += `
                <div class="flex items-center justify-between bg-gray-700 p-2 rounded cursor-help" title="${detalleTooltip}">
                    <span class="text-sm font-medium w-8">${dia}</span>
                    <div class="flex-1 ml-2">
                        <div class="text-xs text-gray-400 mb-1">Cobertura: ${posicionesCubiertasCompletas}/${totalPosiciones}</div>
                        <div class="w-full bg-gray-900 h-2 rounded-full overflow-hidden">
                            <div class="${claseColor} h-full" style="width: 100%"></div>
                        </div>
                    </div>
                    <div class="${claseColor} w-6 h-6 rounded ml-2 flex items-center justify-center text-xs font-bold text-white">
                        ${posicionesCubiertasCompletas === totalPosiciones ? '✓' : '!'}
                    </div>
                </div>
            `;
        }

        htmlMes += `
                </div>
            </div>
        `;

        htmlGlobal += htmlMes;
    });

    contenedor.innerHTML = htmlGlobal;
}

// Generar tabla de matriz
function generarTablaMatriz(matrizPorFecha, posicionesUnicas, errores, huecos, ano, meses, diasPorMes) {
    // Filtrar solo las posiciones de central (central_1, central_2)
    const posicionesCentral = posicionesUnicas.filter(p => p.startsWith('central_')).sort();

    let html = '<table class="border-collapse text-xs w-full">';

    // Encabezado simplificado: Fecha | Sede | TD | TN
    html += '<thead><tr>';
    html += '<th class="border border-gray-600 bg-gray-700 p-2 sticky left-0 z-20 min-w-[120px]">Fecha</th>';
    html += '<th class="border border-gray-600 bg-gray-700 p-2 sticky left-[120px] z-20 min-w-[100px]">Sede</th>';
    html += '<th class="border border-gray-600 bg-gray-700 p-1 text-center min-w-[120px]">TD</th>';
    html += '<th class="border border-gray-600 bg-gray-700 p-1 text-center min-w-[120px]">TN</th>';
    html += '</tr></thead><tbody>';

    // Generar filas por día
    let fechaActual = new Date(ano, 0, 1);
    const fechaFin = new Date(ano, 11, 31);

    while (fechaActual <= fechaFin) {
        const fechaStr = formatearFecha(fechaActual);
        const fechaDatos = matrizPorFecha[fechaStr] || {};

        // Una fila por cada posición central (central_1, central_2)
        for (const posicion of posicionesCentral) {
            const datos = fechaDatos[posicion] || { dia: null, noche: null };

            // Verificar si hay error o hueco
            const tieneHueco = !datos.dia || !datos.noche;
            const tieneError = errores.some(e => e.fecha === fechaStr && e.posicion === posicion);
            const filaClase = tieneError ? 'bg-red-900' : tieneHueco ? 'bg-yellow-900' : '';

            html += `<tr class="${filaClase}">`;

            // Columna fecha (solo primera posición del día)
            if (posicion === posicionesCentral[0]) {
                html += `<td rowspan="${posicionesCentral.length}" class="border border-gray-600 bg-gray-800 p-2 sticky left-0 z-10 text-center">${fechaStr}</td>`;
            }

            // Columna Sede (nombre de la posición: central_1, central_2)
            html += `<td class="border border-gray-600 bg-gray-800 p-2 sticky left-[120px] z-10 font-medium">${posicion}</td>`;

            // Columnas TD y TN para esta posición específica
            // TD
            const claseTD = datos.dia ? 'bg-green-600' : 'bg-red-600';
            html += `<td class="border border-gray-600 ${claseTD} p-1 text-center text-white text-[10px]">${datos.dia || '❌'}</td>`;

            // TN
            const claseTN = datos.noche ? 'bg-blue-600' : 'bg-red-600';
            html += `<td class="border border-gray-600 ${claseTN} p-1 text-center text-white text-[10px]">${datos.noche || '❌'}</td>`;

            html += '</tr>';
        }

        // Avanzar día
        fechaActual.setDate(fechaActual.getDate() + 1);
    }

    html += '</tbody></table>';

    document.getElementById('matrizContenedor').innerHTML = html;

    // Mostrar errores y huecos si hay
    if (errores.length > 0 || huecos.length > 0) {
        let detallesHTML = '<div class="mt-4 bg-gray-800 rounded-lg p-4">';
        detallesHTML += '<h3 class="font-semibold mb-2">Detalles de Errores y Huecos</h3>';

        if (errores.length > 0) {
            detallesHTML += '<div class="mb-4"><h4 class="text-red-400 font-medium mb-2">Errores Detectados:</h4><ul class="list-disc list-inside text-sm">';
            errores.slice(0, 20).forEach(e => {
                detallesHTML += `<li class="text-red-300">${e.fecha} - ${e.posicion}: ${e.tipo} (${e.operador1} y ${e.operador2})</li>`;
            });
            if (errores.length > 20) {
                detallesHTML += `<li class="text-gray-400">... y ${errores.length - 20} errores más</li>`;
            }
            detallesHTML += '</ul></div>';
        }

        if (huecos.length > 0) {
            detallesHTML += '<div><h4 class="text-yellow-400 font-medium mb-2">Huecos Detectados:</h4><ul class="list-disc list-inside text-sm">';
            huecos.slice(0, 20).forEach(h => {
                detallesHTML += `<li class="text-yellow-300">${h.fecha} - ${h.posicion}: Falta ${h.turno}</li>`;
            });
            if (huecos.length > 20) {
                detallesHTML += `<li class="text-gray-400">... y ${huecos.length - 20} huecos más</li>`;
            }
            detallesHTML += '</ul></div>';
        }

        detallesHTML += '</div>';
        document.getElementById('matrizContenedor').innerHTML += detallesHTML;
    }
}

// Exportar matriz a CSV
function exportarMatrizCSV() {
    if (!window.matrizAnalisis) {
        alert('Primero genera la matriz de análisis');
        return;
    }

    const { matrizPorFecha, posicionesUnicas, errores, huecos } = window.matrizAnalisis;

    let csv = 'Fecha,Posición';
    posicionesUnicas.forEach(pos => {
        csv += `,${pos}_TD,${pos}_TN`;
    });
    csv += '\n';

    // Ordenar fechas
    const fechasOrdenadas = Object.keys(matrizPorFecha).sort();

    for (const fecha of fechasOrdenadas) {
        for (const posicion of posicionesUnicas) {
            const datos = matrizPorFecha[fecha][posicion] || { dia: null, noche: null };
            csv += `${fecha},${posicion}`;

            for (const pos of posicionesUnicas) {
                const datosPos = matrizPorFecha[fecha][pos] || { dia: null, noche: null };
                csv += `,${datosPos.dia || ''},${datosPos.noche || ''}`;
            }
            csv += '\n';
        }
    }

    // Agregar sección de errores
    if (errores.length > 0) {
        csv += '\n\nERRORES\n';
        csv += 'Fecha,Posición,Tipo,Operador1,Operador2\n';
        errores.forEach(e => {
            csv += `${e.fecha},${e.posicion},${e.tipo},${e.operador1},${e.operador2}\n`;
        });
    }

    // Agregar sección de huecos
    if (huecos.length > 0) {
        csv += '\n\nHUECOS\n';
        csv += 'Fecha,Posición,Turno\n';
        huecos.forEach(h => {
            csv += `${h.fecha},${h.posicion},${h.turno}\n`;
        });
    }

    // Descargar
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `matriz_analisis_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Mostrar/ocultar vistas
function mostrarVista(tipo) {
    // Ocultar ambas vistas
    document.getElementById('vistaCalendario').classList.add('hidden');
    document.getElementById('vistaTabla').classList.add('hidden');

    // Resetear botones
    document.getElementById('btnVistaCalendario').classList.remove('bg-blue-600');
    document.getElementById('btnVistaCalendario').classList.add('bg-gray-700');
    document.getElementById('btnVistaTabla').classList.remove('bg-blue-600');
    document.getElementById('btnVistaTabla').classList.add('bg-gray-700');

    // Mostrar la vista seleccionada
    if (tipo === 'calendario') {
        document.getElementById('vistaCalendario').classList.remove('hidden');
        document.getElementById('btnVistaCalendario').classList.remove('bg-gray-700');
        document.getElementById('btnVistaCalendario').classList.add('bg-blue-600');
    } else {
        document.getElementById('vistaTabla').classList.remove('hidden');
        document.getElementById('btnVistaTabla').classList.remove('bg-gray-700');
        document.getElementById('btnVistaTabla').classList.add('bg-blue-600');
    }
}

// Generar vista de calendario (similar a Excel)
function mostrarVistaCalendario(cronograma) {
    const header = document.getElementById('calendarioHeader');
    const body = document.getElementById('calendarioBody');

    if (!header || !body) return;

    // Obtener año de la configuración
    const ano = parseInt(document.getElementById('anoAnalisis').value) || 2025;

    // Obtener operadores únicos ordenados por posición inicial
    const operadoresUnicos = [...new Set(cronograma.map(r => r.Nombre))];

    // Crear mapa de datos por operador y fecha + calcular estadísticas
    const datosPorOperador = {};
    const estadisticasPorOperador = {};

    operadoresUnicos.forEach(nombre => {
        datosPorOperador[nombre] = {};
        const posicionInicial = cronograma.find(r => r.Nombre === nombre)?.Posicion_Inicial || '';

        datosPorOperador[nombre].posicionInicial = posicionInicial;
        datosPorOperador[nombre].datos = {};

        // Calcular estadísticas
        const registrosOperador = cronograma.filter(r => r.Nombre === nombre);
        let horasTrabajo = 0;
        let horasDia = 0;
        let horasNoche = 0;
        let diasDescanso = 0;
        let diasVacaciones = 0;

        registrosOperador.forEach(r => {
            datosPorOperador[nombre].datos[r.Fecha] = r.Estado2;

            if (r.Estado === 't.dia') {
                horasTrabajo += 12;
                horasDia += 12;
            } else if (r.Estado === 't.noche') {
                horasTrabajo += 12;
                horasNoche += 12;
            } else if (r.Estado === 'descansando') {
                diasDescanso += 1;
            } else if (r.Estado === 'vacaciones') {
                diasVacaciones += 1;
            }
        });

        estadisticasPorOperador[nombre] = {
            horasTrabajo: horasTrabajo,
            horasDia: horasDia,
            horasNoche: horasNoche,
            diasDescanso: diasDescanso,
            diasVacaciones: diasVacaciones,
            totalHoras: horasTrabajo
        };
    });

    // Generar encabezado con meses
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const diasPorMes = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

    // Ajustar febrero si es bisiesto
    if ((ano % 4 === 0 && ano % 100 !== 0) || ano % 400 === 0) {
        diasPorMes[1] = 29;
    }

    // Crear filas de encabezado
    let headerHTML = '<tr>';
    headerHTML += '<th class="border border-gray-600 bg-gray-700 p-2 sticky left-0 z-10 min-w-[250px] text-left">Operador (Horas)</th>';
    headerHTML += '<th class="border border-gray-600 bg-gray-700 p-2 sticky left-[250px] z-10 min-w-[100px] text-left">Posición</th>';

    // Fila 1: Abreviaturas de mes (Ene, Feb, etc.)
    meses.forEach((mes, idx) => {
        const dias = diasPorMes[idx];
        headerHTML += `<th colspan="${dias}" class="border border-gray-600 bg-gray-700 p-1 text-center text-xs">${mes.substring(0, 3)}</th>`;
    });
    headerHTML += '</tr>';

    // Fila 2: Nombres completos de mes
    headerHTML += '<tr>';
    headerHTML += '<th class="border border-gray-600 bg-gray-700 p-2 sticky left-0 z-10"></th>';
    headerHTML += '<th class="border border-gray-600 bg-gray-700 p-2 sticky left-[250px] z-10"></th>';
    meses.forEach((mes, idx) => {
        const dias = diasPorMes[idx];
        headerHTML += `<th colspan="${dias}" class="border border-gray-600 bg-gray-700 p-1 text-center text-xs font-semibold">${mes}</th>`;
    });
    headerHTML += '</tr>';

    // Fila 3: Números de día
    headerHTML += '<tr>';
    headerHTML += '<th class="border border-gray-600 bg-gray-700 p-2 sticky left-0 z-10"></th>';
    headerHTML += '<th class="border border-gray-600 bg-gray-700 p-2 sticky left-[250px] z-10"></th>';
    meses.forEach((mes, mesIdx) => {
        const dias = diasPorMes[mesIdx];
        for (let dia = 1; dia <= dias; dia++) {
            headerHTML += `<th class="border border-gray-600 bg-gray-700 p-1 text-center text-xs min-w-[30px]">${dia}</th>`;
        }
    });
    headerHTML += '</tr>';

    header.innerHTML = headerHTML;

    // Generar filas de operadores
    body.innerHTML = '';

    // Agrupar operadores por posición inicial
    const operadoresPorPosicion = {};
    Object.keys(datosPorOperador).forEach(nombre => {
        const pos = datosPorOperador[nombre].posicionInicial;
        if (!operadoresPorPosicion[pos]) {
            operadoresPorPosicion[pos] = [];
        }
        operadoresPorPosicion[pos].push(nombre);
    });

    // Ordenar posiciones
    const posicionesOrdenadas = Object.keys(operadoresPorPosicion).sort();

    posicionesOrdenadas.forEach((posicion, posIdx) => {
        // Agregar separador visual si no es la primera posición
        if (posIdx > 0) {
            const separador = document.createElement('tr');
            const totalColumnas = 2 + 365; // Operador + Posición + 365 días
            separador.innerHTML = `<td colspan="${totalColumnas}" class="border border-gray-600 h-2 bg-gray-800"></td>`;
            body.appendChild(separador);
        }

        operadoresPorPosicion[posicion].forEach(nombre => {
            const tr = document.createElement('tr');
            let rowHTML = '';

            // Columna Operador con estadísticas
            const stats = estadisticasPorOperador[nombre];
            const limiteHoras = parseInt(document.getElementById('limiteHoras').value) || 2400;
            const porcentajeHoras = ((stats.totalHoras / limiteHoras) * 100).toFixed(1);
            const claseHoras = stats.totalHoras > limiteHoras ? 'text-red-400' : stats.totalHoras > limiteHoras * 0.9 ? 'text-yellow-400' : 'text-green-400';

            rowHTML += `<td class="border border-gray-600 bg-gray-800 p-2 sticky left-0 z-10 text-xs">
                <div class="font-medium">${nombre}</div>
                <div class="text-gray-400 text-[10px] mt-1">
                    <div>TD: ${stats.horasDia}h | TN: ${stats.horasNoche}h</div>
                    <div>Total: <span class="${claseHoras}">${stats.totalHoras}h</span> (${porcentajeHoras}%)</div>
                    <div>Descanso: ${stats.diasDescanso}d | Vac: ${stats.diasVacaciones}d</div>
                </div>
            </td>`;

            // Columna Posición
            rowHTML += `<td class="border border-gray-600 bg-gray-800 p-2 sticky left-[250px] z-10 text-xs">${posicion}</td>`;

            // Columnas de días
            meses.forEach((mes, mesIdx) => {
                const dias = diasPorMes[mesIdx];
                for (let dia = 1; dia <= dias; dia++) {
                    const fecha = new Date(ano, mesIdx, dia);
                    const fechaStr = formatearFecha(fecha);
                    const estado = datosPorOperador[nombre].datos[fechaStr] || '';

                    // Clase CSS según estado
                    let claseEstado = 'bg-gray-800';
                    if (estado === 'TD') claseEstado = 'bg-green-600 text-white font-bold';
                    else if (estado === 'TN') claseEstado = 'bg-blue-600 text-white font-bold';
                    else if (estado === 'DE') claseEstado = 'bg-red-600 text-white font-bold';
                    else if (estado === 'VC') claseEstado = 'bg-orange-600 text-white font-bold';

                    rowHTML += `<td class="border border-gray-600 ${claseEstado} p-1 text-center text-xs min-w-[30px]">${estado}</td>`;
                }
            });

            tr.innerHTML = rowHTML;
            body.appendChild(tr);
        });
    });
}

// Formatear fecha a DD/MM/YYYY
function formatearFecha(fecha) {
    const dia = String(fecha.getDate()).padStart(2, '0');
    const mes = String(fecha.getMonth() + 1).padStart(2, '0');
    const anio = fecha.getFullYear();
    return `${dia}/${mes}/${anio}`;
}

// Mostrar tabla
function mostrarTabla(cronograma) {
    const tbody = document.getElementById('tablaBody');
    tbody.innerHTML = '';

    // Ordenar por fecha y operador
    const cronogramaOrdenado = [...cronograma].sort((a, b) => {
        const fechaA = convertirFecha(a.Fecha);
        const fechaB = convertirFecha(b.Fecha);
        if (fechaA !== fechaB) return fechaA - fechaB;
        return a.Nombre.localeCompare(b.Nombre);
    });

    cronogramaOrdenado.forEach(registro => {
        const tr = document.createElement('tr');
        tr.className = 'border-b border-gray-700 hover:bg-gray-700';
        tr.dataset.operador = registro.Nombre;
        tr.dataset.fecha = registro.Fecha;

        const claseEstado = `estado-${registro.Estado2.toLowerCase()}`;

        tr.innerHTML = `
            <td class="px-4 py-3">${registro.Fecha}</td>
            <td class="px-4 py-3">${registro.Nombre}</td>
            <td class="px-4 py-3">${registro.Posicion}</td>
            <td class="px-4 py-3 text-center">
                <span class="px-2 py-1 rounded text-xs font-semibold ${claseEstado}">
                    ${registro.Estado2}
                </span>
            </td>
            <td class="px-4 py-3 text-center">${registro.Ciclo}</td>
            <td class="px-4 py-3 text-center">${registro.Dia_Ciclo}</td>
            <td class="px-4 py-3 text-right">${registro.Horas_Ano}</td>
            <td class="px-4 py-3 text-right">${registro.Porcentaje_Dia.toFixed(1)}%</td>
            <td class="px-4 py-3 text-right">${registro.Porcentaje_Noche.toFixed(1)}%</td>
        `;

        tbody.appendChild(tr);
    });
}

// Filtrar tabla
function filtrarTabla() {
    const filtroOperador = document.getElementById('filtroOperador').value;
    const filtroFechaInicio = document.getElementById('filtroFechaInicio').value;

    const filas = document.querySelectorAll('#tablaBody tr');

    filas.forEach(fila => {
        const operador = fila.dataset.operador;
        const fecha = fila.dataset.fecha;

        let mostrar = true;

        if (filtroOperador && operador !== filtroOperador) {
            mostrar = false;
        }

        if (filtroFechaInicio) {
            const fechaRegistro = convertirFecha(fecha);
            const fechaFiltro = new Date(filtroFechaInicio);
            if (fechaRegistro < fechaFiltro) {
                mostrar = false;
            }
        }

        fila.style.display = mostrar ? '' : 'none';
    });

    // Actualizar contador
    const visibles = Array.from(filas).filter(f => f.style.display !== 'none').length;
    document.getElementById('totalRegistros').textContent = visibles;
}

// Convertir fecha DD/MM/YYYY a Date
function convertirFecha(fechaStr) {
    const partes = fechaStr.split('/');
    return new Date(parseInt(partes[2]), parseInt(partes[1]) - 1, parseInt(partes[0]));
}

// Mostrar resultados cuando se optimiza
function mostrarResultadosEnTab() {
    mostrarTab('resultados');
}

// Inicializar al cargar
window.addEventListener('DOMContentLoaded', () => {
    inicializarDatos();
    console.log('✅ Aplicación inicializada');
    console.log(`📊 Estado actual:`);
    console.log(`   - Operadores: ${operadores.length}`);
    console.log(`   - Posiciones: ${posiciones.length}`);
    console.log(`   - Ciclos: ${ciclos.length}`);

    // Verificar si hay datos guardados
    if (operadores.length > 0 || posiciones.length > 0 || ciclos.length > 0) {
        console.log('💾 Datos encontrados en almacenamiento local');
    }
});
