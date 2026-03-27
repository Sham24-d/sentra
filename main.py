from core.surveillance import SurveillanceSystem


def main():
    system = SurveillanceSystem()
    system.run_forever(show_window=True)


if __name__ == "__main__":
    main()
