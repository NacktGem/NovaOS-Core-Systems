import importlib.util
import pathlib
import sys
from urllib.parse import quote

from fastapi.testclient import TestClient

spec = importlib.util.spec_from_file_location('echo_app', pathlib.Path(__file__).resolve().parents[1] / 'main.py')
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)
app = module.app
client = TestClient(app)


def ws_connect(room, uid, role):
    return client.websocket_connect(f'/echo/ws?room={quote(room)}', headers={'x-user-id': uid, 'x-user-role': role})


def test_rose_garden_chat():
    with ws_connect('#rose-garden', 'u1', 'user_verified') as a, ws_connect('#rose-garden', 'u2', 'user_verified') as b:
        a.send_text('hi')
        assert b.receive_text() == 'hi'


def test_founder_room_no_transcript():
    module.transcripts['#founder-room'] = []
    with ws_connect('#founder-room', 'f1', 'godmode') as ws:
        ws.send_text('secret')
    assert '#founder-room' not in module.transcripts or module.transcripts['#founder-room'] == []


def test_family_allowlist():
    hid = 'house1'
    try:
        ws_connect(f'family-{hid}', 'c1', 'child')
    except Exception:
        pass
    client.post('/echo/family/invite', json={'household_id': hid, 'user_id': 'c1'}, headers={'x-user-id': 'founder', 'x-user-role': 'godmode'})
    with ws_connect(f'family-{hid}', 'c1', 'child') as ws:
        ws.send_text('hey')
        assert module.households[hid] == {'c1'}
