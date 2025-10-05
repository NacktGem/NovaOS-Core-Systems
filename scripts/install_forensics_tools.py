#!/usr/bin/env python3
"""
Advanced Forensics OSS Tools Installation Script
Installs and configures comprehensive forensics, mobile analysis, and OSINT tools
"""

import os
import sys
import subprocess
import platform
import urllib.request
import zipfile
import tarfile
import shutil
from pathlib import Path
from typing import List, Dict, Any


class ForensicsInstaller:
    def __init__(self):
        self.system = platform.system().lower()
        self.arch = platform.machine().lower()
        self.tools_dir = Path.home() / ".novaos" / "forensics-tools"
        self.tools_dir.mkdir(parents=True, exist_ok=True)

        # Tool configurations
        self.tools = {
            "autopsy": {
                "name": "The Sleuth Kit / Autopsy",
                "url": "https://github.com/sleuthkit/sleuthkit/releases/latest",
                "type": "system_package",
                "packages": ["sleuthkit", "autopsy"] if self.system == "linux" else ["sleuthkit"],
            },
            "volatility": {
                "name": "Volatility Framework",
                "url": "https://github.com/volatilityfoundation/volatility3.git",
                "type": "git_python",
                "pip_name": "volatility3",
            },
            "yara": {
                "name": "YARA Malware Analysis",
                "packages": ["yara", "python3-yara"] if self.system == "linux" else ["yara"],
                "type": "system_package",
            },
            "frida": {
                "name": "Frida Dynamic Analysis",
                "type": "pip",
                "packages": ["frida-tools", "frida"],
            },
            "sherlock": {
                "name": "Sherlock OSINT Username Search",
                "url": "https://github.com/sherlock-project/sherlock.git",
                "type": "git_python",
            },
            "theharvester": {
                "name": "TheHarvester OSINT",
                "url": "https://github.com/laramies/theHarvester.git",
                "type": "git_python",
            },
            "mobile_tools": {
                "name": "Mobile Forensics Tools",
                "type": "pip",
                "packages": ["adb-shell", "pyidevice", "pymobiledevice3"],
            },
            "checkra1n": {
                "name": "Checkra1n iOS Jailbreak Tool",
                "url": "https://checkra.in/assets/downloads/linux/cli/x86_64/dac9968939ea6e6bfbdedeb41d7e2579c4711dc2c5083f91dced66ca397dc51d/checkra1n",
                "type": "binary",
                "platforms": ["linux"],
            },
        }

    def log(self, message: str, level: str = "INFO"):
        """Log installation progress"""
        colors = {
            "INFO": "\033[94m",
            "SUCCESS": "\033[92m",
            "WARNING": "\033[93m",
            "ERROR": "\033[91m",
            "ENDC": "\033[0m",
        }
        print(f"{colors.get(level, '')}{level}: {message}{colors['ENDC']}")

    def run_command(self, cmd: List[str], cwd: Path = None) -> bool:
        """Run system command with error handling"""
        try:
            result = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, check=True)
            return True
        except subprocess.CalledProcessError as e:
            self.log(f"Command failed: {' '.join(cmd)}", "ERROR")
            self.log(f"Error: {e.stderr}", "ERROR")
            return False
        except FileNotFoundError:
            self.log(f"Command not found: {cmd[0]}", "ERROR")
            return False

    def install_system_packages(self, packages: List[str]) -> bool:
        """Install system packages based on OS"""
        if self.system == "linux":
            # Try different package managers
            managers = [
                (["apt", "update"], ["apt", "install", "-y"]),
                (["yum", "update"], ["yum", "install", "-y"]),
                (["pacman", "-Sy"], ["pacman", "-S", "--noconfirm"]),
            ]

            for update_cmd, install_cmd in managers:
                if shutil.which(update_cmd[0]):
                    self.log(f"Updating package database with {update_cmd[0]}")
                    self.run_command(update_cmd)

                    self.log(f"Installing {packages} with {install_cmd[0]}")
                    return self.run_command(install_cmd + packages)

        elif self.system == "darwin":  # macOS
            if shutil.which("brew"):
                self.log("Installing packages with Homebrew")
                return self.run_command(["brew", "install"] + packages)

        elif self.system == "windows":
            if shutil.which("choco"):
                self.log("Installing packages with Chocolatey")
                return self.run_command(["choco", "install"] + packages)

        self.log(f"No suitable package manager found for {self.system}", "WARNING")
        return False

    def install_pip_packages(self, packages: List[str]) -> bool:
        """Install Python packages via pip"""
        self.log(f"Installing Python packages: {packages}")
        return self.run_command([sys.executable, "-m", "pip", "install"] + packages)

    def clone_git_repo(self, url: str, name: str) -> Path:
        """Clone git repository"""
        repo_dir = self.tools_dir / name

        if repo_dir.exists():
            self.log(f"Repository {name} already exists, updating...")
            if self.run_command(["git", "pull"], cwd=repo_dir):
                return repo_dir
        else:
            self.log(f"Cloning {name} from {url}")
            if self.run_command(["git", "clone", url, str(repo_dir)]):
                return repo_dir

        return None

    def download_binary(self, url: str, name: str) -> Path:
        """Download binary tool"""
        binary_path = self.tools_dir / name

        if binary_path.exists():
            self.log(f"Binary {name} already exists")
            return binary_path

        try:
            self.log(f"Downloading {name} from {url}")
            urllib.request.urlretrieve(url, binary_path)
            binary_path.chmod(0o755)  # Make executable
            return binary_path
        except Exception as e:
            self.log(f"Failed to download {name}: {e}", "ERROR")
            return None

    def setup_volatility_profiles(self):
        """Set up Volatility memory profiles"""
        profiles_dir = self.tools_dir / "volatility-profiles"
        profiles_dir.mkdir(exist_ok=True)

        # Common profiles
        profiles = [
            "https://github.com/volatilityfoundation/profiles/raw/master/Linux/Ubuntu/x64/Ubuntu1404x64.zip",
            "https://github.com/volatilityfoundation/profiles/raw/master/Linux/CentOS/x64/CentOS7x64.zip",
        ]

        for profile_url in profiles:
            profile_name = profile_url.split('/')[-1]
            profile_path = profiles_dir / profile_name

            if not profile_path.exists():
                try:
                    urllib.request.urlretrieve(profile_url, profile_path)
                    self.log(f"Downloaded Volatility profile: {profile_name}")
                except:
                    pass  # Profiles are optional

    def setup_yara_rules(self):
        """Set up YARA malware detection rules"""
        rules_dir = self.tools_dir / "yara-rules"

        # Clone popular rule repositories
        rule_repos = [
            ("https://github.com/Yara-Rules/rules.git", "yara-community-rules"),
            ("https://github.com/Neo23x0/signature-base.git", "signature-base"),
            ("https://github.com/reversinglabs/reversinglabs-yara-rules.git", "rl-rules"),
        ]

        for repo_url, repo_name in rule_repos:
            repo_path = self.clone_git_repo(repo_url, f"yara-rules/{repo_name}")
            if repo_path:
                self.log(f"YARA rules installed: {repo_name}")

    def install_mobile_forensics_deps(self):
        """Install mobile forensics dependencies"""
        # Install ADB (Android Debug Bridge)
        if self.system == "linux":
            self.install_system_packages(["android-tools-adb", "android-tools-fastboot"])
        elif self.system == "darwin":
            self.run_command(["brew", "install", "android-platform-tools"])
        elif self.system == "windows":
            self.run_command(["choco", "install", "adb"])

        # Install libimobiledevice (iOS tools)
        if self.system == "linux":
            self.install_system_packages(["libimobiledevice-utils", "usbmuxd"])
        elif self.system == "darwin":
            self.run_command(["brew", "install", "libimobiledevice", "usbmuxd"])

    def create_tool_wrappers(self):
        """Create wrapper scripts for easy tool access"""
        wrapper_dir = self.tools_dir / "bin"
        wrapper_dir.mkdir(exist_ok=True)

        # Forensics launcher script
        launcher_script = wrapper_dir / "novaos-forensics"
        launcher_content = f'''#!/usr/bin/env python3
"""NovaOS Forensics Tool Launcher"""
import sys
import os
sys.path.insert(0, "{self.tools_dir}")

from advanced_forensics import AdvancedForensics

if __name__ == "__main__":
    forensics = AdvancedForensics()
    if len(sys.argv) < 2:
        print("Usage: novaos-forensics <operation> [args...]")
        print("Operations: mobile_analysis, memory_analysis, disk_analysis, osint_investigation, malware_analysis")
        sys.exit(1)
    
    operation = sys.argv[1]
    args = {{"target": sys.argv[2] if len(sys.argv) > 2 else ""}}
    
    result = forensics.run_forensics_operation(operation, args)
    print(result)
'''

        launcher_script.write_text(launcher_content)
        launcher_script.chmod(0o755)

        self.log(f"Created forensics launcher: {launcher_script}")

    def validate_installation(self) -> Dict[str, bool]:
        """Validate that all tools are properly installed"""
        validation_results = {}

        # Check Python packages
        python_tools = ["volatility3", "yara-python", "frida-tools"]
        for tool in python_tools:
            try:
                __import__(tool.replace('-', '_'))
                validation_results[tool] = True
            except ImportError:
                validation_results[tool] = False

        # Check system binaries
        system_tools = ["yara", "adb"]
        for tool in system_tools:
            validation_results[tool] = bool(shutil.which(tool))

        # Check directories
        directories = ["sherlock", "theharvester", "yara-rules"]
        for dir_name in directories:
            validation_results[dir_name] = (self.tools_dir / dir_name).exists()

        return validation_results

    def install_all(self):
        """Install all forensics tools"""
        self.log("Starting NovaOS Advanced Forensics Installation", "SUCCESS")
        self.log(f"System: {self.system} ({self.arch})")
        self.log(f"Tools directory: {self.tools_dir}")

        # Install each tool
        for tool_id, config in self.tools.items():
            self.log(f"Installing {config['name']}...")

            if config["type"] == "system_package":
                if "packages" in config:
                    self.install_system_packages(config["packages"])

            elif config["type"] == "pip":
                if "packages" in config:
                    self.install_pip_packages(config["packages"])

            elif config["type"] == "git_python":
                if "url" in config:
                    repo_path = self.clone_git_repo(config["url"], tool_id)
                    if repo_path and (repo_path / "requirements.txt").exists():
                        self.run_command(
                            [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
                            cwd=repo_path,
                        )

                if "pip_name" in config:
                    self.install_pip_packages([config["pip_name"]])

            elif config["type"] == "binary":
                if self.system in config.get("platforms", [self.system]):
                    if "url" in config:
                        self.download_binary(config["url"], tool_id)

        # Setup additional components
        self.log("Setting up additional forensics components...")
        self.setup_volatility_profiles()
        self.setup_yara_rules()
        self.install_mobile_forensics_deps()
        self.create_tool_wrappers()

        # Validate installation
        self.log("Validating installation...")
        results = self.validate_installation()

        success_count = sum(1 for v in results.values() if v)
        total_count = len(results)

        self.log(
            f"Installation complete: {success_count}/{total_count} tools successfully installed",
            "SUCCESS",
        )

        # Print results
        for tool, success in results.items():
            status = "✓" if success else "✗"
            color = "SUCCESS" if success else "ERROR"
            self.log(f"{status} {tool}", color)

        if success_count < total_count:
            self.log("Some tools failed to install. Check logs above for details.", "WARNING")

        self.log(f"Add {self.tools_dir / 'bin'} to your PATH to use forensics tools", "INFO")


def main():
    installer = ForensicsInstaller()
    installer.install_all()


if __name__ == "__main__":
    main()
