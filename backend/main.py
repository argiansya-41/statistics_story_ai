from google import genai
from google.genai import types
from groq import Groq
import os
import io
import json
import math
import re
import base64
from datetime import datetime, timedelta, timezone
from contextlib import asynccontextmanager
from typing import Generator, Any

import bcrypt
import jwt
import pandas as pd
from scipy import stats
from dotenv import load_dotenv
from fastapi import Depends, FastAPI, HTTPException, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy import (
    Boolean, DateTime, ForeignKey, Integer, JSON, String, Text,
    create_engine, func, select,
)
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import (
    DeclarativeBase, Mapped, Session, mapped_column, sessionmaker,
)


ENV_PATH = os.path.join(os.path.dirname(__file__), ".env")
if os.path.exists(ENV_PATH):
    load_dotenv(dotenv_path=ENV_PATH, override=True)
else:
    load_dotenv(override=True)


def get_ai_config():
    if os.path.exists(ENV_PATH):
        load_dotenv(dotenv_path=ENV_PATH, override=True)
    else:
        load_dotenv(override=True)

    gem_key = (os.getenv("GEMINI_API_KEY") or "").strip() or None
    gem_model = (os.getenv("GEMINI_MODEL") or "gemini-2.5-flash").strip()
    groq_key = (os.getenv("GROQ_API_KEY") or "").strip() or None
    groq_model = (os.getenv("GROQ_MODEL") or "openai/gpt-oss-120b").strip()

    g_client = genai.Client(api_key=gem_key) if gem_key else None
    q_client = Groq(api_key=groq_key) if groq_key else None
    return g_client, q_client, gem_key, groq_key, gem_model, groq_model


def generate_with_gemini(prompt: str) -> str:
    g_client, _, gem_key, _, gem_model, _ = get_ai_config()
    if not g_client:
        raise RuntimeError("GEMINI_API_KEY belum dikonfigurasi.")

    candidate_models = [gem_model, "gemini-2.5-flash", "gemini-3.8-flash", "gemini-flash-latest"]
    seen = set()
    models_to_try = [m for m in candidate_models if not (m in seen or seen.add(m))]

    last_exc = None
    for model_name in models_to_try:
        try:
            response = g_client.models.generate_content(
                model=model_name,
                contents=prompt,
            )
            if response and response.text:
                return response.text.strip()
        except Exception as exc:
            last_exc = exc
            err_str = str(exc)
            if "404" in err_str or "NOT_FOUND" in err_str:
                continue
            raise

    if last_exc:
        raise last_exc
    raise RuntimeError("Gemini tidak menghasilkan teks.")


def generate_with_groq(prompt: str) -> str:
    _, q_client, _, groq_key, _, groq_model = get_ai_config()
    if not q_client:
        raise RuntimeError("GROQ_API_KEY belum dikonfigurasi.")

    candidate_models = [groq_model, "openai/gpt-oss-120b", "openai/gpt-oss-20b", "qwen/qwen3.8-27b"]
    seen = set()
    models_to_try = [m for m in candidate_models if not (m in seen or seen.add(m))]

    last_exc = None
    for model_name in models_to_try:
        try:
            response = q_client.chat.completions.create(
                model=model_name,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "Kamu adalah asisten ahli edukasi statistik dan data storyteller senior untuk Statistics Story AI. "
                            "Tugasmu menyusun laporan narasi statistik profesional yang mengalir, elegan, dan mendalam. "
                            "DILARANG membuat tabel markdown (|) atau tabel ASCII. "
                            "DILARANG mengulang definisi kamus dasar (seperti 'Mean adalah jumlah data dibagi n'). "
                            "Fokus pada wawasan praktis, perbandingan antar data, dinamika distribusi, dan storytelling ilmiah."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_completion_tokens=2000,
            )
            content = response.choices[0].message.content
            if content and content.strip():
                return content.strip()
        except Exception as exc:
            last_exc = exc
            err_str = str(exc)
            if "404" in err_str or "model_not_found" in err_str:
                continue
            raise

    if last_exc:
        raise last_exc
    raise RuntimeError("Groq tidak menghasilkan teks.")


def generate_with_openrouter(prompt: str) -> str:
    if os.path.exists(ENV_PATH):
        load_dotenv(dotenv_path=ENV_PATH, override=True)
    else:
        load_dotenv(override=True)

    api_key = (os.getenv("OPENROUTER_API_KEY") or "").strip()
    model = (os.getenv("OPENROUTER_MODEL") or "nvidia/nemotron-3-ultra-550b-a55").strip()
    if not api_key:
        raise RuntimeError("OPENROUTER_API_KEY belum dikonfigurasi.")

    import urllib.request
    import urllib.error

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": "Kamu adalah asisten ahli edukasi statistik dan data storyteller senior untuk Statistics Story AI. Buat narasi profesional, jelas, dan mendalam. Jangan membuat tabel Markdown atau mengarang nilai statistik."},
            {"role": "user", "content": prompt},
        ],
        "temperature": 0.3,
        "max_tokens": 2000,
    }
    request = urllib.request.Request(
        "https://openrouter.ai/api/v1/chat/completions",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=90) as response:
            result = json.loads(response.read().decode("utf-8"))
        content = result.get("choices", [{}])[0].get("message", {}).get("content")
        if isinstance(content, str) and content.strip():
            return content.strip()
        raise RuntimeError("OpenRouter tidak menghasilkan teks.")
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"OpenRouter HTTP {exc.code}: {detail[:500]}") from exc
    except urllib.error.URLError as exc:
        raise RuntimeError(f"OpenRouter gagal terhubung: {exc.reason}") from exc


_gemini_cooldown_until: datetime | None = None


def generate_with_ai(prompt: str) -> str:
    global _gemini_cooldown_until
    errors = []
    g_client, q_client, gem_key, groq_key, _, _ = get_ai_config()
    openrouter_key = (os.getenv("OPENROUTER_API_KEY") or "").strip() or None

    now = datetime.now(timezone.utc)
    gemini_available = bool(g_client)
    if _gemini_cooldown_until and now < _gemini_cooldown_until:
        gemini_available = False

    if gemini_available:
        try:
            return generate_with_gemini(prompt)
        except Exception as exc:
            err_msg = str(exc)
            errors.append(f"Gemini: {err_msg}")
            if "429" in err_msg or "RESOURCE_EXHAUSTED" in err_msg:
                _gemini_cooldown_until = now + timedelta(minutes=30)
                print(f"Gemini kuota habis, beralih ke Groq selama 30 menit. Error: {err_msg}")
            else:
                print(f"Gemini gagal, mencoba Groq: {err_msg}")

    if q_client:
        try:
            return generate_with_groq(prompt)
        except Exception as exc:
            errors.append(f"Groq: {exc}")
            print(f"Groq gagal, mencoba OpenRouter: {exc}")

    if openrouter_key:
        try:
            return generate_with_openrouter(prompt)
        except Exception as exc:
            errors.append(f"OpenRouter: {exc}")
            print(f"OpenRouter juga gagal: {exc}")

    if not g_client and not q_client and not openrouter_key:
        raise RuntimeError(
            "API AI belum dikonfigurasi. Isi GEMINI_API_KEY, GROQ_API_KEY, atau OPENROUTER_API_KEY."
        )
    raise RuntimeError("Semua layanan AI gagal. " + " | ".join(errors))


def extract_table_from_image(image_bytes: bytes, mime_type: str = "image/png") -> list[dict]:
    """
    Ekstrak data tabel dari gambar menggunakan Gemini Vision atau Groq Vision.
    Mengembalikan list of dicts (format baris data tabular).
    """
    g_client, q_client, gem_key, groq_key, gem_model, groq_model = get_ai_config()

    prompt = (
        "Kamu adalah pakar OCR dan ekstraksi data statistik presisi tinggi. "
        "Periksa gambar ini secara cermat. Gambar ini menampilkan tabel data atau angka untuk analisis statistik. "
        "Tugasmu adalah mengekstrak seluruh baris dan kolom data tabel dari gambar ini menjadi JSON array of objects yang valid. "
        "Setiap object mewakili 1 baris data, dengan key adalah nama kolom/header dan value adalah nilai sel "
        "(konversi menjadi angka float atau int jika berupa angka, atau string jika teks/kategori). "
        "DILARANG menambahkan teks pengantar atau penutup apapun. "
        "Kembalikan HANYA JSON array valid seperti contoh berikut: "
        '[{"kolom1": 10.5, "kolom2": 20}, {"kolom1": 12.0, "kolom2": 22}]'
    )

    raw_text = None
    last_err = None

    # 1. Coba Gemini Vision
    if g_client:
        candidate_models = [gem_model, "gemini-2.5-flash", "gemini-3.8-flash", "gemini-flash-latest"]
        for m in candidate_models:
            try:
                part = types.Part.from_bytes(data=image_bytes, mime_type=mime_type)
                resp = g_client.models.generate_content(
                    model=m,
                    contents=[part, prompt],
                )
                if resp and resp.text:
                    raw_text = resp.text.strip()
                    break
            except Exception as e:
                last_err = e
                continue

    # 2. Coba Groq Vision jika Gemini belum menghasilkan teks
    if not raw_text and q_client:
        b64_img = base64.b64encode(image_bytes).decode("utf-8")
        vision_models = ["meta-llama/llama-4-scout-vision", "llama-3.2-11b-vision-preview", "llama-3.2-90b-vision-preview"]
        for vm in vision_models:
            try:
                resp = q_client.chat.completions.create(
                    model=vm,
                    messages=[
                        {
                            "role": "user",
                            "content": [
                                {"type": "text", "text": prompt},
                                {
                                    "type": "image_url",
                                    "image_url": {"url": f"data:{mime_type};base64,{b64_img}"},
                                },
                            ],
                        }
                    ],
                    temperature=0.1,
                    max_completion_tokens=2500,
                )
                if resp.choices and resp.choices[0].message.content:
                    raw_text = resp.choices[0].message.content.strip()
                    break
            except Exception as e:
                last_err = e
                continue

    if not raw_text:
        if last_err:
            raise RuntimeError(f"Gagal mengekstrak tabel dari gambar: {last_err}")
        raise RuntimeError("Layanan AI Vision belum siap. Periksa GEMINI_API_KEY atau GROQ_API_KEY.")

    # Parsing JSON dari teks hasil AI
    text_clean = re.sub(r"^```(?:json)?\s*", "", raw_text, flags=re.MULTILINE)
    text_clean = re.sub(r"\s*```$", "", text_clean, flags=re.MULTILINE).strip()

    # Cari blok JSON array [...]
    match = re.search(r"\[\s*\{.*\}\s*\]", text_clean, re.DOTALL)
    if match:
        text_clean = match.group(0)

    try:
        data = json.loads(text_clean)
        if isinstance(data, list) and len(data) > 0 and isinstance(data[0], dict):
            cleaned_rows = []
            for row in data:
                cleaned_row = {}
                for k, v in row.items():
                    k_str = str(k).strip()
                    if v is not None:
                        if isinstance(v, (int, float)):
                            cleaned_row[k_str] = v
                        else:
                            try:
                                num = float(str(v).replace(",", ".").strip())
                                cleaned_row[k_str] = int(num) if num.is_integer() else num
                            except ValueError:
                                cleaned_row[k_str] = str(v).strip()
                    else:
                        cleaned_row[k_str] = ""
                cleaned_rows.append(cleaned_row)
            return cleaned_rows
    except Exception as parse_err:
        raise ValueError(f"Hasil ekstraksi gambar bukan format JSON tabel yang valid: {parse_err}")

    raise ValueError("Tidak ada data baris tabel yang berhasil diekstrak dari gambar.")



def make_contoh_kasus(result: dict, lang: str = "id") -> list[str]:
    if not result:
        return []

    language = "Bahasa Indonesia" if lang == "id" else "English"

    prompt = f"""
Kamu adalah asisten edukasi statistik untuk Statistics Story AI.

Buat 2 sampai 3 contoh kasus atau analogi dunia nyata
yang relevan dengan hasil analisis statistik berikut.

Ketentuan:
1. Gunakan bahasa yang mudah dipahami mahasiswa.
2. Gunakan {language}.
3. Sesuaikan analogi dengan jenis analisis dan variabel.
4. Jangan mengubah atau mengarang nilai statistik.
5. Korelasi tidak membuktikan sebab-akibat.
6. Prediksi regresi bukan jaminan.
7. Kembalikan hanya JSON array berisi string.
8. Jangan gunakan Markdown atau blok kode.

Hasil analisis:
{json.dumps(result, ensure_ascii=False, indent=2)}
"""

    try:
        response_text = generate_with_ai(prompt).strip()

        if response_text.startswith("```"):
            response_text = response_text.split("\n", 1)[1]
            if response_text.endswith("```"):
                response_text = response_text[:-3].strip()

        examples = json.loads(response_text)

        if isinstance(examples, list):
            examples = [
                value.strip()
                for value in examples
                if isinstance(value, str) and value.strip()
            ]

            if examples:
                return examples[:3]

        raise ValueError("Format contoh kasus tidak valid.")

    except Exception as exc:
        # Jangan menyamarkan kegagalan AI dengan contoh template.
        print(f"AI case study error (tanpa fallback template): {exc}")
        return []

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./statistics_story_ai.db")
SECRET_KEY = os.getenv("SECRET_KEY", "statistics_story_ai_super_secret_jwt_key_2025")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
FRONTEND_ORIGINS = os.getenv(
    "FRONTEND_ORIGINS",
    "http://localhost:3000,http://127.0.0.1:3000",
)

if not DATABASE_URL:
    DATABASE_URL = "sqlite:///./statistics_story_ai.db"
if not SECRET_KEY:
    SECRET_KEY = "statistics_story_ai_super_secret_jwt_key_2025"

if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(
        DATABASE_URL,
        connect_args={"check_same_thread": False},
    )
else:
    engine = create_engine(DATABASE_URL, pool_pre_ping=True)

SessionLocal = sessionmaker(
    bind=engine, autoflush=False, expire_on_commit=False
)


class Base(DeclarativeBase):
    pass


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(
        String(30), default="student", nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )


class Analysis(Base):
    __tablename__ = "analyses"

    id_analisis: Mapped[int] = mapped_column(
        Integer, primary_key=True, index=True
    )
    id_pengguna: Mapped[int] = mapped_column(
        ForeignKey("users.id"), nullable=False, index=True
    )
    nama_sesi: Mapped[str] = mapped_column(String(150), nullable=False)
    jenis_analisis: Mapped[str | None] = mapped_column(
        String(50), nullable=True
    )
    status: Mapped[str] = mapped_column(
        String(30), default="draf", nullable=False
    )
    tanggal: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    disimpan: Mapped[bool] = mapped_column(
        Boolean, default=False, nullable=False
    )
    format_data: Mapped[str | None] = mapped_column(
        String(20), nullable=True
    )
    sumber_input: Mapped[str | None] = mapped_column(
        String(30), nullable=True
    )
    nama_dataset: Mapped[str | None] = mapped_column(
        String(255), nullable=True
    )
    data_json: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    config_json: Mapped[dict | None] = mapped_column(JSON, nullable=True)
    hasil_json: Mapped[dict | list | None] = mapped_column(JSON, nullable=True)
    narasi_id: Mapped[str | None] = mapped_column(Text, nullable=True)
    narasi_en: Mapped[str | None] = mapped_column(Text, nullable=True)


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="Statistics Story AI API",
    description="API pembelajaran analisis statistik.",
    version="1.1.0-ai-narrative",
    lifespan=lifespan,
)

origins = [
    origin.strip()
    for origin in FRONTEND_ORIGINS.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r'^https?://(localhost|127\.0\.0\.1)(:\d+)?$',
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class RegisterRequest(BaseModel):
    nama: str | None = Field(default=None, max_length=150)
    name: str | None = Field(default=None, max_length=150)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    role: str | None = Field(default="student")


class RefreshTokenRequest(BaseModel):
    refresh_token: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1, max_length=128)


class CreateAnalysisRequest(BaseModel):
    nama_sesi: str = Field(default="Analisis baru", min_length=1, max_length=150)


class ConfigRequest(BaseModel):
    jenis_analisis: str
    config_json: dict[str, Any] = Field(default_factory=dict)


class NarrativeRequest(BaseModel):
    lang: str = "id"


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def hash_password(password: str) -> str:
    return bcrypt.hashpw(
        password.encode("utf-8"), bcrypt.gensalt()
    ).decode("utf-8")


def verify_password(password: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(
            password.encode("utf-8"), hashed.encode("utf-8")
        )
    except (ValueError, TypeError):
        return False


def create_token(user: User) -> str:
    now = datetime.now(timezone.utc)
    payload = {
        "sub": str(user.id),
        "email": user.email,
        "iat": now,
        "exp": now + timedelta(days=7),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def user_response(user: User) -> dict:
    return {
        "id": user.id,
        "id_pengguna": user.id,
        "nama": user.name,
        "name": user.name,
        "email": user.email,
        "role": user.role,
    }


def get_current_user(
    request: Request,
    db: Session = Depends(get_db),
) -> User:
    token = (
        request.cookies.get("access_token")
        or request.cookies.get("session")
        or request.cookies.get("session_token")
    )

    auth_header = request.headers.get("Authorization", "")
    if not token and auth_header.lower().startswith("bearer "):
        token = auth_header[7:].strip()

    if not token:
        raise HTTPException(
            status_code=401,
            detail="Silakan login terlebih dahulu.",
        )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = int(payload["sub"])
    except (jwt.InvalidTokenError, ValueError, KeyError, TypeError):
        raise HTTPException(
            status_code=401, detail="Sesi login tidak valid."
        )

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=401, detail="Pengguna tidak ditemukan."
        )
    return user


def get_owned_analysis(
    analysis_id: int,
    user: User,
    db: Session,
) -> Analysis:
    analysis = db.get(Analysis, analysis_id)
    if not analysis or analysis.id_pengguna != user.id:
        raise HTTPException(
            status_code=404, detail="Analisis tidak ditemukan."
        )
    return analysis


def analysis_response(item: Analysis) -> dict:
    return {
        "id_analisis": item.id_analisis,
        "id_pengguna": item.id_pengguna,
        "nama_sesi": item.nama_sesi,
        "jenis_analisis": item.jenis_analisis,
        "status": item.status,
        "tanggal": item.tanggal.isoformat() if item.tanggal else None,
        "disimpan": item.disimpan,
        "format_data": item.format_data,
        "sumber_input": item.sumber_input,
        "nama_dataset": item.nama_dataset,
        "config_json": item.config_json,
    }


def clean_value(value):
    if value is None:
        return None
    if isinstance(value, (int, str, bool)):
        return value
    if isinstance(value, float):
        return value if math.isfinite(value) else None
    if hasattr(value, "item"):
        return clean_value(value.item())
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def records_from_dataframe(df: pd.DataFrame) -> list[dict]:
    df = df.astype(object).where(pd.notna(df), None)
    return [
        {str(key): clean_value(value) for key, value in row.items()}
        for row in df.to_dict(orient="records")
    ]


def dataframe_from_analysis(item: Analysis) -> pd.DataFrame:
    data = item.data_json

    if isinstance(data, list):
        return pd.DataFrame(data)

    if isinstance(data, dict):
        for key in ("data_siap_pakai", "data_mentah", "data"):
            if isinstance(data.get(key), list):
                return pd.DataFrame(data[key])

    raise HTTPException(
        status_code=400,
        detail="Dataset belum tersedia atau formatnya tidak didukung.",
    )


def build_dataset_summary(item: Analysis) -> dict | None:
    if not item.data_json:
        return None
    rows = item.data_json if isinstance(item.data_json, list) else []
    if not rows and isinstance(item.data_json, dict):
        rows = item.data_json.get("data_mentah") or item.data_json.get("data") or item.data_json.get("data_siap_pakai") or []
    if not isinstance(rows, list) or not rows:
        return None

    columns = list(rows[0].keys()) if isinstance(rows[0], dict) else []
    kolom_info = []
    for col in columns:
        vals = [r.get(col) for r in rows if isinstance(r, dict) and r.get(col) is not None]
        is_num = False
        try:
            num_vals = [
                float(v) for v in vals
                if isinstance(v, (int, float)) or (isinstance(v, str) and v.replace('.', '', 1).replace('-', '', 1).isdigit())
            ]
            is_num = len(num_vals) > 0 and len(num_vals) >= len(vals) * 0.7
        except Exception:
            is_num = False

        kolom_info.append({
            "name": str(col),
            "type": "numeric" if is_num else "categorical",
            "sampleValues": vals[:5],
            "distinctCount": len(set(str(v) for v in vals)),
        })

    return {
        "nama_dataset": item.nama_dataset or "Dataset Aktif",
        "format_data": item.format_data or "json",
        "sumber_input": item.sumber_input or "mentah",
        "total_baris": len(rows),
        "total_kolom": len(columns),
        "kolom": columns,
        "kolom_info": kolom_info,
        "preview_baris": rows[:5],
        "data_mentah": rows,
    }


def numeric_series(df: pd.DataFrame, column: str) -> pd.Series:
    if column not in df.columns:
        raise HTTPException(
            status_code=400, detail=f"Kolom '{column}' tidak ditemukan."
        )

    series = pd.to_numeric(df[column], errors="coerce").dropna()
    if series.empty:
        raise HTTPException(
            status_code=400,
            detail=f"Kolom '{column}' tidak memiliki data numerik yang valid.",
        )
    return series


def choose_column(config: dict, keys: list[str]) -> str | None:
    for key in keys:
        value = config.get(key)
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def calculate_analysis(item: Analysis) -> dict:
    df = dataframe_from_analysis(item)
    config = item.config_json or {}
    kind = item.jenis_analisis

    if df.empty:
        raise HTTPException(status_code=400, detail="Dataset kosong.")

    if kind == "deskriptif":
        requested = config.get("kolom") or config.get("variabel") or []
        if isinstance(requested, str):
            requested = [requested]

        columns = requested or list(
            df.select_dtypes(include="number").columns
        )
        if not columns:
            raise HTTPException(
                status_code=400,
                detail="Pilih setidaknya satu kolom numerik.",
            )

        results = {}
        for column in columns:
            series = numeric_series(df, str(column))
            results[str(column)] = {
                "jumlah_data": int(series.count()),
                "mean": clean_value(series.mean()),
                "median": clean_value(series.median()),
                "modus": [
                    clean_value(value)
                    for value in series.mode().head(10).tolist()
                ],
                "minimum": clean_value(series.min()),
                "maksimum": clean_value(series.max()),
                "rentang": clean_value(series.max() - series.min()),
                "varians": (
                    clean_value(series.var(ddof=1))
                    if len(series) > 1 else None
                ),
                "standar_deviasi": (
                    clean_value(series.std(ddof=1))
                    if len(series) > 1 else None
                ),
            }

        return {
            "jenis_analisis": kind,
            "jumlah_baris": int(len(df)),
            "jumlah_kolom": int(len(df.columns)),
            "hasil": results,
        }

    if kind in ("korelasi", "regresi"):
        x_col = choose_column(
            config, ["kolom_x", "variabel_x", "kolom1", "x"]
        )
        y_col = choose_column(
            config, ["kolom_y", "variabel_y", "kolom2", "y"]
        )

        if not x_col or not y_col:
            raise HTTPException(
                status_code=400,
                detail="Isi kolom_x dan kolom_y pada konfigurasi.",
            )
        if x_col not in df.columns or y_col not in df.columns:
            raise HTTPException(
                status_code=400,
                detail="Kolom X atau Y tidak ditemukan dalam dataset.",
            )

        pair = pd.DataFrame({
            "x": pd.to_numeric(df[x_col], errors="coerce"),
            "y": pd.to_numeric(df[y_col], errors="coerce"),
        }).dropna()

        if kind == "korelasi":
            if len(pair) < 2:
                raise HTTPException(
                    status_code=400,
                    detail="Korelasi membutuhkan minimal dua pasangan data valid.",
                )
            if pair["x"].nunique() < 2 or pair["y"].nunique() < 2:
                raise HTTPException(
                    status_code=400,
                    detail="Korelasi tidak dapat dihitung jika salah satu kolom konstan.",
                )

            r, p_value = stats.pearsonr(pair["x"], pair["y"])
            absolute_r = abs(r)

            if absolute_r < 0.20:
                strength = "sangat lemah"
            elif absolute_r < 0.40:
                strength = "lemah"
            elif absolute_r < 0.60:
                strength = "sedang"
            elif absolute_r < 0.80:
                strength = "kuat"
            else:
                strength = "sangat kuat"

            return {
                "jenis_analisis": kind,
                "kolom_x": x_col,
                "kolom_y": y_col,
                "jumlah_data": int(len(pair)),
                "koefisien_korelasi": clean_value(r),
                "p_value": clean_value(p_value),
                "kekuatan": strength,
                "signifikan_05": bool(p_value < 0.05),
            }

        if len(pair) < 3:
            raise HTTPException(
                status_code=400,
                detail="Regresi membutuhkan minimal tiga pasangan data valid.",
            )
        if pair["x"].nunique() < 2:
            raise HTTPException(
                status_code=400,
                detail="Regresi tidak dapat dihitung jika kolom X konstan.",
            )

        regression = stats.linregress(pair["x"], pair["y"])
        return {
            "jenis_analisis": kind,
            "kolom_x": x_col,
            "kolom_y": y_col,
            "jumlah_data": int(len(pair)),
            "intersep": clean_value(regression.intercept),
            "koefisien": clean_value(regression.slope),
            "r_value": clean_value(regression.rvalue),
            "r_squared": clean_value(regression.rvalue ** 2),
            "p_value": clean_value(regression.pvalue),
            "standar_error": clean_value(regression.stderr),
            "persamaan": (
                f"{y_col} = {regression.intercept:.4f} "
                f"+ {regression.slope:.4f} * {x_col}"
            ),
            "signifikan_05": bool(regression.pvalue < 0.05),
        }

    if kind == "uji_t":
        x_col = choose_column(
            config,
            ["kolom_nilai", "kolom_x", "variabel", "kolom1", "x"],
        )
        group_col = choose_column(
            config, ["kolom_kelompok", "kolom_grup", "kelompok"]
        )
        group1 = config.get("kelompok1")
        group2 = config.get("kelompok2")

        if group_col and x_col:
            if group_col not in df.columns:
                raise HTTPException(
                    status_code=400,
                    detail="Kolom kelompok tidak ditemukan.",
                )
            if x_col not in df.columns:
                raise HTTPException(
                    status_code=400,
                    detail=f"Kolom '{x_col}' tidak ditemukan.",
                )

            values = pd.to_numeric(df[x_col], errors="coerce")
            groups = df[group_col]
            unique_groups = list(groups.dropna().unique())

            group1 = (
                group1 if group1 is not None
                else unique_groups[0] if len(unique_groups) > 0 else None
            )
            group2 = (
                group2 if group2 is not None
                else unique_groups[1] if len(unique_groups) > 1 else None
            )

            if group1 is None or group2 is None or group1 == group2:
                raise HTTPException(
                    status_code=400,
                    detail="Uji t membutuhkan dua kelompok yang berbeda.",
                )

            first = values[groups == group1].dropna()
            second = values[groups == group2].dropna()
        else:
            first_col = choose_column(
                config, ["kolom1", "kelompok1", "kolom_x", "x"]
            )
            second_col = choose_column(
                config, ["kolom2", "kelompok2", "kolom_y", "y"]
            )
            if not first_col or not second_col:
                raise HTTPException(
                    status_code=400,
                    detail=(
                        "Uji t membutuhkan kolom_nilai dan kolom_kelompok, "
                        "atau kolom1 dan kolom2."
                    ),
                )

            first = numeric_series(df, first_col)
            second = numeric_series(df, second_col)
            group1, group2 = first_col, second_col

        if len(first) < 2 or len(second) < 2:
            raise HTTPException(
                status_code=400,
                detail="Setiap kelompok harus memiliki minimal dua data valid.",
            )

        test = stats.ttest_ind(first, second, equal_var=False)
        return {
            "jenis_analisis": kind,
            "kelompok1": str(group1),
            "kelompok2": str(group2),
            "jumlah_kelompok1": int(len(first)),
            "jumlah_kelompok2": int(len(second)),
            "mean_kelompok1": clean_value(first.mean()),
            "mean_kelompok2": clean_value(second.mean()),
            "sd_kelompok1": clean_value(first.std(ddof=1)),
            "sd_kelompok2": clean_value(second.std(ddof=1)),
            "df": clean_value(test.df),
            "selisih_mean": clean_value(first.mean() - second.mean()),
            "t_statistic": clean_value(test.statistic),
            "p_value": clean_value(test.pvalue),
            "signifikan_05": bool(test.pvalue < 0.05),
            "metode": "Welch independent samples t-test",
        }

    raise HTTPException(
        status_code=400,
        detail="Jenis analisis harus deskriptif, uji_t, korelasi, atau regresi.",
    )


def clean_display_num(val, decimals=4):
    if val is None:
        return None
    try:
        f = float(val)
        if math.isnan(f) or math.isinf(f):
            return None
        if abs(f) > 0 and abs(f) < 0.0001:
            return float(f"{f:.4e}")
        return round(f, decimals)
    except (ValueError, TypeError):
        return val


def format_hasil_frontend(result: dict, kind: str | None) -> dict:
    if not isinstance(result, dict):
        return {}

    kind = (
        kind or result.get("jenis_analisis") or "deskriptif"
    ).lower().replace("-", "_")

    if kind in ("deskriptif", "descriptive", "statistik_deskriptif"):
        ringkasan = []
        for column, values in (result.get("hasil") or {}).items():
            if not isinstance(values, dict):
                continue
            modus = values.get("modus") or []
            if not isinstance(modus, list):
                modus = [modus]
            ringkasan.append({
                "kolom": column,
                "n": values.get("jumlah_data"),
                "mean": clean_display_num(values.get("mean"), 2),
                "median": clean_display_num(values.get("median"), 2),
                "modus": [clean_display_num(m, 2) for m in modus],
                "standar_deviasi": clean_display_num(values.get("standar_deviasi"), 4),
                "min": clean_display_num(values.get("minimum"), 2),
                "max": clean_display_num(values.get("maksimum"), 2),
            })
        return {
            "ringkasan": ringkasan,
            "jumlah_baris": result.get("jumlah_baris"),
            "jumlah_kolom": result.get("jumlah_kolom"),
        }

    if kind in ("uji_t", "t_test", "ttest", "uji_t_test"):
        return {
            "t": clean_display_num(result.get("t_statistic"), 4),
            "df": clean_display_num(result.get("df"), 2),
            "p_value": clean_display_num(result.get("p_value"), 4),
            "perbedaan_mean": clean_display_num(result.get("selisih_mean"), 4),
            "signifikan": result.get("signifikan_05"),
            "kelompok_1": {
                "nama": result.get("kelompok1"),
                "mean": clean_display_num(result.get("mean_kelompok1"), 2),
                "sd": clean_display_num(result.get("sd_kelompok1"), 4),
                "n": result.get("jumlah_kelompok1"),
            },
            "kelompok_2": {
                "nama": result.get("kelompok2"),
                "mean": clean_display_num(result.get("mean_kelompok2"), 2),
                "sd": clean_display_num(result.get("sd_kelompok2"), 4),
                "n": result.get("jumlah_kelompok2"),
            },
        }

    if kind in ("korelasi", "correlation"):
        r = result.get("koefisien_korelasi")
        p = result.get("p_value")
        return {
            "variabel_x": result.get("kolom_x"),
            "variabel_y": result.get("kolom_y"),
            "n": result.get("jumlah_data"),
            "r": clean_display_num(r, 4),
            "p_value": clean_display_num(p, 4),
            "arah": (
                "positif" if isinstance(r, (int, float)) and r > 0
                else "negatif" if isinstance(r, (int, float)) and r < 0
                else "netral"
            ),
            "kekuatan": result.get("kekuatan"),
        }

    if kind in ("regresi", "regression", "regresi_linear"):
        return {
            "variabel_x": result.get("kolom_x"),
            "variabel_y": result.get("kolom_y"),
            "n": result.get("jumlah_data"),
            "koefisien": clean_display_num(result.get("koefisien"), 4),
            "intercept": clean_display_num(result.get("intersep"), 4),
            "r_squared": clean_display_num(result.get("r_squared"), 4),
            "p_value": clean_display_num(result.get("p_value"), 4),
            "persamaan": result.get("persamaan"),
        }

    return result


def build_visualisasi(item: Analysis, result: dict) -> list[dict]:
    try:
        df = dataframe_from_analysis(item)
        kind = (item.jenis_analisis or "").lower()
        charts = []

        if kind == "deskriptif":
            for column, values in (result.get("hasil") or {}).items():
                if column not in df.columns:
                    continue
                series = pd.to_numeric(
                    df[column], errors="coerce"
                ).dropna()
                if series.empty:
                    continue

                import numpy as np

                counts, edges = np.histogram(
                    series,
                    bins=min(10, max(3, int(len(series) ** 0.5))),
                )
                bins = [
                    {
                        "label": f"{edges[i]:.2f}–{edges[i + 1]:.2f}",
                        "count": int(counts[i]),
                        "min": float(edges[i]),
                        "max": float(edges[i + 1]),
                    }
                    for i in range(len(counts))
                ]
                charts.append({
                    "jenis_grafik": "histogram",
                    "judul": f"Distribusi {column}",
                    "label_x": str(column),
                    "label_y": "Frekuensi",
                    "data_grafik": {
                        "bins": bins,
                        "mean_marker": clean_value(series.mean()),
                    },
                })
            return charts

        if kind in ("korelasi", "regresi"):
            x_col = result.get("kolom_x")
            y_col = result.get("kolom_y")
            if x_col in df.columns and y_col in df.columns:
                pair = pd.DataFrame({
                    "x": pd.to_numeric(df[x_col], errors="coerce"),
                    "y": pd.to_numeric(df[y_col], errors="coerce"),
                }).dropna()

                points = [
                    {"x": clean_value(row.x), "y": clean_value(row.y)}
                    for row in pair.itertuples(index=False)
                ]
                chart = {
                    "jenis_grafik": "scatter",
                    "judul": f"{y_col} terhadap {x_col}",
                    "label_x": str(x_col),
                    "label_y": str(y_col),
                    "data_grafik": {"points": points},
                }

                if (
                    kind == "regresi"
                    and len(pair)
                    and result.get("koefisien") is not None
                ):
                    slope = result["koefisien"]
                    intercept = result.get("intersep") or 0
                    xmin = float(pair["x"].min())
                    xmax = float(pair["x"].max())
                    chart["data_grafik"]["line"] = {
                        "x1": xmin,
                        "y1": intercept + slope * xmin,
                        "x2": xmax,
                        "y2": intercept + slope * xmax,
                    }
                charts.append(chart)
            return charts

        if kind == "uji_t":
            groups = [
                {
                    "kategori": str(result.get("kelompok1", "Kelompok 1")),
                    "nilai": result.get("mean_kelompok1"),
                },
                {
                    "kategori": str(result.get("kelompok2", "Kelompok 2")),
                    "nilai": result.get("mean_kelompok2"),
                },
            ]
            charts.append({
                "jenis_grafik": "batang",
                "judul": "Perbandingan rata-rata kelompok",
                "label_x": "Kelompok",
                "label_y": "Rata-rata",
                "data_grafik": {
                    "kategori": [g["kategori"] for g in groups],
                    "nilai": [g["nilai"] for g in groups],
                },
            })
        return charts
    except Exception:
        return []



def make_contoh_kasus_template(result: dict, lang: str = "id") -> list[str]:
    """Membuat analogi berdasarkan hasil analisis statistik."""
    kind = result.get("jenis_analisis")
    hasil = result.get("hasil") or {}

    if kind == "deskriptif":
        contoh = []

        for column, values in hasil.items():
            if not isinstance(values, dict):
                continue

            mean = values.get("mean")
            minimum = values.get("minimum", values.get("min"))
            maksimum = values.get("maksimum", values.get("max"))

            if lang == "en":
                contoh.append(
                    f"Real-world analogy: The variable {column} is like "
                    f"measuring products in a shop. Its average is {mean}, "
                    f"with values ranging from {minimum} to {maksimum}. "
                    "The average describes the typical value, while the "
                    "range shows how much the measurements vary."
                )
            else:
                contoh.append(
                    f"Analogi dunia nyata: Variabel {column} seperti "
                    f"pengukuran ukuran produk di sebuah toko. Nilai "
                    f"rata-ratanya {mean}, dengan rentang dari {minimum} "
                    f"sampai {maksimum}. Rata-rata menggambarkan nilai "
                    "umum, sedangkan rentang menunjukkan variasi data."
                )

        return contoh

    if kind == "korelasi":
        r = result.get("koefisien_korelasi")
        x = result.get("kolom_x", "variabel X")
        y = result.get("kolom_y", "variabel Y")
        direction = (
            "positif" if (r or 0) > 0 else "negatif"
        )

        if lang == "en":
            return [
                f"The relationship between {x} and {y} is like comparing "
                f"study time and exam scores. The correlation is "
                f"{direction} (r={r}). Correlation alone does not prove "
                "that one variable causes the other."
            ]

        return [
            f"Analogi dunia nyata: Hubungan antara {x} dan {y} seperti "
            f"membandingkan waktu belajar dengan nilai ujian. Korelasinya "
            f"bersifat {direction} (r={r}). Korelasi tidak otomatis "
            "membuktikan bahwa satu variabel menyebabkan variabel lain."
        ]

    if kind == "regresi":
        x = result.get("kolom_x", "variabel X")
        y = result.get("kolom_y", "variabel Y")
        r2 = result.get("r_squared") or 0

        if lang == "en":
            return [
                f"Regression is like estimating how {y} may change when "
                f"{x} changes. The model explains about "
                f"{round(r2 * 100, 2)}% of the variation. This is an "
                "estimate, not a guarantee."
            ]

        return [
            f"Analogi dunia nyata: Regresi seperti memperkirakan perubahan "
            f"{y} ketika {x} berubah. Model menjelaskan sekitar "
            f"{round(r2 * 100, 2)}% variasi data. Hasil ini merupakan "
            "perkiraan, bukan jaminan."
        ]

    if kind == "uji_t":
        if lang == "en":
            return [
                "This test is like comparing average exam scores between "
                "two classes. It helps evaluate whether their average "
                "scores differ statistically, but does not explain the cause."
            ]

        return [
            "Analogi dunia nyata: Uji t seperti membandingkan rata-rata "
            "nilai ujian dua kelas. Pengujian ini membantu menilai apakah "
            "rata-rata kedua kelas berbeda secara statistik, tetapi "
            "tidak otomatis menjelaskan penyebab perbedaannya."
        ]

    return []


def _narasi_terlihat_template(narasi: str | None) -> bool:
    if not narasi or not narasi.strip():
        return True

    text = narasi.strip().lower()
    markers = (
        "hasil analisis statistik deskriptif. variabel ",
        "descriptive analysis results: ",
        "menghasilkan koefisien korelasi r=",
        "with r=",
        "model regresi yang diperoleh adalah ",
        "the fitted regression equation is ",
        "uji t welch membandingkan kelompok ",
        "the welch independent-samples t-test compared ",
        "jalankan analisis terlebih dahulu untuk membuat narasi.",
        "run an analysis to generate a narrative.",
        "narasi ai belum berhasil dibuat.",
        "the ai narrative could not be generated.",
        "| statistik | nilai |",
        "| statistics | value |",
        "| mean (rata‑rata) |",
        "| mean (rata-rata) |",
        "| parameter | nilai |",
        "## 1. diameter",
    )
    return any(marker in text for marker in markers)


def detail_analisis_frontend(item: Analysis, db: Session | None = None) -> dict:
    raw = item.hasil_json if isinstance(item.hasil_json, dict) else {}
    changed = False
    ai_status = "not_needed"
    ai_error = None

    # Regenerasi narasi lama yang masih berupa template statis
    if raw and (
        _narasi_terlihat_template(item.narasi_id)
        or _narasi_terlihat_template(item.narasi_en)
    ):
        if _narasi_terlihat_template(item.narasi_id):
            try:
                item.narasi_id = make_narrative(raw, "id")
                changed = True
                ai_status = "generated"
            except Exception as exc:
                ai_status = "failed"
                ai_error = str(exc)
                print(f"Narasi AI (id) gagal untuk analisis {item.id_analisis}: {exc}")

        if _narasi_terlihat_template(item.narasi_en) and ai_status != "failed":
            try:
                item.narasi_en = make_narrative(raw, "en")
                changed = True
            except Exception as exc:
                print(f"Narasi AI (en) gagal untuk analisis {item.id_analisis}: {exc}")

    # Contoh kasus & analogi (di-cache di hasil_json agar tidak terus-menerus panggil AI)
    examples = []
    if raw:
        cached_examples = raw.get("contoh_kasus")
        if isinstance(cached_examples, list) and cached_examples:
            examples = cached_examples
        else:
            try:
                examples = make_contoh_kasus(raw, "id")
                if not examples:
                    examples = make_contoh_kasus_template(raw, "id")
                if examples:
                    raw["contoh_kasus"] = examples
                    item.hasil_json = raw
                    changed = True
            except Exception as exc:
                print(f"Contoh kasus gagal untuk analisis {item.id_analisis}: {exc}")
                examples = make_contoh_kasus_template(raw, "id")
                if examples:
                    raw["contoh_kasus"] = examples
                    item.hasil_json = raw
                    changed = True

    narasi_id = item.narasi_id
    narasi_en = item.narasi_en
    if _narasi_terlihat_template(narasi_id):
        narasi_id = build_structured_academic_narrative(raw, "id")
        item.narasi_id = narasi_id
        changed = True
    if _narasi_terlihat_template(narasi_en):
        narasi_en = build_structured_academic_narrative(raw, "en")
        item.narasi_en = narasi_en
        changed = True

    if changed and db is not None:
        db.commit()
        db.refresh(item)

    kind = item.jenis_analisis or raw.get("jenis_analisis")
    dataset_summary = build_dataset_summary(item)
    has_real_result = bool(raw and (raw.get("hasil") or raw.get("ringkasan") or raw.get("koefisien_korelasi") or raw.get("r_squared") or raw.get("t_statistic") or raw.get("t_hitung")))
    return {
        **analysis_response(item),
        "dataset_input": dataset_summary,
        "dataset": dataset_summary,
        "data_json": item.data_json,
        "hasil": format_hasil_frontend(raw, kind) if has_real_result else None,
        "hasil_json": raw if has_real_result else None,
        "result": raw if has_real_result else None,
        "visualisasi": build_visualisasi(item, raw) if has_real_result else [],
        "narasi": {"id": narasi_id, "en": narasi_en} if has_real_result else {"id": None, "en": None},
        "narasi_id": narasi_id if has_real_result else None,
        "narasi_en": narasi_en if has_real_result else None,
        "contoh_kasus": examples if has_real_result else [],
        "narasi_ai_status": ai_status if has_real_result else "not_needed",
        "narasi_ai_error": ai_error,
        "backend_version": "1.1.0-ai-narrative",
    }


def build_structured_academic_narrative(result: dict, lang: str = "id") -> str:
    kind = str(result.get("jenis_analisis") or "deskriptif").lower()
    is_id = lang == "id"

    if is_id:
        if kind == "deskriptif":
            hasil = result.get("hasil") or {}
            n_rows = result.get("jumlah_baris") or 0
            cols = [str(c) for c in hasil.keys()]

            p1 = (
                f"### 1. Ringkasan Eksekutif & Lanskap Data\n\n"
                f"Dataset yang dianalisis mencakup {n_rows} baris observasi dengan parameter variabel: {', '.join(cols) if cols else 'numerik'}. "
                f"Karakteristik seluruh observasi telah diolah secara komprehensif tanpa data yang hilang, "
                f"memberikan landasan empiris yang kuat untuk memetakan dinamika sebaran dan perilaku nilai sentral."
            )

            var_syntheses = []
            for col, stats_data in hasil.items():
                if not isinstance(stats_data, dict):
                    continue
                mean = stats_data.get("mean", 0)
                median = stats_data.get("median", 0)
                std = stats_data.get("standar_deviasi", stats_data.get("std", 0))
                minimum = stats_data.get("minimum", stats_data.get("min", 0))
                maksimum = stats_data.get("maksimum", stats_data.get("max", 0))
                try:
                    diff = float(mean) - float(median)
                except Exception:
                    diff = 0

                if abs(diff) < 0.2:
                    skew_text = "berdistribusi relatif simetris (mean dan median hampir berhimpit)"
                elif diff > 0:
                    skew_text = "menunjukkan kemiringan positif (right-skewed), dengan beberapa nilai tinggi yang menarik mean ke atas"
                else:
                    skew_text = "menunjukkan kemiringan negatif (left-skewed), di mana sebagian besar data terkonsentrasi pada skor tinggi"

                var_syntheses.append(
                    f"Variabel **{col}** mencatatkan nilai rata-rata sebesar {mean} dengan nilai tengah (median) {median}, "
                    f"yang {skew_text}. Dispersi data terbentang dari nilai minimum {minimum} hingga maksimum {maksimum}, "
                    f"didukung standar deviasi sebesar {std} yang mencerminkan variabilitas data di sekitar nilai pusat."
                )

            p2 = "### 2. Sintesis Variabel & Dinamika Distribusi\n\n" + (" ".join(var_syntheses) if var_syntheses else "Variabel numerik telah diringkas secara akurat.")

            p3 = (
                f"### 3. Wawasan Kritis & Pola Tersembunyi\n\n"
                f"Observasi terhadap variabilitas antar variabel menunjukkan adanya heterogenitas pada populasi data. "
                f"Ketika rentang skor dan standar deviasi dipadukan, tampak bahwa sebagian besar pengamatan berkumpul "
                f"secara stabil pada rentang interkuartil, namun tetap menyisakan pola variasi unik pada ujung-ujung spektrum "
                f"yang relevan untuk ditelaah lebih jauh."
            )

            p4 = (
                f"### 4. Implikasi Praktis & Rekomendasi Akademis\n\n"
                f"- **Pemeriksaan Titik Ekstrem (Outlier)**: Lakukan evaluasi visual (Boxplot/IQR) untuk mendeteksi apakah nilai minimum/maksimum mempengaruhi estimasi parametrik.\n"
                f"- **Segmentasi Lanjutan**: Pertimbangkan analisis sub-populasi untuk melihat perbedaan performa antar klaster data.\n"
                f"- **Keterbatasan Eksploratif**: Statistik deskriptif memotret sebaran riil saat ini dan tidak ditujukan untuk membuktikan hubungan kausal sebab-akibat."
            )
            return f"{p1}\n\n{p2}\n\n{p3}\n\n{p4}"

        elif kind == "korelasi":
            x = result.get("kolom_x", "X")
            y = result.get("kolom_y", "Y")
            r = result.get("koefisien_korelasi", 0)
            p = result.get("p_value", 1.0)
            sig = result.get("signifikan_05", False)
            kekuatan = result.get("kekuatan", "sedang")
            try:
                direction = "positif" if float(r or 0) >= 0 else "negatif"
            except Exception:
                direction = "positif"
            sig_text = "terbukti signifikan secara statistik pada taraf 5% (p < 0.05)" if sig else "belum terbukti signifikan secara statistik pada taraf 5% (p >= 0.05)"

            p1 = (
                f"### 1. Konteks Hubungan Antar Variabel\n\n"
                f"Eksplorasi hubungan linear dilakukan antara variabel **{x}** dan **{y}**. "
                f"Tujuan utama pengujian ini adalah membuktikan apakah perubahan proporsional pada satu variabel berkaitan searah atau berlawanan arah dengan variabel pasangannya."
            )
            p2 = (
                f"### 2. Evaluasi Arah, Kekuatan, & Signifikansi Hubungan\n\n"
                f"Pengujian korelasi Pearson menghasilkan nilai **r = {r}** dengan nilai signifikansi p-value = {p}. "
                f"Arah hubungan tercatat bersifat **{direction}** dengan derajat keeratan **{kekuatan}**. "
                f"Secara inferensial, hubungan kedua variabel {sig_text}."
            )
            p3 = (
                f"### 3. Wawasan Kritis: Asosiasi Bukan Kausalitas\n\n"
                f"Penting untuk diingat bahwa koefisien korelasi hanya merefleksikan ko-variasi linear dan BUKAN bukti hubungan sebab-akibat. "
                f"Nilai keeratan ini tidak membuktikan bahwa perubahan pada {x} mengakibatkan perubahan pada {y}, melainkan dapat dipengaruhi oleh variabel laten lain."
            )
            p4 = (
                f"### 4. Rekomendasi Metodologis & Langkah Lanjutan\n\n"
                f"- **Inspeksi Diagram Pencar (Scatter Plot)**: Verifikasi linearitas data untuk memastikan ketiadaan pola non-linear atau distorsi pencilan.\n"
                f"- **Pemeriksaan Variabel Pengganggu**: Teliti variabel konteks tambahan yang mungkin menjadi perantara asosiasi.\n"
                f"- **Kelayakan Pemodelan Regresi**: Jika didukung teori yang kokoh, hubungan ini layak ditingkatkan ke analisis regresi linear."
            )
            return f"{p1}\n\n{p2}\n\n{p3}\n\n{p4}"

        elif kind == "regresi":
            x = result.get("kolom_x", "X")
            y = result.get("kolom_y", "Y")
            eq = result.get("persamaan", "Y = a + bX")
            r2 = result.get("r_squared") or 0
            p = result.get("p_value", 1.0)
            sig = result.get("signifikan_05", False)
            slope = result.get("slope", 0)
            intercept = result.get("intercept", 0)
            sig_text = "signifikan secara statistik pada taraf 5% (p < 0.05)" if sig else "tidak signifikan secara statistik pada taraf 5% (p >= 0.05)"
            try:
                r2_val = float(r2)
                r2_pct = round(r2_val * 100, 2)
            except Exception:
                r2_val = 0
                r2_pct = 0

            p1 = (
                f"### 1. Tujuan Pemodelan & Spesifikasi Variabel\n\n"
                f"Pemodelan regresi linear sederhana diterapkan untuk mengestimasi ketergantungan variabel respons **{y}** terhadap variabel prediktor **{x}**. "
                f"Fokus model ini adalah mengkuantifikasi daya proyeksi dan laju perubahan respons terhadap stimulus prediktor."
            )
            p2 = (
                f"### 2. Interpretasi Persamaan & Daya Penjelas Model (R²)\n\n"
                f"Model menghasilkan persamaan garis regresi **{eq}**. "
                f"Koefisien determinasi R-kuadrat sebesar **R² = {round(r2_val, 4)}** menunjukkan bahwa sekitar **{r2_pct}%** variasi pada {y} dapat diterangkan oleh variasi {x}. "
                f"Model ini tercatat {sig_text} dengan p-value = {p}."
            )
            p3 = (
                f"### 3. Wawasan Prediktif & Makna Koefisien\n\n"
                f"Nilai intersep {intercept} merepresentasikan titik awal rata-rata {y} ketika {x} bernilai nol. "
                f"Koefisien slope sebesar {slope} bermakna setiap peningkatan 1 satuan pada {x} diestimasikan mengubah rata-rata {y} sebesar {slope} satuan. "
                f"Estimasi ini bersifat kecenderungan rata-rata empiris, bukan kepastian mutlak."
            )
            p4 = (
                f"### 4. Catatan Kritis & Rekomendasi Peneliti\n\n"
                f"- **Uji Asumsi Residual**: Lakukan diagnostik normalitas residual dan homoskedastisitas untuk memastikan ketiadaan bias sistematis.\n"
                f"- **Batas Ekstrapolasi**: Hindari memprediksi nilai di luar rentang observasi sampel data yang sebenarnya.\n"
                f"- **Daya Ramal vs Kausalitas**: Ingat bahwa kemampuan prediksi matematis tidak serta merta membuktikan hubungan kausal mekanistik."
            )
            return f"{p1}\n\n{p2}\n\n{p3}\n\n{p4}"

        else:  # uji_t
            k1 = result.get("kelompok1", "Kelompok 1")
            k2 = result.get("kelompok2", "Kelompok 2")
            m1 = result.get("mean_kelompok1", 0)
            m2 = result.get("mean_kelompok2", 0)
            t = result.get("t_hitung", 0)
            p = result.get("p_value", 1.0)
            sig = result.get("signifikan_05", False)
            df = result.get("df", 0)
            sig_text = "terdapat perbedaan rata-rata yang signifikan secara statistik (p < 0.05)" if sig else "belum terdapat perbedaan rata-rata yang signifikan secara statistik (p >= 0.05)"

            p1 = (
                f"### 1. Konteks Pengujian & Profil Kelompok\n\n"
                f"Uji komparasi dua kelompok independen (Welch's t-test) diaplikasikan untuk menguji perbedaan performa rata-rata antara kelompok **{k1}** dan **{k2}**. "
                f"Metode Welch menjamin keandalan pengujian terhadap varians kelompok yang tidak homogen."
            )
            p2 = (
                f"### 2. Evaluasi Perbedaan & Signifikansi Statistik\n\n"
                f"Pengujian menghasilkan statistik uji t = {t} dengan derajat kebebasan df = {df} dan nilai p-value = {p}. "
                f"Pada taraf signifikansi 5%, {sig_text} antara kedua kelompok yang diuji."
            )
            p3 = (
                f"### 3. Makna Praktis vs Signifikansi Statistik\n\n"
                f"Rata-rata kelompok {k1} tercatat sebesar {m1}, sedangkan kelompok {k2} mencatatkan rata-rata {m2}. "
                f"Meskipun signifikansi statistik mengonfirmasi keberadaan perbedaan riil dalam sampel, dampak praktis (practical significance) tetap perlu ditimbang dalam konteks implementasi nyata."
            )
            p4 = (
                f"### 4. Rekomendasi Akademis & Batasan Metodologi\n\n"
                f"- **Evaluasi Distribusi Data**: Periksa normalitas data pada masing-masing sub-grup sampel.\n"
                f"- **Ukuran Efek (Effect Size)**: Pertimbangkan menghitung Cohen's d untuk mengetahui magnitud disparitas tanpa bias ukuran sampel.\n"
                f"- **Faktor Latar Belakang**: Identifikasi variabel demografis atau perancu yang berpotensi membedakan kedua kelompok."
            )
            return f"{p1}\n\n{p2}\n\n{p3}\n\n{p4}"

    else:  # English
        if kind == "deskriptif":
            hasil = result.get("hasil") or {}
            n_rows = result.get("jumlah_baris") or 0
            cols = [str(c) for c in hasil.keys()]

            p1 = (
                f"### 1. Executive Summary & Data Landscape\n\n"
                f"The analyzed dataset comprises {n_rows} observation rows across variables: {', '.join(cols) if cols else 'numerical'}. "
                f"All records have been thoroughly computed without missing observations, providing a solid empirical baseline."
            )
            var_syntheses = []
            for col, stats_data in hasil.items():
                if not isinstance(stats_data, dict):
                    continue
                mean = stats_data.get("mean", 0)
                median = stats_data.get("median", 0)
                std = stats_data.get("standar_deviasi", stats_data.get("std", 0))
                minimum = stats_data.get("minimum", stats_data.get("min", 0))
                maksimum = stats_data.get("maksimum", stats_data.get("max", 0))
                var_syntheses.append(
                    f"Variable **{col}** exhibits a mean of {mean} and median of {median}. "
                    f"Values span from a minimum of {minimum} to a maximum of {maksimum}, with standard deviation of {std} denoting central dispersion."
                )
            p2 = "### 2. Variable Synthesis & Distribution Dynamics\n\n" + (" ".join(var_syntheses) if var_syntheses else "Numerical variables summarized.")
            p3 = (
                f"### 3. Critical Insights & Latent Patterns\n\n"
                f"Cross-variable comparison demonstrates distinct variation characteristics across indicators. "
                f"The distribution shows stable clustering around the central quartile with noticeable spreads across the extremes."
            )
            p4 = (
                f"### 4. Practical Implications & Methodological Recommendations\n\n"
                f"- **Outlier Diagnostics**: Perform boxplot checks to verify extreme values do not skew parametric estimations.\n"
                f"- **Sub-population Segmentation**: Explore clustering across categorical subgroups to reveal underlying patterns.\n"
                f"- **Exploratory Scope**: Descriptive summaries illustrate actual characteristics and do not claim causal relationships."
            )
            return f"{p1}\n\n{p2}\n\n{p3}\n\n{p4}"

        elif kind == "korelasi":
            x = result.get("kolom_x", "X")
            y = result.get("kolom_y", "Y")
            r = result.get("koefisien_korelasi", 0)
            p = result.get("p_value", 1.0)
            sig = result.get("signifikan_05", False)
            kekuatan = result.get("kekuatan", "moderate")
            try:
                direction = "positive" if float(r or 0) >= 0 else "negative"
            except Exception:
                direction = "positive"
            sig_text = "statistically significant at the 5% level (p < 0.05)" if sig else "not statistically significant at the 5% level (p >= 0.05)"

            p1 = (
                f"### 1. Association Context & Variable Pairing\n\n"
                f"A Pearson linear correlation analysis was performed between **{x}** and **{y}** to investigate the direction and degree of association."
            )
            p2 = (
                f"### 2. Direction, Strength, & Statistical Significance\n\n"
                f"The test yielded a correlation coefficient **r = {r}** with p-value = {p}. "
                f"The relationship is **{direction}** with **{kekuatan}** magnitude, and is {sig_text}."
            )
            p3 = (
                f"### 3. Critical Distinction: Correlation vs Causation\n\n"
                f"Crucially, correlation reflects co-movement rather than causation. It does not establish that changes in {x} produce changes in {y}."
            )
            p4 = (
                f"### 4. Methodological Next Steps & Recommendations\n\n"
                f"- **Scatter Plot Review**: Verify that the relationship is strictly linear and free of curved patterns.\n"
                f"- **Confounding Factors**: Inspect external factors that might account for shared variance.\n"
                f"- **Progression to Regression**: If backed by sound theoretical framework, this relationship is suitable for regression modeling."
            )
            return f"{p1}\n\n{p2}\n\n{p3}\n\n{p4}"

        elif kind == "regresi":
            x = result.get("kolom_x", "X")
            y = result.get("kolom_y", "Y")
            eq = result.get("persamaan", "Y = a + bX")
            r2 = result.get("r_squared") or 0
            p = result.get("p_value", 1.0)
            sig = result.get("signifikan_05", False)
            slope = result.get("slope", 0)
            intercept = result.get("intercept", 0)
            sig_text = "statistically significant at the 5% level (p < 0.05)" if sig else "not statistically significant at the 5% level (p >= 0.05)"
            try:
                r2_val = float(r2)
                r2_pct = round(r2_val * 100, 2)
            except Exception:
                r2_val = 0
                r2_pct = 0

            p1 = (
                f"### 1. Modeling Objectives & Variable Specification\n\n"
                f"A simple linear regression was conducted predicting response variable **{y}** from predictor variable **{x}**."
            )
            p2 = (
                f"### 2. Fitted Equation & Explanatory Power (R²)\n\n"
                f"The fitted regression line is **{eq}**. "
                f"The coefficient of determination **R² = {round(r2_val, 4)}** indicates that approximately **{r2_pct}%** of variance in {y} is explained by {x}. The model is {sig_text} (p = {p})."
            )
            p3 = (
                f"### 3. Predictive Insights & Coefficient Interpretation\n\n"
                f"The intercept is {intercept}, while the slope coefficient of {slope} indicates that each unit increment in {x} is associated with a {slope} change in {y} on average."
            )
            p4 = (
                f"### 4. Methodological Diagnostics & Practical Caveats\n\n"
                f"- **Residual Diagnostics**: Validate normality and homoscedasticity of error residuals.\n"
                f"- **Extrapolation Hazard**: Avoid predicting outside the range of empirical observations.\n"
                f"- **Predictive vs Causal Interpretation**: Statistical predictions do not equate to causal proofs."
            )
            return f"{p1}\n\n{p2}\n\n{p3}\n\n{p4}"

        else:  # uji_t
            k1 = result.get("kelompok1", "Group 1")
            k2 = result.get("kelompok2", "Group 2")
            m1 = result.get("mean_kelompok1", 0)
            m2 = result.get("mean_kelompok2", 0)
            t = result.get("t_hitung", 0)
            p = result.get("p_value", 1.0)
            sig = result.get("signifikan_05", False)
            df = result.get("df", 0)
            sig_text = "indicates a statistically significant difference (p < 0.05)" if sig else "indicates no statistically significant difference (p >= 0.05)"

            p1 = (
                f"### 1. Test Context & Group Profiles\n\n"
                f"Welch's two-sample independent t-test was employed to examine mean differences between **{k1}** and **{k2}**."
            )
            p2 = (
                f"### 2. Difference Evaluation & Statistical Significance\n\n"
                f"The test resulted in t = {t}, df = {df}, and p = {p}. At alpha = 0.05, the result {sig_text}."
            )
            p3 = (
                f"### 3. Practical Impact vs Statistical Significance\n\n"
                f"Group {k1} had a mean of {m1}, whereas group {k2} had a mean of {m2}. Practical effect sizes should be considered alongside statistical significance."
            )
            p4 = (
                f"### 4. Academic Recommendations & Methodological Caveats\n\n"
                f"- **Normality Diagnostics**: Verify normality within each subgroup.\n"
                f"- **Effect Size Metrics**: Compute Cohen's d to quantify standardized effect magnitude.\n"
                f"- **Contextual Variables**: Consider other background factors that may drive group distinctions."
            )
            return f"{p1}\n\n{p2}\n\n{p3}\n\n{p4}"


def make_narrative_template(result: dict, lang: str = "id") -> str:
    return build_structured_academic_narrative(result, lang)

def clean_narrative(text: str) -> str:
    if not text:
        return ""
    # Normalize unicode characters that cause encoding or display issues
    text = text.replace("\u2011", "-").replace("\u2212", "-")
    text = text.replace("\u202f", " ").replace("\u00a0", " ")

    # Strip markdown tables if any LLM slipped up and produced them
    cleaned_lines = []
    for line in text.splitlines():
        trimmed = line.strip()
        if trimmed.startswith("|") and trimmed.endswith("|"):
            # Skip divider line like |---|---|
            non_pipe = trimmed.replace("|", "").replace("-", "").replace(":", "").strip()
            if not non_pipe:
                continue
            cells = [c.strip() for c in trimmed.split("|")[1:-1] if c.strip()]
            if not cells:
                continue
            if cells[0].lower() in (
                "statistik", "statistics", "parameter", "variabel", "metric", "kolom", "column"
            ):
                continue
            if len(cells) >= 2:
                cleaned_lines.append(
                    f"- **{cells[0]}**: {cells[1]}" + (f" ({cells[2]})" if len(cells) > 2 else "")
                )
            else:
                cleaned_lines.append(f"- {cells[0]}")
            continue

        # Remove horizontal rules (---) that break up narrative layout
        if trimmed in ("---", "***", "___"):
            continue

        cleaned_lines.append(line)

    result = "\n".join(cleaned_lines)
    result = re.sub(r"\n{3,}", "\n\n", result)
    return result.strip()


def make_narrative(result: dict, lang: str = "id") -> str:
    kind = str(result.get("jenis_analisis") or "deskriptif").lower()
    is_id = lang == "id"
    language = "Bahasa Indonesia" if is_id else "English"

    if is_id:
        if kind == "deskriptif":
            structure_guide = """
STRUKTUR LAPORAN WAJIB (Gunakan heading Markdown persis seperti ini):
### 1. Ringkasan Eksekutif & Lanskap Data
Jelaskan secara naratif ukuran dataset (jumlah baris dan kolom), variabel-variabel numerik yang dianalisis, serta konteks umum dataset dalam 1-2 paragraf yang mengalir dan mudah dipahami.

### 2. Sintesis Variabel & Dinamika Distribusi
Bahas variabel-variabel data dengan menghubungkan satu sama lain menjadi cerita terpadu (JANGAN dibahas satu-satu secara terisolasi dengan tabel kaku):
- Analisis ukuran pemusatan: bandingkan mean vs median untuk melihat kesimetrisan atau kemiringan (skewness) distribusi.
- Analisis variabilitas: bandingkan rentang dan standar deviasi/varians antar variabel (variabel mana yang sangat tersebar/fluktuatif vs yang konsisten/stabil).
- Soroti pola khusus: seperti distribusi multimodal (modus ganda) pada variabel tertentu dan maknanya terhadap sebaran data.

### 3. Wawasan Kritis & Pola Tersembunyi
Jelaskan arti praktis dan fenomena di balik angka-angka tersebut. Apa artinya jika terdapat modus ganda (misalnya indikasi adanya sub-kelompok atau klaster data yang berbeda)? Mengapa variasi pada satu variabel (misal: berat) jauh lebih masif dibandingkan variabel lain?

### 4. Implikasi Praktis & Rekomendasi Akademis
Berikan 3-4 poin rekomendasi metodologis praktis dengan format bullet point (- ), misalnya: perlunya uji segmentasi/clustering lanjutan, pemeriksaan pencilan (outlier) pada variabel dengan rentang lebar, dan penegasan bahwa analisis deskriptif bersifat eksploratif serta tidak membuktikan hubungan sebab-akibat.
"""
        elif kind == "uji_t":
            structure_guide = """
STRUKTUR LAPORAN WAJIB (Gunakan heading Markdown persis seperti ini):
### 1. Konteks Pengujian & Profil Kelompok
Jelaskan tujuan komparasi dua kelompok independen (Uji t Welch), identitas kedua kelompok, serta ukuran sampel dan karakteristik awal masing-masing kelompok dalam 1-2 paragraf naratif.

### 2. Evaluasi Perbedaan & Signifikansi Statistik
Jelaskan nilai t-hitung, p-value, dan derajat kebebasan (df). Nyatakan secara lugas apakah perbedaan rata-rata kedua kelompok signifikan secara statistik pada taraf signifikansi 5% (alpha = 0.05).

### 3. Makna Praktis vs Signifikansi Statistik
Bahas selisih rata-rata (mean difference) dan standar deviasi masing-masing kelompok. Jelaskan apakah perbedaan yang signifikan secara statistik tersebut juga memiliki dampak praktis (practical significance) yang berarti di dunia nyata.

### 4. Rekomendasi Akademis & Batasan Metodologi
Berikan 3-4 poin kesimpulan dan rekomendasi metodologis dengan format bullet point (- ), meliputi: kehati-hatian dalam menyimpulkan kausalitas, perlunya memeriksa asumsi normalitas/homogenitas, dan saran penelitian lanjutan.
"""
        elif kind == "korelasi":
            structure_guide = """
STRUKTUR LAPORAN WAJIB (Gunakan heading Markdown persis seperti ini):
### 1. Konteks Hubungan Antar Variabel
Jelaskan latar belakang eksplorasi hubungan antara variabel X dan variabel Y, jumlah pasangan observasi (n), dan tujuan pengujian asosiasi linear.

### 2. Evaluasi Arah, Kekuatan, & Signifikansi Hubungan
Jelaskan nilai koefisien korelasi Pearson (r) dan p-value. Uraikan arah hubungan (positif atau negatif), kategori kekuatan keeratannya, serta status signifikansi statistiknya pada taraf 5%.

### 3. Wawasan Kritis: Asosiasi Bukan Kausalitas
Tekankan secara mendalam dan jelas bahwa korelasi semata-mata mengukur pola asosiasi linear, BUKAN hubungan sebab-akibat. Jelaskan potensi variabel perancu (confounding variables) yang mungkin mempengaruhi kedua variabel.

### 4. Rekomendasi Metodologis & Langkah Lanjutan
Berikan 3-4 poin rekomendasi praktis dengan format bullet point (- ), misalnya: visualisasi scatter plot untuk memeriksa keacakan atau pola non-linear, identifikasi pencilan yang mungkin mendistorsi nilai r, dan kelayakan untuk melanjutkan ke analisis regresi jika didukung landasan teori yang kuat.
"""
        else:  # regresi
            structure_guide = """
STRUKTUR LAPORAN WAJIB (Gunakan heading Markdown persis seperti ini):
### 1. Tujuan Pemodelan & Spesifikasi Variabel
Jelaskan tujuan pemodelan regresi linear sederhana, tentukan mana variabel independen (prediktor) dan variabel dependen (respons), serta konteks dataset yang dianalisis.

### 2. Interpretasi Persamaan & Daya Penjelas Model (R²)
Uraikan persamaan regresi yang terbentuk (Y = a + bX). Jelaskan makna nilai R-squared (R²) sebagai proporsi variasi variabel dependen yang mampu dijelaskan oleh model, serta signifikansi model secara keseluruhan.

### 3. Wawasan Prediktif & Makna Koefisien
Jelaskan nilai konstanta (intercept) dan koefisien kemiringan (slope). Apa artinya setiap kenaikan 1 satuan variabel prediktor terhadap perubahan nilai respons? Tegaskan bahwa nilai prediksi ini adalah estimasi rata-rata dengan batas toleransi, bukan kepastian mutlak.

### 4. Catatan Kritis & Rekomendasi Peneliti
Berikan 3-4 poin rekomendasi metodologis dengan format bullet point (- ), seperti: uji asumsi klasik (normalitas residual, homoskedastisitas, linearitas), waspada terhadap ekstrapolasi di luar rentang data, dan pengingat bahwa hubungan regresi prediktif tidak otomatis berarti hubungan kausal sepihak.
"""
    else:  # English
        if kind == "deskriptif":
            structure_guide = """
MANDATORY REPORT STRUCTURE (Use exact Markdown headings):
### 1. Executive Summary & Data Landscape
Narratively explain the dataset size (rows and columns), variables analyzed, and overall dataset context in 1-2 flowing, easy-to-understand paragraphs.

### 2. Variable Synthesis & Distribution Dynamics
Discuss variables together as a unified story (DO NOT discuss one by one in isolated tables):
- Central tendency analysis: compare mean vs median to assess distribution symmetry or skewness.
- Variability analysis: compare range and standard deviation/variance across variables.
- Highlight special patterns: multimodal distributions (dual modes) and what they signify.

### 3. Critical Insights & Latent Patterns
Explain practical meanings and real-world phenomena behind the numbers. What does a bimodal distribution imply (e.g. distinct sub-populations or clusters)? Why is weight variance much larger than diameter?

### 4. Practical Implications & Methodological Recommendations
Provide 3-4 practical recommendations with bullet points (- ), e.g.: segmentation/clustering, outlier detection, and the reminder that descriptive statistics do not imply causality.
"""
        elif kind == "uji_t":
            structure_guide = """
MANDATORY REPORT STRUCTURE (Use exact Markdown headings):
### 1. Test Context & Group Profiles
Explain the comparison objective of the two independent groups (Welch's t-test), group identities, sample sizes, and baseline traits in 1-2 paragraphs.

### 2. Difference Evaluation & Statistical Significance
Discuss t-statistic, p-value, and degrees of freedom (df). Clearly state whether the difference is statistically significant at alpha = 0.05.

### 3. Practical Impact vs Statistical Significance
Discuss the mean difference and standard deviations. Explain whether the statistically significant difference carries practical significance in the real world.

### 4. Academic Recommendations & Methodological Caveats
Provide 3-4 bullet points (- ) covering causality cautions, normality assumptions, and follow-up research ideas.
"""
        elif kind == "korelasi":
            structure_guide = """
MANDATORY REPORT STRUCTURE (Use exact Markdown headings):
### 1. Association Context & Variable Pairing
Explain the relationship context between variable X and variable Y, observation count (n), and linear association objectives.

### 2. Direction, Strength, & Statistical Significance
Discuss Pearson's r and p-value, direction (positive/negative), strength category, and statistical significance at 5%.

### 3. Critical Distinction: Correlation vs Causation
Emphasize strongly that correlation measures linear association only, NOT causality. Note potential confounding factors.

### 4. Methodological Next Steps & Recommendations
Provide 3-4 bullet points (- ) on scatter plot diagnostics, outlier sensitivity, and suitability for regression modeling.
"""
        else:  # regresi
            structure_guide = """
MANDATORY REPORT STRUCTURE (Use exact Markdown headings):
### 1. Modeling Objectives & Variable Specification
Explain linear regression goals, predictor (X) and response (Y) roles, and data context.

### 2. Fitted Equation & Explanatory Power (R²)
Explain the fitted equation (Y = a + bX), R-squared (R²) variance explained, and overall model significance.

### 3. Predictive Insights & Coefficient Interpretation
Explain intercept and slope values, rate of change per unit increase, and prediction boundaries.

### 4. Methodological Diagnostics & Practical Caveats
Provide 3-4 bullet points (- ) on residual diagnostics, extrapolation hazards, and non-causal interpretation.
"""

    prompt = f"""Kamu adalah Asisten Ahli Edukasi Statistik & Data Storyteller senior untuk aplikasi Statistics Story AI.

Tugas Utama:
Ubahlah hasil perhitungan statistik berikut menjadi LAPORAN NARASI ANALITIS & STORYTELLING DATA yang elegan, mendalam, dan mengalir secara alami untuk dibaca mahasiswa dan peneliti.

{structure_guide}

ATURAN FORMAT MUTLAK:
- DILARANG KERAS membuat tabel markdown (garis pipa '|') atau tabel ASCII. Tabel ringkasan statistik sudah disajikan secara terpisah pada modul kartu metrik web. Narasi ini 100% berbentuk prosa/cerita analitis.
- DILARANG mendefinisikan istilah rumus statistik dasar seperti kamus (JANGAN tulis "Mean adalah jumlah dibagi n", "Median adalah nilai tengah", dll). Fokuslah langsung pada makna fenomena data spesifik ini.
- DILARANG menggunakan garis pemisah horizontal ('---').
- JANGAN memecah pembahasan per variabel dengan tabel kaku. Satukan ke dalam sintesis narasi yang saling terhubung.
- Gunakan bullet points ringkas (- ) HANYA pada bagian Implikasi & Rekomendasi (Bagian 4). Bagian 1, 2, dan 3 ditulis dalam bentuk paragraf yang utuh dan mengalir.
- Gunakan {language}.
- Jangan mengarang atau memanipulasi nilai angka statistik yang diberikan.

Hasil analisis statistik:
{json.dumps(result, ensure_ascii=False, indent=2)}

Tulis narasi analitis sekarang:"""

    raw_narrative = ""
    g_client, q_client, gem_key, groq_key, _, _ = get_ai_config()
    if gem_key or groq_key:
        try:
            raw_narrative = generate_with_ai(prompt)
            if raw_narrative and raw_narrative.strip():
                return clean_narrative(raw_narrative)
        except Exception as exc:
            print(f"AI narrative call failed: {exc}. Using academic deterministic narrative.")

    return build_structured_academic_narrative(result, lang)


@app.get("/")
def root():
    return {"message": "Statistics Story AI API aktif", "docs": "/docs"}


@app.get("/health")
@app.get("/api/v1/health")
def health():
    return {"status": "ok"}


@app.get("/api/v1/debug/ai")
def debug_ai():
    now = datetime.now(timezone.utc)
    gemini_cooling = bool(_gemini_cooldown_until and now < _gemini_cooldown_until)
    g_client, q_client, gem_key, groq_key, gem_model, groq_model = get_ai_config()
    return {
        "backend_version": "1.1.0-ai-narrative",
        "gemini_configured": bool(gem_key),
        "groq_configured": bool(groq_key),
        "gemini_model": gem_model if gem_key else None,
        "groq_model": groq_model if groq_key else None,
        "gemini_cooling_down": gemini_cooling,
        "active_provider": "groq" if (gemini_cooling or not gem_key) and groq_key else ("gemini" if gem_key else "offline_fallback"),
    }


@app.post("/api/v1/auth/register")
@app.post("/auth/register", include_in_schema=False)
def register(
    payload: RegisterRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    email = str(payload.email).lower().strip()
    user_name = (payload.nama or payload.name or "").strip()
    if len(user_name) < 2:
        raise HTTPException(status_code=422, detail="Nama minimal 2 karakter.")

    existing = db.scalar(select(User).where(User.email == email))
    if existing:
        raise HTTPException(status_code=409, detail="Email sudah terdaftar.")

    user = User(
        name=user_name,
        email=email,
        password_hash=hash_password(payload.password),
        role=payload.role or "student",
    )
    db.add(user)
    try:
        db.commit()
        db.refresh(user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=409, detail="Email sudah terdaftar.")

    token = create_token(user)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=ENVIRONMENT == "production",
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
        path="/",
    )
    return {
        "message": "Registrasi berhasil.",
        "access_token": token,
        "token": token,
        "refresh_token": token,
        "token_type": "bearer",
        "user": user_response(user),
    }


@app.post("/api/v1/auth/login")
@app.post("/auth/login", include_in_schema=False)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    email = str(payload.email).lower().strip()
    user = db.scalar(select(User).where(User.email == email))
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=401, detail="Email atau password salah."
        )

    token = create_token(user)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=ENVIRONMENT == "production",
        samesite="lax",
        max_age=7 * 24 * 60 * 60,
        path="/",
    )
    return {
        "message": "Login berhasil.",
        "access_token": token,
        "token": token,
        "refresh_token": token,
        "token_type": "bearer",
        "user": user_response(user),
    }


@app.post("/api/v1/auth/refresh")
def refresh_token(
    payload: RefreshTokenRequest | None = None,
    request: Request = None,
    response: Response = None,
    db: Session = Depends(get_db),
):
    token = None
    if payload and payload.refresh_token:
        token = payload.refresh_token
    elif request:
        token = (
            request.cookies.get("access_token")
            or request.cookies.get("session")
            or request.cookies.get("session_token")
        )
        if not token:
            auth_header = request.headers.get("Authorization", "")
            if auth_header.lower().startswith("bearer "):
                token = auth_header[7:].strip()

    if not token:
        raise HTTPException(status_code=401, detail="Token refresh tidak ditemukan.")

    try:
        data = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
        user_id = int(data["sub"])
    except (jwt.InvalidTokenError, ValueError, KeyError, TypeError):
        raise HTTPException(status_code=401, detail="Token kedaluwarsa atau tidak valid.")

    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Pengguna tidak ditemukan.")

    new_token = create_token(user)
    if response:
        response.set_cookie(
            key="access_token",
            value=new_token,
            httponly=True,
            secure=ENVIRONMENT == "production",
            samesite="lax",
            max_age=7 * 24 * 60 * 60,
            path="/",
        )
    return {
        "access_token": new_token,
        "token": new_token,
        "refresh_token": new_token,
        "token_type": "bearer",
        "user": user_response(user),
    }


@app.post("/api/v1/auth/logout")
def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("session", path="/")
    response.delete_cookie("session_token", path="/")
    return {"message": "Logout berhasil."}


@app.get("/api/v1/auth/me")
@app.get("/auth/me", include_in_schema=False)
def me(user: User = Depends(get_current_user)):
    return user_response(user)


@app.post("/api/v1/analyses")
def create_analysis(
    payload: CreateAnalysisRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    item = Analysis(
        id_pengguna=user.id,
        nama_sesi=payload.nama_sesi.strip(),
        status="draf",
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return analysis_response(item)


@app.get("/api/v1/analyses")
@app.get("/api/v1/analyses/history", include_in_schema=False)
def list_analyses(
    page: int = 1,
    limit: int = 10,
    search: str | None = None,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    page = max(1, page)
    limit = min(max(1, limit), 100)
    query = select(Analysis).where(Analysis.id_pengguna == user.id)

    if search:
        query = query.where(
            Analysis.nama_sesi.ilike(f"%{search.strip()}%")
        )

    total = len(db.scalars(query).all())
    items = db.scalars(
        query.order_by(Analysis.tanggal.desc())
        .offset((page - 1) * limit)
        .limit(limit)
    ).all()

    return {
        "items": [analysis_response(item) for item in items],
        "data": [analysis_response(item) for item in items],
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": math.ceil(total / limit) if total else 0,
    }


@app.get("/api/v1/analyses/{analysis_id}")
def get_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    item = get_owned_analysis(analysis_id, user, db)
    return detail_analisis_frontend(item, db)


@app.post("/api/v1/analyses/{analysis_id}/dataset")
async def upload_dataset(
    analysis_id: int,
    request: Request,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    item = get_owned_analysis(analysis_id, user, db)
    content_type = request.headers.get("content-type", "")
    format_data = "json"
    sumber_input = "manual"
    nama_dataset = None

    try:
        if "multipart/form-data" in content_type:
            form = await request.form()
            uploaded = form.get("file")
            format_data = str(form.get("format_data") or "csv")
            sumber_input = str(form.get("sumber_input") or "upload")
            nama_dataset = form.get("nama_dataset")

            if uploaded is not None and hasattr(uploaded, "read"):
                filename = getattr(uploaded, "filename", None) or "dataset.csv"
                content = await uploaded.read()
                if not content:
                    raise HTTPException(status_code=400, detail="File kosong.")

                extension = (
                    filename.rsplit(".", 1)[-1].lower()
                    if "." in filename else ""
                )
                if extension == "csv":
                    df = pd.read_csv(io.BytesIO(content))
                elif extension in ("xlsx", "xls"):
                    df = pd.read_excel(io.BytesIO(content))
                elif extension == "json":
                    parsed = json.loads(content.decode("utf-8-sig"))
                    df = pd.DataFrame(
                        parsed if isinstance(parsed, list)
                        else parsed.get("data", [])
                    )
                elif extension in ("png", "jpg", "jpeg", "webp"):
                    img_mime = "image/jpeg" if extension in ("jpg", "jpeg") else f"image/{extension}"
                    extracted_rows = extract_table_from_image(content, img_mime)
                    df = pd.DataFrame(extracted_rows)
                    format_data = "image"
                else:
                    raise HTTPException(
                        status_code=400,
                        detail="Format file yang didukung: CSV, XLSX, XLS, JSON, PNG, JPG, JPEG, WEBP.",
                    )

                if len(df) > 10000:
                    raise HTTPException(
                        status_code=400,
                        detail="Dataset maksimal 10.000 baris.",
                    )
                data = records_from_dataframe(df)
                nama_dataset = str(nama_dataset or filename)
            else:
                data_siap = form.get("data_siap_pakai")
                data_mentah = form.get("data_mentah")

                if data_siap:
                    data = json.loads(str(data_siap))
                elif data_mentah:
                    raw = json.loads(str(data_mentah))
                    data = raw if isinstance(raw, list) else raw.get("data", [])
                else:
                    raise HTTPException(
                        status_code=400,
                        detail="File atau data dataset belum dikirim.",
                    )

                if isinstance(data, dict):
                    data = data.get("data", data.get("rows", []))
                if not isinstance(data, list):
                    raise HTTPException(
                        status_code=400,
                        detail="Data dataset harus berbentuk daftar baris.",
                    )
        else:
            body = await request.json()
            format_data = str(body.get("format_data") or "json")
            sumber_input = str(body.get("sumber_input") or "manual")
            nama_dataset = body.get("nama_dataset")
            data = (
                body.get("data_siap_pakai")
                if body.get("data_siap_pakai") is not None
                else body.get("data_mentah")
            )
            if data is None:
                data = body.get("data")

            if isinstance(data, dict):
                if isinstance(data.get("data"), list):
                    data = data["data"]
                elif isinstance(data.get("rows"), list):
                    data = data["rows"]

            if not isinstance(data, list):
                raise HTTPException(
                    status_code=400,
                    detail="Kirim data_siap_pakai atau data_mentah berbentuk daftar baris.",
                )
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=f"Dataset gagal dibaca: {str(exc)}",
        )

    if not data:
        raise HTTPException(
            status_code=400, detail="Dataset tidak memiliki baris data."
        )

    item.data_json = data
    item.format_data = format_data
    item.sumber_input = sumber_input
    item.nama_dataset = str(nama_dataset) if nama_dataset else None
    item.hasil_json = None
    item.status = "draf"
    db.commit()
    db.refresh(item)

    return detail_analisis_frontend(item, db)


@app.post("/api/v1/extract-image")
async def extract_image_endpoint(
    request: Request,
    user: User = Depends(get_current_user),
):
    """
    Ekstrak data tabel dari file gambar (PNG, JPG, JPEG, WEBP) menjadi dataset tabel terstruktur.
    """
    content_type = request.headers.get("content-type", "")
    if "multipart/form-data" not in content_type:
        raise HTTPException(
            status_code=400, detail="Permintaan harus dalam format multipart/form-data."
        )

    form = await request.form()
    uploaded = form.get("file")
    if uploaded is None or not hasattr(uploaded, "read"):
        raise HTTPException(status_code=400, detail="File gambar belum diunggah.")

    filename = getattr(uploaded, "filename", None) or "gambar.png"
    content = await uploaded.read()
    if not content:
        raise HTTPException(status_code=400, detail="File gambar kosong.")

    extension = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if extension not in ("png", "jpg", "jpeg", "webp"):
        raise HTTPException(
            status_code=400,
            detail="Format gambar yang didukung: PNG, JPG, JPEG, WEBP.",
        )

    mime_type = "image/jpeg" if extension in ("jpg", "jpeg") else f"image/{extension}"

    try:
        rows = extract_table_from_image(content, mime_type)
        if not rows:
            raise HTTPException(
                status_code=400,
                detail="Tabel data tidak ditemukan di dalam gambar.",
            )

        df = pd.DataFrame(rows)
        headers = list(df.columns)
        kolom_info = []
        for col in headers:
            col_series = df[col]
            num_count = pd.to_numeric(col_series, errors="coerce").notnull().sum()
            is_num = (num_count / len(col_series)) >= 0.7 if len(col_series) > 0 else False
            samples = [str(x) for x in col_series.dropna().head(3).tolist()]
            kolom_info.append({
                "name": str(col),
                "type": "numeric" if is_num else "categorical",
                "sampleValues": samples,
                "distinctCount": int(col_series.nunique()),
            })

        dataset_name = filename.rsplit(".", 1)[0]
        return {
            "success": True,
            "nama_file": filename,
            "nama_dataset": dataset_name,
            "format_data": "image",
            "sumber_input": "mentah",
            "total_baris": len(df),
            "total_kolom": len(headers),
            "kolom": headers,
            "kolom_info": kolom_info,
            "preview_baris": rows[:10],
            "data_mentah": rows,
        }
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.put("/api/v1/analyses/{analysis_id}/config")
@app.post("/api/v1/analyses/{analysis_id}/config", include_in_schema=False)
def update_config(
    analysis_id: int,
    payload: ConfigRequest,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    item = get_owned_analysis(analysis_id, user, db)
    allowed = {"deskriptif", "uji_t", "korelasi", "regresi"}
    if payload.jenis_analisis not in allowed:
        raise HTTPException(
            status_code=400, detail="Jenis analisis tidak didukung."
        )

    item.jenis_analisis = payload.jenis_analisis
    item.config_json = payload.config_json
    item.hasil_json = None
    item.status = "draf"
    db.commit()
    db.refresh(item)
    return analysis_response(item)


@app.post("/api/v1/analyses/{analysis_id}/run")
def run_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    item = get_owned_analysis(analysis_id, user, db)
    if not item.data_json:
        raise HTTPException(
            status_code=400, detail="Unggah dataset terlebih dahulu."
        )
    if not item.jenis_analisis:
        raise HTTPException(
            status_code=400, detail="Pilih jenis analisis terlebih dahulu."
        )

    item.status = "diproses"
    db.commit()

    try:
        result = calculate_analysis(item)
        item.hasil_json = result
        item.status = "selesai"
        db.commit()
        db.refresh(item)
        detail = detail_analisis_frontend(item, db)
        return {
            **detail,
            "message": "Analisis berhasil dijalankan.",
            "hasil": detail["hasil"],
            "result": result,
            "status": item.status,
        }
    except HTTPException:
        item.status = "gagal"
        db.commit()
        raise
    except Exception as exc:
        item.status = "gagal"
        db.commit()
        raise HTTPException(
            status_code=400,
            detail=f"Analisis gagal dijalankan: {str(exc)}",
        )


@app.get("/api/v1/analyses/{analysis_id}/result")
def get_analysis_result(
    analysis_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    item = get_owned_analysis(analysis_id, user, db)
    return detail_analisis_frontend(item, db)


@app.post("/api/v1/analyses/{analysis_id}/narrative")
def generate_narrative(
    analysis_id: int,
    lang: str = "id",
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    item = get_owned_analysis(analysis_id, user, db)
    if not item.hasil_json:
        raise HTTPException(
            status_code=400,
            detail="Jalankan analisis terlebih dahulu.",
        )

    lang = lang.lower()
    if lang not in ("id", "en"):
        raise HTTPException(
            status_code=400, detail="Bahasa harus id atau en."
        )


    existing_narrative = (
        item.narasi_id if lang == "id" else item.narasi_en
    )

    if existing_narrative and not _narasi_terlihat_template(existing_narrative):
        narrative = existing_narrative
    else:
        narrative = make_narrative(item.hasil_json, lang)

        if lang == "id":
            item.narasi_id = narrative
        else:
            item.narasi_en = narrative

        db.commit()
        db.refresh(item)
    detail = detail_analisis_frontend(item, db)
    detail["lang"] = lang
    detail["narrative"] = narrative
    return detail


@app.post("/api/v1/analyses/{analysis_id}/save")
def save_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    item = get_owned_analysis(analysis_id, user, db)
    item.disimpan = True
    db.commit()
    db.refresh(item)
    return {
        "message": "Analisis berhasil disimpan.",
        **analysis_response(item),
    }


@app.delete("/api/v1/analyses")
def delete_all_analyses(
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    statement = select(Analysis).where(Analysis.id_pengguna == user.id)
    items = list(db.scalars(statement).all())
    count = len(items)
    for item in items:
        db.delete(item)
    db.commit()
    return {
        "message": f"Seluruh riwayat analisis ({count} sesi) berhasil dihapus.",
        "deleted_count": count,
    }


@app.delete("/api/v1/analyses/{analysis_id}")
def delete_analysis(
    analysis_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    item = get_owned_analysis(analysis_id, user, db)
    db.delete(item)
    db.commit()
    return {"message": "Analisis berhasil dihapus."}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
