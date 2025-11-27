# Optimizador de Turnos - Versión Standalone

Versión completamente standalone (sin backend) del optimizador de turnos. Todo funciona en el navegador.

## 🚀 Uso Rápido

1. **Abrir `index.html` en tu navegador**
   - No necesitas servidor, simplemente abre el archivo
   - Funciona en Chrome, Firefox, Safari, Edge (navegadores modernos)

2. **Hacer clic en "Optimizar Turnos"**
   - La optimización se ejecuta en el navegador
   - Verás los resultados en una tabla

3. **Visualizar el cronograma**
   - Tabla con todos los turnos
   - Filtros por operador y fecha
   - Estadísticas resumidas

## 📁 Archivos

- `index.html` - Interfaz principal
- `optimizer.js` - Lógica de optimización (portada de Python)
- `app.js` - Manejo de UI y datos
- `README.md` - Este archivo

## ✨ Características

- ✅ **Sin servidor**: Todo funciona en el navegador
- ✅ **Optimización completa**: Misma lógica que la versión Python
- ✅ **Visualización en tabla**: Cronograma completo con filtros
- ✅ **Estadísticas**: Resumen de turnos, vacaciones, etc.
- ✅ **Sin dependencias externas**: Solo Tailwind CSS (CDN)

## 🔧 Configuración

Puedes modificar los datos de ejemplo en `app.js`:

```javascript
// En función inicializarDatosEjemplo()
operadores = [
    {
        id_operador: "...",
        nombre: "...",
        // ... más campos
    }
];
```

## 📊 Próximos Pasos

- [ ] Agregar generación de Excel (SheetJS)
- [ ] Permitir importar datos desde Excel
- [ ] Exportar resultados

## 🐛 Notas

- La optimización puede tardar 2-5 segundos para un año completo
- Los datos se pierden al recargar la página (no hay persistencia)
- Funciona mejor con menos de 10 operadores (para rendimiento)

