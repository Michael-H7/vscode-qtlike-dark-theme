# sample.py — Theme fixture: Python 3.10+
#
# Open in Extension Development Host (F5) and use
# "Developer: Inspect Editor Tokens and Scopes" to verify colours.
#
# Key things to check:
#   @decorator names       → hot pink       (#ff6aad)
#   ALL_CAPS constants     → blue-purple    (#9aa7d6)
#   class/type names       → coral red      (#ff8080)
#   self parameter         → teal italic    (#45c6d6)
#   match / case keywords  → teal italic    (#45c6d6)
#   walrus :=              → teal italic    (#45c6d6)
#   f-string braces        → teal italic    (#45c6d6)
#   docstrings             → amber          (#d69545)

from __future__ import annotations

import abc
import asyncio
import dataclasses
import enum
import functools
import itertools
import re
import sys
import typing
from collections.abc import Generator, Iterator, Sequence
from pathlib import Path
from typing import Any, ClassVar, Final, Generic, Optional, TypeVar, overload

# ── Module-level constants (ALL_CAPS → blue-purple) ──────────────────────────

MAX_RETRIES: Final[int] = 3
DEFAULT_TIMEOUT: Final[float] = 30.0
BASE_URL: Final[str] = "https://api.example.com"
EMPTY_TUPLE: Final[tuple[()]] = ()

T = TypeVar("T")
K = TypeVar("K")
V = TypeVar("V")

# ── Enums ─────────────────────────────────────────────────────────────────────

class Direction(enum.Enum):
    NORTH = "north"
    SOUTH = "south"
    EAST  = "east"
    WEST  = "west"

class Status(enum.IntEnum):
    PENDING  = 0
    RUNNING  = 1
    DONE     = 2
    FAILED   = 3
    CANCELED = 4

# ── Dataclasses ───────────────────────────────────────────────────────────────

@dataclasses.dataclass(frozen=True, slots=True)
class Point:
    """Immutable 2-D point."""
    x: float
    y: float

    def distance_to(self, other: Point) -> float:
        """Return Euclidean distance between this point and *other*."""
        return ((self.x - other.x) ** 2 + (self.y - other.y) ** 2) ** 0.5

    def __add__(self, other: Point) -> Point:
        return Point(self.x + other.x, self.y + other.y)

    def __repr__(self) -> str:
        return f"Point({self.x}, {self.y})"

@dataclasses.dataclass
class BoundingBox:
    """Axis-aligned bounding box."""
    min_pt: Point
    max_pt: Point

    @classmethod
    def from_points(cls, points: Sequence[Point]) -> BoundingBox:
        """Build the smallest AABB enclosing all *points*."""
        xs = [p.x for p in points]
        ys = [p.y for p in points]
        return cls(Point(min(xs), min(ys)), Point(max(xs), max(ys)))

    @property
    def width(self) -> float:
        return self.max_pt.x - self.min_pt.x

    @property
    def height(self) -> float:
        return self.max_pt.y - self.min_pt.y

    @property
    def area(self) -> float:
        return self.width * self.height

# ── Abstract base class / decorators ─────────────────────────────────────────

class Serializable(abc.ABC):
    @abc.abstractmethod
    def to_dict(self) -> dict[str, Any]:
        """Serialize to a plain dict."""
        ...

    @abc.abstractmethod
    def to_json(self) -> str:
        """Serialize to a JSON string."""
        ...

    @classmethod
    @abc.abstractmethod
    def from_dict(cls, data: dict[str, Any]) -> Serializable:
        """Deserialize from a plain dict."""
        ...


def retry(max_attempts: int = MAX_RETRIES, exceptions: tuple[type[Exception], ...] = (Exception,)):
    """Decorator: retry *func* up to *max_attempts* times on *exceptions*."""
    def decorator(func: typing.Callable[..., T]) -> typing.Callable[..., T]:
        @functools.wraps(func)
        def wrapper(*args: Any, **kwargs: Any) -> T:
            last_exc: Exception | None = None
            for attempt in range(max_attempts):
                try:
                    return func(*args, **kwargs)
                except exceptions as exc:
                    last_exc = exc
                    print(f"Attempt {attempt + 1} failed: {exc}")
            raise RuntimeError(f"All {max_attempts} attempts failed") from last_exc
        return wrapper
    return decorator

# ── Generic class ─────────────────────────────────────────────────────────────

class Stack(Generic[T]):
    """A simple typed stack."""

    _items: list[T]
    MAX_DEPTH: ClassVar[int] = 1024

    def __init__(self) -> None:
        self._items = []

    def push(self, item: T) -> None:
        if len(self._items) >= self.MAX_DEPTH:
            raise OverflowError("stack overflow")
        self._items.append(item)

    def pop(self) -> T:
        if not self._items:
            raise IndexError("pop from empty stack")
        return self._items.pop()

    def peek(self) -> T:
        return self._items[-1]

    def __len__(self) -> int:
        return len(self._items)

    def __bool__(self) -> bool:
        return bool(self._items)

    def __iter__(self) -> Iterator[T]:
        yield from reversed(self._items)

# ── Type aliases (3.10+ union syntax) ────────────────────────────────────────

JsonValue = int | float | str | bool | None | dict[str, "JsonValue"] | list["JsonValue"]
Coordinate = tuple[float, float]
OptStr = str | None

# ── @overload ────────────────────────────────────────────────────────────────

@overload
def parse_value(raw: str) -> str: ...
@overload
def parse_value(raw: int) -> int: ...
@overload
def parse_value(raw: float) -> float: ...

def parse_value(raw: str | int | float) -> str | int | float:
    """Return *raw* unchanged (overload demo)."""
    return raw

# ── Generators and itertools ──────────────────────────────────────────────────

def fibonacci() -> Generator[int, None, None]:
    """Infinite Fibonacci sequence generator."""
    a, b = 0, 1
    while True:
        yield a
        a, b = b, a + b

def chunked(iterable: Sequence[T], size: int) -> Generator[list[T], None, None]:
    """Yield successive *size*-length chunks from *iterable*."""
    for i in range(0, len(iterable), size):
        yield list(iterable[i : i + size])

# ── Walrus operator (:=) ──────────────────────────────────────────────────────

def first_long_word(words: list[str], min_len: int = 5) -> str | None:
    """Return the first word longer than *min_len*, using walrus operator."""
    if match := next((w for w in words if len(w) >= min_len), None):
        return match
    return None

def process_lines(path: Path) -> list[str]:
    """Read lines, skip empties — walrus in while loop."""
    results: list[str] = []
    lines = iter(path.read_text().splitlines())
    while line := next(lines, None):
        stripped = line.strip()
        if stripped:
            results.append(stripped)
    return results

# ── Structural pattern matching (Python 3.10+) ───────────────────────────────

def http_status_message(status: int) -> str:
    match status:
        case 200:
            return "OK"
        case 201:
            return "Created"
        case 400:
            return "Bad Request"
        case 401 | 403:
            return "Unauthorized or Forbidden"
        case 404:
            return "Not Found"
        case code if 500 <= code < 600:
            return f"Server Error ({code})"
        case _:
            return "Unknown"

def describe_point(pt: object) -> str:
    match pt:
        case Point(x=0, y=0):
            return "origin"
        case Point(x=0, y=y):
            return f"on y-axis at {y}"
        case Point(x=x, y=0):
            return f"on x-axis at {x}"
        case Point(x=x, y=y) if x == y:
            return f"on diagonal at {x}"
        case Point(x=x, y=y):
            return f"at ({x}, {y})"
        case _:
            return "not a point"

def process_command(command: dict[str, Any]) -> str:
    match command:
        case {"action": "quit"}:
            return "quitting"
        case {"action": "move", "direction": Direction.NORTH}:
            return "moving north"
        case {"action": "move", "direction": dir_}:
            return f"moving {dir_}"
        case {"action": action, **rest}:
            return f"unknown action: {action}, extra={rest}"
        case _:
            return "invalid command"

# ── Async / await ─────────────────────────────────────────────────────────────

async def fetch(url: str, timeout: float = DEFAULT_TIMEOUT) -> bytes:
    """Simulate an async HTTP GET."""
    await asyncio.sleep(0.01)   # simulate network latency
    return b"<response body>"

async def fetch_all(urls: list[str]) -> list[bytes]:
    """Fetch all URLs concurrently."""
    tasks = [asyncio.create_task(fetch(u)) for u in urls]
    return await asyncio.gather(*tasks)

async def main_async() -> None:
    urls = [f"{BASE_URL}/item/{i}" for i in range(5)]
    results = await fetch_all(urls)
    for url, data in zip(urls, results):
        print(f"{url} → {len(data)} bytes")

# ── String features ───────────────────────────────────────────────────────────

def string_examples() -> None:
    name = "World"
    count = 42
    pi = 3.14159

    # f-strings
    greeting = f"Hello, {name}!"
    formatted = f"count={count:,d}  pi={pi:.4f}"
    nested    = f"{'yes' if count > 0 else 'no'}"

    # raw strings (regex)
    pattern = re.compile(r"(?P<year>\d{4})-(?P<month>\d{2})-(?P<day>\d{2})")

    # multiline
    sql = """
        SELECT id, name, created_at
        FROM   users
        WHERE  active = TRUE
        ORDER  BY created_at DESC
        LIMIT  :limit
    """

    # byte strings
    magic = b"\x89PNG\r\n\x1a\n"
    hex_repr = magic.hex()

    print(greeting, formatted, nested, hex_repr)
    m = pattern.match("2024-01-15")
    if m:
        print(m.group("year"), m.group("month"), m.group("day"))
    print(sql.strip())

# ── Magic methods showcase ────────────────────────────────────────────────────

class Vector:
    """Full magic-method showcase."""

    __slots__ = ("_data",)

    def __init__(self, *components: float) -> None:
        self._data = tuple(components)

    def __repr__(self) -> str:
        return f"Vector{self._data!r}"

    def __len__(self) -> int:
        return len(self._data)

    def __getitem__(self, index: int) -> float:
        return self._data[index]

    def __add__(self, other: Vector) -> Vector:
        return Vector(*(a + b for a, b in zip(self._data, other._data)))

    def __mul__(self, scalar: float) -> Vector:
        return Vector(*(v * scalar for v in self._data))

    __rmul__ = __mul__

    def __eq__(self, other: object) -> bool:
        if not isinstance(other, Vector):
            return NotImplemented
        return self._data == other._data

    def __hash__(self) -> int:
        return hash(self._data)

    def dot(self, other: Vector) -> float:
        return sum(a * b for a, b in zip(self._data, other._data))

# ── Entry point ───────────────────────────────────────────────────────────────

@retry(max_attempts=2, exceptions=(ValueError,))
def unreliable() -> int:
    import random
    if random.random() < 0.5:
        raise ValueError("unlucky")
    return 42

if __name__ == "__main__":
    # Basic usage
    p1 = Point(1.0, 2.0)
    p2 = Point(4.0, 6.0)
    print(f"distance = {p1.distance_to(p2):.4f}")
    print(describe_point(p1))

    # Stack
    s: Stack[int] = Stack()
    for i in range(5):
        s.push(i)
    print(list(s))

    # Fibonacci
    fibs = list(itertools.islice(fibonacci(), 10))
    print(f"fibs = {fibs}")

    # Match
    for code in [200, 404, 500, 418]:
        print(f"{code}: {http_status_message(code)}")

    # Walrus
    words = ["hi", "hello", "world", "python"]
    print(first_long_word(words))

    # Async
    asyncio.run(main_async())

    string_examples()

    sys.exit(0)
