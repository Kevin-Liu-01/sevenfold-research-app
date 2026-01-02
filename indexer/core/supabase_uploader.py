from __future__ import annotations

import logging
import time
from tqdm import tqdm
import supabase
from typing import List

from pydantic import BaseModel

from .client_factory import get_supabase_client
from .config import UPLOADER_INSERT_BATCH_SIZE, UPLOADER_MAX_ATTEMPTS

logger = logging.getLogger(__name__)


class SupabaseUploader:
    """Wrapper around Supabase client for batch uploads with retries.

    Expects rows to be Pydantic BaseModel instances and converts them to
    JSON-serializable dicts via model_dump(exclude_none=True, mode='json').
    """

    def __init__(
        self,
        supabase_client: supabase.Client = get_supabase_client(),
    ) -> None:
        self.supabase_client = supabase_client

    def upload_rows(
        self,
        rows: List[BaseModel],
        table_name: str,
        primary_key: str = 'id',
        batch_size: int = UPLOADER_INSERT_BATCH_SIZE,
        max_attempts: int = UPLOADER_MAX_ATTEMPTS,
    ):
        """Upload rows to Supabase in batches with retries.

        Args:
            rows: List of Pydantic BaseModel rows to insert.
            table_name: Name of the Supabase table.
            primary_key: Column to use for upsert conflict target.
            batch_size: Number of rows per batch insert.
            max_attempts: Max attempts per batch insert.

        Raises:
            Exception: if a batch insert fails after ``max_attempts``.
        """
        if not rows:
            return

        logger.info(
            f"Uploading {len(rows)} rows to table '{table_name}' in batches of {batch_size}"
        )

        for i in tqdm(range(0, len(rows), batch_size), desc="Uploading"):
            batch = rows[i:i + batch_size]

            prepared_batch: List[dict] = []
            for item in batch:
                prepared_batch.append(item.model_dump(exclude_none=True, mode='json'))

            for attempt in range(1, max_attempts + 1):
                try:
                    res = (
                        self.supabase_client
                        .table(table_name)
                        .upsert(prepared_batch, on_conflict=primary_key, returning='minimal')
                        .execute()
                    )

                    if res is None:
                        raise Exception(f"Failed to insert row: {res}")

                    break

                except Exception as e:
                    logger.warning(f"Batch insert attempt {attempt} failed: {e}")
                    if attempt < max_attempts:
                        time.sleep(2 ** attempt)
                    else:
                        logger.error(f"Batch insert failed after {max_attempts} attempts")
                        raise e
