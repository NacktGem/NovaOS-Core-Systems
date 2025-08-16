import sys
import pathlib

sys.path.append(str(pathlib.Path(__file__).resolve().parents[1]))


def test_consents_created(client, session):
    from app.db.models import Consent
    client.post("/auth/login", json={"email": "creator1@local", "password": "devdev"})
    csrf = client.cookies.get("csrf_token")
    assert csrf
    res = client.post(
        "/consent/upload",
        json={"partner_name": "p", "content_ids": []},
        headers={"x-csrf-token": csrf},
    )
    assert res.status_code == 200
    assert session.query(Consent).count() >= 1


def test_dmca_reports_created(client, session):
    from app.db.models import DMCAReport
    client.post("/auth/login", json={"email": "creator1@local", "password": "devdev"})
    csrf = client.cookies.get("csrf_token")
    assert csrf
    res = client.post(
        "/dmca/report",
        json={"reporter_email": "a@b", "content_ref": "c", "details": "d"},
        headers={"x-csrf-token": csrf},
    )
    assert res.status_code == 200
    assert session.query(DMCAReport).count() >= 1
