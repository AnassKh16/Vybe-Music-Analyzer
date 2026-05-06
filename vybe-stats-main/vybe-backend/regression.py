"""
regression.py  —  Vybe Music App
Dataset : data/dataset.csv
Source  : https://www.kaggle.com/datasets/maharshipandya/-spotify-tracks-dataset
"""

import pandas as pd
import numpy as np
import statsmodels.api as sm
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler

FEATURES = ['danceability', 'energy', 'tempo', 'valence', 'acousticness']


def train_model(df):
    X       = df[FEATURES].dropna()
    y       = df.loc[X.index, 'popularity']
    X_const = sm.add_constant(X)
    model   = sm.OLS(y, X_const).fit()
    return model, X, y


def get_model_summary(df):
    model, X, y = train_model(df)
    coefficients = {}
    for feat in FEATURES:
        coefficients[feat] = {
            'coefficient': round(float(model.params[feat]), 4),
            'p_value':     round(float(model.pvalues[feat]), 4),
            'significant': bool(model.pvalues[feat] < 0.05)
        }
    return {
        'r_squared':     round(float(model.rsquared), 4),
        'adj_r_squared': round(float(model.rsquared_adj), 4),
        'f_statistic':   round(float(model.fvalue), 4),
        'f_p_value':     round(float(model.f_pvalue), 4),
        'coefficients':  coefficients,
        'intercept':     round(float(model.params['const']), 4)
    }


def predict_popularity(df, input_features):
    model, X, y = train_model(df)
    row         = [input_features.get(f, 0) for f in FEATURES]
    row_const   = [1] + row

    prediction = model.predict([row_const])[0]

    # 95% confidence interval
    pred_obj = model.get_prediction([row_const])
    ci       = pred_obj.conf_int(alpha=0.05)[0]

    # Feature impact = coefficient × feature value
    impacts = {
        feat: round(float(model.params[feat]) * row[i], 4)
        for i, feat in enumerate(FEATURES)
    }

    return {
        'predicted_popularity':     round(float(max(0, min(100, prediction))), 1),
        'confidence_interval_low':  round(float(ci[0]), 1),
        'confidence_interval_high': round(float(ci[1]), 1),
        'feature_impacts':          impacts
    }


def find_similar_songs(df, input_features, top_n=5):
    features_df = df[FEATURES].dropna()
    input_vec   = np.array([input_features.get(f, 0) for f in FEATURES])
    distances   = np.sqrt(((features_df.values - input_vec) ** 2).sum(axis=1))
    top_indices = distances.argsort()[:top_n]

    similar = df.loc[features_df.index[top_indices]][
        ['track_name', 'artists', 'popularity'] + FEATURES
    ].copy()

    result = similar.to_dict(orient='records')
    for i, r in enumerate(result):
        r['match_score'] = round(float(max(0, 100 - distances[top_indices[i]] * 10)), 1)
        # Ensure all values are plain Python types — no numpy types
        for k in r:
            if isinstance(r[k], (np.integer, np.floating)):
                r[k] = float(r[k])
    return result


def get_confidence_intervals(df, genre1, genre2):
    def ci(series):
        n      = len(series)
        mean   = series.mean()
        se     = series.std() / np.sqrt(n)
        margin = 1.96 * se
        return {
            'mean':  round(float(mean), 2),
            'lower': round(float(mean - margin), 2),
            'upper': round(float(mean + margin), 2)
        }

    g1 = df[df['track_genre'] == genre1]['popularity']
    g2 = df[df['track_genre'] == genre2]['popularity']

    if len(g1) == 0:
        return {'error': f"Genre '{genre1}' not found"}
    if len(g2) == 0:
        return {'error': f"Genre '{genre2}' not found"}

    from scipy import stats
    t_stat, p_value = stats.ttest_ind(g1, g2)

    winner  = genre1 if g1.mean() > g2.mean() else genre2
    verdict = f"{winner} wins (p = {round(float(p_value), 3)})"

    return {
        'genre1':      {'name': genre1, 'ci': ci(g1)},
        'genre2':      {'name': genre2, 'ci': ci(g2)},
        't_statistic': round(float(t_stat), 4),
        'p_value':     round(float(p_value), 4),
        'significant': bool(p_value < 0.05),
        'winner':      winner,
        'verdict':     verdict
    }
