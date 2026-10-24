import json
import os
import threading
import time
from datetime import datetime, timezone

from flask import Flask, jsonify
from flask_cors import CORS
from azure.eventhub import EventHubConsumerClient

app = Flask(__name__)

# Allow all origins so frontend works seamlessly on localhost and Vercel
CORS(app, resources={r"/*": {"origins": "*"}})

# Azure Event Hub connection string
CONNECTION_STRING = os.environ.get(
    "AZURE_CONNECTION_STRING",
    "Endpoint=sb://ihsuprodpnres016dednamespace.servicebus.windows.net/;"
    "SharedAccessKeyName=iothubowner;"
    "SharedAccessKey=+mk2+0LDW4D+i/WE1G6/9sP41m5kWJAexAIoTObd5kE=;"
    "EntityPath=iothub-ehub-bharathiot-56245052-1173f97b8c"
)

CONSUMER_GROUP = "$default"

STUDENT_NAME = "HARI PRANEETHA M"
ROLL_NUMBER = "24EIR038"

latest = {
    "student_name": STUDENT_NAME,
    "roll_number": ROLL_NUMBER,
    "status": "WAITING",
    "raw_message": "Waiting for Azure telemetry...",
    "ascii_values": [],
    "ascii_string": "Waiting for data...",
    "converted_string": "Waiting for Azure telemetry...",
    "message": "Waiting for Azure telemetry...",
    "timestamp": None,
}
data_lock = threading.Lock()


def decode_telemetry(raw):
    """
    Decodes received telemetry into both ASCII values and converted string.
    Handles:
      1. JSON ASCII array, e.g. [72, 101, 108, 108, 111] -> "Hello"
      2. Comma-separated ASCII, e.g. "72,101,108,108,111" -> "Hello"
      3. Plain text / UTF-8 string, e.g. "one_credit_course_project" -> converted to string and corresponding ASCII values
    """
    text = raw.decode("utf-8", errors="replace") if isinstance(raw, bytes) else str(raw)
    text = text.strip()

    ascii_values = []
    converted_string = ""
    is_ascii_sequence = False

    # 1. Try parsing JSON array of ASCII codes: [72, 101, 108, 108, 111]
    try:
        parsed = json.loads(text)
        if isinstance(parsed, list) and len(parsed) > 0 and all(
            isinstance(x, int) and 0 <= x <= 255 for x in parsed
        ):
            ascii_values = parsed
            converted_string = "".join(chr(x) for x in parsed)
            is_ascii_sequence = True
    except (json.JSONDecodeError, TypeError):
        pass

    # 2. Try parsing comma-separated ASCII codes: 72,101,108,108,111
    if not is_ascii_sequence:
        parts = [p.strip() for p in text.split(",") if p.strip()]
        if len(parts) > 1:
            try:
                codes = [int(p) for p in parts]
                if all(0 <= x <= 255 for x in codes):
                    ascii_values = codes
                    converted_string = "".join(chr(x) for x in codes)
                    is_ascii_sequence = True
            except ValueError:
                pass

    # 3. If raw message is plain text (e.g. "one_credit_course_project")
    if not is_ascii_sequence:
        converted_string = text
        ascii_values = [ord(c) for c in text]

    ascii_string = ", ".join(str(x) for x in ascii_values)

    return {
        "raw_message": text,
        "ascii_values": ascii_values,
        "ascii_string": ascii_string,
        "converted_string": converted_string,
        "message": converted_string,
    }


def receive_events():
    """Background listener with auto-reconnection loop."""
    while True:
        try:
            print("Connecting to Azure Event Hubs...", flush=True)
            client = EventHubConsumerClient.from_connection_string(
                conn_str=CONNECTION_STRING,
                consumer_group=CONSUMER_GROUP,
            )

            def on_event(partition_context, event):
                if event is None:
                    return

                try:
                    raw = event.body_as_str(encoding="UTF-8")
                    decoded = decode_telemetry(raw)
                    timestamp = (
                        event.enqueued_time.isoformat()
                        if event.enqueued_time
                        else datetime.now(timezone.utc).isoformat()
                    )

                    with data_lock:
                        latest["student_name"] = STUDENT_NAME
                        latest["roll_number"] = ROLL_NUMBER
                        latest["status"] = "CONNECTED"
                        latest["raw_message"] = decoded["raw_message"]
                        latest["ascii_values"] = decoded["ascii_values"]
                        latest["ascii_string"] = decoded["ascii_string"]
                        latest["converted_string"] = decoded["converted_string"]
                        latest["message"] = decoded["converted_string"]
                        latest["timestamp"] = timestamp

                    print(f"[{partition_context.partition_id}] Received: {decoded['converted_string']} (ASCII: {decoded['ascii_string']})", flush=True)
                except Exception as e:
                    print(f"Error processing event: {e}", flush=True)

            with client:
                print("Listening for Azure IoT Hub telemetry...", flush=True)
                client.receive(
                    on_event=on_event,
                    starting_position="@latest",
                )
        except Exception as exc:
            print(f"Azure receiver error: {exc}. Retrying in 5 seconds...", flush=True)
            time.sleep(5)


@app.route("/api/latest", methods=["GET"])
def get_latest():
    with data_lock:
        return jsonify(latest.copy())


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "student_name": STUDENT_NAME,
        "roll_number": ROLL_NUMBER,
        "timestamp": datetime.now(timezone.utc).isoformat()
    })


if __name__ == "__main__":
    receiver_thread = threading.Thread(
        target=receive_events,
        daemon=True,
    )
    receiver_thread.start()

    port = int(os.environ.get("PORT", 5000))
    print(f"Starting Flask server on http://127.0.0.1:{port}", flush=True)
    app.run(
        host="0.0.0.0",
        port=port,
        debug=False,
    )
