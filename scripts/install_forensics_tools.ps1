# NovaOS Advanced Forensics Installation Script for Windows
# Installs forensics tools, mobile analysis frameworks, and OSINT tools

param(
    [switch]$InstallAll,
    [switch]$ValidateOnly
)

$ErrorActionPreference = "Continue"
$ToolsDir = "$env:USERPROFILE\.novaos\forensics-tools"

function Write-LogMessage {
    param([string]$Message, [string]$Level = "INFO")
    
    $colors = @{
        "INFO"    = "Cyan"
        "SUCCESS" = "Green"
        "WARNING" = "Yellow"
        "ERROR"   = "Red"
    }
    
    $color = $colors[$Level]
    Write-Host "$Level: $Message" -ForegroundColor $color
}

function Install-PythonPackages {
    param([string[]]$Packages)
    
    Write-LogMessage "Installing Python packages: $($Packages -join ', ')"
    
    foreach ($package in $Packages) {
        try {
            & python -m pip install $package --upgrade
            Write-LogMessage "Successfully installed $package" "SUCCESS"
        }
        catch {
            Write-LogMessage "Failed to install $package" "ERROR"
        }
    }
}

function Install-ChocoPackages {
    param([string[]]$Packages)
    
    # Check if Chocolatey is installed
    if (-not (Get-Command choco -ErrorAction SilentlyContinue)) {
        Write-LogMessage "Installing Chocolatey package manager..."
        Set-ExecutionPolicy Bypass -Scope Process -Force
        [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
        iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
    }
    
    Write-LogMessage "Installing system packages: $($Packages -join ', ')"
    
    foreach ($package in $Packages) {
        try {
            & choco install $package -y
            Write-LogMessage "Successfully installed $package" "SUCCESS"
        }
        catch {
            Write-LogMessage "Failed to install $package" "ERROR"
        }
    }
}

function Install-GitRepo {
    param([string]$Url, [string]$Name)
    
    $repoPath = Join-Path $ToolsDir $Name
    
    if (Test-Path $repoPath) {
        Write-LogMessage "Repository $Name already exists, updating..."
        Set-Location $repoPath
        & git pull
    }
    else {
        Write-LogMessage "Cloning $Name from $Url"
        & git clone $Url $repoPath
    }
    
    return $repoPath
}

function Download-File {
    param([string]$Url, [string]$OutputPath)
    
    try {
        Write-LogMessage "Downloading from $Url"
        Invoke-WebRequest -Uri $Url -OutFile $OutputPath
        Write-LogMessage "Successfully downloaded to $OutputPath" "SUCCESS"
        return $true
    }
    catch {
        Write-LogMessage "Failed to download from $Url" "ERROR"
        return $false
    }
}

function Setup-ForensicsEnvironment {
    # Create tools directory
    if (-not (Test-Path $ToolsDir)) {
        New-Item -ItemType Directory -Path $ToolsDir -Force | Out-Null
    }
    
    Write-LogMessage "Tools directory: $ToolsDir"
    
    # Install core Python packages
    $pythonPackages = @(
        "volatility3",
        "yara-python", 
        "pefile",
        "python-magic-bin",
        "pycryptodome",
        "frida-tools",
        "adb-shell",
        "pyidevice",
        "requests",
        "beautifulsoup4",
        "python-whois",
        "shodan",
        "scapy",
        "impacket",
        "capstone",
        "unicorn",
        "keystone-engine"
    )
    
    Install-PythonPackages $pythonPackages
    
    # Install system packages via Chocolatey
    $chocoPackages = @(
        "git",
        "python3",
        "adb",
        "wireshark",
        "nmap",
        "7zip"
    )
    
    Install-ChocoPackages $chocoPackages
    
    # Clone OSINT repositories
    Write-LogMessage "Setting up OSINT tools..."
    
    Install-GitRepo "https://github.com/sherlock-project/sherlock.git" "sherlock"
    Install-GitRepo "https://github.com/laramies/theHarvester.git" "theharvester" 
    Install-GitRepo "https://github.com/Yara-Rules/rules.git" "yara-rules"
    Install-GitRepo "https://github.com/Neo23x0/signature-base.git" "signature-base"
    
    # Download additional tools
    $binDir = Join-Path $ToolsDir "bin"
    if (-not (Test-Path $binDir)) {
        New-Item -ItemType Directory -Path $binDir -Force | Out-Null
    }
    
    # Download Volatility standalone
    $volUrl = "https://downloads.volatilityfoundation.org/releases/2.6/volatility_2.6_win64_standalone.zip"
    $volZip = Join-Path $binDir "volatility.zip"
    
    if (Download-File $volUrl $volZip) {
        Expand-Archive -Path $volZip -DestinationPath (Join-Path $binDir "volatility") -Force
    }
}

function Setup-MobileForensics {
    Write-LogMessage "Setting up mobile forensics tools..."
    
    # Install mobile-specific packages
    $mobilePackages = @(
        "pymobiledevice3",
        "frida",
        "objection"
    )
    
    Install-PythonPackages $mobilePackages
    
    # Download additional mobile tools
    $mobileDir = Join-Path $ToolsDir "mobile"
    if (-not (Test-Path $mobileDir)) {
        New-Item -ItemType Directory -Path $mobileDir -Force | Out-Null
    }
    
    # libimobiledevice for Windows
    $libUrl = "https://github.com/libimobiledevice-win32/imobiledevice-net/releases/download/v1.3.17/libimobiledevice.1.3.17.nupkg"
    $libPath = Join-Path $mobileDir "libimobiledevice.zip"
    
    if (Download-File $libUrl $libPath) {
        Expand-Archive -Path $libPath -DestinationPath (Join-Path $mobileDir "libimobiledevice") -Force
    }
}

function Create-LauncherScript {
    $launcherPath = Join-Path $ToolsDir "novaos-forensics.bat"
    
    $launcherContent = @"
@echo off
REM NovaOS Forensics Tool Launcher for Windows
python "$ToolsDir\forensics_launcher.py" %*
"@
    
    Set-Content -Path $launcherPath -Value $launcherContent
    
    # Create Python launcher
    $pythonLauncher = Join-Path $ToolsDir "forensics_launcher.py"
    
    $pythonContent = @"
#!/usr/bin/env python3
"""NovaOS Forensics Tool Launcher for Windows"""
import sys
import os
sys.path.insert(0, r"$ToolsDir")

# Add tools to path
os.environ['PATH'] = r"$ToolsDir\bin;" + os.environ.get('PATH', '')

from pathlib import Path
import subprocess

def main():
    if len(sys.argv) < 2:
        print("Usage: novaos-forensics <tool> [args...]")
        print("Available tools:")
        print("  volatility - Memory analysis")
        print("  yara - Malware detection")
        print("  sherlock - Username OSINT")
        print("  theharvester - Email/domain OSINT")
        print("  frida - Dynamic analysis")
        print("  mobile-analysis - Mobile device analysis")
        return
    
    tool = sys.argv[1].lower()
    args = sys.argv[2:]
    
    tools_map = {
        'volatility': r'$ToolsDir\bin\volatility\volatility_2.6_win64_standalone.exe',
        'sherlock': ['python', r'$ToolsDir\sherlock\sherlock.py'],
        'theharvester': ['python', r'$ToolsDir\theharvester\theHarvester.py'],
        'yara': ['yara'],
        'frida': ['frida']
    }
    
    if tool in tools_map:
        cmd = tools_map[tool]
        if isinstance(cmd, str):
            subprocess.run([cmd] + args)
        else:
            subprocess.run(cmd + args)
    else:
        print(f"Unknown tool: {tool}")

if __name__ == "__main__":
    main()
"@
    
    Set-Content -Path $pythonLauncher -Value $pythonContent
    
    Write-LogMessage "Created forensics launcher: $launcherPath" "SUCCESS"
}

function Validate-Installation {
    Write-LogMessage "Validating installation..."
    
    $results = @{}
    
    # Check Python packages
    $pythonTools = @("volatility3", "yara", "frida", "scapy")
    foreach ($tool in $pythonTools) {
        try {
            & python -c "import $tool" 2>$null
            $results[$tool] = $true
        }
        catch {
            $results[$tool] = $false
        }
    }
    
    # Check system tools
    $systemTools = @("git", "python", "adb")
    foreach ($tool in $systemTools) {
        $results[$tool] = [bool](Get-Command $tool -ErrorAction SilentlyContinue)
    }
    
    # Check directories
    $directories = @("sherlock", "theharvester", "yara-rules")
    foreach ($dir in $directories) {
        $results[$dir] = Test-Path (Join-Path $ToolsDir $dir)
    }
    
    # Print results
    $successCount = ($results.Values | Where-Object { $_ -eq $true }).Count
    $totalCount = $results.Count
    
    Write-LogMessage "Validation Results: $successCount/$totalCount tools available" "SUCCESS"
    
    foreach ($tool in $results.Keys) {
        $status = if ($results[$tool]) { "✓" } else { "✗" }
        $level = if ($results[$tool]) { "SUCCESS" } else { "ERROR" }
        Write-LogMessage "$status $tool" $level
    }
    
    if ($successCount -lt $totalCount) {
        Write-LogMessage "Some tools are missing. Re-run installation or install manually." "WARNING"
    }
    
    Write-LogMessage "Add $ToolsDir to your PATH to use forensics tools" "INFO"
}

# Main execution
Write-LogMessage "NovaOS Advanced Forensics Installation for Windows" "SUCCESS"

if ($ValidateOnly) {
    Validate-Installation
    exit
}

if ($InstallAll -or (-not $ValidateOnly)) {
    Setup-ForensicsEnvironment
    Setup-MobileForensics
    Create-LauncherScript
    Validate-Installation
    
    Write-LogMessage "Installation complete! Restart your terminal to use new tools." "SUCCESS"
}