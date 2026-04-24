#!/bin/sh
mc alias set myminio http://minio:9000 "${MINIO_ACCESS_KEY}" "${MINIO_SECRET_KEY}"
mc mb --ignore-existing myminio/profile-pictures
mc mb --ignore-existing myminio/class-materials
mc mb --ignore-existing myminio/qr-codes
mc anonymous set download myminio/profile-pictures
