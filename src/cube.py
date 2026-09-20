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


def move_u(state: CubeState) -> CubeState:
    cp = list(state.cp)
    co = list(state.co)

    # Corner permutation
    cp[0], cp[1], cp[2], cp[3] = (
        state.cp[3],
        state.cp[0],
        state.cp[1],
        state.cp[2],
    )

    # U move does not change corner orientation

    return CubeState(
        cp=tuple(cp),
        co=tuple(co),
    )


def move_f(state: CubeState) -> CubeState:
    cp = list(state.cp)
    co = list(state.co)

    # Corner permutation
    cp[0], cp[1], cp[5], cp[4] = (
        state.cp[1],
        state.cp[5],
        state.cp[4],
        state.cp[0],
    )

    # Corner orientation
    co[0] = (state.co[1] + 1) % 3
    co[1] = (state.co[5] + 2) % 3
    co[5] = (state.co[4] + 1) % 3
    co[4] = (state.co[0] + 2) % 3

    return CubeState(
        cp=tuple(cp),
        co=tuple(co),
    )


def apply_move(state: CubeState, move: str) -> CubeState:
    base_moves = {
        "R": move_r,
        "U": move_u,
        "F": move_f,
    }

    face = move[0]

    if face not in base_moves:
        raise ValueError(f"Unknown move: {move}")

    if len(move) == 1:
        times = 1
    elif move[1:] == "2":
        times = 2
    elif move[1:] == "'":
        times = 3
    else:
        raise ValueError(f"Unknown move: {move}")

    for _ in range(times):
        state = base_moves[face](state)

    return state
