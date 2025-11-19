#!/usr/bin/env python3
"""
SkySky Show Workflow Test Script
Tests the complete production workflow from episode creation to asset generation
"""

import asyncio
import httpx
import json
from datetime import datetime
from typing import Dict, Any


class SkySkyWorkflowTester:
    """Test the complete SkySky Show production workflow"""
    
    def __init__(self):
        self.base_url = "http://localhost:8000"
        self.marcus_url = "http://localhost:8001"
        self.giorgio_url = "http://localhost:8003"
        self.letitia_url = "http://localhost:8002"
        
        # Test episode data
        self.test_episode = {
            "title": "The Truth Shines Bright",
            "episode_number": 3,
            "theme": "Integrity",
            "tagline": "When you tell the truth, your light shines brightest."
        }
    
    async def test_episode_creation(self) -> Dict[str, Any]:
        """Test episode creation with Marcus"""
        print("🎬 Testing episode creation...")
        
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.marcus_url}/api/skysky/episodes",
                    json=self.test_episode,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    print(f"✅ Episode created: {data['data']['episode_id']}")
                    return data['data']
                else:
                    print(f"❌ Episode creation failed: {response.text}")
                    return {"success": False, "error": response.text}
                    
        except Exception as e:
            print(f"❌ Episode creation error: {e}")
            return {"success": False, "error": str(e)}
    
    async def test_asset_generation(self, episode_data: Dict[str, Any]) -> Dict[str, Any]:
        """Test asset generation with Giorgio"""
        print("🎨 Testing asset generation...")
        
        try:
            # Test individual generators
            generators = [
                ("midjourney", "image"),
                ("heygen", "video"), 
                ("elevenlabs", "audio"),
                ("suno", "music")
            ]
            
            results = {}
            
            for generator, asset_type in generators:
                print(f"  Testing {generator} ({asset_type})...")
                
                async with httpx.AsyncClient() as client:
                    # Test health check first
                    health_response = await client.get(f"{self.giorgio_url}/health")
                    if health_response.status_code == 200:
                        health_data = health_response.json()
                        configured = health_data.get('generators', {}).get(generator, False)
                        
                        if configured:
                            # Test generation
                            test_data = {
                                "scene_type": "intro",
                                "episode_id": episode_data.get('episode_id'),
                                "scene_number": 1,
                                "scene_name": "Direct-to-Camera Intro"
                            }
                            
                            if generator == "midjourney":
                                response = await client.post(
                                    f"{self.giorgio_url}/api/generate/midjourney",
                                    json=test_data,
                                    timeout=60.0
                                )
                            elif generator == "heygen":
                                response = await client.post(
                                    f"{self.giorgio_url}/api/generate/heygen",
                                    json=test_data,
                                    timeout=120.0
                                )
                            elif generator == "elevenlabs":
                                response = await client.post(
                                    f"{self.giorgio_url}/api/generate/elevenlabs",
                                    json={
                                        "character": "sky_sky",
                                        "text": "Hey friends… I need to tell you something.",
                                        "scene_context": "Direct-to-Camera Intro"
                                    },
                                    timeout=60.0
                                )
                            elif generator == "suno":
                                response = await client.post(
                                    f"{self.giorgio_url}/api/generate/suno",
                                    json={
                                        "scene_type": "intro",
                                        "episode_id": episode_data.get('episode_id'),
                                        "scene_number": 1
                                    },
                                    timeout=120.0
                                )
                            
                            if response.status_code == 200:
                                data = response.json()
                                if data.get('success'):
                                    print(f"    ✅ {generator} generation successful")
                                    results[generator] = data['data']
                                else:
                                    print(f"    ⚠️ {generator} generation failed: {data.get('message')}")
                                    results[generator] = {"success": False, "error": data.get('message')}
                            else:
                                print(f"    ❌ {generator} API error: {response.text}")
                                results[generator] = {"success": False, "error": response.text}
                        else:
                            print(f"    ⚠️ {generator} not configured (API key missing)")
                            results[generator] = {"success": False, "error": "Not configured"}
                    else:
                        print(f"    ❌ {generator} health check failed")
                        results[generator] = {"success": False, "error": "Health check failed"}
            
            return {"success": True, "results": results}
            
        except Exception as e:
            print(f"❌ Asset generation error: {e}")
            return {"success": False, "error": str(e)}
    
    async def test_batch_generation(self, episode_data: Dict[str, Any]) -> Dict[str, Any]:
        """Test batch asset generation for all scenes"""
        print("🎭 Testing batch asset generation...")
        
        try:
            # Prepare episode data with scenes
            batch_data = {
                "episode_id": episode_data.get('episode_id'),
                "scenes": [
                    {
                        "scene_number": 1,
                        "name": "Direct-to-Camera Intro",
                        "description": "School hallway, SkySky confesses guilt",
                        "scene_type": "intro"
                    },
                    {
                        "scene_number": 2,
                        "name": "Podcast Reflection",
                        "description": "Bedroom, bedtime podcast",
                        "scene_type": "reflection"
                    },
                    {
                        "scene_number": 3,
                        "name": "Imaginary Land",
                        "description": "Golden cloud meadow, meets Luma",
                        "scene_type": "imaginary_land"
                    },
                    {
                        "scene_number": 4,
                        "name": "Song Performance",
                        "description": "Full musical number",
                        "scene_type": "song_performance"
                    },
                    {
                        "scene_number": 5,
                        "name": "Real-World Resolution",
                        "description": "School hallway, confession & closure",
                        "scene_type": "resolution"
                    }
                ]
            }
            
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{self.giorgio_url}/api/generate/batch",
                    json=batch_data,
                    timeout=300.0  # 5 minutes for batch generation
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success'):
                        print(f"✅ Batch generation successful: {len(data['data']['generated_assets'])} assets")
                        return data['data']
                    else:
                        print(f"❌ Batch generation failed: {data.get('message')}")
                        return {"success": False, "error": data.get('message')}
                else:
                    print(f"❌ Batch generation API error: {response.text}")
                    return {"success": False, "error": response.text}
                    
        except Exception as e:
            print(f"❌ Batch generation error: {e}")
            return {"success": False, "error": str(e)}
    
    async def test_resolve_integration(self, episode_data: Dict[str, Any]) -> Dict[str, Any]:
        """Test DaVinci Resolve integration"""
        print("🎬 Testing Resolve integration...")
        
        try:
            async with httpx.AsyncClient() as client:
                # Test Resolve project creation
                project_data = {
                    "project_name": f"EP{episode_data.get('episode_id', 'unknown')[:8]}_SkySkyShow",
                    "project_path": episode_data.get('folder_path', '/tmp')
                }
                
                response = await client.post(
                    f"{self.marcus_url}/api/skysky/resolve/create",
                    json=project_data,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success'):
                        print("✅ Resolve project creation successful")
                        return data['data']
                    else:
                        print(f"⚠️ Resolve project creation failed: {data.get('message')}")
                        return {"success": False, "error": data.get('message')}
                else:
                    print(f"❌ Resolve API error: {response.text}")
                    return {"success": False, "error": response.text}
                    
        except Exception as e:
            print(f"❌ Resolve integration error: {e}")
            return {"success": False, "error": str(e)}
    
    async def test_health_checks(self) -> Dict[str, Any]:
        """Test all service health checks"""
        print("🏥 Testing service health checks...")
        
        services = [
            ("Hub", "http://localhost:8000/health"),
            ("Marcus", "http://localhost:8001/health"),
            ("Letitia", "http://localhost:8002/health"),
            ("Giorgio", "http://localhost:8003/health")
        ]
        
        results = {}
        
        for service_name, url in services:
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.get(url, timeout=10.0)
                    if response.status_code == 200:
                        data = response.json()
                        print(f"  ✅ {service_name}: {data.get('status', 'unknown')}")
                        results[service_name] = {"status": "healthy", "data": data}
                    else:
                        print(f"  ❌ {service_name}: HTTP {response.status_code}")
                        results[service_name] = {"status": "unhealthy", "error": f"HTTP {response.status_code}"}
            except Exception as e:
                print(f"  ❌ {service_name}: {e}")
                results[service_name] = {"status": "unreachable", "error": str(e)}
        
        return results
    
    async def run_full_test(self) -> Dict[str, Any]:
        """Run the complete SkySky Show workflow test"""
        print("🚀 Starting SkySky Show Workflow Test")
        print("=" * 50)
        
        test_results = {
            "timestamp": datetime.utcnow().isoformat(),
            "tests": {}
        }
        
        # Test 1: Health checks
        print("\n1. Service Health Checks")
        print("-" * 30)
        health_results = await self.test_health_checks()
        test_results["tests"]["health_checks"] = health_results
        
        # Test 2: Episode creation
        print("\n2. Episode Creation")
        print("-" * 30)
        episode_data = await self.test_episode_creation()
        test_results["tests"]["episode_creation"] = episode_data
        
        if not episode_data.get('success', True):
            print("❌ Episode creation failed, stopping tests")
            return test_results
        
        # Test 3: Individual asset generation
        print("\n3. Individual Asset Generation")
        print("-" * 30)
        asset_results = await self.test_asset_generation(episode_data)
        test_results["tests"]["asset_generation"] = asset_results
        
        # Test 4: Batch asset generation
        print("\n4. Batch Asset Generation")
        print("-" * 30)
        batch_results = await self.test_batch_generation(episode_data)
        test_results["tests"]["batch_generation"] = batch_results
        
        # Test 5: Resolve integration
        print("\n5. Resolve Integration")
        print("-" * 30)
        resolve_results = await self.test_resolve_integration(episode_data)
        test_results["tests"]["resolve_integration"] = resolve_results
        
        # Summary
        print("\n" + "=" * 50)
        print("🎯 Test Summary")
        print("=" * 50)
        
        total_tests = len(test_results["tests"])
        passed_tests = 0
        
        for test_name, test_data in test_results["tests"].items():
            if isinstance(test_data, dict) and test_data.get('success', True):
                passed_tests += 1
                print(f"✅ {test_name}")
            else:
                print(f"❌ {test_name}")
        
        print(f"\nPassed: {passed_tests}/{total_tests} tests")
        
        if passed_tests == total_tests:
            print("🎉 All tests passed! SkySky Show workflow is ready.")
        else:
            print("⚠️ Some tests failed. Check the logs above for details.")
        
        return test_results


async def main():
    """Main test function"""
    tester = SkySkyWorkflowTester()
    results = await tester.run_full_test()
    
    # Save results to file
    with open('skysky_test_results.json', 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📄 Test results saved to: skysky_test_results.json")


if __name__ == "__main__":
    asyncio.run(main())


