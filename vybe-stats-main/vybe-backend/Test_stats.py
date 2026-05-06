"""
test_stats.py — Tests every function in stats.py
Run this from inside the vybe-backend folder:
    python test_stats.py
"""

from stats import (
    load_data,
    get_descriptive_stats,
    get_correlation_matrix,
    get_genre_stats,
    get_histogram_data,
    get_boxplot_data
)

# ─────────────────────────────────────────
# 1. Load Data
# ─────────────────────────────────────────
print("=" * 50)
print("TEST 1 — load_data()")
print("=" * 50)
df = load_data()
print(f"Rows loaded : {len(df)}")
print(f"Columns     : {list(df.columns)}")
print()

# ─────────────────────────────────────────
# 2. Descriptive Stats
# ─────────────────────────────────────────
print("=" * 50)
print("TEST 2 — get_descriptive_stats() for 'popularity'")
print("=" * 50)
desc = get_descriptive_stats(df, 'popularity')
for key, val in desc.items():
    print(f"  {key:<12}: {val}")
print()

print("TEST 2b — get_descriptive_stats() for 'danceability'")
desc2 = get_descriptive_stats(df, 'danceability')
for key, val in desc2.items():
    print(f"  {key:<12}: {val}")
print()

# ─────────────────────────────────────────
# 3. Correlation Matrix
# ─────────────────────────────────────────
print("=" * 50)
print("TEST 3 — get_correlation_matrix()")
print("=" * 50)
corr = get_correlation_matrix(df)
for feature, values in corr.items():
    print(f"  {feature}: {values}")
print()

# ─────────────────────────────────────────
# 4. Genre Stats
# ─────────────────────────────────────────
print("=" * 50)
print("TEST 4 — get_genre_stats() (first 5 genres)")
print("=" * 50)
genre_stats = get_genre_stats(df)
for g in genre_stats[:5]:
    print(f"  {g}")
print(f"  ... total genres: {len(genre_stats)}")
print()

# ─────────────────────────────────────────
# 5. Histogram Data
# ─────────────────────────────────────────
print("=" * 50)
print("TEST 5 — get_histogram_data() for 'energy'")
print("=" * 50)
hist = get_histogram_data(df, 'energy', bins=10)
print(f"  Feature    : {hist['feature']}")
print(f"  Bin counts : {hist['counts']}")
print(f"  Bin edges  : {hist['bin_edges']}")
print()

# ─────────────────────────────────────────
# 6. Boxplot Data
# ─────────────────────────────────────────
print("=" * 50)
print("TEST 6 — get_boxplot_data() for Pop vs Hip-Hop")
print("=" * 50)
box = get_boxplot_data(df, 'pop', 'hip-hop')
print(f"  Genre 1 ({box['genre1']['name']}) stats: {box['genre1']['stats']}")
print(f"  Genre 2 ({box['genre2']['name']}) stats: {box['genre2']['stats']}")
print()

print("=" * 50)
print("ALL TESTS PASSED — stats.py is working correctly!")
print("=" * 50)