import math
import json
import os

# ---------- Utility Functions ----------
def distance(a, b):
    return math.sqrt((a[0] - b[0])**2 + (a[1] - b[1])**2)

def nearest_neighbor_route(locations):
    if len(locations) <= 1:
        return locations

    route = [locations[0]]
    remaining = locations[1:]

    while remaining:
        last = route[-1]
        next_point = min(
            remaining,
            key=lambda x: distance(last, x)
        )
        route.append(next_point)
        remaining.remove(next_point)

    return route


# ---------- Load Data ----------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

orders_path = os.path.join(BASE_DIR, "..", "backend", "data", "orders.json")

with open(orders_path) as f:
    orders = json.load(f)

# ---------- Simulated Clusters (same as vehicle assignment) ----------
clusters = {
    0: orders[:2],
    1: orders[2:]
}

# ---------- Route Planning ----------
print("\nOptimized Routes:\n")

for cluster_id, cluster_orders in clusters.items():
    locations = [
        (o["latitude"], o["longitude"]) for o in cluster_orders
    ]

    route = nearest_neighbor_route(locations)

    print(f"Cluster {cluster_id} Route:")
    for i, point in enumerate(route, start=1):
        print(f"  Stop {i}: {point}")
    print()
