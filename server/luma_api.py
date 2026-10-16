"""Luma account API. No credentials or trading integrations are used here."""

from __future__ import annotations

import argparse
from contextlib import contextmanager
from dataclasses import dataclass
import getpass
import hashlib
import hmac
import json
import logging
from pathlib import Path
import re
import secrets
import sqlite3
import time
from urllib.parse import parse_qs
import uuid

ITERATIONS = 600_000
BODY_LIMIT = 262_144
EMAIL_PATTERN = re.compile(r"^[^\s@]{1,64}@[^\s@.]+(?:\.[^\s@.]+)+$")


class ApiError(Exception):
    def __init__(self, status: int, message: str):
        self.status, self.message = status, message


def password_hash(password: str, salt: bytes | None = None) -> str:
    salt = salt or secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, ITERATIONS)
    return "$".join(("pbkdf2_sha256", str(ITERATIONS), salt.hex(), digest.hex()))


def password_matches(password: str, encoded: str) -> bool:
    try:
        scheme, rounds, salt, expected = encoded.split("$")
        if scheme != "pbkdf2_sha256" or int(rounds) != ITERATIONS:
            return False
        actual = hashlib.pbkdf2_hmac("sha256", password.encode(), bytes.fromhex(salt), int(rounds))
        return hmac.compare_digest(actual.hex(), expected)
    except (ValueError, TypeError):
        return False


def digest(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def email_address(value: object) -> str:
    if not isinstance(value, str):
        raise ApiError(400, "Indirizzo email non valido.")
    value = value.strip().lower()
    if len(value) > 254 or not EMAIL_PATTERN.fullmatch(value):
        raise ApiError(400, "Indirizzo email non valido.")
    return value


@dataclass(frozen=True)
class Settings:
    database: Path
    allowed_origins: tuple[str, ...]
    session_hours: int = 168

    def __post_init__(self):
        if not self.allowed_origins or any(
            not origin.startswith(("https://", "http://localhost:", "http://127.0.0.1:"))
            or "*" in origin or origin.endswith("/")
            for origin in self.allowed_origins
        ):
            raise ValueError("Configure explicit allowed origins without trailing slashes.")
        if not 1 <= self.session_hours <= 720:
            raise ValueError("session_hours must be between 1 and 720.")


class Store:
    def __init__(self, settings: Settings):
        self.settings = settings
        settings.database.parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as db:
            db.execute("PRAGMA journal_mode=WAL")
            db.executescript("""
                CREATE TABLE IF NOT EXISTS accounts (
                  id TEXT PRIMARY KEY,
                  email TEXT NOT NULL UNIQUE,
                  display_name TEXT NOT NULL,
                  password_hash TEXT NOT NULL,
                  role TEXT NOT NULL DEFAULT 'player' CHECK(role IN ('player','admin')),
                  approval_status TEXT NOT NULL DEFAULT 'pending'
                    CHECK(approval_status IN ('pending','approved','rejected')),
                  created_at INTEGER NOT NULL,
                  reviewed_at INTEGER
                );
                CREATE TABLE IF NOT EXISTS sessions (
                  token_hash TEXT PRIMARY KEY,
                  user_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
                  expires_at INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS sessions_user ON sessions(user_id);
                CREATE TABLE IF NOT EXISTS progress (
                  user_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
                  document TEXT NOT NULL,
                  updated_at INTEGER NOT NULL
                );
                CREATE TABLE IF NOT EXISTS request_limits (
                  bucket TEXT PRIMARY KEY,
                  attempts INTEGER NOT NULL,
                  expires_at INTEGER NOT NULL
                );
                CREATE TABLE IF NOT EXISTS approval_audit (
                  id INTEGER PRIMARY KEY,
                  admin_id TEXT NOT NULL REFERENCES accounts(id),
                  player_id TEXT NOT NULL REFERENCES accounts(id),
                  status TEXT NOT NULL,
                  created_at INTEGER NOT NULL
                );
            """)
        # Use a deterministic dummy hash to equalize unknown-user password checks.
        self.dummy_hash = password_hash("not-a-real-account-password", bytes(16))

    @contextmanager
    def connect(self):
        db = sqlite3.connect(self.settings.database, timeout=10)
        db.row_factory = sqlite3.Row
        db.execute("PRAGMA foreign_keys=ON")
        try:
            with db:
                yield db
        finally:
            db.close()

    def limit(self, bucket: str, count: int, seconds: int):
        now = int(time.time())
        with self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            db.execute("DELETE FROM request_limits WHERE expires_at <= ?", (now,))
            row = db.execute("SELECT attempts FROM request_limits WHERE bucket=?", (bucket,)).fetchone()
            if row and row["attempts"] >= count:
                raise ApiError(429, "Troppi tentativi. Attendi qualche minuto e riprova.")
            db.execute(
                "INSERT INTO request_limits VALUES (?,1,?) ON CONFLICT(bucket) DO UPDATE SET attempts=attempts+1",
                (bucket, now + seconds),
            )

    def create_admin(self, email: str, name: str, encoded: str):
        email = email_address(email)
        if not re.fullmatch(r"pbkdf2_sha256\$600000\$[a-f0-9]{32}\$[a-f0-9]{64}", encoded):
            raise ValueError("Invalid administrator password hash.")
        with self.connect() as db:
            if db.execute("SELECT 1 FROM accounts WHERE role='admin'").fetchone():
                raise ValueError("An administrator already exists; bootstrap cannot reset it.")
            db.execute(
                "INSERT INTO accounts VALUES (?,?,?,?, 'admin','approved',?,?)",
                (str(uuid.uuid4()), email, name[:40], encoded, int(time.time()), int(time.time())),
            )

    @staticmethod
    def profile(row):
        return {key: row[key] for key in ("id", "email", "display_name", "role", "approval_status", "created_at")}

    def authenticate(self, authorization: str, *, approved=False, admin=False):
        prefix = "Bearer "
        if not authorization.startswith(prefix) or not 20 <= len(authorization) <= 300:
            raise ApiError(401, "Accedi per continuare.")
        with self.connect() as db:
            row = db.execute(
                "SELECT a.* FROM sessions s JOIN accounts a ON a.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?",
                (digest(authorization[len(prefix):]), int(time.time())),
            ).fetchone()
        if not row:
            raise ApiError(401, "Sessione scaduta. Accedi di nuovo.")
        if (approved or admin) and row["approval_status"] != "approved":
            raise ApiError(403, "Il profilo non è approvato.")
        if admin and row["role"] != "admin":
            raise ApiError(403, "Questa funzione richiede un amministratore.")
        return row


class Application:
    def __init__(self, settings: Settings):
        self.store = Store(settings)
        self.settings = settings

    @staticmethod
    def read_json(environ):
        try:
            size = int(environ.get("CONTENT_LENGTH") or "0")
        except ValueError:
            raise ApiError(400, "Dimensione richiesta non valida.") from None
        if size < 0 or size > BODY_LIMIT:
            raise ApiError(413, "Richiesta troppo grande.")
        if environ.get("CONTENT_TYPE", "").split(";")[0].strip().lower() != "application/json":
            raise ApiError(415, "È richiesto il formato JSON.")
        try:
            raw = environ["wsgi.input"].read(size)
            def reject_constant(_):
                raise ValueError("Non-finite JSON number")
            value = json.loads(raw or b"{}", parse_constant=reject_constant)
        except (ValueError, UnicodeDecodeError):
            raise ApiError(400, "Richiesta JSON non valida.") from None
        if not isinstance(value, dict):
            raise ApiError(400, "La richiesta deve essere un oggetto JSON.")
        return value

    def route(self, env):
        path, method = env.get("PATH_INFO", ""), env["REQUEST_METHOD"]
        auth = env.get("HTTP_AUTHORIZATION", "")
        address = digest(env.get("REMOTE_ADDR", "unknown"))
        if path == "/api/health" and method == "GET":
            return 200, {"status": "ok", "application": "luma", "schema": 1}
        if path == "/api/auth/register" and method == "POST":
            self.store.limit("register:" + address, 5, 3600)
            body = self.read_json(env)
            email = email_address(body.get("email"))
            name, password = body.get("displayName"), body.get("password")
            if not isinstance(name, str) or not 1 <= len(name.strip()) <= 40:
                raise ApiError(400, "Il nome deve contenere da 1 a 40 caratteri.")
            if not isinstance(password, str) or not 12 <= len(password) <= 128:
                raise ApiError(400, "La password deve contenere da 12 a 128 caratteri.")
            encoded = password_hash(password)
            with self.store.connect() as db:
                db.execute(
                    "INSERT OR IGNORE INTO accounts(id,email,display_name,password_hash,created_at) VALUES (?,?,?,?,?)",
                    (str(uuid.uuid4()), email, name.strip(), encoded, int(time.time())),
                )
            # Same response for existing addresses; never replace their password or role.
            return 202, {"status": "pending"}
        if path == "/api/auth/login" and method == "POST":
            self.store.limit("login-ip:" + address, 40, 900)
            body = self.read_json(env)
            email = email_address(body.get("email"))
            self.store.limit("login-email:" + digest(email), 12, 900)
            password = body.get("password")
            if not isinstance(password, str) or len(password) > 128:
                raise ApiError(401, "Email o password non corretti.")
            with self.store.connect() as db:
                row = db.execute("SELECT * FROM accounts WHERE email=?", (email,)).fetchone()
                valid = password_matches(password, row["password_hash"] if row else self.store.dummy_hash)
                if not row or not valid:
                    raise ApiError(401, "Email o password non corretti.")
                token = secrets.token_urlsafe(32)
                expires = int(time.time()) + self.settings.session_hours * 3600
                db.execute("DELETE FROM sessions WHERE expires_at<=?", (int(time.time()),))
                db.execute("INSERT INTO sessions VALUES (?,?,?)", (digest(token), row["id"], expires))
                return 200, {"access_token": token, "expires_at": expires, "user": self.store.profile(row)}
        if path == "/api/auth/me" and method == "GET":
            return 200, self.store.profile(self.store.authenticate(auth))
        if path == "/api/auth/logout" and method == "POST":
            self.store.authenticate(auth)
            with self.store.connect() as db:
                db.execute("DELETE FROM sessions WHERE token_hash=?", (digest(auth[7:]),))
            return 200, {"status": "signed_out"}
        if path == "/api/progress" and method in ("GET", "PUT"):
            user = self.store.authenticate(auth, approved=True)
            with self.store.connect() as db:
                if method == "GET":
                    row = db.execute("SELECT document FROM progress WHERE user_id=?", (user["id"],)).fetchone()
                    return 200, {"progress": json.loads(row["document"]) if row else None}
                body = self.read_json(env)
                document = body.get("progress")
                if not isinstance(document, dict):
                    raise ApiError(400, "Progressi non validi.")
                db.execute(
                    "INSERT INTO progress VALUES (?,?,?) ON CONFLICT(user_id) DO UPDATE SET document=excluded.document,updated_at=excluded.updated_at",
                    (user["id"], json.dumps(document, ensure_ascii=False, allow_nan=False), int(time.time())),
                )
            return 200, {"status": "saved"}
        if path == "/api/admin/players" and method == "GET":
            self.store.authenticate(auth, admin=True)
            query = parse_qs(env.get("QUERY_STRING", ""))
            try:
                offset = max(0, int(query.get("offset", ["0"])[0]))
            except ValueError:
                raise ApiError(400, "Pagina non valida.") from None
            with self.store.connect() as db:
                rows = db.execute(
                    "SELECT * FROM accounts WHERE role='player' ORDER BY CASE approval_status WHEN 'pending' THEN 0 ELSE 1 END,created_at DESC LIMIT 100 OFFSET ?",
                    (offset,),
                ).fetchall()
                total = db.execute("SELECT COUNT(*) FROM accounts WHERE role='player'").fetchone()[0]
            return 200, {"players": [self.store.profile(row) for row in rows], "total": total, "offset": offset}
        if path.startswith("/api/admin/players/") and method == "POST":
            admin = self.store.authenticate(auth, admin=True)
            user_id = path.removeprefix("/api/admin/players/")
            body = self.read_json(env)
            status = body.get("approval_status")
            if status not in ("approved", "rejected", "pending"):
                raise ApiError(400, "Stato di approvazione non valido.")
            with self.store.connect() as db:
                row = db.execute("SELECT * FROM accounts WHERE id=? AND role='player'", (user_id,)).fetchone()
                if not row:
                    raise ApiError(404, "Giocatore non trovato.")
                db.execute("UPDATE accounts SET approval_status=?,reviewed_at=? WHERE id=?", (status, int(time.time()), user_id))
                db.execute("INSERT INTO approval_audit(admin_id,player_id,status,created_at) VALUES (?,?,?,?)", (admin["id"], user_id, status, int(time.time())))
                if status != "approved":
                    db.execute("DELETE FROM sessions WHERE user_id=?", (user_id,))
            return 200, {"id": user_id, "approval_status": status}
        raise ApiError(404, "Risorsa non trovata.")

    def __call__(self, environ, start_response):
        origin = environ.get("HTTP_ORIGIN", "")
        allowed = origin in self.settings.allowed_origins
        headers = [("Content-Type", "application/json; charset=utf-8"), ("Cache-Control", "no-store"),
                   ("X-Content-Type-Options", "nosniff"), ("Referrer-Policy", "no-referrer"), ("Vary", "Origin")]
        if allowed:
            headers += [("Access-Control-Allow-Origin", origin), ("Access-Control-Allow-Headers", "Authorization, Content-Type"),
                        ("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS"), ("Access-Control-Max-Age", "600")]
        try:
            if origin and not allowed:
                raise ApiError(403, "Origine non autorizzata.")
            if environ["REQUEST_METHOD"] == "OPTIONS":
                status, body = 200, {}
            else:
                status, body = self.route(environ)
        except ApiError as exc:
            status, body = exc.status, {"error": exc.message}
        except Exception as exc:
            logging.error("Luma API request failed (%s)", type(exc).__name__)
            status, body = 500, {"error": "Servizio temporaneamente non disponibile."}
        payload = json.dumps(body, ensure_ascii=False, allow_nan=False).encode()
        headers.append(("Content-Length", str(len(payload))))
        reasons = {200: "OK", 202: "Accepted", 400: "Bad Request", 401: "Unauthorized", 403: "Forbidden", 404: "Not Found", 413: "Content Too Large", 415: "Unsupported Media Type", 429: "Too Many Requests", 500: "Internal Server Error"}
        start_response(f"{status} {reasons[status]}", headers)
        return [payload]


def main():
    parser = argparse.ArgumentParser(description="Luma isolated account API")
    parser.add_argument("--config", type=Path, required=True)
    parser.add_argument("--create-admin", action="store_true")
    args = parser.parse_args()
    data = json.loads(args.config.read_text(encoding="utf-8-sig"))
    database = (args.config.parent / data["database"]).resolve()
    settings = Settings(database, tuple(data["allowed_origins"]), data.get("session_hours", 168))
    application = Application(settings)
    if args.create_admin:
        email = input("Administrator email: ").strip()
        password = getpass.getpass("Administrator password (12-128 characters): ")
        if not 12 <= len(password) <= 128:
            raise ValueError("Password must contain 12-128 characters.")
        if password != getpass.getpass("Repeat password: "):
            raise ValueError("Passwords do not match.")
        application.store.create_admin(email, "Amministratore", password_hash(password))
        print("Administrator created.")
        return
    bootstrap = settings.database.parent / "bootstrap-admin.json"
    if bootstrap.exists():
        seed = json.loads(bootstrap.read_text(encoding="utf-8-sig"))
        application.store.create_admin(seed["email"], "Amministratore", seed["password_hash"])
        bootstrap.unlink()
        del seed
    from waitress import serve
    serve(application, host=data.get("host", "127.0.0.1"), port=int(data.get("port", 8796)),
          threads=4, max_request_body_size=BODY_LIMIT, channel_timeout=30, ident="Luma")


if __name__ == "__main__":
    main()
