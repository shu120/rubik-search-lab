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


def move_r(state: CubeState) -> CubeState:
    cp = list(state.cp)
    co = list(state.co)

    # Corner permutation:
    # URF -> UBR -> DRB -> DFR -> URF
    cp[0], cp[3], cp[7], cp[4] = (
        state.cp[4],
        state.cp[0],
        state.cp[3],
        state.cp[7],
    )

    # Corner orientation
    co[0] = (state.co[4] + 2) % 3
    co[3] = (state.co[0] + 1) % 3
    co[7] = (state.co[3] + 2) % 3
    co[4] = (state.co[7] + 1) % 3

    return CubeState(
        cp=tuple(cp),
        co=tuple(co),
    )


def apply_move(state: CubeState, move: str) -> CubeState:
    if move == "R":
        return move_r(state)

    if move == "R2":
        state = move_r(state)
        return move_r(state)

    if move == "R'":
        for _ in range(3):
            state = move_r(state)
        return state

    raise ValueError(f"Unknown move: {move}")

