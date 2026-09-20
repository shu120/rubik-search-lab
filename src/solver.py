from collections import deque
from src.cube import CubeState, neighbors


def bfs(start: CubeState):
    goal = CubeState.solved()

    if start == goal:
        return []

    que = deque([start])
    prev = {start: None}
    prev_move = {}

    while que:
        state = que.popleft()

        for move, next_state in neighbors(state):
            if next_state in prev:
                continue

            prev[next_state] = state
            prev_move[next_state] = move

            if next_state == goal:
                path = []
                curr = next_state

                while prev[curr] is not None:
                    path.append(prev_move[curr])
                    curr = prev[curr]

                path.reverse()
                return path

            que.append(next_state)

    return None
