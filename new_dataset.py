import pandas as pd
from sdv.single_table import GaussianCopulaSynthesizer
from sdv.metadata import Metadata

df = pd.read_csv("student_data.csv")

metadata = Metadata.detect_from_dataframe(df)

# save metadata (this removes warning + makes project professional)
metadata.save_to_json("metadata.json")

model = GaussianCopulaSynthesizer(metadata)
model.fit(df)

synthetic_rows = model.sample(num_rows=5000)

new_df = pd.concat([df, synthetic_rows], ignore_index=True)

new_df.to_csv("student_data_expanded_5000.csv", index=False)