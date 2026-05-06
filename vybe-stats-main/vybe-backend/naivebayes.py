"""
naivebayes.py  —  Vybe Music App
Dataset : data/dataset.csv
Source  : https://www.kaggle.com/datasets/maharshipandya/-spotify-tracks-dataset
"""

import pandas as pd
import numpy as np
from sklearn.naive_bayes import GaussianNB
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split

FEATURES = ['danceability', 'energy', 'tempo', 'valence', 'acousticness']
TOP_N_GENRES = 10

_CACHE = {
    "fingerprint": None,
    "clf": None,
    "le": None,
}


def _top_genre_labels(df):
    return df['track_genre'].value_counts().head(TOP_N_GENRES).index


def _fingerprint(df):
    """
    Stable-ish fingerprint for caching.
    If dataset content changes (or top genres distribution changes), retrain.
    """
    vc = df["track_genre"].value_counts().head(TOP_N_GENRES)
    return (int(len(df)), tuple((str(k), int(v)) for k, v in vc.items()))


def train_classifier(df):
    fp = _fingerprint(df)
    if _CACHE["fingerprint"] == fp and _CACHE["clf"] is not None and _CACHE["le"] is not None:
        return _CACHE["clf"], _CACHE["le"]

    top_genres  = _top_genre_labels(df)
    df_filtered = df[df['track_genre'].isin(top_genres)].copy()
    X         = df_filtered[FEATURES]
    y         = df_filtered['track_genre']
    le        = LabelEncoder()
    y_encoded = le.fit_transform(y)
    clf       = GaussianNB()
    clf.fit(X, y_encoded)

    _CACHE["fingerprint"] = fp
    _CACHE["clf"] = clf
    _CACHE["le"] = le
    return clf, le


def predict_genre(df, input_features):
    clf, le = train_classifier(df)

    # ✅ Use a DataFrame with named columns — eliminates the sklearn warning
    row = pd.DataFrame(
        [[input_features.get(f, 0.0) for f in FEATURES]],
        columns=FEATURES
    )

    prediction    = clf.predict(row)[0]
    probabilities = clf.predict_proba(row)[0]
    genres        = le.classes_

    genre_probs = {
        genres[i]: round(float(probabilities[i]) * 100, 1)
        for i in range(len(genres))
    }
    sorted_probs = dict(
        sorted(genre_probs.items(), key=lambda x: x[1], reverse=True)
    )
    return {
        'predicted_genre': genres[prediction],
        'probabilities':   sorted_probs,
        'top_3':           list(sorted_probs.items())[:3]
    }


def get_mystery_song(df):
    top_genres  = _top_genre_labels(df)
    df_filtered = df[df['track_genre'].isin(top_genres)].copy()
    song        = df_filtered.sample(1).iloc[0]
    return {
        'actual_genre': song['track_genre'],
        'features':     {f: round(float(song[f]), 4) for f in FEATURES},
        'track_name':   song['track_name'],
        'artists':      song['artists']
    }


def get_model_accuracy(df):
    from sklearn.metrics import classification_report, accuracy_score

    top_genres  = _top_genre_labels(df)
    df_filtered = df[df['track_genre'].isin(top_genres)].copy()
    X         = df_filtered[FEATURES]
    y         = df_filtered['track_genre']
    le        = LabelEncoder()
    y_encoded = le.fit_transform(y)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y_encoded, test_size=0.2, random_state=42, stratify=y_encoded
    )

    clf = GaussianNB()
    clf.fit(X_train, y_train)

    # ✅ X_test is already a DataFrame with named columns (from df_filtered[FEATURES])
    y_pred = clf.predict(X_test)

    return {
        'accuracy_percent':      round(accuracy_score(y_test, y_pred) * 100, 2),
        'classification_report': classification_report(
            y_test, y_pred, target_names=le.classes_
        )
    }
