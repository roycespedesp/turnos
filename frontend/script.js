console.log('SCRIPT.JS CARGADO CORRECTAMENTE');

// Configuraciones globales
let configuraciones = {
    diasVacaciones: 30,
    limiteHoras: 2496,
    anoAnalisis: 2025,
    mesInicio: 1,
    limiteAcumuladoDiaNoche: 60,
    limiteDescansosPendientes: 5
};

// Datos de las tablas
let ciclos = [];
let posiciones = [];
let operadores = [];

// Datos predeterminados basados en las imágenes
const ciclosDefault = [
    { id_ciclo: "6×15", dias_trabajo: 6, dias_descanso: 15, ciclo_preferido: "No" },
    { id_ciclo: "7×14", dias_trabajo: 7, dias_descanso: 14, ciclo_preferido: "No" },
    { id_ciclo: "8×13", dias_trabajo: 8, dias_descanso: 13, ciclo_preferido: "No" },
    { id_ciclo: "9×12", dias_trabajo: 9, dias_descanso: 12, ciclo_preferido: "No" },
    { id_ciclo: "10×11", dias_trabajo: 10, dias_descanso: 11, ciclo_preferido: "No" },
    { id_ciclo: "11×10", dias_trabajo: 11, dias_descanso: 10, ciclo_preferido: "No" },
    { id_ciclo: "12×9", dias_trabajo: 12, dias_descanso: 9, ciclo_preferido: "No" },
    { id_ciclo: "13×8", dias_trabajo: 13, dias_descanso: 8, ciclo_preferido: "No" },
    { id_ciclo: "14×7", dias_trabajo: 14, dias_descanso: 7, ciclo_preferido: "No" },
    { id_ciclo: "15×6", dias_trabajo: 15, dias_descanso: 6, ciclo_preferido: "No" }
];

const posicionesDefault = [
    { id_posicion: "bocatoma_1", tipo_posicion: "bocatoma", op_requeridos: 1, turnos_diarios: 2 },
    { id_posicion: "bocatoma_2", tipo_posicion: "bocatoma", op_requeridos: 1, turnos_diarios: 2 },
    { id_posicion: "central_1", tipo_posicion: "central", op_requeridos: 1, turnos_diarios: 2 },
    { id_posicion: "central_2", tipo_posicion: "central", op_requeridos: 1, turnos_diarios: 2 }
];

const operadoresDefault = [
    { id_operador: "OP001", nombre: "Aguirre", posicion: "bocatoma", ciclo: "12×9", dia_ciclo_inicial: 8, turno_ciclo_inicial: "dia", vacaciones_inicio: "", vacaciones_fin: "" },
    { id_operador: "OP002", nombre: "Perez", posicion: "bocatoma", ciclo: "12×9", dia_ciclo_inicial: 1, turno_ciclo_inicial: "dia", vacaciones_inicio: "", vacaciones_fin: "" },
    { id_operador: "OP003", nombre: "Patricio", posicion: "central", ciclo: "12×9", dia_ciclo_inicial: 1, turno_ciclo_inicial: "noche", vacaciones_inicio: "", vacaciones_fin: "" },
    { id_operador: "OP004", nombre: "Calixto", posicion: "central", ciclo: "12×9", dia_ciclo_inicial: 8, turno_ciclo_inicial: "noche", vacaciones_inicio: "", vacaciones_fin: "" }
];

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    inicializarApp();
    cargarConfiguraciones();
    cargarDatos();
    showTab('configuraciones');
});

function inicializarApp() {
    // Intentar cargar datos desde caché primero
    const cacheLoaded = cargarDesdeCache();
    
    // Configurar event listeners para configuraciones
    document.getElementById('diasVacaciones').addEventListener('input', () => {
        guardarConfiguracionesAuto();
        guardarEnCache();
    });
    document.getElementById('limiteHoras').addEventListener('input', () => {
        guardarConfiguracionesAuto();
        guardarEnCache();
    });
    document.getElementById('anoAnalisis').addEventListener('input', () => {
        guardarConfiguracionesAuto();
        guardarEnCache();
    });
    document.getElementById('mesInicio').addEventListener('change', () => {
        guardarConfiguracionesAuto();
        guardarEnCache();
    });
    document.getElementById('limiteAcumuladoDiaNoche').addEventListener('input', () => {
        guardarConfiguracionesAuto();
        guardarEnCache();
    });
    document.getElementById('limiteDescansosPendientes').addEventListener('input', () => {
        guardarConfiguracionesAuto();
        guardarEnCache();
    });
    
    // Configurar event listeners para ciclos preferidos
    configurarEventListenersCiclos();
    
    // Configurar event listener para el botón de importar
    const btnImportar = document.querySelector('[data-modal-target="modalImportar"]');
    if (btnImportar) {
        // btnImportar.addEventListener('click', abrirModalImportar);
        console.log('Botón importar encontrado pero función abrirModalImportar no implementada');
    }
    
    if (cacheLoaded) {
        mostrarToast('Datos cargados desde caché', 'info');
    }
}

function configurarEventListenersCiclos() {
    // Agregar event listeners a todos los radio buttons de ciclos
    const radioButtons = document.querySelectorAll('input[name="ciclo_preferido"]');
    radioButtons.forEach(radio => {
        radio.addEventListener('change', function() {
            if (this.checked) {
                // Remover clase preferred-cycle de todas las filas
                document.querySelectorAll('tr.preferred-cycle').forEach(row => {
                    row.classList.remove('preferred-cycle');
                });
                
                // Agregar clase preferred-cycle a la fila seleccionada
                const selectedRow = this.closest('tr');
                selectedRow.classList.add('preferred-cycle');
                
                // Guardar la selección en localStorage
                const cicloPreferido = this.value;
                localStorage.setItem('ciclo_preferido', cicloPreferido);
                
                // Mostrar mensaje de confirmación
                mostrarToast(`Ciclo ${cicloPreferido} seleccionado como preferido`, 'success');
            }
        });
    });
}

// Sistema de pestañas
function showTab(tabName) {
    // Ocultar todas las pestañas
    const tabContents = document.querySelectorAll('.tab-content');
    tabContents.forEach(content => {
        content.classList.remove('active');
        content.style.display = 'none';
    });
    
    // Desactivar todos los botones de pestaña
    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
        button.classList.remove('active');
    });
    
    // Mostrar la pestaña seleccionada
    const selectedContent = document.getElementById(`content-${tabName}`);
    if (selectedContent) {
        selectedContent.classList.add('active');
        selectedContent.style.display = 'block';
    }
    
    // Activar el botón de la pestaña seleccionada
    const selectedButton = document.getElementById(`tab-${tabName}`);
    if (selectedButton) {
        selectedButton.classList.add('active');
    }
    
    // Cargar datos específicos de la pestaña
    if (tabName === 'ciclos') {
        cargarTablaCiclos();
        // Configurar event listeners para los radio buttons después de cargar la tabla
        setTimeout(() => {
            configurarEventListenersCiclos();
            cargarCicloPreferido();
        }, 100);
    } else if (tabName === 'posiciones') {
        cargarTablaPosiciones();
    } else if (tabName === 'operadores') {
        cargarTablaOperadores();
    }
}

// Gestión de configuraciones
function cargarConfiguraciones() {
    const configGuardadas = localStorage.getItem('configuraciones');
    if (configGuardadas) {
        configuraciones = JSON.parse(configGuardadas);
    }
    
    // Cargar valores con verificación de null
    const elementos = [
        'diasVacaciones', 'limiteHoras', 'anoAnalisis', 'mesInicio', 
        'limiteAcumuladoDiaNoche', 'limiteDescansosPendientes'
    ];
    
    elementos.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento && configuraciones[id] !== undefined) {
            elemento.value = configuraciones[id];
        }
    });
}

function guardarConfiguracionesAuto() {
    configuraciones.diasVacaciones = parseInt(document.getElementById('diasVacaciones').value);
    configuraciones.limiteHoras = parseInt(document.getElementById('limiteHoras').value);
    configuraciones.anoAnalisis = parseInt(document.getElementById('anoAnalisis').value);
    configuraciones.mesInicio = parseInt(document.getElementById('mesInicio').value);
    configuraciones.limiteAcumuladoDiaNoche = parseInt(document.getElementById('limiteAcumuladoDiaNoche').value);
    configuraciones.limiteDescansosPendientes = parseInt(document.getElementById('limiteDescansosPendientes').value);
    
    localStorage.setItem('configuraciones', JSON.stringify(configuraciones));
}

function guardarConfiguraciones() {
    guardarConfiguracionesAuto();
    mostrarToast('Configuraciones guardadas correctamente', 'success');
}

function resetearConfiguraciones() {
    configuraciones = {
        diasVacaciones: 30,
        limiteHoras: 2496,
        anoAnalisis: 2025,
        mesInicio: 1,
        limiteAcumuladoDiaNoche: 60,
        limiteDescansosPendientes: 5
    };
    
    // Resetear valores con verificación de null
    const elementos = [
        'diasVacaciones', 'limiteHoras', 'anoAnalisis', 'mesInicio', 
        'limiteAcumuladoDiaNoche', 'limiteDescansosPendientes'
    ];
    
    elementos.forEach(id => {
        const elemento = document.getElementById(id);
        if (elemento) {
            elemento.value = configuraciones[id];
        }
    });
    
    localStorage.removeItem('configuraciones');
    mostrarToast('Configuraciones reseteadas', 'info');
}

// Gestión de datos
function cargarDatos() {
    // Cargar ciclos
    const ciclosGuardados = localStorage.getItem('ciclos');
    if (ciclosGuardados) {
        ciclos = JSON.parse(ciclosGuardados);
    } else {
        ciclos = [...ciclosDefault];
        localStorage.setItem('ciclos', JSON.stringify(ciclos));
    }
    
    // Cargar posiciones
    const posicionesGuardadas = localStorage.getItem('posiciones');
    if (posicionesGuardadas) {
        posiciones = JSON.parse(posicionesGuardadas);
    } else {
        posiciones = [...posicionesDefault];
        localStorage.setItem('posiciones', JSON.stringify(posiciones));
    }
    
    // Cargar operadores
    const operadoresGuardados = localStorage.getItem('operadores');
    if (operadoresGuardados) {
        operadores = JSON.parse(operadoresGuardados);
    } else {
        operadores = [...operadoresDefault];
        localStorage.setItem('operadores', JSON.stringify(operadores));
    }
    
    // Cargar ciclo preferido
    cargarCicloPreferido();
}

function cargarCicloPreferido() {
    const cicloPreferido = localStorage.getItem('ciclo_preferido');
    if (cicloPreferido) {
        // Buscar y marcar el radio button correspondiente
        const radioButton = document.querySelector(`input[name="ciclo_preferido"][value="${cicloPreferido}"]`);
        if (radioButton) {
            radioButton.checked = true;
            // Agregar clase preferred-cycle a la fila
            const selectedRow = radioButton.closest('tr');
            selectedRow.classList.add('preferred-cycle');
        }
    }
}

// Gestión de tabla de ciclos
function cargarTablaCiclos() {
    const tbody = document.getElementById('ciclosTableBody');
    tbody.innerHTML = '';
    
    ciclos.forEach((ciclo, index) => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-700 hover:bg-gray-700';
        row.innerHTML = `
            <td class="px-6 py-4 font-medium text-white">${ciclo.id_ciclo}</td>
            <td class="px-6 py-4">${ciclo.dias_trabajo}</td>
            <td class="px-6 py-4">${ciclo.dias_descanso}</td>
            <td class="px-6 py-4">
                <select onchange="actualizarCicloPreferido(${index}, this.value)" 
                        class="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg p-2">
                    <option value="No" ${ciclo.ciclo_preferido === 'No' ? 'selected' : ''}>No</option>
                    <option value="Sí" ${ciclo.ciclo_preferido === 'Sí' ? 'selected' : ''}>Sí</option>
                </select>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function actualizarCicloPreferido(index, valor) {
    ciclos[index].ciclo_preferido = valor;
    localStorage.setItem('ciclos', JSON.stringify(ciclos));
    guardarEnCache();
    mostrarToast('Ciclo actualizado', 'success');
}

function eliminarCiclo(index) {
    if (confirm('¿Estás seguro de que quieres eliminar este ciclo?')) {
        ciclos.splice(index, 1);
        localStorage.setItem('ciclos', JSON.stringify(ciclos));
        cargarTablaCiclos();
        guardarEnCache();
        mostrarToast('Ciclo eliminado', 'info');
    }
}

function agregarCiclo() {
    const diasTrabajo = prompt('Días de trabajo:');
    const diasDescanso = prompt('Días de descanso:');
    
    if (diasTrabajo && diasDescanso) {
        const nuevoCiclo = {
            id_ciclo: `${diasTrabajo}×${diasDescanso}`,
            dias_trabajo: parseInt(diasTrabajo),
            dias_descanso: parseInt(diasDescanso),
            ciclo_preferido: 'No'
        };
        
        ciclos.push(nuevoCiclo);
        localStorage.setItem('ciclos', JSON.stringify(ciclos));
        cargarTablaCiclos();
        guardarEnCache();
        mostrarToast('Ciclo agregado', 'success');
    }
}

// Gestión de tabla de posiciones
function cargarTablaPosiciones() {
    const tbody = document.getElementById('posicionesTableBody');
    tbody.innerHTML = '';
    
    posiciones.forEach((posicion, index) => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-700 hover:bg-gray-700';
        row.innerHTML = `
            <td class="px-6 py-4 font-medium text-white">${posicion.id_posicion}</td>
            <td class="px-6 py-4">${posicion.id_tipo_posicion || posicion.tipo_posicion}</td>
            <td class="px-6 py-4">${posicion.op_requeridos}</td>
            <td class="px-6 py-4">${posicion.turnos_diarios}</td>
            <td class="px-6 py-4">
                <button onclick="editarPosicion(${index})" 
                        class="text-blue-400 hover:text-blue-300 mr-2 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                </button>
                <button onclick="eliminarPosicion(${index})" 
                        class="text-red-400 hover:text-red-300 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function agregarPosicion() {
    const idPosicion = prompt('ID de la posición:');
    const tipoPosicion = prompt('Tipo de posición:');
    const opRequeridos = prompt('Operadores requeridos:');
    const turnosDiarios = prompt('Turnos diarios:');
    
    if (idPosicion && tipoPosicion && opRequeridos && turnosDiarios) {
        const nuevaPosicion = {
            id_posicion: idPosicion,
            tipo_posicion: tipoPosicion,
            op_requeridos: parseInt(opRequeridos),
            turnos_diarios: parseInt(turnosDiarios)
        };
        
        posiciones.push(nuevaPosicion);
        localStorage.setItem('posiciones', JSON.stringify(posiciones));
        cargarTablaPosiciones();
        guardarEnCache();
        mostrarToast('Posición agregada', 'success');
    }
}

function editarPosicion(index) {
    const posicion = posiciones[index];
    const nuevoId = prompt('ID de la posición:', posicion.id_posicion);
    const nuevoTipo = prompt('Tipo de posición:', posicion.tipo_posicion);
    const nuevosOp = prompt('Operadores requeridos:', posicion.op_requeridos);
    const nuevosTurnos = prompt('Turnos diarios:', posicion.turnos_diarios);
    
    if (nuevoId && nuevoTipo && nuevosOp && nuevosTurnos) {
        posiciones[index] = {
            id_posicion: nuevoId,
            tipo_posicion: nuevoTipo,
            op_requeridos: parseInt(nuevosOp),
            turnos_diarios: parseInt(nuevosTurnos)
        };
        
        localStorage.setItem('posiciones', JSON.stringify(posiciones));
        cargarTablaPosiciones();
        guardarEnCache();
        mostrarToast('Posición actualizada', 'success');
    }
}

function eliminarPosicion(index) {
    if (confirm('¿Estás seguro de que quieres eliminar esta posición?')) {
        posiciones.splice(index, 1);
        localStorage.setItem('posiciones', JSON.stringify(posiciones));
        cargarTablaPosiciones();
        guardarEnCache();
        mostrarToast('Posición eliminada', 'info');
    }
}

// Gestión de tabla de operadores
function cargarTablaOperadores() {
    const tbody = document.getElementById('operadoresTableBody');
    tbody.innerHTML = '';
    
    if (operadores.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="12" class="px-6 py-8 text-center text-gray-400">
                <div class="flex flex-col items-center">
                    <svg class="w-12 h-12 mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"></path>
                    </svg>
                    <p class="text-lg font-medium">No hay operadores registrados</p>
                    <p class="text-sm">Agrega operadores manualmente o importa desde Excel</p>
                </div>
            </td>
        `;
        tbody.appendChild(row);
        return;
    }
    
    operadores.forEach((operador, index) => {
        const row = document.createElement('tr');
        row.className = 'border-b border-gray-700 hover:bg-gray-700';
        row.innerHTML = `
            <td class="px-6 py-4 font-medium text-white">${operador.id_operador || ''}</td>
            <td class="px-6 py-4">${operador.nombre || ''}</td>
            <td class="px-6 py-4">${operador.id_tipo_posicion || operador.tipo_posicion || ''}</td>
            <td class="px-6 py-4">${operador.id_posicion_inicial || operador.posicion_inicial || ''}</td>
            <td class="px-6 py-4">${operador.fecha_gen_vac || ''}</td>
            <td class="px-6 py-4">${operador.horas_laboradas || ''}</td>
            <td class="px-6 py-4">${operador.vac_pendientes || ''}</td>
            <td class="px-6 py-4">${operador.otra_posicion || ''}</td>
            <td class="px-6 py-4">${operador.ciclo_inicial || ''}</td>
            <td class="px-6 py-4">${operador.dia_ciclo_inicial || ''}</td>
            <td class="px-6 py-4">${operador.turno_ciclo_inicial || ''}</td>
            <td class="px-6 py-4">
                <button onclick="eliminarOperador(${index})" 
                        class="text-red-400 hover:text-red-300 transition-colors">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function agregarOperador() {
    const nombre = prompt('Nombre del operador:');
    if (nombre) {
        const nuevoOperador = {
            id_operador: `OP${operadores.length + 1}`,
            nombre: nombre,
            tipo_posicion: '',
            posicion_inicial: '',
            fecha_gen_vac: '',
            vac_pendientes: 0,
            otra_posicion: '',
            ciclo_inicial: '',
            dia_ciclo_inicial: ''
        };
        
        operadores.push(nuevoOperador);
        localStorage.setItem('operadores', JSON.stringify(operadores));
        cargarTablaOperadores();
        guardarEnCache();
        mostrarToast('Operador agregado', 'success');
    }
}

function eliminarOperador(index) {
    if (confirm('¿Estás seguro de que quieres eliminar este operador?')) {
        operadores.splice(index, 1);
        localStorage.setItem('operadores', JSON.stringify(operadores));
        cargarTablaOperadores();
        guardarEnCache();
        mostrarToast('Operador eliminado', 'info');
    }
}

// Variable global para almacenar los datos del Excel
let datosExcelCargados = [];

function cargarArchivoExcel(event) {
    const archivo = event.target.files[0];
    if (!archivo) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            
            // Tomar la primera hoja
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convertir a JSON
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            if (jsonData.length < 2) {
                mostrarToast('El archivo debe contener al menos una fila de encabezados y una fila de datos', 'warning');
                return;
            }

            // Procesar los datos
            procesarDatosExcel(jsonData);
            
        } catch (error) {
            console.error('Error al leer el archivo Excel:', error);
            mostrarToast('Error al leer el archivo Excel. Verifique que sea un archivo válido.', 'error');
        }
    };
    
    reader.readAsArrayBuffer(archivo);
}

function procesarDatosExcel(jsonData) {
    const nuevosOperadores = [];
    
    try {
        // Saltar la primera fila (encabezados) y procesar el resto
        for (let i = 1; i < jsonData.length; i++) {
            const fila = jsonData[i];
            
            // Verificar que la fila tenga datos
            if (fila && fila.length >= 9 && fila[0]) {
                const operador = {
                    id_operador: fila[0] ? String(fila[0]).trim() : `OP${operadores.length + nuevosOperadores.length + 1}`,
                    nombre: fila[1] ? String(fila[1]).trim() : '',
                    id_tipo_posicion: fila[2] ? String(fila[2]).trim() : '',
                    id_posicion_inicial: fila[3] ? String(fila[3]).trim() : '',
                    fecha_gen_vac: fila[4] ? String(fila[4]).trim() : '',
                    horas_laboradas: fila[5] ? parseInt(fila[5]) || 0 : 0,
                    vac_pendientes: fila[6] ? parseInt(fila[6]) || 0 : 0,
                    otra_posicion: fila[7] ? String(fila[7]).trim() : 'no',
                    ciclo_inicial: fila[8] ? String(fila[8]).trim() : '',
                    dia_ciclo_inicial: fila[9] ? parseInt(fila[9]) || null : null,
                    turno_ciclo_inicial: fila[10] ? String(fila[10]).trim() : ''
                };
                
                console.log(`Operador ${i}:`, operador);
                nuevosOperadores.push(operador);
            }
        }
        
        // Guardar los datos para previsualización
        datosExcelCargados = nuevosOperadores;
        
        // Mostrar previsualización
        mostrarPrevisualizacion(nuevosOperadores);
        
        // Habilitar el botón de importar
        document.getElementById('btnImportarExcel').disabled = false;
        
        mostrarToast(`Se cargaron ${nuevosOperadores.length} operadores para importar`, 'info');
        
    } catch (error) {
        console.error('Error al procesar datos del Excel:', error);
        mostrarToast('Error al procesar los datos del Excel. Verifique el formato.', 'error');
    }
}

function mostrarPrevisualizacion(operadores) {
    const tablaPreview = document.getElementById('tablaPreview');
    const previsualizacion = document.getElementById('previsualizacionImportar');
    
    // Limpiar tabla
    tablaPreview.innerHTML = '';
    
    // Mostrar solo los primeros 5 operadores para previsualización
    const operadoresPreview = operadores.slice(0, 5);
    
    operadoresPreview.forEach(operador => {
        const fila = document.createElement('tr');
        fila.innerHTML = `
            <td>${operador.id_operador}</td>
            <td>${operador.nombre}</td>
            <td>${operador.id_tipo_posicion}</td>
            <td>${operador.id_posicion_inicial}</td>
            <td>${operador.fecha_gen_vac}</td>
            <td>${operador.horas_laboradas}</td>
            <td>${operador.vac_pendientes}</td>
            <td>${operador.otra_posicion}</td>
            <td>${operador.ciclo_inicial}</td>
            <td>${operador.dia_ciclo_inicial || ''}</td>
            <td>${operador.turno_ciclo_inicial}</td>
        `;
        tablaPreview.appendChild(fila);
    });
    
    // Mostrar la previsualización
    previsualizacion.classList.remove('hidden');
    
    if (operadores.length > 5) {
        const filaInfo = document.createElement('tr');
        filaInfo.innerHTML = `<td colspan="11" class="text-center text-gray-500">... y ${operadores.length - 5} operadores más</td>`;
        tablaPreview.appendChild(filaInfo);
    }
}

function importarOperadoresExcel() {
    if (datosExcelCargados.length === 0) {
        mostrarToast('No hay datos para importar', 'warning');
        return;
    }
    
    try {
        // Agregar los operadores a la lista principal
        operadores.push(...datosExcelCargados);
        
        // Actualizar la tabla
        cargarTablaOperadores();
        
        // Cerrar modal y limpiar
        cerrarModal();
        limpiarFormularioImportacion();
        
        // Guardar en caché
        guardarEnCache();
        
        mostrarToast(`Se importaron ${datosExcelCargados.length} operadores correctamente`, 'success');
        
    } catch (error) {
        console.error('Error al importar operadores:', error);
        mostrarToast('Error al importar los operadores', 'error');
    }
}

function limpiarFormularioImportacion() {
    const archivoExcel = document.getElementById('archivoExcel');
    const btnImportarExcel = document.getElementById('btnImportarExcel');
    const previsualizacionImportar = document.getElementById('previsualizacionImportar');
    
    if (archivoExcel) archivoExcel.value = '';
    if (btnImportarExcel) btnImportarExcel.disabled = true;
    if (previsualizacionImportar) previsualizacionImportar.classList.add('hidden');
    
    datosExcelCargados = [];
}

function descargarPlantillaExcel() {
    try {
        // Crear los datos de la plantilla
        const encabezados = [
            'id_operador',
            'nombre', 
            'id_tipo_posicion',
            'id_posicion_inicial',
            'fecha_gen_vac',
            'horas_laboradas',
            'vac_pendientes',
            'otra_posicion',
            'ciclo_inicial',
            'dia_ciclo_inicial',
            'turno_ciclo_inicial'
        ];
        
        // Datos de ejemplo
        const datosEjemplo = [
            [
                '46781909',
                'AGUIRRE HUAYRA JUAN ANTONIO',
                'central',
                'central_1',
                '25/01/2021',
                0,
                0,
                'no',
                '12x9',
                19,
                'DESCANSO'
            ],
            [
                '70239370',
                'PEREZ CARDENAS CHRISTIAN DANNY',
                'central',
                'central_1',
                '21/05/2019',
                0,
                30,
                'no',
                '12x9',
                12,
                'NOCHE'
            ],
            [
                '70237797',
                'PATRICIO CHAVEZ WALDIR',
                'central',
                'central_1',
                '21/05/2019',
                0,
                0,
                'no',
                '12x9',
                5,
                'DIA'
            ]
        ];
        
        // Combinar encabezados con datos de ejemplo
        const datosCompletos = [encabezados, ...datosEjemplo];
        
        // Crear el libro de trabajo
        const workbook = XLSX.utils.book_new();
        const worksheet = XLSX.utils.aoa_to_sheet(datosCompletos);
        
        // Ajustar el ancho de las columnas
        const columnWidths = [
            { wch: 12 }, // id_operador
            { wch: 35 }, // nombre
            { wch: 15 }, // id_tipo_posicion
            { wch: 18 }, // id_posicion_inicial
            { wch: 15 }, // fecha_gen_vac
            { wch: 15 }, // horas_laboradas
            { wch: 15 }, // vac_pendientes
            { wch: 15 }, // otra_posicion
            { wch: 12 }, // ciclo_inicial
            { wch: 15 }, // dia_ciclo_inicial
            { wch: 18 }  // turno_ciclo_inicial
        ];
        worksheet['!cols'] = columnWidths;
        
        // Agregar la hoja al libro
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Operadores');
        
        // Generar el archivo y descargarlo
        const fechaActual = new Date().toISOString().split('T')[0];
        const nombreArchivo = `plantilla_operadores_${fechaActual}.xlsx`;
        
        XLSX.writeFile(workbook, nombreArchivo);
        
        mostrarToast('Plantilla Excel descargada correctamente', 'success');
        
    } catch (error) {
        console.error('Error al generar la plantilla Excel:', error);
        mostrarToast('Error al generar la plantilla Excel', 'error');
    }
}

// Funcionalidad de pegar desde Excel (mantener para compatibilidad)


function cerrarModal() {
    const modals = document.querySelectorAll('.fixed.inset-0');
    modals.forEach(modal => {
        modal.remove();
    });
    
    // También cerrar modales estáticos
    const modalImportar = document.getElementById('modalImportar');
    if (modalImportar) {
        modalImportar.classList.add('hidden');
    }
}



// Funciones de validación para importación de operadores

// Validar DNI (debe ser numérico y tener 8 dígitos)
function validarDNI(dni) {
    const dniRegex = /^\d{8}$/;
    return dniRegex.test(dni);
}

// Validar fecha en formato dd/mm/aaaa
function validarFecha(fecha) {
    if (!fecha) return false;
    const fechaRegex = /^\d{1,2}\/\d{1,2}\/\d{4}$/;
    if (!fechaRegex.test(fecha)) return false;
    
    const partes = fecha.split('/');
    const dia = parseInt(partes[0]);
    const mes = parseInt(partes[1]);
    const año = parseInt(partes[2]);
    
    if (mes < 1 || mes > 12) return false;
    if (dia < 1 || dia > 31) return false;
    if (año < 1900 || año > 2100) return false;
    
    return true;
}

// Validar que el tipo de posición existe en las posiciones configuradas
function validarTipoPositcion(tipoPositcion) {
    // Permitir "op_vacaciones" como tipo especial para operadores de vacaciones
    if (tipoPositcion === "op_vacaciones") {
        return true;
    }
    
    const tiposValidos = [...new Set(posiciones.map(p => p.tipo_posicion))];
    return tiposValidos.includes(tipoPositcion);
}

// Validar que la posición inicial existe en las posiciones configuradas
function validarPositcionInicial(posicionInicial) {
    // Permitir la posición especial "op_vacaciones" para operadores de vacaciones
    if (posicionInicial === "op_vacaciones") {
        return true;
    }
    
    const posicionesValidas = posiciones.map(p => p.id_posicion);
    return posicionesValidas.includes(posicionInicial);
}

// Validar que el ciclo inicial existe en los ciclos configurados
function validarCicloInicial(cicloInicial) {
    const ciclosValidos = ciclos.map(c => c.id_ciclo);
    
    // Normalizar el ciclo de entrada: convertir 'x' a '×'
    const cicloNormalizado = cicloInicial.replace(/x/gi, '×');
    
    // Verificar si existe el ciclo normalizado
    return ciclosValidos.includes(cicloNormalizado);
}

// Validar número entero positivo
function validarNumeroEntero(valor) {
    const numero = parseInt(valor);
    return !isNaN(numero) && numero >= 0;
}

// Validar respuesta sí/no
function validarSiNo(valor) {
    const valorLower = valor.toLowerCase();
    return valorLower === 'sí' || valorLower === 'si' || valorLower === 'no';
}

function validarTurnoCicloInicial(turno) {
    const turnosValidos = ['DIA', 'NOCHE', 'DESCANSO'];
    return turno && turnosValidos.includes(turno.toUpperCase());
}

// Función principal de validación de operador
function validarOperador(operador, numeroLinea) {
    const errores = [];
    
    // Validar DNI
    if (!operador.id_operador) {
        errores.push(`Línea ${numeroLinea}: El DNI es obligatorio`);
    } else if (!validarDNI(operador.id_operador)) {
        errores.push(`Línea ${numeroLinea}: El DNI "${operador.id_operador}" debe ser un número de 8 dígitos`);
    }
    
    // Validar nombre
    if (!operador.nombre || operador.nombre.trim().length < 2) {
        errores.push(`Línea ${numeroLinea}: El nombre es obligatorio y debe tener al menos 2 caracteres`);
    }
    
    // Validar tipo de posición
    if (!operador.id_tipo_posicion) {
        errores.push(`Línea ${numeroLinea}: El tipo de posición es obligatorio`);
    } else if (!validarTipoPositcion(operador.id_tipo_posicion)) {
        const tiposDisponibles = [...new Set(posiciones.map(p => p.tipo_posicion))];
        errores.push(`Línea ${numeroLinea}: El tipo de posición "${operador.id_tipo_posicion}" no existe. Tipos disponibles: ${tiposDisponibles.join(', ')}`);
    }
    
    // Validar posición inicial
    if (!operador.id_posicion_inicial) {
        errores.push(`Línea ${numeroLinea}: La posición inicial es obligatoria`);
    } else if (!validarPositcionInicial(operador.id_posicion_inicial)) {
        const posicionesDisponibles = posiciones.map(p => p.id_posicion);
        errores.push(`Línea ${numeroLinea}: La posición inicial "${operador.id_posicion_inicial}" no existe. Posiciones disponibles: ${posicionesDisponibles.join(', ')}`);
    }
    
    // Validar fecha de generación de vacaciones
    if (operador.fecha_gen_vac && !validarFecha(operador.fecha_gen_vac)) {
        errores.push(`Línea ${numeroLinea}: La fecha de generación de vacaciones "${operador.fecha_gen_vac}" debe estar en formato dd/mm/aaaa`);
    }
    
    // Validar horas laboradas
    if (operador.horas_laboradas && !validarNumeroEntero(operador.horas_laboradas)) {
        errores.push(`Línea ${numeroLinea}: Las horas laboradas "${operador.horas_laboradas}" deben ser un número entero positivo`);
    }
    
    // Validar vacaciones pendientes
    if (operador.vac_pendientes && !validarNumeroEntero(operador.vac_pendientes)) {
        errores.push(`Línea ${numeroLinea}: Las vacaciones pendientes "${operador.vac_pendientes}" deben ser un número entero positivo`);
    }
    
    // Validar otra posición
    if (operador.otra_posicion && !validarSiNo(operador.otra_posicion)) {
        errores.push(`Línea ${numeroLinea}: El campo "otra posición" "${operador.otra_posicion}" debe ser "sí" o "no"`);
    }
    
    // Validar ciclo inicial
    if (!operador.ciclo_inicial) {
        errores.push(`Línea ${numeroLinea}: El ciclo inicial es obligatorio`);
    } else if (!validarCicloInicial(operador.ciclo_inicial)) {
        const ciclosDisponibles = ciclos.map(c => c.id_ciclo);
        errores.push(`Línea ${numeroLinea}: El ciclo inicial "${operador.ciclo_inicial}" no existe. Ciclos disponibles: ${ciclosDisponibles.join(', ')}`);
    }
    
    // Validar día del ciclo inicial
    if (operador.dia_ciclo_inicial && !validarNumeroEntero(operador.dia_ciclo_inicial)) {
        errores.push(`Línea ${numeroLinea}: El día del ciclo inicial "${operador.dia_ciclo_inicial}" debe ser un número entero positivo`);
    }
    
    // Validar turno del ciclo inicial
    if (operador.turno_ciclo_inicial && !validarTurnoCicloInicial(operador.turno_ciclo_inicial)) {
        errores.push(`Línea ${numeroLinea}: El turno del ciclo inicial "${operador.turno_ciclo_inicial}" debe ser "DIA", "NOCHE" o "DESCANSO"`);
    }
    
    return errores;
}



// Función de prueba
function testFunction() {
    alert('Función de prueba ejecutada');
    console.log('FUNCIÓN DE PRUEBA EJECUTADA');
}

// Optimización de turnos
async function optimizarTurnos() {
    try {
        console.log('🚀 Iniciando optimización de turnos...');
        mostrarSpinner(true);
        
        // Validar que hay datos suficientes
        if (operadores.length === 0) {
            mostrarToast('⚠️  No hay operadores registrados. Importa o agrega operadores primero.', 'warning');
            mostrarSpinner(false);
            return;
        }
        
        if (posiciones.length === 0) {
            mostrarToast('⚠️  No hay posiciones definidas.', 'warning');
            mostrarSpinner(false);
            return;
        }
        
        // Preparar datos para el backend
        const payload = prepararDatosParaBackend();
        
        console.log('📤 Enviando datos al backend:', payload);
        
        // Enviar solicitud de optimización
        const response = await fetch('http://localhost:8000/turnos/optimizar/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || `Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('✅ Respuesta recibida:', data);
        
        if (data.tarea_id) {
            mostrarToast('⏳ Optimización iniciada. Verificando progreso...', 'info');
            
            // Verificar estado de la optimización
            const resultado = await verificarEstadoOptimizacion(data.tarea_id);
            
            mostrarSpinner(false);
            
            if (resultado.factible) {
                mostrarToast('✅ Optimización completada exitosamente', 'success');
                mostrarResultados(resultado, data.tarea_id);
            } else {
                mostrarToast('❌ La optimización no encontró una solución factible', 'error');
                mostrarErrores(resultado);
            }
        } else {
            throw new Error('No se recibió ID de tarea del servidor');
        }
        
    } catch (error) {
        console.error('❌ Error en optimización:', error);
        mostrarSpinner(false);
        mostrarToast(`❌ Error: ${error.message}`, 'error');
        
        // Mostrar error en el área de resultados
        const contenedor = document.getElementById('contenidoResultados');
        if (contenedor) {
            contenedor.innerHTML = `
                <div class="bg-red-900/20 border border-red-500 rounded-lg p-6">
                    <h3 class="text-red-400 font-semibold mb-2">❌ Error en la optimización</h3>
                    <p class="text-gray-300">${error.message}</p>
                    <p class="text-gray-400 text-sm mt-2">Revisa la consola para más detalles.</p>
                </div>
            `;
        }
    }
}

function prepararDatosParaBackend() {
    // Obtener ciclo preferido
    const cicloPreferidoInput = document.querySelector('input[name="ciclo_preferido"]:checked');
    const cicloPreferidoValue = cicloPreferidoInput ? cicloPreferidoInput.value : "12x9";
    
    // Marcar el ciclo preferido
    const ciclosConPreferido = ciclos.map(ciclo => ({
        ...ciclo,
        ciclo_preferido: ciclo.id_ciclo === cicloPreferidoValue ? "Sí" : "No"
    }));
    
    return {
        configuracion: {
            dias_vacaciones: configuraciones.diasVacaciones,
            limite_horas_anuales: configuraciones.limiteHoras,
            ano_analisis: configuraciones.anoAnalisis,
            mes_inicio_analisis: configuraciones.mesInicio,
            limite_acumulado_dia_noche: configuraciones.limiteAcumuladoDiaNoche,
            limite_descansos_pendientes: configuraciones.limiteDescansosPendientes
        },
        ciclos: ciclosConPreferido,
        posiciones: posiciones.map(pos => ({
            id_posicion: pos.id_posicion,
            tipo_posicion: pos.tipo_posicion || pos.id_tipo_posicion,
            op_requeridos: pos.op_requeridos,
            turnos_diarios: pos.turnos_diarios || 2
        })),
        operadores: operadores.map(op => ({
            id_operador: op.id_operador,
            nombre: op.nombre,
            id_tipo_posicion: op.id_tipo_posicion || op.tipo_posicion,
            id_posicion_inicial: op.id_posicion_inicial || op.posicion_inicial,
            fecha_gen_vac: op.fecha_gen_vac || null,
            horas_laboradas: parseInt(op.horas_laboradas) || 0,
            vac_pendientes: parseInt(op.vac_pendientes) || 0,
            otra_posicion: op.otra_posicion || "No",
            ciclo_inicial: op.ciclo_inicial,
            dia_ciclo_inicial: op.dia_ciclo_inicial ? parseInt(op.dia_ciclo_inicial) : null,
            turno_ciclo_inicial: op.turno_ciclo_inicial ? op.turno_ciclo_inicial.toUpperCase() : "DIA",
            id_cal: op.id_cal || null
        }))
    };
}

// Función para verificar el estado de la optimización
async function verificarEstadoOptimizacion(tareaId) {
    const maxIntentos = 60; // 5 minutos máximo
    const intervalo = 5000; // 5 segundos
    
    for (let intento = 0; intento < maxIntentos; intento++) {
        try {
            const response = await fetch(`http://localhost:8000/turnos/estado/${tareaId}`);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }
            
            const estado = await response.json();
            
            if (estado.completado) {
                // Obtener resultado completo
                const resultadoResponse = await fetch(`http://localhost:8000/turnos/resultado/${tareaId}`);
                
                if (!resultadoResponse.ok) {
                    throw new Error(`Error al obtener resultado: ${resultadoResponse.status}`);
                }
                
                return await resultadoResponse.json();
            }
            
            // Actualizar mensaje de progreso
            mostrarToast(`Optimización en progreso: ${estado.estado}`, 'info');
            
            // Esperar antes del siguiente intento
            await new Promise(resolve => setTimeout(resolve, intervalo));
            
        } catch (error) {
            console.error('Error verificando estado:', error);
            throw error;
        }
    }
    
    throw new Error('Tiempo de espera agotado para la optimización');
}

function mostrarResultados(resultado, tareaId) {
    const contenedor = document.getElementById('contenidoResultados');
    if (contenedor) {
        contenedor.innerHTML = `
            <div class="table-container" style="background-color: var(--gray-800); border: 1px solid var(--gray-700); border-radius: 0.5rem; padding: 1.5rem;">
                <div style="display: flex; align-items: center; justify-content: space-between;">
                    <div style="display: flex; align-items: center; gap: 0.75rem;">
                        <svg style="width: 1.5rem; height: 1.5rem; color: #10b981; flex-shrink: 0;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <div>
                            <h3 style="font-size: 1rem; font-weight: 600; color: var(--gray-100); margin: 0;">Optimización Completada</h3>
                            <p style="font-size: 0.875rem; color: var(--gray-400); margin: 0.25rem 0 0 0;">Cronograma generado exitosamente</p>
                        </div>
                    </div>
                    <button 
                        onclick="descargarExcel('${tareaId}')"
                        class="btn btn-primary"
                        style="white-space: nowrap;">
                        <svg style="width: 1rem; height: 1rem;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        Descargar Excel
                    </button>
                </div>
            </div>
        `;
    }
}

// Función para descargar el Excel
function descargarExcel(tareaId) {
    console.log(`📥 Descargando Excel para tarea: ${tareaId}`);
    
    // Crear un link temporal para descargar
    const url = `http://localhost:8000/turnos/descargar/${tareaId}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = `cronograma_${tareaId}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    mostrarNotificacion('Descarga iniciada', 'El archivo Excel se está descargando...', 'success');
}

function mostrarErrores(resultado) {
    const contenedor = document.getElementById('contenidoResultados');
    if (contenedor) {
        contenedor.innerHTML = `
            <h2 class="text-xl font-semibold text-white mb-4">❌ Error en Optimización</h2>
            <div class="bg-gray-700 rounded-lg p-6">
                <div class="mb-4">
                    <h3 class="text-lg font-medium text-red-400 mb-2">Mensaje</h3>
                    <p class="text-gray-300">${resultado.mensaje}</p>
                </div>
                
                ${resultado.errores && resultado.errores.length > 0 ? `
                <div class="mb-4">
                    <h3 class="text-lg font-medium text-red-400 mb-2">Errores</h3>
                    <ul class="list-disc list-inside text-gray-300">
                        ${resultado.errores.map(error => `<li>${error}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
                
                ${resultado.advertencias && resultado.advertencias.length > 0 ? `
                <div class="mb-4">
                    <h3 class="text-lg font-medium text-yellow-400 mb-2">Advertencias</h3>
                    <ul class="list-disc list-inside text-gray-300">
                        ${resultado.advertencias.map(advertencia => `<li>${advertencia}</li>`).join('')}
                    </ul>
                </div>
                ` : ''}
            </div>
        `;
    }
}

// Utilidades
function mostrarSpinner(mostrar) {
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        if (mostrar) {
            loadingOverlay.classList.remove('hidden');
        } else {
            loadingOverlay.classList.add('hidden');
        }
    }
    console.log('Spinner:', mostrar ? 'mostrar' : 'ocultar');
}

function mostrarToast(mensaje, tipo = 'info') {
    const toast = document.createElement('div');
    const colores = {
        success: 'bg-green-600',
        error: 'bg-red-600',
        info: 'bg-blue-600',
        warning: 'bg-yellow-600'
    };
    
    toast.className = `fixed top-4 right-4 ${colores[tipo]} text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-opacity`;
    toast.textContent = mensaje;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// ===== FUNCIONES DE CACHÉ Y RESETEO =====

// Función para guardar todos los datos en caché
function guardarEnCache() {
    const datosCache = {
        configuraciones: configuraciones,
        ciclos: ciclos,
        posiciones: posiciones,
        // NO guardar operadores - siempre empezar vacío
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('sistemaGestionTurnos', JSON.stringify(datosCache));
    console.log('Datos guardados en caché (sin operadores):', datosCache);
}

// Función para cargar datos desde caché
function cargarDesdeCache() {
    try {
        const datosCache = localStorage.getItem('sistemaGestionTurnos');
        if (datosCache) {
            const datos = JSON.parse(datosCache);
            
            // Cargar configuraciones
            if (datos.configuraciones) {
                configuraciones = { ...configuraciones, ...datos.configuraciones };
            }
            
            // Cargar ciclos
            if (datos.ciclos && Array.isArray(datos.ciclos)) {
                ciclos = datos.ciclos;
            }
            
            // Cargar posiciones
            if (datos.posiciones && Array.isArray(datos.posiciones)) {
                posiciones = datos.posiciones;
            }
            
            // Operadores siempre vacíos al recargar
            operadores = [];
            
            console.log('Datos cargados desde caché (sin operadores):', datos);
            return true;
        }
    } catch (error) {
        console.error('Error al cargar datos desde caché:', error);
    }
    return false;
}

// Función para resetear todos los datos
function resetearTodosDatos() {
    if (confirm('¿Estás seguro de que quieres resetear todos los datos? Esta acción no se puede deshacer.')) {
        // Limpiar TODOS los localStorage relacionados
        localStorage.removeItem('sistemaGestionTurnos');
        localStorage.removeItem('operadores');
        localStorage.removeItem('ciclos');
        localStorage.removeItem('posiciones');
        localStorage.removeItem('configuraciones');
        localStorage.removeItem('ciclo_preferido');
        
        // Resetear variables a valores por defecto
        configuraciones = {
            diasVacaciones: 30,
            limiteHoras: 2496,
            anoAnalisis: 2025,
            mesInicio: 1
        };
        
        ciclos = [...ciclosDefault];
        posiciones = [...posicionesDefault];
        operadores = [];
        
        // Guardar el estado reseteado en localStorage
        guardarEnCache();
        
        // Limpiar resultados
        const contenidoResultados = document.getElementById('contenidoResultados');
        if (contenidoResultados) {
            contenidoResultados.innerHTML = `
                <svg class="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                </svg>
                <h3>Sin resultados</h3>
                <p>Los resultados de la optimización aparecerán aquí una vez que ejecutes el proceso.</p>
            `;
        }
        
        // Recargar todas las interfaces
        cargarConfiguraciones();
        cargarTablaCiclos();
        cargarTablaPosiciones();
        cargarTablaOperadores();
        
        mostrarToast('Todos los datos han sido reseteados', 'success');
    }
}

// Función para obtener parámetros para el backend
function obtenerParametrosParaBackend() {
    console.log('Operadores disponibles:', operadores);
    console.log('Ciclos disponibles:', ciclos);
    console.log('Posiciones disponibles:', posiciones);
    
    const parametros = {
        configuracion: {
            dias_vacaciones: configuraciones.diasVacaciones,
            limite_horas_anuales: configuraciones.limiteHoras,
            ano_analisis: configuraciones.anoAnalisis,
            mes_inicio_analisis: configuraciones.mesInicio,
            limite_acumulado_dia_noche: configuraciones.limiteAcumuladoDiaNoche,
            limite_descansos_pendientes: configuraciones.limiteDescansosPendientes
        },
        
        ciclos: ciclos.map(ciclo => ({
            id_ciclo: ciclo.id_ciclo,
            dias_trabajo: ciclo.dias_trabajo,
            dias_descanso: ciclo.dias_descanso,
            ciclo_preferido: ciclo.ciclo_preferido || "No"
        })),
        
        posiciones: posiciones.map(posicion => ({
            id_posicion: posicion.id_posicion,
            tipo_posicion: posicion.tipo_posicion,
            op_requeridos: posicion.op_requeridos,
            turnos_diarios: posicion.turnos_diarios || 2
        })),
        
        operadores: operadores.map(operador => ({
            id_operador: operador.id_operador,
            nombre: operador.nombre,
            id_tipo_posicion: operador.posicion,
            id_posicion_inicial: operador.posicion,
            fecha_gen_vac: operador.vacaciones_inicio || null,
            horas_laboradas: 0,
            vac_pendientes: 0,
            otra_posicion: "No",
            ciclo_inicial: operador.ciclo,
            dia_ciclo_inicial: operador.dia_ciclo_inicial || 1,
            turno_ciclo_inicial: (operador.turno_ciclo_inicial === "dia") ? "DIA" : "NOCHE",
            id_cal: null
        }))
    };
    
    return parametros;
}