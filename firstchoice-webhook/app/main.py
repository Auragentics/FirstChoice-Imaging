from __future__ import annotations

import asyncio
import logging
from collections import OrderedDict

from fastapi import FastAPI, Header, Request
from fastapi.responses import JSONResponse

from app.config import settings
from app.models import ExtractedData
from app.router import process_call

# --- Logging ---

logging.basicConfig(
    level=getattr(logging, settings.log_level.upper(), logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# --- App ---

app = FastAPI(
    title="First Choice Imaging Webhook Server",
    version="1.1.0",
)

# --- Idempotency: track processed request IDs (bounded LRU) ---

_processed_calls: OrderedDict[str, bool] = OrderedDict()
MAX_PROCESSED_CACHE = 10_000


def _mark_processed(request_id: str) -> bool:
    """Mark a request_id as processed. Returns True if already seen."""
    if not request_id:
        return False  # No ID to dedupe on, allow processing
    if request_id in _processed_calls:
        return True
    _processed_calls[request_id] = True
    if len(_processed_calls) > MAX_PROCESSED_CACHE:
        _processed_calls.popitem(last=False)
    return False


# --- Endpoints ---

@app.get("/health")
async def health():
    return {"status": "ok", "service": "firstchoice-webhook"}


@app.post("/webhook/retell")
async def webhook_retell(
    request: Request,
    x_request_id: str = Header(default=""),
):
    """
    Receives GHL workflow webhook with call data as query parameters.
    Returns 200 immediately, processes in background.
    """
    # Parse query parameters
    params = dict(request.query_params)

    if not params:
        logger.warning("Received webhook with no query parameters")
        return JSONResponse({"status": "no_data"}, status_code=200)

    # Idempotency check using x-request-id header
    if _mark_processed(x_request_id):
        logger.info("Duplicate request_id, skipping: %s", x_request_id)
        return JSONResponse({"status": "duplicate", "request_id": x_request_id})

    # Extract data from query params
    data = ExtractedData.from_query_params(params)

    if not data.intents:
        logger.warning("No valid intents in webhook params: intents_handled=%s", params.get("intents_handled", ""))
        return JSONResponse({"status": "no_intents", "raw_intents": params.get("intents_handled", "")})

    logger.info(
        "Processing webhook request_id=%s caller=%s intents=%s",
        x_request_id or "none",
        data.caller_name,
        data.intents_handled,
    )

    # Process in background (return 200 immediately)
    asyncio.create_task(_process_in_background(x_request_id, data))

    return JSONResponse({"status": "accepted", "intents": data.intents})


async def _process_in_background(request_id: str, data: ExtractedData):
    """Background processing of a GHL webhook."""
    try:
        results = await process_call(data)
        logger.info(
            "Completed request_id=%s intents=%s errors=%s",
            request_id or "none",
            results.get("intents_processed", []),
            results.get("errors", []),
        )
    except Exception:
        logger.exception("Unhandled error processing request_id=%s", request_id)
