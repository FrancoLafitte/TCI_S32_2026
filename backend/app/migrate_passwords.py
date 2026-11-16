"""Convierte las contraseñas antiguas: uv run python -m app.migrate_passwords."""

from pwdlib.hashers.argon2 import Argon2Hasher
from sqlmodel import Session, select

from app.database import engine
from app.models import Usuario
from app.security import hash_password


def migrate_passwords(session: Session) -> int:
    """Migra en una transacción y conserva los hashes Argon2 existentes."""
    migrated = 0
    try:
        for usuario in session.exec(select(Usuario)).all():
            if Argon2Hasher.identify(usuario.password):
                continue
            usuario.password = hash_password(usuario.password)
            session.add(usuario)
            migrated += 1
        session.commit()
    except Exception:
        session.rollback()
        raise
    return migrated


def main() -> None:
    with Session(engine) as session:
        migrated = migrate_passwords(session)
    print(f"Contraseñas migradas: {migrated}")


if __name__ == "__main__":
    main()
