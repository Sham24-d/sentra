import time


class Behavior:
    def __init__(self, loiter_threshold=8):
        self.loiter_threshold = loiter_threshold
        self.first_seen = {}

    def check_loiter(self, track_id, current_time=None):
        if current_time is None:
            current_time = time.time()

        first_seen = self.first_seen.setdefault(track_id, current_time)
        return current_time - first_seen >= self.loiter_threshold
