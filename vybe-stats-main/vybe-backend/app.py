from __future__ import annotations

print("[vybe-backend] Starting - importing Flask, pandas, scipy, sklearn (first run can take 1-2 min)...", flush=True)

import os
from typing import Any, Dict
import re
from threading import Lock

import pandas as pd
from flask import Flask, jsonify, request
from flask_cors import CORS

from stats import (
    get_boxplot_data,
    get_correlation_matrix,
    get_descriptive_stats,
    get_genre_stats,
    get_histogram_data,
)
from probability import (
    binomial_probability,
    conditional_probability,
    normal_probability,
    normality_test,
    poisson_estimate,
)
from regression import (
    find_similar_songs,
    get_confidence_intervals,
    get_model_summary,
    predict_popularity,
)
from naivebayes import get_mystery_song, predict_genre

print("[vybe-backend] Imports ready.", flush=True)


def _dataset_path() -> str:
    here = os.path.dirname(os.path.abspath(__file__))
    return os.path.join(here, "data", "spotify.csv")


def _load_df() -> pd.DataFrame:
    df = pd.read_csv(_dataset_path()).dropna().drop_duplicates()
    return df


def _json_error(message: str, status: int = 400, **extra: Any):
    payload: Dict[str, Any] = {"error": message, **extra}
    return jsonify(payload), status


app = Flask(__name__)
CORS(app)

# Lazy-load dataset to keep cold-start lightweight on serverless platforms.
DF: pd.DataFrame | None = None
DF_YEAR: pd.DataFrame | None = None
_DF_LOCK = Lock()


def _ensure_data_loaded() -> tuple[pd.DataFrame, pd.DataFrame]:
    global DF, DF_YEAR
    if DF is not None and DF_YEAR is not None:
        return DF, DF_YEAR

    with _DF_LOCK:
        if DF is None or DF_YEAR is None:
            print("[vybe-backend] Reading data/spotify.csv...", flush=True)
            loaded = _load_df()
            loaded_year = _with_year(loaded)
            DF = loaded
            DF_YEAR = loaded_year
            print(f"[vybe-backend] Dataset loaded: {len(DF)} songs", flush=True)
    return DF, DF_YEAR

FEATURES = ["danceability", "energy", "tempo", "valence", "acousticness"]


def _with_year(df: pd.DataFrame) -> pd.DataFrame:
    if "year" in df.columns:
        out = df.copy()
        out["year"] = pd.to_numeric(out["year"], errors="coerce")
        return out.dropna(subset=["year"]).assign(year=lambda x: x["year"].astype(int))

    if "release_date" in df.columns:
        out = df.copy()
        years = pd.to_datetime(out["release_date"], errors="coerce").dt.year
        out["year"] = years
        out = out.dropna(subset=["year"]).copy()
        out["year"] = out["year"].astype(int)
        return out

    # Fallback for datasets that don't contain any temporal field.
    # Create a stable synthetic year so time-based screens can still function.
    out = df.copy()
    if "Unnamed: 0" in out.columns:
        base = pd.to_numeric(out["Unnamed: 0"], errors="coerce")
    else:
        base = pd.Series(range(len(out)), index=out.index, dtype="float64")
    if base.isna().all():
        base = pd.Series(range(len(out)), index=out.index, dtype="float64")
    base = base.ffill().bfill().fillna(0.0)

    min_v = float(base.min())
    max_v = float(base.max())
    if max_v == min_v:
        out["year"] = 2000
        return out

    norm = (base - min_v) / (max_v - min_v)
    out["year"] = (1960 + norm * (2024 - 1960)).round().astype(int)
    return out


@app.before_request
def _warm_dataset_for_api():
    # Keep health endpoint fast; other routes can trigger one-time lazy load.
    if request.path == "/api/health":
        return None
    _ensure_data_loaded()
    return None


def _best_artist_label(df: pd.DataFrame, query: str) -> str:
    q = query.strip().lower()
    if not q:
        return ""

    artists_col = df["artists"].astype(str)
    candidates = artists_col[artists_col.str.lower().str.contains(q, na=False)]
    if candidates.empty:
        return query.strip()

    token_counts: Dict[str, int] = {}
    splitter = re.compile(r"\s*(?:,|;|&|/|\bfeat\.?\b|\bft\.?\b)\s*", flags=re.IGNORECASE)
    for raw in candidates:
        for token in splitter.split(raw):
            t = token.strip()
            if not t:
                continue
            if q in t.lower():
                key = t.lower()
                token_counts[key] = token_counts.get(key, 0) + 1

    if not token_counts:
        return str(candidates.iloc[0])

    best = sorted(token_counts.items(), key=lambda x: (-x[1], len(x[0])))[0][0]
    return best


@app.get("/api/health")
def health():
    loaded = DF is not None and DF_YEAR is not None
    if not loaded:
        return jsonify({"ok": True, "loaded": False})
    return jsonify({"ok": True, "loaded": True, "rows": int(len(DF)), "rows_with_year": int(len(DF_YEAR))})


# ---- STATS ENDPOINTS ----
@app.get("/api/stats")
def descriptive_stats():
    feature = request.args.get("feature", "popularity")
    if feature not in DF.columns:
        return _json_error("Unknown feature", 400, feature=feature)
    return jsonify(get_descriptive_stats(DF, feature))


@app.get("/api/correlation")
def correlation():
    return jsonify(get_correlation_matrix(DF))


@app.get("/api/genre-stats")
def genre_stats():
    return jsonify(get_genre_stats(DF))


@app.get("/api/histogram")
def histogram():
    feature = request.args.get("feature", "popularity")
    if feature not in DF.columns:
        return _json_error("Unknown feature", 400, feature=feature)
    try:
        bins = int(request.args.get("bins", 20))
    except ValueError:
        return _json_error("bins must be an integer", 400)
    return jsonify(get_histogram_data(DF, feature, bins))


@app.post("/api/boxplot")
def boxplot():
    data = request.get_json(silent=True) or {}
    genre1 = data.get("genre1")
    genre2 = data.get("genre2")
    if not genre1 or not genre2:
        return _json_error("genre1 and genre2 are required", 400)
    return jsonify(get_boxplot_data(DF, genre1, genre2))


@app.post("/api/genre-feature-compare")
def genre_feature_compare():
    data = request.get_json(silent=True) or {}
    genre1 = str(data.get("genre1", "")).strip()
    genre2 = str(data.get("genre2", "")).strip()
    if not genre1 or not genre2:
        return _json_error("genre1 and genre2 are required", 400)

    g1 = DF[DF["track_genre"] == genre1]
    g2 = DF[DF["track_genre"] == genre2]
    if g1.empty or g2.empty:
        return _json_error("One or both genres not found", 404, genre1=genre1, genre2=genre2)

    compare_features = ["danceability", "energy", "valence", "acousticness", "tempo"]
    rows = []
    for feat in compare_features:
        if feat not in DF.columns:
            continue
        m1 = float(g1[feat].mean())
        m2 = float(g2[feat].mean())
        # Keep tempo visually comparable with normalized metrics.
        if feat == "tempo":
            m1 = max(0.0, min(1.0, m1 / 220.0))
            m2 = max(0.0, min(1.0, m2 / 220.0))
        rows.append(
            {
                "feature": feat,
                "genre1": round(m1, 4),
                "genre2": round(m2, 4),
            }
        )

    return jsonify(
        {
            "genre1": genre1,
            "genre2": genre2,
            "rows": rows,
        }
    )


# ---- SONG SEARCH (Explore) ----
@app.get("/api/songs")
def songs():
    """
    Lightweight search for Explore screen.
    Returns plain Python types only.
    """
    q = str(request.args.get("q", "")).strip().lower()
    try:
        limit = int(request.args.get("limit", 10))
    except ValueError:
        limit = 10
    limit = max(1, min(200, limit))

    cols = [
        "track_name",
        "artists",
        "track_genre",
        "popularity",
        "danceability",
        "energy",
        "valence",
        "tempo",
        "acousticness",
    ]
    cols = [c for c in cols if c in DF.columns]
    data = DF[cols].copy()

    if q:
        name = data["track_name"].astype(str).str.lower() if "track_name" in data.columns else ""
        art = data["artists"].astype(str).str.lower() if "artists" in data.columns else ""
        genre = data["track_genre"].astype(str).str.lower() if "track_genre" in data.columns else ""
        mask = name.str.contains(q, na=False) | art.str.contains(q, na=False) | genre.str.contains(q, na=False)
        data = data[mask]

    # Stable "top" ordering: most popular first
    if "popularity" in data.columns:
        data = data.sort_values("popularity", ascending=False)

    data = data.head(limit)

    records = []
    for r in data.to_dict(orient="records"):
        clean: Dict[str, Any] = {}
        for k, v in r.items():
            if isinstance(v, (float, int, str, bool)) or v is None:
                clean[k] = v
            else:
                clean[k] = float(v) if hasattr(v, "__float__") else str(v)
        # coerce numeric columns (avoid numpy scalars)
        for k in ("popularity", "danceability", "energy", "valence", "tempo", "acousticness"):
            if k in clean and clean[k] is not None:
                clean[k] = float(clean[k]) if k != "popularity" else int(clean[k])
        if "track_name" in clean:
            clean["track_name"] = str(clean["track_name"])
        if "artists" in clean:
            clean["artists"] = str(clean["artists"])
        if "track_genre" in clean:
            clean["track_genre"] = str(clean["track_genre"])
        records.append(clean)

    return jsonify(records)


# ---- YEAR REWIND ----
@app.get("/api/rewind/yearly")
def rewind_yearly():
    if DF_YEAR.empty:
        return _json_error("No year/release_date data available", 500)

    start = int(request.args.get("start", int(DF_YEAR["year"].min())))
    end = int(request.args.get("end", int(DF_YEAR["year"].max())))
    if end < start:
        start, end = end, start

    d = DF_YEAR[(DF_YEAR["year"] >= start) & (DF_YEAR["year"] <= end)].copy()
    if d.empty:
        return jsonify({"start": start, "end": end, "series": [], "badges": []})

    grouped = (
        d.groupby("year")[["danceability", "energy", "valence"]]
        .mean()
        .reset_index()
        .sort_values("year")
    )
    series = [
        {
            "year": int(r["year"]),
            "danceability": round(float(r["danceability"]), 4),
            "energy": round(float(r["energy"]), 4),
            "valence": round(float(r["valence"]), 4),
        }
        for _, r in grouped.iterrows()
    ]

    dance_peak = max(series, key=lambda x: x["danceability"])
    energy_peak = max(series, key=lambda x: x["energy"])
    saddest = min(series, key=lambda x: x["valence"])
    badges = [
        f"Most Danceable: {dance_peak['year']}",
        f"Peak Energy: {energy_peak['year']}",
        f"Saddest Year: {saddest['year']}",
    ]
    return jsonify({"start": start, "end": end, "series": series, "badges": badges})


@app.get("/api/rewind/bounds")
def rewind_bounds():
    if DF_YEAR.empty:
        return _json_error("No year data available", 500)
    return jsonify(
        {
            "min_year": int(DF_YEAR["year"].min()),
            "max_year": int(DF_YEAR["year"].max()),
        }
    )


@app.get("/api/rewind/genre-shift")
def rewind_genre_shift():
    if DF_YEAR.empty:
        return _json_error("No year/release_date data available", 500)

    start = int(request.args.get("start", int(DF_YEAR["year"].min())))
    end = int(request.args.get("end", int(DF_YEAR["year"].max())))
    if end < start:
        start, end = end, start

    d = DF_YEAR[(DF_YEAR["year"] >= start) & (DF_YEAR["year"] <= end)].copy()
    if d.empty or "track_genre" not in d.columns:
        return jsonify({"genres": [], "data": []})

    d["decade"] = (d["year"] // 10) * 10
    top_genres = d["track_genre"].value_counts().head(3).index.tolist()
    grp = (
        d[d["track_genre"].isin(top_genres)]
        .groupby(["decade", "track_genre"])
        .size()
        .reset_index(name="count")
    )

    out = []
    for decade, sub in grp.groupby("decade"):
        total = float(sub["count"].sum()) or 1.0
        row: Dict[str, Any] = {"decade": f"{int(decade)}s"}
        for g in top_genres:
            c = float(sub[sub["track_genre"] == g]["count"].sum())
            row[g] = round((c / total) * 100.0, 2)
        out.append(row)

    out = sorted(out, key=lambda x: x["decade"])
    return jsonify({"genres": top_genres, "data": out})


@app.get("/api/rewind/genre-shift-buckets")
def rewind_genre_shift_buckets():
    if DF_YEAR.empty:
        return _json_error("No year/release_date data available", 500)

    start = int(request.args.get("start", int(DF_YEAR["year"].min())))
    end = int(request.args.get("end", int(DF_YEAR["year"].max())))
    if end < start:
        start, end = end, start

    d = DF_YEAR[(DF_YEAR["year"] >= start) & (DF_YEAR["year"] <= end)].copy()
    if d.empty or "track_genre" not in d.columns:
        return jsonify({"genres": [], "data": []})

    d["bucket"] = "1900s"
    d.loc[(d["year"] >= 2000) & (d["year"] <= 2019), "bucket"] = "2000s"
    d.loc[d["year"] >= 2020, "bucket"] = "2020+"
    order = ["1900s", "2000s", "2020+"]

    out = []
    for bucket in order:
        sub = d[d["bucket"] == bucket]
        total = float(len(sub)) or 1.0
        counts = sub["track_genre"].value_counts().head(3)
        names = list(counts.index)
        vals = [float(v) for v in counts.values]
        while len(names) < 3:
            names.append("-")
            vals.append(0.0)

        row: Dict[str, Any] = {"bucket": bucket}
        for i in range(3):
            key = f"top_{i+1}"
            row[key] = round((vals[i] / total) * 100.0, 2)
            row[f"{key}_label"] = str(names[i])
        out.append(row)

    return jsonify({"genres": ["top_1", "top_2", "top_3"], "data": out})


@app.get("/api/rewind/genre-shift-yearly")
def rewind_genre_shift_yearly():
    if DF_YEAR.empty:
        return _json_error("No year/release_date data available", 500)

    start = int(request.args.get("start", int(DF_YEAR["year"].min())))
    end = int(request.args.get("end", int(DF_YEAR["year"].max())))
    if end < start:
        start, end = end, start

    d = DF_YEAR[(DF_YEAR["year"] >= start) & (DF_YEAR["year"] <= end)].copy()
    if d.empty or "track_genre" not in d.columns:
        return jsonify({"genres": [], "data": []})

    years = sorted(int(y) for y in d["year"].unique().tolist())
    out = []
    for year in years:
        sub = d[d["year"] == year]
        total = float(len(sub)) or 1.0
        counts = sub["track_genre"].value_counts().head(3)
        names = list(counts.index)
        vals = [float(v) for v in counts.values]
        while len(names) < 3:
            names.append("-")
            vals.append(0.0)

        row: Dict[str, Any] = {"year": int(year)}
        for i in range(3):
            key = f"top_{i+1}"
            row[key] = round((vals[i] / total) * 100.0, 2)
            row[f"{key}_label"] = str(names[i])
        out.append(row)
    return jsonify({"genres": ["top_1", "top_2", "top_3"], "data": out})


# ---- TIME MACHINE ----
@app.get("/api/timemachine")
def timemachine():
    if DF_YEAR.empty:
        return _json_error("No year/release_date data available", 500)

    artist_q = str(request.args.get("artist", "")).strip().lower()
    decade_start = int(request.args.get("decade_start", 1980))
    decade_end = int(request.args.get("decade_end", decade_start + 9))
    limit = max(1, min(20, int(request.args.get("limit", 10))))

    if not artist_q:
        return _json_error("artist is required", 400)

    selected_artist = _best_artist_label(DF_YEAR, artist_q)
    artist_df = DF_YEAR[
        DF_YEAR["artists"].astype(str).str.lower().str.contains(re.escape(selected_artist.lower()), na=False)
    ].copy()
    if artist_df.empty:
        return _json_error("Artist not found", 404, artist=artist_q)

    decade_df = DF_YEAR[(DF_YEAR["year"] >= decade_start) & (DF_YEAR["year"] <= decade_end)].copy()
    if decade_df.empty:
        return _json_error("No songs found in selected decade", 404)

    artist_profile = {f: float(artist_df[f].mean()) for f in FEATURES}
    decade_profile = {f: float(decade_df[f].mean()) for f in FEATURES}

    feat_df = decade_df.dropna(subset=FEATURES).copy()
    if feat_df.empty:
        return _json_error("No feature-complete songs in selected decade", 404)

    input_vec = pd.Series(artist_profile)
    distances = ((feat_df[FEATURES] - input_vec) ** 2).sum(axis=1) ** 0.5
    top_idx = distances.nsmallest(limit).index
    top_cols = ["track_name", "artists", "track_genre", "popularity"] + FEATURES
    top_cols = [c for c in top_cols if c in feat_df.columns]
    top = feat_df.loc[top_idx][top_cols].copy()

    matches = []
    dist_max = float(distances.loc[top_idx].max()) if len(top_idx) else 1.0
    for idx, r in top.iterrows():
        score = 100.0 if dist_max == 0 else max(0.0, 100.0 * (1.0 - float(distances.loc[idx]) / dist_max))
        matches.append(
            {
                "name": str(r["track_name"]),
                "artist": str(r["artists"]),
                "genre": str(r.get("track_genre", "")) if pd.notna(r.get("track_genre", "")) else "",
                "energy": round(float(r["energy"]), 4),
                "valence": round(float(r["valence"]), 4),
                "tempo": round(float(r["tempo"]), 2) if pd.notna(r.get("tempo", None)) else None,
                "matchPct": round(float(score), 1),
            }
        )

    radar_data = [
        {"axis": "Energy", "artist": round(artist_profile["energy"] * 100, 2), "decade": round(decade_profile["energy"] * 100, 2)},
        {"axis": "Dance", "artist": round(artist_profile["danceability"] * 100, 2), "decade": round(decade_profile["danceability"] * 100, 2)},
        {"axis": "Valence", "artist": round(artist_profile["valence"] * 100, 2), "decade": round(decade_profile["valence"] * 100, 2)},
        {"axis": "Acoustics", "artist": round(artist_profile["acousticness"] * 100, 2), "decade": round(decade_profile["acousticness"] * 100, 2)},
        {"axis": "Tempo", "artist": round((artist_profile["tempo"] / 220.0) * 100, 2), "decade": round((decade_profile["tempo"] / 220.0) * 100, 2)},
    ]

    artist_name = selected_artist or str(artist_df.iloc[0]["artists"]).split(";")[0]
    return jsonify(
        {
            "artist": artist_name,
            "decade_start": decade_start,
            "decade_end": decade_end,
            "radar_data": radar_data,
            "matches": matches,
        }
    )


# ---- PROBABILITY ENDPOINTS ----
@app.post("/api/probability/normal")
def normal_prob():
    data = request.get_json(silent=True) or {}
    if "target_score" not in data:
        return _json_error("target_score is required", 400)
    return jsonify(normal_probability(DF, float(data["target_score"])))


@app.post("/api/probability/binomial")
def binomial_prob():
    data = request.get_json(silent=True) or {}
    if "n_songs" not in data or "hit_probability" not in data:
        return _json_error("n_songs and hit_probability are required", 400)
    return jsonify(
        binomial_probability(int(data["n_songs"]), float(data["hit_probability"]))
    )


@app.post("/api/probability/poisson")
def poisson_prob():
    data = request.get_json(silent=True) or {}
    if "genre" not in data or "n_songs" not in data:
        return _json_error("genre and n_songs are required", 400)
    return jsonify(poisson_estimate(DF, str(data["genre"]), int(data["n_songs"])))


@app.post("/api/probability/conditional")
def conditional_prob():
    data = request.get_json(silent=True) or {}
    if "feature" not in data or "threshold" not in data:
        return _json_error("feature and threshold are required", 400)
    feature = str(data["feature"])
    if feature not in DF.columns:
        return _json_error("Unknown feature", 400, feature=feature)
    return jsonify(conditional_probability(DF, feature, float(data["threshold"])))


@app.get("/api/normality-test")
def normality():
    feature = request.args.get("feature", "popularity")
    if feature not in DF.columns:
        return _json_error("Unknown feature", 400, feature=feature)
    return jsonify(normality_test(DF, feature))


# ---- REGRESSION ENDPOINTS ----
@app.get("/api/regression/summary")
def regression_summary():
    return jsonify(get_model_summary(DF))


@app.post("/api/predict")
def predict():
    data = request.get_json(silent=True) or {}
    return jsonify(predict_popularity(DF, data))


@app.post("/api/similar-songs")
def similar():
    data = request.get_json(silent=True) or {}
    return jsonify(find_similar_songs(DF, data))


@app.post("/api/confidence-intervals")
def confidence_intervals():
    data = request.get_json(silent=True) or {}
    genre1 = data.get("genre1")
    genre2 = data.get("genre2")
    if not genre1 or not genre2:
        return _json_error("genre1 and genre2 are required", 400)
    return jsonify(get_confidence_intervals(DF, str(genre1), str(genre2)))


# ---- NAIVE BAYES ENDPOINTS ----
@app.post("/api/classify-genre")
def classify():
    data = request.get_json(silent=True) or {}
    return jsonify(predict_genre(DF, data))


@app.get("/api/mystery-song")
def mystery():
    return jsonify(get_mystery_song(DF))


# ---- PLAYLIST ENDPOINT ----
@app.post("/api/playlist")
def playlist():
    data = request.get_json(silent=True) or {}
    mood = str(data.get("mood", "")).lower().strip()
    reshuffle = bool(data.get("reshuffle", False))
    if not mood:
        return _json_error("mood is required", 400)

    profiles = {
        "gym": {"energy": (0.7, 1.0), "danceability": (0.6, 1.0)},
        "study": {"energy": (0.0, 0.4), "acousticness": (0.5, 1.0)},
        "party": {"danceability": (0.7, 1.0), "valence": (0.6, 1.0)},
        "heartbreak": {"valence": (0.0, 0.35), "energy": (0.2, 0.6)},
        "roadtrip": {"energy": (0.6, 1.0)},
        "latenight": {"energy": (0.3, 0.6), "valence": (0.3, 0.6)},
    }

    filtered = DF.copy()
    for feat, (lo, hi) in profiles.get(mood, {}).items():
        filtered = filtered[(filtered[feat] >= lo) & (filtered[feat] <= hi)]

    if len(filtered) == 0:
        return jsonify([])

    cols = [
        "track_name",
        "artists",
        "popularity",
        "danceability",
        "energy",
        "valence",
        "tempo",
        "acousticness",
        "track_genre",
    ]
    cols = [c for c in cols if c in filtered.columns]
    if reshuffle:
        sample_n = min(20, len(filtered))
        top = filtered.sample(n=sample_n, replace=False)[cols].copy()
    else:
        top = filtered.nlargest(20, "popularity")[cols].copy()

    # Ensure plain python types
    records = []
    for r in top.to_dict(orient="records"):
        clean: Dict[str, Any] = {}
        for k, v in r.items():
            if isinstance(v, (float, int, str, bool)) or v is None:
                clean[k] = v
            else:
                clean[k] = float(v) if hasattr(v, "__float__") else str(v)
        records.append(clean)

    return jsonify(records)


if __name__ == "__main__":
    # -u (unbuffered) recommended: `python -u app.py` so logs appear immediately in the terminal.
    app.run(debug=True, host="0.0.0.0", port=5000, use_reloader=False)

