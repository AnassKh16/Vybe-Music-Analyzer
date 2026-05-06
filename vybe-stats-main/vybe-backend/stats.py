import pandas as pd
import numpy as np
from scipy import stats

def _py(v):
    """Convert numpy/pandas scalars to plain Python types for JSON."""
    if isinstance(v, (np.integer,)):
        return int(v)
    if isinstance(v, (np.floating,)):
        return float(v)
    return v

def load_data():
    df = pd.read_csv('data/spotify.csv')
    # drop nulls and duplicates
    df = df.dropna()
    df = df.drop_duplicates()
    return df

def get_descriptive_stats(df, feature):
    col = df[feature]
    return {
        'mean': round(float(_py(col.mean())), 4),
        'median': round(float(_py(col.median())), 4),
        'mode': round(float(_py(col.mode()[0])), 4),
        'std': round(float(_py(col.std())), 4),
        'variance': round(float(_py(col.var())), 4),
        'range': round(float(_py(col.max() - col.min())), 4),
        'iqr': round(float(_py(col.quantile(0.75) - col.quantile(0.25))), 4),
        'q1': round(float(_py(col.quantile(0.25))), 4),
        'q2': round(float(_py(col.quantile(0.50))), 4),
        'q3': round(float(_py(col.quantile(0.75))), 4),
        'skewness': round(float(_py(col.skew())), 4),
        'kurtosis': round(float(_py(col.kurt())), 4),
        'min': round(float(_py(col.min())), 4),
        'max': round(float(_py(col.max())), 4),
        'count': int(_py(col.count()))
    }

def get_correlation_matrix(df):
    features = ['popularity', 'danceability', 'energy',
                'tempo', 'valence', 'acousticness']
    corr = df[features].corr().round(4)
    # Ensure plain Python floats
    return {r: {c: float(_py(v)) for c, v in row.items()} for r, row in corr.to_dict().items()}

def get_genre_stats(df):
    grouped = df.groupby('track_genre')['popularity'].agg([
        'mean', 'median', 'std', 'count'
    ]).round(4)
    rows = grouped.reset_index().to_dict(orient='records')
    out = []
    for r in rows:
        out.append({
            'track_genre': str(r.get('track_genre')),
            'mean': float(_py(r.get('mean'))),
            'median': float(_py(r.get('median'))),
            'std': float(_py(r.get('std'))),
            'count': int(_py(r.get('count'))),
        })
    return out

def get_histogram_data(df, feature, bins=20):
    col = df[feature].dropna()
    counts, bin_edges = np.histogram(col, bins=bins)
    return {
        'counts': counts.tolist(),
        'bin_edges': [round(x, 4) for x in bin_edges.tolist()],
        'feature': feature
    }

def get_boxplot_data(df, genre1, genre2):
    def box_stats(series):
        return {
            'min': round(float(series.min()), 4),
            'q1': round(float(series.quantile(0.25)), 4),
            'median': round(float(series.median()), 4),
            'q3': round(float(series.quantile(0.75)), 4),
            'max': round(float(series.max()), 4),
            'mean': round(float(series.mean()), 4)
        }
    g1 = df[df['track_genre'] == genre1]['popularity']
    g2 = df[df['track_genre'] == genre2]['popularity']
    return {
        'genre1': {'name': genre1, 'stats': box_stats(g1)},
        'genre2': {'name': genre2, 'stats': box_stats(g2)}
    }