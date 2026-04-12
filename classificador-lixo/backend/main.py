import io
import os
import base64
import time
import numpy as np
import joblib
from datetime import datetime

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image
from skimage.transform import resize
from skimage.feature import hog

from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, Text, DateTime
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.exc import OperationalError

# ─── App ────────────────────────────────────────────────────────────────────

app = FastAPI(title="Backend - Classificador de Lixo")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Banco de dados ──────────────────────────────────────────────────────────

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost:5432/lixo_db")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(bind=engine)
Base = declarative_base()


class HistoricoModel(Base):
    __tablename__ = "historico"

    id          = Column(Integer, primary_key=True, index=True)
    filename    = Column(String(255))
    classe      = Column(String(50))
    label       = Column(String(100))
    emoji       = Column(String(10))
    confianca   = Column(Float)
    reciclavel  = Column(Boolean)
    lixeira     = Column(String(100))
    imagem_b64  = Column(Text)
    criado_em   = Column(DateTime, default=datetime.utcnow)


# ─── Modelo de IA ────────────────────────────────────────────────────────────

CLASSES = ["cardboard", "glass", "metal", "paper", "plastic", "trash"]

CLASS_INFO = {
    "cardboard": {"label": "Papelão",    "emoji": "📦", "reciclavel": True,  "lixeira": "Lixeira Azul"},
    "glass":     {"label": "Vidro",      "emoji": "🍾", "reciclavel": True,  "lixeira": "Lixeira Verde"},
    "metal":     {"label": "Metal",      "emoji": "🔩", "reciclavel": True,  "lixeira": "Lixeira Amarela"},
    "paper":     {"label": "Papel",      "emoji": "📄", "reciclavel": True,  "lixeira": "Lixeira Azul"},
    "plastic":   {"label": "Plástico",   "emoji": "🧴", "reciclavel": True,  "lixeira": "Lixeira Vermelha"},
    "trash":     {"label": "Lixo Comum", "emoji": "🗑️", "reciclavel": False, "lixeira": "Lixeira Cinza"},
}

IMG_SIZE = (128, 128)
pipeline = None


def extrair_hog(imagem: np.ndarray) -> np.ndarray:
    img = resize(imagem, IMG_SIZE, anti_aliasing=True)
    return hog(img, orientations=9, pixels_per_cell=(16, 16),
               cells_per_block=(2, 2), channel_axis=-1)


# ─── Startup ─────────────────────────────────────────────────────────────────

@app.on_event("startup")
async def startup():
    global pipeline

    # Aguarda o PostgreSQL ficar pronto
    for tentativa in range(20):
        try:
            Base.metadata.create_all(bind=engine)
            print("Banco de dados conectado!")
            break
        except OperationalError:
            print(f"Aguardando banco de dados... ({tentativa + 1}/20)")
            time.sleep(3)

    # Carrega o modelo
    if os.path.exists("model.pkl"):
        pipeline = joblib.load("model.pkl")
        print("Modelo carregado!")
    else:
        print("AVISO: model.pkl não encontrado.")


# ─── Endpoints ───────────────────────────────────────────────────────────────

@app.get("/health")
async def health():
    return {"status": "ok", "modelo_carregado": pipeline is not None}


@app.post("/classificar")
async def classificar(file: UploadFile = File(...)):
    if pipeline is None:
        return JSONResponse({"erro": "Modelo não carregado."}, status_code=503)

    contents = await file.read()

    # Classificação
    imagem = np.array(Image.open(io.BytesIO(contents)).convert("RGB"))
    features = extrair_hog(imagem).reshape(1, -1)
    probabilidades = pipeline.predict_proba(features)[0]
    idx = int(np.argmax(probabilidades))
    classe = CLASSES[idx]
    confianca = round(float(probabilidades[idx]), 4)
    info = CLASS_INFO[classe]

    todas_classes = {
        CLASSES[i]: {"probabilidade": round(float(probabilidades[i]), 4), **CLASS_INFO[CLASSES[i]]}
        for i in range(len(CLASSES))
    }

    # Thumbnail para salvar no banco (reduz tamanho)
    thumb = Image.open(io.BytesIO(contents)).convert("RGB")
    thumb.thumbnail((300, 300))
    buf = io.BytesIO()
    thumb.save(buf, format="JPEG", quality=75)
    imagem_b64 = base64.b64encode(buf.getvalue()).decode()

    # Salva no banco
    db = SessionLocal()
    try:
        registro = HistoricoModel(
            filename=file.filename,
            classe=classe,
            label=info["label"],
            emoji=info["emoji"],
            confianca=confianca,
            reciclavel=info["reciclavel"],
            lixeira=info["lixeira"],
            imagem_b64=imagem_b64,
        )
        db.add(registro)
        db.commit()
    finally:
        db.close()

    return {
        "classe": classe,
        "label": info["label"],
        "emoji": info["emoji"],
        "confianca": confianca,
        "reciclavel": info["reciclavel"],
        "lixeira": info["lixeira"],
        "todas_classes": todas_classes,
    }


@app.get("/historico")
async def historico():
    db = SessionLocal()
    try:
        registros = db.query(HistoricoModel).order_by(HistoricoModel.criado_em.desc()).all()
        return [
            {
                "id": r.id,
                "filename": r.filename,
                "classe": r.classe,
                "label": r.label,
                "emoji": r.emoji,
                "confianca": r.confianca,
                "reciclavel": r.reciclavel,
                "lixeira": r.lixeira,
                "imagem_b64": r.imagem_b64,
                "criado_em": r.criado_em.isoformat(),
            }
            for r in registros
        ]
    finally:
        db.close()


@app.delete("/historico")
async def limpar_historico():
    db = SessionLocal()
    try:
        db.query(HistoricoModel).delete()
        db.commit()
        return {"mensagem": "Histórico apagado com sucesso."}
    finally:
        db.close()
