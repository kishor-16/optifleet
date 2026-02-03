from sklearn.cluster import KMeans
import json

with open("../backend/data/orders.json") as f:
    orders = json.load(f)

coords = [[o["latitude"], o["longitude"]] for o in orders]

kmeans = KMeans(n_clusters=2)
labels = kmeans.fit_predict(coords)

clusters = {}
for i, label in enumerate(labels):
    clusters.setdefault(label, []).append(orders[i])

print("Order Clusters:")
print(clusters)
