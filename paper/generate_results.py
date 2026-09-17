from __future__ import annotations

import csv
from math import floor
from pathlib import Path
import matplotlib.pyplot as plt

plt.rcParams.update({"font.size": 10, "axes.labelsize": 10, "xtick.labelsize": 9, "ytick.labelsize": 9, "legend.fontsize": 9})

OUT = Path(__file__).resolve().parent
FIG = OUT / "figures"
DATA = OUT / "data"
FIG.mkdir(exist_ok=True)
DATA.mkdir(exist_ok=True)

L = 32
D = 4096
HQ = 32
B = 1
BYTES = {"fp32": 4.0, "fp16": 2.0, "bf16": 2.0, "int8": 1.0, "int4": 0.5}

DISPLAY_NAMES = {
    "MHA": "MHA",
    "GQA-8 heads KV": r"GQA: $h_{kv}=8,\ h_q=32$",
    "SWA-4 096": "SWA 4 096",
    "Latente r=512": "Latente r=512",
}


def mha(context: int, precision: str = "fp16") -> float:
    return L * context * 2 * D * BYTES[precision] * B / 1e9


def gqa(context: int, kv_heads: int = 8, precision: str = "fp16") -> float:
    return mha(context, precision) * kv_heads / HQ


def swa(context: int, window: int = 4096, precision: str = "fp16", kv_heads: int | None = None) -> float:
    value = L * min(context, window) * 2 * D * BYTES[precision] * B / 1e9
    if kv_heads is not None:
        value *= kv_heads / HQ
    return value


def latent(context: int, rank: int = 512, precision: str = "fp16") -> float:
    return L * context * 2 * rank * BYTES[precision] * B / 1e9


contexts = [4096, 8192, 16384, 32768, 65536, 131072, 262144, 524288, 1048576]
rows: list[dict[str, object]] = []
for context in contexts:
    values = {
        "MHA": mha(context),
        "GQA-8 heads KV": gqa(context, 8),
        "SWA-4 096": swa(context, 4096),
        "Latente r=512": latent(context, 512),
    }
    for method, value in values.items():
        rows.append({"experiment": "context", "context": context, "method": method, "value_gb": round(value, 6)})

with (DATA / "context_sweep.csv").open("w", newline="", encoding="utf-8") as file:
    writer = csv.DictWriter(file, fieldnames=rows[0].keys())
    writer.writeheader()
    writer.writerows(rows)

plt.figure(figsize=(7.4, 4.2))
for method in ["MHA", "GQA-8 heads KV", "SWA-4 096", "Latente r=512"]:
    y_values = [row["value_gb"] for row in rows if row["method"] == method]
    plt.plot([context / 1024 for context in contexts], y_values, marker="o", label=DISPLAY_NAMES[method])
plt.xscale("log", base=2)
plt.yscale("log", base=2)
plt.xticks([context / 1024 for context in contexts], ["4 096", "8 192", "16 384", "32 768", "65 536", "131 072", "262 144", "524 288", "1 048 576"], rotation=30, ha="right")
plt.xlabel("Longitud de contexto (tokens)")
plt.ylabel("Almacenamiento lógico de KV cache (GB, escala log2)")
plt.grid(True, which="both", linewidth=0.4, alpha=0.5)
plt.legend(ncol=2, fontsize=9)
plt.tight_layout()
plt.savefig(FIG / "context_sweep.png", dpi=300, bbox_inches="tight")
plt.close()

# Sensibilidad arquitectónica a 131 072 tokens.
T = 131072
kv_heads = [32, 16, 8, 4, 2, 1]
gqa_values = [gqa(T, heads) for heads in kv_heads]
windows = [2048, 4096, 8192, 16384, 32768]
swa_values = [swa(T, window) for window in windows]
ranks = [128, 256, 512, 1024]
latent_values = [latent(T, rank) for rank in ranks]

with (DATA / "sensitivity_128k.csv").open("w", newline="", encoding="utf-8") as file:
    fields = ["family", "parameter", "value", "memory_gb", "ratio_to_mha"]
    writer = csv.DictWriter(file, fieldnames=fields)
    writer.writeheader()
    baseline = mha(T)
    for heads, value in zip(kv_heads, gqa_values):
        writer.writerow({"family": "GQA", "parameter": "kv_heads", "value": heads, "memory_gb": round(value, 6), "ratio_to_mha": round(value / baseline, 6)})
    for window, value in zip(windows, swa_values):
        writer.writerow({"family": "SWA", "parameter": "window", "value": window, "memory_gb": round(value, 6), "ratio_to_mha": round(value / baseline, 6)})
    for rank, value in zip(ranks, latent_values):
        writer.writerow({"family": "Latent", "parameter": "rank", "value": rank, "memory_gb": round(value, 6), "ratio_to_mha": round(value / baseline, 6)})

plt.figure(figsize=(7.4, 4.2))
labels = [rf"GQA: $h_{{kv}}={heads},\ h_q=32$" for heads in [16, 8, 4, 1]] + [f"SWA {window:,}".replace(",", " ") for window in windows] + [f"Lat. r={rank}" for rank in ranks]
values = [gqa(T, heads) / mha(T) for heads in [16, 8, 4, 1]] + [swa(T, window) / mha(T) for window in windows] + [latent(T, rank) / mha(T) for rank in ranks]
positions = range(len(labels))
plt.barh(positions, values)
plt.axvline(1.0, linewidth=0.8)
plt.yticks(list(positions), labels, fontsize=9)
plt.xlabel("Razón de almacenamiento lógico respecto a MHA")
plt.xlim(0, 1.05)
plt.gca().invert_yaxis()
plt.grid(True, axis="x", linewidth=0.4, alpha=0.5)
plt.tight_layout()
plt.savefig(FIG / "ratios_128k.png", dpi=300, bbox_inches="tight")
plt.close()

precisions = ["fp32", "fp16", "bf16", "int8", "int4"]
precision_rows: list[dict[str, object]] = []
for precision in precisions:
    for method, value in {
        "MHA": mha(T, precision),
        "GQA-8 heads KV": gqa(T, 8, precision),
        "SWA-4 096": swa(T, 4096, precision),
        "Latente r=512": latent(T, 512, precision),
    }.items():
        precision_rows.append({"precision": precision, "method": method, "memory_gb": round(value, 6)})

with (DATA / "precision_128k.csv").open("w", newline="", encoding="utf-8") as file:
    writer = csv.DictWriter(file, fieldnames=precision_rows[0].keys())
    writer.writeheader()
    writer.writerows(precision_rows)

plt.figure(figsize=(7.4, 4.2))
x_values = range(len(precisions))
width = 0.19
methods = ["MHA", "GQA-8 heads KV", "SWA-4 096", "Latente r=512"]
for index, method in enumerate(methods):
    y_values = [row["memory_gb"] for precision in precisions for row in precision_rows if row["precision"] == precision and row["method"] == method]
    plt.bar([position + (index - 1.5) * width for position in x_values], y_values, width=width, label=DISPLAY_NAMES[method])
plt.xticks(list(x_values), [precision.upper() for precision in precisions])
plt.ylabel("Almacenamiento lógico de KV cache a 131 072 tokens (GB, escala log2)")
plt.yscale("log", base=2)
plt.grid(True, axis="y", linewidth=0.4, alpha=0.5)
plt.legend(ncol=2, fontsize=9)
plt.tight_layout()
plt.savefig(FIG / "precision_128k.png", dpi=300, bbox_inches="tight")
plt.close()

# Invariantes.
checks = [
    ("Doble contexto MHA", mha(65536) / mha(32768), 2.0),
    ("GQA 8/32 heads", gqa(T, 8) / mha(T), 0.25),
    ("SWA 4 096/131 072", swa(T, 4096) / mha(T), 4096 / T),
    ("Latente 512/4096", latent(T, 512) / mha(T), 512 / D),
    ("INT8/FP16", mha(T, "int8") / mha(T, "fp16"), 0.5),
]
with (DATA / "invariant_checks.csv").open("w", newline="", encoding="utf-8") as file:
    writer = csv.writer(file)
    writer.writerow(["check", "observed", "expected", "absolute_error"])
    for name, observed, expected in checks:
        writer.writerow([name, f"{observed:.12f}", f"{expected:.12f}", f"{abs(observed - expected):.12e}"])

# Contexto máximo bajo presupuesto lógico de KV cache.
budget_rows: list[dict[str, int]] = []
for budget_gb in [24, 48, 80]:
    budget_rows.append(
        {
            "budget_gb": budget_gb,
            "mha_tokens": floor(budget_gb * 1e9 / (L * 2 * D * BYTES["fp16"] * B)),
            "gqa8_tokens": floor(budget_gb * 1e9 / (L * 2 * D * (8 / HQ) * BYTES["fp16"] * B)),
            "latent_r512_tokens": floor(budget_gb * 1e9 / (L * 2 * 512 * BYTES["fp16"] * B)),
        }
    )
with (DATA / "memory_budget.csv").open("w", newline="", encoding="utf-8") as file:
    writer = csv.DictWriter(file, fieldnames=budget_rows[0].keys())
    writer.writeheader()
    writer.writerows(budget_rows)

# Composición analítica a 1 048 576 tokens.
context_1m = 1048576
baseline_1m = mha(context_1m)
composite_rows = [
    {"scenario": "MHA FP16", "memory_gb": baseline_1m, "ratio_to_mha": 1.0},
    {"scenario": "GQA-8 FP16", "memory_gb": gqa(context_1m, 8), "ratio_to_mha": 8 / HQ},
    {"scenario": "SWA-8 192 FP16", "memory_gb": swa(context_1m, 8192), "ratio_to_mha": 8192 / context_1m},
    {"scenario": "Latente r512 FP16", "memory_gb": latent(context_1m, 512), "ratio_to_mha": 512 / D},
    {"scenario": "GQA-8 + SWA-8 192 FP16", "memory_gb": swa(context_1m, 8192, kv_heads=8), "ratio_to_mha": (8 / HQ) * (8192 / context_1m)},
    {"scenario": "GQA-8 + SWA-8 192 INT8", "memory_gb": swa(context_1m, 8192, precision="int8", kv_heads=8), "ratio_to_mha": (8 / HQ) * (8192 / context_1m) * 0.5},
]
with (DATA / "composite_1m.csv").open("w", newline="", encoding="utf-8") as file:
    writer = csv.DictWriter(file, fieldnames=["scenario", "memory_gb", "ratio_to_mha"])
    writer.writeheader()
    for row in composite_rows:
        writer.writerow({"scenario": row["scenario"], "memory_gb": round(float(row["memory_gb"]), 6), "ratio_to_mha": round(float(row["ratio_to_mha"]), 9)})

print("Genera figuras y CSV resultados en", OUT)
