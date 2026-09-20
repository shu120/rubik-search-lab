from src.cube import CubeState, apply_move, move_r


def test_solved_state():
    cube = CubeState.solved()
    assert cube.is_solved()


def test_r_four_times_returns_to_solved():
    cube = CubeState.solved()

    for _ in range(4):
        cube = move_r(cube)

    assert cube.is_solved()


def test_r_and_r_prime_cancel():
    cube = CubeState.solved()

    cube = apply_move(cube, "R")
    cube = apply_move(cube, "R'")

    assert cube.is_solved()


def test_r2_equals_two_r_moves():
    cube1 = apply_move(CubeState.solved(), "R2")

    cube2 = CubeState.solved()
    cube2 = move_r(cube2)
    cube2 = move_r(cube2)

    assert cube1 == cube2
