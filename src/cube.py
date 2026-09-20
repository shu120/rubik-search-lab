from dataclasses import dataclass


@dataclass(frozen=True)
class CubeState:
    cp: tuple[int, ...]
    co: tuple[int, ...]

    @classmethod
    def solved(cls):
        return cls(
            cp=(0, 1, 2, 3, 4, 5, 6, 7),
            co=(0, 0, 0, 0, 0, 0, 0, 0),
        )

    def is_solved(self):
        return self == CubeState.solved()
