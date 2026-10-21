"""Exercise real Waitress header handling, including the shared local proxy."""
import http.client
import json
from pathlib import Path
import tempfile
import threading
import unittest

from server.luma_api import Application, Settings, waitress_proxy_options

try:
    from waitress import create_server
except ImportError:
    create_server = None


@unittest.skipIf(create_server is None, "Install pinned server requirements for HTTP integration tests")
class ProxyChainTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.app = Application(Settings(Path(self.temp.name) / "test.sqlite3", ("https://polfick-lgtm.github.io",)))
        self.api_port = self.start_server(self.app)
        self.observed = []

        def forward(env, start):
            self.observed.append((env["REMOTE_ADDR"], env.get("HTTP_X_FORWARDED_FOR")))
            client = http.client.HTTPConnection("127.0.0.1", self.api_port, timeout=5)
            try:
                headers = {"Origin": env["HTTP_ORIGIN"], "Content-Type": "application/json"}
                if "HTTP_X_FORWARDED_FOR" in env:
                    headers["X-Forwarded-For"] = env["HTTP_X_FORWARDED_FOR"]
                body = env["wsgi.input"].read(int(env["CONTENT_LENGTH"]))
                client.request("POST", "/api/auth/login", body, headers)
                response = client.getresponse()
                payload = response.read()
                start(f"{response.status} {response.reason}", [("Content-Type", "application/json"), ("Content-Length", str(len(payload)))])
                return [payload]
            finally:
                client.close()

        self.front_port = self.start_server(forward)

    def start_server(self, app):
        server = create_server(app, host="127.0.0.1", port=0, threads=2, **waitress_proxy_options())
        thread = threading.Thread(target=server.run, daemon=True)
        thread.start()

        def stop():
            server.close()
            server.task_dispatcher.shutdown()
            thread.join(timeout=3)

        self.addCleanup(stop)
        return server.effective_port

    def request(self, port, forwarded=None, email="diagnostic@example.test"):
        client = http.client.HTTPConnection("127.0.0.1", port, timeout=5)
        try:
            headers = {"Origin": "https://polfick-lgtm.github.io", "Content-Type": "application/json"}
            if forwarded is not None:
                headers["X-Forwarded-For"] = forwarded
            client.request("POST", "/api/auth/login", json.dumps({"email": email, "password": None}), headers)
            response = client.getresponse()
            return response.status, json.loads(response.read())
        finally:
            client.close()

    def test_login_reaches_credentials_through_one_or_two_trusted_hops(self):
        for port in (self.api_port, self.front_port):
            for address in ("198.51.100.10", "2001:db8::10"):
                status, body = self.request(port, address)
                self.assertEqual(status, 401, body)
                self.assertEqual(body["error"], "Email o password non corretti.")
        self.assertEqual(self.observed[-1], ("2001:db8::10", "2001:db8::10"))

    def test_missing_and_malformed_forwarded_addresses_stay_rejected(self):
        for port in (self.api_port, self.front_port):
            for address in (None, "not-an-ip", "999.999.999.999"):
                status, body = self.request(port, address)
                self.assertEqual(status, 400, body)

    def test_spoofed_prefix_cannot_bypass_rate_limit_and_clients_remain_separate(self):
        for index in range(40):
            status, body = self.request(self.front_port, f"192.0.2.{index + 1}, 198.51.100.20", f"diagnostic-{index % 4}@example.test")
            self.assertEqual(status, 401, body)
        self.assertEqual(self.observed[-1], ("198.51.100.20", "198.51.100.20"))
        self.assertEqual(self.request(self.front_port, "192.0.2.200, 198.51.100.20", "other@example.test")[0], 429)
        self.assertEqual(self.request(self.front_port, "198.51.100.21", "new-client@example.test")[0], 401)


if __name__ == "__main__":
    unittest.main()
