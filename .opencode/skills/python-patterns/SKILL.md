# Python Patterns Skill

## Type Hints (Mandatory)
```python
# All public functions
def train_model(config: TrainConfig) -> ModelArtifact: ...

# Generics
from typing import TypeVar, Generic
T = TypeVar('T')
class Repository(Generic[T]): ...

# Tensor shapes (torchtyping)
from torchtyping import TensorType
def forward(x: TensorType["batch", "seq", "hidden"]) -> TensorType["batch", "vocab"]: ...

# Protocols (structural subtyping)
from typing import Protocol
class Trainable(Protocol):
    def train(self, data: DataLoader) -> Metrics: ...
```

## Dataclasses over Classes
```python
from dataclasses import dataclass, field
from datetime import datetime

@dataclass(frozen=True, slots=True)
class TrainingConfig:
    model_name: str
    batch_size: int = 32
    learning_rate: float = 3e-4
    epochs: int = 10
    tags: list[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.utcnow)
    
    def __post_init__(self):
        if self.batch_size <= 0:
            raise ValueError("batch_size must be positive")
```

## Pathlib over os.path
```python
from pathlib import Path

data_dir = Path("/data") / "datasets" / "imagenet"
model_path = data_dir / "models" / f"{config.model_name}.pt"

# Safe operations
model_path.parent.mkdir(parents=True, exist_ok=True)
if model_path.exists():
    checkpoint = torch.load(model_path, map_location="cpu")
```

## Structured Logging (structlog)
```python
import structlog

logger = structlog.get_logger()

def train(config: TrainingConfig) -> ModelArtifact:
    logger.info("training_started", model=config.model_name, batch_size=config.batch_size)
    try:
        # ... training ...
        logger.info("training_completed", epoch=epoch, loss=loss)
    except Exception as e:
        logger.exception("training_failed", error=str(e))
        raise
```

## Error Handling (Result Types)
```python
from typing import TypeVar
from dataclasses import dataclass

T = TypeVar('T')
E = TypeVar('E')

@dataclass(frozen=True)
class Ok(Generic[T]):
    value: T

@dataclass(frozen=True)
class Err(Generic[E]):
    error: E

Result = Ok[T] | Err[E]

def load_model(path: Path) -> Result[Model, ModelLoadError]:
    try:
        return Ok(torch.load(path))
    except FileNotFoundError:
        return Err(ModelLoadError("not_found", path))
    except RuntimeError as e:
        return Err(ModelLoadError("corrupted", path, cause=e))
```

## Dependency Injection
```python
from abc import ABC, abstractmethod
from typing import Protocol

class ModelRepository(Protocol):
    async def save(self, model: ModelArtifact) -> str: ...
    async def load(self, id: str) -> ModelArtifact: ...

class S3ModelRepository:
    def __init__(self, bucket: str, client: S3Client): ...

class LocalModelRepository:
    def __init__(self, base_path: Path): ...

# Usage
async def deploy_model(repo: ModelRepository, model: ModelArtifact) -> str:
    return await repo.save(model)
```

## Configuration (Pydantic + Hydra)
```python
from pydantic import BaseModel, Field, validator
from omegaconf import DictConfig, OmegaConf

class Config(BaseModel):
    model: ModelConfig
    data: DataConfig
    trainer: TrainerConfig
    
    @validator('trainer')
    def validate_gpus(cls, v):
        if v.gpus > 0 and not torch.cuda.is_available():
            raise ValueError("CUDA not available")
        return v

# Load
cfg = OmegaConf.structured(Config)
# Or from YAML
cfg = OmegaConf.merge(OmegaConf.structured(Config), OmegaConf.load("config.yaml"))
```

## Testing Patterns
```python
import pytest
from hypothesis import given, strategies as st

# Fixtures
@pytest.fixture
def sample_data() -> DataBatch: ...

# Property-based
@given(st.lists(st.integers(), min_size=1, max_size=100))
def test_sort_idempotent(nums):
    assert sorted(sorted(nums)) == sorted(nums)

# Parametrized
@pytest.mark.parametrize("lr,expected_convergence", [
    (1e-3, True),
    (1e-1, False),
])
def test_learning_rate(lr, expected_convergence): ...

# Async
@pytest.mark.asyncio
async def test_async_repo(repo: ModelRepository): ...
```

## ML-Specific Patterns
```python
# Reproducibility
def set_seed(seed: int = 42):
    import random, numpy as np
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)
    torch.backends.cudnn.deterministic = True
    torch.backends.cudnn.benchmark = False

# Checkpointing
@dataclass
class Checkpoint:
    epoch: int
    model_state: dict
    optimizer_state: dict
    scheduler_state: dict
    metrics: dict
    git_sha: str
    config_hash: str

# Config hashing for reproducibility
import hashlib, json
def config_hash(config: BaseModel) -> str:
    return hashlib.sha256(json.dumps(config.model_dump(), sort_keys=True).encode()).hexdigest()[:8]
```

## Ruff Configuration (pyproject.toml)
```toml
[tool.ruff]
target-version = "py311"
line-length = 100
select = ["E", "F", "I", "UP", "C4", "PTH", "T20", "ARG", "SIM", "RET"]
ignore = ["S101", "T201"]  # assert, print in tests
per-file-ignores = {
    "tests/*": ["S101", "T201"],
    "scripts/*": ["T201"]
}

[tool.ruff.format]
quote-style = "single"
indent-style = "space"
trailing-commas = "always"
```