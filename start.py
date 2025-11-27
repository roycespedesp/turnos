#!/usr/bin/env python3
"""
Script de inicio rápido para el Sistema de Gestión de Turnos
Ejecutar: python start.py
"""

import os
import sys
import subprocess
import webbrowser
import time
from pathlib import Path

def check_python_version():
    """Verifica que la versión de Python sea compatible"""
    if sys.version_info < (3, 8):
        print("❌ Error: Se requiere Python 3.8 o superior")
        print(f"   Versión actual: {sys.version}")
        sys.exit(1)
    print(f"✅ Python {sys.version.split()[0]} - Compatible")

def check_dependencies():
    """Verifica e instala dependencias si es necesario"""
    requirements_file = Path("backend/requirements.txt")
    
    if not requirements_file.exists():
        print("❌ Error: No se encontró el archivo requirements.txt")
        sys.exit(1)
    
    print("📦 Verificando dependencias...")
    
    try:
        # Intentar importar las dependencias principales
        import fastapi
        import uvicorn
        import pydantic
        print("✅ Dependencias principales encontradas")
    except ImportError:
        print("📥 Instalando dependencias...")
        try:
            subprocess.check_call([
                sys.executable, "-m", "pip", "install", "-r", 
                str(requirements_file)
            ])
            print("✅ Dependencias instaladas correctamente")
        except subprocess.CalledProcessError:
            print("❌ Error al instalar dependencias")
            print("   Intenta ejecutar manualmente: pip install -r backend/requirements.txt")
            sys.exit(1)

def start_server():
    """Inicia el servidor FastAPI"""
    backend_dir = Path("backend")
    
    if not backend_dir.exists():
        print("❌ Error: No se encontró el directorio backend")
        sys.exit(1)
    
    main_file = backend_dir / "main.py"
    if not main_file.exists():
        print("❌ Error: No se encontró main.py en el directorio backend")
        sys.exit(1)
    
    print("🚀 Iniciando servidor...")
    print("   URL: http://localhost:8000")
    print("   Presiona Ctrl+C para detener el servidor")
    print("-" * 50)
    
    # Cambiar al directorio backend y ejecutar
    os.chdir(backend_dir)
    
    try:
        # Abrir navegador después de un breve delay
        import threading
        def open_browser():
            time.sleep(2)
            webbrowser.open("http://localhost:8000")
        
        browser_thread = threading.Thread(target=open_browser)
        browser_thread.daemon = True
        browser_thread.start()
        
        # Ejecutar servidor
        subprocess.run([sys.executable, "main.py"])
        
    except KeyboardInterrupt:
        print("\n🛑 Servidor detenido por el usuario")
    except Exception as e:
        print(f"❌ Error al iniciar servidor: {e}")
        sys.exit(1)

def show_banner():
    """Muestra banner de bienvenida"""
    banner = """
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║           🏢 SISTEMA DE GESTIÓN DE TURNOS 🏢                ║
║                                                              ║
║  Un sistema completo para optimizar la asignación de        ║
║  empleados a turnos de trabajo con interfaz web moderna     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
    """
    print(banner)

def show_help():
    """Muestra información de ayuda"""
    help_text = """
🔧 COMANDOS DISPONIBLES:

  python start.py          - Iniciar el sistema completo
  python start.py --help   - Mostrar esta ayuda
  python start.py --check  - Solo verificar dependencias

📁 ESTRUCTURA DEL PROYECTO:

  backend/                 - Código del servidor FastAPI
  frontend/                - Interfaz web (HTML, CSS, JS)
  README.md               - Documentación completa

🌐 ACCESO AL SISTEMA:

  Una vez iniciado, el sistema estará disponible en:
  http://localhost:8000

📖 FUNCIONALIDADES:

  ✅ Gestión de empleados
  ✅ Gestión de turnos
  ✅ Configuración de restricciones
  ✅ Optimización automática de asignaciones
  ✅ Interfaz web responsiva

🆘 SOPORTE:

  - Revisar README.md para documentación completa
  - Verificar logs en la consola para errores
  - Asegurar que el puerto 8000 esté disponible
    """
    print(help_text)

def main():
    """Función principal"""
    # Verificar argumentos de línea de comandos
    if len(sys.argv) > 1:
        if "--help" in sys.argv or "-h" in sys.argv:
            show_banner()
            show_help()
            return
        elif "--check" in sys.argv:
            show_banner()
            print("🔍 Verificando sistema...")
            check_python_version()
            check_dependencies()
            print("✅ Sistema listo para usar")
            return
    
    # Inicio normal
    show_banner()
    
    print("🔍 Verificando sistema...")
    check_python_version()
    check_dependencies()
    
    print("\n🎯 Todo listo! Iniciando sistema...")
    time.sleep(1)
    
    start_server()

if __name__ == "__main__":
    main()