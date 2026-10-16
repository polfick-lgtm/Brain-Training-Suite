import io
import json
from pathlib import Path
import tempfile
import time
import unittest

from server.luma_api import Application, BODY_LIMIT, Settings, password_hash


class AccountApiTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.addCleanup(self.directory.cleanup)
        self.settings = Settings(Path(self.directory.name) / "luma.sqlite3", ("https://polfick-lgtm.github.io",))
        self.app = Application(self.settings)
        self.password = "test-only-password-123"
        self.app.store.create_admin("admin@example.test", "Admin", password_hash(self.password))

    def call(self, path, method="GET", data=None, token=None, origin="https://polfick-lgtm.github.io", raw=None, address="test-client"):
        body = raw if raw is not None else json.dumps(data or {}).encode()
        route, _, query = path.partition("?")
        env = {"REQUEST_METHOD": method, "PATH_INFO": route, "QUERY_STRING": query,
               "CONTENT_TYPE": "application/json", "CONTENT_LENGTH": str(len(body)),
               "wsgi.input": io.BytesIO(body), "REMOTE_ADDR": address, "HTTP_ORIGIN": origin}
        if token:
            env["HTTP_AUTHORIZATION"] = "Bearer " + token
        result = {}
        def start(status, headers):
            result["status"] = int(status.split()[0])
            result["headers"] = dict(headers)
        response = b"".join(self.app(env, start))
        result["body"] = json.loads(response)
        return result

    def register(self, email="player@example.test", **extra):
        return self.call("/api/auth/register", "POST", {
            "email": email, "password": self.password, "displayName": "Player", **extra,
        })

    def login(self, email="player@example.test", password=None):
        result = self.call("/api/auth/login", "POST", {"email": email, "password": password or self.password})
        self.assertEqual(result["status"], 200, result)
        return result["body"]["access_token"]

    def approve(self, email="player@example.test"):
        admin = self.login("admin@example.test")
        rows = self.call("/api/admin/players", token=admin)["body"]["players"]
        player = next(row for row in rows if row["email"] == email)
        result = self.call("/api/admin/players/" + player["id"], "POST", {"approval_status": "approved"}, admin)
        self.assertEqual(result["status"], 200)
        return player["id"], admin

    def test_registration_cannot_assign_admin_or_approve_itself(self):
        self.assertEqual(self.register(role="admin", approval_status="approved")["status"], 202)
        token = self.login()
        profile = self.call("/api/auth/me", token=token)["body"]
        self.assertEqual(profile["role"], "player")
        self.assertEqual(profile["approval_status"], "pending")
        self.assertEqual(self.call("/api/progress", token=token)["status"], 403)
        self.assertEqual(self.call("/api/progress", "PUT", {"progress": {}}, token)["status"], 403)
        self.assertEqual(self.call("/api/admin/players", token=token)["status"], 403)
        self.assertEqual(self.call("/api/admin/players/" + profile["id"], "POST", {"approval_status": "approved"}, token)["status"], 403)

    def test_admin_approval_enables_progress_and_audit(self):
        self.register()
        token = self.login()
        player_id, admin = self.approve()
        self.assertEqual(self.call("/api/progress", "PUT", {"progress": {"xp": 40, "challengeDays": [1]}}, token)["status"], 200)
        self.assertEqual(self.call("/api/progress", token=token)["body"]["progress"]["xp"], 40)
        rows = self.call("/api/admin/players", token=admin)["body"]
        self.assertEqual(rows["total"], 1)
        self.assertNotIn("password_hash", rows["players"][0])
        with self.app.store.connect() as db:
            self.assertEqual(db.execute("SELECT player_id,status FROM approval_audit").fetchone()["player_id"], player_id)

    def test_two_accounts_and_new_device_are_isolated(self):
        self.register("first@example.test")
        first_id, _ = self.approve("first@example.test")
        first = self.login("first@example.test")
        self.register("second@example.test")
        self.approve("second@example.test")
        second = self.login("second@example.test")
        self.call("/api/progress", "PUT", {"progress": {"xp": 90}}, first)
        self.assertIsNone(self.call("/api/progress", token=second)["body"]["progress"])
        # A forged user ID cannot redirect this write to another profile.
        self.call("/api/progress", "PUT", {"user_id": first_id, "progress": {"xp": 10}}, second)
        another_device = self.login("first@example.test")
        self.assertEqual(self.call("/api/progress", token=another_device)["body"]["progress"], {"xp": 90})
        self.assertEqual(self.call("/api/progress", token=second)["body"]["progress"], {"xp": 10})
        self.assertEqual(self.call("/api/progress/" + first_id, token=second)["status"], 404)
        self.app = Application(self.settings)
        self.assertEqual(self.call("/api/progress", token=another_device)["body"]["progress"]["xp"], 90)

    def test_revocation_and_logout_invalidate_sessions(self):
        self.register()
        player_id, admin = self.approve()
        token = self.login()
        self.call("/api/admin/players/" + player_id, "POST", {"approval_status": "rejected"}, admin)
        self.assertEqual(self.call("/api/auth/me", token=token)["status"], 401)
        new_token = self.login()
        self.assertEqual(self.call("/api/progress", token=new_token)["status"], 403)
        self.assertEqual(self.call("/api/auth/logout", "POST", token=new_token)["status"], 200)
        self.assertEqual(self.call("/api/auth/me", token=new_token)["status"], 401)

    def test_passwords_and_tokens_are_not_stored_in_plaintext(self):
        self.register()
        token = self.login()
        with self.app.store.connect() as db:
            row = db.execute("SELECT password_hash FROM accounts WHERE role='player'").fetchone()
            stored_token = db.execute("SELECT token_hash FROM sessions").fetchone()[0]
        self.assertNotIn(self.password, row[0])
        self.assertNotEqual(stored_token, token)
        self.assertEqual(self.call("/api/auth/login", "POST", {"email": "player@example.test", "password": "wrong"})["status"], 401)
        self.register(password="replacement-password-123")
        self.login()  # Duplicate registration never replaces the first password.

    def test_cors_and_request_validation(self):
        self.assertEqual(self.call("/api/health", origin="https://other.example")["status"], 403)
        preflight = self.call("/api/progress", "OPTIONS")
        self.assertEqual(preflight["headers"]["Access-Control-Allow-Origin"], "https://polfick-lgtm.github.io")
        self.assertNotIn("Access-Control-Allow-Credentials", preflight["headers"])
        self.assertEqual(self.call("/api/auth/register", "POST", raw=b"{bad")["status"], 400)
        self.assertEqual(self.call("/api/auth/register", "POST", raw=b"x" * (BODY_LIMIT + 1))["status"], 413)
        self.assertEqual(self.register(password="short")["status"], 400)
        self.assertEqual(self.register(email="invalid")["status"], 400)
        self.assertEqual(self.call("/api/progress")["status"], 401)

    def test_brute_force_limit_persists_after_restart_and_sessions_expire(self):
        for _ in range(12):
            self.assertEqual(self.call("/api/auth/login", "POST", {"email": "unknown@example.test", "password": "wrong"})["status"], 401)
        self.app = Application(self.settings)
        self.assertEqual(self.call("/api/auth/login", "POST", {"email": "unknown@example.test", "password": "wrong"})["status"], 429)
        token = self.login("admin@example.test")
        with self.app.store.connect() as db:
            db.execute("UPDATE sessions SET expires_at=?", (int(time.time()) - 1,))
        self.assertEqual(self.call("/api/auth/me", token=token)["status"], 401)

    def test_bootstrap_cannot_reset_an_existing_administrator(self):
        with self.assertRaises(ValueError):
            self.app.store.create_admin("other@example.test", "Other", password_hash(self.password))
        admin = self.login("admin@example.test")
        admin_id = self.call("/api/auth/me", token=admin)["body"]["id"]
        self.assertEqual(self.call("/api/admin/players/" + admin_id, "POST", {"approval_status": "rejected"}, admin)["status"], 404)


if __name__ == "__main__":
    unittest.main()
