; NSIS Installer Script for TerraFusionBuild RCN Valuation Engine
; This script creates a Windows installer that can be deployed via SCCM or Group Policy

; Basic definitions
!define APPNAME "TerraFusionBuild RCN Valuation Engine"
!define COMPANYNAME "TerraFusionBuild"
!define DESCRIPTION "Replacement Cost New (RCN) Valuation Engine for Property Assessment"
!define VERSIONMAJOR 1
!define VERSIONMINOR 0
!define VERSIONBUILD 0

; Include modern UI
!include "MUI2.nsh"

; General configuration
Name "${APPNAME}"
OutFile "TerraFusionBuild_RCN_Engine_Setup.exe"
InstallDir "$PROGRAMFILES\${COMPANYNAME}\RCN Engine"
InstallDirRegKey HKLM "Software\${COMPANYNAME}\${APPNAME}" "Install_Dir"
RequestExecutionLevel admin

; Interface settings
!define MUI_ABORTWARNING
!define MUI_ICON "build\dist\rcn_server\_internal\favicon.ico"
!define MUI_UNICON "build\dist\rcn_server\_internal\favicon.ico"
!define MUI_WELCOMEFINISHPAGE_BITMAP "build\dist\rcn_server\_internal\banner.bmp"
!define MUI_HEADERIMAGE
!define MUI_HEADERIMAGE_BITMAP "build\dist\rcn_server\_internal\header.bmp"
!define MUI_FINISHPAGE_NOAUTOCLOSE
!define MUI_FINISHPAGE_RUN "$INSTDIR\rcn_server.exe"
!define MUI_FINISHPAGE_RUN_TEXT "Start RCN Valuation Engine"

; Pages
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; Languages
!insertmacro MUI_LANGUAGE "English"

; Installer sections
Section "Install"
    SetOutPath $INSTDIR
    
    ; Include all files from build directory
    File /r "build\dist\rcn_server\*.*"
    
    ; Include sample data
    CreateDirectory "$INSTDIR\data"
    File "data\*.*"
    
    ; Include configuration files
    File ".env.example"
    
    ; Create .env file if it doesn't exist
    IfFileExists "$INSTDIR\.env" EnvExists
    CopyFiles "$INSTDIR\.env.example" "$INSTDIR\.env"
    EnvExists:
    
    ; Create start menu shortcuts
    CreateDirectory "$SMPROGRAMS\${COMPANYNAME}"
    CreateShortcut "$SMPROGRAMS\${COMPANYNAME}\${APPNAME}.lnk" "$INSTDIR\rcn_server.exe"
    CreateShortcut "$SMPROGRAMS\${COMPANYNAME}\Uninstall ${APPNAME}.lnk" "$INSTDIR\uninstall.exe"
    
    ; Create desktop shortcut
    CreateShortcut "$DESKTOP\${APPNAME}.lnk" "$INSTDIR\rcn_server.exe"
    
    ; Write registry keys for uninstaller
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" \
                     "DisplayName" "${APPNAME}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" \
                     "UninstallString" "$\"$INSTDIR\uninstall.exe$\""
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" \
                     "QuietUninstallString" "$\"$INSTDIR\uninstall.exe$\" /S"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" \
                     "InstallLocation" "$\"$INSTDIR$\""
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" \
                     "DisplayIcon" "$\"$INSTDIR\rcn_server.exe$\""
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" \
                     "Publisher" "${COMPANYNAME}"
    WriteRegStr HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}" \
                     "DisplayVersion" "${VERSIONMAJOR}.${VERSIONMINOR}.${VERSIONBUILD}"
    
    ; Create uninstaller
    WriteUninstaller "$INSTDIR\uninstall.exe"
    
    ; Create Windows service
    ExecWait '"$INSTDIR\nssm.exe" install "TerraFusionBuildRCN" "$INSTDIR\rcn_server.exe"'
    ExecWait '"$INSTDIR\nssm.exe" set "TerraFusionBuildRCN" DisplayName "${APPNAME}"'
    ExecWait '"$INSTDIR\nssm.exe" set "TerraFusionBuildRCN" Description "${DESCRIPTION}"'
    ExecWait '"$INSTDIR\nssm.exe" set "TerraFusionBuildRCN" Start SERVICE_AUTO_START'
    ExecWait '"$INSTDIR\nssm.exe" set "TerraFusionBuildRCN" AppDirectory "$INSTDIR"'
    ExecWait '"$INSTDIR\nssm.exe" set "TerraFusionBuildRCN" AppStdout "$INSTDIR\logs\stdout.log"'
    ExecWait '"$INSTDIR\nssm.exe" set "TerraFusionBuildRCN" AppStderr "$INSTDIR\logs\stderr.log"'
    ExecWait 'net start "TerraFusionBuildRCN"'
SectionEnd

; Uninstaller section
Section "Uninstall"
    ; Stop and remove Windows service
    ExecWait 'net stop "TerraFusionBuildRCN"'
    ExecWait '"$INSTDIR\nssm.exe" remove "TerraFusionBuildRCN" confirm'
    
    ; Remove installed files
    RMDir /r "$INSTDIR"
    
    ; Remove start menu shortcuts
    Delete "$SMPROGRAMS\${COMPANYNAME}\${APPNAME}.lnk"
    Delete "$SMPROGRAMS\${COMPANYNAME}\Uninstall ${APPNAME}.lnk"
    RMDir "$SMPROGRAMS\${COMPANYNAME}"
    
    ; Remove desktop shortcut
    Delete "$DESKTOP\${APPNAME}.lnk"
    
    ; Remove registry keys
    DeleteRegKey HKLM "Software\Microsoft\Windows\CurrentVersion\Uninstall\${COMPANYNAME} ${APPNAME}"
    DeleteRegKey HKLM "Software\${COMPANYNAME}\${APPNAME}"
SectionEnd