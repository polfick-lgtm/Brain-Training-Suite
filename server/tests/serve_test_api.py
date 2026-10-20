"""Local browser-test fixture; only fake accounts in a temporary database."""
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[2]))
from server.luma_api import Application, Settings, password_hash
from waitress import create_server

# Browser tests connect directly to loopback, without a forwarding proxy.
application = Application(Settings(
    Path(sys.argv[1]) / "test.sqlite3", (sys.argv[2],), trusted_proxy_addresses=(),
))
application.store.create_admin("admin@example.test", "Test Admin", password_hash("test-only-password-123"))
server = create_server(application, host="127.0.0.1", port=0, threads=2)
print(f"LISTENING:{server.effective_port}", flush=True)
server.run()
