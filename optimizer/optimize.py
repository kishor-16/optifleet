#!/usr/bin/env python3
"""
OptiFleet Route Optimizer
Integrates clustering, route planning, and vehicle assignment
"""

import sys
import json
import math
from typing import List, Dict, Tuple

# ============================================
# DISTANCE CALCULATION (HAVERSINE)
# ============================================

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    Returns distance in kilometers
    """
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    # Radius of earth in kilometers
    r = 6371
    
    return c * r


# ============================================
# ROUTE OPTIMIZATION (NEAREST NEIGHBOR)
# ============================================

def nearest_neighbor_route(routes: List[Dict]) -> List[Dict]:
    """
    Optimize route order using nearest neighbor algorithm
    """
    if len(routes) <= 1:
        return routes
    
    optimized = [routes[0]]
    remaining = routes[1:]
    
    while remaining:
        current = optimized[-1]
        
        # Find nearest location
        nearest_idx = 0
        nearest_dist = float('inf')
        
        for idx, route in enumerate(remaining):
            dist = haversine_distance(
                current['latitude'], current['longitude'],
                route['latitude'], route['longitude']
            )
            
            if dist < nearest_dist:
                nearest_dist = dist
                nearest_idx = idx
        
        optimized.append(remaining.pop(nearest_idx))
    
    return optimized


# ============================================
# CLUSTERING (K-MEANS SIMPLIFIED)
# ============================================

def simple_clustering(routes: List[Dict], num_clusters: int = 2) -> Dict[int, List[Dict]]:
    """
    Simple geographic clustering based on latitude/longitude
    """
    if len(routes) <= num_clusters:
        return {i: [route] for i, route in enumerate(routes)}
    
    # For simplicity, divide by latitude ranges
    sorted_routes = sorted(routes, key=lambda r: r['latitude'])
    cluster_size = len(sorted_routes) // num_clusters
    
    clusters = {}
    for i in range(num_clusters):
        start_idx = i * cluster_size
        end_idx = start_idx + cluster_size if i < num_clusters - 1 else len(sorted_routes)
        clusters[i] = sorted_routes[start_idx:end_idx]
    
    return clusters


# ============================================
# VEHICLE ASSIGNMENT
# ============================================

def assign_vehicles(clusters: Dict[int, List[Dict]]) -> Dict[int, Dict]:
    """
    Assign appropriate vehicles to clusters based on load
    Vans: Cap 10, Trucks: Cap 30
    """
    VAN_CAPACITY = 10
    TRUCK_CAPACITY = 30
    
    assignments = {}
    
    for cluster_id, cluster_routes in clusters.items():
        total_load = sum(route.get('quantity', 0) for route in cluster_routes)
        
        # Decide vehicle type based on load
        if total_load > VAN_CAPACITY:
            v_type = "Heavy Truck"
            v_capacity = TRUCK_CAPACITY
            v_name = f"TRUCK-{cluster_id+1}"
        else:
            v_type = "Standard Van"
            v_capacity = VAN_CAPACITY
            v_name = f"VAN-{cluster_id+1}"
        
        # Calculate how many vehicles are actually needed for this cluster
        vehicles_needed = math.ceil(total_load / v_capacity)
        if vehicles_needed == 0: vehicles_needed = 1
        
        assignments[cluster_id] = {
            "vehicle": v_name,
            "type": v_type,
            "capacity": v_capacity,
            "load": total_load,
            "utilization": round((total_load / (vehicles_needed * v_capacity)) * 100, 1),
            "vehicle_count_for_cluster": vehicles_needed
        }
    
    return assignments


# ============================================
# METRICS CALCULATION
# ============================================

def calculate_route_distance(routes: List[Dict]) -> float:
    """Calculate total distance for a route"""
    if len(routes) < 2:
        return 0.0
    
    total_distance = 0.0
    for i in range(len(routes) - 1):
        dist = haversine_distance(
            routes[i]['latitude'], routes[i]['longitude'],
            routes[i + 1]['latitude'], routes[i + 1]['longitude']
        )
        total_distance += dist
    
    return total_distance


def calculate_metrics(routes_before: List[Dict], routes_after: List[Dict]) -> Dict:
    """Calculate optimization metrics"""
    
    # Distance
    distance_before = calculate_route_distance(routes_before)
    distance_after = calculate_route_distance(routes_after)
    
    # Fuel consumption (12L/100km = 0.12L/km)
    fuel_before = distance_before * 0.12
    fuel_after = distance_after * 0.12
    
    # CO2 emissions (2.68 kg per liter of diesel)
    carbon_before = fuel_before * 2.68
    carbon_after = fuel_after * 2.68
    
    # Savings
    distance_savings = distance_before - distance_after
    fuel_savings = fuel_before - fuel_after
    carbon_savings = carbon_before - carbon_after
    percentage_savings = (distance_savings / distance_before * 100) if distance_before > 0 else 0
    
    return {
        "before": {
            "distance": round(distance_before, 2),
            "fuel": round(fuel_before, 2),
            "carbon": round(carbon_before, 2)
        },
        "after": {
            "distance": round(distance_after, 2),
            "fuel": round(fuel_after, 2),
            "carbon": round(carbon_after, 2)
        },
        "savings": {
            "distance": round(distance_savings, 2),
            "fuel": round(fuel_savings, 2),
            "carbon": round(carbon_savings, 2),
            "percentage": round(percentage_savings, 1)
        }
    }


def calculate_sequential_vehicles(routes: List[Dict], max_capacity: int = 10) -> int:
    """
    Calculate number of vehicles required if assigned sequentially
    ignoring optimization (Before scenario)
    """
    if not routes:
        return 0
        
    vehicle_count = 1
    current_load = 0
    
    for route in routes:
        qty = route.get('quantity', 0)
        
        # If current load + new qty exceeds capacity, start new vehicle
        if current_load + qty > max_capacity:
            vehicle_count += 1
            current_load = qty
        else:
            current_load += qty
            
    return vehicle_count

# ============================================
# MAIN OPTIMIZATION FUNCTION
# ============================================

def optimize_routes(routes: List[Dict]) -> Dict:
    """
    Main optimization function
    Returns comprehensive optimization results
    """
    
    if len(routes) < 2:
        return {
            "error": "At least 2 routes required for optimization",
            "routes": routes
        }
    
    # Step 1: Calculate metrics before optimization
    routes_before = routes.copy()
    vehicles_before = calculate_sequential_vehicles(routes_before, max_capacity=10)
    
    # Step 2: Determine optimal number of clusters based on TOTAL LOAD
    # "two vehicles one having 6 orders in it and the has 4 orders... first vehicle can takeover those 4 and make... 10"
    # This implies we want to consolidate into Min Vehicles possible.
    total_quantity = sum(r.get('quantity', 0) for r in routes)
    # Target capacity 10 per vehicle
    # Ideally num_clusters should be total_load / 10
    num_clusters = math.ceil(total_quantity / 10)
    if num_clusters < 1: num_clusters = 1
    
    # Perform Clustering
    if len(routes) <= num_clusters:
        # Not enough stops to cluster, just assign what we have
        clusters = simple_clustering(routes, len(routes))
    else:
        clusters = simple_clustering(routes, num_clusters)
    
    # Step 3: Optimize each cluster
    optimized_clusters = {}
    for cluster_id, cluster_routes in clusters.items():
        optimized_clusters[cluster_id] = nearest_neighbor_route(cluster_routes)
    
    # Step 4: Combine optimized routes
    routes_after = []
    for cluster_id in sorted(optimized_clusters.keys()):
        routes_after.extend(optimized_clusters[cluster_id])
    
    # Step 5: Assign vehicles
    vehicle_assignments = assign_vehicles(optimized_clusters)
    # Count total vehicles used after optimization
    # Since we clustered by capacity, ideally each cluster is 1 vehicle.
    # But assign_vehicles checks if they actually fit.
    vehicles_after = sum(v['vehicle_count_for_cluster'] for v in vehicle_assignments.values())
    
    # Step 6: Calculate metrics
    metrics = calculate_metrics(routes_before, routes_after)
    
    # Step 7: Prepare detailed results
    result = {
        "success": True,
        "optimizer": "Python K-means (Capacity Constrained) + Nearest Neighbor",
        "metrics": metrics,
        "clusters": {
            "count": len(clusters),
            "details": {
                str(cid): {
                    "routes": len(croutes),
                    "load": sum(r.get('quantity', 0) for r in croutes),
                    "optimized_order": [
                        f"({r['latitude']:.4f}, {r['longitude']:.4f})" 
                        for r in optimized_clusters[cid]
                    ]
                }
                for cid, croutes in clusters.items()
            }
        },
        "vehicles": vehicle_assignments, # Detailed assignments
        "vehicleCounts": { # Simple counts for comparison
            "before": vehicles_before,
            "after": vehicles_after,
            "improvement": round(((vehicles_before - vehicles_after) / vehicles_before * 100), 1) if vehicles_before > 0 else 0
        },
        "optimizedRoutes": routes_after,
        "totalPackages": total_quantity,
        "totalLocations": len(routes)
    }
    
    return result


# ============================================
# MAIN ENTRY POINT
# ============================================

def main():
    """Main entry point for command line usage"""
    
    try:
        # Read input from stdin (JSON format)
        input_data = sys.stdin.read()
        
        if not input_data:
            print(json.dumps({"error": "No input data provided"}))
            sys.exit(1)
        
        # Parse JSON input
        data = json.loads(input_data)
        routes = data.get('routes', [])
        
        if not routes:
            print(json.dumps({"error": "No routes provided"}))
            sys.exit(1)
        
        # Perform optimization
        result = optimize_routes(routes)
        
        # Output result as JSON
        print(json.dumps(result, indent=2))
        
    except json.JSONDecodeError as e:
        print(json.dumps({"error": f"Invalid JSON input: {str(e)}"}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"error": f"Optimization failed: {str(e)}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
