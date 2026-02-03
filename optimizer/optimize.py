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
    """
    # Vehicle types with capacities
    vehicles = [
        {"vehicleId": "VAN-001", "type": "Small Van", "capacity": 20},
        {"vehicleId": "VAN-002", "type": "Medium Van", "capacity": 50},
        {"vehicleId": "TRUCK-001", "type": "Large Truck", "capacity": 100}
    ]
    
    assignments = {}
    
    for cluster_id, cluster_routes in clusters.items():
        total_load = sum(route.get('quantity', 0) for route in cluster_routes)
        
        # Find smallest suitable vehicle
        suitable_vehicle = None
        for vehicle in sorted(vehicles, key=lambda v: v['capacity']):
            if vehicle['capacity'] >= total_load:
                suitable_vehicle = vehicle
                break
        
        if not suitable_vehicle:
            suitable_vehicle = vehicles[-1]  # Use largest if none fit
        
        assignments[cluster_id] = {
            "vehicle": suitable_vehicle['vehicleId'],
            "type": suitable_vehicle['type'],
            "capacity": suitable_vehicle['capacity'],
            "load": total_load,
            "utilization": round((total_load / suitable_vehicle['capacity']) * 100, 1)
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
    
    # Step 2: Perform clustering (if more than 5 routes)
    if len(routes) > 5:
        num_clusters = min(3, len(routes) // 3)
        clusters = simple_clustering(routes, num_clusters)
    else:
        clusters = {0: routes}
    
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
    
    # Step 6: Calculate metrics
    metrics = calculate_metrics(routes_before, routes_after)
    
    # Step 7: Prepare detailed results
    result = {
        "success": True,
        "optimizer": "Python K-means Clustering + Nearest Neighbor with Haversine Distance",
        "metrics": metrics,
        "clusters": {
            "count": len(clusters),
            "details": {
                str(cid): {
                    "routes": len(croutes),
                    "optimized_order": [
                        f"({r['latitude']:.4f}, {r['longitude']:.4f})" 
                        for r in optimized_clusters[cid]
                    ]
                }
                for cid, croutes in clusters.items()
            }
        },
        "vehicles": vehicle_assignments,
        "optimizedRoutes": routes_after,
        "totalPackages": sum(r.get('quantity', 0) for r in routes),
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
