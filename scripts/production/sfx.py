#!/usr/bin/env python3
"""Generate small, reproducible sound effects with the Python standard library."""

from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
import random
import struct
import wave

SAMPLE_RATE = 24_000
PEAK_LEVEL = 0.8


def positive_duration(value: str) -> float:
    duration = float(value)
    if not math.isfinite(duration) or not 1 / SAMPLE_RATE <= duration <= 60:
        raise argparse.ArgumentTypeError("duration must be finite and between 1/24000 and 60 seconds")
    return duration


def make_samples(kind: str, duration: float, seed: int) -> list[int]:
    """Return mono PCM samples; every effect starts and ends at zero."""
    count = max(2, round(duration * SAMPLE_RATE))
    rng = random.Random(seed)
    samples: list[float] = []
    filtered_noise = 0.0
    previous_noise = 0.0
    phase = 0.0
    fade_count = max(1, min(round(0.008 * SAMPLE_RATE), (count - 1) // 2))

    for index in range(count):
        time_seconds = index / SAMPLE_RATE
        progress = index / (count - 1)

        if kind == "click":
            noise = rng.uniform(-1, 1)
            high_noise = noise - previous_noise
            previous_noise = noise
            signal = (
                0.7 * math.sin(2 * math.pi * 1_600 * time_seconds)
                + 0.18 * high_noise
            ) * math.exp(-45 * time_seconds)
        elif kind == "whoosh":
            noise = rng.uniform(-1, 1)
            # One-pole low pass, plus a quieter swept sinusoid.
            filtered_noise += 0.22 * (noise - filtered_noise)
            frequency = 180 + 1_600 * progress
            phase += 2 * math.pi * frequency / SAMPLE_RATE
            signal = (filtered_noise + 0.1 * math.sin(phase)) * math.sin(math.pi * progress) ** 1.4
        elif kind == "chime":
            signal = sum(
                amplitude * math.sin(2 * math.pi * frequency * time_seconds)
                * math.exp(-decay * time_seconds)
                for frequency, amplitude, decay in (
                    (880, 0.7, 3.2),
                    (1_320, 0.25, 4.6),
                    (1_760, 0.12, 6.4),
                )
            )
        else:
            raise ValueError(f"Unsupported effect kind: {kind}")

        # Cosine fades suppress the discontinuities that cause audible clicks.
        edge_distance = min(index, count - 1 - index)
        fade_progress = min(1.0, edge_distance / fade_count)
        envelope = 0.5 - 0.5 * math.cos(math.pi * fade_progress)
        value = signal * envelope
        if not math.isfinite(value):
            raise ValueError(f"Non-finite sample at index {index}")
        samples.append(value)

    peak = max(abs(value) for value in samples)
    gain = PEAK_LEVEL / peak if peak > 0 else 0
    return [
        round(max(-1.0, min(1.0, value * gain)) * 32_767)
        for value in samples
    ]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, required=True, help="Output WAV file")
    parser.add_argument("--kind", choices=("click", "whoosh", "chime"), required=True)
    parser.add_argument("--duration", type=positive_duration, default=0.4, help="Seconds (up to 60)")
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    samples = make_samples(args.kind, args.duration, args.seed)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    with wave.open(str(args.output), "wb") as wav_file:
        wav_file.setnchannels(1)
        wav_file.setsampwidth(2)
        wav_file.setframerate(SAMPLE_RATE)
        wav_file.writeframes(struct.pack(f"<{len(samples)}h", *samples))

    print(json.dumps({
        "output": str(args.output.resolve()),
        "kind": args.kind,
        "seed": args.seed,
        "sampleRate": SAMPLE_RATE,
        "channels": 1,
        "sampleWidthBytes": 2,
        "durationSeconds": len(samples) / SAMPLE_RATE,
    }))


if __name__ == "__main__":
    main()
