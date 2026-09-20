from src.cube import CubeState, apply_move
from src.solver import bfs


def test_bfs_solved_cube():
    solution = bfs(CubeState.solved())

    assert solution == []


def test_bfs_one_move():
    cube = apply_move(CubeState.solved(), "R")

    solution = bfs(cube)

    assert solution == ["R'"]


def test_bfs_scramble():
    cube = CubeState.solved()

    for move in ("R", "U", "F"):
        cube = apply_move(cube, move)

    solution = bfs(cube)

    for move in solution:
        cube = apply_move(cube, move)

    assert cube.is_solved()
    assert len(solution) == 3
