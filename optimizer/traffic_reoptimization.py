import math
import json
import os
import random

# ---------- Distance with Traffic ----------
def traffic_distance(a, b, traffic_factor):
    base = math.sqrt((a[0] - b[0])**2 + (a[1] - b[1])**2)
    return base * traffic_factor


def optimized_route_with_traffic(locations, traffic_factor):
    if len(locations) <= 1:
        return locations

    route = [locations[0]]
    remaining = locations[1:]

    while remaining:
        last = route[-1]
        next_point = min(
            remaining,
            key=lambda x: traffic_distance(last, x, traffic_factor)
        )
        route.append(next_point)
        remaining.remove(next_point)

    return route


# ---------- Load Orders ----------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
orders_path = os.path.join(BASE_DIR, "..", "backend", "data", "orders.json")

with open(orders_path) as f:
    orders = json.load(f)

# ---------- Same Clusters ----------
clusters = {
    0: orders[:2],
    1: orders[2:]
}

# ---------- Simulate Traffic ----------
traffic_conditions = {
    "Low": 1.0,
    "Medium": 1.5,
    "High": 2.0
}

traffic_level = random.choice(list(traffic_conditions.keys()))
traffic_factor = traffic_conditions[traffic_level]

print(f"\n🚦 Traffic Condition: {traffic_level}\n")

# ---------- Re-Optimized Routes ----------
for cluster_id, cluster_orders in clusters.items():
    locations = [(o["latitude"], o["longitude"]) for o in cluster_orders]

    route = optimized_route_with_traffic(locations, traffic_factor)

    print(f"Cluster {cluster_id} Re-Optimized Route:")
    for i, stop in enumerate(route, start=1):
        print(f"  Stop {i}: {stop}")
    print()
