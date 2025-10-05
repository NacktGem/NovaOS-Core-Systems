"""Advanced forensics and OSINT integration for Glitch Agent."""

import asyncio
import json
import os
import subprocess
import tempfile
import hashlib
from pathlib import Path
from typing import Dict, List, Any, Optional, Union
from datetime import datetime, timezone

from agents.common.alog import info, warn, error


class ForensicsToolkit:
    """Comprehensive forensics toolkit integrating open-source tools."""

    def __init__(self):
        self.tools_available = self._check_tools()
        self.temp_dir = Path(tempfile.mkdtemp(prefix="glitch_forensics_"))
        self.reports_dir = self.temp_dir / "reports"
        self.reports_dir.mkdir(exist_ok=True)

        # Jailbreak database
        self.jailbreak_db = self._init_jailbreak_db()

        # OSINT data sources
        self.osint_sources = self._init_osint_sources()

    def _check_tools(self) -> Dict[str, bool]:
        """Check availability of forensic tools."""
        tools = {
            # Core forensics
            'autopsy': self._tool_exists('autopsy'),
            'volatility3': self._tool_exists('vol.py') or self._tool_exists('volatility3'),
            'sleuthkit': self._tool_exists('mmls') and self._tool_exists('fls'),
            'plaso': self._tool_exists('log2timeline.py'),
            # Memory analysis
            'rekall': self._tool_exists('rekall'),
            'memoryze': self._tool_exists('memoryze'),
            # Network forensics
            'wireshark': self._tool_exists('tshark'),
            'tcpdump': self._tool_exists('tcpdump'),
            'ngrep': self._tool_exists('ngrep'),
            # Mobile forensics
            'libimobiledevice': self._tool_exists('ideviceinfo'),
            'adb': self._tool_exists('adb'),
            'andriller': self._tool_exists('andriller'),
            # General utilities
            'binwalk': self._tool_exists('binwalk'),
            'foremost': self._tool_exists('foremost'),
            'scalpel': self._tool_exists('scalpel'),
            'strings': self._tool_exists('strings'),
            'hexdump': self._tool_exists('hexdump'),
            'file': self._tool_exists('file'),
            'exiftool': self._tool_exists('exiftool'),
            # OSINT tools
            'spiderfoot': self._tool_exists('sf.py'),
            'sherlock': self._tool_exists('sherlock'),
            'maigret': self._tool_exists('maigret'),
            'photon': self._tool_exists('photon.py'),
            'theHarvester': self._tool_exists('theHarvester.py'),
            # Jailbreak/Root
            'checkra1n': self._tool_exists('checkra1n'),
            'palera1n': self._tool_exists('palera1n'),
            'unc0ver': self._check_file_exists('/Applications/Cydia Impactor.app'),
        }
        return tools

    def _tool_exists(self, tool_name: str) -> bool:
        """Check if a tool exists in PATH."""
        try:
            result = subprocess.run(
                ['which', tool_name], capture_output=True, check=True, timeout=5
            )
            return result.returncode == 0
        except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError):
            return False

    def _check_file_exists(self, file_path: str) -> bool:
        """Check if a specific file exists."""
        return Path(file_path).exists()

    def _init_jailbreak_db(self) -> Dict[str, Any]:
        """Initialize jailbreak database."""
        return {
            'ios': {
                'checkra1n': {
                    'versions': ['12.0', '12.1', '12.2', '12.3', '12.4', '13.0-14.8.1'],
                    'devices': ['A6-A11'],
                    'type': 'semi-tethered',
                    'exploit': 'bootrom',
                },
                'palera1n': {
                    'versions': ['15.0-17.0'],
                    'devices': ['A8-A11'],
                    'type': 'semi-tethered',
                    'exploit': 'checkra1n-based',
                },
                'unc0ver': {
                    'versions': ['11.0-16.6.1'],
                    'devices': ['A7-A16'],
                    'type': 'semi-untethered',
                    'exploit': 'multiple',
                },
                'dopamine': {
                    'versions': ['15.0-16.6.1'],
                    'devices': ['A12+'],
                    'type': 'rootless',
                    'exploit': 'fugu15-based',
                },
            },
            'android': {
                'magisk': {
                    'versions': ['5.0+'],
                    'devices': ['universal'],
                    'type': 'systemless',
                    'method': 'boot.img patch',
                },
                'supersu': {
                    'versions': ['4.4-9.0'],
                    'devices': ['universal'],
                    'type': 'system',
                    'method': 'recovery flash',
                },
                'kingroot': {
                    'versions': ['4.2.2-7.0'],
                    'devices': ['universal'],
                    'type': 'one-click',
                    'method': 'exploit',
                },
            },
        }

    def _init_osint_sources(self) -> Dict[str, Any]:
        """Initialize OSINT data sources."""
        return {
            'search_engines': [
                'google.com',
                'bing.com',
                'duckduckgo.com',
                'yandex.com',
                'baidu.com',
            ],
            'social_media': [
                'twitter.com',
                'facebook.com',
                'linkedin.com',
                'instagram.com',
                'tiktok.com',
                'reddit.com',
                'github.com',
            ],
            'darknet_search': [
                'ahmia.fi',
                'tor66.com',
                'onion.live',
                'dark.fail',
                'dread (manual)',
            ],
            'breach_databases': ['haveibeenpwned.com', 'dehashed.com', 'intelx.io', 'leakcheck.io'],
            'threat_intel': [
                'virustotal.com',
                'urlvoid.com',
                'abuse.ch',
                'otx.alienvault.com',
                'shodan.io',
            ],
        }

    async def analyze_disk_image(self, image_path: str) -> Dict[str, Any]:
        """Analyze disk image using multiple forensic tools."""
        results = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'image_path': image_path,
            'tools_used': [],
            'findings': [],
            'timeline': [],
            'hash_analysis': {},
            'file_recovery': [],
        }

        # Basic file analysis
        if self.tools_available.get('file'):
            try:
                result = subprocess.run(
                    ['file', image_path], capture_output=True, text=True, timeout=30
                )
                results['file_type'] = result.stdout.strip()
                results['tools_used'].append('file')
            except subprocess.TimeoutExpired:
                results['findings'].append({'type': 'error', 'message': 'File analysis timed out'})

        # Hash analysis
        if Path(image_path).exists():
            with open(image_path, 'rb') as f:
                data = f.read(8192)  # Read first 8KB for quick hash
                results['hash_analysis'] = {
                    'md5': hashlib.md5(data).hexdigest(),
                    'sha1': hashlib.sha1(data).hexdigest(),
                    'sha256': hashlib.sha256(data).hexdigest(),
                }

        # Sleuth Kit analysis
        if self.tools_available.get('sleuthkit'):
            try:
                # Partition analysis
                mmls_result = subprocess.run(
                    ['mmls', image_path], capture_output=True, text=True, timeout=60
                )
                if mmls_result.returncode == 0:
                    results['partitions'] = mmls_result.stdout
                    results['tools_used'].append('mmls')

                # File system analysis
                fls_result = subprocess.run(
                    ['fls', '-r', image_path], capture_output=True, text=True, timeout=120
                )
                if fls_result.returncode == 0:
                    results['filesystem'] = fls_result.stdout[:10000]  # Limit output
                    results['tools_used'].append('fls')

            except subprocess.TimeoutExpired:
                results['findings'].append(
                    {'type': 'error', 'message': 'Sleuth Kit analysis timed out'}
                )

        # Binwalk analysis for embedded files
        if self.tools_available.get('binwalk'):
            try:
                binwalk_result = subprocess.run(
                    ['binwalk', '-e', image_path], capture_output=True, text=True, timeout=180
                )
                if binwalk_result.returncode == 0:
                    results['embedded_files'] = binwalk_result.stdout
                    results['tools_used'].append('binwalk')
            except subprocess.TimeoutExpired:
                results['findings'].append(
                    {'type': 'error', 'message': 'Binwalk analysis timed out'}
                )

        return results

    async def analyze_memory_dump(self, dump_path: str) -> Dict[str, Any]:
        """Analyze memory dump using Volatility."""
        results = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'dump_path': dump_path,
            'profile': None,
            'processes': [],
            'network_connections': [],
            'registry_analysis': [],
            'malware_indicators': [],
        }

        if not self.tools_available.get('volatility3'):
            results['error'] = 'Volatility not available'
            return results

        try:
            # Determine OS profile
            profile_result = subprocess.run(
                ['vol.py', '-f', dump_path, 'windows.info'],
                capture_output=True,
                text=True,
                timeout=300,
            )

            if profile_result.returncode == 0:
                results['profile'] = profile_result.stdout[:1000]

                # Process analysis
                pslist_result = subprocess.run(
                    ['vol.py', '-f', dump_path, 'windows.pslist'],
                    capture_output=True,
                    text=True,
                    timeout=300,
                )
                if pslist_result.returncode == 0:
                    results['processes'] = pslist_result.stdout[:5000]

                # Network connections
                netscan_result = subprocess.run(
                    ['vol.py', '-f', dump_path, 'windows.netscan'],
                    capture_output=True,
                    text=True,
                    timeout=300,
                )
                if netscan_result.returncode == 0:
                    results['network_connections'] = netscan_result.stdout[:3000]

                # Malware detection
                malfind_result = subprocess.run(
                    ['vol.py', '-f', dump_path, 'windows.malfind'],
                    capture_output=True,
                    text=True,
                    timeout=300,
                )
                if malfind_result.returncode == 0:
                    results['malware_indicators'] = malfind_result.stdout[:3000]

        except subprocess.TimeoutExpired:
            results['error'] = 'Memory analysis timed out'
        except Exception as e:
            results['error'] = f'Memory analysis failed: {str(e)}'

        return results

    async def mobile_device_analysis(self, device_type: str = 'auto') -> Dict[str, Any]:
        """Analyze connected mobile devices."""
        results = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'devices_found': [],
            'ios_devices': [],
            'android_devices': [],
            'analysis_results': [],
        }

        # iOS device detection
        if self.tools_available.get('libimobiledevice'):
            try:
                ios_result = subprocess.run(
                    ['idevice_id', '-l'], capture_output=True, text=True, timeout=30
                )
                if ios_result.returncode == 0 and ios_result.stdout.strip():
                    ios_devices = [
                        d.strip() for d in ios_result.stdout.strip().split('\n') if d.strip()
                    ]
                    results['ios_devices'] = ios_devices

                    for device_id in ios_devices:
                        info_result = subprocess.run(
                            ['ideviceinfo', '-u', device_id],
                            capture_output=True,
                            text=True,
                            timeout=60,
                        )
                        if info_result.returncode == 0:
                            results['analysis_results'].append(
                                {
                                    'device_id': device_id,
                                    'type': 'ios',
                                    'info': info_result.stdout[:2000],
                                    'jailbreak_status': await self._check_ios_jailbreak(device_id),
                                }
                            )
            except subprocess.TimeoutExpired:
                results['error'] = 'iOS device analysis timed out'

        # Android device detection
        if self.tools_available.get('adb'):
            try:
                android_result = subprocess.run(
                    ['adb', 'devices'], capture_output=True, text=True, timeout=30
                )
                if android_result.returncode == 0:
                    lines = android_result.stdout.strip().split('\n')[1:]  # Skip header
                    android_devices = [line.split()[0] for line in lines if 'device' in line]
                    results['android_devices'] = android_devices

                    for device_id in android_devices:
                        # Get device info
                        info_result = subprocess.run(
                            ['adb', '-s', device_id, 'shell', 'getprop'],
                            capture_output=True,
                            text=True,
                            timeout=60,
                        )
                        if info_result.returncode == 0:
                            results['analysis_results'].append(
                                {
                                    'device_id': device_id,
                                    'type': 'android',
                                    'properties': info_result.stdout[:2000],
                                    'root_status': await self._check_android_root(device_id),
                                }
                            )
            except subprocess.TimeoutExpired:
                results['error'] = 'Android device analysis timed out'

        return results

    async def _check_ios_jailbreak(self, device_id: str) -> Dict[str, Any]:
        """Check if iOS device is jailbroken."""
        jailbreak_indicators = [
            '/Applications/Cydia.app',
            '/usr/bin/ssh',
            '/etc/apt/sources.list',
            '/private/var/mobile/Library/Caches/com.saurik.Cydia',
            '/private/var/lib/cydia',
            '/usr/bin/cycript',
            '/usr/local/bin/cycript',
            '/usr/lib/libcycript.dylib',
        ]

        results = {
            'jailbroken': False,
            'indicators_found': [],
            'jailbreak_method': None,
            'confidence': 0,
        }

        for indicator in jailbreak_indicators:
            try:
                check_result = subprocess.run(
                    ['idevicefs', '-u', device_id, 'ls', indicator],
                    capture_output=True,
                    text=True,
                    timeout=30,
                )
                if check_result.returncode == 0:
                    results['indicators_found'].append(indicator)
                    results['jailbroken'] = True
            except (subprocess.TimeoutExpired, subprocess.CalledProcessError):
                continue

        # Calculate confidence
        if results['indicators_found']:
            results['confidence'] = min(100, len(results['indicators_found']) * 20)

        return results

    async def _check_android_root(self, device_id: str) -> Dict[str, Any]:
        """Check if Android device is rooted."""
        root_indicators = [
            '/system/bin/su',
            '/system/xbin/su',
            '/sbin/su',
            '/system/app/Superuser.apk',
            '/system/app/SuperSU.apk',
            '/system/app/Magisk.apk',
        ]

        results = {'rooted': False, 'indicators_found': [], 'root_method': None, 'confidence': 0}

        for indicator in root_indicators:
            try:
                check_result = subprocess.run(
                    ['adb', '-s', device_id, 'shell', 'ls', indicator],
                    capture_output=True,
                    text=True,
                    timeout=30,
                )
                if check_result.returncode == 0 and 'No such file' not in check_result.stderr:
                    results['indicators_found'].append(indicator)
                    results['rooted'] = True

                    # Determine root method
                    if 'su' in indicator:
                        results['root_method'] = 'Traditional su'
                    elif 'SuperSU' in indicator:
                        results['root_method'] = 'SuperSU'
                    elif 'Magisk' in indicator:
                        results['root_method'] = 'Magisk'

            except (subprocess.TimeoutExpired, subprocess.CalledProcessError):
                continue

        # Calculate confidence
        if results['indicators_found']:
            results['confidence'] = min(100, len(results['indicators_found']) * 25)

        return results

    async def osint_investigation(
        self, target: str, investigation_type: str = 'comprehensive'
    ) -> Dict[str, Any]:
        """Conduct OSINT investigation on target."""
        results = {
            'timestamp': datetime.now(timezone.utc).isoformat(),
            'target': target,
            'investigation_type': investigation_type,
            'social_media': {},
            'domain_analysis': {},
            'breach_data': {},
            'threat_intelligence': {},
            'darknet_mentions': [],
        }

        # Sherlock - Username search across social media
        if self.tools_available.get('sherlock') and investigation_type in [
            'comprehensive',
            'social',
        ]:
            try:
                sherlock_result = subprocess.run(
                    ['sherlock', target], capture_output=True, text=True, timeout=300
                )
                if sherlock_result.returncode == 0:
                    results['social_media']['sherlock'] = sherlock_result.stdout[:3000]
            except subprocess.TimeoutExpired:
                results['social_media']['sherlock_error'] = 'Analysis timed out'

        # TheHarvester - Email and subdomain enumeration
        if self.tools_available.get('theHarvester') and investigation_type in [
            'comprehensive',
            'domain',
        ]:
            try:
                harvester_result = subprocess.run(
                    ['theHarvester', '-d', target, '-b', 'google,bing'],
                    capture_output=True,
                    text=True,
                    timeout=300,
                )
                if harvester_result.returncode == 0:
                    results['domain_analysis']['harvester'] = harvester_result.stdout[:3000]
            except subprocess.TimeoutExpired:
                results['domain_analysis']['harvester_error'] = 'Analysis timed out'

        # SpiderFoot - Comprehensive OSINT
        if self.tools_available.get('spiderfoot') and investigation_type == 'comprehensive':
            try:
                # Note: SpiderFoot requires a running instance, this is a placeholder
                results['comprehensive_analysis'] = 'SpiderFoot analysis requires setup'
            except Exception as e:
                results['spiderfoot_error'] = str(e)

        return results

    def generate_forensics_report(self, analysis_results: List[Dict[str, Any]]) -> str:
        """Generate comprehensive forensics report."""
        report_path = (
            self.reports_dir / f"forensics_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        )

        report = {
            'report_metadata': {
                'generated_at': datetime.now(timezone.utc).isoformat(),
                'glitch_agent_version': '2.0',
                'tools_available': self.tools_available,
                'analysis_count': len(analysis_results),
            },
            'executive_summary': self._generate_executive_summary(analysis_results),
            'detailed_findings': analysis_results,
            'recommendations': self._generate_recommendations(analysis_results),
            'indicators_of_compromise': self._extract_iocs(analysis_results),
        }

        with open(report_path, 'w') as f:
            json.dump(report, f, indent=2)

        return str(report_path)

    def _generate_executive_summary(self, results: List[Dict[str, Any]]) -> str:
        """Generate executive summary of findings."""
        summary_parts = []

        for result in results:
            if 'malware_indicators' in result and result['malware_indicators']:
                summary_parts.append("⚠️  Malware indicators detected")
            if 'jailbroken' in result and result.get('jailbroken'):
                summary_parts.append("📱 Jailbroken/Rooted device detected")
            if 'breach_data' in result and result['breach_data']:
                summary_parts.append("💀 Breach data found")

        if not summary_parts:
            return "✅ No immediate security concerns identified"

        return " | ".join(summary_parts)

    def _generate_recommendations(self, results: List[Dict[str, Any]]) -> List[str]:
        """Generate security recommendations."""
        recommendations = []

        for result in results:
            if 'jailbroken' in result and result.get('jailbroken'):
                recommendations.append("Consider removing jailbreak/root for enhanced security")
            if 'malware_indicators' in result and result['malware_indicators']:
                recommendations.append("Immediate malware remediation required")
            if 'network_connections' in result:
                recommendations.append("Review network connections for suspicious activity")

        return recommendations

    def _extract_iocs(self, results: List[Dict[str, Any]]) -> Dict[str, List[str]]:
        """Extract indicators of compromise."""
        iocs = {
            'suspicious_processes': [],
            'suspicious_network': [],
            'suspicious_files': [],
            'registry_modifications': [],
        }

        for result in results:
            if 'processes' in result and result['processes']:
                # Extract suspicious process names (simplified)
                suspicious_keywords = ['backdoor', 'trojan', 'malware', 'hack']
                for keyword in suspicious_keywords:
                    if keyword in result['processes'].lower():
                        iocs['suspicious_processes'].append(f"Process containing '{keyword}'")

        return iocs

    def cleanup(self):
        """Clean up temporary files."""
        import shutil

        if self.temp_dir.exists():
            shutil.rmtree(self.temp_dir)


class AdvancedForensics:
    """Advanced Forensics integration for Glitch Agent."""

    def __init__(self):
        self.toolkit = ForensicsToolkit()
        self.operations = {
            'mobile_analysis': self.mobile_analysis,
            'memory_analysis': self.memory_analysis,
            'disk_analysis': self.disk_analysis,
            'osint_investigation': self.osint_investigation,
            'malware_analysis': self.malware_analysis,
            'network_forensics': self.network_forensics,
            'jailbreak_detection': self.jailbreak_detection,
            'comprehensive_analysis': self.comprehensive_analysis,
        }

    def run_forensics_operation(self, operation: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """Run a forensics operation with error handling."""
        try:
            if operation not in self.operations:
                return {
                    "success": False,
                    "error": f"Unknown forensics operation: {operation}",
                    "available_operations": list(self.operations.keys()),
                }

            result = self.operations[operation](args)
            return {"success": True, "output": result, "error": None}

        except Exception as e:
            error(f"forensics.{operation}", {"error": str(e), "args": args})
            return {"success": False, "output": None, "error": str(e)}

    def mobile_analysis(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze mobile device for forensics evidence."""
        device_type = args.get('device_type', 'android')
        device_id = args.get('device_id', '')

        return self.toolkit.analyze_mobile_device(device_type, device_id)

    def memory_analysis(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze memory dump for forensics evidence."""
        memory_dump_path = args.get('memory_dump', '')
        profile = args.get('profile', 'Win10x64_19041')

        if not memory_dump_path:
            return {"error": "memory_dump path required"}

        return self.toolkit.analyze_memory_dump(memory_dump_path, profile)

    def disk_analysis(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze disk image for forensics evidence."""
        disk_image_path = args.get('disk_image', '')

        if not disk_image_path:
            return {"error": "disk_image path required"}

        return self.toolkit.analyze_disk_image(disk_image_path)

    def osint_investigation(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Conduct OSINT investigation."""
        target = args.get('target', '')
        investigation_type = args.get('type', 'comprehensive')

        if not target:
            return {"error": "target required for OSINT investigation"}

        return self.toolkit.osint_investigation(target, investigation_type)

    def malware_analysis(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze malware sample."""
        sample_path = args.get('sample', '')
        analysis_type = args.get('type', 'static')

        if not sample_path:
            return {"error": "sample path required"}

        return self.toolkit.analyze_malware_sample(sample_path, analysis_type)

    def network_forensics(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze network traffic capture."""
        pcap_path = args.get('pcap', '')

        if not pcap_path:
            return {"error": "pcap path required"}

        return self.toolkit.analyze_network_traffic(pcap_path)

    def jailbreak_detection(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Detect jailbreak/root status on mobile devices."""
        device_type = args.get('device_type', 'ios')
        device_id = args.get('device_id', '')

        return self.toolkit.detect_jailbreak_status(device_type, device_id)

    def comprehensive_analysis(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Run comprehensive forensics analysis."""
        target_path = args.get('target', '')

        if not target_path:
            return {"error": "target path required"}

        return self.toolkit.comprehensive_forensics_analysis(target_path)

    def cleanup(self):
        """Clean up resources."""
        self.toolkit.cleanup()
