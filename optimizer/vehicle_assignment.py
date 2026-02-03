import json
import os

# Get absolute path of current file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

orders_path = os.path.join(BASE_DIR, "../backend/data/orders.json")
vehicles_path = os.path.join(BASE_DIR, "../backend/data/vehicle.json")

# Load data
with open(orders_path, "r") as f:
    orders = json.load(f)

with open(vehicles_path, "r") as f:
    vehicles = json.load(f)

# ---- Simple clusters ----
clusters = {
    0: orders[:2],
    1: orders[2:]
}

assignments = {}

for cluster_id, cluster_orders in clusters.items():
    total_load = sum(o["quantity"] for o in cluster_orders)

    suitable_vehicle = None
    for v in sorted(vehicles, key=lambda x: x["capacity"]):
        if v["capacity"] >= total_load:
            suitable_vehicle = v
            break

    if suitable_vehicle:
        assignments[cluster_id] = {
            "vehicle": suitable_vehicle["vehicleId"],
            "load": total_load
        }
    else:
        assignments[cluster_id] = {
            "vehicle": "No vehicle available",
            "load": total_load
        }

print("Vehicle Assignments:")
for k, v in assignments.items():
    print(f"Cluster {k} -> Vehicle {v['vehicle']} (Load: {v['load']})")

