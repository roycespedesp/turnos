from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
import logging
from pathlib import Path
from api_turnos import router as turnos_router

# Configurar logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Crear instancia de FastAPI
app = FastAPI(
    title="Sistema de Gestión de Turnos Avanzado",
    description="API para optimización de turnos con ciclos de trabajo usando Google OR-Tools",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Incluir router de turnos avanzado
app.include_router(turnos_router)

# Servir archivos estáticos del frontend
frontend_dir = Path(__file__).parent.parent / "frontend"
if frontend_dir.exists():
    app.mount("/static", StaticFiles(directory=str(frontend_dir)), name="static")

@app.get("/")
async def root():
    """Servir el frontend principal"""
    frontend_path = frontend_dir / "index.html"
    if frontend_path.exists():
        return FileResponse(frontend_path)
    return {"message": "Sistema de Gestión de Turnos API", "docs": "/api/docs"}

@app.get("/health")
async def health_check():
    """Verificación de salud del servicio"""
    try:
        from ortools.linear_solver import pywraplp
        ortools_available = True
    except ImportError:
        ortools_available = False
    
    return {
        "status": "healthy",
        "service": "turnos-api-avanzado",
        "version": "2.0.0",
        "ortools_disponible": ortools_available
    }

@app.get("/info")
async def info():
    """Información del sistema"""
    return {
        "nombre": "Sistema de Gestión de Turnos Avanzado",
        "descripcion": "Optimización de turnos con ciclos de trabajo de 21 días",
        "características": [
            "Ciclos de trabajo/descanso de 21 días",
            "Turnos día/noche de 12 horas",
            "Gestión de vacaciones de 30 días",
            "Límite de horas anuales (2496h)",
            "Descansos pendientes",
            "Optimización con OR-Tools",
            "Exportación a Excel"
        ],
        "endpoints": {
            "optimizar": "/turnos/optimizar/",
            "estado": "/turnos/estado/{tarea_id}",
            "resultado": "/turnos/resultado/{tarea_id}",
            "descargar": "/turnos/descargar/{tarea_id}",
            "validar_datos": "/turnos/datos/validar",
            "validar_configuracion": "/turnos/configuracion/validar"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)