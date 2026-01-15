import pandas as pd

df = pd.read_csv("voca.csv")[["word", "meaning"]]
df.to_csv("voca_processed.csv", index=False)
