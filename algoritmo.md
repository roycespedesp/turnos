Objetivo
Describir y organizar toda la estructura necesaria para desarrollar un algoritmo que optimice la gestión de turnos, garantizando eficiencia y productividad.
Variables
Las variables se definirán en hojas de cálculo con el mismo nombre, y el detalle son sus respectivas columnas, con excepción de configuraciones en la que cada configuración está en la columna A, el input en la columna B, y la primera está ocupada por los títulos: Parámetro, Valor, Descripción
Configuraciones
Días de vacaciones ganadas: cantidad de días de vacaciones ganadas por cada año laborado
Límite de horas anuales: Límite de horas máximas que puede trabajar un operador en el año, esta variable es la más importante porque no puede ser superada. Solo en caso de que se supere dentro de un ciclo de trabajo, este será el último ciclo de trabajo del operador.
Mes de inicio de análisis: Indica a partir de qué mes (1-12) se inicia la optimización en el algoritmo
Año de análisis: Indica el año que se analizará
Turnos
Siempre serán dos turnos por posición, Día y Noche.
Un operador no puede trabajar más de 60% de día o de noche, es por eso que el algoritmo deberá regular que no se exceda este indicador.
Un operador solo puede tomar un turno por día. Cada turno son de 12 horas siempre.
Ciclos
id_ciclo: id del ciclo, los ciclos siempre serán de 21 días, no puede haber un ciclo con un día diferente de días. Además los ciclos siempre deben empezar con turno día y terminar en turno noche. Lo importante es entender que una vez que se cambia a turno noche, ya no se puede regresar a turno día, haciendo que un ciclo de trabajo tenga tres partes: trabajando día, trabajando noche, descansando.
dias_trabajo: cantidad de días de trabajo en el ciclo
dias_descanso: cantidad de días de descanso en el ciclo
ciclo_preferido: indica si el ciclo es el preferido para el algoritmo que ayudará a regular los ciclos posteriores y a calcular los descansos pendientes


Posiciones
id_posicion: id de posición
id_tipo_posicion: tipo de posición que engloba las posiciones
op_requeridos: cantidad de operadores requeridos por esa posición
turnos_diarios: cantidad de turnos por día en esa posición


Operadores
id_operador: id del operador
nombre: nombre del operador
id_tipo_posicion: relaciona al operador con el tipo de posición
id_posicion_inicial: es la posición en la que inicia y la sugerida para que ocupe. Aquí se define la posición inicial en la que trabaja, pero también hay una posición que se llama: op_vacaciones que identifica a los operadores que reemplazan en vacaciones a los demás operadores regulares, entiendo como operadores regulares a los que no tienen una posición inicial op_vacaciones.
fecha_gen_vac: es la fecha en la que se genera nuevas vacaciones. Es importante entender que las vacaciones se deben tomar seguidas y siempre serán 30 días corridos. Esta fecha además permite ver el día que se generan las vacaciones nuevas.
horas_laboradas: en caso (Mes de inicio de análisis) sea diferente de 1, se necesita colocar la cantidad de horas laboradas para el cálculo de horas acumuladas por ciclo
vac_pendientes: cantidad de vacaciones que tiene pendiente por recuperar, estas vacaciones no se pueden acumular con las vacaciones generadas, siempre se tienen que consumir antes que las vacaciones nuevas generadas en fecha_gen_vac.
otra_posicion: configura si el operador puede ser programado en otro tipo de posición diferente a la que tiene asignada
ciclo_inicial: es el ciclo con el que inicia el algoritmo
dia_ciclo_inicial: es el día del ciclo con el que inicia el algoritmo, ejemplo: si ciclo_inicial es 14x7 y dia_ciclo_inicial es 11, esto quiere que decir que está empezando en el 11/21 trabajando.
id_cal: es el indicador para el calendario



Relación entre variables y características
Objetivos del algoritmo y prioridades:
Límite de horas anuales, nunca se deberá superar a menos que se supere dentro de un ciclo, haciendo que este ciclo sea el último, pero el algoritmo deberá calcular el mejor ciclo final para que complete correctamente las horas de trabajo anuales.
Reducir al mínimo los huecos de programación. Un hueco en la programación implica que una posición x no esté cubierta en un día ambos turnos, día y noche. El método de validación para decir que en un día una posición está cubierta es evidenciar que la posición ha cubierto los dos turnos, día y noche, ese día. Caso contrario podríamos decir que es un hueco. Las herramientas que tiene el algoritmo para conseguir reducir al mínimo los huecos son:
Cambios de ciclos, el algoritmo podrá realizar cambios de ciclos para cubrir huecos, ejemplo si un operador está trabajando en un ciclo 14x7 y en el siguiente necesita un ciclo de 12x9 para poder cubrir un posible hueco que deja otro operador. Y así con todos los operadores, se podrá usar el cambio de ciclo para evitar al máximo los huecos. Estos cambios de ciclo generarán días de descanso pendientes cuando el ciclo que se escoja tiene más días trabajando que el ciclo preferido o sea se deberán recuperar con ciclos posteriores con menos carga. Caso contrario, es el operador el que deberá días de descanso que deberá devolver con ciclos posteriores con mayor carga de días trabajados que el ciclo preferido.
Permitir duplicidades, es pos de evitar los huecos se pueden permitir duplicidades en caso no haya forma de cubrir el hueco y sí se pueda cubrir con alguna duplicidad mínima. Se define como duplicidad mínima a tratar de evitarlas y buscar el arreglo más óptimo porque eso impacta en costo.
Usar al operador de vacaciones cuando el algoritmo defina que es momento de que salgan de vacaciones los operadores para que no acumulen más de 30 días de vacaciones.
Días de vacaciones ganadas ser relaciona con fecha_gen_vac ya que define la cantidad de días de vacaciones que el operador deberá tomar, estas siempre se deberán tomar de corrido los 30 días ininterrumpidos. Estas vacaciones se generan al día siguiente de la fecha_gen_vac. Ejemplo: fecha_gen_vac = 25/01/2021 y se está analizando el año 2025, esto quiere decir que el día 26/01/2025 el operador en mención tendrá 30 días de vacaciones que deberán ser programadas dentro del mismo año tomando en cuenta (Ciclos posteriores para tomar vacaciones). Las vacaciones solo pueden interrumpidas por el cierre del año, o sea que si las vacaciones se programan el 08/12/2025 el día 31/12/2025 tendrá vacaciones pendiente para el siguiente año, por ende sus 30 vacaciones programadas no están completas, pero este es el único caso permitido.
Mes de inicio de análisis ayudará al algoritmo a saber desde qué mes iniciará a proyectar, en caso que este parámetro sea diferente a 1, tendrá que utilizar la información de la hoja operadores, específicamente horas_laboradas, la cual indica cuantas horas ya viene trabajando previamente. Lo mismo para Año de análisis, define el año.
Con respecto a los ciclos, todos deben de ser de 21 días, no existe un ciclo que no tenga 21 días. Un ciclo se compone siempre por días trabajando y días de descanso. Dentro de los días trabajando hay dos grupos, primero los turno día y luego los turno noche. Siempre se empieza un ciclo con turno día y luego con turno noche.
Ciclo preferido, servirá para calcular los días de descanso pendientes, estos se ganan o se deben en función al ciclo siguiente, ejemplo: si el ciclo preferido es 12x9, y el algoritmo define que es mejor para cumplir el objetivo que el operador tome un ciclo 8x13, esto quiere que se le debe 4 días de descanso pendiente, porque 8-12 = -4 entonces esto quiere decir que siempre se compara el ciclo actual con el ciclo posterior para el cálculo. Esto quiere decir que esos 4 días se tendrán que devolver con ciclos posteriores con mayor días de trabajo, porque el operador debe días de descanso, en caso que el operador tenga ciclos con mayor días de trabajo que el ciclo preferido, entonces se le deberá devolver con ciclos posteriores con menor días de trabajo.
Sobre los operadores es importante entender que existe un id_posicion_inicial que se llama op_vacaciones, esto significa que será utilizando como reemplazo en vacaciones siempre en el puesto relacionado a id_tipo_posicion, o sea si es de central no puede ser bocatoma. Además dia_ciclo_inicial se refiere al día en el que inicia el ciclo de trabajo en el primer día de análisis. Ejemplo: si un operador tiene seteado un ciclo inicial de 14x7 y dia_ciclo_inicial 6, esto quiere decir que el primer día de análisis empieza el día 6/21 de su ciclo.


Output
Esta hoja la creará el algoritmo automáticamente, además de crear una opción en el menú que diga Generar turno, para luego seleccionar mostrar una opción que diga Seleccionar Tipo Posición, en la cual el usuario deberá ingresar el tipo de posición que desea proyectar.
Cronograma
Fecha: es la fecha del día.
id_operador: el id del operador.
Nombre: nombre del operador
Posición: posición que está ocupando ese día
Estado: aquí los 4 posibles estados son:
t.dia, cuando está trabajando en turno día
t.noche, cuando está trabajando en turno noche
descansando, cuando está descansando en su ciclo
vacaciones, cuando está en sus 30 días de vacaciones.
Estado2: tiene una lógica relacionada a Estado:
t.dia, TD
t.noche,TN
descansando, DE
vacaciones, VC
Ciclo: el tipo de ciclo en el que se encuentra.
Día del ciclo: el día del ciclo, ejemplo 6/21 o 20/21, pero cuando está de vacaciones sale 4/30 o 18/30, trabajando en ciclo la base es 21, de vacaciones la base es 30.
Descansos pendientes: la cantidad de descansos pendientes que tiene, es un campo calculado que se va acumulando y recalculando en cada nuevo ciclo del operador.
Vacaciones pendientes: la cantidad de vacaciones pendientes. Que se pueden obtener de vac_pendientes en operadores, o cuando se supera fecha_gen_vacse generarán 30 días de vacaciones nuevas.
Horas Acumuladas Ciclo: son las horas acumuladas que tiene durante su ciclo de trabajo, termina siendo días trabajados del ciclo por horas del turno.
Horas Acumuladas Año: son las horas acumuladas que tiene durante su ciclo de trabajo, termina siendo días trabajados del año por horas del turno.
Horas Acumuladas Año Día: aquí se van acumulando las horas de trabajo realizadas en el turno día.
% hora dia, porcentaje de horas trabajadas en turno día vs el total de horas trabajadas.
Horas Acumuladas Año Noche: termina siendo días trabajados del ciclo por horas del turno.
% hora noche, porcentaje de horas trabajadas en turno noche vs el total de horas trabajadas.
Observaciones, esta son las observaciones y pueden ser del siguiente tipo: Duplicidad en posición x (turno), o las que el algoritmo crea conveniente.
Merge1: es un merge de Posición,Mes,Día,Estado2
Merge2: es un merge de NombreMesDía
Prog: Es el id_cal que sale en la tabla de operadores, que se deberá mostrar en cada fila.


