from __future__ import annotations

import hashlib
import json
import os
import tempfile
from dataclasses import asdict, is_dataclass
from pathlib import Path
from typing import Any, cast

from durable_research.models import ArtifactRef


class ArtifactConflict(RuntimeError):
    """Raised when a retry tries to overwrite a stable name with new content."""


class ArtifactStore:
    def __init__(self, root: str | Path) -> None:
        self.root = Path(root)

    def put_json(self, review_id: str, kind: str, value: Any) -> ArtifactRef:
        normalized = asdict(cast(Any, value)) if is_dataclass(value) else value
        content = (
            json.dumps(
                normalized,
                indent=2,
                sort_keys=True,
                ensure_ascii=False,
            )
            + "\n"
        )
        digest = _sha256(content)
        path = f"{review_id}/{kind}/{digest}.json"
        self._write_once(path, content)
        return ArtifactRef(path=path, content_hash=digest)

    def put_named_text(self, path: str, content: str) -> ArtifactRef:
        digest = _sha256(content)
        self._write_once(path, content)
        return ArtifactRef(path=path, content_hash=digest)

    def read_json(self, path: str) -> Any:
        return json.loads(self._target(path).read_text())

    def read_text(self, path: str) -> str:
        return self._target(path).read_text()

    def _write_once(self, relative_path: str, content: str) -> None:
        target = self._target(relative_path)
        target.parent.mkdir(parents=True, exist_ok=True)
        if target.exists():
            if target.read_text() != content:
                raise ArtifactConflict(
                    f"artifact already exists with different content: {relative_path}"
                )
            return

        descriptor, temporary_name = tempfile.mkstemp(
            dir=target.parent,
            prefix=f".{target.name}.",
        )
        try:
            with os.fdopen(descriptor, "w") as temporary:
                temporary.write(content)
                temporary.flush()
                os.fsync(temporary.fileno())
            os.replace(temporary_name, target)
        finally:
            temporary_path = Path(temporary_name)
            if temporary_path.exists():
                temporary_path.unlink()

    def _target(self, relative_path: str) -> Path:
        root = self.root.resolve()
        target = (root / relative_path).resolve()
        if not target.is_relative_to(root):
            raise ValueError(f"artifact path is outside artifact root: {relative_path}")
        return target


def _sha256(content: str) -> str:
    return hashlib.sha256(content.encode()).hexdigest()
