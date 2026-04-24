import pytest

from app.core.security import (
    compute_hmac,
    create_access_token,
    create_refresh_token,
    decode_access_token,
    decode_refresh_token,
    encrypt_data,
    decrypt_data,
    generate_token,
    hash_password,
    hash_token,
    verify_hmac,
    verify_password,
)


class TestPasswordHashing:
    def test_hash_and_verify(self):
        password = "SecurePass123!"
        hashed = hash_password(password)
        assert verify_password(password, hashed)

    def test_wrong_password(self):
        hashed = hash_password("correct")
        assert not verify_password("wrong", hashed)


class TestJWT:
    def test_access_token_roundtrip(self):
        data = {"sub": "test-user-id", "role": "student"}
        token = create_access_token(data)
        decoded = decode_access_token(token)
        assert decoded is not None
        assert decoded["sub"] == "test-user-id"
        assert decoded["type"] == "access"

    def test_refresh_token_roundtrip(self):
        data = {"sub": "test-user-id"}
        token = create_refresh_token(data)
        decoded = decode_refresh_token(token)
        assert decoded is not None
        assert decoded["sub"] == "test-user-id"
        assert decoded["type"] == "refresh"

    def test_access_token_invalid(self):
        assert decode_access_token("invalid.token.here") is None

    def test_refresh_as_access_fails(self):
        token = create_refresh_token({"sub": "user"})
        assert decode_access_token(token) is None


class TestEncryption:
    def test_encrypt_decrypt(self):
        from app.config import settings
        from cryptography.fernet import Fernet

        settings.FERNET_ENCRYPTION_KEY = Fernet.generate_key().decode()
        plaintext = "sensitive-government-id-123"
        encrypted = encrypt_data(plaintext)
        assert encrypted != plaintext
        decrypted = decrypt_data(encrypted)
        assert decrypted == plaintext

    def test_decrypt_invalid(self):
        result = decrypt_data("not-valid-ciphertext")
        assert result is None


class TestHMAC:
    def test_hmac_roundtrip(self):
        data = "some-data-to-hash"
        mac = compute_hmac(data)
        assert verify_hmac(data, mac)

    def test_hmac_different_data(self):
        mac = compute_hmac("data1")
        assert not verify_hmac("data2", mac)


class TestTokenGeneration:
    def test_generate_unique(self):
        t1 = generate_token()
        t2 = generate_token()
        assert t1 != t2
        assert len(t1) > 20

    def test_hash_token_deterministic(self):
        token = "test-token"
        h1 = hash_token(token)
        h2 = hash_token(token)
        assert h1 == h2
