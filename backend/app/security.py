"""Funciones para proteger y verificar contraseñas con Argon2."""

from pwdlib import PasswordHash


_password_hash = PasswordHash.recommended()


def hash_password(password: str) -> str:
    """Genera un hash con una sal aleatoria para almacenar la contraseña."""
    return _password_hash.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    """Comprueba si la contraseña ingresada corresponde al hash guardado."""
    return _password_hash.verify(password, password_hash)
