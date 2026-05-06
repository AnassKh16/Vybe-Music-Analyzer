"""
probability.py  —  Vybe Music App
Dataset : data/dataset.csv
Source  : https://www.kaggle.com/datasets/maharshipandya/-spotify-tracks-dataset
"""

import numpy as np
from scipy import stats
from scipy.stats import binom, poisson, norm


def normal_probability(df, target_score):
    mu      = df['popularity'].mean()
    sigma   = df['popularity'].std()
    z_score = (target_score - mu) / sigma
    prob_above = float(1 - norm.cdf(target_score, mu, sigma))

    # Bell curve points for frontend chart
    x_vals = np.linspace(mu - 4 * sigma, mu + 4 * sigma, 100)
    y_vals = norm.pdf(x_vals, mu, sigma)

    return {
        'mean':             round(float(mu), 2),
        'std':              round(float(sigma), 2),
        'z_score':          round(float(z_score), 2),
        'probability_above': round(prob_above * 100, 1),
        'target':           target_score,
        'curve_x':          [round(float(x), 2) for x in x_vals.tolist()],
        'curve_y':          [round(float(y), 6) for y in y_vals.tolist()]
    }


def binomial_probability(n_songs, hit_probability):
    k_values      = list(range(n_songs + 1))
    probabilities = [
        round(float(binom.pmf(k, n_songs, hit_probability)), 4)
        for k in k_values
    ]
    return {
        'k_values':      k_values,
        'probabilities': probabilities,
        'expected_hits': round(float(n_songs * hit_probability), 1),
        'std':           round(float(np.sqrt(
                             n_songs * hit_probability * (1 - hit_probability)
                         )), 2)
    }


def poisson_estimate(df, genre, n_songs):
    genre_df = df[df['track_genre'] == genre]
    if len(genre_df) == 0:
        return {'error': f"Genre '{genre}' not found"}

    hit_rate   = len(genre_df[genre_df['popularity'] > 70]) / len(genre_df)
    lambda_val = hit_rate * n_songs
    k_range    = list(range(min(int(lambda_val * 3) + 5, 20)))
    probabilities = [
        round(float(poisson.pmf(k, lambda_val)), 4)
        for k in k_range
    ]
    return {
        'lambda':          round(float(lambda_val), 2),
        'hit_rate':        round(float(hit_rate * 100), 1),
        'expected_viral':  round(float(lambda_val), 1),
        'k_values':        k_range,
        'probabilities':   probabilities
    }


def conditional_probability(df, feature, threshold, pop_threshold=70):
    high_feature = df[df[feature] > threshold]
    if len(high_feature) == 0:
        return {'probability': 0}

    prob         = len(high_feature[high_feature['popularity'] > pop_threshold]) / len(high_feature)
    overall_prob = len(df[df['popularity'] > pop_threshold]) / len(df)

    return {
        'p_popular_given_high': round(float(prob * 100), 1),
        'p_popular_overall':    round(float(overall_prob * 100), 1),
        'feature':              feature,
        'threshold':            threshold,
        'sample_size':          int(len(high_feature))
    }


def normality_test(df, feature):
    sample = df[feature].dropna().sample(min(5000, len(df)), random_state=42)
    stat, p_value = stats.shapiro(sample[:5000])
    return {
        'statistic':  round(float(stat), 4),
        'p_value':    round(float(p_value), 4),
        'is_normal':  bool(p_value > 0.05),
        'conclusion': 'Normal distribution' if p_value > 0.05 else 'Not normal distribution'
    }
