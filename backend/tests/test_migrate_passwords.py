import pytest
from sqlmodel import Session, SQLModel, create_engine, select

from app.migrate_passwords import migrate_passwords
from app.models import Maquina, Usuario
from app.security import hash_password, verify_password


def test_migracion_conserva_datos_y_no_repite_hashes():
    engine = create_engine("sqlite://")
    SQLModel.metadata.create_all(engine)
    existing_hash = hash_password("otra-clave")
    with Session(engine) as session:
        legacy = Usuario(email="legacy@planta.com", password="1234", nombre="Ana", rol="operario")
        hashed = Usuario(email="hashed@planta.com", password=existing_hash, nombre="Luis", rol="gerencia")
        session.add_all([legacy, hashed, Maquina(codigo="M1", nombre="Máquina", tipo="T", ejemplar="E")])
        session.commit()
        legacy_id = legacy.id

        assert migrate_passwords(session) == 1
        session.expire_all()
        migrated = session.get(Usuario, legacy_id)
        assert migrated is not None
        assert verify_password("1234", migrated.password)
        assert not verify_password("incorrecta", migrated.password)
        assert (migrated.nombre, migrated.email, migrated.rol) == ("Ana", "legacy@planta.com", "operario")
        assert session.get(Usuario, hashed.id).password == existing_hash
        assert session.get(Maquina, "M1").nombre == "Máquina"
        first_hash = migrated.password

        assert migrate_passwords(session) == 0
        session.expire_all()
        assert session.get(Usuario, legacy_id).password == first_hash
        assert len(session.exec(select(Usuario)).all()) == 2
    engine.dispose()


def test_migracion_revierte_todos_los_cambios_si_falla(monkeypatch):
    engine = create_engine("sqlite://")
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        session.add_all([
            Usuario(email="a@planta.com", password="primera", nombre="A", rol="operario"),
            Usuario(email="b@planta.com", password="segunda", nombre="B", rol="operario"),
        ])
        session.commit()

        def failing_hash(password):
            if password == "segunda":
                raise RuntimeError("Fallo simulado")
            return hash_password(password)

        monkeypatch.setattr("app.migrate_passwords.hash_password", failing_hash)
        with pytest.raises(RuntimeError, match="Fallo simulado"):
            migrate_passwords(session)
        passwords = {u.email: u.password for u in session.exec(select(Usuario)).all()}
        assert passwords == {"a@planta.com": "primera", "b@planta.com": "segunda"}
    engine.dispose()
