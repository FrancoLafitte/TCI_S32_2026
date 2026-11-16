from app.security import hash_password, verify_password


def test_hash_con_sal_y_verificacion():
    first = hash_password("1234")
    second = hash_password("1234")
    assert first.startswith("$argon2id$")
    assert first != second
    assert verify_password("1234", first)
    assert not verify_password("incorrecta", first)


def test_password_sin_migrar_no_se_acepta_como_hash():
    assert not verify_password("1234", "1234")
